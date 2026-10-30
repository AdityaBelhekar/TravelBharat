"use cache";
// Read-only queries for the public site. Every function here is cached; the admin panel
// invalidates the "content" tag when anything is published or edited.
import { cacheLife, cacheTag } from "next/cache";
import type { Types } from "mongoose";
import { connectDB } from "./db.ts";
import { escapeRegex } from "./format.ts";
import { Category, City, Place, State, type PlaceDoc, type StateDoc } from "./models.ts";

type Ref = { name: string; slug: string };
type Image = { url: string; alt: string; credit?: string; license?: string; sourceUrl?: string };
export type LocalName = { hi: string; regional?: string; lang?: string; dir?: "rtl" };
type LeanPlace = Omit<PlaceDoc, "state" | "city" | "categories"> & {
  _id: Types.ObjectId;
  state: Ref;
  city: Ref;
  categories: Ref[];
};

export type PlaceCard = {
  slug: string;
  name: string;
  shortDescription: string;
  kind: string;
  categories: Ref[];
  state: Ref;
  city: Ref;
  image?: Image;
  isHiddenGem: boolean;
  distanceKm?: number;
};

const published = { status: "published" } as const;
const populateRefs = [
  { path: "state", select: "name slug -_id" },
  { path: "city", select: "name slug -_id" },
  { path: "categories", select: "name slug -_id" },
];

async function setup() {
  cacheLife("days");
  cacheTag("content");
  await connectDB();
}

type StoredImage = { url: string; alt: string; credit?: string | null; license?: string | null; sourceUrl?: string | null };

function plainImage(image?: StoredImage | null): Image | undefined {
  if (!image) return undefined;
  return {
    url: image.url,
    alt: image.alt,
    credit: image.credit ?? undefined,
    license: image.license ?? undefined,
    sourceUrl: image.sourceUrl ?? undefined,
  };
}

function toCard(p: LeanPlace, distanceKm?: number): PlaceCard {
  return {
    slug: p.slug,
    name: p.name,
    shortDescription: p.shortDescription,
    kind: p.kind,
    categories: p.categories.map(({ name, slug }) => ({ name, slug })),
    state: { name: p.state.name, slug: p.state.slug },
    city: { name: p.city.name, slug: p.city.slug },
    image: plainImage(p.images[0]),
    isHiddenGem: Boolean(p.isHiddenGem),
    ...(distanceKm !== undefined && { distanceKm }),
  };
}

function findCards(filter: object, limit = 0, sort: Record<string, 1 | -1> = { name: 1 }) {
  return Place.find({ ...filter, ...published })
    .sort(sort)
    .limit(limit)
    .populate<{ state: Ref; city: Ref; categories: Ref[] }>(populateRefs)
    .lean<LeanPlace[]>()
    .then((places) => places.map((p) => toCard(p)));
}

function toStateSummary(s: StateDoc & { _id: Types.ObjectId }, placeCount: number) {
  return {
    id: String(s._id),
    name: s.name,
    slug: s.slug,
    type: s.type,
    region: s.region,
    capital: s.capital ?? "",
    famousFor: [...s.famousFor],
    bestTime: s.bestTime ?? "",
    localName: {
      hi: s.localName?.hi ?? s.name,
      ...(s.localName?.regional && { regional: s.localName.regional, lang: s.localName.lang ?? undefined }),
      ...(s.localName?.dir === "rtl" && { dir: "rtl" as const }),
    } as LocalName,
    placeCount,
  };
}
export type StateSummary = ReturnType<typeof toStateSummary>;

