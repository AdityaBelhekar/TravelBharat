import type { Metadata } from "next";
import { Logo } from "@/components/Logo.tsx";
import { LoginForm } from "./LoginForm.tsx";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default function LoginPage() {
  return (
    <main id="main" className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-sm border border-border bg-surface p-8">
        <p className="flex items-center gap-3">
          <Logo label="TravelBharat home" />
          <span className="type-name text-xl">Admin</span>
        </p>
        <h1 className="mb-6 mt-1 text-sm text-muted">Sign in to edit and review places.</h1>
        <LoginForm />
      </div>
    </main>
  );
}
