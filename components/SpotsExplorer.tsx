'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { getRatings } from '@/lib/apiClient';
import { distanceMiles, useUserLocation } from '@/lib/geo';
import type { SpotRating } from '@/lib/types';
import SpotCard, { type RatedSpot } from './SpotCard';
import styles from './SpotsExplorer.module.css';
import { tonightDate } from './time';

// Leaflet touches `window`, so the map only loads in the browser.
const SpotMap = dynamic(() => import('./SpotMap'), {
  ssr: false,
  loading: () => <div className={styles.mapLoading}>Loading map…</div>,
});

type Sort = 'score' | 'distance';

export default function SpotsExplorer() {
  const { location } = useUserLocation();
  const [ratings, setRatings] = useState<SpotRating[]>([]);
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');
  const [sort, setSort] = useState<Sort>('score');
  const [date] = useState(tonightDate);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getRatings(date)
      .then((data) => {
        if (cancelled) return;
        setRatings(data);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey, date]);

  const retry = () => {
    setStatus('loading');
    setReloadKey((k) => k + 1);
  };

  const items: RatedSpot[] = useMemo(() => {
    const withDistance = ratings.map((r) => ({
      ...r,
      distanceMi: distanceMiles(location, { lat: r.spot.lat, lon: r.spot.lon }),
    }));
    return withDistance.sort((a, b) =>
      sort === 'score' ? (b.score ?? -1) - (a.score ?? -1) : a.distanceMi - b.distanceMi
    );
  }, [ratings, location, sort]);

  return (
    <div className={styles.page}>
      <div className={styles.mapPane}>
        <SpotMap spots={items} center={location} date={date} />
      </div>

      <aside className={styles.listPane}>
        <div className={styles.toolbar}>
          <span>Sort by</span>
          {(['score', 'distance'] as Sort[]).map((mode) => (
            <button
              key={mode}
              type="button"
              aria-pressed={sort === mode}
              className={sort === mode ? styles.toggleActive : styles.toggle}
              onClick={() => setSort(mode)}
            >
              {mode}
            </button>
          ))}
        </div>

        {status === 'loading' && <p className={styles.state}>Loading spots…</p>}

        {status === 'error' && (
          <div className={styles.state}>
            <p>Couldn&apos;t load spots. Check your connection and try again.</p>
            <button type="button" className={styles.toggle} onClick={retry}>
              Retry
            </button>
          </div>
        )}

        {status === 'ready' && items.length === 0 && (
          <p className={styles.state}>No spots found for tonight.</p>
        )}

        {status === 'ready' && items.length > 0 && (
          <div className={styles.cards}>
            {items.map((item) => (
                <SpotCard key={item.spot.id} item={item} date={date} />
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}
