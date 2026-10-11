import { labelColor } from '@/components/ScoreBadge';
import { formatLocalTime } from '@/components/time';
import { DEFAULT_WEIGHTS } from '@/lib/constants';
import type { SpotRating } from '@/lib/types';
import styles from './spot.module.css';
import { moonUpShare } from './timeline';

type Factor = { name: string; value: number; weight: number; measured: boolean; explain: string };

// Plain-words reasons for each factor, built only from the SpotRating contract.
function explainFactors({ factors, darkWindow, moon, spot }: SpotRating): Factor[] {
  // Without true darkness the engine sends 0 for clouds and moon, which would read as bad weather.
  const night = darkWindow && `${formatLocalTime(darkWindow.start)}–${formatLocalTime(darkWindow.end)}`;
  const notMeasured = 'Not measured, no true darkness';
  const lit = Math.round(moon.illumination * 100);
  const upShare = Math.round(moonUpShare(factors.moon, moon.illumination) * 100);

  return [
    {
      name: 'Clouds', value: factors.clouds, weight: DEFAULT_WEIGHTS.clouds, measured: !!night,
      explain: night ? `Avg ${Math.round((1 - factors.clouds) * 100)}% cover, ${night}` : notMeasured,
    },
    {
      name: 'Darkness', value: factors.darkness, weight: DEFAULT_WEIGHTS.darkness, measured: true,
      explain: `Bortle ${spot.bortle} → (9 − ${spot.bortle}) ÷ 8`,
    },
    {
      name: 'Moon', value: factors.moon, weight: DEFAULT_WEIGHTS.moon, measured: !!night,
      explain: !night ? notMeasured : lit === 0 ? 'New moon · no moonlight' : `${lit}% lit · up ${upShare}% of dark hours`,
    },
  ];
}

export default function FactorBreakdown({ rating }: { rating: SpotRating }) {
  // Gated spots still show the bars so people see why, but there is no score for points to add up to.
  const scored = rating.score !== null;
  return (
    <section className={`panel ${styles.factorPanel} ${styles.orderFactors}`}>
      <h2 className="kicker" style={{ margin: 0 }}>
        <span className={styles.desktopOnly}>Factor breakdown</span>
        <span className={styles.phoneOnly}>Why it scored{scored ? ` ${rating.score}` : ''}</span>
      </h2>
      {explainFactors(rating).map((f) => (
        <div key={f.name} className={styles.factor}>
          <div className={styles.factorRow}>
            <span className={styles.factorName}>{f.name}</span>
            <span className={styles.factorValue}>{f.measured ? f.value.toFixed(2) : '—'}</span>
          </div>
          <div className={styles.track} aria-hidden="true">
            <div className={styles.fill} style={{ width: `${f.measured ? Math.round(f.value * 100) : 0}%` }} />
          </div>
          <div className={`${styles.factorRow} ${styles.factorNote}`}>
            <span>{f.explain}</span>
            <span className={styles.factorMath}>
              × {Math.round(f.weight * 100)}%{scored ? ` = ${(100 * f.value * f.weight).toFixed(1)}` : ''}
            </span>
          </div>
        </div>
      ))}
      <div className={styles.total}>
        <span>Score</span>
        <span className={styles.totalValue} style={{ color: labelColor(rating.label) }}>{scored ? rating.score : '—'}</span>
      </div>
    </section>
  );
}
