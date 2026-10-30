"use client";

import { useState } from "react";
import { kindLabel } from "@/lib/kinds.ts";
import type { PlaceCard } from "@/lib/queries.ts";
import { CategoryLabel } from "./CategorySymbol.tsx";
import { PlaceCardGrid } from "./PlaceCard.tsx";

// Chips that filter a list of places in the browser (no reload, page stays static): by kind (forts,
// beaches…) on state and city pages, by category, or by state on category pages.
export function FilterablePlaces({
  places,
  showState,
  by = "category",
  compact,
}: {
  places: PlaceCard[];
  showState?: boolean;
  compact?: boolean;
  by?: "category" | "state" | "kind";
}) {
  const [active, setActive] = useState<string | null>(null);
  const keysOf = (p: PlaceCard) =>
    by === "state" ? [p.state] : by === "kind" ? [{ slug: p.kind, name: kindLabel(p.kind, true) }] : p.categories;
  const matching = (slug: string) => places.filter((p) => keysOf(p).some((o) => o.slug === slug));
  const options = [...new Map(places.flatMap(keysOf).map((o) => [o.slug, o])).values()].sort((a, b) =>
    by === "kind" ? matching(b.slug).length - matching(a.slug).length : a.name.localeCompare(b.name),
  );
  const shown = active ? matching(active) : places;

  const chip = (slug: string | null, label: React.ReactNode, count: number) => (
    <button
      key={slug ?? "all"}
      type="button"
      aria-pressed={active === slug}
      onClick={() => setActive(slug)}
      className="inline-flex h-10 items-center gap-2 rounded border border-border px-3.5 text-[0.9375rem] font-medium hover:border-foreground aria-pressed:border-foreground aria-pressed:bg-foreground aria-pressed:text-background"
    >
      {label} <span className="opacity-70">{count}</span>
    </button>
  );

  return (
    <div className="flex flex-col gap-6">
      {options.length > 1 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label={`Filter by ${by}`}>
          {chip(null, "All", places.length)}
          {options.map((o) => chip(o.slug, by === "category" ? <CategoryLabel slug={o.slug} name={o.name} /> : o.name, matching(o.slug).length))}
        </div>
      )}
      <PlaceCardGrid places={shown} showState={showState} compact={compact} />
    </div>
  );
}
