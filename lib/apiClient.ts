import type { SpotRating } from '@/lib/types';

// Flip to false at the hour 12 checkpoint.
export const USE_MOCKS = false;

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error ?? `Request failed (${res.status})`);
  return body as T;
}

// Each night's list per state, kept for the browser session so the detail page shows the exact
// rating the list showed (a fresh request can land on a newer forecast). A list older than the
// server's forecast cache (CACHE_SECONDS in lib/openMeteo.ts) is refetched when the list asks for
// it again. A failed request is dropped, so Retry always refetches.
const LIST_MAX_AGE_MS = 30 * 60 * 1000;
type CachedList = { date: string; at: number; ratings: Promise<SpotRating[]> };
const lists = new Map<string, CachedList>(); // keyed by "date|state"

// GET /api/ratings?date=YYYY-MM-DD&state=FL  (date must be inside the forecast window; without a
// state, every spot is rated)
export async function getRatings(date: string, state?: string): Promise<SpotRating[]> {
  if (USE_MOCKS) {
    const mod = await import('@/mocks/ratings.json');
    return mod.default as unknown as SpotRating[];
  }
  const key = `${date}|${state ?? ''}`;
  const cached = lists.get(key);
  if (cached && Date.now() - cached.at < LIST_MAX_AGE_MS) return cached.ratings;
  const query = `date=${encodeURIComponent(date)}${state ? `&state=${encodeURIComponent(state)}` : ''}`;
  const entry: CachedList = { date, at: Date.now(), ratings: getJson<SpotRating[]>(`/api/ratings?${query}`) };
  lists.set(key, entry);
  entry.ratings.catch(() => {
    if (lists.get(key) === entry) lists.delete(key);
  });
  return entry.ratings;
}

// GET /api/ratings/[spotId]?date=YYYY-MM-DD
// Uses a list for that night whenever one was loaded, however old, since that's what the list on
// screen shows. Direct links and refreshes ask the server, which rates from the same forecast as
// the spot's state list.
export async function getRating(spotId: string, date: string): Promise<SpotRating> {
  if (USE_MOCKS) {
    const list = await getRatings(date);
    const found = list.find((r) => r.spot.id === spotId);
    if (!found) throw new Error('Spot not found');
    return found;
  }
  let fromList: SpotRating | undefined;
  for (const entry of lists.values()) {
    if (entry.date !== date) continue;
    fromList = await entry.ratings.then(
      (list) => list.find((r) => r.spot.id === spotId),
      () => undefined,
    );
    if (fromList) break;
  }
  return fromList ?? getJson<SpotRating>(
    `/api/ratings/${encodeURIComponent(spotId)}?date=${encodeURIComponent(date)}`
  );
}
