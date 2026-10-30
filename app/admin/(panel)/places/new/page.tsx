import type { Metadata } from "next";
import { requireUser } from "@/lib/auth.ts";
import { connectDB } from "@/lib/db.ts";
import { savePlace } from "../../../actions.ts";
import { emptyPlace, formOptions } from "../form-data.ts";
import { PlaceForm } from "../PlaceForm.tsx";

export const metadata: Metadata = { title: "New place" };

export default async function NewPlace() {
  const user = await requireUser();
  await connectDB();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="type-title text-4xl">New place</h1>
      <PlaceForm initial={emptyPlace} {...await formOptions()} role={user.role} status={null} action={savePlace.bind(null, null)} />
    </div>
  );
}
