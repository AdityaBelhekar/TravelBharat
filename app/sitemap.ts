import type { MetadataRoute } from "next";
import { SITE_URL } from "@/components/JsonLd.tsx";
import { getAllCategorySlugs, getAllCityParams, getPlacesForSitemap, getStates } from "@/lib/queries.ts";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [states, cities, categories, places] = await Promise.all([
    getStates(),
    getAllCityParams(),
    getAllCategorySlugs(),
    getPlacesForSitemap(),
  ]);
  const url = (path: string) => new URL(path, SITE_URL).href;
  return [
    { url: url("/"), priority: 1 },
    { url: url("/states"), priority: 0.8 },
    { url: url("/explore"), priority: 0.6 },
    { url: url("/about"), priority: 0.3 },
    ...categories.map((c) => ({ url: url(`/categories/${c}`), priority: 0.6 })),
    ...states.map((s) => ({ url: url(`/states/${s.slug}`), priority: 0.8 })),
    ...cities.map((c) => ({ url: url(`/states/${c.state}/${c.city}`), priority: 0.6 })),
    ...places.map((p) => ({ url: url(`/places/${p.slug}`), lastModified: p.updatedAt, priority: 0.7 })),
  ];
}
