// Helpers for the admin place form. No database or Next.js imports, so they're easy to test.

export const slugify = (text: string) =>
  text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

// Turns the submitted form into the shape placeSchema validates. Blank fields become undefined.
// Sources are one per line as "Title | https://…"; highlights are one per line.
export function placeFromForm(form: FormData) {
  const str = (key: string) => {
    const value = form.get(key);
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
  };
  const num = (key: string) => {
    const value = str(key);
    return value === undefined ? undefined : Number(value);
  };
  const lines = (key: string) =>
    (str(key) ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

  const name = str("name") ?? "";
  const entryFee = { indian: num("fee.indian"), foreigner: num("fee.foreigner"), child: num("fee.child"), note: str("fee.note") };
  const hours = str("timings.hours");
  let images: unknown;
  try {
    images = JSON.parse(str("images") ?? "[]");
  } catch {
    images = "invalid"; // fails validation with a clear message
  }

  return {
    name,
    slug: str("slug") ?? slugify(name),
    state: str("state"),
    city: str("city"),
    kind: str("kind"),
    categories: form.getAll("categories").map(String),
    shortDescription: str("shortDescription"),
    description: str("description"),
    history: str("history"),
    bestMonths: form.getAll("bestMonths").map(Number),
    bestTimeNote: str("bestTimeNote"),
    entryFee: Object.values(entryFee).some((v) => v !== undefined) ? entryFee : undefined,
    timings: hours ? { hours, closedOn: str("timings.closedOn") } : undefined,
    location: { lat: num("lat"), lng: num("lng"), address: str("address") },
    highlights: lines("highlights"),
    images,
    isFeatured: form.get("isFeatured") === "on",
    isHiddenGem: form.get("isHiddenGem") === "on",
    sources: lines("sources").map((line) => {
      const bar = line.lastIndexOf("|");
      return bar < 0 ? { title: line, url: "" } : { title: line.slice(0, bar).trim(), url: line.slice(bar + 1).trim() };
    }),
  };
}

type Checkable = {
  images: unknown[];
  sources: unknown[];
  description?: string | null;
  history?: string | null;
  bestMonths: number[];
  timings?: { hours?: string | null } | null;
  entryFee?: { indian?: number | null; note?: string | null } | null;
  highlights: string[];
  address?: string | null;
};

// How complete a place's content is, and what's missing. Shown to editors and on the dashboard.
export function completeness(place: Checkable) {
  const checks: [string, boolean][] = [
    ["a photo", place.images.length > 0],
    ["3+ photos", place.images.length >= 3],
    ["a source", place.sources.length > 0],
    ["a 300+ character description", (place.description ?? "").length >= 300],
    ["history", Boolean(place.history)],
    ["best months", place.bestMonths.length > 0],
    ["timings", Boolean(place.timings?.hours)],
    ["entry fee", place.entryFee?.indian != null || Boolean(place.entryFee?.note)],
    ["3+ highlights", place.highlights.length >= 3],
    ["an address", Boolean(place.address)],
  ];
  const missing = checks.filter(([, ok]) => !ok).map(([label]) => label);
  return { score: Math.round((100 * (checks.length - missing.length)) / checks.length), missing };
}
