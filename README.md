# TravelBharat

Explore India state by state: a tourism guide to places across all 36 states and union territories, with an admin panel for content moderation. See [PLAN.md](PLAN.md) for the full project plan.

## Run locally

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run seed
npm run create-user -- --email you@example.com --name "Your Name" --role admin
npm run dev
```

Open http://localhost:3000, and http://localhost:3000/admin to sign in.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generate route types and run the TypeScript compiler |
| `npm run seed` | Load `data/seed` into MongoDB (adds new records only; never overwrites admin edits) |
| `npm run seed -- --update` | Overwrite existing records with the seed data |
| `npm run seed:check` | Validate the seed data without a database (runs in CI) |
| `npm run create-user -- --email … --name "…" --role admin` | Create an admin or editor, or reset their password (asks for it, or reads `USER_PASSWORD`) |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | End-to-end tests (Playwright). Set `E2E_BASE_URL` to test a running server, or build first and it starts one. Needs `E2E_ADMIN_*` and `E2E_EDITOR_*` accounts |

## Seed data

Content lives in `data/seed/`: `categories.json`, `states.json` (all 28 states and 8 UTs), and one file per state in `places/` holding that state's cities and places. Places are inserted with status `review`; an admin publishes them once images are added and the details are verified.

## Admin panel

`/admin` is for signed-in users only. **Editors** create places and submit them for review; **admins** approve or send them back with a note, publish, unpublish and delete, and manage states, cities, categories and users. A place can only be published once it has at least one photo and one source. Publishing updates the public site immediately.

- Photos upload straight from the browser to Cloudinary when the `CLOUDINARY_*` variables are set. Without them, the editor accepts image URLs from Cloudinary or Wikimedia Commons only (the hosts `next/image` allows).
- Sign-in uses a signed, httpOnly cookie (`AUTH_SECRET`), passwords are hashed with scrypt, and failed sign-ins are limited to 5 per 15 minutes per IP and email.

## Photos

Place photos are the lead images of each place's Wikipedia article, taken from Wikimedia Commons only when freely licensed (CC BY, CC BY-SA, public domain and similar). `scripts/fetch-photos.ts` saves each one as a 1280px WebP in `public/places/` and records the photographer, licence and Commons page in the seed data; every place page shows that credit. Photos were checked by hand, and wrong ones are listed in the script's `KNOWN_BAD` so they are never re-imported.

```bash
node scripts/fetch-photos.ts                # places that have no photo yet
node scripts/fetch-photos.ts --only slug    # redo one place
```

## Design

The visual design (the platform-board idea, colours, type and layout) is documented in [DESIGN.md](DESIGN.md).

## India map

`data/india-map.json` holds the home page map. It is generated from [datameet's state boundaries](https://github.com/datameet/maps/tree/master/States) (`States/Admin2.*`, which follow the Survey of India map). Only regenerate it from that source:

```bash
npx mapshaper -i Admin2.shp -proj '+proj=lcc +lat_1=12.47 +lat_2=35.17 +lat_0=24 +lon_0=80 +datum=WGS84 +units=m' -simplify 0.4% keep-shapes -o india.json format=geojson
node scripts/build-map.mjs india.json data/seed/states.json data/india-map.json
```

## Stack

Next.js (App Router, TypeScript), Tailwind CSS, MongoDB Atlas (Mongoose), Cloudinary, deployed on Vercel.
