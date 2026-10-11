# lib/scoring: the rating engine

Turns one spot's hourly forecast into a `SpotRating` for a given night. Everything here is a pure function: no network requests and no UI, so it is tested from fixtures alone.

## Exports

| Export | File | What it does |
| --- | --- | --- |
| `rateSpot(spot, date, hourly, weights?)` | `index.ts` | The main function. Returns a `SpotRating`: score, label, factors, dark window, best window, moon, hourly strip, and optional `comfort` and `cloudLayers`. |
| `SCORING_CONFIG` | `index.ts` | Every tunable number: weights, darkness range, the 75% cloud gate, the 30% best-window cutoff and the label cutoffs. Weights and label cutoffs come from `lib/constants.ts`. |
| `assessComfort(samples)` | `comfort.ts` | Cold, wind and dew warnings and one advice line from the dark-hour weather. Returns `null` with no weather data. |
| `COMFORT_CONFIG` | `comfort.ts` | The warning thresholds (50 °F, 20 km/h, 5 °F dew gap). |
| `assessCloudLayers(samples)` | `cloudLayers.ts` | Average low, mid and high cloud (%) over the dark hours. Returns `null` with no layer data. |

## How a rating is built

1. **Dark window:** astronomical dusk to dawn (sun 18° below the horizon) from SunCalc.
2. **Factors (each 0 to 1):** clouds (average cover over the dark hours), darkness (from the Bortle class) and moon (illumination × share of dark hours it is up, sampled every 15 minutes).
3. **Gate:** no true darkness, closed at night, average cloud above 75% or any rain gives `Not tonight` with no score.
4. **Score:** `100 × (0.40 clouds + 0.35 darkness + 0.25 moon)`, then a label: Excellent 80+, Good 60+, Fair 40+, otherwise Poor.
5. **Best window:** the longest run of 15-minute slots with cloud under 30% and the moon down.
6. **Comfort and cloud layers:** added on rated nights only, and only if the forecast has the fields. They never change the score.

## Custom weights

`rateSpot` takes an optional fourth argument, `{ clouds, darkness, moon }`. Weights are scaled to sum to 1, missing ones fall back to the defaults (`DEFAULT_WEIGHTS` in `lib/constants.ts`), and zero, negative or non-numeric values are ignored.

## Run the tests

From the project root:

```bash
npx vitest run lib/scoring     # run once
npx vitest lib/scoring         # watch mode
npx tsc --noEmit               # type check
```

The tests pin the current thresholds and weights. If you retune `SCORING_CONFIG` or `COMFORT_CONFIG` on purpose, update the numbers in the tests too.

## Regenerate the mocks

`generate-mocks.ts` runs the real engine on every spot in `data/spots.json`, using fixed made-up forecasts, and writes `mocks/ratings.json`. Run it from the project root:

```bash
npx tsx lib/scoring/generate-mocks.ts [YYYY-MM-DD] [utc-offset]
npx tsx lib/scoring/generate-mocks.ts 2026-10-17 -04:00
```

Moon and dark-window numbers are real for the date you pick. Cloud cover, rain, temperature, dew point, wind and cloud layers are invented, cycling through clear, mixed, overcast and rainy nights, and through mild, cold, windy and dewy ones, so the frontend sees every label and warning. Florida is `-04:00` until Nov 1, 2026, then `-05:00`.

## Rules

- Stay inside this folder. Changes to `lib/types.ts` or `lib/constants.ts` need a heads-up to the team.
- Add, don't break: new output fields are optional, and `comfort` and `cloudLayers` are left out when there is no data.
