import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/Breadcrumbs.tsx";
import { FilterablePlaces } from "@/components/FilterablePlaces.tsx";
import { PageSkeleton } from "@/components/PageSkeleton.tsx";
import { PlaceMosaic } from "@/components/PlaceMosaic.tsx";
import { StateBoard } from "@/components/StateBoard.tsx";
import { REGION_LABELS, plural } from "@/lib/format.ts";
import { kindLabel } from "@/lib/kinds.ts";
import { getState, getStates } from "@/lib/queries.ts";

export async function generateStaticParams() {
  return (await getStates()).map((s) => ({ state: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/states/[state]">): Promise<Metadata> {
  const state = await getState((await params).state);
  if (!state) return {};
  return {
    title: `${state.name} tourism: places to visit`,
    description: state.overview.slice(0, 160),
    alternates: { canonical: `/states/${state.slug}` },
  };
}

function Heading({ id, children, intro }: { id: string; children: React.ReactNode; intro?: string }) {
  return (
    <div className="mb-6">
      <h2 id={id} className="type-section text-[clamp(1.75rem,3vw,2.25rem)]">
        {children}
      </h2>
      {intro && <p className="mt-1.5 max-w-[60ch] text-muted">{intro}</p>}
    </div>
  );
}

async function StateContent({ params }: PageProps<"/states/[state]">) {
  const state = await getState((await params).state);
  if (!state) notFound();
  const hubs = state.cities.filter((c) => c.isHub);
  const towns = state.cities.filter((c) => c.placeCount > 0);

  return (
    <>
      <section className="bg-surface">
        <div className="mx-auto w-full max-w-[77.5rem] px-4 pb-12 pt-8 sm:px-6">
          <Breadcrumbs items={[{ name: "States", href: "/states" }, { name: state.name, href: `/states/${state.slug}` }]} />
          <StateBoard as="h1" name={state.name} localName={state.localName} className="mx-auto mt-8 max-w-[55rem]" />
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-[77.5rem] gap-x-12 gap-y-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,68ch)_1fr]">
        <p className="text-lg leading-relaxed">{state.overview}</p>
        <dl className="grid h-fit grid-cols-[auto_1fr] gap-x-6 gap-y-2">
          <dt className="text-muted">Region</dt>
          <dd>
            {REGION_LABELS[state.region]}, {state.type === "ut" ? "union territory" : "state"}
          </dd>
          <dt className="text-muted">Capital</dt>
          <dd>{state.capital}</dd>
          <dt className="text-muted">Languages</dt>
          <dd>{state.languages.join(", ")}</dd>
          <dt className="text-muted">Best time</dt>
          <dd>{state.bestTime}</dd>
          <dt className="text-muted">Known for</dt>
          <dd>{state.famousFor.join(", ")}</dd>
        </dl>
      </div>

      {state.places.length === 0 ? (
        <p className="mx-auto w-full max-w-[77.5rem] border-t border-border px-4 py-10 text-muted sm:px-6">
          Places in {state.name} are still being researched and checked.{" "}
          <Link href="/states" className="font-medium text-foreground underline underline-offset-4">
            Choose another state
          </Link>
          .
        </p>
      ) : (
        <div className="mx-auto grid w-full max-w-[77.5rem] gap-16 px-4 sm:px-6">
          {state.topPlaces.length > 0 && (
            <section aria-labelledby="top" className="border-t border-border pt-10">
              <Heading id="top" intro={`The places most travellers to ${state.name} put first.`}>
                Top places to visit
              </Heading>
              <PlaceMosaic places={state.topPlaces.slice(0, 5)} showState={false} />
            </section>
          )}

          {state.kinds.length > 1 && (
            <section aria-labelledby="kinds">
              <Heading id="kinds">What to see</Heading>
              <ul className="grid border-t border-border sm:grid-cols-2 lg:grid-cols-4">
                {state.kinds.map(({ kind, count }) => (
                  <li key={kind} className="border-b border-border">
                    <Link href={`/explore?state=${state.slug}&kind=${kind}`} className="group flex items-baseline justify-between gap-4 py-4 pr-6">
                      <span className="type-name text-lg group-hover:underline group-hover:underline-offset-4">{kindLabel(kind, true)}</span>
                      <span className="text-muted">{count}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {hubs.length > 0 && (
            <section aria-labelledby="getaways" className="rounded-sm bg-surface p-6 sm:p-8">
              <Heading id="getaways" intro="Places within 200 km of the big cities, sorted by distance: dams, forts, hill stations and beaches for a day or a weekend away.">
                Weekend getaways
              </Heading>
              <ul className="flex flex-wrap gap-3">
                {hubs.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/states/${state.slug}/${c.slug}#getaways`}
                      className="inline-flex h-11 items-center rounded border border-border bg-background px-4 font-medium hover:border-foreground"
                    >
                      From {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {towns.length > 1 && (
            <section aria-labelledby="cities">
              <Heading id="cities" intro="Each city page has its history, its own sights and the getaways around it.">
                Cities and towns
              </Heading>
              <ul className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
                {towns.map((c) => (
                  <li key={c.slug}>
                    <Link href={`/states/${state.slug}/${c.slug}`} className="group grid gap-1">
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="type-name text-xl group-hover:underline group-hover:underline-offset-4">{c.name}</span>
                        <span className="shrink-0 text-[0.9375rem] text-muted">{plural(c.placeCount, "place")}</span>
                      </span>
                      {c.overview && <span className="line-clamp-2 text-[0.9375rem] text-muted">{c.overview}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="places">
            <Heading id="places">
              All {plural(state.places.length, "place")} in {state.name}
            </Heading>
            <FilterablePlaces places={state.places} showState={false} by="kind" compact />
          </section>
        </div>
      )}
    </>
  );
}

export default function StatePage(props: PageProps<"/states/[state]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <StateContent {...props} />
    </Suspense>
  );
}
