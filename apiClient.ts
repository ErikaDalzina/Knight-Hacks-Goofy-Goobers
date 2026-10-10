import { Rating } from './types';
import mockRatings from '../mocks/ratings.json';

// Flip to false at the hour 12 checkpoint.
export const USE_MOCKS = true;

// Set EXPO_PUBLIC_API_BASE in .env (e.g. https://your-api.vercel.app). Empty = same origin.
const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? '';

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json() as Promise<T>;
}

// Endpoint paths below are GUESSES: confirm them with whoever owns the API.
export async function getRatings(date: string): Promise<Rating[]> {
  if (USE_MOCKS) {
    return mockRatings as Rating[]; // adjust if the mock wraps the list, e.g. mockRatings.spots
  }
  return getJson<Rating[]>(`${API_BASE}/api/ratings?date=${encodeURIComponent(date)}`);
}

export async function getRating(spotId: string, date: string): Promise<Rating> {
  if (USE_MOCKS) {
    const found = (mockRatings as Rating[]).find((r) => r.spotId === spotId);
    if (!found) throw new Error('Spot not found');
    return found;
  }
  return getJson<Rating>(
    `${API_BASE}/api/ratings/${encodeURIComponent(spotId)}?date=${encodeURIComponent(date)}`
  );
}
