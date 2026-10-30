import { isValidObjectId } from "mongoose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { connectDB } from "./db.ts";
import { User } from "./models.ts";
import { readSessionToken, SESSION_COOKIE } from "./session.ts";
import type { Role } from "./validators.ts";

export type CurrentUser = { id: string; name: string; email: string; role: Role };

// The signed-in user, read fresh from the database so deactivation and role changes apply immediately.
export async function getCurrentUser(): Promise<CurrentUser | null> {
  await connection(); // the session's expiry is checked against the current time, so never prerender this
  const uid = readSessionToken((await cookies()).get(SESSION_COOKIE)?.value);
  if (!uid || !isValidObjectId(uid)) return null;
  await connectDB();
  const user = await User.findById(uid).lean();
  if (!user?.active) return null;
  return { id: String(user._id), name: user.name, email: user.email, role: user.role as Role };
}

// Call at the top of every admin page and server action.
export async function requireUser(role?: "admin"): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (role && user.role !== role) redirect("/admin?denied=1");
  return user;
}
