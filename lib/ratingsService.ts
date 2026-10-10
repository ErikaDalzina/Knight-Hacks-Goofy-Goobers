import type { Spot, SpotRating } from '@/lib/types';
import { getHourlyForecasts } from '@/lib/openMeteo';
import { rateSpot } from '@/lib/scoring';

export async function rateSpots(spots: Spot[], date: string): Promise<SpotRating[]> {
  const bySpotId = await getHourlyForecasts(spots, date);
  return spots.map(spot => {
    const hourly = bySpotId.get(spot.id);
    if (!hourly) throw new Error(`Forecast missing for ${spot.id}`);
    return rateSpot(spot, date, hourly);
  }).sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
}
