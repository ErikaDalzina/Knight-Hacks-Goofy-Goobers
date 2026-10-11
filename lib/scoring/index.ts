/**
 * TEMPORARY integration-friendly rating engine.
 * Person 2 owns this entire folder: replace or improve this file during the
 * hackathon, keeping `rateSpot(spot, date, hourly)` and the shared output type.
 * This baseline implements the documented weights and uses SunCalc for darkness
 * and moon; no network requests here. Moonrise/set fields mean events during
 * the dark window, not necessarily the complete calendar day.
 */
import SunCalc from 'suncalc';
import type { HourlyForecast, RateSpot, Spot, SpotRating } from '@/lib/types';
import { assessComfort } from './comfort';

/** Every tunable number lives here, so scoring can change without touching the logic. */
export const SCORING_CONFIG = {
  // score = 100 * (clouds * w.clouds + darkness * w.darkness + moon * w.moon)
  weights: { clouds: 0.40, darkness: 0.35, moon: 0.25 },
  // darkness factor = (worstBortle - spot.bortle) / range, clamped to 0-1
  darkness: { worstBortle: 9, range: 8 },
  // "Not tonight" gate: average cloud cover (%) above this
  gates: { maxAverageCloud: 75 },
  // An hour counts toward the best window when cloud cover (%) is below this
  bestWindow: { maxCloud: 30 },
  // Minimum score for each label (anything lower is "Poor")
  labels: { excellent: 80, good: 60, fair: 40 },
};

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const HOUR = 60 * 60 * 1000;
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const darknessScore = (bortle: number) =>
  clamp((SCORING_CONFIG.darkness.worstBortle - bortle) / SCORING_CONFIG.darkness.range);

function offsetFromForecast(hourly: HourlyForecast[]): number {
  const match = hourly[0]?.time.match(/([+-])(\d{2}):(\d{2})$/);
  if (!match) return 0;
  const minutes = Number(match[2]) * 60 + Number(match[3]);
  return (match[1] === '-' ? -1 : 1) * minutes * 60;
}
function offsetISO(date: Date, offset: number): string {
  const abs = Math.abs(offset);
  const hh = String(Math.floor(abs / 3600)).padStart(2, '0');
  const mm = String(Math.floor((abs % 3600) / 60)).padStart(2, '0');
  const local = new Date(date.getTime() + offset * 1000).toISOString().slice(0, 19);
  return `${local}${offset < 0 ? '-' : '+'}${hh}:${mm}`;
}
function moonUpAt(date: Date, spot: Spot): boolean {
  return SunCalc.getMoonPosition(date, spot.lat, spot.lon).altitude > 0;
}
function gateResult(spot: Spot, date: string, reason: string, factors: SpotRating['factors'],
                    darkWindow: SpotRating['darkWindow'], moon: SpotRating['moon'],
                    hourly: SpotRating['hourly']): SpotRating {
  return { spot, date, score: null, label: 'Not tonight', gateReason: reason,
    factors, darkWindow, bestWindow: null, moon, hourly };
}

