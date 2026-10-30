// Adds a photo to every seed place that has none: the lead image of its Wikipedia article, taken from
// Wikimedia Commons only when freely licensed. Saves a 1280px WebP to public/places/ and records the
// photographer, licence and source page in the seed file.
//   node scripts/fetch-photos.ts                 places without photos
//   node scripts/fetch-photos.ts --skip a,b      also leave these places out (see KNOWN_BAD below)
//   node scripts/fetch-photos.ts --only a,b      redo just these places
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import sharp from "sharp";

const { values } = parseArgs({ options: { skip: { type: "string" }, only: { type: "string" } } });
// Lead photos checked by hand and found wrong: a satellite view, or the town an article is about rather than the place.
const KNOWN_BAD = [
  "pangong-tso",
  "naida-caves",
  "moti-daman-fort",
  "kangla-fort",
  "lonavala-khandala",
  "pavana-lake",
  "juhu-beach",
  "byculla-zoo",
];
const skip = new Set([...KNOWN_BAD, ...(values.skip?.split(",") ?? [])]);
const only = values.only ? new Set(values.only.split(",")) : null;
const placesDir = new URL("../data/seed/places/", import.meta.url);
const outDir = new URL("../public/places/", import.meta.url);
mkdirSync(outDir, { recursive: true });

const H = { headers: { "User-Agent": "TravelBharat/0.1 (student project; https://github.com) photo import" } };
const FREE = /^(CC BY(-SA)? [\d.]+|CC0|Public domain|GFDL[\s\d.]*|FAL)$/i;
const strip = (s = "") => s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const json = async (url: string) => (await fetch(url, H)).json();

// Commons author fields are free text; keep just the name.
function cleanCredit(raw: string) {
  const name = raw
    .replace(/s*(talk).*$/, "")
    .replace(/^No machine-readable author provided.s*(.+?)s+assumed.*$/, "$1")
    .replace(/^Original:s*(.+?)s+Derivative work:.*$/, "$1")
    .replace(/s*(photo)s*No machine-readable author provided..*$/, "")
    .replace(/s+Picture provided by.*$/, "")
    .replace(/~commonswiki/g, "")
    .replace(/[.s]+$/, "")
    .trim();
  return name || "Wikimedia Commons contributor";
}

type Image = { url: string; alt: string; credit?: string; license?: string; sourceUrl?: string };
type Place = { slug: string; name: string; city: string; images?: Image[]; sources: { url: string }[] };

async function leadPhoto(title: string) {
  const q = await json(`https://en.wikipedia.org/w/api.php?action=query&format=json&redirects=1&prop=pageimages&piprop=name&titles=${encodeURIComponent(title)}`);
  const file = (Object.values(q.query.pages)[0] as { pageimage?: string }).pageimage;
  if (!file) return null;
  const c = await json(`https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|extmetadata|size|mime&iiurlwidth=1280&titles=${encodeURIComponent("File:" + file)}`);
  type Info = { thumburl: string; descriptionurl: string; mime: string; width: number; extmetadata?: Record<string, { value: string }> };
  const ii = (Object.values(c.query.pages)[0] as { imageinfo?: Info[] }).imageinfo?.[0];
  if (!ii || !/jpeg|png/.test(ii.mime) || ii.width < 800) return null;
  const license = strip(ii.extmetadata?.LicenseShortName?.value);
  if (!FREE.test(license)) return null;
  return { thumb: ii.thumburl.split("?")[0], credit: cleanCredit(strip(ii.extmetadata?.Artist?.value)).slice(0, 100), license, sourceUrl: ii.descriptionurl };
}

let added = 0;
for (const f of readdirSync(placesDir)) {
  const path = new URL(f, placesDir);
  const data = JSON.parse(readFileSync(path, "utf8")) as { cities: { slug: string; name: string }[]; places: Place[] };
  let changed = false;
  for (const p of data.places) {
    if (skip.has(p.slug) || (only ? !only.has(p.slug) : p.images?.length)) continue;
    const wiki = p.sources.find((s) => s.url.includes("en.wikipedia.org/wiki/"));
    if (!wiki) continue;
    const photo = await leadPhoto(decodeURIComponent(wiki.url.split("/wiki/")[1]).replace(/_/g, " "));
    await wait(1000);
    if (!photo) {
      console.log(`no usable photo: ${p.slug}`);
      continue;
    }
    const res = await fetch(photo.thumb, H);
    if (!res.ok) {
      console.log(`download failed (${res.status}): ${p.slug}`);
      await wait(5000);
      continue;
    }
    const file = `${p.slug}.webp`;
    await sharp(Buffer.from(await res.arrayBuffer())).rotate().resize({ width: 1280, withoutEnlargement: true }).webp({ quality: 72 }).toFile(fileURLToPath(new URL(file, outDir)));
    const city = data.cities.find((c) => c.slug === p.city)?.name;
    p.images = [{ url: `/places/${file}`, alt: city && city !== p.name ? `${p.name}, ${city}` : p.name, credit: photo.credit, license: photo.license, sourceUrl: photo.sourceUrl }];
    changed = true;
    added++;
    console.log(`added: ${p.slug} (${photo.license})`);
    await wait(1000);
  }
  if (changed) writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
}
console.log(`${added} photos added.`);
