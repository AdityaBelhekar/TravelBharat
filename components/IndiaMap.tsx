import Link from "next/link";
import map from "@/data/india-map.json";
import { plural } from "@/lib/format.ts";

// India's states and union territories as links, from datameet's boundaries (scripts/build-map.mjs), which
// follow the Survey of India map. Rendered on the server; MapHero adds the hover board on top.
export function IndiaMap({ states }: { states: { slug: string; name: string; placeCount: number }[] }) {
  const bySlug = new Map(states.map((s) => [s.slug, s]));
  return (
    <nav aria-label="Map of India: choose a state">
      <svg viewBox={map.viewBox} className="h-auto w-full">
        {map.states.map(({ slug, d }) => {
          const state = bySlug.get(slug);
          if (!state) return null;
          const label = `${state.name}, ${plural(state.placeCount, "place")}`;
          return (
            <Link key={slug} href={`/states/${slug}`} data-state={slug} aria-label={label} prefetch={false} className="group outline-none">
              <title>{state.name}</title>
              <path
                d={d}
                vectorEffect="non-scaling-stroke"
                className="cursor-pointer fill-[var(--map-fill)] stroke-background stroke-1 transition-colors duration-100 group-hover:fill-yellow group-focus-visible:fill-yellow group-focus-visible:stroke-board-ink group-focus-visible:stroke-2 group-aria-[current=true]:fill-yellow group-aria-[current=true]:stroke-board-ink"
              />
            </Link>
          );
        })}
      </svg>
    </nav>
  );
}
