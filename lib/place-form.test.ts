import { describe, expect, it } from "vitest";
import { completeness, placeFromForm, slugify } from "./place-form.ts";
import { placeSchema, publishablePlaceSchema } from "./validators.ts";

function form(fields: Record<string, string | string[]>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) for (const v of [value].flat()) fd.append(key, v);
  return fd;
}

const base = {
  name: "Amber Fort",
  state: "rajasthan",
  city: "jaipur",
  kind: "fort",
  categories: ["heritage"],
  shortDescription: "A hilltop fort-palace.",
  description: "Long description.",
  bestMonths: ["10", "11"],
  lat: "26.9855",
  lng: "75.8513",
  address: "Amer, Jaipur",
};
const image = JSON.stringify([{ url: "https://upload.wikimedia.org/a.jpg", alt: "The fort" }]);

describe("slugify", () => {
  it("makes URL-safe slugs", () => {
    expect(slugify("Dzükou Valley")).toBe("dzukou-valley");
    expect(slugify("  Golden Temple (Harmandir Sahib) ")).toBe("golden-temple-harmandir-sahib");
  });
});

describe("placeFromForm", () => {
  it("builds a valid place and fills the slug from the name", () => {
    const place = placeFromForm(form({ ...base, highlights: "Sheesh Mahal\n\n Ganesh Pol ", sources: "Wikipedia | https://en.wikipedia.org/wiki/Amber_Fort" }));
    expect(place.slug).toBe("amber-fort");
    expect(place.highlights).toEqual(["Sheesh Mahal", "Ganesh Pol"]);
    expect(place.sources).toEqual([{ title: "Wikipedia", url: "https://en.wikipedia.org/wiki/Amber_Fort" }]);
    expect(place.bestMonths).toEqual([10, 11]);
    expect(place.entryFee).toBeUndefined();
    expect(placeSchema.safeParse(place).success).toBe(true);
  });

  it("keeps a fee of 0 (free) but drops empty fee fields", () => {
    const place = placeFromForm(form({ ...base, "fee.indian": "0", "fee.foreigner": "" }));
    expect(place.entryFee).toEqual({ indian: 0, foreigner: undefined, child: undefined, note: undefined });
  });
});

describe("publishing rules", () => {
  it("rejects a place with no photo or no source", () => {
    const noPhoto = placeFromForm(form({ ...base, sources: "Wikipedia | https://en.wikipedia.org/wiki/Amber_Fort" }));
    const noSource = placeFromForm(form({ ...base, images: image }));
    expect(publishablePlaceSchema.safeParse(noPhoto).success).toBe(false);
    expect(publishablePlaceSchema.safeParse(noSource).success).toBe(false);
    const ready = placeFromForm(form({ ...base, images: image, sources: "Wikipedia | https://en.wikipedia.org/wiki/Amber_Fort" }));
    expect(publishablePlaceSchema.safeParse(ready).success).toBe(true);
  });

  it("only accepts images from configured hosts", () => {
    const place = placeFromForm(form({ ...base, images: JSON.stringify([{ url: "https://example.com/a.jpg", alt: "x" }]) }));
    expect(placeSchema.safeParse(place).success).toBe(false);
  });

  it("accepts imported photos stored in public/places", () => {
    const local = JSON.stringify([{ url: "/places/amber-fort.webp", alt: "Amber Fort", sourceUrl: "https://commons.wikimedia.org/wiki/File:X.jpg" }]);
    expect(placeSchema.safeParse(placeFromForm(form({ ...base, images: local }))).success).toBe(true);
    const outside = JSON.stringify([{ url: "/etc/passwd", alt: "x" }]);
    expect(placeSchema.safeParse(placeFromForm(form({ ...base, images: outside }))).success).toBe(false);
  });

  it("requires a known type of place", () => {
    expect(placeSchema.safeParse(placeFromForm(form({ ...base, kind: "castle" }))).success).toBe(false);
    expect(placeSchema.safeParse(placeFromForm(form({ ...base, kind: "" }))).success).toBe(false);
  });

  it("rejects coordinates outside India", () => {
    expect(placeSchema.safeParse(placeFromForm(form({ ...base, lat: "51.5", lng: "-0.12" }))).success).toBe(false);
  });
});

describe("completeness", () => {
  it("scores and lists what's missing", () => {
    const empty = { images: [], sources: [], bestMonths: [], highlights: [] };
    expect(completeness(empty)).toMatchObject({ score: 0 });
    const full = completeness({
      images: [1, 2, 3],
      sources: [1],
      description: "x".repeat(300),
      history: "Built in 1592.",
      bestMonths: [10],
      timings: { hours: "8–5" },
      entryFee: { indian: 0 },
      highlights: ["a", "b", "c"],
      address: "Amer",
    });
    expect(full).toEqual({ score: 100, missing: [] });
  });
});
