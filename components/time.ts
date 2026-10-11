// Stargazing nights run past midnight, so before this hour "tonight" still means last night.
const NIGHT_ENDS_HOUR = 6;

/** The night to rate, as YYYY-MM-DD in the viewer's local time (the API's `date`). */
export function tonightDate(now: Date = new Date()): string {
  const d = new Date(now);
  if (d.getHours() < NIGHT_ENDS_HOUR) d.setDate(d.getDate() - 1);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * "8:25 PM" from an API time like "2026-10-17T20:25:00-04:00". Reads the clock time from
 * the string itself, so it stays in the spot's local time whatever the viewer's time zone.
 */
export function formatLocalTime(iso: string): string {
  const match = /T(\d{2}):(\d{2})/.exec(iso);
  if (!match) return iso;
  const hour = Number(match[1]);
  return `${hour % 12 || 12}:${match[2]} ${hour < 12 ? 'AM' : 'PM'}`;
}

/** "9p" or "12a" for chart ticks, in the spot's local time like formatLocalTime. */
export function formatHourShort(iso: string): string {
  const match = /T(\d{2}):/.exec(iso);
  if (!match) return '';
  const hour = Number(match[1]);
  return `${hour % 12 || 12}${hour < 12 ? 'a' : 'p'}`;
}

/** "5 h 58 m", "6 h" or "45 m". */
export function formatDuration(ms: number): string {
  const total = Math.round(ms / 60000);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (!m) return `${h} h`;
  return h ? `${h} h ${m} m` : `${m} m`;
}

/** A phase name from the lit fraction alone; the contract doesn't say waxing or waning. */
export function moonPhaseName(illumination: number): string {
  if (illumination < 0.03) return 'New moon';
  if (illumination < 0.35) return 'Crescent';
  if (illumination < 0.65) return 'Half moon';
  if (illumination < 0.97) return 'Gibbous';
  return 'Full moon';
}
