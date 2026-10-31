// Shared styles and small pieces for the admin panel.
import type { Status } from "@/lib/validators.ts";

export const input =
  "w-full rounded border border-border bg-background px-3 py-2 text-[0.9375rem] focus:border-foreground disabled:opacity-60";
export const button = "inline-flex h-10 items-center justify-center rounded px-4 text-sm font-medium disabled:opacity-60";
export const primary = `${button} bg-brand text-on-brand hover:opacity-90`;
export const secondary = `${button} border border-border bg-surface hover:border-foreground`;
export const danger = `${button} border border-red-700/40 text-red-700 hover:bg-red-700/10`;
export const card = "rounded-sm border border-border bg-background p-5";
export const table = "w-full text-left text-sm [&_td]:border-t [&_td]:border-border [&_td]:px-3 [&_td]:py-2 [&_th]:px-3 [&_th]:py-2 [&_th]:font-medium [&_th]:text-muted";

const STATUS_STYLES: Record<Status, string> = {
  draft: "bg-border text-foreground",
  review: "bg-amber-500/20 text-amber-800",
  published: "bg-green-600/15 text-green-800",
};

export function StatusBadge({ status }: { status: Status }) {
  return <span className={`rounded-sm px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}>{status === "review" ? "in review" : status}</span>;
}

// Success or error message passed back in the URL by a server action.
export function Notice({ error, success }: { error?: string; success?: string }) {
  if (error) return <p role="alert" className="rounded border border-red-700/30 bg-red-700/10 px-4 py-3 text-sm text-red-800">{error}</p>;
  if (success) return <p role="status" className="rounded border border-green-700/30 bg-green-700/10 px-4 py-3 text-sm text-green-800">{success}</p>;
  return null;
}

// A labelled control. The label points at the control by id instead of wrapping it: a wrapped control's
// value is read out as part of its name ("City Pick a state first"). Give the control the same `id`, and
// `aria-describedby={`${id}-help`}` when there's help text.
export function Field({ id, label: text, help, children }: { id: string; label: React.ReactNode; help?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {text}
      </label>
      {children}
      {help && (
        <p id={`${id}-help`} className="text-xs text-muted">
          {help}
        </p>
      )}
    </div>
  );
}

export const one =(v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
