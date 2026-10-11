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
 * Fetches each night's ratings for one state so the strip can show its best score. Nights
 * arrive independently, so tiles fill in as their forecasts load. A night that isn't in the map
 * yet is still loading. Tiles loaded for another state are dropped, so switching state shows
 * loading tiles rather than the old state's scores.
 */
export function useNightGlances(nights: string[], state: string, reloadKey: number): Glances {
  const [loaded, setLoaded] = useState<{ state: string; glances: Glances }>({ state, glances: {} });
  const key = nights.join(',');

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    const store = (night: string, glance: NightGlance | 'error') => {
      if (cancelled) return;
      setLoaded((l) => ({ state, glances: { ...(l.state === state ? l.glances : {}), [night]: glance } }));
    };
    for (const night of key.split(',')) {
      getRatings(night, state)
        .then((ratings) => store(night, bestOfNight(ratings)))
        .catch(() => store(night, 'error'));
    }
    return () => {
      cancelled = true;
    };
  }, [key, state, reloadKey]);

  return loaded.state === state ? loaded.glances : NO_GLANCES;
}

const NO_GLANCES: Glances = {};
