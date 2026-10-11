# Umbra

**Find the best place and time to see the stars tonight.**

Umbra rates 35 hand-picked stargazing spots around Central Florida for any of the next 7 nights. It combines the live cloud forecast, light pollution at each spot and the moon into one 0–100 score. Then it tells you when to go, as well as where.

Built in 36 hours at Knight Hacks 2026 (UCF, Orlando).

## What it does

**Tonight at a glance**
- A one-line verdict for the night, such as "A clear, moonless night. Go dark." or "Clear skies. Go early, before moonrise at 11:40 PM."
- True darkness (astronomical dusk to dawn), moon phase and moonrise/set, and the top-rated spot
- A 7-night strip with the best score on each night, so you can pick the best night this week

**Map and ranked list**
- A dark map with score pins colored by rating, and the spots ranked beside it
- Sort by rating or by distance, and filter by "open at night only" or by maximum distance
- Distance is measured from your device's location, or from a town you pick. It falls back to UCF when location is off.
- Each card shows the best viewing window and an hourly cloud strip

**Spot detail**
- The score, its label and a factor breakdown that shows exactly how the score was calculated
- Best time tonight on a dusk-to-dawn chart, with hourly cloud cover, when the moon is up and the best window
- A moon card, cloud layers (low, mid and high, to catch thin cirrus) and comfort & gear warnings for cold, wind and dew
- About the spot: Bortle class, whether it's open at night, road, season and sources
- A one-tap Google Maps directions link
- A seasonal constellation guide for Central Florida

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
| Hourly cloud cover (total and by layer), rain, temperature, dew point, wind | [Open-Meteo](https://open-meteo.com/), free with no key. One request covers every spot and is cached for 30 minutes. |
| Sun and moon positions, twilight, moon illumination | [SunCalc](https://github.com/mourner/suncalc), which runs locally |
| Spot list, Bortle classes, opening hours | Researched by hand from [lightpollutionmap.info](https://www.lightpollutionmap.info/), [DarkSky International](https://www.darksky.org/), and park and forest agency pages. Each spot links its sources. |
| Map tiles | Esri World Dark Gray |

**Privacy:** your location never leaves the browser. The API returns ratings for every spot, and the browser works out the distances itself.

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
| `npm test` | Unit tests for the rating engine, comfort, cloud layers and the home page summary |
| `npm run typecheck` | TypeScript check |
| `npm run build` | Production build |
| `node data/validate-spots.mjs` | Checks `data/spots.json`: ids, coordinates, Bortle range, notes, sources and the 40-spot limit |

**Offline fallback:** set `USE_MOCKS = true` in `lib/apiClient.ts` to read `mocks/ratings.json` instead of the live API.

**Page states for testing (dev only):** add `?mock=` to a spot page to load a canned rating, e.g. `/spots/kissimmee-prairie?mock=closed`. The states are `excellent`, `fair`, `closed`, `clouds`, `rain`, `comfort`, `layers`, `no-darkness`, `moonrise`, `full-moon` and `short-window`.

## API

| Endpoint | Returns |
| --- | --- |
| `GET /api/health` | `{ ok: true }` |
| `GET /api/spots` | Every spot (`Spot[]`) |
| `GET /api/ratings?date=YYYY-MM-DD` | Every spot rated for that night (`SpotRating[]`), best first |
| `GET /api/ratings/[spotId]?date=YYYY-MM-DD` | One spot's rating (`SpotRating`) |
| `GET /api/sky` | The seasonal constellation guide |

`date` is the evening the night starts. All times are ISO 8601 with the spot's UTC offset. The shared types are in `lib/types.ts`.

## Project layout

| Path | Contents | Owner |
| --- | --- | --- |
| `app/api`, `lib/openMeteo.ts`, `lib/ratingsService.ts` | API routes, Open-Meteo client, caching | Person 1: Backend |
| `lib/scoring`, `mocks` | Rating engine, its tests and sample data | Person 2: Rating engine |
| `app/page.tsx`, `components/SpotsExplorer.tsx`, `components/SpotMap.tsx`, `lib/apiClient.ts`, `lib/geo.ts` | Map and list page, location, data fetching | Person 3: Map and list |
| `app/spots/[id]`, `components/ScoreBadge.tsx`, `data/spots.json`, `app/globals.css` | Spot detail page, shared UI, spot data, theme | Person 4: Spot details and data |
| `lib/types.ts`, `lib/constants.ts` | The shared contract and label colors | Everyone |

## Team

Goofy Goobers, Knight Hacks 2026.

## What's next

- Weight sliders and presets (naked eye, telescope, astrophotography) so people can tune the rating
- A smoke and haze factor from aerosol optical depth
- Real drive times instead of straight-line distance
- Check-ins, so people can report real sky quality, crowds and gate closures
