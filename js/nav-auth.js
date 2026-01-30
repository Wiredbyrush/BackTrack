(function () {
  const NAV_AUTH_LOADED = 'data-nav-auth-loaded';

  const avatarColors = {
    'A': '#e91e63', 'B': '#9c27b0', 'C': '#673ab7', 'D': '#3f51b5',
    'E': '#2196f3', 'F': '#03a9f4', 'G': '#00bcd4', 'H': '#009688',
    'I': '#4caf50', 'J': '#8bc34a', 'K': '#cddc39', 'L': '#ffc107',
    'M': '#ff9800', 'N': '#ff5722', 'O': '#795548', 'P': '#607d8b',
    'Q': '#e91e63', 'R': '#9c27b0', 'S': '#673ab7', 'T': '#3f51b5',
    'U': '#2196f3', 'V': '#03a9f4', 'W': '#00bcd4', 'X': '#009688',
    'Y': '#4caf50', 'Z': '#8bc34a'
  };

  function ensureNavRight(nav) {
    let navRight = nav.querySelector('.nav-right');
    if (!navRight) {
      navRight = document.createElement('div');
      navRight.className = 'nav-right';
      nav.appendChild(navRight);
    }
    return navRight;
  }

  function ensureSignIn(navRight) {
    let signIn = navRight.querySelector('.sign-in-btn');
    if (!signIn) {
      signIn = document.createElement('a');
      signIn.className = 'sign-in-btn';
      signIn.href = 'login.html';
      signIn.textContent = 'Sign In';
      navRight.appendChild(signIn);
    }
    return signIn;
  }

  function buildDropdown(isAdmin) {
    const canInstall = window.BackTrackDeferredInstallPrompt &&
      !window.matchMedia('(display-mode: standalone)').matches;
    const dropdown = document.createElement('div');
    dropdown.className = 'user-dropdown';
    dropdown.innerHTML = `
      <a href="profile.html">Account Overview</a>
      <a href="profile.html?tab=items">My Items</a>
      <a href="profile.html?tab=claims">My Claims</a>
      <a href="profile.html?tab=settings">Settings</a>
      ${canInstall ? '<button type="button" class="install-app-btn">Install App</button>' : ''}
      ${isAdmin ? '<a href="admin.html" class="admin-link">Admin Panel</a>' : ''}
      <div class="divider"></div>
      <button type="button" class="sign-out-btn">Sign Out</button>
    `;
    return dropdown;
  }

  function initNavAuth() {
    const nav = document.querySelector('nav');
    if (!nav || nav.getAttribute(NAV_AUTH_LOADED) === 'true') return;
    if (nav.getAttribute('data-nav-auth') === 'false') {
      nav.setAttribute(NAV_AUTH_LOADED, 'true');
      return;
    }
    nav.setAttribute(NAV_AUTH_LOADED, 'true');

    const navRight = ensureNavRight(nav);
    const signInBtn = ensureSignIn(navRight);

    let currentMenu = null;
    let currentUser = null;

    function closeMenu() {
      if (currentMenu) {
        currentMenu.dataset.open = 'false';
        const avatar = currentMenu.querySelector('.user-avatar');
        if (avatar) avatar.setAttribute('aria-expanded', 'false');
      }
    }

    document.addEventListener('click', (event) => {
      if (!currentMenu) return;
      if (!currentMenu.contains(event.target)) closeMenu();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu();
    });

    function renderSignedOut() {
      navRight.innerHTML = '';
      navRight.appendChild(signInBtn);
    }

    async function renderSignedIn(user) {
      currentUser = user;
      const name = user.user_metadata?.full_name || user.email || 'U';
      const initial = name.charAt(0).toUpperCase();
      const bgColor = avatarColors[initial] || '#6366f1';

      const isAdmin = typeof BackTrackDB !== 'undefined'
        ? await BackTrackDB.isAdmin()
        : false;

      const menu = document.createElement('div');
      menu.className = 'user-menu';
      menu.dataset.open = 'false';

      const avatar = document.createElement('button');
      avatar.type = 'button';
      avatar.className = 'user-avatar';
      avatar.textContent = initial;
      avatar.style.backgroundColor = bgColor;
      avatar.setAttribute('aria-haspopup', 'true');
      avatar.setAttribute('aria-expanded', 'false');
      avatar.title = user.email || 'Account';

      const dropdown = buildDropdown(isAdmin);
      const installBtn = dropdown.querySelector('.install-app-btn');
      if (installBtn) {
        installBtn.addEventListener('click', async () => {
          const prompt = window.BackTrackDeferredInstallPrompt;
          if (!prompt) return;
          prompt.prompt();
          const { outcome } = await prompt.userChoice;
          if (outcome === 'accepted' && window.BackTrackToast) {
            window.BackTrackToast('BackTrack installed! Find it on your home screen.', 'success');
          }
          window.BackTrackDeferredInstallPrompt = null;
          installBtn.remove();
        });
      }
      const signOutBtn = dropdown.querySelector('.sign-out-btn');
      signOutBtn.addEventListener('click', async () => {
        await BackTrackDB.signOut();
        window.location.href = 'index.html';
      });

      avatar.addEventListener('click', (event) => {
        event.stopPropagation();
        const nextState = menu.dataset.open !== 'true';
        menu.dataset.open = nextState ? 'true' : 'false';
        avatar.setAttribute('aria-expanded', nextState ? 'true' : 'false');
        currentMenu = menu;
      });

      menu.appendChild(avatar);
      menu.appendChild(dropdown);

      navRight.innerHTML = '';

      // Add admin badge if user is rushwanthmahendran1@gmail.com
      if (user.email === 'rushwanthmahendran1@gmail.com') {
        const adminBadge = document.createElement('a');
        adminBadge.href = 'admin.html';
        adminBadge.className = 'admin-badge';
        adminBadge.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
          <span>Admin</span>
        `;

        // Add admin badge styles if not already added
        if (!document.getElementById('admin-badge-styles')) {
          const style = document.createElement('style');
          style.id = 'admin-badge-styles';
          style.textContent = `
            .admin-badge {
              display: flex;
              align-items: center;
              gap: 6px;
              padding: 6px 12px;
              background: rgba(6, 182, 212, 0.1);
              border: 1px solid rgba(6, 182, 212, 0.3);
              border-radius: 8px;
              color: #06b6d4;
              font-size: 13px;
              font-weight: 600;
              margin-right: 12px;
              text-decoration: none;
              transition: all 0.2s ease;
            }

            .admin-badge:hover {
              background: rgba(6, 182, 212, 0.2);
              border-color: rgba(6, 182, 212, 0.5);
              transform: translateY(-1px);
            }

            .admin-badge svg {
              animation: adminPulse 2s ease-in-out infinite;
            }

            @keyframes adminPulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.6; }
            }

            @media (max-width: 768px) {
              .admin-badge span {
                display: none;
              }
              .admin-badge {
                padding: 6px 8px;
                margin-right: 8px;
              }
            }
          `;
          document.head.appendChild(style);
        }

        navRight.appendChild(adminBadge);
      }

      navRight.appendChild(menu);
      currentMenu = menu;
    }

    async function updateAuth() {
      if (typeof BackTrackDB === 'undefined') {
        renderSignedOut();
        return;
      }
      const user = await BackTrackDB.getCurrentUser();
      if (!user) {
        renderSignedOut();
        return;
      }
      await renderSignedIn(user);
    }

    if (typeof BackTrackDB !== 'undefined') {
      BackTrackDB.onAuthStateChange((_event, user) => {
        if (user) {
          renderSignedIn(user);
        } else {
          renderSignedOut();
        }
      });
    }

    window.addEventListener('backtrack:install-available', () => {
      if (currentUser) {
        renderSignedIn(currentUser);
      }
    });

    updateAuth();
  }

  function waitForSupabase(tries = 0) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => waitForSupabase(tries));
      return;
    }

    if (typeof BackTrackDB !== 'undefined' || tries > 20) {
      initNavAuth();
      return;
    }

    setTimeout(() => waitForSupabase(tries + 1), 150);
  }

  waitForSupabase();

  // ============================================
  // ACTIVE NAV LINK DETECTION
  // ============================================
  function setActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link, .nav-center a');

    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (!href) return;

      const linkPage = href.split('/').pop();

      // Check for exact match or home page
      if (linkPage === currentPage ||
          (currentPage === '' && linkPage === 'index.html') ||
          (currentPage === 'index.html' && linkPage === 'index.html')) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      } else {
        link.classList.remove('active');
        link.removeAttribute('aria-current');
      }
    });
  }

  // ============================================
  // ACCESSIBILITY ENHANCEMENTS
  // ============================================
  function enhanceAccessibility() {
    // Add ARIA labels to form elements missing them
    document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])').forEach(input => {
      const label = document.querySelector(`label[for="${input.id}"]`);
      if (!label && input.placeholder) {
        input.setAttribute('aria-label', input.placeholder);
      }
    });

    // Add ARIA labels to buttons with only icons
    document.querySelectorAll('button:not([aria-label])').forEach(btn => {
      if (!btn.textContent.trim() && btn.querySelector('svg')) {
        const title = btn.getAttribute('title');
        if (title) {
          btn.setAttribute('aria-label', title);
        }
      }
    });

    // Make sure all images have alt text
    document.querySelectorAll('img:not([alt])').forEach(img => {
      img.setAttribute('alt', '');
    });

    // Add role="main" to main content area
    const mainContent = document.querySelector('.container, main, .main-content');
    if (mainContent && !document.querySelector('[role="main"]')) {
      mainContent.setAttribute('role', 'main');
    }

    // Add role="navigation" to nav
    const nav = document.querySelector('nav');
    if (nav && !nav.getAttribute('role')) {
      nav.setAttribute('role', 'navigation');
      nav.setAttribute('aria-label', 'Main navigation');
    }

    // Add role="contentinfo" to footer
    const footer = document.querySelector('footer');
    if (footer && !footer.getAttribute('role')) {
      footer.setAttribute('role', 'contentinfo');
    }
  }

  // Run enhancements when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setActiveNavLink();
      enhanceAccessibility();
    });
  } else {
    setActiveNavLink();
    enhanceAccessibility();
  }
})();
