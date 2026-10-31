# TravelBharat design system

## The idea: the platform board

Every railway station in India has the same sign: a yellow board with the station's name in the regional script, in Hindi and in English. It is one of the most recognised pieces of design in the country, and it says exactly what this site is about: arriving somewhere in India.

TravelBharat uses that board as its single bold element. Each state is introduced by its own board, in its own scripts: Kerala as കേരളം, केरल and KERALA, Tamil Nadu as தமிழ்நாடு, तमिलनाडु and TAMIL NADU. Everything around the boards is quiet: white paper, sign-black ink and large real photographs.

## Colour

| Token | Hex | Use |
|---|---|---|
| Board yellow | `#FFC72C` | Station boards, the rail line, the selected state on the map. Never for text on paper. |
| Sign black | `#1B1714` | Text and board lettering: real boards are black on yellow |
| Coach maroon | `#7B1E2B` | Buttons, links and the footer, from Indian Railways coaches |
| Paper | `#FFFFFF` | Page background |
| Platform stone | `#F1EFEA` | Bands behind sections |
| Map stone | `#DFD9CF` | Unselected states on the map |
| Rule | `#DCD7CE` | Hairlines and form borders |
| Slate | `#5F574F` | Secondary text (7:1 on white) |

Categories are map-legend symbols, so they are told apart by shape as well as colour:

| Category | Symbol | Colour |
|---|---|---|
| Heritage | Square | Sandstone `#B4442C` (Red Fort, Fatehpur Sikri) |
| Nature | Triangle | Forest `#24704E` |
| Religious | Circle | Marigold `#B87000` |
| Adventure | Diamond | Peacock `#1F6F8B` |

There is one light theme. Photographs carry the colour, and an earlier indigo dark mode read as a generic template.

## Type

One superfamily: **Anek** by EkType, an Indian type foundry. Anek has matching designs for Latin, Devanagari, Bangla, Gujarati, Gurmukhi, Kannada, Malayalam, Odia, Tamil and Telugu, so a board reading தமிழ்நாடு / तमिलनाडु / TAMIL NADU looks like one sign rather than three fonts. Urdu (Jammu and Kashmir), Tibetan (Ladakh) and Meitei Mayek (Manipur) use the matching Noto designs.

Anek has a width axis, which gives the hierarchy without a second family:

| Role | Width | Weight | Size / leading |
|---|---|---|---|
| Board name | 75 (condensed) | 700, uppercase | fluid 44–96px / 0.95 |
| Page title | 80 | 650 | 40–60px / 1.0 |
| Section title | 85 | 600 | 28–34px / 1.1 |
| Body | 100 | 400 | 17px / 1.6, max 68 characters a line |
| Small print, credits | 100 | 400 | 13px / 1.45 |

Uppercase is used only on boards, because that is how boards are lettered. Headings and labels are sentence case.

## Layout

- 12-column grid, 1240px maximum, 24px gutters, left-aligned text. Boards are centred inside themselves, like the real thing.
- Photographs lead. Place cards are a photo with a caption below. No card borders, no shadows, no gradients.
- Corners: 4px on boards and buttons (enamel signs have softened corners), 2px on photos.
- Sections are separated by space and mist bands, not boxes.

```
Home
┌──────────────────────────────────────────────────────────────┐
│ TravelBharat          [ Search places, cities, states     ] │
├──────────────────────────────────────────────────────────────┤
│ Full-screen photo of the current stop                        │
│ Next stop?                                                   │
│ What the site covers                                         │
│                                     ┌──────────────────────┐ │
│ Place name, photo credit            │ लद्दाख / LADAKH      │ │
│                                     └───┬──────────────┬───┘ │
│ ●━━━━━━●━━━━━━●━━━━━━●━━━━━━●━━━━━━●━━━━━━●━━━━━━●           │
│ Ladakh  UP  Rajasthan  Meghalaya  Goa  Karnataka  Kerala  TN │
├──────────────────────────────────────────────────────────────┤
│ Choose a state on the map      [ board, photo, Open state ] │
├──────────────────────────────────────────────────────────────┤
│ Good in October     [big photo][big photo][big photo] ›     │
├──────────────────────────────────────────────────────────────┤
│ By interest: four photo tiles, one for each category         │
├──────────────────────────────────────────────────────────────┤
│ Featured: one large photo, four smaller beside it           │
└──────────────────────────────────────────────────────────────┘

State page
┌──────────────────────────────────────────────────────────────┐
│ mist band:   ┌────────── board: കേരളം / केरल / KERALA ─────┐ │
│              └─────────────────────────────────────────────┘ │
│ Overview text (68ch)          Capital / Languages / Best time│
│ ■ Heritage 2  ▲ Nature 5  ◆ Adventure 2   (filter)           │
│ [photo]      [photo]      [photo]                            │
│ Fort Kochi   Varkala      Periyar                            │
└──────────────────────────────────────────────────────────────┘
```

## The hero

The home page opens on a rail line across India. Choosing a stop changes the full-screen photo and the board, which stands on two posts at the line. Stops are user-driven with no auto-play, and photos other than the first load only when a stop is hovered, focused or chosen. The photos are 1920px WebP files in `public/hero/`, listed with their credits in `data/hero.json`.

## Motion

Only in response to the visitor: the board's lettering flips (150ms) and the hero photo crossfades when a stop changes, the map board flips as you move across states, and card photos zoom slightly on hover. All of it respects reduced motion, and nothing animates on its own.

## Photography

Real photographs only, from Wikimedia Commons under free licences, with the photographer and licence credited on every place page and in the hero. They are stored in the project as 1280px WebP files (`scripts/fetch-photos.ts`) rather than linked from Wikimedia, which rate-limits hotlinked images. Each one was checked by hand; places without a suitable free photo show a quiet placeholder with their category symbol until one is added in the admin panel. No AI-generated images of real places: an encyclopedia that shows a generated Taj Mahal is showing something that does not exist.

## What this replaces, and why

The first version used a cream background, a high-contrast serif and a terracotta accent, with uppercase labels above headings, pill-shaped chips, cards with shadows and arrows on links. Each of those is a common default that says nothing about India. Every choice above is taken from the subject instead: the railway board, Indian type, map legend symbols and photographs of the actual places.
