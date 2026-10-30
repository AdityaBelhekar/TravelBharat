import type { Metadata } from "next";
import { requireUser } from "@/lib/auth.ts";
import { connectDB } from "@/lib/db.ts";
import { Category, Place } from "@/lib/models.ts";
import { deleteCategory, saveCategory } from "../../actions.ts";
import { ConfirmButton } from "../../ConfirmButton.tsx";
import { card, danger, Field, input, Notice, one, primary, secondary } from "../../ui.tsx";

export const metadata: Metadata = { title: "Categories" };

function Fields({
  id,
  name = "",
  slug = "",
  description = "",
}: {
  id: string;
  name?: string;
  slug?: string;
  description?: string;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_1fr_2fr]">
      <Field id={`${id}-name`} label="Name">
        <input id={`${id}-name`} name="name" defaultValue={name} required maxLength={50} className={input} />
      </Field>
      <Field id={`${id}-slug`} label="Slug">
        <input
          id={`${id}-slug`}
          name="slug"
          defaultValue={slug}
          required
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          className={input}
        />
      </Field>
      <Field id={`${id}-description`} label="Description">
        <input
          id={`${id}-description`}
          name="description"
          defaultValue={description}
          maxLength={300}
          className={input}
        />
      </Field>
    </div>
  );
}

export default async function CategoriesAdmin({ searchParams }: PageProps<"/admin/categories">) {
  await requireUser("admin");
  const sp = await searchParams;
  await connectDB();
  const [categories, counts] = await Promise.all([
    Category.find().sort({ name: 1 }).lean(),
    Place.aggregate<{ _id: unknown; count: number }>([
      { $unwind: "$categories" },
      { $group: { _id: "$categories", count: { $sum: 1 } } },
    ]),
  ]);
  const used = new Map(counts.map((c) => [String(c._id), c.count]));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="type-title text-4xl">Categories</h1>
      <p className="text-sm text-muted">
        New categories also need a colour in <code>app/globals.css</code> (<code>--cat-slug</code>) and a map symbol in{" "}
        <code>components/CategorySymbol.tsx</code>; until then they show a plain outline.
      </p>
      <Notice success={one(sp.saved) ? "Saved." : undefined} error={one(sp.error)} />

      {categories.map((c) => {
        const id = String(c._id);
        return (
          <div key={id} className={`${card} flex flex-col gap-3`}>
            <form action={saveCategory.bind(null, id)} className="flex flex-col gap-3">
              <Fields id={`category-${id}`} name={c.name} slug={c.slug} description={c.description ?? ""} />
              <div className="flex items-center gap-3">
                <button type="submit" className={secondary}>
                  Save
                </button>
                <span className="text-sm text-muted">{used.get(id) ?? 0} places</span>
              </div>
            </form>
            {!used.get(id) && (
              <form action={deleteCategory.bind(null, id)}>
                <ConfirmButton message={`Delete the ${c.name} category?`} className={danger}>
                  Delete
                </ConfirmButton>
              </form>
            )}
          </div>
        );
      })}

      <form action={saveCategory.bind(null, null)} className={`${card} flex flex-col gap-3`}>
        <h2 className="text-lg font-semibold">Add a category</h2>
        <Fields id="new-category" />
        <div>
          <button type="submit" className={primary}>
            Add category
          </button>
        </div>
      </form>
    </div>
  );
}
