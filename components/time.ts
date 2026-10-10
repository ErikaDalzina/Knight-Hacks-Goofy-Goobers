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
