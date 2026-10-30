"use server";
// Every admin change goes through these actions. Each one checks the user and role itself;
// never rely on the page having checked.
import { createHash } from "node:crypto";
import { isValidObjectId } from "mongoose";
import { updateTag } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth.ts";
import { connectDB } from "@/lib/db.ts";
import { Category, City, LoginAttempt, Place, State, User } from "@/lib/models.ts";
import { canEditPlace, canPublish } from "@/lib/permissions.ts";
import { placeFromForm, slugify } from "@/lib/place-form.ts";
import { createSessionToken, hashPassword, SESSION_COOKIE, SESSION_TTL_SECONDS, verifyPassword } from "@/lib/session.ts";
import { categorySchema, citySchema, placeSchema, publishablePlaceSchema, ROLES, type Status } from "@/lib/validators.ts";

export type FormState = { error?: string; issues?: string[] } | null;

const isDuplicateKey = (e: unknown) => (e as { code?: number }).code === 11000;
const field = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const list = (form: FormData, key: string) =>
  field(form, key)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
// Small forms report problems by sending the user back with ?error=… in the URL.
const back = (path: string, error: string): never =>
  redirect(`${path}${path.includes("?") ? "&" : "?"}error=${encodeURIComponent(error)}`);

// ---- Sign in / out ----

const MAX_ATTEMPTS = 5; // per IP and email, per 15 minutes (LoginAttempt documents expire after that)

