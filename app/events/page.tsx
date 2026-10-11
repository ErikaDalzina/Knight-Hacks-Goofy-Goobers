import type { Metadata } from 'next';
import Link from 'next/link';
import TopBar from '@/components/TopBar';
import { astroEvents } from '@/lib/astroEvents';
import SkyEvents from './SkyEvents';
import styles from './events.module.css';

// The layout's title template adds " · Umbra".
export const metadata: Metadata = {
  title: 'Sky events',
  description: 'Upcoming meteor showers, moon phases, and astronomy events.',
};

// Rendered per request so the server's first guess at "today" is current.
export const dynamic = 'force-dynamic';

// Sky events (frame 1c of the Umbra Current Site mockup). SkyEvents holds everything that
// depends on today's date; the rest is static.
export default function EventsPage() {
  return (
    <>
      <TopBar />
      <main className={styles.page}>
        <Link href="/" className={styles.back}>← All spots</Link>

        <SkyEvents events={astroEvents} serverTonight={new Date().toISOString().slice(0, 10)} />

        <section className={`panel ${styles.plan}`}>
          <div className={styles.planText}>
            <span className="kicker">Plan your observation</span>
            <h2>Find the right viewing conditions.</h2>
            <p>Check cloud cover, moonlight and darkness at spots near you before heading out.</p>
          </div>
          <Link href="/" className={styles.button}>Explore spots</Link>
        </section>

        <p className={styles.disclaimer}>
          Event dates are based on published astronomical predictions. Actual visibility depends on
          location, weather and moonlight.
        </p>
      </main>
    </>
  );
}
