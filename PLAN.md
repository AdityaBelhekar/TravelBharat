# TravelBharat: Project Plan

**Explore India state by state.** A fast, SEO-friendly tourism encyclopedia covering all 36 states and union territories, with an admin panel where content is checked before it goes live.

---

## 1. What we're building (and what makes it stand out)

| Must-have (from the brief) | How we go beyond it |
|---|---|
| State and city listings | **Clickable India map** on the home page: tap a state to open its page |
| Destination detail pages | **Nearby attractions worked out automatically** with a geo query (places within 50 km), so no one has to link them by hand |
| Search and filter (state, city, category) | **"Where to go in ___?" month filter**, built from each place's best months to visit |
| Image gallery | Lightbox gallery with credited, CC-licensed images, served optimized (AVIF/WebP) |
| Admin CRUD | **Moderation workflow** (Draft, In Review, Published) with a source and the verifier's name on every place. This is how we back the "≥95% accuracy" KPI |
| Promote lesser-known places | A **"Hidden Gems"** flag with its own section on the home page and state pages |
| SEO-friendly | Static or ISR pages, clean slugs, `sitemap.xml`, Open Graph tags, `TouristAttraction` JSON-LD |
| Scalable base for bookings | A versioned, read-only public REST API (`/api/v1/...`) that a future booking service can call |

**Out of scope (phase 1):** bookings, payments, user accounts for travellers, reviews, multilingual content.

---

## 2. Tech stack (decided)

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 16 (App Router) + TypeScript** | One codebase handles server-side rendering and static pages (needed for SEO and the ≤2 s load target), API routes and server actions. The backend is still Node.js. |
| Styling | **Tailwind CSS** + a few headless components (Radix or shadcn/ui) | Fast to build with, responsive by default, small CSS bundle |
| Database | **MongoDB Atlas (free M0) + Mongoose** | Content has flexible fields; built-in **text index** for search and **2dsphere index** for nearby places |
| Images | **Cloudinary (free tier)** + `next/image` | Signed uploads from the admin panel; automatic format and quality (`f_auto,q_auto`) and resizing |
| Maps | Custom **India SVG** (state picker) + **Leaflet / OpenStreetMap** (place pin) | No Google Maps API key or billing. Every place still gets a "Open in Google Maps" link |
| Admin auth | Credentials (bcrypt) and a signed JWT in an **httpOnly cookie** (`jose`), checked in middleware **and** in every server action | Simple, secure, no third-party auth service |
| Validation | **Zod** | The same schemas validate admin forms, server actions and the API |
| Testing | **Vitest** (unit) + **Playwright** (end-to-end smoke tests) | |
| Deployment | **Vercel** + Atlas + Cloudinary, CI on **GitHub Actions** | All free tiers; every pull request gets a preview URL |
| Analytics | **Vercel Speed Insights** (load-time KPI) + **Google Analytics 4** or Umami (monthly users, engagement, bounce) | Measures the KPIs in the brief |

> The brief suggests a separate Express backend. Next.js route handlers already run on Node and cover everything here, so a second server would only add deployment work. If the evaluator requires Express by name, the Mongoose models and Zod schemas in `lib/` can be moved into an `/server` Express app without changes.

---

## 3. Data model

```
State 1──* City 1──* Place *──* Category
                       │
                       └── images[], location (GeoJSON point), status, sources[]
User (admin | editor)
```

### State
| Field | Type | Notes |
|---|---|---|
| name, slug | string | `slug` is unique, e.g. `rajasthan` |
| type | `state` \| `ut` | 28 states + 8 UTs |
| region | `north` \| `south` \| `east` \| `west` \| `central` \| `northeast` \| `islands` | Used to group states on the listing page |
| capital, languages[] | string | |
| overview | markdown | |
| famousFor[] | string[] | e.g. "Forts", "Desert safari" |
| bestTime | string | General season for the state |
| heroImage | Image | |
| mapPathId | string | Id of this state's shape in the India SVG |

### City
`name`, `slug` (unique within the state), `state` (ref), `overview`, `location` (Point), `heroImage`.

### Place (the core entity)
| Field | Type | Notes |
|---|---|---|
| name, slug | string | `slug` is unique across the site, e.g. `amber-fort-jaipur` |
| state, city | ref | |
| categories[] | ref Category | Heritage, Nature, Religious, Adventure (admins can add more) |
| shortDescription | string (≤160 chars) | Shown on cards and used as the meta description |
| description | markdown | Overview |
| history | markdown | Historical significance |
| bestMonths[] | number[] 1–12 | Powers the month filter |
| bestTimeNote | string | e.g. "Oct–Mar; avoid the summer heat" |
| entryFee | `{ indian, foreigner, child, note }` | Optional |
| timings | `{ open, close, closedOn, note }` | Optional |
| location | GeoJSON Point + `address` + `mapUrl` | Has a `2dsphere` index |
| images[] | `{ url, publicId, alt, credit, license }` | At least 1 required before publishing; at most 12 |
| highlights[] | string[] | Key attractions, shown visually on the page |
| isFeatured, isHiddenGem | boolean | |
| status | `draft` \| `review` \| `published` | Only `published` is visible to the public |
| sources[] | `{ title, url }` | At least 1 required before publishing |
| verifiedBy, verifiedAt | ref User, date | Set when an admin approves the place |
| createdBy, updatedBy, timestamps | | |

