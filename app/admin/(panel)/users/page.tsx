import type { Metadata } from "next";
import { requireUser } from "@/lib/auth.ts";
import { connectDB } from "@/lib/db.ts";
import { User } from "@/lib/models.ts";
import { createUser, updateUser } from "../../actions.ts";
import { card, Field, input, Notice, one, primary, secondary } from "../../ui.tsx";

export const metadata: Metadata = { title: "Users" };

export default async function UsersAdmin({ searchParams }: PageProps<"/admin/users">) {
  const me = await requireUser("admin");
  const sp = await searchParams;
  await connectDB();
  const users = await User.find({}, "name email role active").sort({ name: 1 }).lean();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="type-title text-4xl">Users</h1>
      <p className="text-sm text-muted">
        Editors write and submit places. Admins also publish, delete, and manage states, categories and users.
      </p>
      <Notice success={one(sp.saved) ? "Saved." : undefined} error={one(sp.error)} />

      <ul className="flex flex-col gap-3">
        {users.map((u) => {
          const id = String(u._id);
          return (
            <li key={id} className={card}>
              <form action={updateUser.bind(null, id)} className="flex flex-wrap items-end gap-4">
                <div className="mr-auto">
                  <p className="font-medium">
                    {u.name} {id === me.id && <span className="text-xs text-muted">(you)</span>}
                  </p>
                  <p className="text-sm text-muted">{u.email}</p>
                </div>
                <Field id={`user-${id}-role`} label="Role">
                  <select id={`user-${id}-role`} name="role" defaultValue={u.role} className={`${input} w-auto`}>
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                  </select>
                </Field>
                <Field id={`user-${id}-password`} label="New password">
                  <input
                    id={`user-${id}-password`}
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    minLength={12}
                    placeholder="Leave blank to keep"
                    className={`${input} w-48`}
                  />
                </Field>
                <label className="flex h-10 items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="active"
                    defaultChecked={u.active ?? true}
                    className="size-4 accent-brand"
                  />
                  Active
                </label>
                <button type="submit" className={secondary}>
                  Save
                </button>
              </form>
            </li>
          );
        })}
      </ul>

      <form action={createUser} className={`${card} flex flex-col gap-4`}>
        <h2 className="text-lg font-semibold">Add a user</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="new-user-name" label="Name">
            <input id="new-user-name" name="name" required maxLength={80} className={input} />
          </Field>
          <Field id="new-user-email" label="Email">
            <input id="new-user-email" name="email" type="email" required className={input} />
          </Field>
          <Field id="new-user-role" label="Role">
            <select id="new-user-role" name="role" defaultValue="editor" className={input}>
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </select>
          </Field>
          <Field
            id="new-user-password"
            label="Starting password"
            help={<>At least 12 characters. Share it privately; they can be given a new one here.</>}
          >
            <input
              id="new-user-password"
              aria-describedby="new-user-password-help"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={12}
              className={input}
            />
          </Field>
        </div>
        <div>
          <button type="submit" className={primary}>
            Add user
          </button>
        </div>
      </form>
    </div>
  );
}
