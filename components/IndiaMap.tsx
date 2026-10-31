import Link from "next/link";
import map from "@/data/india-map.json";
import { plural } from "@/lib/format.ts";

const shape =
  "cursor-pointer fill-[var(--map-fill)] stroke-background stroke-1 transition-colors duration-100 group-hover:fill-yellow group-focus-visible:fill-yellow group-focus-visible:stroke-board-ink group-focus-visible:stroke-2 group-aria-[current=true]:fill-yellow group-aria-[current=true]:stroke-board-ink";

// Territories too small to see or click at this scale get a marker on top of their outline. Lakshadweep's
// islands all but vanish in the simplified boundaries, so its main ones are drawn as dots from their coordinates.
const DOTS: Record<string, [number, number, number][]> = {
  chandigarh: [[308, 246, 7]],
  puducherry: [[406, 966, 7]],
  lakshadweep: [[142, 1100, 5], [166, 1032, 5], [167, 1004, 5], [125, 1013, 5], [108, 1002, 5], [130, 992, 5], [132, 988, 5], [140, 978, 5], [128, 970, 5]],
};

// India's states and union territories as links, from datameet's boundaries (scripts/build-map.mjs), which
// follow the Survey of India map. Rendered on the server; MapHero adds the hover board on top.
export function IndiaMap({ states }: { states: { slug: string; name: string; placeCount: number }[] }) {
  const bySlug = new Map(states.map((s) => [s.slug, s]));
  // Markers go last so the neighbouring states don't paint over them.
  const ordered = [...map.states].sort((a, b) => Number(a.slug in DOTS) - Number(b.slug in DOTS));
  return (
    <nav aria-label="Map of India: choose a state">
      <svg viewBox={map.viewBox} className="h-auto w-full">
        {ordered.map(({ slug, d }) => {
          const state = bySlug.get(slug);
          if (!state) return null;
          const label = `${state.name}, ${plural(state.placeCount, "place")}`;
          return (
            <Link key={slug} href={`/states/${slug}`} data-state={slug} aria-label={label} prefetch={false} className="group outline-none">
              <title>{state.name}</title>
              <path d={d} vectorEffect="non-scaling-stroke" className={shape} />
              {slug === "lakshadweep" && (
                <>
                  <ellipse cx={135} cy={1032} rx={58} ry={84} vectorEffect="non-scaling-stroke" className="cursor-pointer fill-transparent stroke-[var(--map-fill)] stroke-1 [stroke-dasharray:4_4] group-hover:stroke-yellow group-aria-[current=true]:stroke-yellow" />
                  <text x={135} y={1136} textAnchor="middle" fontSize={22} className="cursor-pointer fill-muted group-hover:fill-yellow group-aria-[current=true]:fill-yellow">
                    Lakshadweep
                  </text>
                </>
              )}
              {DOTS[slug]?.map(([cx, cy, r]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} vectorEffect="non-scaling-stroke" className={shape} />)}
            </Link>
          );
        })}
      </svg>
    </nav>
  );
}
