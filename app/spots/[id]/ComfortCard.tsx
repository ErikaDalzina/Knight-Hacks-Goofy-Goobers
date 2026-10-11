import type { Comfort, ComfortWarning, SpotRating } from '@/lib/types';
import styles from './spot.module.css';

const toMph = (kmh: number) => Math.round(kmh * 0.621371);

// The worst of the dark hours, in the units Florida stargazers use. A number turns amber when
// the engine (lib/scoring/comfort.ts) warns about it.
function stats(comfort: Comfort): { kind: ComfortWarning['kind']; value: string; label: string }[] {
  const { minTempF, maxWindKmh, minDewSpreadF } = comfort;
  return [
    { kind: 'cold', value: minTempF === null ? '—' : `${Math.round(minTempF)}°F`, label: 'overnight low' },
    { kind: 'wind', value: maxWindKmh === null ? '—' : `${toMph(maxWindKmh)} mph`, label: 'max wind' },
    { kind: 'dew', value: minDewSpreadF === null ? '—' : `${Math.round(minDewSpreadF)}°F`, label: 'dew spread' },
  ];
}

// What to pack for the night (mockup frames 1b and 1d). Comfort never changes the score.
export default function ComfortCard({ rating }: { rating: SpotRating }) {
  const { comfort } = rating;
  const warned = new Set(comfort?.warnings.map((w) => w.kind));

  return (
    <section className={`panel ${styles.infoPanel} ${styles.comfortPanel} ${styles.orderComfort}`}>
      <h2 className="kicker" style={{ margin: 0 }}>Comfort &amp; gear</h2>
      {comfort ? (
        <>
          <dl className={styles.comfortStats}>
            {stats(comfort).map((s) => (
              <div key={s.kind}>
                <dt>{s.label}</dt>
                <dd className={warned.has(s.kind) ? styles.comfortWarn : undefined}>{s.value}</dd>
              </div>
            ))}
          </dl>
          {comfort.advice ? (
            <p className={styles.advice}>{comfort.advice}</p>
          ) : (
            <p className={styles.reason}>No cold, wind or dew worries.</p>
          )}
        </>
      ) : (
        // The engine only checks comfort on rated nights, and only when the forecast has weather.
        <p className={styles.notice}>
          {rating.score === null ? 'Only checked on nights worth going out.' : 'No temperature or wind forecast for this night.'}
        </p>
      )}
    </section>
  );
}
