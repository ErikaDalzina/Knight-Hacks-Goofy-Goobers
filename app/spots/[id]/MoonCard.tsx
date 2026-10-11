import { formatLocalTime, moonPhaseName } from '@/components/time';
import type { SpotRating } from '@/lib/types';
import styles from './spot.module.css';
import { moonUpShare } from './timeline';

export default function MoonCard({ rating }: { rating: SpotRating }) {
  const { moon, factors, darkWindow, hourly } = rating;
  const lit = moon.illumination;

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
            {/* Brightness follows the lit fraction; the shape makes no waxing/waning claim. */}
            <div
              className={styles.moonDisc}
              aria-hidden="true"
              style={{
                background: `color-mix(in srgb, #e9e2c8 ${Math.round(lit * 100)}%, #1d1f30)`,
                boxShadow: `0 0 ${Math.round(8 + 24 * lit)}px rgba(233, 226, 200, ${(0.08 + 0.4 * lit).toFixed(2)})`,
              }}
            />
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
        <p className={styles.notice}>Not measured, no true darkness tonight.</p>
      )}
    </section>
  );
}
