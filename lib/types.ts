export type Spot = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  bortle: number;
  openAtNight: boolean;
  notes?: string;
  // Optional details for the spot detail page. Leave a field out when it isn't verified.
  region?: string;
  elevationM?: number;
  road?: string;
  seasonalNote?: string;
  darkSkyCertified?: boolean;
  sources?: string[];
};

export type RatingLabel = 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Not tonight';
export type HourlyForecast = { time: string; cloudCover: number; precipitation: number };
export type SpotRating = {
  spot: Spot;
  date: string;
  score: number | null;
  label: RatingLabel;
  gateReason?: string;
  factors: { clouds: number; darkness: number; moon: number };
  darkWindow: { start: string; end: string } | null;
  bestWindow: { start: string; end: string } | null;
  moon: { illumination: number; rise: string | null; set: string | null };
  hourly: { time: string; cloudCover: number; moonUp: boolean }[];
};
export type RateSpot = (spot: Spot, date: string, hourly: HourlyForecast[]) => SpotRating;
