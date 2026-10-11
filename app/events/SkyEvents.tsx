'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import controls from '@/components/controls.module.css';
import { tonightDate } from '@/components/time';
import type { AstroEvent } from '@/lib/astroEvents';
import {
  categoryLabel, formatEventDates, formatMonthYear, moonAtPeak, upcomingEvents, whenText,
} from '@/lib/skyEvents';
import styles from './events.module.css';

type Filter = 'all' | AstroEvent['category'];
const FILTERS: { value: Filter; label: string; empty: string }[] = [
  { value: 'all', label: 'All', empty: 'No more events on the calendar.' },
  { value: 'Meteor Shower', label: 'Meteor showers', empty: 'No meteor showers on the calendar.' },
  { value: 'Moon Phase', label: 'Moon phases', empty: 'No moon phases on the calendar.' },
];

const isMoon = (e: AstroEvent) => e.category === 'Moon Phase';
const year = (date: string) => date.slice(0, 4);
const eventsText = (n: number) => `${n} ${n === 1 ? 'event' : 'events'}`;

function SourceLink({ event, children }: { event: AstroEvent; children: React.ReactNode }) {
  return (
    <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer"
       aria-label={`${event.sourceName} (opens in a new tab)`}>
      {children}
    </a>
  );
}

// Everything on the page that depends on today's date. "Upcoming" and the countdowns use the
// viewer's night, which only the browser knows, so the first render uses the server's date
// (`serverTonight`, matching the server HTML) and the countdowns appear after mount.
export default function SkyEvents({ events, serverTonight }: { events: AstroEvent[]; serverTonight: string }) {
  const [tonight, setTonight] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  useEffect(() => setTonight(tonightDate()), []);

  const upcoming = upcomingEvents(events, tonight ?? serverTonight);
  const [featured, ...rest] = upcoming;
  const calendar = rest.filter((e) => filter === 'all' || e.category === filter);
  const when = (e: AstroEvent) => (tonight ? whenText(tonight, e.startDate) : null);
  const last = upcoming[upcoming.length - 1];

  return (
    <>
      <header className={styles.header}>
        <span className={styles.pageKicker}>
          Sky events{featured && ` · ${formatMonthYear(featured.startDate)} – ${formatMonthYear(last.endDate)}`}
        </span>
        <h1 className={styles.title}>Upcoming sky events</h1>
        <p className={styles.subtitle}>Plan your next session around meteor showers and moon phases.</p>
      </header>

      {!featured ? (
        <section className={`panel ${styles.empty}`}>
          <h2>No upcoming events</h2>
          <p>There are no remaining events in the current calendar.</p>
        </section>
      ) : (
        <section className={`panel ${styles.featured}`} aria-labelledby="next-event">
          <div className={styles.featuredMain}>
            <div className={styles.meta}>
              <span>Next event</span>
              <span className={styles.metaSep} aria-hidden="true" />
              <span className={styles.metaType}>
                <span className={`${styles.dot} ${isMoon(featured) ? styles.dotMoon : ''}`} aria-hidden="true" />
                {categoryLabel(featured)}
              </span>
            </div>
            <h2 id="next-event" className={styles.featuredName}>{featured.name}</h2>
            <p className={styles.featuredDesc}>{featured.description}</p>
            <div className={styles.tipBox}>
              <span className={styles.tipLabel}>Viewing tip</span>
              <p>{featured.viewingTip}</p>
            </div>
            <div className={styles.actions}>
              <Link href={`/?date=${featured.startDate}`} className={styles.button}>Find a viewing spot</Link>
              <SourceLink event={featured}>View source ↗</SourceLink>
            </div>
          </div>

          <div className={styles.peak}>
            <div className={styles.peakHead}>
              <span className="kicker">Peak</span>
              <div className={styles.peakDate}>
                <span>{formatEventDates(featured.startDate, featured.endDate)}</span>
                {when(featured) && <span className={styles.peakWhen}>{when(featured)}</span>}
              </div>
            </div>
            <dl className={styles.facts}>
              <div><dt>Dates</dt><dd>{formatEventDates(featured.startDate, featured.endDate)}, {year(featured.startDate)}</dd></div>
              <div><dt>Type</dt><dd>{categoryLabel(featured)}</dd></div>
              <div><dt>Moon</dt><dd>{moonAtPeak(featured.startDate)}</dd></div>
              <div><dt>Source</dt><dd><SourceLink event={featured}>{featured.sourceName}</SourceLink></dd></div>
            </dl>
          </div>
        </section>
      )}

      {rest.length > 0 && (
        <section className={styles.calendar} aria-labelledby="calendar-title">
          <div className={styles.calendarHead}>
            <div className={styles.calendarTitle}>
              <span className="kicker">Event calendar</span>
              <h2 id="calendar-title">On the horizon</h2>
            </div>
            <div className={styles.calendarControls}>
              <span className={styles.count}>{eventsText(calendar.length)}</span>
              <div className={controls.segmented} role="group" aria-label="Show events">
                {FILTERS.map((f) => (
                  <button key={f.value} type="button" className={controls.segment}
                          aria-pressed={filter === f.value} onClick={() => setFilter(f.value)}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className={`panel ${styles.list}`}>
            {calendar.length === 0 && (
              <p className={styles.listEmpty}>{FILTERS.find((f) => f.value === filter)?.empty}</p>
            )}
            {calendar.map((e) => (
              <article key={e.id} className={styles.row}>
                <div className={styles.rowDate}>
                  <span>{formatEventDates(e.startDate, e.endDate)}</span>
                  <span className={styles.rowYear}>{year(e.startDate)}{when(e) && ` · ${when(e)}`}</span>
                </div>
                <div className={styles.rowMain}>
                  <span className={`${styles.rowType} ${isMoon(e) ? styles.rowTypeMoon : ''}`}>
                    <span className={`${styles.dot} ${isMoon(e) ? styles.dotMoon : ''}`} aria-hidden="true" />
                    {categoryLabel(e)}
                  </span>
                  <h3 className={styles.rowName}>{e.name}</h3>
                  <p className={styles.rowDesc}>{e.description}</p>
                </div>
                <div className={styles.rowTip}>
                  <span className={styles.tipLabel}>Viewing tip</span>
                  <p>{e.viewingTip}</p>
                </div>
                <span className={styles.rowSource}><SourceLink event={e}>Source ↗</SourceLink></span>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
