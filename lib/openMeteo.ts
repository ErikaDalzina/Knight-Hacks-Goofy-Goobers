import type { HourlyForecast, Spot } from '@/lib/types';
import { nextDate } from '@/lib/date';

const FORECAST_API = 'https://api.open-meteo.com/v1/forecast';
const CACHE_SECONDS = 30 * 60;

type ApiLocation = {
  utc_offset_seconds: number;
  timezone: string;
  hourly?: {
    time: string[];
    cloud_cover: Array<number | null>;
    precipitation: Array<number | null>;
  };
};

export class WeatherServiceError extends Error {
  constructor(message: string) { super(message); this.name = 'WeatherServiceError'; }
}

function offsetSuffix(seconds: number): string {
  const sign = seconds < 0 ? '-' : '+';
  const totalMinutes = Math.abs(Math.trunc(seconds / 60));
  const hh = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const mm = String(totalMinutes % 60).padStart(2, '0');
  return `${sign}${hh}:${mm}`;
}

function transformHourly(location: ApiLocation): HourlyForecast[] {
  const data = location.hourly;
  if (!data || !Array.isArray(data.time) || !Array.isArray(data.cloud_cover) ||
      !Array.isArray(data.precipitation) ||
      data.time.length !== data.cloud_cover.length ||
      data.time.length !== data.precipitation.length ||
      !Number.isFinite(location.utc_offset_seconds)) {
    throw new WeatherServiceError('The weather service returned incomplete hourly data.');
  }
  const suffix = offsetSuffix(location.utc_offset_seconds);
  return data.time.map((time, i) => {
    const cloudCover = data.cloud_cover[i];
    const precipitation = data.precipitation[i];
    if (cloudCover === null || precipitation === null ||
        !Number.isFinite(cloudCover) || !Number.isFinite(precipitation)) {
      throw new WeatherServiceError('The weather forecast has missing hours.');
    }
    // Open-Meteo sends local ISO times without offsets when timezone=auto.
    // Append the returned offset so the scoring engine can parse actual instants.
    return { time: `${time}${suffix}`, cloudCover, precipitation };
  });
}

/** ONE Open-Meteo request for the supplied locations (max 40 per request). */
export async function getHourlyForecasts(
  spots: Spot[], date: string,
): Promise<Map<string, HourlyForecast[]>> {
  if (spots.length === 0) return new Map();
  if (spots.length > 40) {
    throw new WeatherServiceError('More than 40 spots: split locations into batches.');
  }
  const url = new URL(FORECAST_API);
  url.searchParams.set('latitude', spots.map(s => s.lat).join(','));
  url.searchParams.set('longitude', spots.map(s => s.lon).join(','));
  url.searchParams.set('hourly', 'cloud_cover,precipitation');
  url.searchParams.set('timezone', 'auto');
  url.searchParams.set('start_date', date);
  url.searchParams.set('end_date', nextDate(date));

  let response: Response;
  try {
    response = await fetch(url.toString(), { next: { revalidate: CACHE_SECONDS } });
  } catch {
    throw new WeatherServiceError('Could not connect to the weather provider.');
  }
  if (!response.ok) {
    throw new WeatherServiceError(`Weather provider returned HTTP ${response.status}. The date may be outside the forecast range.`);
  }

  let payload: unknown;
  try { payload = await response.json(); }
  catch { throw new WeatherServiceError('Weather provider returned invalid JSON.'); }
  const locations = (Array.isArray(payload) ? payload : [payload]) as ApiLocation[];
  if (locations.length !== spots.length) {
    throw new WeatherServiceError('Weather response did not match the requested spot count.');
  }
  return new Map(spots.map((spot, i) => [spot.id, transformHourly(locations[i])]));
}
