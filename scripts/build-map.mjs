// Builds data/india-map.json from datameet's States/Admin2 shapefile (see README, "India map").
// Input is GeoJSON already projected and simplified by mapshaper; output is SVG path data per state slug.
import { readFileSync, writeFileSync } from "node:fs";
const [, , input, statesFile, output] = process.argv;
const geo = JSON.parse(readFileSync(input, "utf8"));
const slugs = new Set(JSON.parse(readFileSync(statesFile, "utf8")).map((s) => s.slug));
const slugify = (n) =>
  ({ "Andaman & Nicobar": "andaman-and-nicobar-islands" })[n] ??
  n.toLowerCase().replace(/&/g, "and").replace(/[^a-z]+/g, "-");

const rings = (g) => (g.type === "Polygon" ? g.coordinates : g.coordinates.flat());
let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
for (const f of geo.features) for (const r of rings(f.geometry)) for (const [x, y] of r) {
  x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
}
const W = 1000, k = W / (x1 - x0), H = Math.round((y1 - y0) * k);
const pt = ([x, y]) => [Math.round((x - x0) * k), Math.round((y1 - y) * k)];

const states = geo.features.map((f) => {
  const slug = slugify(f.properties.ST_NM);
  if (!slugs.has(slug)) throw new Error(`No state for ${f.properties.ST_NM} (${slug})`);
  const d = rings(f.geometry)
    .map((r) => {
      const pts = r.map(pt).filter((p, i, a) => i === 0 || p[0] !== a[i - 1][0] || p[1] !== a[i - 1][1]);
      return pts.length < 3 ? "" : "M" + pts.map((p) => p.join(" ")).join("L") + "Z";
    })
    .join("");
  return { slug, d };
});
if (states.length !== slugs.size) throw new Error(`Expected ${slugs.size} states, got ${states.length}`);
states.sort((a, b) => a.slug.localeCompare(b.slug));
writeFileSync(output, JSON.stringify({ viewBox: `0 0 ${W} ${H}`, states }));
console.log("viewBox", W, H, "bytes", JSON.stringify(states).length);
