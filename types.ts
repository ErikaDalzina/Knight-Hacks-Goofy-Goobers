// ASSUMED SHAPE: adjust field names to match /mocks/ratings.json exactly.
export type Label = 'excellent' | 'good' | 'fair' | 'poor';

export interface Rating {
  spotId: string;
  name: string;
  lat: number;
  lng: number;
  score: number; // higher = better
  label: Label;
  bestTime: string; // e.g. "11:30 PM"
}

export interface LatLng {
  lat: number;
  lng: number;
}

export type SpotWithDistance = Rating & { distanceKm: number };

export interface SpotMapProps {
  spots: SpotWithDistance[];
  center: LatLng;
  onSelect: (spotId: string) => void;
}

// Shared by pins and list cards so colors always match.
export const LABEL_COLORS: Record<Label, string> = {
  excellent: '#2e7d32',
  good: '#7cb342',
  fair: '#f9a825',
  poor: '#c62828',
};
