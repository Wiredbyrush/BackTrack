import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLightTheme, setIsLightTheme] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      document.body.classList.add('light-theme');
      setIsLightTheme(true);
    }

    const handleScroll = () => {
      setScrolled(window.scrollY > 4);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    document.body.classList.toggle('light-theme');
    const newTheme = document.body.classList.contains('light-theme');
    setIsLightTheme(newTheme);
    localStorage.setItem('theme', newTheme ? 'light' : 'dark');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.container}>
        <Link to="/" className={styles.logo}>
          <span className={styles.brandLogo}>
            <img className={styles.logoDark} src="/logo.png" alt="BackTrack - Lost and Found System" />
            <img className={styles.logoLight} src="/logo-white.png" alt="" aria-hidden="true" />
          </span>
        </Link>

        <div className={styles.navLinks}>
          <NavLink to="/browse" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>
            Browse
          </NavLink>
          <NavLink to="/map" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>
            Map
          </NavLink>
          <NavLink to="/submit" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>
            Submit
          </NavLink>
          <NavLink to="/features" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>
            Features
          </NavLink>
          <NavLink to="/sources" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>
            Sources
          </NavLink>
        </div>

        <div className={styles.navRight}>
          <button onClick={toggleTheme} className={styles.themeToggle} aria-label="Toggle theme">
            {isLightTheme ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            )}
          </button>

          {user ? (
            <div className={styles.userMenu}>
              <Link to="/profile" className={styles.avatar}>
                {user.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="Profile" />
                ) : (
                  <span>{user.email?.[0].toUpperCase()}</span>
                )}
              </Link>
              <button onClick={handleSignOut} className={styles.signOutBtn}>
                Sign Out
              </button>
            </div>
          ) : (
            <Link to="/login" className={`btn btn-primary ${styles.signInBtn}`}>
              Sign In
            </Link>
          )}

          <button
            className={`${styles.hamburger} ${isMenuOpen ? styles.open : ''}`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`${styles.mobileMenu} ${isMenuOpen ? styles.open : ''}`}>
        <NavLink to="/" onClick={() => setIsMenuOpen(false)}>Home</NavLink>
        <NavLink to="/browse" onClick={() => setIsMenuOpen(false)}>Browse</NavLink>
        <NavLink to="/submit" onClick={() => setIsMenuOpen(false)}>Submit</NavLink>
        <NavLink to="/map" onClick={() => setIsMenuOpen(false)}>Map</NavLink>
        {isAdmin && <NavLink to="/admin" onClick={() => setIsMenuOpen(false)}>Admin</NavLink>}
        {user ? (
          <>
            <NavLink to="/profile" onClick={() => setIsMenuOpen(false)}>Profile</NavLink>
            <button onClick={() => { handleSignOut(); setIsMenuOpen(false); }}>Sign Out</button>
          </>
        ) : (
          <NavLink to="/login" onClick={() => setIsMenuOpen(false)}>Sign In</NavLink>
        )}
      </div>
    </nav>
  );
}
