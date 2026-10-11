import { formatLocalTime, moonPhaseName } from '@/components/time';
import type { SpotRating } from '@/lib/types';
import styles from './spot.module.css';
import { moonUpShare } from './timeline';

const SYNODIC_DAYS = 29.530588853;
// A known new moon (UTC). The cycle is counted from here to tell waxing from waning.
const NEW_MOON_MS = Date.UTC(2000, 0, 6, 18, 14);

/**
 * True from new moon to full moon. The API gives only the lit fraction, so the direction
 * comes from the date: the evening of `date` (about 8 PM Eastern) against the mean 29.5-day
 * cycle. That is good to about a day, which only matters right at new or full moon, where
 * the lit edge barely shows anyway.
 */
function isWaxing(date: string): boolean {
  const [y, m, d] = date.split('-').map(Number);
  const evening = Date.UTC(y, m - 1, d + 1, 0, 0);
  const days = (evening - NEW_MOON_MS) / 86400000;
  const age = ((days % SYNODIC_DAYS) + SYNODIC_DAYS) % SYNODIC_DAYS;
  return age < SYNODIC_DAYS / 2;
}

/**
 * The lit part of a 100x100 disc, drawn as if waxing (right side lit). The outer edge is a
 * half circle and the shadow edge is a half ellipse whose width shrinks to nothing at half
 * moon. Area works out to exactly `lit` of the disc.
 */
function litPath(lit: number): string {
  const f = Math.min(1, Math.max(0, lit));
  const rx = Math.max(Math.abs(1 - 2 * f) * 50, 0.01);
  const sweep = f < 0.5 ? 0 : 1; // crescent bulges toward the lit side, gibbous away from it
  return `M 50 0 A 50 50 0 0 1 50 100 A ${rx} 50 0 0 ${sweep} 50 0 Z`;
}

export default function MoonCard({ rating }: { rating: SpotRating }) {
  const { moon, factors, darkWindow, hourly, date } = rating;
  const lit = moon.illumination;
  const waxing = isWaxing(date);

  // The engine only reports a rise or set when it happens during the dark hours.
  const events: { at: string; text: string }[] = [];
  if (moon.set) events.push({ at: moon.set, text: `Sets ${formatLocalTime(moon.set)}` });
  if (moon.rise) events.push({ at: moon.rise, text: `Rises ${formatLocalTime(moon.rise)}` });
  events.sort((a, b) => Date.parse(a.at) - Date.parse(b.at));

  return (
      <section className={`panel ${styles.infoPanel} ${styles.moonPanel} ${styles.orderMoon}`}>
        <h2 className="kicker" style={{ margin: 0 }}>Moon</h2>
        {darkWindow ? (
            <>
              <div className={styles.moonRow}>
                {/* A dark disc with the lit part drawn on it: right side while waxing, left while waning. */}
                <div
                    className={styles.moonDisc}
                    aria-hidden="true"
                    style={{
                      background: '#1d1f30',
                      boxShadow: `0 0 ${Math.round(8 + 24 * lit)}px rgba(233, 226, 200, ${(0.08 + 0.4 * lit).toFixed(2)})`,
                    }}
                >
                  <svg viewBox="0 0 100 100" style={{ display: 'block', width: '100%', height: '100%' }}>
                    <path
                        d={litPath(lit)}
                        fill="#e9e2c8"
                        transform={waxing ? undefined : 'translate(100 0) scale(-1 1)'}
                    />
                  </svg>
                </div>
                <div className={styles.moonText}>
                  <span className={styles.moonLit}>{Math.round(lit * 100)}%</span>
                  <span className={styles.moonPhase}>{moonPhaseName(lit)}</span>
                </div>
              </div>
              <p className={styles.moonEvents}>
                {/* No rise or set while it's dark means the moon is up or down the whole time, as in BestTime. */}
                {events.length ? events.map((e) => e.text).join(' · ') : hourly[0]?.moonUp ? 'Up all night' : 'Down all night'}
              </p>
              <p className={styles.reason} style={{ textAlign: 'left' }}>
                Up for {Math.round(moonUpShare(factors.moon, lit) * 100)}% of dark hours → moon factor {factors.moon.toFixed(2)}
              </p>
            </>
        ) : (
            <p className={styles.notice}>Not measured, no true darkness.</p>
        )}
      </section>
  );
}