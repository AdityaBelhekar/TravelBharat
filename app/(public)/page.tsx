import Link from "next/link";
import { CategorySymbol } from "@/components/CategorySymbol.tsx";
import { Hero } from "@/components/Hero.tsx";
import { IndiaMap } from "@/components/IndiaMap.tsx";
import { MapHero } from "@/components/MapHero.tsx";
import { PlaceCard } from "@/components/PlaceCard.tsx";
import { PlaceImage } from "@/components/PlaceImage.tsx";
import { PlaceMosaic } from "@/components/PlaceMosaic.tsx";
import heroStops from "@/data/hero.json";
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

// The landmarks to lead with, from across the country.
const WORTH_THE_JOURNEY = ["taj-mahal", "hampi", "mehrangarh-fort", "golden-temple", "athirappilly-falls"];

const sectionLink = "font-medium underline decoration-border underline-offset-4 hover:decoration-foreground";

export default async function Home() {
  const [states, seasonal, featured, allGems, categories] = await Promise.all([
    getMapStates(),
    getPlacesForThisMonth(10),
    getFeaturedPlaces(400),
    getHiddenGems(50),
    getCategories(),
  ]);
  const monthName = MONTH_NAMES[seasonal.month - 1];
  const gems = allGems.filter((p) => p.image).slice(0, 3);
  const mosaic = WORTH_THE_JOURNEY.flatMap((slug) => featured.filter((p) => p.slug === slug && p.image));
  const stops = heroStops.flatMap((s) => {
    const state = states.find((x) => x.slug === s.state);
    return state ? [{ ...s, stateName: state.name, localName: state.localName }] : [];
  });

  return (
    <>
      <Hero stops={stops} placeCount={states.reduce((sum, s) => sum + s.placeCount, 0)} />

      <section id="map" className="mx-auto w-full max-w-[77.5rem] scroll-mt-4 px-4 pb-16 pt-14 sm:px-6">
        <h2 className="type-section mb-8 text-[clamp(1.75rem,3vw,2.25rem)]">Choose a state on the map</h2>
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
        <ul className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
          {categories.map((c) => {
            const cover = featured.find((p) => p.image && p.categories[0]?.slug === c.slug && !mosaic.includes(p));
            return (
              <li key={c.slug}>
                <Link href={`/categories/${c.slug}`} className="group relative block overflow-hidden rounded-sm text-white">
                  <PlaceImage image={cover?.image} name={c.name} category={c} sizes="(min-width: 1024px) 22vw, 50vw" className="aspect-[4/5]" />
                  <span aria-hidden className="absolute inset-0 bg-[linear-gradient(to_top,rgb(0_0_0/0.7),transparent_55%)]" />
                  <span className="absolute inset-x-3 bottom-3 grid sm:inset-x-4 sm:bottom-4">
                    <span className="flex items-center gap-2">
                      <span className="rounded-sm bg-white p-1">
                        <CategorySymbol slug={c.slug} name={c.name} />
                      </span>
                      <span className="type-name text-[1.375rem] group-hover:underline group-hover:underline-offset-4">{c.name}</span>
                    </span>
                    <span className="text-[0.9375rem]">{plural(c.placeCount, "place")}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Section>

      {mosaic.length > 0 && (
        <Section title="Worth the journey" intro="Landmarks most travellers want to see at least once.">
          <PlaceMosaic places={mosaic} />
        </Section>
      )}

      {gems.length > 0 && (
        <div className="-mb-16">
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
        </div>
      )}
    </>
  );
}
