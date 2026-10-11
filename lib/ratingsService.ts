import type { Spot, SpotRating } from '@/lib/types';
import { getHourlyForecasts } from '@/lib/openMeteo';
import { rateSpot } from '@/lib/scoring';
import { getSpots } from '@/lib/spots';

export async function rateSpots(spots: Spot[], date: string): Promise<SpotRating[]> {
  const bySpotId = await getHourlyForecasts(spots, date);
  return spots.map(spot => {
    const hourly = bySpotId.get(spot.id);
    if (!hourly) throw new Error(`Forecast missing for ${spot.id}`);
    return rateSpot(spot, date, hourly);
  }).sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
}

// Rates one spot from the same all-spots forecast request as the list. Each Open-Meteo URL is
// cached separately, so a single-spot request could be fetched hours apart from the list's and
// disagree with it (a 74 on the list, "Not tonight" on the detail page).
export async function rateOneSpot(spot: Spot, date: string): Promise<SpotRating> {
  const hourly = (await getHourlyForecasts(getSpots(), date)).get(spot.id);
  if (!hourly) throw new Error(`Forecast missing for ${spot.id}`);
  return rateSpot(spot, date, hourly);
}
