// No imports, so client components can use it without pulling in zod.
// What a place is, for browsing ("Forts in Maharashtra", "Waterfalls"). Categories stay broad (heritage,
// nature, religious, adventure); a place has exactly one kind.
export const KINDS = {
  fort: { one: "Fort", many: "Forts" },
  palace: { one: "Palace", many: "Palaces" },
  monument: { one: "Monument", many: "Monuments and memorials" },
  caves: { one: "Caves", many: "Caves" },
  "place-of-worship": { one: "Temple or shrine", many: "Temples and shrines" },
  museum: { one: "Museum", many: "Museums" },
  beach: { one: "Beach", many: "Beaches" },
  island: { one: "Island", many: "Islands" },
  lake: { one: "Lake", many: "Lakes" },
  dam: { one: "Dam and reservoir", many: "Dams and reservoirs" },
  river: { one: "River and ghats", many: "Rivers and ghats" },
  waterfall: { one: "Waterfall", many: "Waterfalls" },
  trek: { one: "Trek or peak", many: "Treks and peaks" },
  "hill-station": { one: "Hill station", many: "Hill stations" },
  "mountain-pass": { one: "Mountain pass", many: "Ghats and mountain passes" },
  valley: { one: "Valley or plateau", many: "Valleys and plateaus" },
  desert: { one: "Desert", many: "Deserts" },
  "national-park": { one: "National park", many: "National parks and tiger reserves" },
  sanctuary: { one: "Wildlife sanctuary", many: "Wildlife and bird sanctuaries" },
  zoo: { one: "Zoo", many: "Zoos" },
  garden: { one: "Garden", many: "Parks and gardens" },
  neighbourhood: { one: "Neighbourhood", many: "Streets and neighbourhoods" },
  village: { one: "Village", many: "Villages" },
  railway: { one: "Heritage railway", many: "Heritage railways" },
} as const;
export type Kind = keyof typeof KINDS;
export const KIND_SLUGS = Object.keys(KINDS) as [Kind, ...Kind[]];

export const kindLabel = (kind: string, many = false) => (KINDS as Record<string, { one: string; many: string }>)[kind]?.[many ? "many" : "one"] ?? kind;
