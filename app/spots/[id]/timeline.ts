// Time maths for the night chart. Only type imports, so it can be tested with plain Node.
import type { SpotRating } from '@/lib/types';

type Window = { start: string; end: string };

/** A stretch of the chart, as percentages of the dusk-to-dawn axis. */
export type Span = { left: number; width: number };

const HOUR_MS = 60 * 60 * 1000;

// The chart runs from astronomical dusk to dawn. ISO strings carry their offsets,
// so Date.parse gives real instants and everything lines up.
function axis(dark: Window) {
  const start = Date.parse(dark.start);
  const end = Date.parse(dark.end);
  const pct = (ms: number) => Math.max(0, Math.min(100, ((ms - start) / (end - start)) * 100));
  const span = (from: number, to: number): Span => ({ left: pct(from), width: pct(to) - pct(from) });
  return { start, end, span };
}

/**
 * One bar per forecast hour, each covering its hour and clipped at dawn. `short` marks a
 * sliver under half an hour (e.g. 6:00–6:08 AM), too narrow for its own labels.
 */
export function cloudBars(dark: Window, hourly: SpotRating['hourly']) {
  const a = axis(dark);
  return hourly.map((h) => {
    const t = Date.parse(h.time);
    const end = Math.min(t + HOUR_MS, a.end);
    return { time: h.time, cloudCover: h.cloudCover, short: end - t < HOUR_MS / 2, ...a.span(t, end) };
  });
}

/**
 * When the moon is up, from the engine's first rise and first set inside the dark
 * window (found every 15 minutes, so finer than the hourly moonUp flags).
 */
export function moonUpSpans(dark: Window, moon: SpotRating['moon'], hourly: SpotRating['hourly']): Span[] {
  const a = axis(dark);
  const rise = moon.rise ? Date.parse(moon.rise) : null;
  const set = moon.set ? Date.parse(moon.set) : null;
  let intervals: [number, number][];
  if (rise !== null && set !== null) {
    intervals = set < rise ? [[a.start, set], [rise, a.end]] : [[rise, set]];
  } else if (set !== null) {
    intervals = [[a.start, set]];
  } else if (rise !== null) {
    intervals = [[rise, a.end]];
  } else {
    intervals = hourly[0]?.moonUp ? [[a.start, a.end]] : [];
  }
  return intervals.map(([from, to]) => a.span(from, to));
}

export function bestSpan(dark: Window, best: Window): Span {
  return axis(dark).span(Date.parse(best.start), Date.parse(best.end));
}

/** "5 h 58 m", "6 h" or "45 m". */
export function formatDuration(ms: number): string {
  const total = Math.round(ms / 60000);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (!m) return `${h} h`;
  return h ? `${h} h ${m} m` : `${m} m`;
}
