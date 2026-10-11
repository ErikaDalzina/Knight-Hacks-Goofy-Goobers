export type Spot = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  bortle: number;
  openAtNight: boolean;
  notes?: string;
  region?: string;            // shown as a chip on the detail page
  state?: string;             // two-letter code; groups spots for the forecast request
  darkSkyCertified?: boolean; // shown as a "DarkSky certified" chip
  seasonalNote?: string;      // shown as "Season" in the About section
  elevationM?: number;        // metres above sea level
  road?: string;              // shown as "Road" in the About section
  sources?: string[];         // links to where the spot's facts came from
};

export type RatingLabel = 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Not tonight';
export type HourlyForecast = {
  time: string;
  cloudCover: number;
  precipitation: number;
  temperatureF?: number;   // 2 m above ground, in F
  dewPointF?: number;      // in F
  windSpeedKmh?: number;   // 10 m above ground, in km/h
  cloudCoverLow?: number;   // %, Open-Meteo cloud_cover_low
  cloudCoverMid?: number;   // %, cloud_cover_mid
  cloudCoverHigh?: number;  // %, cloud_cover_high
};

export type CloudLayers = {
  low: number | null;   // average % over the dark window
  mid: number | null;
  high: number | null;
};

export type ComfortWarning = { kind: 'cold' | 'wind' | 'dew'; message: string };
export type Comfort = {
  minTempF: number | null;       // coldest hour during the dark window
  maxWindKmh: number | null;     // windiest hour during the dark window
  minDewSpreadF: number | null;  // smallest temperature minus dew point (small = dew)
  warnings: ComfortWarning[];    // always in the order cold, wind, dew
  advice: string | null;         // the one amber advice line; null when nothing needs flagging
};

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
  comfort?: Comfort;       // only on rated nights, and only if the forecast has weather data
  cloudLayers?: CloudLayers;  // only on rated nights, and only if the forecast has layer data
};
export type RateSpot = (spot: Spot, date: string, hourly: HourlyForecast[]) => SpotRating;
