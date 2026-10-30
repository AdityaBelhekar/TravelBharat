import type { Metadata } from "next";
import { isValidObjectId } from "mongoose";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth.ts";
import { connectDB } from "@/lib/db.ts";
import { Place } from "@/lib/models.ts";
import { completeness } from "@/lib/place-form.ts";
import type { Status } from "@/lib/validators.ts";
import { deletePlace, reviewPlace, savePlace, unpublishPlace } from "../../../actions.ts";
import { ConfirmButton } from "../../../ConfirmButton.tsx";
import { card, danger, input, Notice, one, primary, secondary, StatusBadge } from "../../../ui.tsx";
import { formOptions, toFormValues } from "../form-data.ts";
import { PlaceForm } from "../PlaceForm.tsx";

const SAVED: Record<string, string> = {
  draft: "Draft saved.",
  review: "Saved and sent for review.",
  published: "Published. It's live on the site now.",
  returned: "Sent back to the editor with your note.",
  unpublished: "Unpublished. It's no longer on the site.",
};

type Populated = {
  state: { slug: string; name: string };
  city: { slug: string };
  categories: { slug: string }[];
  createdBy?: { name: string };
  updatedBy?: { name: string };
  verifiedBy?: { name: string };
};

export const metadata: Metadata = { title: "Edit place" };

export default async function EditPlace({ params, searchParams }: PageProps<"/admin/places/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  const sp = await searchParams;
  if (!isValidObjectId(id)) notFound();
  await connectDB();

  const place = await Place.findById(id)
    .populate<Populated>([
      { path: "state", select: "slug name" },
      { path: "city", select: "slug" },
      { path: "categories", select: "slug" },
      { path: "createdBy", select: "name" },
      { path: "updatedBy", select: "name" },
      { path: "verifiedBy", select: "name" },
    ])
    .lean();
  if (!place) notFound();
  const status = place.status as Status;
  const { score, missing } = completeness(place);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="type-title text-4xl">{place.name}</h1>
        <StatusBadge status={status} />
        {status === "published" && (
          <Link href={`/places/${place.slug}`} className="text-sm font-medium underline underline-offset-4">
            View on site →
          </Link>
        )}
      </div>
      <Notice success={SAVED[one(sp.saved) ?? ""]} error={one(sp.error)} />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className={card}>
          <p className="text-sm">
            <strong>{score}% complete.</strong> {missing.length ? `Missing: ${missing.join(", ")}.` : "Nothing missing."}
          </p>
          <p className="mt-2 text-xs text-muted">
            {place.createdBy && `Created by ${place.createdBy.name}. `}
            {place.updatedBy && `Last changed by ${place.updatedBy.name} on ${place.updatedAt.toLocaleDateString("en-IN")}. `}
            {place.verifiedBy && place.verifiedAt && `Approved by ${place.verifiedBy.name} on ${place.verifiedAt.toLocaleDateString("en-IN")}.`}
          </p>
          {place.reviewNote && status !== "published" && (
            <p className="mt-3 rounded bg-amber-500/15 px-3 py-2 text-sm">
              <strong>Reviewer&apos;s note:</strong> {place.reviewNote}
            </p>
          )}
        </div>

        {user.role === "admin" && (
          <div className={`${card} flex flex-col gap-3`}>
            {status === "review" && (
              <form action={reviewPlace.bind(null, id)} className="flex flex-col gap-2">
                <p className="text-sm font-medium">Review this place</p>
                <button type="submit" name="decision" value="approve" className={primary}>
                  Approve and publish
                </button>
                <label className="sr-only" htmlFor="note">
                  What needs changing
                </label>
                <textarea id="note" name="note" rows={2} placeholder="What needs changing (required to send back)" className={input} />
                <button type="submit" name="decision" value="reject" className={secondary}>
                  Send back to editor
                </button>
              </form>
            )}
            <div className="flex flex-wrap gap-2">
              {status === "published" && (
                <form action={unpublishPlace.bind(null, id)}>
                  <button type="submit" className={secondary}>
                    Unpublish
                  </button>
                </form>
              )}
              <form action={deletePlace.bind(null, id)}>
                <ConfirmButton message={`Delete "${place.name}" permanently? This can't be undone.`} className={danger}>
                  Delete permanently
                </ConfirmButton>
              </form>
            </div>
          </div>
        )}
      </div>

      <PlaceForm
        key={place.updatedAt.toISOString()}
        initial={toFormValues(place)}
        {...await formOptions()}
        role={user.role}
        status={status}
        action={savePlace.bind(null, id)}
      />
    </div>
  );
}
