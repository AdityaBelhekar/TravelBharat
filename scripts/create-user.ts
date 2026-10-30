// Creates an admin or editor, or resets an existing user's password and role.
//   npm run create-user -- --email you@example.com --name "Your Name" --role admin
// The password is read from the USER_PASSWORD environment variable, or asked for (hidden) if it isn't set.
import { createInterface } from "node:readline";
import { parseArgs } from "node:util";
import mongoose from "mongoose";
import { connectDB } from "../lib/db.ts";
import { User } from "../lib/models.ts";
import { hashPassword } from "../lib/session.ts";
import { ROLES, type Role } from "../lib/validators.ts";

const { values } = parseArgs({
  options: { email: { type: "string" }, name: { type: "string" }, role: { type: "string", default: "editor" } },
});
const email = values.email?.trim().toLowerCase();
const role = values.role as Role;
if (!email || !/^[^@\s]+@[^@\s]+$/.test(email) || !values.name || !ROLES.includes(role)) {
  console.error('Usage: npm run create-user -- --email you@example.com --name "Your Name" --role admin|editor');
  process.exit(1);
}

function askHidden(question: string) {
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  const write = (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput.bind(rl);
  (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput = (s) => write(s.startsWith(question) ? s : "");
  return new Promise<string>((resolve) =>
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    }),
  );
}

const password = process.env.USER_PASSWORD ?? (await askHidden("Password (12+ characters): "));
if (password.length < 12) {
  console.error("Password must be at least 12 characters.");
  process.exit(1);
}

await connectDB();
const update = { name: values.name, role, active: true, passwordHash: await hashPassword(password) };
const existing = await User.findOneAndUpdate({ email }, { $set: update }, { upsert: true, new: false });
console.log(`${existing ? "Updated" : "Created"} ${role} ${email}`);
await mongoose.disconnect();
