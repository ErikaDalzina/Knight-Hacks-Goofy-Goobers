# Umbra

**Find the best place and time to see the stars tonight.**

Umbra rates the stargazing spots in your state for any of the next 7 nights. It combines the live cloud forecast, light pollution at each spot and the moon into one 0–100 score. Then it tells you when to go, as well as where. It also lists the meteor showers and new moons coming up, so you can plan a night around them.

It covers 270 spots across the 48 continental states. The 35 spots around Central Florida, where we built it, are researched by hand. Each of the other 47 states has 5 demo spots.

Built in 36 hours at Knight Hacks 2026 (UCF, Orlando).

## What it does

**Top bar**
- A location chip: use your device's location, or search for a Central Florida town or a city in any state
- A Next event pill showing the next sky event and how soon it is ("Orionids · in 10 days"), linked to the Sky events page

**Tonight at a glance**
- A one-line verdict for the night, such as "A clear, moonless night. Go dark." or "Clear skies. Go early, before moonrise at 11:40 PM."
- True darkness (astronomical dusk to dawn), moon phase and moonrise/set, and the top-rated spot
- A 7-night strip with the best score on each night, so you can pick the best night this week

**Map and ranked list**
- The spots in your state on a dark map, with score pins colored by rating, and the same spots ranked beside it
- Your state comes from the town you pick, or from the city nearest your device. It falls back to Orlando (UCF) when location is off.
- Sort by rating or by distance, and filter by "open at night only" or by maximum distance
- Each card shows the best viewing window and an hourly cloud strip
- A "Show all spots" button that zooms the map back out to fit every spot

**Spot detail**
- The score, its label and a factor breakdown that shows exactly how the score was calculated
- Best time tonight on a dusk-to-dawn chart, with hourly cloud cover, when the moon is up and the best window
- A moon card that draws tonight's phase (waxing or waning), with moonrise and moonset
- Cloud layers (low, mid and high, to catch thin cirrus) and comfort & gear warnings for cold, wind and dew
- A location panel with a map, the distance from home and a rough drive time, plus links to Google Maps for the map and for directions
- About the spot: Bortle class, whether it's open at night, road, season and sources
- A seasonal constellation guide with glowing star diagrams

**Sky events** (`/events`)
- Upcoming meteor showers and new moons through January 2027
- The next event is shown up front with a viewing tip, its dates, a countdown and how bright the moon will be at its peak
- A "Find a viewing spot" button that opens the spot list for that night
- A calendar of later events that you can filter to meteor showers or moon phases

It works on desktop and phone, and has a slowly turning three.js starfield behind every page.

## How the rating works

Clouds and the moon can ruin a night outright, so Umbra **gates first, then ranks**.

1. **Gate.** A spot shows **Not tonight** instead of a score when any of these is true: average cloud cover over the dark hours is above 75%, rain is forecast, the spot is closed at night, or there is no true darkness.
2. **Score.** For the rest:

   ```
   Score = 100 × (0.40 C + 0.35 D + 0.25 M)
   ```

   | Factor | Meaning |
   | --- | --- |
   | **C**, clouds | 1 − average cloud cover over the dark hours |
   | **D**, darkness | (9 − Bortle class) / 8, so Bortle 1 = 1.0 and Bortle 9 = 0.0 |
   | **M**, moon | 1 − (illumination × share of dark hours the moon is up, sampled every 15 minutes) |

   | Score | Label |
   | --- | --- |
   | 80–100 | Excellent |
   | 60–79 | Good |
   | 40–59 | Fair |
   | 0–39 | Poor |

3. **Best window.** This is the longest run of dark time with cloud cover under 30% and the moon below the horizon, in 15-minute steps.

The engine is a pure TypeScript function (`lib/scoring`) with no network or UI, covered by unit tests: a perfect night, a cloudy night, a full moon, a summer night with no true darkness, and more.

## Data sources

