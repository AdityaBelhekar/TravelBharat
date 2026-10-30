import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/Breadcrumbs.tsx";
import { CategoryLabel } from "@/components/CategorySymbol.tsx";
import { Gallery } from "@/components/Gallery.tsx";
import { JsonLd, SITE_URL } from "@/components/JsonLd.tsx";
import { MapEmbed } from "@/components/MapEmbed.tsx";
import { MonthStrip } from "@/components/MonthStrip.tsx";
import { PageSkeleton } from "@/components/PageSkeleton.tsx";
import { PlaceCard } from "@/components/PlaceCard.tsx";
import { PlaceImage } from "@/components/PlaceImage.tsx";
import { formatINR } from "@/lib/format.ts";
import { kindLabel } from "@/lib/kinds.ts";
import { getAllPlaceSlugs, getPlace, type PlaceDetail } from "@/lib/queries.ts";

export async function generateStaticParams() {
  return (await getAllPlaceSlugs()).map((place) => ({ place }));
}

export async function generateMetadata({ params }: PageProps<"/places/[place]">): Promise<Metadata> {
  const place = await getPlace((await params).place);
  if (!place) return {};
  const title = `${place.name}, ${place.city.name}`;
  return {
    title,
    description: place.shortDescription,
    alternates: { canonical: `/places/${place.slug}` },
    openGraph: { title, description: place.shortDescription, images: place.image ? [place.image.url] : undefined },
  };
}

const paragraphs = (text: string) => text.split(/\n\s*\n/).map((p, i) => <p key={i}>{p}</p>);

function Heading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="type-section mb-3 text-[1.75rem]">
      {children}
    </h2>
  );
}

function VisitInfo({ place }: { place: PlaceDetail }) {
  const fee = place.entryFee;
  const feeRows = fee
    ? ([
        ["Indian visitors", fee.indian],
        ["Foreign visitors", fee.foreigner],
        ["Children", fee.child],
      ].filter(([, v]) => v !== undefined) as [string, number][])
    : [];
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`;
  const d = 0.03;
  const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${place.lng - d},${place.lat - d},${place.lng + d},${place.lat + d}&layer=mapnik&marker=${place.lat},${place.lng}`;
  const label = "mb-1.5 text-[0.9375rem] font-semibold";

  return (
    <aside aria-labelledby="visit" className="grid gap-7 border-t-4 border-foreground pt-5 lg:sticky lg:top-6">
      <h2 id="visit" className="type-section text-[1.75rem]">
        Plan your visit
      </h2>

      <div>
        <h3 className={label}>Best months</h3>
        <MonthStrip best={place.bestMonths} />
        {place.bestTimeNote && <p className="mt-2 text-[0.9375rem] text-muted">{place.bestTimeNote}</p>}
      </div>

      {place.timings && (
        <div>
          <h3 className={label}>Timings</h3>
          <p>{place.timings.hours}</p>
          {place.timings.closedOn && <p className="text-muted">Closed on {place.timings.closedOn}</p>}
        </div>
      )}

      {fee && (
        <div>
          <h3 className={label}>Entry fee</h3>
          {feeRows.length > 0 && (
            <dl className="divide-y divide-border border-y border-border">
              {feeRows.map(([who, amount]) => (
                <div key={who} className="flex justify-between gap-4 py-1.5">
                  <dt className="text-muted">{who}</dt>
                  <dd className="font-semibold">{formatINR(amount)}</dd>
                </div>
              ))}
            </dl>
          )}
          {fee.note && <p className="mt-2 text-[0.9375rem] text-muted">{fee.note}</p>}
        </div>
      )}

      <div>
        <h3 className={label}>Location</h3>
        <p>{place.address}</p>
        <MapEmbed title={`Map showing ${place.name}`} src={embedUrl} />
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex h-12 w-full items-center justify-center rounded bg-brand font-semibold text-on-brand hover:opacity-90"
        >
          Open in Google Maps
        </a>
      </div>
    </aside>
  );
}

