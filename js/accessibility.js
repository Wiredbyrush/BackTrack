/**
 * BackTrack Accessibility & UX Enhancement Module
 * Provides accessibility features, keyboard shortcuts, toast notifications,
 * and other UX improvements for the BackTrack lost-and-found system.
 *
 * Features:
 * - Accessibility toolbar (high contrast, text size, reduced motion)
 * - Keyboard shortcuts with help modal
 * - Toast notification system
 * - Recent searches with localStorage
 * - Screen reader announcements
 */

(function() {
    'use strict';

    // ============================================
    // CONFIGURATION
    // ============================================
    const CONFIG = {
        storageKeys: {
            highContrast: 'backtrack_high_contrast',
            textSize: 'backtrack_text_size',
            reducedMotion: 'backtrack_reduced_motion',
            recentSearches: 'backtrack_recent_searches',
            theme: 'backtrack_theme'
        },
        textSizes: ['normal', 'large', 'x-large'],
        maxRecentSearches: 5,
        toastDuration: 4000
    };

    // PWA Install prompt reference
    let deferredInstallPrompt = null;

    // Capture install prompt before it's shown
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredInstallPrompt = e;
        showPWAInstallButton();
    });

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================
    function getStorage(key, defaultValue = null) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : defaultValue;
        } catch {
            return defaultValue;
        }
    }

    function setStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch {
            // Storage unavailable
        }
    }

    // ============================================
    // SCREEN READER ANNOUNCEMENTS
    // ============================================
    let announcer = null;

    function createAnnouncer() {
        if (announcer) return;
        announcer = document.createElement('div');
        announcer.setAttribute('role', 'status');
        announcer.setAttribute('aria-live', 'polite');
        announcer.setAttribute('aria-atomic', 'true');
        announcer.className = 'sr-only';
        announcer.style.cssText = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;';
        document.body.appendChild(announcer);
    }

    function announce(message) {
        createAnnouncer();
        announcer.textContent = '';
        setTimeout(() => {
            announcer.textContent = message;
        }, 100);
    }

    // ============================================
    // TOAST NOTIFICATION SYSTEM
    // ============================================
    let toastContainer = null;

    function createToastContainer() {
        if (toastContainer) return;
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.setAttribute('aria-live', 'polite');
        toastContainer.setAttribute('aria-label', 'Notifications');
        toastContainer.style.cssText = `
            position: fixed;
            bottom: 100px;
            right: 24px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 12px;
            pointer-events: none;
        `;
        document.body.appendChild(toastContainer);
    }

    function showToast(message, type = 'info') {
        createToastContainer();

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.setAttribute('role', 'alert');

        const icons = {
            success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
            error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
            info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
            warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
        };

        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close" aria-label="Dismiss notification">&times;</button>
        `;

        toast.style.cssText = `
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 14px 18px;
            background: ${type === 'success' ? 'rgba(34, 197, 94, 0.95)' : type === 'error' ? 'rgba(239, 68, 68, 0.95)' : type === 'warning' ? 'rgba(245, 158, 11, 0.95)' : 'rgba(30, 30, 30, 0.95)'};
            color: ${type === 'warning' ? '#000' : '#fff'};
            border-radius: 12px;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            backdrop-filter: blur(8px);
            pointer-events: auto;
            transform: translateX(120%);
            opacity: 0;
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            max-width: 360px;
        `;

        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.style.cssText = `
            background: none;
            border: none;
            color: inherit;
            font-size: 20px;
            cursor: pointer;
            opacity: 0.7;
            padding: 0 0 0 8px;
            line-height: 1;
        `;

        toastContainer.appendChild(toast);

        // Trigger animation
        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(0)';
            toast.style.opacity = '1';
        });

        const removeToast = () => {
            toast.style.transform = 'translateX(120%)';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 400);
        };

        closeBtn.addEventListener('click', removeToast);
        setTimeout(removeToast, CONFIG.toastDuration);

        // Announce for screen readers
        announce(message);
    }

    // Expose globally
    window.BackTrackToast = showToast;

    // ============================================
    // ACCESSIBILITY TOOLBAR
    // ============================================
    function createAccessibilityToolbar() {
        // Check if already exists
        if (document.getElementById('a11y-toolbar')) return;

        const toolbar = document.createElement('div');
        toolbar.id = 'a11y-toolbar';
        toolbar.setAttribute('role', 'toolbar');
        toolbar.setAttribute('aria-label', 'Accessibility options');

        toolbar.innerHTML = `
            <button class="a11y-toggle" id="a11yToggle" aria-expanded="false" aria-controls="a11yPanel" aria-label="Open accessibility options">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <circle cx="12" cy="8" r="1" fill="currentColor"/>
                    <path d="M12 12v6"/>
                    <path d="M8 14l4-2 4 2"/>
                </svg>
            </button>
            <div class="a11y-panel" id="a11yPanel" role="region" aria-label="Accessibility settings">
                <div class="a11y-header">
                    <span>Accessibility</span>
                    <button class="a11y-close" aria-label="Close accessibility panel">&times;</button>
                </div>
                <div class="a11y-options">
                    <div class="a11y-option">
                        <label class="a11y-label">
                            <span>High Contrast</span>
                            <button class="a11y-switch" id="highContrastToggle" role="switch" aria-checked="false">
                                <span class="switch-track"></span>
                                <span class="switch-thumb"></span>
                            </button>
                        </label>
                    </div>
                    <div class="a11y-option">
                        <label class="a11y-label">
                            <span>Reduced Motion</span>
                            <button class="a11y-switch" id="reducedMotionToggle" role="switch" aria-checked="false">
                                <span class="switch-track"></span>
                                <span class="switch-thumb"></span>
                            </button>
                        </label>
                    </div>
                    <div class="a11y-option">
                        <label class="a11y-label">
                            <span>Light Theme</span>
                            <button class="a11y-switch" id="themeToggle" role="switch" aria-checked="false">
                                <span class="switch-track"></span>
                                <span class="switch-thumb"></span>
                            </button>
                        </label>
                    </div>
                    <div class="a11y-option">
                        <label class="a11y-label">
                            <span>Text Size</span>
                            <div class="a11y-text-controls">
                                <button class="a11y-text-btn" id="textSizeDown" aria-label="Decrease text size">A-</button>
                                <span class="a11y-text-current" id="textSizeCurrent">Normal</span>
                                <button class="a11y-text-btn" id="textSizeUp" aria-label="Increase text size">A+</button>
                            </div>
                        </label>
                    </div>
                </div>
                <div class="a11y-shortcuts">
                    <button class="a11y-shortcuts-btn" id="showShortcutsBtn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.001M10 8h.001M14 8h.001M18 8h.001M8 12h8M6 16h.001M10 16h8"/></svg>
                        Keyboard Shortcuts
                    </button>
                </div>
            </div>
        `;

        // Add styles
        const styles = document.createElement('style');
        styles.textContent = `
            #a11y-toolbar {
                position: fixed;
                left: 24px;
                bottom: 24px;
                z-index: 9999;
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            }
            .a11y-toggle {
                width: 48px;
                height: 48px;
                border-radius: 50%;
                background: linear-gradient(145deg, #1a1a1a 0%, #0a0a0a 100%);
                border: 1px solid rgba(255,255,255,0.1);
                color: #fff;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 20px rgba(0,0,0,0.4);
                transition: all 0.3s ease;
            }
            .a11y-toggle:hover {
                transform: scale(1.08);
                border-color: rgba(255,255,255,0.2);
            }
            .a11y-toggle:focus-visible {
                outline: 2px solid #fff;
                outline-offset: 3px;
            }
            .a11y-panel {
                position: absolute;
                bottom: 60px;
                left: 0;
                width: 280px;
                background: #0d0d0d;
                border: 1px solid #1f1f1f;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 20px 60px rgba(0,0,0,0.5);
                display: none;
                opacity: 0;
                transform: translateY(10px) scale(0.95);
                transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
            .a11y-panel.open {
                display: block;
                opacity: 1;
                transform: translateY(0) scale(1);
            }
            .a11y-header {
                padding: 14px 16px;
                border-bottom: 1px solid #1f1f1f;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-weight: 700;
                font-size: 14px;
            }
            .a11y-close {
                background: none;
                border: none;
                color: #888;
                font-size: 20px;
                cursor: pointer;
                padding: 0;
                line-height: 1;
            }
            .a11y-options {
                padding: 12px 16px;
            }
            .a11y-option {
                padding: 10px 0;
                border-bottom: 1px solid #1a1a1a;
            }
            .a11y-option:last-child {
                border-bottom: none;
            }
            .a11y-label {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 14px;
                color: #e0e0e0;
            }
            .a11y-switch {
                position: relative;
                width: 44px;
                height: 24px;
                background: none;
                border: none;
                cursor: pointer;
                padding: 0;
            }
            .switch-track {
                position: absolute;
                inset: 0;
                background: #333;
                border-radius: 12px;
                transition: background 0.2s;
            }
            .switch-thumb {
                position: absolute;
                top: 2px;
                left: 2px;
                width: 20px;
                height: 20px;
                background: #fff;
                border-radius: 50%;
                transition: transform 0.2s;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            }
            .a11y-switch[aria-checked="true"] .switch-track {
                background: #22c55e;
            }
            .a11y-switch[aria-checked="true"] .switch-thumb {
                transform: translateX(20px);
            }
            .a11y-text-controls {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .a11y-text-btn {
                width: 32px;
                height: 28px;
                background: #1a1a1a;
                border: 1px solid #333;
                border-radius: 6px;
                color: #fff;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
            }
            .a11y-text-btn:hover {
                background: #2a2a2a;
                border-color: #444;
            }
            .a11y-text-current {
                font-size: 12px;
                color: #888;
                min-width: 50px;
                text-align: center;
            }
            .a11y-shortcuts {
                padding: 12px 16px;
                border-top: 1px solid #1f1f1f;
            }
            .a11y-shortcuts-btn {
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                padding: 10px;
                background: #1a1a1a;
                border: 1px solid #2a2a2a;
                border-radius: 8px;
                color: #fff;
                font-size: 13px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
            }
            .a11y-shortcuts-btn:hover {
                background: #222;
                border-color: #3a3a3a;
            }

            /* High Contrast Mode */
            body.high-contrast {
                --bg-primary: #000 !important;
                --bg-secondary: #111 !important;
                --text-primary: #fff !important;
                --text-secondary: #ddd !important;
                --border-color: #fff !important;
            }
            body.high-contrast * {
                border-color: #fff !important;
            }
            body.high-contrast a,
            body.high-contrast button {
                outline-color: #ff0 !important;
            }
            body.high-contrast .nav-link,
            body.high-contrast a {
                color: #fff !important;
                text-decoration: underline !important;
            }
            body.high-contrast .btn-primary,
            body.high-contrast .submit-btn,
            body.high-contrast .sign-in-btn {
                background: #fff !important;
                color: #000 !important;
                border: 2px solid #fff !important;
            }

            /* Reduced Motion */
            body.reduced-motion *,
            body.reduced-motion *::before,
            body.reduced-motion *::after {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
            }

            /* Light Theme - Basic overrides (full theme in design-system.css) */
            /* Keeping minimal styles here for accessibility toolbar specifics */

            /* Text Size Adjustments */
            body.text-large {
                font-size: 18px !important;
            }
            body.text-large h1 { font-size: 2.8em !important; }
            body.text-large h2 { font-size: 2.2em !important; }
            body.text-large h3 { font-size: 1.6em !important; }
            body.text-large p, body.text-large span, body.text-large a { font-size: 1.1em !important; }

            body.text-x-large {
                font-size: 20px !important;
            }
            body.text-x-large h1 { font-size: 3em !important; }
            body.text-x-large h2 { font-size: 2.4em !important; }
            body.text-x-large h3 { font-size: 1.8em !important; }
            body.text-x-large p, body.text-x-large span, body.text-x-large a { font-size: 1.2em !important; }

            /* Screen reader only */
            .sr-only {
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip: rect(0, 0, 0, 0);
                white-space: nowrap;
                border: 0;
            }

            @media (max-width: 768px) {
                #a11y-toolbar {
                    left: 16px;
                    bottom: 90px;
                }
                .a11y-panel {
                    width: 260px;
                }
            }
        `;

        document.head.appendChild(styles);
        document.body.appendChild(toolbar);

        // Initialize state
        initAccessibilityState();

        // Event listeners
        const toggle = document.getElementById('a11yToggle');
        const panel = document.getElementById('a11yPanel');
        const closeBtn = toolbar.querySelector('.a11y-close');
        const highContrastToggle = document.getElementById('highContrastToggle');
        const reducedMotionToggle = document.getElementById('reducedMotionToggle');
        const textSizeUp = document.getElementById('textSizeUp');
        const textSizeDown = document.getElementById('textSizeDown');
        const showShortcutsBtn = document.getElementById('showShortcutsBtn');

        toggle.addEventListener('click', () => {
            const isOpen = panel.classList.toggle('open');
            toggle.setAttribute('aria-expanded', isOpen);
            if (isOpen) {
                announce('Accessibility panel opened');
            }
        });

        closeBtn.addEventListener('click', () => {
            panel.classList.remove('open');
            toggle.setAttribute('aria-expanded', 'false');
        });

        highContrastToggle.addEventListener('click', () => {
            const isEnabled = document.body.classList.toggle('high-contrast');
            highContrastToggle.setAttribute('aria-checked', isEnabled);
            setStorage(CONFIG.storageKeys.highContrast, isEnabled);
            showToast(isEnabled ? 'High contrast mode enabled' : 'High contrast mode disabled', 'info');
        });

        reducedMotionToggle.addEventListener('click', () => {
            const isEnabled = document.body.classList.toggle('reduced-motion');
            reducedMotionToggle.setAttribute('aria-checked', isEnabled);
            setStorage(CONFIG.storageKeys.reducedMotion, isEnabled);
            showToast(isEnabled ? 'Reduced motion enabled' : 'Reduced motion disabled', 'info');
        });

        const themeToggle = document.getElementById('themeToggle');
        themeToggle.addEventListener('click', () => {
            const isLight = document.body.classList.toggle('light-theme');
            themeToggle.setAttribute('aria-checked', isLight);
            setStorage(CONFIG.storageKeys.theme, isLight ? 'light' : 'dark');
            showToast(isLight ? 'Light theme enabled' : 'Dark theme enabled', 'info');
            announce(isLight ? 'Light theme activated' : 'Dark theme activated');
        });

        textSizeUp.addEventListener('click', () => adjustTextSize(1));
        textSizeDown.addEventListener('click', () => adjustTextSize(-1));
        showShortcutsBtn.addEventListener('click', showKeyboardShortcutsModal);

        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
            if (!toolbar.contains(e.target)) {
                panel.classList.remove('open');
                toggle.setAttribute('aria-expanded', 'false');
            }
        });
    }

    function initAccessibilityState() {
        // Restore high contrast
        if (getStorage(CONFIG.storageKeys.highContrast)) {
            document.body.classList.add('high-contrast');
            const toggle = document.getElementById('highContrastToggle');
            if (toggle) toggle.setAttribute('aria-checked', 'true');
        }

        // Restore reduced motion
        if (getStorage(CONFIG.storageKeys.reducedMotion)) {
            document.body.classList.add('reduced-motion');
            const toggle = document.getElementById('reducedMotionToggle');
            if (toggle) toggle.setAttribute('aria-checked', 'true');
        }

        // Restore text size
        const savedSize = getStorage(CONFIG.storageKeys.textSize, 0);
        if (savedSize > 0) {
            document.body.classList.add(`text-${CONFIG.textSizes[savedSize]}`);
            updateTextSizeDisplay(savedSize);
        }

        // Check system preference for reduced motion
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.body.classList.add('reduced-motion');
        }

        // Restore theme preference
        const savedTheme = getStorage(CONFIG.storageKeys.theme, null);
        if (savedTheme === 'light') {
            document.body.classList.add('light-theme');
            const toggle = document.getElementById('themeToggle');
            if (toggle) toggle.setAttribute('aria-checked', 'true');
        } else if (savedTheme === null && window.matchMedia('(prefers-color-scheme: light)').matches) {
            // Follow system preference if no saved preference
            document.body.classList.add('light-theme');
            const toggle = document.getElementById('themeToggle');
            if (toggle) toggle.setAttribute('aria-checked', 'true');
        }
    }

    function adjustTextSize(direction) {
        let currentIndex = getStorage(CONFIG.storageKeys.textSize, 0);
        const newIndex = Math.max(0, Math.min(CONFIG.textSizes.length - 1, currentIndex + direction));

        // Remove current class
        CONFIG.textSizes.forEach(size => {
            if (size !== 'normal') document.body.classList.remove(`text-${size}`);
        });

        // Add new class
        if (newIndex > 0) {
            document.body.classList.add(`text-${CONFIG.textSizes[newIndex]}`);
        }

        setStorage(CONFIG.storageKeys.textSize, newIndex);
        updateTextSizeDisplay(newIndex);
        showToast(`Text size: ${CONFIG.textSizes[newIndex].replace('-', ' ')}`, 'info');
    }

    function updateTextSizeDisplay(index) {
        const display = document.getElementById('textSizeCurrent');
        if (display) {
            const labels = ['Normal', 'Large', 'X-Large'];
            display.textContent = labels[index] || 'Normal';
        }
    }

    // ============================================
    // KEYBOARD SHORTCUTS
    // ============================================
    const SHORTCUTS = [
        { key: '/', description: 'Focus search', action: () => focusSearch() },
        { key: 'b', description: 'Go to Browse', action: () => navigateTo('browse.html') },
        { key: 's', description: 'Go to Submit', action: () => navigateTo('submit.html') },
        { key: 'm', description: 'Go to Map', action: () => navigateTo('map.html') },
        { key: 'h', description: 'Go to Home', action: () => navigateTo('index.html') },
        { key: '?', description: 'Show shortcuts', action: () => showKeyboardShortcutsModal() },
        { key: 'Escape', description: 'Close modals', action: () => closeModals() }
    ];

    function focusSearch() {
        const searchInput = document.querySelector('.search-bar input, input[type="search"], #searchInput');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
            return true;
        }
        return false;
    }

    function navigateTo(page) {
        const currentPage = window.location.pathname.split('/').pop();
        if (currentPage !== page) {
            window.location.href = page;
        }
    }

    function closeModals() {
        // Close keyboard shortcuts modal
        const modal = document.getElementById('shortcuts-modal');
        if (modal) modal.remove();

        // Close accessibility panel
        const panel = document.getElementById('a11yPanel');
        if (panel) panel.classList.remove('open');

        // Close chatbot
        const chatbot = document.getElementById('chatbotPanel');
        if (chatbot) chatbot.classList.remove('open');
    }

    function showKeyboardShortcutsModal() {
        // Remove existing modal
        const existing = document.getElementById('shortcuts-modal');
        if (existing) {
            existing.remove();
            return;
        }

        const modal = document.createElement('div');
        modal.id = 'shortcuts-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-label', 'Keyboard shortcuts');
        modal.innerHTML = `
            <div class="shortcuts-overlay"></div>
            <div class="shortcuts-content">
                <div class="shortcuts-header">
                    <h2>Keyboard Shortcuts</h2>
                    <button class="shortcuts-close" aria-label="Close">&times;</button>
                </div>
                <div class="shortcuts-body">
                    <div class="shortcuts-section">
                        <h3>Navigation</h3>
                        <div class="shortcuts-list">
                            ${SHORTCUTS.filter(s => s.key !== '?' && s.key !== 'Escape').map(s => `
                                <div class="shortcut-item">
                                    <kbd>${s.key === '/' ? '/' : s.key.toUpperCase()}</kbd>
                                    <span>${s.description}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="shortcuts-section">
                        <h3>General</h3>
                        <div class="shortcuts-list">
                            <div class="shortcut-item">
                                <kbd>?</kbd>
                                <span>Show this help</span>
                            </div>
                            <div class="shortcut-item">
                                <kbd>ESC</kbd>
                                <span>Close modals</span>
                            </div>
                            <div class="shortcut-item">
                                <kbd>TAB</kbd>
                                <span>Navigate elements</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const styles = document.createElement('style');
        styles.textContent = `
            #shortcuts-modal {
                position: fixed;
                inset: 0;
                z-index: 100000;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: 'Inter', sans-serif;
            }
            .shortcuts-overlay {
                position: absolute;
                inset: 0;
                background: rgba(0,0,0,0.8);
                backdrop-filter: blur(4px);
            }
            .shortcuts-content {
                position: relative;
                background: #0d0d0d;
                border: 1px solid #2a2a2a;
                border-radius: 20px;
                width: 90%;
                max-width: 480px;
                box-shadow: 0 25px 80px rgba(0,0,0,0.6);
                animation: modalIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
            @keyframes modalIn {
                from { opacity: 0; transform: scale(0.9) translateY(20px); }
                to { opacity: 1; transform: scale(1) translateY(0); }
            }
            .shortcuts-header {
                padding: 20px 24px;
                border-bottom: 1px solid #1f1f1f;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .shortcuts-header h2 {
                font-size: 18px;
                font-weight: 700;
                margin: 0;
            }
            .shortcuts-close {
                background: none;
                border: none;
                color: #888;
                font-size: 24px;
                cursor: pointer;
                padding: 0;
                line-height: 1;
            }
            .shortcuts-body {
                padding: 20px 24px;
            }
            .shortcuts-section {
                margin-bottom: 20px;
            }
            .shortcuts-section:last-child {
                margin-bottom: 0;
            }
            .shortcuts-section h3 {
                font-size: 12px;
                font-weight: 600;
                color: #666;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 12px;
            }
            .shortcuts-list {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            .shortcut-item {
                display: flex;
                align-items: center;
                gap: 16px;
            }
            .shortcut-item kbd {
                min-width: 40px;
                padding: 6px 10px;
                background: #1a1a1a;
                border: 1px solid #333;
                border-radius: 6px;
                font-family: 'SF Mono', Monaco, monospace;
                font-size: 12px;
                font-weight: 600;
                color: #fff;
                text-align: center;
            }
            .shortcut-item span {
                font-size: 14px;
                color: #bbb;
            }
        `;

        document.head.appendChild(styles);
        document.body.appendChild(modal);

        // Focus trap
        const closeBtn = modal.querySelector('.shortcuts-close');
        closeBtn.focus();

        // Close handlers
        closeBtn.addEventListener('click', () => modal.remove());
        modal.querySelector('.shortcuts-overlay').addEventListener('click', () => modal.remove());
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') modal.remove();
        });

        announce('Keyboard shortcuts dialog opened');
    }

    // Global keyboard listener
    document.addEventListener('keydown', (e) => {
        // Ignore if in input field
        if (e.target.matches('input, textarea, select, [contenteditable="true"]')) {
            if (e.key === 'Escape') {
                e.target.blur();
            }
            return;
        }

        // Ignore if modifier keys (except shift for ?)
        if (e.ctrlKey || e.metaKey || e.altKey) return;

        const shortcut = SHORTCUTS.find(s => {
            if (s.key === '?') return e.key === '?' || (e.shiftKey && e.key === '/');
            return s.key.toLowerCase() === e.key.toLowerCase();
        });

        if (shortcut) {
            e.preventDefault();
            shortcut.action();
        }
    });

    // ============================================
    // RECENT SEARCHES
    // ============================================
    function getRecentSearches() {
        return getStorage(CONFIG.storageKeys.recentSearches, []);
    }

    function addRecentSearch(query) {
        if (!query || query.trim().length < 2) return;

        let searches = getRecentSearches();
        const trimmed = query.trim();

        // Remove if exists and add to front
        searches = searches.filter(s => s.toLowerCase() !== trimmed.toLowerCase());
        searches.unshift(trimmed);

        // Limit to max
        searches = searches.slice(0, CONFIG.maxRecentSearches);

        setStorage(CONFIG.storageKeys.recentSearches, searches);
    }

    function clearRecentSearches() {
        setStorage(CONFIG.storageKeys.recentSearches, []);
        showToast('Recent searches cleared', 'info');
    }

    // Expose globally
    window.BackTrackRecentSearches = {
        get: getRecentSearches,
        add: addRecentSearch,
        clear: clearRecentSearches
    };

    // ============================================
    // PRINT STYLES
    // ============================================
    function addPrintStyles() {
        const printStyles = document.createElement('style');
        printStyles.media = 'print';
        printStyles.textContent = `
            /* Hide non-essential elements when printing */
            nav, footer, .chatbot-widget, #a11y-toolbar, .page-transition,
            .search-container, .view-toggle, .sidebar, .upload-btn,
            .btn-secondary, .sign-in-btn, .hamburger, .mobile-menu {
                display: none !important;
            }

            /* Reset colors for printing */
            body {
                background: #fff !important;
                color: #000 !important;
                font-size: 12pt !important;
            }

            /* Make links visible */
            a {
                color: #000 !important;
                text-decoration: underline !important;
            }

            /* Item cards for printing */
            .item-card {
                break-inside: avoid;
                border: 1px solid #ccc !important;
                margin-bottom: 1rem !important;
                background: #fff !important;
            }

            .item-card * {
                color: #000 !important;
            }

            /* QR code visibility */
            .qr-code {
                display: block !important;
            }

            /* Page break controls */
            .page-title, .hero-title {
                color: #000 !important;
                -webkit-text-fill-color: #000 !important;
            }

            /* Claim button styling for print */
            .claim-card-btn {
                border: 2px solid #000 !important;
                background: #fff !important;
                color: #000 !important;
            }
        `;
        document.head.appendChild(printStyles);
    }

    // ============================================
    // PWA INSTALL PROMPT
    // ============================================
    function showPWAInstallButton() {
        // Only show if we have a deferred prompt and not already installed
        if (!deferredInstallPrompt) return;
        if (window.matchMedia('(display-mode: standalone)').matches) return;

        // Check if button already exists
        if (document.getElementById('pwa-install-btn')) return;

        const btn = document.createElement('button');
        btn.id = 'pwa-install-btn';
        btn.setAttribute('aria-label', 'Install BackTrack app');
        btn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <span>Install App</span>
        `;

        const styles = document.createElement('style');
        styles.textContent = `
            #pwa-install-btn {
                position: fixed;
                left: 80px;
                bottom: 24px;
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 12px 20px;
                background: linear-gradient(145deg, #22c55e 0%, #16a34a 100%);
                border: none;
                border-radius: 50px;
                color: #fff;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                box-shadow: 0 4px 20px rgba(34, 197, 94, 0.4);
                z-index: 9999;
                animation: pwaSlideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
                transition: all 0.3s ease;
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            }
            #pwa-install-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 30px rgba(34, 197, 94, 0.5);
            }
            @keyframes pwaSlideIn {
                from { opacity: 0; transform: translateX(-20px); }
                to { opacity: 1; transform: translateX(0); }
            }
            @media (max-width: 768px) {
                #pwa-install-btn {
                    left: 50%;
                    transform: translateX(-50%);
                    bottom: 90px;
                }
                #pwa-install-btn:hover {
                    transform: translateX(-50%) translateY(-2px);
                }
            }
        `;

        document.head.appendChild(styles);
        document.body.appendChild(btn);

        btn.addEventListener('click', async () => {
            if (!deferredInstallPrompt) return;

            deferredInstallPrompt.prompt();
            const { outcome } = await deferredInstallPrompt.userChoice;

            if (outcome === 'accepted') {
                showToast('BackTrack installed! Find it on your home screen.', 'success');
                btn.remove();
            }
            deferredInstallPrompt = null;
        });
    }

    // ============================================
    // VOICE SEARCH
    // ============================================
    function initVoiceSearch() {
        // Check for browser support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        // Find search inputs on the page
        const searchContainers = document.querySelectorAll('.search-bar, .search-container');

        searchContainers.forEach(container => {
            const input = container.querySelector('input');
            if (!input) return;
            if (container.querySelector('.voice-search-btn')) return; // Already added

            const voiceBtn = document.createElement('button');
            voiceBtn.className = 'voice-search-btn';
            voiceBtn.type = 'button';
            voiceBtn.setAttribute('aria-label', 'Search by voice');
            voiceBtn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    <line x1="12" y1="19" x2="12" y2="23"/>
                    <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
            `;

            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            let isListening = false;

            voiceBtn.addEventListener('click', () => {
                if (isListening) {
                    recognition.stop();
                    return;
                }

                recognition.start();
                isListening = true;
                voiceBtn.classList.add('listening');
                showToast('Listening... Say what you\'re looking for', 'info');
                announce('Voice search activated. Speak now.');
            });

            recognition.onresult = (event) => {
                const transcript = Array.from(event.results)
                    .map(result => result[0].transcript)
                    .join('');

                input.value = transcript;
                input.dispatchEvent(new Event('input', { bubbles: true }));
            };

            recognition.onend = () => {
                isListening = false;
                voiceBtn.classList.remove('listening');
                if (input.value) {
                    showToast(`Searching for "${input.value}"`, 'success');
                    // Trigger search
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                    const form = input.closest('form');
                    if (form) {
                        form.dispatchEvent(new Event('submit', { bubbles: true }));
                    }
                }
            };

            recognition.onerror = (event) => {
                isListening = false;
                voiceBtn.classList.remove('listening');
                if (event.error === 'no-speech') {
                    showToast('No speech detected. Try again.', 'warning');
                } else if (event.error !== 'aborted') {
                    showToast('Voice search error. Please try again.', 'error');
                }
            };

            // Position the button
            container.style.position = 'relative';
            container.appendChild(voiceBtn);
        });

        // Add voice search styles
        if (!document.getElementById('voice-search-styles')) {
            const styles = document.createElement('style');
            styles.id = 'voice-search-styles';
            styles.textContent = `
                .voice-search-btn {
                    position: absolute;
                    right: 50px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 36px;
                    height: 36px;
                    background: transparent;
                    border: none;
                    border-radius: 50%;
                    color: #888;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s ease;
                }
                .voice-search-btn:hover {
                    color: #fff;
                    background: rgba(255,255,255,0.1);
                }
                .voice-search-btn.listening {
                    color: #ef4444;
                    animation: voicePulse 1s ease-in-out infinite;
                }
                @keyframes voicePulse {
                    0%, 100% { transform: translateY(-50%) scale(1); }
                    50% { transform: translateY(-50%) scale(1.1); }
                }
                body.light-theme .voice-search-btn {
                    color: #6e6e73;
                }
                body.light-theme .voice-search-btn:hover {
                    color: #1d1d1f;
                    background: rgba(0,0,0,0.05);
                }
            `;
            document.head.appendChild(styles);
        }
    }

    // ============================================
    // LOADING SKELETONS
    // ============================================
    function createSkeletonStyles() {
        if (document.getElementById('skeleton-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'skeleton-styles';
        styles.textContent = `
            .skeleton {
                background: linear-gradient(90deg, #1a1a1a 25%, #252525 50%, #1a1a1a 75%);
                background-size: 200% 100%;
                animation: skeletonShimmer 1.5s ease-in-out infinite;
                border-radius: 8px;
            }
            @keyframes skeletonShimmer {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }
            .skeleton-card {
                background: #0a0a0a;
                border: 1px solid rgba(255,255,255,0.06);
                border-radius: 16px;
                padding: 16px;
                overflow: hidden;
            }
            .skeleton-image {
                width: 100%;
                height: 180px;
                margin-bottom: 16px;
            }
            .skeleton-title {
                width: 70%;
                height: 20px;
                margin-bottom: 12px;
            }
            .skeleton-text {
                width: 100%;
                height: 14px;
                margin-bottom: 8px;
            }
            .skeleton-text.short {
                width: 60%;
            }
            .skeleton-tags {
                display: flex;
                gap: 8px;
                margin-top: 12px;
            }
            .skeleton-tag {
                width: 60px;
                height: 24px;
                border-radius: 12px;
            }
            .skeleton-button {
                width: 100%;
                height: 44px;
                margin-top: 16px;
                border-radius: 10px;
            }

            body.light-theme .skeleton {
                background: linear-gradient(90deg, #e8e8ed 25%, #f5f5f7 50%, #e8e8ed 75%);
                background-size: 200% 100%;
            }
            body.light-theme .skeleton-card {
                background: #fff;
                border-color: rgba(0,0,0,0.08);
            }
        `;
        document.head.appendChild(styles);
    }

    // Create skeleton card HTML
    window.BackTrackSkeleton = {
        card: function() {
            return `
                <div class="skeleton-card">
                    <div class="skeleton skeleton-image"></div>
                    <div class="skeleton skeleton-title"></div>
                    <div class="skeleton skeleton-text"></div>
                    <div class="skeleton skeleton-text short"></div>
                    <div class="skeleton-tags">
                        <div class="skeleton skeleton-tag"></div>
                        <div class="skeleton skeleton-tag"></div>
                    </div>
                    <div class="skeleton skeleton-button"></div>
                </div>
            `;
        },
        grid: function(count = 6) {
            return Array(count).fill(this.card()).join('');
        }
    };

    // ============================================
    // CONFETTI ANIMATION
    // ============================================
    function createConfetti() {
        const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#fff'];
        const confettiCount = 150;
        const container = document.createElement('div');
        container.className = 'confetti-container';
        container.setAttribute('aria-hidden', 'true');

        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.cssText = `
                left: ${Math.random() * 100}%;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                animation-delay: ${Math.random() * 0.5}s;
                animation-duration: ${2 + Math.random() * 2}s;
            `;
            container.appendChild(confetti);
        }

        if (!document.getElementById('confetti-styles')) {
            const styles = document.createElement('style');
            styles.id = 'confetti-styles';
            styles.textContent = `
                .confetti-container {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    z-index: 10001;
                    overflow: hidden;
                }
                .confetti {
                    position: absolute;
                    width: 10px;
                    height: 10px;
                    top: -10px;
                    opacity: 0;
                    animation: confettiFall 3s ease-out forwards;
                }
                .confetti:nth-child(odd) {
                    border-radius: 50%;
                }
                .confetti:nth-child(even) {
                    transform: rotate(45deg);
                }
                @keyframes confettiFall {
                    0% {
                        opacity: 1;
                        top: -10px;
                        transform: translateX(0) rotate(0deg);
                    }
                    100% {
                        opacity: 0;
                        top: 100vh;
                        transform: translateX(${Math.random() > 0.5 ? '' : '-'}${50 + Math.random() * 100}px) rotate(${360 + Math.random() * 720}deg);
                    }
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(container);

        // Remove after animation
        setTimeout(() => {
            container.remove();
        }, 4000);
    }

    // Expose confetti function globally
    window.BackTrackConfetti = createConfetti;

    // ============================================
    // SKIP TO MAIN CONTENT
    // ============================================
    function createSkipLink() {
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.className = 'skip-to-main';
        skipLink.textContent = 'Skip to main content';

        const styles = document.createElement('style');
        styles.textContent = `
            .skip-to-main {
                position: fixed;
                top: -100px;
                left: 50%;
                transform: translateX(-50%);
                background: #fff;
                color: #000;
                padding: 12px 24px;
                border-radius: 0 0 8px 8px;
                font-weight: 600;
                font-size: 14px;
                z-index: 10001;
                transition: top 0.3s ease;
                text-decoration: none;
            }
            .skip-to-main:focus {
                top: 0;
                outline: none;
            }
        `;

        document.head.appendChild(styles);
        document.body.insertBefore(skipLink, document.body.firstChild);

        // Add id to main content area if not present
        const main = document.querySelector('main, .main-content, .container');
        if (main && !main.id) {
            main.id = 'main-content';
        }
    }

    // ============================================
    // SCROLL TO TOP BUTTON
    // ============================================
    function createScrollToTop() {
        const btn = document.createElement('button');
        btn.id = 'scroll-to-top';
        btn.setAttribute('aria-label', 'Scroll to top');
        btn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="18 15 12 9 6 15"/>
            </svg>
        `;

        const styles = document.createElement('style');
        styles.textContent = `
            #scroll-to-top {
                position: fixed;
                right: 24px;
                bottom: 100px;
                width: 44px;
                height: 44px;
                border-radius: 50%;
                background: linear-gradient(145deg, #1a1a1a 0%, #0a0a0a 100%);
                border: 1px solid rgba(255,255,255,0.08);
                color: #fff;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 16px rgba(0,0,0,0.4);
                opacity: 0;
                visibility: hidden;
                transform: translateY(20px);
                transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                z-index: 9998;
            }
            #scroll-to-top.visible {
                opacity: 1;
                visibility: visible;
                transform: translateY(0);
            }
            #scroll-to-top:hover {
                transform: translateY(-4px);
                border-color: rgba(255,255,255,0.15);
                box-shadow: 0 8px 24px rgba(0,0,0,0.5);
            }
            #scroll-to-top:focus-visible {
                outline: 2px solid #fff;
                outline-offset: 3px;
            }
            @media (max-width: 768px) {
                #scroll-to-top {
                    right: 16px;
                    bottom: 160px;
                    width: 40px;
                    height: 40px;
                }
            }
        `;

        document.head.appendChild(styles);
        document.body.appendChild(btn);

        // Show/hide based on scroll position
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    btn.classList.toggle('visible', window.scrollY > 400);
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });

        // Scroll to top on click
        btn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            announce('Scrolled to top');
        });
    }

    // ============================================
    // ONLINE/OFFLINE INDICATOR
    // ============================================
    function createConnectionIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'connection-indicator';
        indicator.setAttribute('role', 'status');
        indicator.setAttribute('aria-live', 'polite');
        indicator.innerHTML = `
            <span class="connection-dot"></span>
            <span class="connection-text">Online</span>
        `;

        const styles = document.createElement('style');
        styles.textContent = `
            #connection-indicator {
                position: fixed;
                top: 80px;
                right: 24px;
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px 14px;
                background: rgba(10, 10, 10, 0.9);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 20px;
                font-size: 12px;
                font-weight: 500;
                color: #888;
                z-index: 9998;
                opacity: 0;
                transform: translateY(-10px);
                transition: all 0.3s ease;
                pointer-events: none;
                backdrop-filter: blur(8px);
            }
            #connection-indicator.visible {
                opacity: 1;
                transform: translateY(0);
            }
            #connection-indicator.offline {
                background: rgba(239, 68, 68, 0.15);
                border-color: rgba(239, 68, 68, 0.3);
                color: #ef4444;
            }
            #connection-indicator.online {
                background: rgba(34, 197, 94, 0.15);
                border-color: rgba(34, 197, 94, 0.3);
                color: #22c55e;
            }
            .connection-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: currentColor;
            }
            #connection-indicator.offline .connection-dot {
                animation: connectionPulse 1.5s ease-in-out infinite;
            }
            @keyframes connectionPulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.4; }
            }
            body.light-theme #connection-indicator {
                background: rgba(255, 255, 255, 0.95);
            }
            @media (max-width: 768px) {
                #connection-indicator {
                    top: auto;
                    bottom: 24px;
                    right: 50%;
                    transform: translateX(50%) translateY(10px);
                }
                #connection-indicator.visible {
                    transform: translateX(50%) translateY(0);
                }
            }
        `;

        document.head.appendChild(styles);
        document.body.appendChild(indicator);

        let hideTimeout;

        function updateStatus(online) {
            indicator.classList.remove('online', 'offline');
            indicator.classList.add(online ? 'online' : 'offline');
            indicator.querySelector('.connection-text').textContent = online ? 'Back online' : 'You\'re offline';

            // Show indicator
            indicator.classList.add('visible');
            clearTimeout(hideTimeout);

            // Hide after 3 seconds if online
            if (online) {
                hideTimeout = setTimeout(() => {
                    indicator.classList.remove('visible');
                }, 3000);
            }

            // Announce to screen readers
            announce(online ? 'Connection restored' : 'You are currently offline');
        }

        window.addEventListener('online', () => updateStatus(true));
        window.addEventListener('offline', () => updateStatus(false));

        // Show initial offline state if needed
        if (!navigator.onLine) {
            updateStatus(false);
        }
    }

    // ============================================
    // INITIALIZATION
    // ============================================
    function init() {
        // Wait for DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initAll);
        } else {
            initAll();
        }
    }

    function initAll() {
        createSkipLink();
        createAccessibilityToolbar();
        createScrollToTop();
        createConnectionIndicator();
        addPrintStyles();
        createAnnouncer();
        initVoiceSearch();
        createSkeletonStyles();

        // Register service worker for PWA
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(reg => console.log('Service Worker registered:', reg.scope))
                .catch(err => console.log('Service Worker registration failed:', err));
        }

        // Add search tracking if search input exists
        const searchInput = document.querySelector('.search-bar input, input[type="search"]');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', () => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    const value = searchInput.value.trim();
                    if (value.length >= 3) {
                        addRecentSearch(value);
                    }
                }, 1500);
            });
        }

        console.log('BackTrack Accessibility Module loaded');
    }

    init();
})();
