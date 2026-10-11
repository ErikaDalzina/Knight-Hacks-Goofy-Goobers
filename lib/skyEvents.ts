import SunCalc from 'suncalc';
import type { AstroEvent } from '@/lib/astroEvents';

// Shared by the top bar's Next event pill and the Sky events page, so they always agree.
// `tonight` is the viewer's night as YYYY-MM-DD (tonightDate in components/time.ts), not the
// UTC date, which in Florida turns over at 8 PM and would drop an event on its last night.

const DAY_MS = 24 * 60 * 60 * 1000;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const parts = (date: string) => date.split('-').map(Number) as [number, number, number];
const daysBetween = (from: string, to: string) =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS);

/** Events that haven't ended by `tonight`, soonest first. */
export function upcomingEvents(events: AstroEvent[], tonight: string): AstroEvent[] {
  return events
    .filter((e) => e.endDate >= tonight)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}

/** "tonight" (including an event already under way), "tomorrow", or "in N days". */
export function whenText(tonight: string, startDate: string): string {
  const days = daysBetween(tonight, startDate);
  return days <= 0 ? 'tonight' : days === 1 ? 'tomorrow' : `in ${days} days`;
}

/** "Nov 9", "Oct 21–22", or "Dec 31 – Jan 1" across months. The year is shown separately. */
export function formatEventDates(start: string, end: string): string {
  const [, sm, sd] = parts(start);
  const [, em, ed] = parts(end);
  if (start === end) return `${MONTHS[sm - 1]} ${sd}`;
  if (sm === em) return `${MONTHS[sm - 1]} ${sd}–${ed}`;
  return `${MONTHS[sm - 1]} ${sd} – ${MONTHS[em - 1]} ${ed}`;
}

/** "Oct 2026", for the page's date range. */
export function formatMonthYear(date: string): string {
  const [y, m] = parts(date);
  return `${MONTHS[m - 1]} ${y}`;
}

export const categoryLabel = (e: AstroEvent) => (e.category === 'Meteor Shower' ? 'Meteor shower' : 'Moon phase');

// SunCalc's phase runs 0 (new) → .25 (first quarter) → .5 (full) → .75 (last quarter) → 1.
function phaseName(phase: number): string {
  if (phase < 0.03 || phase > 0.97) return 'New moon';
  if (phase < 0.22) return 'Waxing crescent';
  if (phase < 0.28) return 'First quarter';
  if (phase < 0.47) return 'Waxing gibbous';
  if (phase < 0.53) return 'Full moon';
  if (phase < 0.72) return 'Waning gibbous';
  if (phase < 0.78) return 'Last quarter';
  return 'Waning crescent';
}

/** The Moon around midnight on the event's first night, e.g. "Waxing gibbous · 72% lit". */
export function moonAtPeak(startDate: string): string {
  // 05:00 UTC the next day is about midnight in U.S. Eastern time. The Moon's phase changes
  // slowly, so the exact hour and time zone barely move the numbers.
  const [y, m, d] = parts(startDate);
  const { fraction, phase } = SunCalc.getMoonIllumination(new Date(Date.UTC(y, m - 1, d + 1, 5)));
  return `${phaseName(phase)} · ${Math.round(fraction * 100)}% lit`;
}
