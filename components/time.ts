// Stargazing nights run past midnight, so before this hour "tonight" still means last night.
const NIGHT_ENDS_HOUR = 6;

/** The night to rate, as YYYY-MM-DD in the viewer's local time (the API's `date`). */
export function tonightDate(now: Date = new Date()): string {
  const d = new Date(now);
  if (d.getHours() < NIGHT_ENDS_HOUR) d.setDate(d.getDate() - 1);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
