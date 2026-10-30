import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth.ts";
import { connectDB } from "@/lib/db.ts";
import { State } from "@/lib/models.ts";
import { saveState } from "../../../actions.ts";
import { Field, input, Notice, one, primary } from "../../../ui.tsx";

export const metadata: Metadata = { title: "Edit state" };

export default async function EditState({ params, searchParams }: PageProps<"/admin/states/[slug]">) {
  await requireUser("admin");
  const { slug } = await params;
  const sp = await searchParams;
  await connectDB();
  const state = await State.findOne({ slug }).lean();
  if (!state) notFound();

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <h1 className="type-title text-4xl">{state.name}</h1>
      <Notice success={one(sp.saved) ? "Saved. The public state page is updated." : undefined} error={one(sp.error)} />
      <form action={saveState.bind(null, slug)} className="flex flex-col gap-4">
        <Field id="state-capital" label="Capital">
          <input id="state-capital" name="capital" defaultValue={state.capital ?? ""} required className={input} />
        </Field>
        <Field
          id="state-languages"
          label={
            <>
              Languages <span className="text-xs font-normal text-muted">(comma-separated)</span>
            </>
          }
        >
          <input
            id="state-languages"
            name="languages"
            defaultValue={state.languages.join(", ")}
            required
            className={input}
          />
        </Field>
        <Field
          id="state-famousFor"
          label={
            <>
              Famous for <span className="text-xs font-normal text-muted">(comma-separated)</span>
            </>
          }
        >
          <input
            id="state-famousFor"
            name="famousFor"
            defaultValue={state.famousFor.join(", ")}
            required
            className={input}
          />
        </Field>
        <Field id="state-bestTime" label="Best time to visit">
          <input
            id="state-bestTime"
            name="bestTime"
            defaultValue={state.bestTime ?? ""}
            required
            maxLength={200}
            className={input}
          />
        </Field>
        <Field id="state-overview" label="Overview">
          <textarea
            id="state-overview"
            name="overview"
            defaultValue={state.overview ?? ""}
            required
            maxLength={2000}
            rows={8}
            className={input}
          />
        </Field>
        <div>
          <button type="submit" className={primary}>
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
