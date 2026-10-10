import { formatHourShort, formatLocalTime } from '@/components/time';
import { LABEL_STYLES } from '@/lib/constants';
import type { SpotRating } from '@/lib/types';
import styles from './spot.module.css';
import { bestSpan, cloudBars, formatDuration, moonUpSpans } from './timeline';

const pos = (s: { left: number; width: number }) => ({ left: `${s.left}%`, width: `${s.width}%` });

function moonNote({ rise, set }: SpotRating['moon'], hourly: SpotRating['hourly']) {
  if (rise && set) {
    return Date.parse(set) < Date.parse(rise)
      ? `moon sets ${formatLocalTime(set)}, rises ${formatLocalTime(rise)}`
      : `moon rises ${formatLocalTime(rise)}, sets ${formatLocalTime(set)}`;
  }
  if (set) return `moon sets ${formatLocalTime(set)}`;
  if (rise) return `moon rises ${formatLocalTime(rise)}`;
  return hourly[0]?.moonUp ? 'moon up all night' : 'moon down all night';
}

// The headline and its one-line reason, in the order the page decides them.
function summary(rating: SpotRating) {
  const { bestWindow: best } = rating;
  if (rating.score === null) {
    return { headline: 'Not tonight', why: `${rating.gateReason ?? 'Conditions rule this spot out'}. Try another spot or night.` };
  }
  if (!best) {
    return { headline: 'No clear window', why: 'No hour tonight is both under 30% cloud and moon-free.' };
  }
  const length = formatDuration(Date.parse(best.end) - Date.parse(best.start));
  return {
    headline: `${formatLocalTime(best.start)} – ${formatLocalTime(best.end)}`,
    why: `${length} of clear, moonless sky · ${moonNote(rating.moon, rating.hourly)}`,
  };
}

export default function BestTime({ rating }: { rating: SpotRating }) {
  const { darkWindow: dark, bestWindow: best, hourly, moon } = rating;
  const { fg, tint } = LABEL_STYLES[rating.label];
  const { headline, why } = summary(rating);
  const bars = dark ? cloudBars(dark, hourly) : [];

  return (
    <section className={`panel ${styles.bestPanel} ${styles.orderBest}`}>
      <div className={styles.bestHead}>
        <div className={styles.bestText}>
          <h2 className="kicker" style={{ margin: 0 }}>Best time tonight</h2>
          <span className={styles.bestTime}>{headline}</span>
          <span className={styles.bestWhy}>{why}</span>
        </div>
        {dark && (
          <div className={styles.legend}>
            <span><span className={styles.legendCloud} />Cloud cover</span>
            <span><span className={styles.legendMoon} />Moon up</span>
            {best && <span><span className={styles.legendBest} style={{ borderTopColor: fg, background: tint }} />Best window</span>}
          </div>
        )}
      </div>

      {dark ? (
        <div
          className={styles.chart}
          role="img"
          aria-label={`Cloud cover by hour: ${hourly.map((h) => `${formatLocalTime(h.time)} ${h.cloudCover}%`).join(', ')}`}
        >
          <span className={styles.edgeLeft}>astro dusk {formatLocalTime(dark.start)}</span>
          <span className={styles.edgeRight}>astro dawn {formatLocalTime(dark.end)}</span>
          {moonUpSpans(dark, moon, hourly).map((s, i) => (
            <div key={i} className={styles.moonLine} style={pos(s)} />
          ))}
          {best && (
            <div className={styles.bestBand} style={{ ...pos(bestSpan(dark, best)), borderTopColor: fg, background: tint }}>
              <span style={{ color: fg }}>BEST</span>
            </div>
          )}
          <div className={styles.bars}>
            {bars.map((b) => (
              <div key={b.time} className={styles.barSlot} style={pos(b)}>
                {!b.short && <span className={styles.barValue}>{b.cloudCover}%</span>}
                <div
                  className={styles.bar}
                  style={{
                    height: `${Math.max(3, b.cloudCover) * 0.85}%`,
                    background: b.cloudCover < 30 ? 'rgba(205,210,240,.32)' : 'rgba(205,210,240,.68)',
                  }}
                />
              </div>
            ))}
          </div>
          <div className={styles.ticks}>
            {bars.filter((b) => !b.short).map((b) => (
              <span key={b.time} className={styles.tick} style={{ left: `${b.left}%` }}>{formatHourShort(b.time)}</span>
            ))}
          </div>
        </div>
      ) : (
        <p className={styles.notice}>No true darkness tonight: the sun never gets 18° below the horizon.</p>
      )}
    </section>
  );
}
