import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/Breadcrumbs.tsx";
import { CategorySymbol } from "@/components/CategorySymbol.tsx";
import { FilterablePlaces } from "@/components/FilterablePlaces.tsx";
import { PageSkeleton } from "@/components/PageSkeleton.tsx";
import { plural } from "@/lib/format.ts";
import { getAllCategorySlugs, getCategory } from "@/lib/queries.ts";

export async function generateStaticParams() {
  return (await getAllCategorySlugs()).map((category) => ({ category }));
}

export async function generateMetadata({ params }: PageProps<"/categories/[category]">): Promise<Metadata> {
  const category = await getCategory((await params).category);
  if (!category) return {};
  return {
    title: `${category.name} places in India`,
    description: category.description.slice(0, 160),
    alternates: { canonical: `/categories/${category.slug}` },
  };
}

async function CategoryContent({ params }: PageProps<"/categories/[category]">) {
  const category = await getCategory((await params).category);
  if (!category) notFound();

  return (
    <>
      <div className="bg-surface">
        <div className="mx-auto w-full max-w-[77.5rem] px-4 pb-12 pt-8 sm:px-6">
          <Breadcrumbs items={[{ name: "Explore", href: "/explore" }, { name: category.name, href: `/categories/${category.slug}` }]} />
          <h1 className="type-title mt-8 flex items-center gap-4 text-[clamp(2.5rem,6vw,4.5rem)]">
            <CategorySymbol slug={category.slug} name={`${category.name} symbol`} className="size-[0.6em]" />
            {category.name}
          </h1>
          <p className="mt-4 max-w-[60ch] text-lg leading-relaxed">{category.description}</p>
        </div>
      </div>

      <section className="mx-auto w-full max-w-[77.5rem] px-4 py-10 sm:px-6" aria-labelledby="places">
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="places" className="type-section text-[clamp(1.75rem,3vw,2.25rem)]">
            {category.places.length ? plural(category.places.length, "place") : "Places coming soon"}
          </h2>
          <Link
            href={`/explore?category=${category.slug}`}
            className="font-medium underline decoration-border underline-offset-4 hover:decoration-foreground"
          >
            Filter by month or city
          </Link>
        </div>
        <FilterablePlaces places={category.places} by="state" />
      </section>
    </>
  );
}

export default function CategoryPage(props: PageProps<"/categories/[category]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <CategoryContent {...props} />
    </Suspense>
  );
}
