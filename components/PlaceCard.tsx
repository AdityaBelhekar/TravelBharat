import Link from "next/link";
import type { PlaceCard as PlaceCardData } from "@/lib/queries.ts";
import { CategorySymbol } from "./CategorySymbol.tsx";
import { PlaceImage } from "./PlaceImage.tsx";

// A photo with a caption below: no border, no shadow (see DESIGN.md).
export function PlaceCard({
  place,
  showState = true,
  ratio = "aspect-[4/5]",
  sizes = "(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw",
  priority = false,
}: {
  place: PlaceCardData;
  showState?: boolean;
  ratio?: string;
  sizes?: string;
  priority?: boolean;
}) {
  return (
    <article className="group relative flex min-w-0 flex-col gap-2.5">
      <PlaceImage image={place.image} name={place.name} category={place.categories[0]} sizes={sizes} priority={priority} className={ratio} />
      {place.isHiddenGem && (
        <span className="absolute left-2.5 top-2.5 rounded-sm bg-yellow px-2 py-0.5 text-sm font-semibold text-board-ink">
          Hidden gem
        </span>
      )}
      <h3 className="type-name text-xl">
        <Link
          href={`/places/${place.slug}`}
          className="after:absolute after:inset-0 group-hover:underline group-hover:decoration-2 group-hover:underline-offset-4"
        >
          {place.name}
        </Link>
      </h3>
      <p className="-mt-1 flex items-center gap-1.5 text-[0.9375rem] leading-snug text-muted">
        {place.categories.map((c) => (
          <CategorySymbol key={c.slug} {...c} />
        ))}
        <span className="ml-0.5">
          {place.city.name}
          {showState && `, ${place.state.name}`}
          {place.distanceKm !== undefined && `, ${place.distanceKm} km away`}
        </span>
      </p>
    </article>
  );
}

// Compact: four landscape cards a row, for long lists such as all of a state's places.
// Set `lead` when the grid starts at the top of the page, so its first photo isn't lazy-loaded.
export function PlaceCardGrid({ places, showState, compact, lead }: { places: PlaceCardData[]; showState?: boolean; compact?: boolean; lead?: boolean }) {
  return (
    <div className={`grid gap-x-6 sm:grid-cols-2 ${compact ? "gap-y-8 lg:grid-cols-4" : "gap-y-10 lg:grid-cols-3"}`}>
      {places.map((p, i) => (
        <PlaceCard
          key={p.slug}
          priority={lead && i === 0}
          place={p}
          showState={showState}
          {...(compact && { ratio: "aspect-[3/2]", sizes: "(min-width: 1024px) 22vw, (min-width: 640px) 50vw, 100vw" })}
        />
      ))}
    </div>
  );
}
