import type { Metadata } from "next";
import { isValidObjectId } from "mongoose";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth.ts";
import { connectDB } from "@/lib/db.ts";
import { City } from "@/lib/models.ts";
import { deleteCity, saveCity } from "../../../actions.ts";
import { ConfirmButton } from "../../../ConfirmButton.tsx";
import { danger, Notice, one, primary } from "../../../ui.tsx";
import { CityFields } from "../CityFields.tsx";

export const metadata: Metadata = { title: "Edit city" };

export default async function EditCity({ params, searchParams }: PageProps<"/admin/cities/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  const sp = await searchParams;
  if (!isValidObjectId(id)) notFound();
  await connectDB();
  const city = await City.findById(id).populate<{ state: { name: string; slug: string } }>("state", "name slug").lean();
  if (!city) notFound();
  const [lng, lat] = city.location?.coordinates ?? [];

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <h1 className="type-title text-4xl">
        {city.name} <span className="text-lg font-normal text-muted">{city.state.name}</span>
      </h1>
      <Notice error={one(sp.error)} />
      <form action={saveCity.bind(null, id)} className="flex flex-col gap-4">
        <input type="hidden" name="state" value={city.state.slug} />
        <CityFields city={{ ...city, lat, lng }} />
        <div>
          <button type="submit" className={primary}>
            Save
          </button>
        </div>
      </form>
      {user.role === "admin" && (
        <form action={deleteCity.bind(null, id)}>
          <ConfirmButton message={`Delete ${city.name}? This can't be undone.`} className={danger}>
            Delete city
          </ConfirmButton>
        </form>
      )}
    </div>
  );
}
