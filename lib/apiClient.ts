import type { SpotRating } from '@/lib/types';

// Flip to false at the hour 12 checkpoint.
export const USE_MOCKS = false;

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error ?? `Request failed (${res.status})`);
  return body as T;
}

// Each night's list, kept for the browser session so the detail page shows the exact rating the
// list showed (a fresh request can land on a newer forecast). A list older than the server's
// forecast cache (CACHE_SECONDS in lib/openMeteo.ts) is refetched when the list asks for it again.
// A failed request is dropped, so Retry always refetches.
const LIST_MAX_AGE_MS = 30 * 60 * 1000;
const lists = new Map<string, { at: number; ratings: Promise<SpotRating[]> }>();

// GET /api/ratings?date=YYYY-MM-DD  (date must be inside the forecast window)
export async function getRatings(date: string): Promise<SpotRating[]> {
  if (USE_MOCKS) {
    const mod = await import('@/mocks/ratings.json');
    return mod.default as unknown as SpotRating[];
  }
  const cached = lists.get(date);
  if (cached && Date.now() - cached.at < LIST_MAX_AGE_MS) return cached.ratings;
  const entry = { at: Date.now(), ratings: getJson<SpotRating[]>(`/api/ratings?date=${encodeURIComponent(date)}`) };
  lists.set(date, entry);
  entry.ratings.catch(() => {
    if (lists.get(date) === entry) lists.delete(date);
  });
  return entry.ratings;
}

// GET /api/ratings/[spotId]?date=YYYY-MM-DD
// Uses the night's list whenever one was loaded, however old, since that's what the list on screen
// shows. Direct links and refreshes ask the server, which rates from the same forecast as the list.
export async function getRating(spotId: string, date: string): Promise<SpotRating> {
  if (USE_MOCKS) {
    const list = await getRatings(date);
    const found = list.find((r) => r.spot.id === spotId);
    if (!found) throw new Error('Spot not found');
    return found;
  }
  const fromList = await lists.get(date)?.ratings.then(
    (list) => list.find((r) => r.spot.id === spotId),
    () => undefined,
  );
  return fromList ?? getJson<SpotRating>(
    `/api/ratings/${encodeURIComponent(spotId)}?date=${encodeURIComponent(date)}`
  );
}