**Indexes:** text index on `name` (weight 10), `shortDescription` and `description`; `2dsphere` on `location`; compound index on `{status, state, categories}`; unique index on `slug`.

**Nearby attractions:** `$near` query within 50 km of the place, published places only, excluding the place itself, limit 6. This is computed when the page is built, so it costs nothing at request time.

### Category
`name`, `slug`, `icon`, `description`. Seeded with heritage, nature, religious and adventure.

### User
`name`, `email` (unique), `passwordHash`, `role` (`admin` \| `editor`), `active`.
- **Editor:** creates and edits places, submits them for review.
- **Admin:** everything an editor can do, plus publish, unpublish, delete, and manage users, states and categories.

---

## 4. Pages and routes

### Public site
| Route | Contents | Rendering |
|---|---|---|
| `/` | Hero with search, clickable India map, featured places, Hidden Gems, category tiles, "Where to go this month" | ISR |
| `/states` | All 36 states and UTs, grouped by region, with a State/UT toggle | SSG |
| `/states/[state]` | Hero, overview, quick facts, cities, places with category chips, Hidden Gems | SSG + ISR |
| `/states/[state]/[city]` | City overview and its places | SSG + ISR |
| `/places/[place]` | Gallery and lightbox, overview, history, best time, fees and timings, highlights, Leaflet map, nearby places, sources, breadcrumbs, JSON-LD | SSG + ISR |
| `/explore` | Search plus filters for state, city, category, month and Hidden Gems; sort; pagination. Filters live in the URL so results can be shared | Server-rendered on each request |
| `/categories/[category]` | Places in one category, filterable by state | ISR |
| `/about` | Mission, how content is verified, image credits | Static |
| `sitemap.xml`, `robots.txt`, `not-found` | | Generated |

Publishing in the admin panel calls `revalidatePath()`, so public pages update in seconds without a rebuild.

### Admin panel (`/admin`, login required)
| Route | Contents |
|---|---|
| `/admin/login` | Email and password, rate-limited (5 attempts per 15 minutes per IP and email) |
| `/admin` | Dashboard: counts by status, review queue, recently updated places, **content health** (places missing images, sources or coordinates; states with fewer than 3 places) |
| `/admin/places` | Table with search, filters for status, state and category, and bulk publish or unpublish |
| `/admin/places/new`, `/admin/places/[id]` | Tabbed form (Basics, Content, Visit info, Location, Media, Sources). Includes a **map pin picker**, drag-and-drop image upload with reordering and alt text, a markdown preview and a **completeness score** |
| `/admin/review` | Places waiting for an admin: approve (records who verified it and when) or reject with a note |
| `/admin/states`, `/admin/cities`, `/admin/categories` | Create, edit and delete |
| `/admin/users` | Admin only: invite, change role, deactivate |

### Public REST API (read-only, versioned)
```
GET /api/v1/states                     list of states
GET /api/v1/states/:slug               one state with its cities
GET /api/v1/places?q=&state=&city=&category=&month=&gem=&page=&limit=
GET /api/v1/places/:slug               one place with nearby places
GET /api/v1/categories
```
Responses are cached at the edge (`s-maxage=300, stale-while-revalidate`). Admin changes go through **server actions**, not this API.

---

## 5. Folder structure

```
travelbharat/
├─ app/
│  ├─ (public)/            page.tsx, states/, places/, explore/, categories/, about/
│  ├─ admin/               login/, (protected)/places, review, states, cities, categories, users
│  ├─ api/v1/              states/, places/, categories/
│  ├─ sitemap.ts, robots.ts, not-found.tsx, layout.tsx
├─ components/             ui/ (buttons, cards, chips), IndiaMap, Gallery, PlaceCard, Filters, MapView, admin/*
├─ lib/
│  ├─ db.ts                cached Mongoose connection
│  ├─ models/              State, City, Place, Category, User
│  ├─ validators.ts        Zod schemas (one source of truth)
│  ├─ auth.ts              hashing, JWT signing, requireRole()
│  ├─ queries.ts           all read queries (used by pages and the API)
│  └─ actions/             server actions for admin changes
├─ data/seed/              states.json, cities.json, places.json, categories.json
├─ scripts/seed.ts         safe to run repeatedly (upserts by slug)
├─ public/india.svg
├─ tests/                  unit/*.test.ts, e2e/*.spec.ts
├─ middleware.ts           protects /admin/*
├─ docs/                   PRD.md, screenshots/
└─ .env.example            MONGODB_URI, JWT_SECRET, CLOUDINARY_*, NEXT_PUBLIC_SITE_URL
```

---

## 6. Content plan (the largest piece of work)

