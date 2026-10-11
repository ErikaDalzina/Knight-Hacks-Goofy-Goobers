import Link from 'next/link';
import { formatWindow } from '@/lib/format';
import type { SpotRating } from '@/lib/types';
import ScoreBadge, { labelColor } from './ScoreBadge';
import styles from './SpotsExplorer.module.css';

export type RatedSpot = SpotRating & { distanceMi: number };

export default function SpotCard({ item, date }: { item: RatedSpot; date: string }) {
    const color = labelColor(item.label);
    const best = formatWindow(item.bestWindow);

    return (
        <Link
            href={`/spots/${item.spot.id}?date=${date}`}
            className={styles.card}
            style={item.score === null ? { opacity: 0.65 } : undefined}
        >
            <ScoreBadge score={item.score} label={item.label} size="md" />
            <div className={styles.cardBody}>
                <div className={styles.cardTitleRow}>
                    <span className={styles.name}>{item.spot.name}</span>
                    <span className={styles.dist}>{Math.round(item.distanceMi)} mi</span>
                </div>
                <span className={styles.sub}>
          {item.spot.region ? `${item.spot.region} · ` : ''}Bortle {item.spot.bortle}
        </span>
                <span className={styles.meta2} style={{ color: best ? 'var(--muted)' : 'var(--faint)' }}>
          {best ? `Best ${best}` : item.gateReason ?? 'No good window'}
        </span>
            </div>
            <span className={styles.labelText} style={{ color }}>
        {item.label}
      </span>
        </Link>
    );
}