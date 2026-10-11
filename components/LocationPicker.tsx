'use client';

import { useCallback, useId, useRef, useState } from 'react';
import { PLACES, type Place } from '@/lib/geo';
import controls from './controls.module.css';
import styles from './LocationPicker.module.css';
import { useDismiss } from './useDismiss';

export function Chevron() {
  return (
    <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M2 3.5l3 3 3-3" />
    </svg>
  );
}

// The "where from" chip in the top bar: pick a Central Florida town or use the device's location.
export default function LocationPicker({ label, subLabel, current, onChoose, onLocate }: {
  label: string;
  subLabel: string;
  current: string | null;
  onChoose: (place: Place) => void;
  onLocate: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const anchor = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const inputId = useId();

  const close = useCallback((refocus: boolean) => {
    setOpen(false);
    setQuery('');
    if (refocus) button.current?.focus();
  }, []);
  useDismiss(anchor, open, close);

  const q = query.trim().toLowerCase();
  const matches = PLACES.filter((p) => !q || p.name.toLowerCase().includes(q));
  const choose = (place: Place) => {
    onChoose(place);
    close(true);
  };

  return (
    <div ref={anchor} className={styles.anchor}>
      <button
        ref={button}
        type="button"
        className={`${styles.chip} ${open ? styles.chipOpen : ''}`}
        aria-expanded={open}
        aria-label={`Distances from ${label}. Change location`}
        onClick={() => (open ? close(false) : setOpen(true))}
      >
        <span className={controls.homeDot} />
        <span className={styles.name}>{label}</span>
        <span className={styles.sub}>{subLabel}</span>
        <Chevron />
      </button>

      {open && (
        <div className={`${controls.menu} ${styles.menu}`}>
          <label className={controls.menuLabel} htmlFor={inputId}>Search from</label>
          <input
            id={inputId}
            className={styles.input}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && matches[0]) choose(matches[0]);
            }}
            placeholder="Enter a city or town"
            autoComplete="off"
            autoFocus
          />
          <button
            type="button"
            className={`${controls.menuItem} ${styles.locate}`}
            onClick={() => {
              onLocate();
              close(true);
            }}
          >
            <span className={controls.homeDot} />
            Use my current location
          </button>
          <div className={styles.divider} />
          <div className={styles.list}>
            {matches.map((p) => {
              const selected = p.name === current;
              return (
                <button key={p.name} type="button" className={controls.menuItem} aria-pressed={selected} onClick={() => choose(p)}>
                  <span className={controls.check}>{selected ? '✓' : ''}</span>
                  {p.name}
                </button>
              );
            })}
            {matches.length === 0 && <span className={styles.empty}>No matches. Try a nearby town.</span>}
          </div>
        </div>
      )}
    </div>
  );
}
