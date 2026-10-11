
import type { Metadata } from 'next';
import Link from 'next/link';
import {
    getUpcomingAstroEvents,
    type AstroEvent,
} from '@/lib/astroEvents';
import styles from './events.module.css';

export const metadata: Metadata = {
    title: 'Sky Events | Umbra',
    description:
        'Upcoming meteor showers, moon phases, and astronomy events.',
};

export const dynamic = 'force-dynamic';

function EventCard({ event }: { event: AstroEvent }) {
    return (
        <article className={`panel ${styles.card}`}>
            <div className={styles.cardTop}>
        <span className={styles.category}>
          {event.category}
        </span>
                <span className={styles.date}>
          {event.dateLabel}
        </span>
            </div>

            <h3 className={styles.cardTitle}>
                {event.name}
            </h3>

            <p className={styles.description}>
                {event.description}
            </p>

            <div className={styles.tip}>
        <span className={styles.tipLabel}>
          VIEWING TIP
        </span>
                <p>{event.viewingTip}</p>
            </div>

            <a
                href={event.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.source}
            >
                View source
            </a>
        </article>
    );
}

export default function EventsPage() {
    const events = getUpcomingAstroEvents();
    const [featured, ...remaining] = events;

    return (
        <main className={styles.page}>
            <Link href="/" className={styles.back}>
                Back to map
            </Link>

            <header className={styles.header}>
        <span className={styles.kicker}>
          UMBRA / ASTRONOMY
        </span>

                <h1 className={styles.title}>
                    Upcoming Sky Events
                </h1>

                <p className={styles.subtitle}>
                    Plan your next observing session around
                    upcoming meteor showers and lunar events.
                </p>
            </header>

            {featured ? (
                <section className={`panel ${styles.featured}`}>
                    <div className={styles.featuredTop}>
            <span className={styles.featuredLabel}>
              NEXT EVENT
            </span>

                        <span className={styles.date}>
              {featured.dateLabel}
            </span>
                    </div>

                    <span className={styles.category}>
            {featured.category}
          </span>

                    <h2 className={styles.featuredTitle}>
                        {featured.name}
                    </h2>

                    <p className={styles.featuredDescription}>
                        {featured.description}
                    </p>

                    <div className={styles.featuredTip}>
                        <strong>Viewing recommendations</strong>
                        <p>{featured.viewingTip}</p>
                    </div>

                    <div className={styles.featuredActions}>
                        <Link
                            href="/"
                            className={styles.primaryLink}
                        >
                            Find a viewing spot
                        </Link>

                        <a
                            href={featured.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.secondaryLink}
                        >
                            View source
                        </a>
                    </div>
                </section>
            ) : (
                <section className={`panel ${styles.empty}`}>
                    <h2>No upcoming events</h2>
                    <p>
                        There are no remaining events in the
                        current calendar.
                    </p>
                </section>
            )}

            {remaining.length > 0 && (
                <section className={styles.eventsSection}>
                    <div className={styles.sectionHeader}>
                        <div>
              <span className={styles.kicker}>
                EVENT CALENDAR
              </span>

                            <h2 className={styles.sectionTitle}>
                                On the Horizon
                            </h2>
                        </div>

                        <span className={styles.eventCount}>
              {remaining.length} upcoming events
            </span>
                    </div>

                    <div className={styles.grid}>
                        {remaining.map((event) => (
                            <EventCard
                                key={event.id}
                                event={event}
                            />
                        ))}
                    </div>
                </section>
            )}

            <section className={`panel ${styles.footerPanel}`}>
                <div>
          <span className={styles.kicker}>
            PLAN YOUR OBSERVATION
          </span>

                    <h2>Find the right viewing conditions.</h2>

                    <p>
                        Explore stargazing locations and check
                        cloud cover, moonlight, and viewing
                        conditions before heading out.
                    </p>
                </div>

                <Link
                    href="/"
                    className={styles.primaryLink}
                >
                    Explore locations
                </Link>
            </section>

            <p className={styles.disclaimer}>
                Event dates are based on published astronomical
                predictions. Actual visibility depends on
                location, weather, and moonlight.
            </p>
        </main>
    );
}
