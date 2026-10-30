import type { Metadata } from "next";
import Link from "next/link";
import { StateBoard } from "@/components/StateBoard.tsx";
import { REGION_LABELS, plural } from "@/lib/format.ts";
import { getStates } from "@/lib/queries.ts";

export const metadata: Metadata = {
  title: "States and Union Territories",
  description: "Browse tourist places in all 28 states and 8 union territories of India, grouped by region.",
  alternates: { canonical: "/states" },
};

export default async function StatesPage() {
  const states = await getStates();

  return (
    <div className="mx-auto w-full max-w-[77.5rem] px-4 pt-10 sm:px-6 sm:pt-14">
      <h1 className="type-title text-[clamp(2.5rem,5.5vw,4rem)]">States and union territories</h1>
      <p className="mt-3 max-w-[60ch] text-muted">
        India has 28 states and 8 union territories, each with its own landscapes, languages and traditions. Every board
        shows the name as it is written there.
      </p>

      {Object.entries(REGION_LABELS).map(([region, label]) => {
        const inRegion = states.filter((s) => s.region === region);
        return (
          <section key={region} className="mt-14" aria-labelledby={`region-${region}`}>
            <h2 id={`region-${region}`} className="type-section mb-5 border-b border-border pb-3 text-[1.75rem]">
              {label}
            </h2>
            <ul className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
              {inRegion.map((s) => (
                <li key={s.slug}>
                  <Link href={`/states/${s.slug}`} className="group grid gap-2.5">
                    <StateBoard name={s.name} localName={s.localName} size="sm" />
                    <span className="flex flex-wrap justify-between gap-x-3 text-[0.9375rem] text-muted">
                      <span>
                        {s.type === "ut" ? "Union territory" : "State"}, capital {s.capital}
                      </span>
                      <span className="font-medium text-foreground group-hover:underline group-hover:underline-offset-4">
                        {plural(s.placeCount, "place")}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
