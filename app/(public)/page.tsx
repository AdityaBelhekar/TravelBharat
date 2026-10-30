import Link from "next/link";
import { CategoryLabel } from "@/components/CategorySymbol.tsx";
import { IndiaMap } from "@/components/IndiaMap.tsx";
import { MapHero } from "@/components/MapHero.tsx";
import { PlaceCard } from "@/components/PlaceCard.tsx";
import { PlaceMosaic } from "@/components/PlaceMosaic.tsx";
import { MONTH_NAMES, plural } from "@/lib/format.ts";
import { getCategories, getFeaturedPlaces, getHiddenGems, getMapStates, getPlacesForThisMonth } from "@/lib/queries.ts";

function Section({ title, intro, link, children, band }: { title: string; intro: string; link?: React.ReactNode; children: React.ReactNode; band?: boolean }) {
  return (
    <section className={band ? "bg-surface" : undefined}>
      <div className="mx-auto max-w-[77.5rem] px-4 py-14 sm:px-6">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <div>
            <h2 className="type-section text-[clamp(1.75rem,3vw,2.25rem)]">{title}</h2>
            <p className="mt-1.5 max-w-[60ch] text-muted">{intro}</p>
          </div>
          {link}
        </div>
        {children}
      </div>
    </section>
  );
}

const sectionLink = "font-medium underline decoration-border underline-offset-4 hover:decoration-foreground";

export default async function Home() {
  const [states, seasonal, featured, allGems, categories] = await Promise.all([
    getMapStates(),
    getPlacesForThisMonth(10),
    getFeaturedPlaces(50),
    getHiddenGems(50),
    getCategories(),
  ]);
  const monthName = MONTH_NAMES[seasonal.month - 1];
  const gems = allGems.filter((p) => p.image).slice(0, 3);
  // Lead the mosaic with India's best-known landmark, then the other featured places that have photos.
  const mosaic = featured
    .filter((p) => p.image)
    .sort((a, b) => Number(b.slug === "taj-mahal") - Number(a.slug === "taj-mahal"))
    .slice(0, 5);

  return (
    <>
      <section className="mx-auto w-full max-w-[77.5rem] px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
        <h1 className="type-title max-w-[14ch] text-[clamp(2.5rem,5.5vw,4rem)]">Where in India do you want to go?</h1>
        <p className="mb-8 mt-3 max-w-[52ch] text-muted">
          Choose a state on the map to see its places, with photos, the best months to visit, entry fees and timings.
        </p>
        <MapHero states={states} initial="rajasthan">
          <IndiaMap states={states} />
        </MapHero>
      </section>

      {seasonal.places.length > 0 && (
        <Section
          band
          title={`Good in ${monthName}`}
          intro="Places at their best this month, starting with the ones whose season is shortest."
          link={
            <Link href={`/explore?month=${seasonal.month}`} className={sectionLink}>
              All places for {monthName}
            </Link>
          }
        >
          <div className="-mx-4 grid snap-x snap-mandatory auto-cols-[minmax(15rem,18rem)] grid-flow-col gap-6 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
            {seasonal.places.map((p) => (
              <div key={p.slug} className="snap-start">
                <PlaceCard place={p} sizes="18rem" />
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title="By interest" intro="Every place is marked with the symbol for what it is best known for.">
        <ul className="grid border-t border-border sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c) => (
            <li key={c.slug} className="border-b border-border">
              <Link href={`/categories/${c.slug}`} className="group grid gap-1 py-5 pr-6">
                <CategoryLabel slug={c.slug} name={c.name} className="type-name text-[1.375rem] group-hover:underline group-hover:underline-offset-4 [&_svg]:size-4" />
                <span className="text-[0.9375rem] text-muted">{plural(c.placeCount, "place")}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      {mosaic.length > 0 && (
        <Section title="Worth the journey" intro="Landmarks most travellers want to see at least once.">
          <PlaceMosaic places={mosaic} />
        </Section>
      )}

      {gems.length > 0 && (
        <Section
          band
          title="Hidden gems"
          intro="Lesser-known places that deserve far more visitors than they get."
          link={
            <Link href="/explore?gem=1" className={sectionLink}>
              All hidden gems
            </Link>
          }
        >
          <div className="grid gap-x-6 gap-y-10 sm:grid-cols-3">
            {gems.map((p) => (
              <PlaceCard key={p.slug} place={p} ratio="aspect-[3/2]" sizes="(min-width: 640px) 33vw, 100vw" />
            ))}
          </div>
        </Section>
      )}
    </>
  );
}
