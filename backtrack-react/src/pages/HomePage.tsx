import { use3DAnimation } from '../hooks/use3DAnimation';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './HomePage.module.css';

export default function HomePage() {
  const [visibleFeatures, setVisibleFeatures] = useState<number[]>([]);
  const [statsAnimated, setStatsAnimated] = useState(false);
  const statsRef = useRef<HTMLElement>(null);
  const featureRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Enhanced 3D Animation
  use3DAnimation('hero-visual');

  useEffect(() => {
    // Observe feature rows
    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -100px 0px',
      threshold: 0.1
    };

    const featureObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const index = featureRefs.current.indexOf(entry.target as HTMLDivElement);
          if (index !== -1 && !visibleFeatures.includes(index)) {
            setVisibleFeatures(prev => [...prev, index]);
          }
        }
      });
    }, observerOptions);

    featureRefs.current.forEach(ref => {
      if (ref) featureObserver.observe(ref);
    });

    // Observe stats section
    const statsObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !statsAnimated) {
          setStatsAnimated(true);
        }
      });
    }, { threshold: 0.3 });

    if (statsRef.current) {
      statsObserver.observe(statsRef.current);
    }

    return () => {
      featureObserver.disconnect();
      statsObserver.disconnect();
    };
  }, [visibleFeatures, statsAnimated]);

  return (
    <div className={styles.homePage}>
      {/* Hero Section */}
      <main className={styles.heroContainer}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Never lose track<br />of what matters.</h1>
          <p className={styles.heroDescription}>BackTrack is a centralized lost-and-found system for students and staff.</p>
          <p className={styles.heroDescription}>A smarter way to reconnect people with their belongings.</p>

          <div className={styles.buttonGroup}>
            <Link to="/browse" className={styles.btnPrimary}>Browse items</Link>
            <Link to="/submit" className={styles.btnSecondary}>Submit an item</Link>
          </div>
        </div>

        {/* 3D Animation Container */}
        <div className={styles.heroVisual} id="hero-visual" aria-hidden="true"></div>
      </main>

      {/* Features Showcase Section */}
      <section className={styles.featuresShowcase}>
        <div className={styles.featuresHeader}>
          <p className={styles.featuresLabel}>How it works</p>
          <h2 className={styles.featuresTitle}>Everything you need to find what's lost</h2>
          <p className={styles.featuresSubtitle}>A modern lost-and-found system designed for students and staff. Simple, fast, and smart.</p>
        </div>

        {/* Feature 1: Browse */}
        <div
          className={`${styles.featureRow} ${visibleFeatures.includes(0) ? styles.visible : ''}`}
          ref={el => { featureRefs.current[0] = el; }}
        >
          <div className={styles.featureContent}>
            <p className={styles.featureNumber}>01</p>
            <h3 className={styles.featureHeading}>Browse all lost items in one place</h3>
            <p className={styles.featureDescription}>See every reported lost item across campus in a clean, organized grid. Filter by category, location, or date to quickly find what you're looking for.</p>
            <div className={styles.featureTags}>
              <span className={styles.featureTag}>Grid View</span>
              <span className={styles.featureTag}>Filters</span>
              <span className={styles.featureTag}>Real-time Updates</span>
            </div>
          </div>
          <div className={styles.featureVisual}>
            <div className={`${styles.featureMockup} ${styles.mockupBrowse}`}>
              <div className={styles.mockupSidebar}>
                <span className={styles.mockupSidebarTitle}>Categories</span>
                <div className={`${styles.mockupSidebarItem} ${styles.active}`}>
                  <div className={styles.mockupSidebarIcon}></div>
                  <div className={styles.mockupSidebarText}></div>
                </div>
                <div className={styles.mockupSidebarItem}>
                  <div className={styles.mockupSidebarIcon}></div>
                  <div className={styles.mockupSidebarText}></div>
                </div>
                <div className={styles.mockupSidebarItem}>
                  <div className={styles.mockupSidebarIcon}></div>
                  <div className={styles.mockupSidebarText}></div>
                </div>
                <div className={styles.mockupSidebarItem}>
                  <div className={styles.mockupSidebarIcon}></div>
                  <div className={styles.mockupSidebarText}></div>
                </div>
              </div>
              <div className={styles.mockupMain}>
                <div className={styles.mockupHeaderBar}>
                  <div className={styles.mockupPageTitle}></div>
                  <div className={styles.mockupViewToggle}>
                    <div className={`${styles.mockupViewBtn} ${styles.active}`}></div>
                    <div className={styles.mockupViewBtn}></div>
                  </div>
                </div>
                <div className={styles.mockupItemsGrid}>
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className={styles.mockupCard}>
                      <div className={styles.mockupCardImage}></div>
                      <div className={styles.mockupCardBody}>
                        <div className={styles.mockupLine}></div>
                        <div className={`${styles.mockupLine} ${styles.short}`}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 2: Search */}
        <div
          className={`${styles.featureRow} ${styles.reverse} ${visibleFeatures.includes(1) ? styles.visible : ''}`}
          ref={el => { featureRefs.current[1] = el; }}
        >
          <div className={styles.featureContent}>
            <p className={styles.featureNumber}>02</p>
            <h3 className={styles.featureHeading}>Smart search that understands you</h3>
            <p className={styles.featureDescription}>Type naturally and find matches instantly. Search for "blue water bottle" or "AirPods case" and get relevant results, not just exact matches.</p>
            <div className={styles.featureTags}>
              <span className={styles.featureTag}>Natural Language</span>
              <span className={styles.featureTag}>Instant Results</span>
              <span className={styles.featureTag}>Category Filters</span>
            </div>
          </div>
          <div className={styles.featureVisual}>
            <div className={`${styles.featureMockup} ${styles.mockupSearch}`}>
              <div className={styles.mockupSearchBar}>
                <div className={styles.mockupSearchIcon}></div>
                <div className={styles.mockupSearchText}></div>
              </div>
              <div className={styles.mockupFilters}>
                <span className={`${styles.mockupFilterChip} ${styles.active}`}>All</span>
                <span className={styles.mockupFilterChip}>Electronics</span>
                <span className={styles.mockupFilterChip}>Clothing</span>
                <span className={styles.mockupFilterChip}>Books</span>
                <span className={styles.mockupFilterChip}>Keys</span>
              </div>
              <div className={styles.mockupDateFilter}>
                <div className={styles.mockupDateIcon}></div>
                <div className={styles.mockupDateText}></div>
              </div>
              <div className={styles.mockupResults}>
                {[...Array(2)].map((_, i) => (
                  <div key={i} className={styles.mockupCard}>
                    <div className={styles.mockupCardImage}></div>
                    <div className={styles.mockupCardBody}>
                      <div className={styles.mockupLine}></div>
                      <div className={`${styles.mockupLine} ${styles.short}`}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Feature 3: Submit */}
        <div
          className={`${styles.featureRow} ${visibleFeatures.includes(2) ? styles.visible : ''}`}
          ref={el => { featureRefs.current[2] = el; }}
        >
          <div className={styles.featureContent}>
            <p className={styles.featureNumber}>03</p>
            <h3 className={styles.featureHeading}>Report found items in seconds</h3>
            <p className={styles.featureDescription}>Found something? Snap a photo, add a quick description, and submit. Your report goes live instantly so the owner can find it fast.</p>
            <div className={styles.featureTags}>
              <span className={styles.featureTag}>Photo Upload</span>
              <span className={styles.featureTag}>Quick Form</span>
              <span className={styles.featureTag}>Instant Publishing</span>
            </div>
          </div>
          <div className={styles.featureVisual}>
            <div className={`${styles.featureMockup} ${styles.mockupSubmit}`}>
              <div className={styles.mockupUploadArea}>
                <div className={styles.mockupUploadIcon}></div>
                <span className={styles.mockupUploadText}>Click or drag to upload</span>
              </div>
              <div className={styles.mockupFormFields}>
                <div className={styles.mockupFormRow}>
                  <div className={styles.mockupInputGroup}>
                    <div className={styles.mockupLabel}></div>
                    <div className={styles.mockupInput}></div>
                  </div>
                  <div className={styles.mockupInputGroup}>
                    <div className={styles.mockupLabel}></div>
                    <div className={styles.mockupSelect}></div>
                  </div>
                </div>
                <div className={styles.mockupFormRow}>
                  <div className={styles.mockupInputGroup}>
                    <div className={styles.mockupLabel}></div>
                    <div className={styles.mockupSelect}></div>
                  </div>
                  <div className={styles.mockupInputGroup}>
                    <div className={styles.mockupLabel}></div>
                    <div className={styles.mockupInput}></div>
                  </div>
                </div>
                <div className={styles.mockupInputGroup}>
                  <div className={styles.mockupLabel}></div>
                  <div className={styles.mockupTextarea}></div>
                </div>
                <div className={styles.mockupBtn}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 4: AI Match */}
        <div
          className={`${styles.featureRow} ${styles.reverse} ${visibleFeatures.includes(3) ? styles.visible : ''}`}
          ref={el => { featureRefs.current[3] = el; }}
        >
          <div className={styles.featureContent}>
            <p className={styles.featureNumber}>04</p>
            <h3 className={styles.featureHeading}>AI-powered image matching</h3>
            <p className={styles.featureDescription}>Upload a photo of your lost item and let AI find similar matches. Our system analyzes colors, shapes, and features to surface the best results.</p>
            <div className={styles.featureTags}>
              <span className={styles.featureTag}>Image Recognition</span>
              <span className={styles.featureTag}>Smart Matching</span>
              <span className={styles.featureTag}>Match Scores</span>
            </div>
          </div>
          <div className={styles.featureVisual}>
            <div className={`${styles.featureMockup} ${styles.mockupAi}`}>
              <div className={styles.mockupAiUpload}>
                <div className={styles.mockupAiImage}></div>
                <div className={styles.mockupAiAnalysis}>
                  <p className={styles.mockupAiLabel}>AI detected</p>
                  <div className={styles.mockupAiTags}>
                    <span className={styles.mockupAiTag}>Blue</span>
                    <span className={styles.mockupAiTag}>Backpack</span>
                    <span className={styles.mockupAiTag}>Nike</span>
                    <span className={styles.mockupAiTag}>Zipper</span>
                  </div>
                </div>
              </div>
              <div className={styles.mockupAiResults}>
                <p className={styles.mockupAiLabel}>Top matches</p>
                <div className={styles.mockupAiMatch}>
                  <div className={styles.mockupAiMatchImg}></div>
                  <div className={styles.mockupAiMatchInfo}>
                    <div className={styles.mockupLine} style={{width: '70%', marginBottom: '4px'}}></div>
                    <div className={`${styles.mockupLine} ${styles.shorter}`}></div>
                  </div>
                  <span className={styles.mockupAiMatchBadge}>92% Match</span>
                </div>
                <div className={styles.mockupAiMatch}>
                  <div className={styles.mockupAiMatchImg}></div>
                  <div className={styles.mockupAiMatchInfo}>
                    <div className={styles.mockupLine} style={{width: '70%', marginBottom: '4px'}}></div>
                    <div className={`${styles.mockupLine} ${styles.shorter}`}></div>
                  </div>
                  <span className={styles.mockupAiMatchBadge}>78% Match</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className={styles.statsSection} ref={statsRef}>
        <div className={styles.statsContainer}>
          <div className={styles.statsHeader}>
            <h2 className={styles.statsTitle}>Making a difference, one item at a time</h2>
            <p className={styles.statsSubtitle}>Real-time statistics from our lost-and-found community</p>
          </div>
          <div className={styles.statsGrid}>
            <StatCard
              icon={<BoxIcon />}
              value={1247}
              label="Items Reported"
              animate={statsAnimated}
            />
            <StatCard
              icon={<CheckIcon />}
              value={892}
              label="Items Returned"
              animate={statsAnimated}
              color="#22c55e"
            />
            <StatCard
              icon={<UsersIcon />}
              value={2156}
              label="Happy Users"
              animate={statsAnimated}
              color="#f5c518"
            />
            <StatCard
              icon={<ClockIcon />}
              value={4}
              label="Avg. Return Time"
              suffix="hrs"
              animate={statsAnimated}
              color="#a855f7"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon, value, label, suffix = '', animate, color = '#fff' }: {
  icon: React.ReactNode;
  value: number;
  label: string;
  suffix?: string;
  animate: boolean;
  color?: string;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!animate) return;

    const duration = 2000;
    const step = value / (duration / 16);
    let current = 0;

    const timer = setInterval(() => {
      current += step;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [animate, value]);

  return (
    <div className={styles.statCard}>
      <div className={styles.statIcon} style={{ color }}>
        {icon}
      </div>
      <div className={styles.statValue}>{count.toLocaleString()}{suffix}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  );
}

function BoxIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}
