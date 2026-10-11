import Link from 'next/link';
import { LABEL_COLORS } from '@/lib/constants';
import styles from './SpotsExplorer.module.css';
import { nightLabels, type NightSummary, type Stat } from './tonight';

function StatItem({ label, stat, className }: { label: string; stat: Stat; className?: string }) {
  return (
    <div className={`${styles.stat} ${className ?? ''}`}>
      <dt>{label}</dt>
      <dd>
        <span className={styles.statValue}>{stat.text}</span>
        <span className={styles.statSub}>{stat.sub}</span>
      </dd>
    </div>
  );
}

// The "Tonight" summary above the map and list (mockup frame 1a; 1c on phones).
export default function TonightHero({ status, summary, date }: {
  status: 'loading' | 'error' | 'ready';
  summary: NightSummary | null;
  date: string | null;
}) {
  const labels = date ? nightLabels(date) : null;
  const top = summary?.top;

  return (
    <section className={styles.hero} aria-live="polite">
      <p className={styles.kicker}>
        {labels && (
          <>
            <span className={styles.desktopOnly}>Tonight · {labels.long}</span>
            <span className={styles.phoneOnly}>{labels.short}</span>
          </>
        )}
      </p>

      {status === 'ready' && summary && (
        <>
          <h1 className={styles.headline}>
            <span className={styles.desktopOnly}>{summary.headline}</span>
            <span className={styles.phoneOnly}>{summary.shortHeadline}</span>
          </h1>
          <dl className={styles.stats}>
            <StatItem label="True darkness" stat={summary.dark ?? { text: 'None tonight', sub: 'The sun never gets 18° below' }} />
            <StatItem label="Moon" stat={summary.moon ?? { text: 'Not measured', sub: 'No true darkness tonight' }} />
            <div className={`${styles.stat} ${styles.desktopOnly}`}>
              <dt>Top spot</dt>
              {top ? (
                <dd>
                  <Link href={`/spots/${top.spot.id}?date=${date}`} className={`${styles.statValue} ${styles.statLink}`}>
                    {top.spot.name}
                  </Link>
                  <span className={styles.statSub} style={{ color: LABEL_COLORS[top.label] }}>
                    {top.score} · {top.label}
                  </span>
                </dd>
              ) : (
                <dd>
                  <span className={styles.statValue}>None tonight</span>
                  <span className={styles.statSub}>Every spot is ruled out</span>
                </dd>
              )}
            </div>
          </dl>
        </>
      )}

      {status === 'error' && <h1 className={styles.headline}>Couldn&apos;t load tonight&apos;s forecast.</h1>}

      {status === 'loading' && (
        <div className={styles.heroSkeleton} role="status" aria-label="Loading tonight's forecast">
          <div className={styles.skeletonBlock} style={{ width: '46%', height: 38 }} />
          <div className={styles.skeletonBlock} style={{ width: '38%', height: 44 }} />
        </div>
      )}
    </section>
  );
}
