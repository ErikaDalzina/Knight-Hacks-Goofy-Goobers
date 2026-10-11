'use client';

import { useCallback, useRef, useState } from 'react';
import controls from './controls.module.css';
import { Chevron } from './LocationPicker';
import { nightLabels } from './tonight';
import { useDismiss } from './useDismiss';

// A chip that opens a menu of upcoming nights. Same pattern as DistanceFilter in SpotsExplorer.
export default function NightPicker({ nights, selected, tonight, onSelect }: {
  nights: string[];
  selected: string;
  tonight: string;
  onSelect: (date: string) => void;
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
        className={`${controls.chip} ${open || selected !== tonight ? controls.chipOn : ''}`}
        aria-expanded={open}
        onClick={() => (open ? close(false) : setOpen(true))}
      >
        {nightLabels(selected).short}
        <Chevron />
      </button>
      {open && (
        <div className={controls.menu} style={{ maxHeight: 360, overflowY: 'auto' }}>
          <span className={controls.menuLabel}>Night</span>
          {nights.map((night) => {
            const isSelected = night === selected;
            return (
              <button
                key={night}
                type="button"
                className={controls.menuItem}
                aria-pressed={isSelected}
                onClick={() => {
                  onSelect(night);
                  close(true);
                }}
              >
                <span className={controls.check}>{isSelected ? '\u2713' : ''}</span>
                {nightLabels(night).short}
                {night === tonight && <span className={controls.count}>Tonight</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
