// Tonight at a glance, for the main page hero. Relative imports only, so vitest can run it
// without the @/ alias.
import { distanceMiles, type LatLon } from '../lib/geo';
import type { SpotRating } from '../lib/types';
import { formatDuration, formatLocalTime, moonPhaseName } from './time';

// Factor thresholds for the headline, from the top-rated spot.
const CLEAR = 0.7; // clouds factor: 30% average cover or less
const MOONLESS = 0.9; // moon factor: little moonlight during the dark hours

export type Stat = { text: string; sub: string };

export type NightSummary = {
  headline: string;
  shortHeadline: string;
  dark: Stat | null;
  moon: Stat | null;
  top: SpotRating | null;
};

/** "Sat · Oct 10" and "Saturday, October 10" from YYYY-MM-DD, whatever the viewer's time zone. */
export function nightLabels(date: string) {
  const d = new Date(`${date}T12:00:00Z`);
  const fmt = (options: Intl.DateTimeFormatOptions) => d.toLocaleDateString('en-US', { ...options, timeZone: 'UTC' });
  return {
    short: `${fmt({ weekday: 'short' })} · ${fmt({ month: 'short', day: 'numeric' })}`,
    long: fmt({ weekday: 'long', month: 'long', day: 'numeric' }),
  };
}

/** Moonset and moonrise during the dark hours, in order, or whether it's up or down throughout. */
function moonNote({ moon, hourly }: SpotRating): string {
  const events: { at: string; text: string }[] = [];
  if (moon.set) events.push({ at: moon.set, text: `sets ${formatLocalTime(moon.set)}` });
  if (moon.rise) events.push({ at: moon.rise, text: `rises ${formatLocalTime(moon.rise)}` });
  if (!events.length) return hourly[0]?.moonUp ? 'Up all night' : 'Below the horizon all night';
  events.sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  const note = events.map((e) => e.text).join(' · ');
  return note[0].toUpperCase() + note.slice(1);
}

function headlines(top: SpotRating | null): [string, string] {
  if (!top) return ['Clouds win tonight. Try again tomorrow.', 'Clouded out tonight.'];
  if (top.factors.clouds < CLEAR) return ['Patchy clouds. Pick your spot and time.', 'Patchy clouds tonight.'];
  if (top.factors.moon >= MOONLESS) return ['A clear, moonless night. Go dark.', 'Clear and moonless. Go dark.'];
  const { rise, set } = top.moon;
  // Up at dusk and sets (maybe rising again later): the dark starts at moonset.
  if (set && (!rise || Date.parse(set) < Date.parse(rise))) {
    const at = formatLocalTime(set);
    return [`Clear skies. Go dark after moonset at ${at}.`, `Clear. Dark after ${at}.`];
  }
  if (rise) {
    const at = formatLocalTime(rise);
    return [`Clear skies. Go early, before moonrise at ${at}.`, `Clear. Go before ${at}.`];
  }
  return ['Clear, but the moon is bright. Planets and the Moon tonight.', 'Clear, bright moon.'];
}

export function summarizeNight(ratings: SpotRating[], home: LatLon): NightSummary {
  const away = (r: SpotRating) => distanceMiles(home, { lat: r.spot.lat, lon: r.spot.lon });

  // Dusk, dawn and the moon barely change across the region, so read them from the nearest spot.
  const nearest = ratings.filter((r) => r.darkWindow).sort((a, b) => away(a) - away(b))[0] ?? null;

  // Highest score wins; on a tie, the nearer spot.
  const top = ratings
    .filter((r) => r.score !== null)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0) || away(a) - away(b))[0] ?? null;

  let dark: Stat | null = null;
  let moon: Stat | null = null;
  if (nearest?.darkWindow) {
    const { start, end } = nearest.darkWindow;
    dark = {
      text: `${formatLocalTime(start)} – ${formatLocalTime(end)}`,
      sub: `${formatDuration(Date.parse(end) - Date.parse(start))} · sun 18° below`,
    };
    const lit = nearest.moon.illumination;
    moon = { text: `${Math.round(lit * 100)}% · ${moonPhaseName(lit)}`, sub: moonNote(nearest) };
  }

  const [headline, shortHeadline] = headlines(top);
  return { headline, shortHeadline, dark, moon, top };
}
