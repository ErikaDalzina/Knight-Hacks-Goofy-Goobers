'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getRatings } from '@/lib/apiClient';
import { LABEL_COLORS, LABEL_THRESHOLDS } from '@/lib/constants';
import { distanceMiles, useUserLocation } from '@/lib/geo';
import type { RatingLabel, SpotRating } from '@/lib/types';
import controls from './controls.module.css';
import LocationPicker, { Chevron } from './LocationPicker';
import SpotCard, { type RatedSpot } from './SpotCard';
import styles from './SpotsExplorer.module.css';
import TonightHero from './TonightHero';
import TopBar from './TopBar';
import { useDismiss } from './useDismiss';
import NightStrip, { STRIP_NIGHTS } from './NightStrip';
import { formatHourShort, nightOptions, tonightDate } from './time';
import { nightLabels, nightName, summarizeNight } from './tonight';
import { useNightGlances } from './useNightGlances';

// Leaflet touches `window`, so the map only loads in the browser.
const SpotMap = dynamic(() => import('./SpotMap'), {
  ssr: false,
  loading: () => <div className={styles.mapLoading}>Loading map…</div>,
});

type Sort = 'score' | 'distance';

const DISTANCES: (number | null)[] = [25, 50, 75, 100, null]; // miles; null means any
const distanceText = (miles: number | null) => (miles === null ? 'Any distance' : `Within ${miles} mi`);
const spotsText = (n: number) => `${n} ${n === 1 ? 'spot' : 'spots'}`;
const NO_RATINGS: SpotRating[] = [];

const LEGEND: { label: RatingLabel; range: string }[] = [
  { label: 'Excellent', range: `${LABEL_THRESHOLDS.excellent}–100` },
  { label: 'Good', range: `${LABEL_THRESHOLDS.good}–${LABEL_THRESHOLDS.excellent - 1}` },
  { label: 'Fair', range: `${LABEL_THRESHOLDS.fair}–${LABEL_THRESHOLDS.good - 1}` },
  { label: 'Poor', range: `0–${LABEL_THRESHOLDS.fair - 1}` },
];

function MapLegend({ title }: { title: string }) {
  return (
    <div className={styles.legend}>
      <span className={styles.legendTitle}>{title}</span>
      {LEGEND.map(({ label, range }) => (
        <div key={label} className={styles.legendRow}>
          <span className={styles.legendDot} style={{ background: LABEL_COLORS[label] }} />
          {label}
          <span className={styles.legendRange}>{range}</span>
        </div>
      ))}
      <div className={styles.legendRow}>
        <span className={`${styles.legendDot} ${styles.legendHollow}`} />
        Not tonight
      </div>
    </div>
  );
}

