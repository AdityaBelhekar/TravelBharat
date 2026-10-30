"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { MONTH_NAMES, REGION_LABELS } from "@/lib/format.ts";
import { KINDS } from "@/lib/kinds.ts";
import type { SearchFilters } from "@/lib/queries.ts";

type Option = { name: string; slug: string };

const field = "h-11 rounded border border-border bg-background px-3 text-[0.9375rem] focus:border-foreground";
const label = "flex flex-col gap-1 text-[0.9375rem] font-medium";

// A plain GET form, so it works without JavaScript. With JavaScript, dropdowns apply as soon as they change
// and empty fields are left out of the URL.
export function ExploreFilters({
  values,
  states,
  cities,
  categories,
}: {
  values: SearchFilters;
  states: (Option & { region: string })[];
  cities: Option[];
  categories: Option[];
}) {
  const router = useRouter();
  const ref = useRef<HTMLFormElement>(null);

  // Keep the fields in step with the URL when it changes from outside the form (header search, "Clear filters").
  useEffect(() => {
    const form = ref.current!;
    const v = values as Record<string, unknown>;
    for (const name of ["q", "state", "city", "kind", "category", "month", "sort"]) {
      const el = form.elements.namedItem(name) as HTMLInputElement | null;
      if (el) el.value = String(v[name] ?? "");
    }
    form.gem.checked = Boolean(values.gem);
  }, [values]);

  function apply(form: HTMLFormElement) {
    const params = new URLSearchParams();
    for (const [key, value] of new FormData(form)) if (value) params.set(key, String(value));
    router.push(params.size ? `/explore?${params}` : "/explore", { scroll: false });
  }

  return (
    <form
      ref={ref}
      action="/explore"
      role="search"
      aria-label="Search and filter places"
      onSubmit={(e) => {
        e.preventDefault();
        apply(e.currentTarget);
      }}
      onChange={(e) => {
        const target = e.target as EventTarget as HTMLInputElement;
        if (target.name === "q") return;
        // A city belongs to one state, so changing the state clears it.
        if (target.name === "state" && e.currentTarget.city) e.currentTarget.city.value = "";
        apply(e.currentTarget);
      }}
      className="flex flex-col gap-4 rounded-sm bg-surface p-4 sm:p-5"
    >
      <div className="flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={values.q}
          placeholder="Search forts, beaches, temples, hill stations…"
          aria-label="Search places"
          maxLength={100}
          className={`${field} min-w-0 flex-1 text-base`}
        />
        <button
          type="submit"
          className="h-11 rounded bg-brand px-5 font-semibold text-on-brand hover:opacity-90"
        >
          Search
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
        <div className={label}>
          <label htmlFor="explore-state">State</label>
          <select id="explore-state" name="state" defaultValue={values.state ?? ""} className={field}>
            <option value="">All states</option>
            {Object.entries(REGION_LABELS).map(([region, regionLabel]) => (
              <optgroup key={region} label={regionLabel}>
                {states
                  .filter((s) => s.region === region)
                  .map((s) => (
                    <option key={s.slug} value={s.slug}>
                      {s.name}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div className={label}>
          <label htmlFor="explore-city">City</label>
          <select
            id="explore-city"
            name="city"
            defaultValue={values.city ?? ""}
            disabled={!cities.length}
            className={`${field} disabled:opacity-50`}
          >
            <option value="">{values.state ? "All cities" : "Pick a state first"}</option>
            {cities.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className={label}>
          <label htmlFor="explore-kind">Type</label>
          <select id="explore-kind" name="kind" defaultValue={values.kind ?? ""} className={field}>
            <option value="">All types</option>
            {Object.entries(KINDS).map(([slug, k]) => (
              <option key={slug} value={slug}>
                {k.many}
              </option>
            ))}
          </select>
        </div>
        <div className={label}>
          <label htmlFor="explore-category">Category</label>
          <select id="explore-category" name="category" defaultValue={values.category ?? ""} className={field}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className={label}>
          <label htmlFor="explore-month">Best in</label>
          <select id="explore-month" name="month" defaultValue={values.month ?? ""} className={field}>
            <option value="">Any month</option>
            {MONTH_NAMES.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
        </div>
        {values.q && (
          <div className={label}>
            <label htmlFor="explore-sort">Sort by</label>
            <select id="explore-sort" name="sort" defaultValue={values.sort ?? ""} className={field}>
              <option value="">Best match</option>
              <option value="name">Name (A–Z)</option>
            </select>
          </div>
        )}
        <label className="flex h-11 items-center gap-2 self-end text-sm font-medium">
          <input type="checkbox" name="gem" value="1" defaultChecked={values.gem} className="size-4 accent-brand" />
          Hidden gems only
        </label>
      </div>
    </form>
  );
}
