import type { PlaceCard as PlaceCardData } from "@/lib/queries.ts";
import { PlaceCard } from "./PlaceCard.tsx";

// One large photo beside smaller ones: for a short list of the best places.
export function PlaceMosaic({ places, showState = true }: { places: PlaceCardData[]; showState?: boolean }) {
  return (
    <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr]">
      {places.map((p, i) =>
        i === 0 ? (
          <div key={p.slug} className="sm:col-span-2 lg:col-span-1 lg:row-span-2 [&>article]:h-full">
            <PlaceCard
              place={p}
              showState={showState}
              ratio="aspect-[3/2] lg:aspect-auto lg:min-h-[26rem] lg:flex-1"
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
          </div>
        ) : (
          <PlaceCard key={p.slug} place={p} showState={showState} ratio="aspect-[3/2]" sizes="(min-width: 1024px) 25vw, 50vw" />
        ),
      )}
    </div>
  );
}
