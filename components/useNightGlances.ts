import { useEffect, useState } from 'react';
import { getRatings } from '@/lib/apiClient';
import type { RatingLabel, SpotRating } from '@/lib/types';

/** One night at a glance, for a tile in the night strip. */
export type NightGlance = {
  score: number | null; // the best score across all spots; null when every spot is ruled out
  label: RatingLabel;
  moon: number | null; // lit fraction, 0 to 1
};

export type Glances = Record<string, NightGlance | 'error'>;

/** The top-rated spot sets the night's score and color. The moon is the same across the region. */
export function bestOfNight(ratings: SpotRating[]): NightGlance {
  const top = ratings
    .filter((r) => r.score !== null)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];
  return {
    score: top?.score ?? null,
    label: top?.label ?? 'Not tonight',
    moon: ratings[0]?.moon.illumination ?? null,
  };
}

/**
 * Fetches each night's ratings so the strip can show its best score. Nights arrive
 * independently, so tiles fill in as their forecasts load. A night that isn't in the map yet
 * is still loading.
 */
export function useNightGlances(nights: string[], reloadKey: number): Glances {
  const [glances, setGlances] = useState<Glances>({});
  const key = nights.join(',');

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    for (const night of key.split(',')) {
      getRatings(night)
        .then((ratings) => {
          if (!cancelled) setGlances((g) => ({ ...g, [night]: bestOfNight(ratings) }));
        })
        .catch(() => {
          if (!cancelled) setGlances((g) => ({ ...g, [night]: 'error' }));
        });
    }
    return () => {
      cancelled = true;
    };
  }, [key, reloadKey]);

  return glances;
}
