import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          <div className={styles.column}>
            <h4>BackTrack</h4>
            <p>AI-powered lost and found system for schools. Find what you've lost, return what you've found.</p>
          </div>

          <div className={styles.column}>
            <h4>Quick Links</h4>
            <Link to="/browse">Browse Items</Link>
            <Link to="/submit">Report Item</Link>
            <Link to="/map">Campus Map</Link>
          </div>

          <div className={styles.column}>
            <h4>About</h4>
            <Link to="/features">Features</Link>
            <Link to="/sources">Sources</Link>
          </div>

          <div className={styles.column}>
            <h4>Legal</h4>
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
          </div>
        </div>

        <div className={styles.bottom}>
          <p>&copy; {new Date().getFullYear()} BackTrack. Built for FBLA.</p>
        </div>
      </div>
    </footer>
  );
}
