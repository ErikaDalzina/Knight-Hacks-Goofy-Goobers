import Link from 'next/link';
import { LABEL_COLORS } from '@/lib/constants';
import styles from './SpotsExplorer.module.css';
import { nightLabels, nightName, type NightSummary, type Stat } from './tonight';

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

// The night's summary above the map and list (mockup frame 1a; 1c on phones). It says
// "Tonight" only for tonight, since the night strip can show other nights.
export default function TonightHero({ status, summary, date, tonight, aside }: {
  status: 'loading' | 'error' | 'ready';
  summary: NightSummary | null;
  date: string | null;
  tonight: string | null;
  aside?: React.ReactNode; // the night strip, shown beside the headline (below it on phones)
}) {
  const labels = date ? nightLabels(date) : null;
  const night = date && tonight ? nightName(date, tonight) : null;
  const top = summary?.top;

  return (
    <section className={styles.hero}>
      <div className={styles.heroMain} aria-live="polite">
      <p className={styles.kicker}>
        {labels && (
          <>
            <span className={styles.desktopOnly}>{night?.isTonight ? `Tonight · ${labels.long}` : labels.long}</span>
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
            <StatItem label="True darkness" stat={summary.dark ?? { text: 'None', sub: 'The sun never gets 18° below' }} />
            <StatItem label="Moon" stat={summary.moon ?? { text: 'Not measured', sub: 'No true darkness' }} />
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
                  <span className={styles.statValue}>None</span>
                  <span className={styles.statSub}>Every spot is ruled out</span>
                </dd>
              )}
            </div>
          </dl>
        </>
      )}

      {status === 'error' && (
        <h1 className={styles.headline}>
          {!night || night.isTonight ? "Couldn't load tonight's forecast." : `Couldn't load the forecast for ${night.label}.`}
        </h1>
      )}

      {status === 'loading' && (
        <div className={styles.heroSkeleton} role="status" aria-label="Loading the forecast">
          <div className={styles.skeletonBlock} style={{ width: '46%', height: 38 }} />
          <div className={styles.skeletonBlock} style={{ width: '38%', height: 44 }} />
        </div>
      )}
      </div>
      {aside}
    </section>
  );
}
