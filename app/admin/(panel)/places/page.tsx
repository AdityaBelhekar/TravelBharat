import Link from "next/link";
import { requireUser } from "@/lib/auth.ts";
import { connectDB } from "@/lib/db.ts";
import { Place, State } from "@/lib/models.ts";
import { escapeRegex } from "@/lib/format.ts";
import { completeness } from "@/lib/place-form.ts";
import { STATUSES, type Status } from "@/lib/validators.ts";
import { input, Notice, one, secondary, StatusBadge, table } from "../../ui.tsx";

const PAGE_SIZE = 50;

export default async function PlacesAdmin({ searchParams }: PageProps<"/admin/places">) {
  await requireUser();
  const sp = await searchParams;
  const q = one(sp.q)?.trim().slice(0, 100) ?? "";
  const status = STATUSES.find((s) => s === one(sp.status));
  const state = one(sp.state);
  const missing = one(sp.missing);
  const page = Math.max(1, Number(one(sp.page)) || 1);

  await connectDB();
  const states = await State.find({}, "name slug").sort({ name: 1 }).lean();
  const stateId = states.find((s) => s.slug === state)?._id;
  const filter = {
    ...(q && { name: new RegExp(escapeRegex(q), "i") }),
    ...(status && { status }),
    ...(stateId && { state: stateId }),
    ...(missing === "images" && { "images.0": { $exists: false } }),
    ...(missing === "sources" && { "sources.0": { $exists: false } }),
  };
  const [total, places] = await Promise.all([
    Place.countDocuments(filter),
    Place.find(filter)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .populate<{ state: { name: string } }>("state", "name")
      .lean(),
  ]);
  const pages = Math.ceil(total / PAGE_SIZE);
  const pageHref = (n: number) => `/admin/places?${new URLSearchParams({ ...(q && { q }), ...(status && { status }), ...(state && { state }), ...(missing && { missing }), page: String(n) })}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="type-title text-4xl">Places</h1>
        <Link href="/admin/places/new" className="inline-flex h-10 items-center rounded bg-brand px-4 text-sm font-medium text-on-brand hover:opacity-90">
          New place
        </Link>
      </div>
      <Notice success={one(sp.deleted) ? "Place deleted." : undefined} error={one(sp.error)} />

      <form className="flex flex-wrap gap-3" role="search" aria-label="Filter places">
        <input name="q" defaultValue={q} placeholder="Search by name" aria-label="Search by name" className={`${input} max-w-xs`} />
        <select name="status" defaultValue={status ?? ""} aria-label="Status" className={`${input} w-auto`}>
          <option value="">Any status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === "review" ? "In review" : s[0].toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
        <select name="state" defaultValue={state ?? ""} aria-label="State" className={`${input} w-auto`}>
          <option value="">All states</option>
          {states.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.name}
            </option>
          ))}
        </select>
        {missing && <input type="hidden" name="missing" value={missing} />}
        <button type="submit" className={secondary}>
          Filter
        </button>
      </form>

      <p className="text-sm text-muted">
        {total} {total === 1 ? "place" : "places"}
        {missing && ` missing ${missing}`}
      </p>
      <div className="overflow-x-auto rounded-sm border border-border bg-surface">
        <table className={table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>State</th>
              <th>Status</th>
              <th>Complete</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {places.map((p) => {
              const { score, missing: gaps } = completeness({ ...p, address: p.address });
              return (
                <tr key={String(p._id)}>
                  <td>
                    <Link href={`/admin/places/${p._id}`} className="font-medium hover:underline hover:underline-offset-4">
                      {p.name}
                    </Link>
                  </td>
                  <td>{p.state.name}</td>
                  <td>
                    <StatusBadge status={p.status as Status} />
                  </td>
                  <td title={gaps.length ? `Missing: ${gaps.join(", ")}` : "Complete"}>{score}%</td>
                  <td className="whitespace-nowrap text-muted">{p.updatedAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <nav aria-label="Pages" className="flex items-center gap-3 text-sm">
          {page > 1 && <Link href={pageHref(page - 1)} className={secondary}>Previous</Link>}
          <span className="text-muted">Page {page} of {pages}</span>
          {page < pages && <Link href={pageHref(page + 1)} className={secondary}>Next</Link>}
        </nav>
      )}
    </div>
  );
}
