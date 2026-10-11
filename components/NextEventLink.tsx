'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { astroEvents } from '@/lib/astroEvents';
import { upcomingEvents, whenText } from '@/lib/skyEvents';
import styles from './NextEventLink.module.css';
import { tonightDate } from './time';

type Next = { name: string; when: string };

// The next event that hasn't ended, by the viewer's night (the same rule as the Sky events page).
function nextEvent(tonight: string): Next | null {
  const event = upcomingEvents(astroEvents, tonight)[0];
  return event ? { name: event.shortName ?? event.name, when: whenText(tonight, event.startDate) } : null;
}

// The next sky event and a way into the events page. 'pill' is the top bar pill from the mockup
// (frame 1a); phones have no room for it there, so they show the 'row' card under the hero.
// The event depends on the viewer's clock, so it fills in after mount; the server can't know it.
export default function NextEventLink({ variant = 'pill', className = '' }: {
  variant?: 'pill' | 'row';
  className?: string;
}) {
  const [next, setNext] = useState<Next | null>(null);
  useEffect(() => setNext(nextEvent(tonightDate())), []);

  return (
    <Link
      href="/events"
      className={`${styles[variant]} ${className}`}
      aria-label={next ? `Sky events. Next: ${next.name}, ${next.when}` : 'Sky events'}
    >
      {next && (
        <>
          <span className={styles.kicker}>Next event</span>
          <span className={styles.name}>{next.name}</span>
          <span className={styles.when}>{next.when}</span>
        </>
      )}
      <span className={styles.cta}>
        Sky events
        <svg width="6" height="9" viewBox="0 0 9 12" fill="none" stroke="currentColor" strokeWidth="1.8"
             strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M2.5 1.5L7 6l-4.5 4.5" />
        </svg>
      </span>
    </Link>
  );
}
