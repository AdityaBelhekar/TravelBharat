import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth.ts";
import { connectDB } from "@/lib/db.ts";
import { REGION_LABELS } from "@/lib/format.ts";
import { Place, State } from "@/lib/models.ts";
import { table } from "../../ui.tsx";

export const metadata: Metadata = { title: "States" };

// The 28 states and 8 UTs are fixed, so they can be edited but not added or deleted.
export default async function StatesAdmin() {
  await requireUser("admin");
  await connectDB();
  const [states, counts] = await Promise.all([
    State.find().sort({ name: 1 }).lean(),
    Place.aggregate<{ _id: unknown; count: number }>([{ $match: { status: "published" } }, { $group: { _id: "$state", count: { $sum: 1 } } }]),
  ]);
  const published = new Map(counts.map((c) => [String(c._id), c.count]));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="type-title text-4xl">States and union territories</h1>
      <div className="overflow-x-auto rounded-sm border border-border bg-surface">
        <table className={table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Region</th>
              <th>Capital</th>
              <th>Published places</th>
            </tr>
          </thead>
          <tbody>
            {states.map((s) => (
              <tr key={s.slug}>
                <td>
                  <Link href={`/admin/states/${s.slug}`} className="font-medium hover:underline hover:underline-offset-4">
                    {s.name}
                  </Link>
                  {s.type === "ut" && <span className="ml-2 text-xs text-muted">UT</span>}
                </td>
                <td>{REGION_LABELS[s.region]}</td>
                <td>{s.capital}</td>
                <td>{published.get(String(s._id)) ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