export const rateSpot: RateSpot = (spot, date, forecast) => {
  const defaultMoon = { illumination: 0, rise: null, set: null };
  const defaultFactors = { clouds: 0, darkness: darknessScore(spot.bortle), moon: 0 };
  const offset = offsetFromForecast(forecast);
  // SunCalc's astronomical night is the -18 degree solar crossing.
  const utcNoon = new Date(`${date}T12:00:00Z`);
  const nextUtcNoon = new Date(utcNoon.getTime() + 24 * HOUR);
  const start = SunCalc.getTimes(utcNoon, spot.lat, spot.lon).night;
  const end = SunCalc.getTimes(nextUtcNoon, spot.lat, spot.lon).nightEnd;
  if (!start || !end || !Number.isFinite(start.getTime()) ||
      !Number.isFinite(end.getTime()) || end.getTime() <= start.getTime()) {
    return gateResult(spot, date, 'No true astronomical darkness', defaultFactors, null, defaultMoon, []);
  }
  const darkWindow = { start: offsetISO(start, offset), end: offsetISO(end, offset) };
  const sampledHours = forecast.filter(h => {
    const ms = Date.parse(h.time);
    return ms >= start.getTime() && ms < end.getTime();
  });
  if (sampledHours.length === 0) {
    throw new Error('Forecast did not cover the astronomical dark window.');
  }

  const averageCloud = sampledHours.reduce((sum, h) => sum + h.cloudCover, 0) / sampledHours.length;
  const illumination = clamp(SunCalc.getMoonIllumination(
    new Date((start.getTime() + end.getTime()) / 2)).fraction);
  let moonSamples = 0, moonUpSamples = 0;
  let rise: string | null = null, set: string | null = null;
  let previousUp = moonUpAt(start, spot);
  for (let t = start.getTime(); t < end.getTime(); t += FIFTEEN_MINUTES) {
    const currentDate = new Date(t);
    const up = moonUpAt(currentDate, spot);
    moonSamples++;
    if (up) moonUpSamples++;
    if (!previousUp && up && rise === null) rise = offsetISO(currentDate, offset);
    if (previousUp && !up && set === null) set = offsetISO(currentDate, offset);
    previousUp = up;
  }
  const factors = {
    clouds: clamp(1 - averageCloud / 100),
    darkness: darknessScore(spot.bortle),
    moon: clamp(1 - illumination * (moonSamples ? moonUpSamples / moonSamples : 0)),
  };
  const moon = { illumination, rise, set };
  const hourly = sampledHours.map(h => ({
    time: h.time, cloudCover: h.cloudCover, moonUp: moonUpAt(new Date(h.time), spot),
  }));

  if (!spot.openAtNight) {
    return gateResult(spot, date, 'Spot is closed at night', factors, darkWindow, moon, hourly);
  }
  if (averageCloud > SCORING_CONFIG.gates.maxAverageCloud) {
    return gateResult(spot, date, `Cloud cover above ${SCORING_CONFIG.gates.maxAverageCloud}%`, factors, darkWindow, moon, hourly);
  }
  if (sampledHours.some(h => h.precipitation > 0)) {
    return gateResult(spot, date, 'Precipitation forecast during dark hours', factors, darkWindow, moon, hourly);
  }

  // Cloud cover is hourly, but the moon can rise or set mid-hour, so each forecast hour is
  // split into 15-minute slots. A slot counts only if its hour is clear enough AND the moon
  // is below the horizon at both its start and its end. The window therefore never runs
  // past a moonrise; it may stop up to 15 minutes early, or start up to 15 minutes late.
  let currentStart: number | null = null, currentEnd: number | null = null;
  let bestStart: number | null = null, bestEnd: number | null = null;
  for (const h of hourly) {
    const hourStart = new Date(h.time).getTime();
    const clearEnough = h.cloudCover < SCORING_CONFIG.bestWindow.maxCloud;
    for (let slotStart = hourStart; slotStart < hourStart + HOUR; slotStart += FIFTEEN_MINUTES) {
      if (slotStart >= end.getTime()) break;
      const slotEnd = Math.min(slotStart + FIFTEEN_MINUTES, end.getTime());
      const good = clearEnough &&
        !moonUpAt(new Date(slotStart), spot) && !moonUpAt(new Date(slotEnd), spot);
      if (!good) {
        currentStart = null;
        currentEnd = null;
        continue;
      }
      if (currentStart === null || currentEnd !== slotStart) currentStart = slotStart;
      currentEnd = slotEnd;
      if (bestStart === null || bestEnd === null ||
          currentEnd - currentStart > bestEnd - bestStart) {
        bestStart = currentStart;
        bestEnd = currentEnd;
      }
    }
  }
  const bestWindow = bestStart === null || bestEnd === null ? null : {
    start: offsetISO(new Date(bestStart), offset), end: offsetISO(new Date(bestEnd), offset),
  };
  const { weights } = SCORING_CONFIG;
  const score = Math.round(100 * (weights.clouds * factors.clouds +
    weights.darkness * factors.darkness + weights.moon * factors.moon));
  const { excellent, good, fair } = SCORING_CONFIG.labels;
  const label: SpotRating['label'] = score >= excellent ? 'Excellent' : score >= good ? 'Good'
      : score >= fair ? 'Fair' : 'Poor';

  // Only rated nights get comfort, and only the dark-window hours are looked at.
  const comfort = assessComfort(sampledHours);
  return { spot, date, score, label, factors, darkWindow, bestWindow, moon, hourly,
    ...(comfort ? { comfort } : {}) };
};
