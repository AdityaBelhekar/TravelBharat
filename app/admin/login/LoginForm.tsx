"use client";

import { useActionState } from "react";
import { login } from "../actions.ts";
import { Field, input, primary } from "../ui.tsx";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="flex flex-col gap-4">
      {state?.error && (
        <p role="alert" className="rounded bg-red-700/10 px-3 py-2 text-sm text-red-800">
          {state.error}
        </p>
      )}
      <Field id="login-email" label="Email">
        <input id="login-email" name="email" type="email" autoComplete="username" required className={input} />
      </Field>
      <Field id="login-password" label="Password">
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={input}
        />
      </Field>
      <button type="submit" disabled={pending} className={primary}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