- **Target for launch:** 36 states and UTs, about 90 cities, **150–200 places**. Every state gets at least 3 places, including at least 1 Hidden Gem where possible.
- **Sources:** Incredible India, official state tourism sites, ASI (Archaeological Survey of India) for entry fees and timings, and Wikipedia for history. Write descriptions in our own words; do not copy text. Store each source URL in `sources[]`.
- **Images:** Wikimedia Commons (CC BY / CC BY-SA, with credit and license stored for each image) and Unsplash. **Do not use images from Incredible India or other copyrighted sites.**
- **Map:** build the state SVG from datameet's India GeoJSON, which follows the official Survey of India boundaries including J&K and Ladakh, simplified with mapshaper. Using an incorrect boundary would be a serious problem for an Indian government-adjacent project.
- **Workflow:** write the seed data as JSON, then run `npm run seed`. Every seeded place starts as `review` and is published from the review queue. This is a real demonstration of the moderation workflow.

---

## 7. Non-functional targets

| Requirement | How we meet it |
|---|---|
| Load time ≤ 2 s | Static/ISR HTML from the CDN; `next/image` with Cloudinary; fonts via `next/font`; map and Leaflet loaded lazily. Target **Lighthouse ≥ 90** on all four scores, LCP < 2 s on mobile 4G |
| Responsive | Designed mobile-first; tested at 360, 768, 1024 and 1440 px widths |
| SEO | `generateMetadata` on every page, canonical URLs, Open Graph images, JSON-LD (`TouristAttraction`, `BreadcrumbList`), sitemap, readable slugs |
| Accessibility | Semantic HTML, alt text required on every uploaded image, keyboard-usable map and gallery, WCAG AA colour contrast |
| Admin security | bcrypt (cost 12); httpOnly, Secure, SameSite=Lax cookie; role check inside every server action; Zod on all input; markdown rendered without raw HTML (no XSS); signed Cloudinary uploads; login rate limit; security headers (CSP, X-Frame-Options); secrets only in environment variables |
| Scalability | Stateless app on Vercel; indexed queries; public API cached at the CDN; data model already has the place ids a booking service would need |

---

## 8. Milestones (about 4 weeks)

| Phase | Work | Done when |
|---|---|---|
| **0. Setup** (days 1–2) | Create the Next.js, TypeScript, Tailwind, ESLint and Prettier project; create Atlas and Cloudinary accounts; set up GitHub Actions (lint, type check, test, build) and Vercel previews | An empty site is deployed on Vercel |
| **1. Data** (days 3–7) | Models, indexes, Zod schemas, seed script; write content for the first 10 states (about 50 places), then the rest alongside phases 2–4 | `npm run seed` fills Atlas |
| **2. Public site** (week 2) | Layout, home page, states list, state page, city page, place page (gallery, Leaflet map, nearby places) | A visitor can go from the home page to a state, then a place |
| **3. Discovery** (weeks 2–3) | `/explore` with full filters and month filter, category pages, clickable India map, header search with suggestions | Every search and filter in the brief works |
| **4. Admin** (week 3) | Auth and middleware, dashboard, place form with uploads and pin picker, review queue, state/city/category management, user management, revalidation on publish | An editor can create a place, an admin approves it, and it appears on the public site |
| **5. Quality** (week 4) | SEO (metadata, JSON-LD, sitemap), performance pass, accessibility pass, responsive QA, Vitest and Playwright tests, finish all 36 states | Lighthouse ≥ 90 and all tests pass in CI |
| **6. Launch** (end of week 4) | Production deploy, analytics, `docs/PRD.md`, README with screenshots, 3-minute demo video, demo admin account for evaluators | Live link and PRD submitted |

---

## 9. Testing

- **Unit tests (Vitest):** Zod schemas (reject a place with no images or no sources at publish time), slug generation, month-filter logic, `requireRole`.
- **End-to-end tests (Playwright):**
  1. Home → click Rajasthan on the map → Amber Fort → gallery opens → nearby places are shown.
  2. `/explore`: filter by Kerala, Nature and December, and the results match.
  3. Admin: log in, create a place, submit it for review, approve it, and it appears on the public site. An editor cannot publish.
- **Manual QA checklist:** phone, tablet and desktop in Chrome, Safari and Firefox; keyboard-only navigation.

---

## 10. KPI measurement

| KPI | Measured with |
|---|---|
| Page load ≤ 2 s | Vercel Speed Insights (real user data) + Lighthouse CI |
| Content accuracy ≥ 95% | Share of published places with ≥1 source and a verifier, plus a monthly spot-check of 20 random places |
| Monthly active users, engagement time, bounce rate | GA4 (or Umami) dashboards |

---

## 11. Future enhancements (designed for, not built)

Google Maps exploration, Hindi and regional languages (`next-intl`; content fields become `{ en, hi }`), itinerary planner, hotel and transport integrations through the `/api/v1` layer, and reviews and ratings (a new `Review` collection; nothing existing changes).

---

## 12. Final deliverables checklist

- [ ] `docs/PRD.md`: full PRD, written from this plan
- [ ] Live public site covering all 36 states and UTs
- [ ] Admin dashboard with moderation workflow
- [ ] Responsive design checked at all four widths
- [ ] Deployed link, demo admin login, README with screenshots, demo video
