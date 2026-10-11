import { distanceMiles, useUserLocation } from '@/lib/geo';
import type { Spot } from '@/lib/types';
import styles from './spot.module.css';

// A rough drive time with no routing call: roads run about 1.3× the straight line, at 50 mph,
// rounded to 5 minutes (the mockup's rule). The "~" in the text marks it as an estimate.
function driveText(miles: number) {
  const minutes = Math.max(5, Math.round((miles * 1.3) / 50 * 60 / 5) * 5);
  if (minutes < 60) return `~${minutes} min drive`;
  const m = minutes % 60;
  return `~${Math.floor(minutes / 60)} h${m ? ` ${m} min` : ''} drive`;
}

// Where the spot is and how far from home, measured like the list's distances (same home, same
// formula), so the miles match the card you clicked. Uses spots.json only, so it shows even when
// the ratings API fails. The map is Google's keyless embed (no API key), tinted dark in CSS; only
// the spot's coordinates go to Google, never the user's location.
export default function LocationCard({ spot }: { spot: Spot }) {
  const home = useUserLocation();
  const miles = distanceMiles(home.location, spot);
  const from = home.label === 'Your location' ? 'your location' : home.label;

  return (
    <section className={`panel ${styles.infoPanel} ${styles.orderLocation}`}>
      <div className={styles.locationHead}>
        <h2 className="kicker" style={{ margin: 0 }}>Location</h2>
        <a
          className={styles.link}
          href={`https://www.google.com/maps/search/?api=1&query=${spot.lat},${spot.lon}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open ${spot.name} in Google Maps (opens in a new tab)`}
        >
          Open in Google Maps ↗
        </a>
      </div>
      <div className={styles.mapFrame}>
        <iframe
          className={styles.mapEmbed}
          src={`https://maps.google.com/maps?q=${spot.lat},${spot.lon}&z=11&output=embed`}
          title={`Map of ${spot.name}`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <p className={styles.locationMeta}>
        <span>{Math.round(miles)} mi from {from}</span>
        <span className={styles.mono}>{driveText(miles)}</span>
      </p>
    </section>
  );
}