async function publishedCountsBy(field: "state" | "city" | "categories") {
  const rows = await Place.aggregate<{ _id: Types.ObjectId; count: number }>([
    { $match: published },
    { $unwind: `$${field}` },
    { $group: { _id: `$${field}`, count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((r) => [String(r._id), r.count]));
}

// ---- Lists ----

export async function getStates(): Promise<StateSummary[]> {
  await setup();
  const [states, counts] = await Promise.all([State.find().sort({ name: 1 }).lean(), publishedCountsBy("state")]);
  return states.map((s) => toStateSummary(s, counts.get(String(s._id)) ?? 0));
}

// For the home page map: each state with a lead photo (featured places first) and a few more place names.
export async function getMapStates() {
  await setup();
  const [states, places] = await Promise.all([
    getStates(),
    Place.find(published, "name slug state isFeatured images").sort({ isFeatured: -1, name: 1 }).lean(),
  ]);
  return states.map((s) => {
    const own = places.filter((p) => String(p.state) === s.id);
    const lead = own.find((p) => p.images.length) ?? own[0];
    return {
      ...s,
      lead: lead && { name: lead.name, slug: lead.slug, image: plainImage(lead.images[0]) },
      others: own.filter((p) => p !== lead).slice(0, 4).map((p) => ({ name: p.name, slug: p.slug })),
    };
  });
}
export type MapState = Awaited<ReturnType<typeof getMapStates>>[number];

export async function getFeaturedPlaces(limit = 8) {
  await setup();
  return findCards({ isFeatured: true }, limit);
}

export async function getHiddenGems(limit = 6) {
  await setup();
  return findCards({ isHiddenGem: true }, limit);
}

// Places at their best this month (in India time). Refreshes daily.
export async function getPlacesForThisMonth(limit = 8) {
  await setup();
  const month = Number(new Intl.DateTimeFormat("en-IN", { month: "numeric", timeZone: "Asia/Kolkata" }).format(new Date()));
  // Prefer places whose season is short and includes this month: they're the most time-sensitive picks.
  const rows = await Place.aggregate([
    { $match: { ...published, bestMonths: month } },
    { $addFields: { seasonLength: { $size: "$bestMonths" } } },
    { $sort: { seasonLength: 1, name: 1 } },
    { $limit: limit },
  ]);
  return { month, places: (await populateRefsOf(rows)).map((p) => toCard(p)) };
}

// Aggregation results come back unpopulated; fill in state, city and category names.
async function populateRefsOf<T extends object>(rows: T[]) {
  return (await Place.populate(rows, populateRefs)) as unknown as (LeanPlace & T)[];
}

export async function getCategories() {
  await setup();
  const [categories, counts] = await Promise.all([Category.find().sort({ name: 1 }).lean(), publishedCountsBy("categories")]);
  return categories.map((c) => ({
    name: c.name,
    slug: c.slug,
    description: c.description ?? "",
    placeCount: counts.get(String(c._id)) ?? 0,
  }));
}

// ---- Detail pages ----

export async function getState(slug: string) {
  await setup();
  const state = await State.findOne({ slug }).lean();
  if (!state) return null;
  const [cities, places] = await Promise.all([
    City.find({ state: state._id }).sort({ name: 1 }).lean(),
    findCards({ state: state._id }),
  ]);
  const cityCounts = new Map<string, number>();
  for (const p of places) cityCounts.set(p.city.slug, (cityCounts.get(p.city.slug) ?? 0) + 1);
  const kindCounts = new Map<string, number>();
  for (const p of places) kindCounts.set(p.kind, (kindCounts.get(p.kind) ?? 0) + 1);
  const featured = new Set((await Place.find({ state: state._id, isFeatured: true, ...published }, "slug").lean()).map((p) => p.slug));
  return {
    ...toStateSummary(state, places.length),
    overview: state.overview ?? "",
    languages: [...state.languages],
    heroImage: plainImage(state.heroImage),
    cities: cities
      .map((c) => ({
        name: c.name,
        slug: c.slug,
        overview: c.overview ?? "",
        isHub: Boolean(c.isHub),
        placeCount: cityCounts.get(c.slug) ?? 0,
      }))
      .filter((c) => c.placeCount > 0 || c.isHub)
      .sort((a, b) => Number(b.isHub) - Number(a.isHub) || b.placeCount - a.placeCount || a.name.localeCompare(b.name)),
    // Featured places with photos first; a state's best-known places.
    topPlaces: places.filter((p) => featured.has(p.slug)).sort((a, b) => Number(Boolean(b.image)) - Number(Boolean(a.image))),
    kinds: [...kindCounts].map(([kind, count]) => ({ kind, count })).sort((a, b) => b.count - a.count),
    places,
  };
}

export async function getCategory(slug: string) {
  await setup();
  const category = await Category.findOne({ slug }).lean();
  if (!category) return null;
  return {
    name: category.name,
    slug: category.slug,
    description: category.description ?? "",
    places: await findCards({ categories: category._id }),
  };
}

export async function getCity(stateSlug: string, citySlug: string) {
  await setup();
  const state = await State.findOne({ slug: stateSlug }, "name slug").lean();
  if (!state) return null;
  const city = await City.findOne({ state: state._id, slug: citySlug }).lean();
  if (!city) return null;
  const [lng, lat] = city.location?.coordinates ?? [];
  const [places, getaways] = await Promise.all([
    findCards({ city: city._id }),
    lng === undefined ? [] : getGetaways(lng, lat),
  ]);
  return {
    name: city.name,
    slug: city.slug,
    overview: city.overview ?? "",
    history: city.history ?? undefined,
    isHub: Boolean(city.isHub),
    state: { name: state.name, slug: state.slug },
    places,
    getaways,
  };
}

export async function getPlace(slug: string) {
  await setup();
  const p = await Place.findOne({ slug, ...published })
    .populate<{ state: Ref; city: Ref; categories: Ref[] }>(populateRefs)
    .lean<LeanPlace>();
  if (!p) return null;
  const [lng, lat] = p.location.coordinates;
  const fee = p.entryFee;
  const hasFee = fee && [fee.indian, fee.foreigner, fee.child, fee.note].some((v) => v !== undefined && v !== null);
  return {
    ...toCard(p),
    description: p.description,
    history: p.history ?? undefined,
    bestMonths: [...p.bestMonths],
    bestTimeNote: p.bestTimeNote ?? undefined,
    entryFee: hasFee
      ? {
          indian: fee.indian ?? undefined,
          foreigner: fee.foreigner ?? undefined,
          child: fee.child ?? undefined,
          note: fee.note ?? undefined,
        }
      : undefined,
    timings: p.timings?.hours ? { hours: p.timings.hours, closedOn: p.timings.closedOn ?? undefined } : undefined,
    lat,
    lng,
    address: p.address ?? "",
    highlights: [...p.highlights],
    images: p.images.map((i) => plainImage(i)!),
    sources: p.sources.map(({ title, url }) => ({ title, url })),
    updatedAt: p.updatedAt.toISOString(),
    nearby: await getNearby(p._id, lng, lat),
  };
}

// Published places within 50 km, nearest first.
async function getNearby(id: Types.ObjectId, lng: number, lat: number) {
  const rows = await Place.aggregate<{ distance: number }>([
    {
      $geoNear: {
        near: { type: "Point", coordinates: [lng, lat] },
        distanceField: "distance",
        maxDistance: 50_000,
        query: { ...published, _id: { $ne: id } },
      },
    },
    { $limit: 6 },
  ]);
  return (await populateRefsOf(rows)).map((p) => toCard(p, Math.round(p.distance / 100) / 10));
}

// Weekend getaways: published places 15–200 km from a city, nearest first, in any state.
async function getGetaways(lng: number, lat: number, limit = 60) {
  const rows = await Place.aggregate<{ distance: number }>([
    {
      $geoNear: {
        near: { type: "Point", coordinates: [lng, lat] },
        distanceField: "distance",
        minDistance: 15_000,
        maxDistance: 200_000,
        query: published,
      },
    },
    { $limit: limit },
  ]);
  return (await populateRefsOf(rows)).map((p) => toCard(p, Math.round(p.distance / 1000)));
}

export type PlaceDetail = NonNullable<Awaited<ReturnType<typeof getPlace>>>;

// ---- Search ----

export type SearchFilters = {
  q?: string;
  state?: string;
  city?: string;
  category?: string;
  kind?: string;
  month?: number;
  gem?: boolean;
  sort?: "relevance" | "name";
  page?: number;
};

const PAGE_SIZE = 24;
// Matches the start of any word, so "jai" finds "Jaipur" and "fort" finds "Amber Fort".
const wordPrefix = (q: string) => new RegExp(`(^|[\\s(-])${escapeRegex(q)}`, "i");

export async function searchPlaces(f: SearchFilters) {
  await setup();
  const none = { places: [] as PlaceCard[], total: 0, page: 1, pages: 0 };
  const filter: Record<string, unknown> = { ...published };
  if (f.state) {
    const state = await State.findOne({ slug: f.state }, "_id").lean();
    if (!state) return none;
    filter.state = state._id;
    if (f.city) {
      const city = await City.findOne({ state: state._id, slug: f.city }, "_id").lean();
      if (!city) return none;
      filter.city = city._id;
    }
  }
  if (f.category) {
    const category = await Category.findOne({ slug: f.category }, "_id").lean();
    if (!category) return none;
    filter.categories = category._id;
  }
  if (f.kind) filter.kind = f.kind;
  if (f.month) filter.bestMonths = f.month;
  if (f.gem) filter.isHiddenGem = true;

  const page = Math.max(1, f.page ?? 1);
  const run = (query: object, sort: Record<string, unknown>, projection: object = {}) =>
    Promise.all([
      Place.countDocuments(query),
      Place.find(query, projection)
        .sort(sort as Record<string, 1>)
        .skip((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .populate<{ state: Ref; city: Ref; categories: Ref[] }>(populateRefs)
        .lean<LeanPlace[]>(),
    ]);

  let [total, rows] = f.q
    ? await run(
        { ...filter, $text: { $search: f.q } },
        f.sort === "name" ? { name: 1 } : { score: { $meta: "textScore" }, name: 1 },
        { score: { $meta: "textScore" } },
      )
    : await run(filter, { name: 1 });
  // Full-text search only matches whole words; fall back to a name prefix match for partial input like "jai".
  if (f.q && total === 0) [total, rows] = await run({ ...filter, name: wordPrefix(f.q) }, { name: 1 });

  return { places: rows.map((p) => toCard(p)), total, page, pages: Math.ceil(total / PAGE_SIZE) };
}

export type Suggestion = { kind: "place" | "city" | "state"; name: string; detail: string; href: string };

// Quick matches for the header search box: places, cities and states with a word starting with `q`.
export async function getSuggestions(q: string): Promise<Suggestion[]> {
  await setup();
  const name = wordPrefix(q);
  const [places, cities, states] = await Promise.all([
    Place.find({ name, ...published }, "name slug city state")
      .sort({ isFeatured: -1, name: 1 })
      .limit(5)
      .populate<{ state: Ref; city: Ref }>(populateRefs.slice(0, 2))
      .lean(),
    City.find({ name }, "name slug state").sort({ name: 1 }).limit(3).populate<{ state: Ref }>("state", "name slug").lean(),
    State.find({ name }, "name slug type").sort({ name: 1 }).limit(3).lean(),
  ]);
  return [
    ...places.map((p) => ({ kind: "place" as const, name: p.name, detail: `${p.city.name}, ${p.state.name}`, href: `/places/${p.slug}` })),
    ...cities.map((c) => ({ kind: "city" as const, name: c.name, detail: c.state.name, href: `/states/${c.state.slug}/${c.slug}` })),
    ...states.map((s) => ({
      kind: "state" as const,
      name: s.name,
      detail: s.type === "ut" ? "Union territory" : "State",
      href: `/states/${s.slug}`,
    })),
  ];
}

// ---- Static params ----

export async function getAllCategorySlugs() {
  await setup();
  return (await Category.find({}, "slug").lean()).map((c) => c.slug);
}

export async function getAllCityParams() {
  await setup();
  const cities = await City.find({}, "slug state").populate<{ state: Ref }>("state", "slug").lean();
  return cities.map((c) => ({ state: c.state.slug, city: c.slug }));
}

// Places with their last-modified date, for sitemap.xml.
export async function getPlacesForSitemap() {
  await setup();
  const places = await Place.find(published, "slug updatedAt").lean();
  return places.map((p) => ({ slug: p.slug, updatedAt: p.updatedAt.toISOString() }));
}

export async function getAllPlaceSlugs() {
  await setup();
  const places = await Place.find(published, "slug").lean();
  return places.map((p) => p.slug);
}
