import { Category, City, State } from "@/lib/models.ts";
import type { PlaceFormValues } from "./PlaceForm.tsx";

// Options for the place form's dropdowns and checkboxes.
export async function formOptions() {
  const [states, cities, categories] = await Promise.all([
    State.find({}, "name slug").sort({ name: 1 }).lean(),
    City.find({}, "name slug state").sort({ name: 1 }).populate<{ state: { slug: string } }>("state", "slug").lean(),
    Category.find({}, "name slug").sort({ name: 1 }).lean(),
  ]);
  return {
    states: states.map(({ name, slug }) => ({ name, slug })),
    cities: cities.map((c) => ({ name: c.name, slug: c.slug, state: c.state.slug })),
    categories: categories.map(({ name, slug }) => ({ name, slug })),
    uploads: Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET),
  };
}

export const emptyPlace: PlaceFormValues = {
  name: "",
  slug: "",
  state: "",
  city: "",
  kind: "",
  categories: [],
  shortDescription: "",
  description: "",
  history: "",
  bestMonths: [],
  bestTimeNote: "",
  fee: { note: "" },
  timings: { hours: "", closedOn: "" },
  address: "",
  highlights: "",
  images: [],
  isFeatured: false,
  isHiddenGem: false,
  sources: "",
};

type StoredPlace = {
  name: string;
  slug: string;
  state: { slug: string };
  city: { slug: string };
  kind: string;
  categories: { slug: string }[];
  shortDescription: string;
  description: string;
  history?: string | null;
  bestMonths: number[];
  bestTimeNote?: string | null;
  entryFee?: { indian?: number | null; foreigner?: number | null; child?: number | null; note?: string | null } | null;
  timings?: { hours?: string | null; closedOn?: string | null } | null;
  location: { coordinates: number[] };
  address?: string | null;
  highlights: string[];
  images: { url: string; publicId?: string | null; alt: string; credit?: string | null; license?: string | null }[];
  isFeatured?: boolean | null;
  isHiddenGem?: boolean | null;
  sources: { title: string; url: string }[];
};

const opt = <T,>(v: T | null | undefined) => v ?? undefined;

// A stored place, as plain values the form can show.
export function toFormValues(p: StoredPlace): PlaceFormValues {
  return {
    name: p.name,
    slug: p.slug,
    state: p.state.slug,
    city: p.city.slug,
    kind: p.kind,
    categories: p.categories.map((c) => c.slug),
    shortDescription: p.shortDescription,
    description: p.description,
    history: p.history ?? "",
    bestMonths: [...p.bestMonths],
    bestTimeNote: p.bestTimeNote ?? "",
    fee: { indian: opt(p.entryFee?.indian), foreigner: opt(p.entryFee?.foreigner), child: opt(p.entryFee?.child), note: p.entryFee?.note ?? "" },
    timings: { hours: p.timings?.hours ?? "", closedOn: p.timings?.closedOn ?? "" },
    lng: p.location.coordinates[0],
    lat: p.location.coordinates[1],
    address: p.address ?? "",
    highlights: p.highlights.join("\n"),
    images: p.images.map((i) => ({ url: i.url, publicId: opt(i.publicId), alt: i.alt, credit: opt(i.credit), license: opt(i.license) })),
    isFeatured: Boolean(p.isFeatured),
    isHiddenGem: Boolean(p.isHiddenGem),
    sources: p.sources.map((s) => `${s.title} | ${s.url}`).join("\n"),
  };
}
