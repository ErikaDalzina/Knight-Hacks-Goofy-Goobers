import Link from 'next/link';
import styles from './spot.module.css';

export default function SpotNotFound() {
  return (
    <main className={styles.page}>
      <Link href="/" className={styles.back}>← All spots</Link>
      <section className={`panel ${styles.scorePanel}`}>
        <span className="kicker">Not found</span>
        <h1 className={styles.notFoundTitle}>We couldn&apos;t find that spot</h1>
        <p className={styles.reason}>It may have been renamed or removed. Pick one from tonight&apos;s list instead.</p>
        <Link href="/" className={styles.button}>See all spots</Link>
      </section>
    </main>
  );
}