function DistanceFilter({ value, counts, onChange }: {
  value: number | null;
  counts: number[];
  onChange: (miles: number | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const close = useCallback((refocus: boolean) => {
    setOpen(false);
    if (refocus) button.current?.focus();
  }, []);
  useDismiss(anchor, open, close);

  return (
    <div ref={anchor} className={controls.anchor}>
      <button
        ref={button}
        type="button"
        className={`${controls.chip} ${open || value !== null ? controls.chipOn : ''}`}
        aria-expanded={open}
        onClick={() => (open ? close(false) : setOpen(true))}
      >
        {distanceText(value)}
        <Chevron />
      </button>
      {open && (
        <div className={`${controls.menu} ${styles.distanceMenu}`}>
          <span className={controls.menuLabel}>Distance from home</span>
          {DISTANCES.map((miles, i) => {
            const selected = miles === value;
            return (
              <button
                key={miles ?? 'any'}
                type="button"
                className={controls.menuItem}
                aria-pressed={selected}
                onClick={() => {
                  onChange(miles);
                  close(true);
                }}
              >
                <span className={controls.check}>{selected ? '✓' : ''}</span>
                {distanceText(miles)}
                <span className={controls.count}>{spotsText(counts[i])}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function SpotsExplorer() {
  const home = useUserLocation();
  // Ratings are fetched for one state at a time, so each list remembers which state it's for.
  const [loaded, setLoaded] = useState<{ state: string; ratings: SpotRating[] }>({ state: '', ratings: [] });
  const [fetchStatus, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [tonight, setTonight] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [sort, setSort] = useState<Sort>('score');
  const [openOnly, setOpenOnly] = useState(false);
  const [maxMiles, setMaxMiles] = useState<number | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [phoneView, setPhoneView] = useState<'list' | 'map'>('list');

  // Set after mount: "tonight" depends on the viewer's clock, which the server can't know.
  // A valid ?date= in the URL picks another night, so shared links and the detail page agree.
  useEffect(() => {
    const today = tonightDate();
    const asked = new URLSearchParams(window.location.search).get('date');
    setTonight(today);
    setDate(asked && nightOptions(today, STRIP_NIGHTS).includes(asked) ? asked : today);
  }, []);

  const state = home.state;
  useEffect(() => {
    if (!date) return;
    let cancelled = false;
    getRatings(date, state)
        .then((data) => {
          if (cancelled) return;
          setLoaded({ state, ratings: data });
          setErrorMessage(null);
          setStatus('ready');
        })
        .catch((err) => {
          if (cancelled) return;
          setLoaded({ state, ratings: [] });
          // fetch() rejects with a TypeError when the network is down. Keep the generic text for that.
          setErrorMessage(err instanceof Error && !(err instanceof TypeError) ? err.message : null);
          setStatus('error');
        });
    return () => {
      cancelled = true;
    };
  }, [reloadKey, date, state]);

  // After a switch to another state, show loading (and no pins, so the map fits the new state's
  // spots when they arrive) until that state's list is in.
  const current = loaded.state === state;
  const status = current ? fetchStatus : 'loading';
  const ratings = current ? loaded.ratings : NO_RATINGS;

  const retry = () => {
    setStatus('loading');
    setReloadKey((k) => k + 1);
  };

  const nights = useMemo(() => (tonight ? nightOptions(tonight, STRIP_NIGHTS) : []), [tonight]);
  const glances = useNightGlances(nights, state, reloadKey);

  const selectNight = (next: string) => {
    if (next === date) return;
    setStatus('loading');
    setDate(next);
    const url = new URL(window.location.href);
    url.searchParams.set('date', next);
    window.history.replaceState(null, '', url); // keeps other params, like a later ?w=
  };

  const items: RatedSpot[] = useMemo(() => {
    const withDistance = ratings.map((r) => ({
      ...r,
      distanceMi: distanceMiles(home.location, { lat: r.spot.lat, lon: r.spot.lon }),
    }));
    return withDistance.sort((a, b) =>
      sort === 'score' ? (b.score ?? -1) - (a.score ?? -1) : a.distanceMi - b.distanceMi
    );
  }, [ratings, home.location, sort]);

  const openItems = useMemo(() => items.filter((i) => !openOnly || i.spot.openAtNight), [items, openOnly]);
  const shown = useMemo(
    () => openItems.filter((i) => maxMiles === null || i.distanceMi <= maxMiles),
    [openItems, maxMiles]
  );
  const distanceCounts = DISTANCES.map((miles) => openItems.filter((i) => miles === null || i.distanceMi <= miles).length);

  const summary = useMemo(
    () => (status === 'ready' ? summarizeNight(ratings, home.location) : null),
    [status, ratings, home.location]
  );

  // The span the cards' cloud bars cover, e.g. "clouds 9p → 5a".
  const hours = ratings.find((r) => r.hourly.length)?.hourly;
  const cloudSpan = hours && `clouds ${formatHourShort(hours[0].time)} → ${formatHourShort(hours[hours.length - 1].time)}`;

  // "tonight", or the picked night's short label ("Tue · Oct 13") for the list and legend.
  const night = date && tonight ? nightName(date, tonight) : null;
  const forNight = !night || night.isTonight ? 'tonight' : night.label;

  const clearFilters = () => {
    setOpenOnly(false);
    setMaxMiles(null);
  };

  return (
    <>
      <TopBar>
        <LocationPicker
          label={home.label}
          subLabel={home.subLabel}
          current={home.placeName}
          onChoose={home.choosePlace}
          onLocate={home.locateMe}
        />
        {date && <span className={controls.pill}>{nightLabels(date).short}</span>}
      </TopBar>

      <main className={styles.page}>
        <TonightHero
          status={status}
          summary={summary}
          date={date}
          tonight={tonight}
          aside={
            date && nights.length > 0 ? (
              <NightStrip nights={nights} selected={date} glances={glances} onSelect={selectNight} />
            ) : null
          }
        />

        <div className={`${styles.phoneBar} ${styles.phoneOnly}`}>
          <div className={`${controls.segmented} ${styles.phoneTabs}`}>
            {(['list', 'map'] as const).map((view) => (
              <button
                key={view}
                type="button"
                className={controls.segment}
                aria-pressed={phoneView === view}
                onClick={() => setPhoneView(view)}
              >
                {view === 'list' ? 'List' : 'Map'}
              </button>
            ))}
          </div>
          <button
            type="button"
            className={styles.sortToggle}
            onClick={() => setSort((s) => (s === 'score' ? 'distance' : 'score'))}
          >
            {sort === 'score' ? 'By rating' : 'By distance'} ⇅
          </button>
        </div>

        <div className={styles.grid} data-view={phoneView}>
          <section className={styles.mapPane} aria-label="Map of spots">
            {/* Pins only for a loaded night, so switching nights or an error never leaves old scores up. */}
            {date && (
              <SpotMap
                spots={status === 'ready' ? shown : []}
                home={home.location}
                date={date}
                activeId={activeId}
                onHover={setActiveId}
              />
            )}
            <MapLegend title={`Rated for ${forNight}`} />
          </section>

          <section className={styles.listPane} aria-label={`Spots ranked for ${forNight}`}>
            <div className={`${styles.listHead} ${styles.desktopOnly}`}>
              <span className={styles.count}>
                {status === 'ready'
                  ? `${spotsText(shown.length)} · ${sort === 'score' ? `ranked for ${forNight}` : 'nearest first'}`
                  : 'Spots'}
              </span>
              <div className={`${controls.segmented} ${styles.pushRight}`}>
                {(['score', 'distance'] as Sort[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className={controls.segment}
                    aria-pressed={sort === mode}
                    onClick={() => setSort(mode)}
                  >
                    {mode === 'score' ? 'Rating' : 'Distance'}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.filters}>
              <button
                type="button"
                className={`${controls.chip} ${openOnly ? controls.chipOn : ''}`}
                aria-pressed={openOnly}
                onClick={() => setOpenOnly((o) => !o)}
              >
                <span className={controls.dot} />
                Open at night only
              </button>
              <DistanceFilter value={maxMiles} counts={distanceCounts} onChange={setMaxMiles} />
              {cloudSpan && <span className={`${styles.caption} ${styles.desktopOnly}`}>{cloudSpan}</span>}
            </div>

            <div className={styles.list}>
              {status === 'loading' && (
                <div role="status" aria-label="Loading spots" className={styles.skeletonList}>
                  {Array.from({ length: 6 }, (_, i) => <div key={i} className={styles.skeletonCard} />)}
                </div>
              )}

              {status === 'error' && (
                <div className={styles.state} role="alert">
                  <p>{errorMessage ?? "Couldn't load spots. Check your connection and try again."}</p>
                  <button type="button" className={controls.chip} onClick={retry}>Retry</button>
                </div>
              )}

              {status === 'ready' && items.length === 0 && (
                <p className={styles.state}>No spots found for {forNight}.</p>
              )}

              {status === 'ready' && items.length > 0 && shown.length === 0 && (
                <div className={styles.state}>
                  <p>No spots match these filters.</p>
                  <button type="button" className={controls.chip} onClick={clearFilters}>Clear filters</button>
                </div>
              )}

              {status === 'ready' && date && shown.map((item) => (
                <SpotCard
                  key={item.spot.id}
                  item={item}
                  date={date}
                  active={item.spot.id === activeId}
                  onHover={setActiveId}
                />
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
