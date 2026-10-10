'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import ScoreBadge, { labelColor } from '@/components/ScoreBadge';
import { tonightDate } from '@/components/time';
import type { Spot, SpotRating } from '@/lib/types';
import FactorBreakdown from './FactorBreakdown';
import styles from './spot.module.css';

// Stand-in with the same signature as Person 3's getRating() in /lib/apiClient.ts.
// At the hour 12 switch, import getRating from there instead.
async function fetchRating(spotId: string, date: string): Promise<SpotRating> {
  const res = await fetch(`/api/ratings/${encodeURIComponent(spotId)}?date=${encodeURIComponent(date)}`);
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error ?? `Request failed (${res.status}).`);
  return body as SpotRating;
}

// Development only (see page.tsx): ?mock=closed and friends load one of Person 2's mock
// ratings to check each page state. The header still shows this spot; the mock keeps its
// own spot so its factor numbers and explanations stay consistent.
const MOCKS: Record<string, () => Promise<{ default: unknown }>> = {
  excellent: () => import('@/mocks/rating-excellent.json'),
  fair: () => import('@/mocks/rating-fair.json'),
  closed: () => import('@/mocks/rating-gated-closed.json'),
  clouds: () => import('@/mocks/rating-gated-clouds.json'),
  rain: () => import('@/mocks/rating-gated-rain.json'),
};

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; rating: SpotRating };

function formatCoords({ lat, lon }: Spot) {
  return `${Math.abs(lat).toFixed(3)}° ${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lon).toFixed(3)}° ${lon >= 0 ? 'E' : 'W'}`;
}

export default function SpotDetail({ spot, date, mock }: { spot: Spot; date?: string; mock?: string }) {
  const [state, setState] = useState<State>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const loadMock = mock ? MOCKS[mock] : undefined;
    const request = loadMock
      ? loadMock().then((m) => m.default as SpotRating)
      : fetchRating(spot.id, date ?? tonightDate());
    request
      .then((rating) => { if (!cancelled) setState({ status: 'ready', rating }); })
      .catch((e: unknown) => {
        if (!cancelled) setState({ status: 'error', message: e instanceof Error ? e.message : 'Something went wrong.' });
      });
    return () => { cancelled = true; };
  }, [spot, date, mock, attempt]);

  const retry = () => {
    setState({ status: 'loading' });
    setAttempt((n) => n + 1);
  };

  return (
    <main className={styles.page}>
      <Link href="/" className={styles.back}>← All spots</Link>
      <header className={styles.header}>
        <h1 className={styles.name}>{spot.name}</h1>
        <div className={styles.chips}>
          {spot.region && <span className={styles.chip}>{spot.region}</span>}
          <span className={`${styles.chip} ${styles.mono}`}>{formatCoords(spot)}</span>
          <span className={styles.chip}>Bortle {spot.bortle}</span>
          <span className={styles.chip} style={{ color: labelColor(spot.openAtNight ? 'Excellent' : 'Poor') }}>
            ● {spot.openAtNight ? 'Open at night' : 'Closed at night'}
          </span>
          {spot.darkSkyCertified && <span className={styles.chip}>DarkSky certified</span>}
        </div>
      </header>

      <div className={styles.grid}>
        <div className={styles.column}>
          <section className={`panel ${styles.scorePanel}`} aria-live="polite">
            {state.status === 'loading' && (
              <div className={styles.skeleton} role="status" aria-label="Loading tonight's rating">
                <div className={styles.skeletonRing} />
              </div>
            )}

            {state.status === 'error' && (
              <div role="alert" className={styles.stack}>
                <span className="kicker">Couldn&apos;t load tonight&apos;s rating</span>
                <p className={styles.reason}>{state.message}</p>
                <button type="button" className={styles.button} onClick={retry}>Retry</button>
              </div>
            )}

            {state.status === 'ready' && (
              <>
                <ScoreBadge score={state.rating.score} label={state.rating.label} size="xl" />
                <span className={styles.label} style={{ color: labelColor(state.rating.label) }}>{state.rating.label}</span>
                {state.rating.score === null ? (
                  <>
                    <p className={styles.reason}>{state.rating.gateReason ?? 'Conditions rule this spot out tonight.'}</p>
                    <Link href="/" className={styles.link}>See the best spots tonight →</Link>
                  </>
                ) : (
                  <p className={styles.reason}>Weighted for naked-eye viewing · clouds count most</p>
                )}
              </>
            )}
          </section>

          {state.status === 'loading' && (
            <section className={`panel ${styles.factorPanel}`} aria-hidden="true">
              <div className={styles.skeleton}>
                <div className={styles.skeletonBar} style={{ width: '70%' }} />
                <div className={styles.skeletonBar} style={{ width: '55%' }} />
                <div className={styles.skeletonBar} style={{ width: '62%' }} />
              </div>
            </section>
          )}
          {state.status === 'ready' && <FactorBreakdown rating={state.rating} />}
        </div>
      </div>
    </main>
  );
}
