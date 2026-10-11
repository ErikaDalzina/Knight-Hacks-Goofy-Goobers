import storedSpots from '@/data/spots.json';
import type { Spot } from '@/lib/types';

// Person 4 owns data/spots.json. The backend reads the same file on every request.
export function getSpots(): Spot[] {
  return storedSpots as Spot[];
}
// One state's spots (e.g. "FL"), or every spot when state is null.
export function getSpotsInState(state: string | null): Spot[] {
  const spots = getSpots();
  return state === null ? spots : spots.filter((spot) => spot.state === state);
}
export function findSpot(id: string): Spot | undefined {
  return getSpots().find((spot) => spot.id === id);
}
