import { labelColor } from '@/components/ScoreBadge';
import type { Spot } from '@/lib/types';
import styles from './spot.module.css';

// Standard Bortle class names, as in the Umbra mockup.
const BORTLE_NAMES = [
  '', 'Excellent dark sky', 'Truly dark sky', 'Rural sky', 'Rural/suburban transition', 'Suburban sky',
  'Bright suburban sky', 'Suburban/urban transition', 'City sky', 'Inner-city sky',
];

const siteName = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

// Spot facts from spots.json only, so this card shows even when the ratings API fails.
// Optional fields that aren't filled in are left out rather than shown empty.
export default function AboutSpot({ spot }: { spot: Spot }) {
  const facts: { label: string; value: string; color?: string }[] = [
    {
      label: 'Open at night',
      value: spot.openAtNight ? 'Yes' : 'No',
      color: labelColor(spot.openAtNight ? 'Excellent' : 'Poor'),
    },
    { label: 'Light pollution', value: `Bortle ${spot.bortle} · ${BORTLE_NAMES[spot.bortle] ?? ''}` },
  ];
  if (spot.seasonalNote) facts.push({ label: 'Season', value: spot.seasonalNote });
  if (spot.darkSkyCertified) facts.push({ label: 'DarkSky', value: 'Certified place' });
  if (spot.elevationM !== undefined) facts.push({ label: 'Elevation', value: `${spot.elevationM.toLocaleString('en-US')} m` });
  if (spot.road) facts.push({ label: 'Road', value: spot.road });

  // One link per site, so two pages from the same agency don't repeat its name.
  const sources = (spot.sources ?? []).filter(
    (url, i, all) => all.findIndex((other) => siteName(other) === siteName(url)) === i,
  );

  return (
    <section className={`panel ${styles.infoPanel} ${styles.aboutPanel} ${styles.orderAbout}`}>
      <h2 className="kicker" style={{ margin: 0 }}>About this spot</h2>
      {spot.notes && <p className={styles.notes}>{spot.notes}</p>}
      <dl className={styles.facts}>
        {facts.map((f) => (
          <div key={f.label}>
            <dt>{f.label}</dt>
            <dd style={{ color: f.color }}>{f.value}</dd>
          </div>
        ))}
      </dl>
      {sources.length > 0 && (
        <p className={styles.sources}>
          Sources:{' '}
          {sources.map((url, i) => (
            <span key={url}>
              {i > 0 && ' · '}
              <a href={url} target="_blank" rel="noopener noreferrer">{siteName(url)}</a>
            </span>
          ))}
        </p>
      )}
    </section>
  );
}
