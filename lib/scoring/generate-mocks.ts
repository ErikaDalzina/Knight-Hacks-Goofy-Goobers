/**
 * Regenerates mocks/ratings.json by running the real rating engine on every spot
 * in data/spots.json, using fixed made-up forecasts so the output is repeatable.
 *
 * Run from the PROJECT ROOT:
 *   npx tsx lib/scoring/generate-mocks.ts [YYYY-MM-DD] [utc-offset]
 * Example:
 *   npx tsx lib/scoring/generate-mocks.ts 2026-10-17 -04:00
 *
 * Moon and dark-window numbers come from the real SunCalc, so they are real for
 * the date you pick. Cloud cover and rain are invented, cycling through
 * clear / mixed / overcast / rainy nights so the frontend sees every label.
 * Temperature (F), dew point (F) and wind (km/h) are invented too, cycling through mild,
 * cold, windy and dewy nights so the comfort warnings show up on some spots.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import type { HourlyForecast, Spot, SpotRating } from '@/lib/types';
import { rateSpot } from './index';

const DATE = process.argv[2] ?? '2026-10-17';
const OFFSET = process.argv[3] ?? '-04:00'; // Florida is -04:00 until Nov 1, 2026
const offsetMatch = OFFSET.match(/^([+-])(\d{2}):(\d{2})$/);
if (!/^\d{4}-\d{2}-\d{2}$/.test(DATE) || !offsetMatch) {
  console.error('Usage: npx tsx lib/scoring/generate-mocks.ts [YYYY-MM-DD] [+/-HH:MM]');
  process.exit(1);
}
const offsetSeconds =
  (offsetMatch[1] === '-' ? -1 : 1) * (Number(offsetMatch[2]) * 3600 + Number(offsetMatch[3]) * 60);

// --- load and check the spots -------------------------------------------------
let raw: any;
try {
  raw = JSON.parse(readFileSync('data/spots.json', 'utf8'));
} catch (err) {
  console.error(`Could not read data/spots.json (${(err as Error).message}).`);
  console.error('Run this from the project root, and check the file is valid JSON.');
  process.exit(1);
}
const list: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.spots) ? raw.spots : [];
const isSpot = (s: any): s is Spot =>
  !!s && typeof s.id === 'string' && typeof s.name === 'string' &&
  Number.isFinite(s.lat) && Number.isFinite(s.lon) &&
  Number.isFinite(s.bortle) && typeof s.openAtNight === 'boolean';

const spots = list.filter(isSpot);
for (const s of list.filter(s => !isSpot(s))) {
  console.warn(`Skipped a spot that doesn't match the Spot type: ${JSON.stringify(s).slice(0, 120)}`);
}
if (spots.length === 0) {
  console.error('No valid spots found in data/spots.json (run this from the project root).');
  process.exit(1);
}

// --- fixed, repeatable fake forecasts ----------------------------------------
type Kind = 'clear' | 'clearish' | 'mixed' | 'overcast' | 'rain';
const KINDS: Kind[] = ['clear', 'clearish', 'mixed', 'clear', 'overcast', 'clearish', 'mixed', 'rain', 'clear', 'mixed'];
const BASE_CLOUD: Record<Kind, number> = { clear: 8, clearish: 20, mixed: 45, overcast: 88, rain: 25 };

const LAYER_SPLIT: Record<Kind, [number, number, number]> = {
  clear: [0.2, 0.3, 0.6], clearish: [0.1, 0.2, 1.0], mixed: [0.5, 0.7, 0.6],
  overcast: [0.9, 0.9, 0.8], rain: [0.9, 0.8, 0.5],
};

// Overnight weather: temperature at 6pm (F), how far it falls by 6am (F), the gap between
// temperature and dew point (F, small = dew), and the wind in km/h. Cycles on a different period than KINDS.
type Profile = { temp: number; drop: number; spread: number; wind: number };
const PROFILES: Profile[] = [
  { temp: 70, drop: 5, spread: 11, wind: 8 }, // mild
  { temp: 57, drop: 11, spread: 9, wind: 10 }, // cold
  { temp: 68, drop: 5, spread: 11, wind: 28 }, // windy
  { temp: 66, drop: 5, spread: 3, wind: 6 }, // dewy
  { temp: 55, drop: 13, spread: 2, wind: 24 }, // cold, dewy and windy
  { temp: 64, drop: 7, spread: 9, wind: 14 }, // comfortable
  { temp: 59, drop: 11, spread: 4, wind: 12 }, // cold and dewy
];
const round1 = (n: number) => Math.round(n * 10) / 10;

// small seeded random generator (mulberry32) so every run gives the same file
function seeded(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 24 hourly points starting 6pm local on DATE
function forecastFor(kind: Kind, seed: number, profile: Profile): HourlyForecast[] {
  const next = seeded(seed);
  const weather = seeded(1000 + seed); // its own random stream, so the cloud values are unchanged
  const start = Date.parse(`${DATE}T18:00:00${OFFSET}`);
  return Array.from({ length: 24 }, (_, i) => {
    const t = start + i * 3600e3;
    const cloud = Math.round(Math.min(100, Math.max(0, BASE_CLOUD[kind] + (next() - 0.5) * 16)));
    // temperature falls overnight, reaching its low around 6am
    const temperatureF = round1(profile.temp - (profile.drop * Math.min(i, 12)) / 12 + (weather() - 0.5) * 2);
    const dewPointF = round1(temperatureF - (profile.spread + weather() - 0.5));
    const windSpeedKmh = round1(Math.max(0, profile.wind + (weather() - 0.5) * 6));
    const [lo, mi, hi] = LAYER_SPLIT[kind];
    const layer = (f: number) => Math.round(Math.min(100, cloud * f));
    return {
      time: new Date(t + offsetSeconds * 1000).toISOString().slice(0, 19) + OFFSET,
      cloudCover: cloud,
      precipitation: kind === 'rain' && (i === 6 || i === 7) ? 0.4 : 0, // around midnight
      temperatureF,
      dewPointF,
      windSpeedKmh,
      cloudCoverLow: layer(lo),
      cloudCoverMid: layer(mi),
      cloudCoverHigh: layer(hi),
    };
  });
}

// --- rate every spot and write the file ----------------------------------------
const ratings: SpotRating[] = [];
spots.forEach((spot, i) => {
  try {
    ratings.push(rateSpot(spot, DATE, forecastFor(KINDS[i % KINDS.length], i + 1, PROFILES[i % PROFILES.length])));
  } catch (err) {
    console.warn(`Skipped ${spot.name}: ${(err as Error).message}`);
  }
});

// same order as GET /api/ratings: best score first, "Not tonight" last
ratings.sort((a, b) => (b.score ?? -1) - (a.score ?? -1) || a.spot.name.localeCompare(b.spot.name));

mkdirSync('mocks', { recursive: true });
writeFileSync('mocks/ratings.json', JSON.stringify(ratings, null, 2) + '\n');

console.log(`Wrote mocks/ratings.json: ${ratings.length} spots, night of ${DATE}\n`);
for (const r of ratings) {
  const score = r.score === null ? '--' : String(r.score);
  console.log(`${score.padStart(3)}  ${r.label.padEnd(11)} ${r.spot.name}${r.gateReason ? `  (${r.gateReason})` : ''}`);
}
