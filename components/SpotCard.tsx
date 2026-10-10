import Link from 'next/link';
import { LABEL_COLORS } from '@/lib/constants';
import { formatWindow } from '@/lib/format';
import type { SpotRating } from '@/lib/types';
import styles from './SpotsExplorer.module.css';

export type RatedSpot = SpotRating & { distanceMi: number };

export default function SpotCard({ item }: { item: RatedSpot }) {
  const color = LABEL_COLORS[item.label];
  const best = formatWindow(item.bestWindow);

  return (
    <Link href={`/spots/${item.spot.id}`} className={styles.card} style={{ borderLeftColor: color }}>
      <div className={styles.cardTop}>
        <span className={styles.name}>{item.spot.name}</span>
        <span className={styles.score}>{item.score ?? '—'}</span>
      </div>
      <div className={styles.meta}>
        <span className={styles.pill} style={{ background: color }}>
          {item.label}
        </span>
        <span>{Math.round(item.distanceMi)} mi</span>
        <span>{best ? `Best ${best}` : item.gateReason ?? 'No good window'}</span>
      </div>
    </Link>
  );
}
