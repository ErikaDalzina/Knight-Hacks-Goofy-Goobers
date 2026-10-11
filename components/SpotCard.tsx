import Link from 'next/link';
import { LABEL_COLORS } from '@/lib/constants';
import { formatWindow } from '@/lib/format';
import type { SpotRating } from '@/lib/types';
import ScoreBadge from './ScoreBadge';
import styles from './SpotsExplorer.module.css';

export type RatedSpot = SpotRating & { distanceMi: number };

// One row of the ranked list (mockup frames 1a and 1c). Hovering or focusing it lights up its pin.
export default function SpotCard({ item, date, active, onHover }: {
  item: RatedSpot;
  date: string;
  active: boolean;
  onHover: (id: string | null) => void;
}) {
  const { spot, label, hourly } = item;
  const color = LABEL_COLORS[label];
  const best = formatWindow(item.bestWindow);
  const gated = item.score === null;
  const meta = gated ? item.gateReason ?? 'Not tonight' : best ? `Best ${best}` : 'No clear window';
  const miles = `${Math.round(item.distanceMi)} mi`;

  return (
    <Link
      href={`/spots/${spot.id}?date=${date}`}
      className={`${styles.card} ${active ? styles.cardActive : ''} ${gated ? styles.cardGated : ''}`}
      onMouseEnter={() => onHover(spot.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(spot.id)}
      onBlur={() => onHover(null)}
    >
      <ScoreBadge score={item.score} label={label} />
      <div className={styles.cardText}>
        <div className={styles.cardTitle}>
          <span className={styles.cardName}>{spot.name}</span>
          <span className={`${styles.cardMiles} ${styles.desktopOnly}`}>{miles}</span>
        </div>
        <span className={`${styles.cardWhere} ${styles.desktopOnly}`}>
          {spot.region ? `${spot.region} · ` : ''}Bortle {spot.bortle}
        </span>
        <span className={styles.cardMeta}>{meta}</span>
      </div>
      <div className={styles.cardSide}>
        <span className={styles.cardLabel} style={{ color }}>{label}</span>
        {/* Cloud cover for each dark hour; clear hours are dimmer. */}
        <div className={`${styles.cardBars} ${styles.desktopOnly}`} aria-hidden="true">
          {hourly.map((h) => (
            <span
              key={h.time}
              style={{
                height: `${Math.max(8, h.cloudCover)}%`,
                background: h.cloudCover < 30 ? 'rgba(205,210,240,.3)' : 'rgba(205,210,240,.78)',
              }}
            />
          ))}
        </div>
        <span className={`${styles.cardMiles} ${styles.phoneOnly}`}>{miles}</span>
      </div>
    </Link>
  );
}
