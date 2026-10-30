import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth.ts";
import { connectDB } from "@/lib/db.ts";
import { City, Place, State } from "@/lib/models.ts";
import { saveCity } from "../../actions.ts";
import { Field, card, input, Notice, one, primary, secondary, table } from "../../ui.tsx";
import { CityFields } from "./CityFields.tsx";

export const metadata: Metadata = { title: "Cities" };

export default async function CitiesAdmin({ searchParams }: PageProps<"/admin/cities">) {
  await requireUser();
  const sp = await searchParams;
  await connectDB();
  const states = await State.find({}, "name slug").sort({ name: 1 }).lean();
  const state = states.find((s) => s.slug === one(sp.state));
  const [cities, counts] = state
    ? await Promise.all([
        City.find({ state: state._id }).sort({ name: 1 }).lean(),
        Place.aggregate<{ _id: unknown; count: number }>([
          { $match: { state: state._id } },
          { $group: { _id: "$city", count: { $sum: 1 } } },
        ]),
      ])
    : [[], []];
  const placeCount = new Map(counts.map((c) => [String(c._id), c.count]));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="type-title text-4xl">Cities</h1>
      <Notice
        success={one(sp.saved) ? "City saved." : one(sp.deleted) ? "City deleted." : undefined}
        error={one(sp.error)}
      />

      <form className="flex flex-wrap items-end gap-3">
        <Field id="cities-state" label="State">
          <select id="cities-state" name="state" defaultValue={state?.slug ?? ""} className={`${input} w-auto`}>
            <option value="">Choose a state</option>
            {states.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <button type="submit" className={secondary}>
          Show cities
        </button>
      </form>

      {state && (
        <>
          <div className="overflow-x-auto rounded-sm border border-border bg-surface">
            <table className={table}>
              <thead>
                <tr>
                  <th>City</th>
                  <th>Address</th>
                  <th>Places</th>
                </tr>
              </thead>
              <tbody>
                {cities.map((c) => (
                  <tr key={String(c._id)}>
                    <td>
                      <Link href={`/admin/cities/${c._id}`} className="font-medium hover:underline hover:underline-offset-4">
                        {c.name}
                      </Link>
                    </td>
                    <td className="text-muted">
                      /states/{state.slug}/{c.slug}
                    </td>
                    <td>{placeCount.get(String(c._id)) ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!cities.length && <p className="p-4 text-sm text-muted">No cities yet.</p>}
          </div>

          <form action={saveCity.bind(null, null)} className={`${card} flex flex-col gap-4`}>
            <h2 className="text-lg font-semibold">Add a city in {state.name}</h2>
            <input type="hidden" name="state" value={state.slug} />
            <CityFields />
            <div>
              <button type="submit" className={primary}>
                Add city
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
