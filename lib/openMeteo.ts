
import type { HourlyForecast, Spot } from '@/lib/types';
import { nextDate } from '@/lib/date';

const FORECAST_API = 'https://api.open-meteo.com/v1/forecast';
const CACHE_SECONDS = 30 * 60;
const REQUEST_TIMEOUT_MS = 8000;

type ApiLocation = {
  utc_offset_seconds: number;
  timezone: string;
  hourly?: {
    time: string[];
    cloud_cover: Array<number | null>;
    precipitation: Array<number | null>;
    temperature_2m?: Array<number | null>;
    dew_point_2m?: Array<number | null>;
    wind_speed_10m?: Array<number | null>;
  };
};

export class WeatherServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WeatherServiceError';
  }
}

function offsetSuffix(seconds: number): string {
  const sign = seconds < 0 ? '-' : '+';
  const totalMinutes = Math.abs(Math.trunc(seconds / 60));
  const hh = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const mm = String(totalMinutes % 60).padStart(2, '0');

  return `${sign}${hh}:${mm}`;
}

function optionalNumber(
    value: number | null | undefined
): number | undefined {
  return typeof value === 'number' && Number.isFinite(value)
      ? value
      : undefined;
}

function transformHourly(location: ApiLocation): HourlyForecast[] {
  const data = location.hourly;

  if (
      !data ||
      !Array.isArray(data.time) ||
      !Array.isArray(data.cloud_cover) ||
      !Array.isArray(data.precipitation) ||
      data.time.length !== data.cloud_cover.length ||
      data.time.length !== data.precipitation.length ||
      !Number.isFinite(location.utc_offset_seconds)
  ) {
    throw new WeatherServiceError(
        'The weather service returned incomplete hourly data.'
    );
  }

  // Validate optional comfort arrays when Open-Meteo provides them.
  const comfortArrays = [
    data.temperature_2m,
    data.dew_point_2m,
    data.wind_speed_10m,
  ];

  for (const values of comfortArrays) {
    if (
        values !== undefined &&
        (!Array.isArray(values) || values.length !== data.time.length)
    ) {
      throw new WeatherServiceError(
          'The weather service returned mismatched comfort data.'
      );
    }
  }

  const suffix = offsetSuffix(location.utc_offset_seconds);

  return data.time.map((time, i): HourlyForecast => {
    const cloudCover = data.cloud_cover[i];
    const precipitation = data.precipitation[i];

    if (
        cloudCover === null ||
        precipitation === null ||
        !Number.isFinite(cloudCover) ||
        !Number.isFinite(precipitation)
    ) {
      throw new WeatherServiceError(
          'The weather forecast has missing hours.'
      );
    }

    const temperatureF = optionalNumber(
        data.temperature_2m?.[i]
    );

    const dewPointF = optionalNumber(
        data.dew_point_2m?.[i]
    );

    const windSpeedKmh = optionalNumber(
        data.wind_speed_10m?.[i]
    );

    return {
      time: `${time}${suffix}`,
      cloudCover,
      precipitation,

      ...(temperatureF === undefined
          ? {}
          : { temperatureF }),

      ...(dewPointF === undefined
          ? {}
          : { dewPointF }),

      ...(windSpeedKmh === undefined
          ? {}
          : { windSpeedKmh }),
    };
  });
}

/**
 * One Open-Meteo request for all supplied locations.
 * Maximum 40 spots per request.
 */
export async function getHourlyForecasts(
    spots: Spot[],
    date: string,
): Promise<Map<string, HourlyForecast[]>> {
  if (spots.length === 0) {
    return new Map();
  }

  if (spots.length > 40) {
    throw new WeatherServiceError(
        'More than 40 spots: split locations into batches.'
    );
  }

  const url = new URL(FORECAST_API);

  url.searchParams.set(
      'latitude',
      spots.map(spot => spot.lat).join(',')
  );

  url.searchParams.set(
      'longitude',
      spots.map(spot => spot.lon).join(',')
  );

  // Existing scoring data + new comfort data.
  url.searchParams.set(
      'hourly',
      [
        'cloud_cover',
        'precipitation',
        'temperature_2m',
        'dew_point_2m',
        'wind_speed_10m',
      ].join(',')
  );

  // IMPORTANT: Match the units already defined in lib/types.ts.
  url.searchParams.set('temperature_unit', 'fahrenheit');
  url.searchParams.set('wind_speed_unit', 'kmh');

  url.searchParams.set('timezone', 'auto');
  url.searchParams.set('start_date', date);
  url.searchParams.set('end_date', nextDate(date));

  let response: Response;

  try {
    response = await fetch(url.toString(), {
      next: { revalidate: CACHE_SECONDS },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    if (
        error instanceof Error &&
        (error.name === 'TimeoutError' ||
            error.name === 'AbortError')
    ) {
      throw new WeatherServiceError(
          'The weather service took too long. Please try again.'
      );
    }

    throw new WeatherServiceError(
        'Could not connect to the weather provider.'
    );
  }

  if (!response.ok) {
    throw new WeatherServiceError(
        `Weather provider returned HTTP ${response.status}. ` +
        'The date may be outside the forecast range.'
    );
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    throw new WeatherServiceError(
        'Weather provider returned invalid JSON.'
    );
  }

  const locations = (
      Array.isArray(payload) ? payload : [payload]
  ) as ApiLocation[];

  if (locations.length !== spots.length) {
    throw new WeatherServiceError(
        'Weather response did not match the requested spot count.'
    );
  }

  return new Map(
      spots.map((spot, i) => [
        spot.id,
        transformHourly(locations[i]),
      ])
  );
}
