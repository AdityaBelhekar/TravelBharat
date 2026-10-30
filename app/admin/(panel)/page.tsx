import Link from "next/link";
import { requireUser } from "@/lib/auth.ts";
import { connectDB } from "@/lib/db.ts";
import { Place, State } from "@/lib/models.ts";
import type { Status } from "@/lib/validators.ts";
import { card, Notice, one, StatusBadge, table } from "../ui.tsx";

type Row = { _id: unknown; name: string; status: Status; updatedAt: Date; reviewNote?: string; state: { name: string }; updatedBy?: { name: string } };

function PlaceTable({ rows, empty }: { rows: Row[]; empty: string }) {
  if (!rows.length) return <p className="text-sm text-muted">{empty}</p>;
  return (
    <table className={table}>
      <thead>
        <tr>
          <th>Place</th>
          <th>State</th>
          <th>Status</th>
          <th>Last change</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((p) => (
          <tr key={String(p._id)}>
            <td>
              <Link href={`/admin/places/${p._id}`} className="font-medium hover:underline hover:underline-offset-4">
                {p.name}
              </Link>
              {p.reviewNote && <span className="block text-xs text-muted">Returned: {p.reviewNote}</span>}
            </td>
            <td>{p.state.name}</td>
            <td>
              <StatusBadge status={p.status} />
            </td>
            <td className="text-muted">
              {p.updatedAt.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              {p.updatedBy && ` by ${p.updatedBy.name}`}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default async function Dashboard({ searchParams }: PageProps<"/admin">) {
  const user = await requireUser();
  const { denied } = await searchParams;
  await connectDB();

  const populate = [
    { path: "state", select: "name" },
    { path: "updatedBy", select: "name" },
  ];
  const [statusCounts, queue, returned, recent, noImages, noSources, perState, states] = await Promise.all([
    Place.aggregate<{ _id: Status; count: number }>([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Place.find({ status: "review" }).sort({ updatedAt: 1 }).limit(20).populate(populate).lean<Row[]>(),
    Place.find({ status: "draft", reviewNote: { $nin: [null, ""] } }).sort({ updatedAt: -1 }).limit(10).populate(populate).lean<Row[]>(),
    Place.find().sort({ updatedAt: -1 }).limit(8).populate(populate).lean<Row[]>(),
    Place.countDocuments({ "images.0": { $exists: false } }),
    Place.countDocuments({ "sources.0": { $exists: false } }),
    Place.aggregate<{ _id: unknown; count: number }>([{ $match: { status: "published" } }, { $group: { _id: "$state", count: { $sum: 1 } } }]),
    State.find({}, "name slug").sort({ name: 1 }).lean(),
  ]);
  const count = (s: Status) => statusCounts.find((c) => c._id === s)?.count ?? 0;
  const published = new Map(perState.map((r) => [String(r._id), r.count]));
  const thinStates = states.filter((s) => (published.get(String(s._id)) ?? 0) < 3);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="type-title text-4xl">Hello, {user.name.split(" ")[0]}</h1>
        <Link href="/admin/places/new" className="inline-flex h-10 items-center rounded bg-brand px-4 text-sm font-medium text-on-brand hover:opacity-90">
          New place
        </Link>
      </div>
      <Notice error={one(denied) ? "That page is for admins only." : undefined} />

      <div className="grid gap-4 sm:grid-cols-3">
        {(["draft", "review", "published"] as const).map((s) => (
          <Link key={s} href={`/admin/places?status=${s}`} className={`${card} hover:border-brand`}>
            <span className="block text-3xl font-semibold">{count(s)}</span>
            <StatusBadge status={s} />
          </Link>
        ))}
      </div>

      <section className={card} aria-labelledby="queue">
        <h2 id="queue" className="mb-3 text-lg font-semibold">
          Review queue {user.role === "editor" && <span className="text-sm font-normal text-muted">(an admin approves these)</span>}
        </h2>
        <PlaceTable rows={queue} empty="Nothing waiting for review." />
      </section>

      {returned.length > 0 && (
        <section className={card} aria-labelledby="returned">
          <h2 id="returned" className="mb-3 text-lg font-semibold">Sent back for changes</h2>
          <PlaceTable rows={returned} empty="" />
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <section className={card} aria-labelledby="recent">
          <h2 id="recent" className="mb-3 text-lg font-semibold">Recently updated</h2>
          <PlaceTable rows={recent} empty="No places yet." />
        </section>
        <section className={card} aria-labelledby="health">
          <h2 id="health" className="mb-3 text-lg font-semibold">Content health</h2>
          <ul className="flex flex-col gap-2 text-sm">
            <li>
              <Link href="/admin/places?missing=images" className="hover:underline hover:underline-offset-4">
                <strong>{noImages}</strong> places without photos
              </Link>
            </li>
            <li>
              <Link href="/admin/places?missing=sources" className="hover:underline hover:underline-offset-4">
                <strong>{noSources}</strong> places without sources
              </Link>
            </li>
            <li>
              <strong>{thinStates.length}</strong> states with fewer than 3 published places
              {thinStates.length > 0 && <span className="mt-1 block text-xs text-muted">{thinStates.map((s) => s.name).join(", ")}</span>}
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
