import { z } from "zod";

export const REGIONS = ["north", "south", "east", "west", "central", "northeast", "islands"] as const;
export const STATE_TYPES = ["state", "ut"] as const;
export const STATUSES = ["draft", "review", "published"] as const;
export const ROLES = ["admin", "editor"] as const;
export type Role = (typeof ROLES)[number];
export type Status = (typeof STATUSES)[number];

export { KINDS, KIND_SLUGS, type Kind } from "./kinds.ts";
import { KIND_SLUGS } from "./kinds.ts";

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens");
const text = (max: number) => z.string().trim().min(1).max(max);

// India's bounding box, including the Andaman & Nicobar and Lakshadweep islands.
const latLng = z.strictObject({
  lat: z.number().min(6).max(37.5),
  lng: z.number().min(68).max(97.5),
});

// Images must come from hosts next/image is configured for (next.config.ts), or public pages would fail.
export const IMAGE_HOSTS = ["res.cloudinary.com", "upload.wikimedia.org"];

export const imageSchema = z.strictObject({
  url: z.union(
    [
      z.url({ protocol: /^https$/, hostname: new RegExp(`^(${IMAGE_HOSTS.join("|").replaceAll(".", "\\.")})$`) }),
      // Photos imported by scripts/fetch-photos.ts live in public/places/.
      z.string().regex(/^\/places\/[a-z0-9-]+\.(webp|jpg|png)$/),
    ],
    { error: `Use an uploaded image or one from ${IMAGE_HOSTS.join(" or ")}` },
  ),
  publicId: z.string().optional(),
  alt: text(150),
  credit: z.string().optional(),
  license: z.string().optional(),
  sourceUrl: z.url().optional(),
});

// A state's name as written on its railway-style board: Hindi, plus the main regional script where it differs.
export const localNameSchema = z.strictObject({
  hi: text(80),
  regional: text(120).optional(),
  lang: z.string().regex(/^[a-z]{2,3}$/).optional(),
  dir: z.literal("rtl").optional(),
});

export const sourceSchema = z.strictObject({ title: text(150), url: z.url() });

export const categorySchema = z.strictObject({
  name: text(50),
  slug,
  description: text(300).optional(),
});

export const stateSchema = z.strictObject({
  name: text(80),
  slug,
  type: z.enum(STATE_TYPES),
  region: z.enum(REGIONS),
  capital: text(100),
  languages: z.array(text(50)).min(1),
  overview: text(2000),
  famousFor: z.array(text(60)).min(1),
  localName: localNameSchema,
  bestTime: text(200),
  heroImage: imageSchema.optional(),
});

// References to other records (state, city, categories) are by slug.
export const citySchema = z.strictObject({
  name: text(80),
  slug,
  state: slug,
  overview: text(1500),
  history: text(3000).optional(),
  // A big city people take weekend trips from; its page lists getaways by distance.
  isHub: z.boolean().optional(),
  location: latLng,
  heroImage: imageSchema.optional(),
});

export const placeSchema = z.strictObject({
  name: text(120),
  slug,
  state: slug,
  city: slug,
  kind: z.enum(KIND_SLUGS),
  categories: z.array(slug).min(1),
  shortDescription: text(160),
  description: text(5000),
  history: text(5000).optional(),
  bestMonths: z.array(z.int().min(1).max(12)).min(1),
  bestTimeNote: text(200).optional(),
  // Fees are in rupees.
  entryFee: z
    .strictObject({
      indian: z.number().min(0).optional(),
      foreigner: z.number().min(0).optional(),
      child: z.number().min(0).optional(),
      note: text(200).optional(),
    })
    .optional(),
  timings: z.strictObject({ hours: text(120), closedOn: text(60).optional() }).optional(),
  location: latLng.extend({ address: text(300) }),
  highlights: z.array(text(120)).max(10).default([]),
  images: z.array(imageSchema).max(12).default([]),
  isFeatured: z.boolean().default(false),
  isHiddenGem: z.boolean().default(false),
  sources: z.array(sourceSchema).default([]),
});

// A place can only go live once it has at least one image and one source.
export const publishablePlaceSchema = placeSchema.extend({
  images: z.array(imageSchema).min(1).max(12),
  sources: z.array(sourceSchema).min(1),
});

export type PlaceInput = z.infer<typeof placeSchema>;
