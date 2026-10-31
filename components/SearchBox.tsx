"use client";

import Form from "next/form";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import type { Suggestion } from "@/lib/queries.ts";

const KIND_LABELS = { place: "Place", city: "City", state: "State" } as const;

// Header search: submits to /explore, and suggests matching places, cities and states as you type.
// Follows the ARIA combobox pattern (arrow keys move through suggestions, Enter opens one, Escape closes).
export function SearchBox({ className = "" }: { className?: string }) {
  const router = useRouter();
  const id = useId();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{ q: string; items: Suggestion[] }>({ q: "", items: [] });
  const [active, setActive] = useState(-1);
  const [open, setOpen] = useState(false);

  const query = q.trim();
  useEffect(() => {
    if (query.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/v1/search?q=${encodeURIComponent(query)}`, { signal: controller.signal })
        .then((res) => res.json())
        .then((data: { results: Suggestion[] }) => {
          setResults({ q: query, items: data.results });
          setActive(-1);
        })
        .catch(() => {});
    }, 150);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  // Only show suggestions that belong to what's typed now.
  const items = query.length >= 2 && results.q === query ? results.items : [];
  const expanded = open && items.length > 0;

  function go(href: string) {
    setOpen(false);
    setQ("");
    router.push(href);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      const n = items.length;
      if (n) setActive((i) => (e.key === "ArrowDown" ? (i + 1) % n : (i <= 0 ? n : i) - 1));
    } else if (e.key === "Enter" && expanded && active >= 0) {
      e.preventDefault();
      go(items[active].href);
    }
  }

  return (
    <Form action="/explore" role="search" className={`relative ${className}`} onSubmit={() => setOpen(false)}>
      <input
        type="search"
        name="q"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        placeholder="Search places, cities and states"
        aria-label="Search TravelBharat"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={`${id}-list`}
        aria-activedescendant={expanded && active >= 0 ? `${id}-${active}` : undefined}
        autoComplete="off"
        maxLength={100}
        className="h-11 w-full rounded border border-border bg-background px-3.5 text-[0.9375rem] placeholder:text-muted focus:border-foreground"
      />
      <ul
        id={`${id}-list`}
        role="listbox"
        aria-label="Suggestions"
        hidden={!expanded}
        // Keep focus in the input while clicking a suggestion.
        onMouseDown={(e) => e.preventDefault()}
        className="absolute inset-x-0 top-12 z-20 overflow-hidden rounded border border-border bg-background py-1 shadow-[0_8px_24px_-12px_rgb(27_23_20/0.35)]"
      >
        {items.map((item, i) => (
          <li
            key={item.href}
            id={`${id}-${i}`}
            role="option"
            aria-selected={i === active}
            onClick={() => go(item.href)}
            onMouseEnter={() => setActive(i)}
            className="flex cursor-pointer items-baseline justify-between gap-3 border-l-4 border-transparent px-3.5 py-2 aria-selected:border-yellow aria-selected:bg-surface"
          >
            <span className="min-w-0">
              <span className="block truncate font-medium">{item.name}</span>
              <span className="block truncate text-xs text-muted">{item.detail}</span>
            </span>
            <span className="shrink-0 text-xs text-muted">{KIND_LABELS[item.kind]}</span>
          </li>
        ))}
      </ul>
    </Form>
  );
}