| Need | Source |
| --- | --- |
| Hourly cloud cover (total and by layer), rain, temperature, dew point, wind | [Open-Meteo](https://open-meteo.com/), free with no key. One forecast covers a whole state, in requests of up to 40 spots, cached for 30 minutes. |
| Sun and moon positions, twilight, moon illumination and phase | [SunCalc](https://github.com/mourner/suncalc), which runs locally |
| Central Florida spots (35): Bortle classes, opening hours, roads | Researched by hand from [lightpollutionmap.info](https://www.lightpollutionmap.info/), [DarkSky International](https://www.darksky.org/), and park and forest agency pages. Each spot links its sources. |
| Spots in the other 47 states (5 each) | Demo data with estimated Bortle classes, each linking to its [Clear Outside](https://clearoutside.com/) forecast |
| Meteor showers | [American Meteor Society](https://www.amsmeteors.org/calendar/) calendar |
| New moon dates | [U.S. Naval Observatory](https://aa.usno.navy.mil/) moon phases |
| Map tiles | Esri World Dark Gray |
| Spot location map | Google Maps embed, with no API key |

**Privacy:** your location never leaves the browser. The ratings API is only sent a two-letter state code, and it returns that state's spots. The browser works out distances itself. The Google Maps embed is only sent the spot's coordinates.

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Leaflet / react-leaflet · three.js · SunCalc · Vitest · Vercel

## Running it

Requires Node 20.9 or newer.

```bash
npm install
npm run dev          # http://localhost:3000
```

| Command | What it does |
| --- | --- |
| `npm test` | Unit tests for the rating engine, comfort, cloud layers, the home page summary and the sky events helpers |
| `npm run typecheck` | TypeScript check |
| `npm run build` | Production build |
| `node data/validate-spots.mjs` | Checks `data/spots.json`: ids, coordinates, state codes, Bortle range, notes and sources |

**Offline fallback:** set `USE_MOCKS = true` in `lib/apiClient.ts` to read `mocks/ratings.json` instead of the live API.

**Page states for testing (dev only):** add `?mock=` to a spot page to load a canned rating, e.g. `/spots/kissimmee-prairie?mock=closed`. The states are `excellent`, `fair`, `closed`, `clouds`, `rain`, `comfort`, `layers`, `no-darkness`, `moonrise`, `full-moon` and `short-window`.

## API

| Endpoint | Returns |
| --- | --- |
| `GET /api/health` | `{ ok: true }` |
| `GET /api/spots` | Every spot (`Spot[]`) |
| `GET /api/ratings?date=YYYY-MM-DD&state=FL` | Spots rated for that night (`SpotRating[]`), best first. `state` is optional and limits the list to one state; without it, every spot is rated |
| `GET /api/ratings/[spotId]?date=YYYY-MM-DD` | One spot's rating (`SpotRating`), from the same forecast as its state's list |
| `GET /api/events` | Upcoming meteor showers and moon phases, cached for an hour |
| `GET /api/sky` | The seasonal constellation guide |

`date` is the evening the night starts. All times are ISO 8601 with the spot's UTC offset. The shared types are in `lib/types.ts`.

## Project layout

| Path | Contents | Owner |
| --- | --- | --- |
| `app/api`, `lib/openMeteo.ts`, `lib/ratingsService.ts` | API routes, Open-Meteo client, caching | Person 1: Backend |
| `lib/scoring`, `mocks` | Rating engine, its tests and sample data | Person 2: Rating engine |
| `app/page.tsx`, `components/SpotsExplorer.tsx`, `components/SpotMap.tsx`, `lib/apiClient.ts`, `lib/geo.ts` | Map and list page, location and state, data fetching | Person 3: Map and list |
| `app/spots/[id]`, `components/ScoreBadge.tsx`, `data/spots.json`, `app/globals.css` | Spot detail page and its location panel, shared UI, spot data, theme | Person 4: Spot details and data |
| `app/events`, `lib/astroEvents.ts`, `lib/skyEvents.ts`, `components/NextEventLink.tsx` | Sky events page, the event calendar and the top bar's Next event pill | Shared |
| `lib/types.ts`, `lib/constants.ts` | The shared contract and label colors | Everyone |

## Team

Goofy Goobers, Knight Hacks 2026: Erika D'Alzina, Darren Squires, Donald Hinks and Matisse Matsumoto.

## What's next

- Weight sliders and presets (naked eye, telescope, astrophotography) so people can tune the rating
- A smoke and haze factor from aerosol optical depth
- Real routed drive times, in place of the location panel's estimate
- Hand-researched spots beyond Florida, to replace the demo spots
- Check-ins, so people can report real sky quality, crowds and gate closures
