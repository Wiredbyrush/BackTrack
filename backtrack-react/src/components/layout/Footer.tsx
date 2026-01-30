import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          <div className={styles.brandColumn}>
            <div className={styles.brandTitle}>BackTrack</div>
            <p className={styles.brandDescription}>
              A centralized lost-and-found system for students and staff. Built for FBLA Coding & Programming.
            </p>
          </div>

          <div className={styles.column}>
            <div className={styles.columnTitle}>Product</div>
            <div className={styles.links}>
              <Link to="/browse">Browse Items</Link>
              <Link to="/submit">Submit Item</Link>
              <Link to="/claim">Claim Item</Link>
              <Link to="/map">Campus Map</Link>
            </div>
          </div>

          <div className={styles.column}>
            <div className={styles.columnTitle}>Resources</div>
            <div className={styles.links}>
              <Link to="/features">Features</Link>
              <Link to="/sources">Sources</Link>
            </div>
          </div>

          <div className={styles.column}>
            <div className={styles.columnTitle}>Account</div>
            <div className={styles.links}>
              <Link to="/login">Log In</Link>
              <Link to="/signup">Sign Up</Link>
              <Link to="/profile">Profile</Link>
            </div>
          </div>
        </div>

        <div className={styles.bottom}>
          <div className={styles.copyright}>
            &copy; 2025 BackTrack. Built for FBLA Coding & Programming.
          </div>
          <div className={styles.credits}>
            Made by BackTrack Team
          </div>
        </div>
      </div>
    </footer>
  );
}
