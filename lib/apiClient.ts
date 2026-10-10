import type { SpotRating } from '@/lib/types';

// Flip to false at the hour 12 checkpoint.
export const USE_MOCKS = true;

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json() as Promise<T>;
}

// GET /api/ratings?date=YYYY-MM-DD  (date must be inside the forecast window)
export async function getRatings(date: string): Promise<SpotRating[]> {
  if (USE_MOCKS) {
    const mod = await import('@/mocks/ratings-list.json');
    return mod.default as unknown as SpotRating[];
  }
  return getJson<SpotRating[]>(`/api/ratings?date=${encodeURIComponent(date)}`);
}

// GET /api/ratings/[spotId]?date=YYYY-MM-DD
export async function getRating(spotId: string, date: string): Promise<SpotRating> {
  if (USE_MOCKS) {
    const list = await getRatings(date);
    const found = list.find((r) => r.spot.id === spotId);
    if (!found) throw new Error('Spot not found');
    return found;
  }
  return getJson<SpotRating>(
    `/api/ratings/${encodeURIComponent(spotId)}?date=${encodeURIComponent(date)}`
  );
}
