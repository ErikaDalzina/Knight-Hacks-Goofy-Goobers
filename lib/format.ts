// The API returns ISO strings with the spot's local offset (e.g. 2026-10-18T00:00:00-04:00).
// Read the clock time straight from the string so the browser's timezone doesn't shift it.
export function formatClock(iso: string): string {
  const m = /T(\d{2}):(\d{2})/.exec(iso);
  if (!m) return iso;
  const h24 = Number(m[1]);
  const suffix = h24 >= 12 ? 'PM' : 'AM';
  return `${h24 % 12 || 12}:${m[2]} ${suffix}`;
}

export function formatWindow(w: { start: string; end: string } | null): string | null {
  if (!w) return null;
  return `${formatClock(w.start)} – ${formatClock(w.end)}`;
}
