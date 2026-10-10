import storedSpots from '@/data/spots.json';
import type { Spot } from '@/lib/types';

// Person 4 owns data/spots.json. The backend reads the same file on every request.
export function getSpots(): Spot[] {
  return storedSpots as Spot[];
}
export function findSpot(id: string): Spot | undefined {
  return getSpots().find((spot) => spot.id === id);
}