export async function login(_prev: FormState, form: FormData): Promise<FormState> {
  const email = field(form, "email").toLowerCase();
  const password = String(form.get("password") ?? "");
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const key = `${ip}|${email}`;

  await connectDB();
  if ((await LoginAttempt.countDocuments({ key })) >= MAX_ATTEMPTS) {
    return { error: "Too many attempts. Try again in 15 minutes." };
  }
  const user = await User.findOne({ email }).lean();
  if (!user?.active || !(await verifyPassword(password, user.passwordHash))) {
    await LoginAttempt.create({ key });
    return { error: "Email or password is incorrect." };
  }
  await LoginAttempt.deleteMany({ key });
  (await cookies()).set(SESSION_COOKIE, createSessionToken(String(user._id)), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/admin/login");
}

// ---- Places ----

async function resolveRefs(state: string, city: string, categories: string[]) {
  const stateDoc = await State.findOne({ slug: state }, "_id").lean();
  if (!stateDoc) return { error: `Unknown state "${state}".` };
  const cityDoc = await City.findOne({ state: stateDoc._id, slug: city }, "_id").lean();
  if (!cityDoc) return { error: `"${city}" is not a city in that state. Add it under Cities first.` };
  const categoryDocs = await Category.find({ slug: { $in: categories } }, "_id").lean();
  if (categoryDocs.length !== categories.length) return { error: "One of the categories no longer exists." };
  return { state: stateDoc._id, city: cityDoc._id, categories: categoryDocs.map((c) => c._id) };
}

// intent: "save" keeps the current status (new places start as drafts), "review" submits, "publish" approves.
export async function savePlace(id: string | null, _prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const intent = field(form, "intent");
  await connectDB();

  const existing = id && isValidObjectId(id) ? await Place.findById(id) : null;
  if (id && !existing) return { error: "This place no longer exists." };
  const current = (existing?.status ?? "draft") as Status;
  if (!canEditPlace(user.role, current)) return { error: "Only an admin can change a published place." };
  if (intent === "publish" && !canPublish(user.role)) return { error: "Only an admin can publish." };

  const status: Status = intent === "publish" ? "published" : intent === "review" ? "review" : current;
  const schema = status === "published" ? publishablePlaceSchema : placeSchema;
  const parsed = schema.safeParse(placeFromForm(form));
  if (!parsed.success) {
    return { error: "Please fix these fields:", issues: parsed.error.issues.map((i) => `${i.path.join(" › ")}: ${i.message}`) };
  }
  const { location, ...data } = parsed.data;
  const refs = await resolveRefs(data.state, data.city, data.categories);
  if ("error" in refs) return { error: refs.error };

  const doc = {
    ...data,
    ...refs,
    location: { type: "Point" as const, coordinates: [location.lng, location.lat] },
    address: location.address,
    status,
    updatedBy: user.id,
    ...(status === "published" && current !== "published" && { verifiedBy: user.id, verifiedAt: new Date(), reviewNote: "" }),
  };
  let saved;
  try {
    saved = existing ? await existing.set(doc).save() : await Place.create({ ...doc, createdBy: user.id });
  } catch (e) {
    if (isDuplicateKey(e)) return { error: `Another place already uses the address /places/${data.slug}. Change the slug.` };
    throw e;
  }
  if (status === "published" || current === "published") updateTag("content");
  redirect(`/admin/places/${saved._id}?saved=${status}`);
}

export async function reviewPlace(id: string, form: FormData) {
  const user = await requireUser("admin");
  await connectDB();
  const place = isValidObjectId(id) ? await Place.findById(id) : null;
  if (!place) return back("/admin/places", "That place no longer exists.");
  const path = `/admin/places/${id}`;

  if (field(form, "decision") === "approve") {
    if (!place.images.length || !place.sources.length) return back(path, "Add at least one photo and one source before publishing.");
    place.set({ status: "published", verifiedBy: user.id, verifiedAt: new Date(), reviewNote: "", updatedBy: user.id });
    await place.save();
    updateTag("content");
    redirect(`${path}?saved=published`);
  }
  const note = field(form, "note");
  if (!note) return back(path, "Say what needs changing so the editor knows.");
  place.set({ status: "draft", reviewNote: note.slice(0, 1000), updatedBy: user.id });
  await place.save();
  redirect(`${path}?saved=returned`);
}

export async function unpublishPlace(id: string) {
  const user = await requireUser("admin");
  if (!isValidObjectId(id)) return back("/admin/places", "That place no longer exists.");
  await connectDB();
  await Place.updateOne({ _id: id, status: "published" }, { status: "draft", updatedBy: user.id });
  updateTag("content");
  redirect(`/admin/places/${id}?saved=unpublished`);
}

export async function deletePlace(id: string) {
  await requireUser("admin");
  if (!isValidObjectId(id)) return back("/admin/places", "That place no longer exists.");
  await connectDB();
  const place = await Place.findByIdAndDelete(id).lean();
  if (place?.status === "published") updateTag("content");
  redirect("/admin/places?deleted=1");
}

// Signs a direct browser-to-Cloudinary upload, so the API secret never reaches the browser.
export async function signUpload() {
  await requireUser();
  const { CLOUDINARY_CLOUD_NAME: cloudName, CLOUDINARY_API_KEY: apiKey, CLOUDINARY_API_SECRET: apiSecret } = process.env;
  if (!cloudName || !apiKey || !apiSecret) return null;
  const folder = "travelbharat";
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHash("sha1").update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`).digest("hex");
  return { cloudName, apiKey, folder, timestamp, signature };
}

// ---- States, cities, categories ----

const stateEditSchema = z.strictObject({
  capital: z.string().trim().min(1).max(100),
  languages: z.array(z.string().max(50)).min(1),
  overview: z.string().trim().min(1).max(2000),
  famousFor: z.array(z.string().max(60)).min(1),
  bestTime: z.string().trim().min(1).max(200),
});

export async function saveState(slug: string, form: FormData) {
  await requireUser("admin");
  const path = `/admin/states/${slug}`;
  const parsed = stateEditSchema.safeParse({
    capital: field(form, "capital"),
    languages: list(form, "languages"),
    overview: field(form, "overview"),
    famousFor: list(form, "famousFor"),
    bestTime: field(form, "bestTime"),
  });
  if (!parsed.success) return back(path, "Every field is required.");
  await connectDB();
  await State.updateOne({ slug }, parsed.data);
  updateTag("content");
  redirect(`${path}?saved=1`);
}

// Editors can add and edit cities too (they need them for new places); only admins delete.
export async function saveCity(id: string | null, form: FormData) {
  await requireUser();
  if (id && !isValidObjectId(id)) return back("/admin/cities", "That city no longer exists.");
  const state = field(form, "state");
  const path = id ? `/admin/cities/${id}` : `/admin/cities?state=${encodeURIComponent(state)}`;
  const parsed = citySchema.safeParse({
    name: field(form, "name"),
    slug: field(form, "slug") || slugify(field(form, "name")),
    state,
    overview: field(form, "overview"),
    history: field(form, "history") || undefined,
    isHub: form.get("isHub") === "on",
    location: { lat: Number(field(form, "lat")), lng: Number(field(form, "lng")) },
  });
  if (!parsed.success) return back(path, parsed.error.issues.map((i) => `${i.path.join(" › ")}: ${i.message}`).join("; "));
  await connectDB();
  const stateDoc = await State.findOne({ slug: state }, "_id").lean();
  if (!stateDoc) return back(path, "Unknown state.");
  const { location, ...data } = parsed.data;
  const doc = { ...data, state: stateDoc._id, location: { type: "Point" as const, coordinates: [location.lng, location.lat] } };
  try {
    if (id) await City.updateOne({ _id: id }, doc);
    else await City.create(doc);
  } catch (e) {
    if (isDuplicateKey(e)) return back(path, `That state already has a city with the slug "${data.slug}".`);
    throw e;
  }
  updateTag("content");
  redirect(`/admin/cities?state=${state}&saved=1`);
}

export async function deleteCity(id: string) {
  await requireUser("admin");
  if (!isValidObjectId(id)) return back("/admin/cities", "That city no longer exists.");
  await connectDB();
  if (await Place.exists({ city: id })) return back(`/admin/cities/${id}`, "Move or delete this city's places first.");
  await City.deleteOne({ _id: id });
  updateTag("content");
  redirect("/admin/cities?deleted=1");
}

export async function saveCategory(id: string | null, form: FormData) {
  await requireUser("admin");
  const parsed = categorySchema.safeParse({
    name: field(form, "name"),
    slug: field(form, "slug"),
    description: field(form, "description") || undefined,
  });
  if (!parsed.success) return back("/admin/categories", "Name and a lowercase-hyphenated slug are required.");
  await connectDB();
  try {
    if (id) await Category.updateOne({ _id: id }, parsed.data);
    else await Category.create(parsed.data);
  } catch (e) {
    if (isDuplicateKey(e)) return back("/admin/categories", "That slug is already used.");
    throw e;
  }
  updateTag("content");
  redirect("/admin/categories?saved=1");
}

export async function deleteCategory(id: string) {
  await requireUser("admin");
  if (!isValidObjectId(id)) return back("/admin/categories", "That category no longer exists.");
  await connectDB();
  if (await Place.exists({ categories: id })) return back("/admin/categories", "Places still use this category.");
  await Category.deleteOne({ _id: id });
  updateTag("content");
  redirect("/admin/categories?saved=1");
}

// ---- Users ----

export async function createUser(form: FormData) {
  await requireUser("admin");
  const parsed = z
    .strictObject({
      name: z.string().trim().min(1).max(80),
      email: z.email(),
      role: z.enum(ROLES),
      password: z.string().min(12, "Password must be at least 12 characters"),
    })
    .safeParse({ name: field(form, "name"), email: field(form, "email").toLowerCase(), role: field(form, "role"), password: String(form.get("password") ?? "") });
  if (!parsed.success) return back("/admin/users", parsed.error.issues.map((i) => i.message).join("; "));
  const { password, ...data } = parsed.data;
  await connectDB();
  try {
    await User.create({ ...data, passwordHash: await hashPassword(password) });
  } catch (e) {
    if (isDuplicateKey(e)) return back("/admin/users", "A user with that email already exists.");
    throw e;
  }
  redirect("/admin/users?saved=1");
}

export async function updateUser(id: string, form: FormData) {
  const me = await requireUser("admin");
  if (!isValidObjectId(id)) return back("/admin/users", "That user no longer exists.");
  const role = field(form, "role");
  const active = form.get("active") === "on";
  if (!ROLES.includes(role as (typeof ROLES)[number])) return back("/admin/users", "Unknown role.");
  if (id === me.id && (role !== "admin" || !active)) return back("/admin/users", "You can't demote or deactivate yourself.");
  const password = String(form.get("password") ?? "");
  if (password && password.length < 12) return back("/admin/users", "New passwords must be at least 12 characters.");
  await connectDB();
  await User.updateOne({ _id: id }, { role, active, ...(password && { passwordHash: await hashPassword(password) }) });
  redirect("/admin/users?saved=1");
}
