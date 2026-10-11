/**
 * Comfort and gear warnings for the dark hours of a night: cold, wind and dew.
 * A pure function with no dependencies (no SunCalc, no network), so it is easy to test.
 * Warnings never change the score; they only tell people what to pack.
 */
import type { Comfort, ComfortWarning } from '@/lib/types';

/** Thresholds for each warning. Tune them here; the tests pin the current values. */
export const COMFORT_CONFIG = {
  cold: { maxTempF: 50 }, // warn when the coldest dark hour is at or below this
  wind: { minKmh: 20 }, // warn when the windiest dark hour is at or above this (20 km/h = 12 mph)
  dew: { maxSpreadF: 5 }, // warn when temperature minus dew point gets down to this or less
};

/** The weather fields this reads (HourlyForecast already fits). Missing or non-finite values are skipped. */
export type ComfortSample = {
  temperatureF?: number | null;
  dewPointF?: number | null;
  windSpeedKmh?: number | null;
};

const isNumber = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
const round1 = (n: number) => Math.round(n * 10) / 10;
const toMph = (kmh: number) => Math.round(kmh * 0.621371);

// How each warning reads in the advice line, and what to pack for it.
const ADVICE = {
  cold: { condition: 'cold', gear: 'warm layers' },
  wind: { condition: 'windy', gear: 'a windbreak' },
  dew: { condition: 'dewy', gear: 'a dew shield' },
} as const;

const joinWords = (words: string[]) =>
  words.length < 2 ? (words[0] ?? '') : `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;

/**
 * Returns null when the samples have no temperature, dew point or wind data at all, so the
 * caller can leave `comfort` out. Otherwise returns the worst values, one warning per
 * problem (always in the order cold, wind, dew) and a single advice line, or null for the
 * advice when nothing needs flagging.
 */
export function assessComfort(samples: ComfortSample[]): Comfort | null {
  const temps = samples.map(s => s.temperatureF).filter(isNumber);
  const winds = samples.map(s => s.windSpeedKmh).filter(isNumber);
  // The dew spread needs temperature AND dew point from the same hour.
  const spreads = samples.flatMap(s =>
    isNumber(s.temperatureF) && isNumber(s.dewPointF) ? [s.temperatureF - s.dewPointF] : []);
  if (temps.length === 0 && winds.length === 0 && spreads.length === 0) return null;

  const minTemp = temps.length ? Math.min(...temps) : null;
  const maxWind = winds.length ? Math.max(...winds) : null;
  const minSpread = spreads.length ? Math.min(...spreads) : null;

  const warnings: ComfortWarning[] = [];
  if (minTemp !== null && minTemp <= COMFORT_CONFIG.cold.maxTempF) {
    warnings.push({ kind: 'cold', message: `Cold: low of ${Math.round(minTemp)}°F` });
  }
  if (maxWind !== null && maxWind >= COMFORT_CONFIG.wind.minKmh) {
    warnings.push({ kind: 'wind', message: `Windy: up to ${Math.round(maxWind)} km/h (${toMph(maxWind)} mph)` });
  }
  if (minSpread !== null && minSpread <= COMFORT_CONFIG.dew.maxSpreadF) {
    warnings.push({
      kind: 'dew',
      message: `Dew likely: temperature within ${Math.max(0, round1(minSpread))}°F of the dew point`,
    });
  }

  const conditions = joinWords(warnings.map(w => ADVICE[w.kind].condition));
  const advice = warnings.length === 0 ? null
    : `${conditions[0].toUpperCase()}${conditions.slice(1)}: pack ${joinWords(warnings.map(w => ADVICE[w.kind].gear))}.`;

  return {
    minTempF: minTemp === null ? null : round1(minTemp),
    maxWindKmh: maxWind === null ? null : round1(maxWind),
    minDewSpreadF: minSpread === null ? null : round1(minSpread),
    warnings,
    advice,
  };
}
