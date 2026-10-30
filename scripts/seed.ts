// Loads categories, states, cities and places from data/seed into MongoDB.
//
//   npm run seed               insert records that don't exist yet; existing ones are left alone,
//                              so edits made in the admin panel are never overwritten
//   npm run seed -- --update   overwrite existing records with the seed data
//   npm run seed -- --publish  insert new places as published instead of "review" (local dev and CI only)
//   npm run seed:check         validate the seed data only (no database needed)
//
// New places are inserted with status "review" so they go through the moderation queue.
import { readdirSync, readFileSync } from "node:fs";
import mongoose from "mongoose";
import type { z } from "zod";
import { connectDB } from "../lib/db.ts";
import { Category, City, Place, State } from "../lib/models.ts";
import { categorySchema, citySchema, placeSchema, stateSchema } from "../lib/validators.ts";

const seedDir = new URL("../data/seed/", import.meta.url);
const readJson = (path: string) => JSON.parse(readFileSync(new URL(path, seedDir), "utf8"));
const errors: string[] = [];

function parseAll<T extends z.ZodType>(schema: T, items: unknown[], file: string, extra = {}): z.infer<T>[] {
  return items.flatMap((item, i) => {
    const label = `${file} › ${(item as { slug?: string }).slug ?? `item ${i + 1}`}`;
    const result = schema.safeParse({ ...(item as object), ...extra });
    if (result.success) return [result.data];
    for (const issue of result.error.issues) errors.push(`${label}: ${issue.path.join(".") || "record"} – ${issue.message}`);
    return [];
  });
}

function checkUnique(keys: string[], file: string) {
  const seen = new Set<string>();
  for (const key of keys) {
    if (seen.has(key)) errors.push(`${file}: duplicate slug "${key}"`);
    seen.add(key);
  }
}

// ---- Load and validate ----

const categories = parseAll(categorySchema, readJson("categories.json"), "categories.json");
const states = parseAll(stateSchema, readJson("states.json"), "states.json");
const stateSlugs = new Set(states.map((s) => s.slug));
const cities: z.infer<typeof citySchema>[] = [];
const places: z.infer<typeof placeSchema>[] = [];

for (const file of readdirSync(new URL("places/", seedDir))) {
  const state = file.replace(/\.json$/, "");
  const label = `places/${file}`;
  if (!stateSlugs.has(state)) errors.push(`${label}: file name must match a state slug in states.json`);
  const data = readJson(label);
  cities.push(...parseAll(citySchema, data.cities ?? [], label, { state }));
  places.push(...parseAll(placeSchema, data.places ?? [], label, { state }));
}

checkUnique(categories.map((c) => c.slug), "categories.json");
checkUnique(states.map((s) => s.slug), "states.json");
checkUnique(cities.map((c) => `${c.state}/${c.slug}`), "cities");
checkUnique(places.map((p) => p.slug), "places");

const stateCount = states.filter((s) => s.type === "state").length;
if (stateCount !== 28 || states.length - stateCount !== 8) {
  errors.push(`states.json: expected 28 states and 8 UTs, found ${stateCount} and ${states.length - stateCount}`);
}

const categorySlugs = new Set(categories.map((c) => c.slug));
const cityKeys = new Set(cities.map((c) => `${c.state}/${c.slug}`));
for (const p of places) {
  const label = `places/${p.state}.json › ${p.slug}`;
  if (!cityKeys.has(`${p.state}/${p.city}`)) errors.push(`${label}: city "${p.city}" is not listed in this file's cities`);
  for (const c of p.categories) if (!categorySlugs.has(c)) errors.push(`${label}: unknown category "${c}"`);
}

if (errors.length) {
  console.error(`Seed data has ${errors.length} problem(s):\n${errors.map((e) => `  • ${e}`).join("\n")}`);
  process.exit(1);
}
console.log(
  `Seed data OK: ${categories.length} categories, ${states.length} states/UTs, ${cities.length} cities, ${places.length} places.`,
);
if (process.argv.includes("--check")) process.exit(0);

// ---- Write to the database ----

const overwrite = process.argv.includes("--update");
const publish = process.argv.includes("--publish");
const toPoint = ({ lat, lng }: { lat: number; lng: number }) => ({ type: "Point", coordinates: [lng, lat] });

const now = new Date();

function upsert(filter: object, doc: object, onInsertOnly: object = {}) {
  if (overwrite) {
    const update = { $set: doc, ...(Object.keys(onInsertOnly).length && { $setOnInsert: onInsertOnly }) };
    return { updateOne: { filter, update, upsert: true } };
  }
  // Timestamps are set by hand so existing records don't get a new updatedAt (models without timestamps ignore them).
  const update = { $setOnInsert: { ...doc, ...onInsertOnly, createdAt: now, updatedAt: now } };
  return { updateOne: { filter, update, upsert: true, timestamps: false } };
}

function report(label: string, result: { upsertedCount: number; modifiedCount: number }) {
  console.log(`  ${label}: ${result.upsertedCount} added, ${result.modifiedCount} updated`);
}

await connectDB();
await Promise.all([Category, State, City, Place].map((model) => model.syncIndexes()));
console.log(overwrite ? "Seeding (overwriting existing records)…" : "Seeding (new records only)…");

report("categories", await Category.bulkWrite(categories.map((c) => upsert({ slug: c.slug }, c))));
report("states", await State.bulkWrite(states.map((s) => upsert({ slug: s.slug }, s))));

const stateIds = new Map((await State.find({}, "slug")).map((s) => [s.slug, s._id]));
report(
  "cities",
  await City.bulkWrite(
    cities.map(({ state, location, ...city }) => {
      const stateId = stateIds.get(state);
      return upsert({ state: stateId, slug: city.slug }, { ...city, state: stateId, location: toPoint(location) });
    }),
  ),
);

const cityIds = new Map((await City.find({}, "slug state")).map((c) => [`${c.state}/${c.slug}`, c._id]));
const categoryIds = new Map((await Category.find({}, "slug")).map((c) => [c.slug, c._id]));
report(
  "places",
  await Place.bulkWrite(
    places.map(({ state, city, categories, location: { address, ...latLng }, ...place }) => {
      const stateId = stateIds.get(state);
      const doc = {
        ...place,
        state: stateId,
        city: cityIds.get(`${stateId}/${city}`),
        categories: categories.map((slug) => categoryIds.get(slug)),
        location: toPoint(latLng),
        address,
      };
      return upsert({ slug: place.slug }, doc, { status: publish ? "published" : "review" });
    }),
  ),
);

await mongoose.disconnect();
