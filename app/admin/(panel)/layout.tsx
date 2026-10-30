import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth.ts";
import { Logo } from "@/components/Logo.tsx";
import { logout } from "../actions.ts";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin · TravelBharat" }, robots: { index: false } };

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/places", label: "Places" },
  { href: "/admin/cities", label: "Cities" },
  { href: "/admin/states", label: "States", adminOnly: true },
  { href: "/admin/categories", label: "Categories", adminOnly: true },
  { href: "/admin/users", label: "Users", adminOnly: true },
];

async function Panel({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <>
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <span className="flex items-center gap-3">
            <Logo href="/admin" label="TravelBharat admin dashboard" />
            <span className="type-name text-lg">Admin</span>
          </span>
          <nav aria-label="Admin" className="flex flex-wrap gap-4 text-sm font-medium">
            {links
              .filter((l) => !l.adminOnly || user.role === "admin")
              .map((l) => (
                <Link key={l.href} href={l.href} className="hover:underline hover:underline-offset-4">
                  {l.label}
                </Link>
              ))}
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="text-muted">
              {user.name} · {user.role}
            </span>
            <Link href="/" className="hover:underline hover:underline-offset-4">
              View site
            </Link>
            <form action={logout}>
              <button type="submit" className="font-medium hover:underline hover:underline-offset-4">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {children}
      </main>
    </>
  );
}

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<p className="p-8 text-muted">Loading…</p>}>
      <Panel>{children}</Panel>
    </Suspense>
  );
}
