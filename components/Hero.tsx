"use client";

import { getImageProps } from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { LocalName } from "@/lib/queries.ts";
import { StateBoard } from "./StateBoard.tsx";

export type HeroStop = {
  state: string;
  stateName: string;
  localName: LocalName;
  place: string;
  name: string;
  image: string;
  alt: string;
  credit: string;
  license: string;
};

// Opens on the Taj Mahal: its board needs only the Devanagari font, where Ladakh's would add a 200 KB Tibetan one.
const START = 1;
const PHONE = "(max-width: 640px)";

// The home page opening: a journey down India on a rail line. Choosing a stop changes the photo and the station
// board. Photos load only when a stop is first hovered or chosen, so the page starts with just one.
export function Hero({ stops, placeCount }: { stops: HeroStop[]; placeCount: number }) {
  const [active, setActive] = useState(START);
  const [loaded, setLoaded] = useState(() => new Set([START]));
  const load = (i: number) => setLoaded((s) => (s.has(i) ? s : new Set(s).add(i)));
  const stop = stops[active];

  return (
    <section className="relative isolate flex min-h-[max(38rem,calc(100svh-8rem))] sm:min-h-[max(40rem,calc(100svh-4.75rem))] flex-col overflow-hidden bg-board-ink text-white">
      {stops.map((s, i) => {
        if (!loaded.has(i)) return null;
        const { props: wide } = getImageProps({ src: s.image, alt: i === active ? s.alt : "", fill: true, priority: i === START, quality: 75, sizes: "100vw" });
        const phone = s.image.replace("/hero/", "/hero/phone/");
        return (
          // Phones get a portrait crop of about 40 KB rather than the wide photo.
          <picture key={s.place}>
            {i === START && <link rel="preload" as="image" href={phone} media={PHONE} fetchPriority="high" />}
            <source media={PHONE} srcSet={phone} />
            <img {...wide} alt={wide.alt} className={`-z-20 object-cover transition-opacity duration-500 motion-reduce:transition-none ${i === active ? "opacity-100" : "opacity-0"}`} />
          </picture>
        );
      })}
      {/* Keeps white type readable on any photo. */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgb(0_0_0/0.45),transparent_60%),linear-gradient(to_bottom,rgb(0_0_0/0.5),rgb(0_0_0/0.05)_50%,rgb(0_0_0/0.75))]" />

      <div className="mx-auto flex w-full max-w-[77.5rem] flex-1 flex-col px-4 pt-8 sm:px-6 sm:pt-10">
        <h1 className="type-board text-[clamp(4.5rem,20vw,13rem)] normal-case">Next stop?</h1>
        <p className="mt-3 max-w-[36ch] text-lg leading-snug sm:mt-4 sm:text-xl">
          {placeCount} places across all 28 states and 8 union territories of India, with their history and the best months to go.
        </p>
        <Link href="#map" className="mt-5 w-fit font-semibold underline decoration-yellow decoration-2 underline-offset-[6px] hover:text-yellow">
          Find a state on the map
        </Link>

        <div className="mt-auto flex flex-wrap items-end justify-between gap-x-8 gap-y-3 pt-6 sm:pt-10">
          <p aria-live="polite" className="max-w-[44ch] sm:pb-10">
            <Link href={`/places/${stop.place}`} className="type-name text-2xl underline-offset-4 hover:underline">
              {stop.name}
            </Link>
            <span className="type-small-print mt-1 block text-xs text-white/80">
              Photo by {stop.credit}, {stop.license}
            </span>
          </p>
          <Link href={`/states/${stop.state}`} aria-label={`Open ${stop.stateName}`} className="w-full max-w-[34rem] sm:w-[34rem]">
            <StateBoard
              key={stop.state}
              name={stop.stateName}
              localName={stop.localName}
              size="md"
              posts
              className="[&_.type-board]:motion-safe:animate-[board-flip_150ms_ease-out]"
            />
          </Link>
        </div>

        <ol aria-label="Stops on the journey" className="-mx-4 flex overflow-x-auto px-5 pb-5 pt-1.5 sm:-ml-1 sm:mr-0 sm:pl-1 sm:pr-0">
          {stops.map((s, i) => (
            <li
              key={s.place}
              className="relative min-w-[6.5rem] flex-1 before:absolute before:inset-x-0 before:top-[0.6875rem] before:h-1 before:bg-yellow last:before:right-auto last:before:w-3"
            >
              <button
                type="button"
                aria-pressed={i === active}
                onClick={() => {
                  load(i);
                  setActive(i);
                }}
                onPointerEnter={() => load(i)}
                onFocus={() => load(i)}
                className="group relative grid min-h-11 w-full cursor-pointer justify-items-start gap-1.5 pr-2 text-left text-[0.9375rem] font-medium leading-tight"
              >
                <span
                  aria-hidden
                  className={`size-[1.625rem] rounded-full border-4 border-yellow transition-colors group-hover:bg-yellow ${i === active ? "bg-yellow outline-4 outline-white" : "bg-board-ink"}`}
                />
                <span className={i === active ? "font-semibold text-yellow" : ""}>{s.stateName}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
