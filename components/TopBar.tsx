import Link from 'next/link';
import styles from './TopBar.module.css';

// The mockup's top bar: crescent logo and name on the left, page controls on the right.
export default function TopBar({ children }: { children?: React.ReactNode }) {
  return (
    <header className={styles.bar}>
      <Link href="/" className={styles.brand}>
        <span className={styles.logo} aria-hidden="true" />
        Umbra
      </Link>
      {children && <div className={styles.actions}>{children}</div>}
    </header>
  );
}
