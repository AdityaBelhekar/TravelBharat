"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { MapState } from "@/lib/queries.ts";
import { StateBoard } from "./StateBoard.tsx";

// The home page hero: the server-rendered map (children) and the board for the state under the pointer or
// keyboard focus. On touch screens the first tap shows a state's board and the second opens it.
export function MapHero({ states, initial, children }: { states: MapState[]; initial: string; children: React.ReactNode }) {
  const [slug, setSlug] = useState(initial);
  const [changed, setChanged] = useState(0);
  const mapRef = useRef<HTMLDivElement>(null);
  const touch = useRef(false);
  const state = states.find((s) => s.slug === slug) ?? states[0];

  useEffect(() => {
    mapRef.current?.querySelectorAll<HTMLElement>("a[data-state]").forEach((a) => a.setAttribute("aria-current", String(a.dataset.state === slug)));
  }, [slug]);

  const pick = (target: EventTarget) => {
    const next = (target as Element).closest<HTMLElement>("a[data-state]")?.dataset.state;
    if (next && next !== slug) {
      setSlug(next);
      setChanged((n) => n + 1);
    }
    return next;
  };

  return (
    <div className="grid gap-x-12 gap-y-8 lg:grid-cols-[7fr_5fr]">
      <div
        ref={mapRef}
        className="mx-auto w-full max-w-[42rem] lg:order-first"
        onPointerDown={(e) => (touch.current = e.pointerType === "touch")}
        onPointerOver={(e) => e.pointerType === "mouse" && pick(e.target)}
        onFocus={(e) => pick(e.target)}
        onClick={(e) => {
          const target = (e.target as Element).closest<HTMLElement>("a[data-state]");
          if (touch.current && target && target.dataset.state !== slug) {
            e.preventDefault();
            pick(target);
          }
        }}
      >
        {children}
      </div>

      <div className="order-first grid content-start gap-5 lg:sticky lg:top-6 lg:order-none">
        <StateBoard
          key={changed}
          name={state.name}
          localName={state.localName}
          size="md"
          className={changed ? "motion-safe:[&_.type-board]:animate-[board-flip_150ms_ease-out]" : ""}
        />
        {state.lead?.image && (
          <Link href={`/places/${state.lead.slug}`} className="group grid gap-2">
            <span className="relative block aspect-[3/2] overflow-hidden rounded-sm bg-surface">
              <Image
                src={state.lead.image.url}
                alt={state.lead.image.alt}
                fill
                priority={slug === initial}
                quality={75}
                sizes="(min-width: 1024px) 34vw, 100vw"
                className="object-cover"
              />
            </span>
            <span className="flex flex-wrap items-baseline justify-between gap-x-4 text-sm text-muted">
              <span className="type-name text-lg text-foreground group-hover:underline group-hover:underline-offset-4">
                {state.lead.name}
              </span>
              {state.lead.image.credit && (
                <span className="type-small-print text-xs">
                  Photo by {state.lead.image.credit}
                  {state.lead.image.license && `, ${state.lead.image.license}`}
                </span>
              )}
            </span>
          </Link>
        )}
        {state.others.length > 0 && (
          <ul aria-label={`More places in ${state.name}`} className="flex flex-wrap gap-x-5 gap-y-1">
            {state.others.map((p) => (
              <li key={p.slug}>
                <Link href={`/places/${p.slug}`} className="underline decoration-border underline-offset-4 hover:decoration-foreground">
                  {p.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap items-end justify-between gap-5">
          <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-1">
            <dt className="text-muted">Best time</dt>
            <dd className="max-w-[26ch]">{state.bestTime}</dd>
            <dt className="text-muted">Places</dt>
            <dd>{state.placeCount}</dd>
          </dl>
          <Link
            href={`/states/${state.slug}`}
            className="inline-flex h-12 items-center rounded bg-brand px-6 font-semibold text-on-brand hover:opacity-90"
          >
            Open {state.name}
          </Link>
        </div>
      </div>
    </div>
  );
}
