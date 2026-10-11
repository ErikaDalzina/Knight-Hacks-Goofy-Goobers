'use client';

import { LABEL_STYLES } from '@/lib/constants';
import styles from './NightStrip.module.css';
import { nightLabels } from './tonight';
import type { Glances } from './useNightGlances';

/** How many nights the strip shows, starting tonight. */
export const STRIP_NIGHTS = 7;

const weekday = (date: string) =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });

// "Next 7 nights" from the Umbra mockup: a tile per night with its best score and the moon.
export default function NightStrip({ nights, selected, glances, onSelect }: {
  nights: string[];
  selected: string;
  glances: Glances;
  onSelect: (date: string) => void;
}) {
  return (
    <div className={styles.strip}>
      <div className={styles.head}>
        <span>Next {nights.length} nights</span>
      </div>
      <div className={styles.tiles} role="group" aria-label="Choose a night">
        {nights.map((night) => {
          const g = glances[night];
          const glance = typeof g === 'object' ? g : null;
          const loading = g === undefined;
          const label = glance?.label ?? 'Not tonight';
          const score = glance?.score ?? null;
          const isSelected = night === selected;

          const scoreText = glance ? (score === null ? '—' : String(Math.round(score))) : loading ? '·' : '—';
          const spoken = glance
            ? score === null ? 'not tonight' : `best score ${Math.round(score)}, ${label}`
            : loading ? 'loading' : 'forecast unavailable';
          // The lit part of the moon grows from the right edge, as in the mockup.
          const moonShadow = glance?.moon != null
            ? `inset -${Math.max(1, Math.round(glance.moon * 12))}px 0 0 0 #e9e2c8`
            : undefined;

          return (
            <button
              key={night}
              type="button"
              className={`${styles.tile} ${isSelected ? styles.tileOn : ''} ${loading ? styles.tileLoading : ''}`}
              aria-pressed={isSelected}
              aria-label={`${nightLabels(night).long}, ${spoken}`}
              onClick={() => onSelect(night)}
            >
              <span className={styles.dow}>{weekday(night)}</span>
              <span className={styles.date}>{Number(night.slice(8, 10))}</span>
              <span className={styles.moon} style={{ boxShadow: moonShadow }} aria-hidden="true" />
              <span className={styles.score} style={{ color: LABEL_STYLES[label].fg }}>{scoreText}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
