import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ExploreFilters } from "@/components/ExploreFilters.tsx";
import { PlaceCardGrid } from "@/components/PlaceCard.tsx";
import { plural } from "@/lib/format.ts";
import { KIND_SLUGS } from "@/lib/kinds.ts";
import { getCategories, getState, getStates, searchPlaces, type SearchFilters } from "@/lib/queries.ts";

export const metadata: Metadata = {
  title: "Explore places",
  description: "Search tourist places across India and filter by state, city, category, best month to visit and hidden gems.",
  alternates: { canonical: "/explore" },
};

type Params = Awaited<PageProps<"/explore">["searchParams"]>;

// Query strings are user input: anything malformed is ignored rather than trusted.
function parseFilters(sp: Params): SearchFilters {
  const str = (key: string) => {
    const v = sp[key];
    return (Array.isArray(v) ? v[0] : v)?.trim() || undefined;
  };
  const slug = (key: string) => {
    const v = str(key);
    return v && /^[a-z0-9-]{1,80}$/.test(v) ? v : undefined;
  };
  const int = (key: string, max: number) => {
    const n = Number(str(key));
    return Number.isInteger(n) && n >= 1 && n <= max ? n : undefined;
  };
  const q = str("q")?.slice(0, 100);
  const state = slug("state");
  return {
    q,
    state,
    city: state && slug("city"),
    category: slug("category"),
    kind: (KIND_SLUGS as readonly string[]).find((k) => k === str("kind")),
    month: int("month", 12),
    gem: str("gem") === "1",
    sort: q && str("sort") === "name" ? "name" : undefined,
    page: int("page", 1000),
  };
}

function hrefFor(filters: SearchFilters, page: number) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...filters, page: page > 1 ? page : undefined })) {
    if (value) params.set(key, value === true ? "1" : String(value));
  }
  return params.size ? `/explore?${params}` : "/explore";
}

async function Results({ searchParams }: Pick<PageProps<"/explore">, "searchParams">) {
  const filters = parseFilters(await searchParams);
  const [states, categories, state, result] = await Promise.all([
    getStates(),
    getCategories(),
    filters.state ? getState(filters.state) : null,
    searchPlaces(filters),
  ]);
  const active = Object.entries(filters).some(([key, value]) => key !== "page" && value);
  const pageLink = "inline-flex h-11 items-center rounded border border-border px-4 font-medium hover:border-foreground";

  return (
    <>
      <ExploreFilters
        values={filters}
        states={states.map(({ name, slug, region }) => ({ name, slug, region }))}
        cities={state?.cities ?? []}
        categories={categories}
      />

      <div className="mt-8 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-medium text-muted" aria-live="polite">
          {result.total ? plural(result.total, "place") : "No places match"}
          {filters.q && <> for &ldquo;{filters.q}&rdquo;</>}
        </h2>
        {active && (
          <Link href="/explore" className="font-medium underline decoration-border underline-offset-4 hover:decoration-foreground">
            Clear all filters
          </Link>
        )}
      </div>

      {result.total > 0 ? (
        <div className="mt-4">
          <PlaceCardGrid places={result.places} />
        </div>
      ) : (
        <div className="mt-4 border-y border-border py-10">
          <p className="font-medium">Nothing found.</p>
          <p className="mt-1 text-sm text-muted">Try fewer filters, another spelling, or browse a state instead.</p>
        </div>
      )}

      {result.pages > 1 && (
        <nav aria-label="Pages" className="mt-10 flex items-center justify-center gap-3">
          {result.page > 1 && (
            <Link href={hrefFor(filters, result.page - 1)} className={pageLink}>
              Previous page
            </Link>
          )}
          <span className="text-sm text-muted">
            Page {result.page} of {result.pages}
          </span>
          {result.page < result.pages && (
            <Link href={hrefFor(filters, result.page + 1)} className={pageLink}>
              Next page
            </Link>
          )}
        </nav>
      )}
    </>
  );
}

// Same shape as the filters and first row of results, so nothing jumps when they stream in.
function ResultsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading places" className="animate-pulse">
      <div className="h-[19rem] rounded-sm bg-surface sm:h-[14.25rem] lg:h-[10.75rem]" />
      <div className="mt-8 h-7 w-32 rounded-sm bg-surface" />
      <div className="mt-4 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="aspect-[4/5] rounded-sm bg-surface" />
        ))}
      </div>
    </div>
  );
}

export default function ExplorePage(props: PageProps<"/explore">) {
  return (
    <div className="mx-auto w-full max-w-[77.5rem] px-4 pt-10 sm:px-6 sm:pt-14">
      <h1 className="type-title text-[clamp(2.5rem,5.5vw,4rem)]">Explore India</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">
        Search every place on TravelBharat, or narrow it down by state, category and the month you plan to travel.
      </p>
      <div className="mt-8">
        <Suspense fallback={<ResultsSkeleton />}>
          <Results searchParams={props.searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
