"use client";

import { useState } from "react";

// The OpenStreetMap embed costs ~450 KB (script and tiles), so it loads only when asked for.
export function MapEmbed({ title, src }: { title: string; src: string }) {
  const [show, setShow] = useState(false);
  return show ? (
    <iframe title={title} src={src} className="mt-3 aspect-[4/3] w-full rounded-sm border border-border" />
  ) : (
    <button
      type="button"
      onClick={() => setShow(true)}
      className="mt-3 grid aspect-[4/3] w-full place-items-center rounded-sm border border-border bg-surface font-medium hover:border-foreground"
    >
      Show map
    </button>
  );
}
