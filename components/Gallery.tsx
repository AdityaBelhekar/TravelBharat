"use client";

import Image from "next/image";
import { useRef, useState } from "react";

type GalleryImage = { url: string; alt: string; credit?: string; license?: string; sourceUrl?: string };

// Photo grid that opens a full-screen lightbox (native <dialog>: Esc closes, focus is trapped).
export function Gallery({ images }: { images: GalleryImage[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);
  const current = images[index];
  const go = (step: number) => setIndex((i) => (i + step + images.length) % images.length);
  const open = (i: number) => {
    setIndex(i);
    dialog.current?.showModal();
  };

  return (
    <>
      <div className="grid h-72 grid-cols-4 grid-rows-2 gap-1.5 overflow-hidden rounded-sm sm:h-[32rem]">
        {images.slice(0, 5).map((img, i) => (
          <button
            key={img.url}
            type="button"
            onClick={() => open(i)}
            className={`relative ${i === 0 ? "col-span-4 row-span-2 sm:col-span-2" : "hidden sm:block"} ${
              images.length === 1 ? "sm:col-span-4" : ""
            }`}
            aria-label={`View photo ${i + 1} of ${images.length}: ${img.alt}`}
          >
            <Image
              src={img.url}
              alt={img.alt}
              fill
              priority={i === 0}
              quality={i === 0 ? 75 : 60}
              sizes={i === 0 ? "(min-width: 640px) 50vw, 100vw" : "25vw"}
              className="object-cover transition-opacity hover:opacity-90"
            />
            {i === 4 && images.length > 5 && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-lg font-semibold text-white">
                +{images.length - 5} more
              </span>
            )}
          </button>
        ))}
      </div>
      {images[0]?.credit && (
        <p className="type-small-print mt-2 text-xs text-muted">
          Photos from Wikimedia Commons. First photo by {images[0].credit}
          {images[0].license && `, ${images[0].license}`}. Open a photo for its credit.
        </p>
      )}
      {images.length > 1 && (
        <button type="button" onClick={() => open(0)} className="mt-2 font-medium underline underline-offset-4 sm:hidden">
          View all {images.length} photos
        </button>
      )}

      <dialog
        ref={dialog}
        onClick={(e) => e.target === dialog.current && dialog.current.close()}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(1);
          if (e.key === "ArrowLeft") go(-1);
        }}
        className="m-auto max-h-none max-w-none bg-transparent p-0 backdrop:bg-black/90"
        aria-label="Photo viewer"
      >
        {current && (
          <figure className="flex h-dvh w-screen flex-col items-center justify-center gap-3 p-4">
            <div className="relative h-full max-h-[80vh] w-full max-w-5xl">
              <Image src={current.url} alt={current.alt} fill sizes="100vw" className="object-contain" />
            </div>
            <figcaption className="text-center text-sm text-white/80">
              {current.alt}
              {current.credit && <span className="type-small-print block text-xs text-white/60">Photo: {current.credit}{current.license && ` (${current.license})`}</span>}
            </figcaption>
            <div className="flex items-center gap-4 text-white">
              {images.length > 1 && (
                <button type="button" onClick={() => go(-1)} className="rounded bg-white/10 px-4 py-2 hover:bg-white/20" aria-label="Previous photo">
                  ←
                </button>
              )}
              <span className="text-sm">
                {index + 1} / {images.length}
              </span>
              {images.length > 1 && (
                <button type="button" onClick={() => go(1)} className="rounded bg-white/10 px-4 py-2 hover:bg-white/20" aria-label="Next photo">
                  →
                </button>
              )}
              <button type="button" onClick={() => dialog.current?.close()} className="rounded bg-white/10 px-4 py-2 hover:bg-white/20">
                Close
              </button>
            </div>
          </figure>
        )}
      </dialog>
    </>
  );
}