async function PlaceContent({ params }: PageProps<"/places/[place]">) {
  const place = await getPlace((await params).place);
  if (!place) notFound();
  const photo = place.images[0];

  return (
    <article className="mx-auto w-full max-w-[77.5rem] px-4 pt-8 sm:px-6">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "TouristAttraction",
          name: place.name,
          description: place.shortDescription,
          url: new URL(`/places/${place.slug}`, SITE_URL).href,
          ...(place.images.length > 0 && { image: place.images.map((i) => new URL(i.url, SITE_URL).href) }),
          geo: { "@type": "GeoCoordinates", latitude: place.lat, longitude: place.lng },
          address: {
            "@type": "PostalAddress",
            streetAddress: place.address,
            addressLocality: place.city.name,
            addressRegion: place.state.name,
            addressCountry: "IN",
          },
          ...(place.entryFee?.indian === 0 && { isAccessibleForFree: true }),
        }}
      />
      <Breadcrumbs
        items={[
          { name: "States", href: "/states" },
          { name: place.state.name, href: `/states/${place.state.slug}` },
          { name: place.city.name, href: `/states/${place.state.slug}/${place.city.slug}` },
          { name: place.name, href: `/places/${place.slug}` },
        ]}
      />

      <header className="mt-6 grid gap-3">
        <p className="flex flex-wrap items-center gap-x-5 gap-y-1 font-medium">
          <Link href={`/explore?state=${place.state.slug}&kind=${place.kind}`} className="hover:underline hover:underline-offset-4">
            {kindLabel(place.kind)}
          </Link>
          {place.categories.map((c) => (
            <Link key={c.slug} href={`/categories/${c.slug}`} className="hover:underline hover:underline-offset-4">
              <CategoryLabel slug={c.slug} name={c.name} />
            </Link>
          ))}
          {place.isHiddenGem && <span className="rounded-sm bg-yellow px-2 py-0.5 text-sm font-semibold text-board-ink">Hidden gem</span>}
        </p>
        <h1 className="type-title max-w-[18ch] text-[clamp(2.5rem,6vw,4.5rem)]">{place.name}</h1>
        <p className="max-w-[60ch] text-lg text-muted">{place.shortDescription}</p>
      </header>

      <div className="mt-8">
        {place.images.length > 1 ? (
          <Gallery images={place.images} />
        ) : (
          <figure>
            <PlaceImage
              image={photo}
              name={place.name}
              category={place.categories[0]}
              sizes="(min-width: 1240px) 1240px, 100vw"
              priority
              className={photo ? "aspect-[3/2] sm:aspect-[21/9]" : "h-40"}
            />
            {photo?.credit && (
              <figcaption className="type-small-print mt-2 text-xs text-muted">
                Photo by {photo.credit}
                {photo.license && `, ${photo.license}`}
                {photo.sourceUrl && (
                  <>
                    {" "}
                    (
                    <a href={photo.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                      Wikimedia Commons
                    </a>
                    )
                  </>
                )}
              </figcaption>
            )}
          </figure>
        )}
      </div>

      <div className="mt-12 grid gap-x-16 gap-y-12 lg:grid-cols-[minmax(0,68ch)_1fr]">
        <div className="grid content-start gap-12">
          <section aria-labelledby="about">
            <Heading id="about">About</Heading>
            <div className="grid gap-4 text-lg leading-relaxed">{paragraphs(place.description)}</div>
          </section>

          {place.history && (
            <section aria-labelledby="history">
              <Heading id="history">History</Heading>
              <div className="grid gap-4 leading-relaxed">{paragraphs(place.history)}</div>
            </section>
          )}

          {place.highlights.length > 0 && (
            <section aria-labelledby="highlights">
              <Heading id="highlights">Don&apos;t miss</Heading>
              <ul className="grid border-t border-border sm:grid-cols-2 sm:gap-x-8">
                {place.highlights.map((h) => (
                  <li key={h} className="border-b border-border py-3">
                    {h}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {place.sources.length > 0 && (
            <section aria-labelledby="sources" className="text-[0.9375rem] text-muted">
              <h2 id="sources" className="mb-2 font-semibold text-foreground">
                Sources
              </h2>
              <ul className="grid gap-1">
                {place.sources.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
              <p className="mt-2">Fees and timings change. Check the official site before you travel.</p>
            </section>
          )}
        </div>

        <VisitInfo place={place} />
      </div>

      {place.nearby.length > 0 && (
        <section className="mt-20" aria-labelledby="nearby">
          <h2 id="nearby" className="type-section mb-6 text-[clamp(1.75rem,3vw,2.25rem)]">
            Nearby
          </h2>
          <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {place.nearby.slice(0, 6).map((p) => (
              <PlaceCard key={p.slug} place={p} showState={false} ratio="aspect-[3/2]" />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

export default function PlacePage(props: PageProps<"/places/[place]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PlaceContent {...props} />
    </Suspense>
  );
}
