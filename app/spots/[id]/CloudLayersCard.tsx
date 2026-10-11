import type { CloudLayers, SpotRating } from '@/lib/types';
import styles from './spot.module.css';

const THIN_HIGH = 15; // % average high cloud that starts to soften faint objects

// Each layer is its own share of the sky, out of 100. They overlap, so they don't add up to the
// total cloud cover the score uses.
const LAYERS: { key: keyof CloudLayers; name: string }[] = [
  { key: 'low', name: 'Low' },
  { key: 'mid', name: 'Mid' },
  { key: 'high', name: 'High' },
];

function layerNote(high: number | null): string | null {
  if (high === null) return null;
  return high >= THIN_HIGH
    ? 'Thin high cloud adds up. Fine for the naked eye, but it softens faint galaxies.'
    : 'Little high cirrus, so the sky stays clear for deep-sky viewing.';
}

// Average low, mid and high cloud over the dark hours (mockup frame 1b). The engine only adds
// cloudLayers on rated nights whose forecast has layer data, so the card hides otherwise.
export default function CloudLayersCard({ rating }: { rating: SpotRating }) {
  const { cloudLayers } = rating;
  if (!cloudLayers) return null;
  const note = layerNote(cloudLayers.high);

  return (
    <section className={`panel ${styles.infoPanel} ${styles.layersPanel} ${styles.orderLayers}`}>
      <h2 className="kicker" style={{ margin: 0 }}>Cloud layers · avg</h2>
      <dl className={styles.layers}>
        {LAYERS.map(({ key, name }) => {
          const value = cloudLayers[key];
          return (
            <div key={key}>
              <dt>{name}</dt>
              <dd className={styles.track} aria-hidden="true">
                {value !== null && <span className={styles.layerFill} style={{ width: `${value}%` }} />}
              </dd>
              <dd className={styles.layerValue}>{value === null ? '—' : `${value}%`}</dd>
            </div>
          );
        })}
      </dl>
      {note && <p className={styles.reason} style={{ textAlign: 'left' }}>{note}</p>}
    </section>
  );
}
