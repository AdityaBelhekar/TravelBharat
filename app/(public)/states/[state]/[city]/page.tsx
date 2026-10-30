import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/Breadcrumbs.tsx";
import { FilterablePlaces } from "@/components/FilterablePlaces.tsx";
import { PageSkeleton } from "@/components/PageSkeleton.tsx";
import { PlaceCardGrid } from "@/components/PlaceCard.tsx";
import { plural } from "@/lib/format.ts";
import { getAllCityParams, getCity } from "@/lib/queries.ts";

export async function generateStaticParams() {
  return getAllCityParams();
}

export async function generateMetadata({ params }: PageProps<"/states/[state]/[city]">): Promise<Metadata> {
  const { state, city: citySlug } = await params;
  const city = await getCity(state, citySlug);
  if (!city) return {};
  return {
    title: `Places to visit in ${city.name}, ${city.state.name}`,
    description: city.overview.slice(0, 160),
    alternates: { canonical: `/states/${state}/${citySlug}` },
  };
}

// Getaways grouped by how far they are, so day trips and weekend trips are easy to tell apart.
const BANDS = [
  { max: 50, title: "Under 50 km", intro: "Close enough for a morning or an evening out." },
  { max: 100, title: "50 to 100 km", intro: "Day trips, or an easy overnight stay." },
  { max: 200, title: "100 to 200 km", intro: "Worth a full weekend." },
];

async function CityContent({ params }: PageProps<"/states/[state]/[city]">) {
  const { state, city: citySlug } = await params;
  const city = await getCity(state, citySlug);
  if (!city) notFound();
  const h2 = "type-section text-[clamp(1.75rem,3vw,2.25rem)]";

  return (
    <div className="mx-auto w-full max-w-[77.5rem] px-4 pt-8 sm:px-6">
      <Breadcrumbs
        items={[
          { name: "States", href: "/states" },
          { name: city.state.name, href: `/states/${city.state.slug}` },
          { name: city.name, href: `/states/${city.state.slug}/${city.slug}` },
        ]}
      />
      <h1 className="type-title mt-6 text-[clamp(2.5rem,6vw,4.5rem)]">{city.name}</h1>
      <p className="mt-1 text-lg text-muted">
        in{" "}
        <Link href={`/states/${city.state.slug}`} className="text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground">
          {city.state.name}
        </Link>
      </p>

      <div className="mt-8 grid gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,68ch)_1fr]">
        <div className="grid gap-6">
          <p className="text-lg leading-relaxed">{city.overview}</p>
          {city.history && (
            <section aria-labelledby="history">
              <h2 id="history" className="type-section mb-2 text-[1.75rem]">
                History
              </h2>
              <p className="leading-relaxed">{city.history}</p>
            </section>
          )}
        </div>
        {city.getaways.length > 0 && (
          <nav aria-label="On this page" className="h-fit border-t-4 border-foreground pt-4 text-[0.9375rem]">
            <ul className="grid gap-1.5">
              {city.places.length > 0 && (
                <li>
                  <a href="#places" className="underline decoration-border underline-offset-4 hover:decoration-foreground">
                    {plural(city.places.length, "place")} in {city.name}
                  </a>
                </li>
              )}
              <li>
                <a href="#getaways" className="underline decoration-border underline-offset-4 hover:decoration-foreground">
                  {plural(city.getaways.length, "getaway")} within 200 km
                </a>
              </li>
            </ul>
          </nav>
        )}
      </div>

      {city.places.length > 0 && (
        <section className="mt-12 border-t border-border pt-10" aria-labelledby="places">
          <h2 id="places" className={`${h2} mb-6`}>
            {plural(city.places.length, "place")} in {city.name}
          </h2>
          <FilterablePlaces places={city.places} showState={false} by="kind" compact />
        </section>
      )}

      {city.getaways.length > 0 && (
        <section className="mt-16 rounded-sm bg-surface p-5 sm:p-8" aria-labelledby="getaways">
          <h2 id="getaways" className={h2}>
            {city.isHub ? `Weekend getaways from ${city.name}` : `Around ${city.name}`}
          </h2>
          <p className="mt-1.5 max-w-[60ch] text-muted">
            Places between 15 and 200 km from the centre of {city.name}, nearest first. Distances are in a straight line;
            the road is usually longer.
          </p>
          {BANDS.map((band, i) => {
            const inBand = city.getaways.filter((p) => (p.distanceKm ?? 0) <= band.max && (p.distanceKm ?? 0) > (BANDS[i - 1]?.max ?? 0));
            if (!inBand.length) return null;
            return (
              <div key={band.title} className="mt-10">
                <h3 className="type-name text-xl">{band.title}</h3>
                <p className="mb-5 text-[0.9375rem] text-muted">{band.intro}</p>
                <PlaceCardGrid places={inBand} compact />
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}

export default function CityPage(props: PageProps<"/states/[state]/[city]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <CityContent {...props} />
    </Suspense>
  );
}
