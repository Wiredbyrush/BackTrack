/**
 * LEADERBOARD LOGIC
 * Refactored from index.html
 */
(function () {
    console.log('[Leaderboard] Initializing...');
    const BOUNTY_WEIGHT = 2;
    const MONTH_WINDOW_DAYS = 30;
    const podium = document.getElementById('lbPodium');
    const tableRows = document.getElementById('lbTableRows');
    const summary = document.getElementById('lbSummary');
    const note = document.getElementById('lbNote');
    const rangeButtons = Array.from(document.querySelectorAll('.lb-range-btn'));

    if (!podium || !tableRows || !summary || !note || !rangeButtons.length) {
        console.error('[Leaderboard] Missing required elements:', { podium, tableRows, summary, note, rangeButtons });
        return;
    }
    console.log('[Leaderboard] Elements found. Starting...');

    const fallbackEntries = [
        { name: 'Jolie Joie', found: 26, bounties: 10, score: 46 },
        { name: 'Brian Ngo', found: 20, bounties: 8, score: 36 },
        { name: 'David Do', found: 16, bounties: 6, score: 28 },
        { name: 'Henrietta O', found: 13, bounties: 4, score: 21 },
        { name: 'Darrel Bins', found: 12, bounties: 3, score: 18 },
        { name: 'Mia Ross', found: 10, bounties: 3, score: 16 }
    ];

    const state = {
        range: 'month',
        usingFallback: false,
        items: []
    };

    function normalizeName(value) {
        return String(value || '').trim().replace(/\s+/g, ' ');
    }

    function formatNumber(value) {
        return new Intl.NumberFormat('en-US').format(Number(value) || 0);
    }

    function initialsFromName(name) {
        const cleanName = normalizeName(name);
        if (!cleanName) return '--';
        const parts = cleanName.split(' ').filter(Boolean).slice(0, 2);
        return parts.map((part) => part[0].toUpperCase()).join('');
    }

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function prettyFromEmail(email) {
        if (!email || !email.includes('@')) return '';
        const local = email.split('@')[0].replace(/[._-]+/g, ' ').trim();
        if (!local) return '';
        return local.replace(/\b\w/g, (char) => char.toUpperCase());
    }

    function getDisplayName(item) {
        const finderName = normalizeName(item.finder_name);
        if (finderName) return finderName;

        const fromEmail = prettyFromEmail(item.contact_email);
        if (fromEmail) return fromEmail;

        const uid = String(item.submitted_by || '').trim();
        if (uid) return `User ${uid.slice(0, 6)}`;

        return 'Unknown Finder';
    }

    function getContributorKey(item) {
        const uid = String(item.submitted_by || '').trim();
        if (uid) return `uid:${uid}`;

        const email = String(item.contact_email || '').trim().toLowerCase();
        if (email) return `email:${email}`;

        const finderName = normalizeName(item.finder_name).toLowerCase();
        if (finderName) return `name:${finderName}`;

        return '';
    }

    function itemTimestamp(item) {
        const raw = item.created_at || item.updated_at || item.date_lost || '';
        const stamp = Date.parse(raw);
        return Number.isFinite(stamp) ? stamp : 0;
    }

    function isInSelectedRange(item, range) {
        if (range !== 'month') return true;
        const stamp = itemTimestamp(item);
        if (!stamp) return true;
        const cutoff = Date.now() - (MONTH_WINDOW_DAYS * 24 * 60 * 60 * 1000);
        return stamp >= cutoff;
    }

    function computeEntries(items, range) {
        const byFinder = new Map();

        items.forEach((item) => {
            const status = String(item.status || '').toLowerCase();
            if (status !== 'found' && status !== 'claimed') return;
            if (!isInSelectedRange(item, range)) return;

            const key = getContributorKey(item);
            if (!key) return;

            if (!byFinder.has(key)) {
                byFinder.set(key, {
                    name: getDisplayName(item),
                    found: 0,
                    bounties: 0,
                    score: 0,
                    lastSeen: 0
                });
            }

            const entry = byFinder.get(key);
            const nextName = getDisplayName(item);
            if ((entry.name === 'Unknown Finder' || entry.name.startsWith('User ')) && !nextName.startsWith('User ') && nextName !== 'Unknown Finder') {
                entry.name = nextName;
            }

            entry.found += 1;
            if (status === 'claimed') entry.bounties += 1;
            entry.lastSeen = Math.max(entry.lastSeen, itemTimestamp(item));
        });

        return Array.from(byFinder.values())
            .map((entry) => ({
                ...entry,
                score: entry.found + (entry.bounties * BOUNTY_WEIGHT)
            }))
            .sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                if (b.found !== a.found) return b.found - a.found;
                if (b.bounties !== a.bounties) return b.bounties - a.bounties;
                if (b.lastSeen !== a.lastSeen) return b.lastSeen - a.lastSeen;
                return a.name.localeCompare(b.name);
            });
    }

    function countUp(el, endValue) {
        if (!el) return;
        const duration = 2000;
        const start = 0;
        let startTime = null;

        function animation(currentTime) {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const progress = Math.min(timeElapsed / duration, 1);

            // Ease out quart
            const ease = 1 - Math.pow(1 - progress, 4);

            const currentVal = Math.floor(ease * (endValue - start) + start);
            el.textContent = formatNumber(currentVal);

            if (timeElapsed < duration) {
                requestAnimationFrame(animation);
            } else {
                el.textContent = formatNumber(endValue);
            }
        }

        requestAnimationFrame(animation);
    }

    function renderParticles(rank) {
        if (rank !== 1) return '';
        let particles = '';
        for (let i = 0; i < 6; i++) {
            const tx = (Math.random() - 0.5) * 100 + 'px';
            const ty = -50 - Math.random() * 100 + 'px';
            const delay = Math.random() * 2 + 's';
            particles += `<div class="lb-particle" style="--tx: ${tx}; --ty: ${ty}; animation-delay: ${delay}; left: ${50 + (Math.random() * 40 - 20)}%; top: ${50 + (Math.random() * 40 - 20)}%;"></div>`;
        }
        return particles;
    }

    function podiumCard(entry, rank, delayMs) {
        if (!entry) {
            return `
                <div class="lb-podium-place rank-${rank} empty" style="animation-delay:${delayMs}ms;">
                    <div class="lb-avatar-box">
                        <div class="lb-avatar">?</div>
                    </div>
                    <div class="lb-cylinder">
                        <div class="lb-cylinder-top"></div>
                        <div class="lb-cylinder-side"></div>
                        <div class="lb-rank-badge">${rank}</div>
                    </div>
                    <div class="lb-user-info">
                        <div class="lb-name">Open Spot</div>
                        <div class="lb-score">--</div>
                    </div>
                </div>
            `;
        }

        const safeName = escapeHtml(entry.name);
        const avatar = escapeHtml(initialsFromName(entry.name));
        const particles = renderParticles(rank);

        return `
            <div class="lb-podium-place rank-${rank}" style="animation-delay:${delayMs}ms;">
                <div class="lb-avatar-box">
                    <div class="lb-avatar">${avatar}</div>
                    ${particles}
                </div>
                <div class="lb-cylinder">
                    <div class="lb-cylinder-top"></div>
                    <div class="lb-cylinder-side"></div>
                    <div class="lb-rank-badge">${rank}</div>
                </div>
                <div class="lb-user-info">
                    <div class="lb-name">${safeName}</div>
                    <div class="lb-score" data-value="${entry.score}">0</div>
                    <div class="lb-score-label">Score</div>
                    <div class="lb-metrics">
                        <span>${formatNumber(entry.found)} Found</span>
                        <span>${formatNumber(entry.bounties)} Bounties</span>
                    </div>
                </div>
            </div>
        `;
    }

    function tableRow(entry, rank) {
        if (!entry) return '';
        const safeName = escapeHtml(entry.name);
        return `
            <div class="lb-row">
                <div class="lb-cell lb-rank">${rank}</div>
                <div class="lb-cell lb-user">${safeName}</div>
                <div class="lb-cell lb-stat">${formatNumber(entry.found)}</div>
                <div class="lb-cell lb-stat">${formatNumber(entry.bounties)}</div>
                <div class="lb-cell lb-score-cell">${formatNumber(entry.score)}</div>
            </div>
        `;
    }

    function renderPodium(entries) {
        // Top 3
        const top3 = [entries[0], entries[1], entries[2]]; // 1st, 2nd, 3rd
        // But layout is usually 2, 1, 3 or just 1, 2, 3? 
        // CSS handles ordering usually, but here we just stamp them out.
        // Assuming CSS flex order or grid handles 2-1-3 visual.
        // But wait, my podiumCard has `rank-1`, `rank-2` classes.

        let html = '';
        html += podiumCard(entries[1], 2, 200); // Silver
        html += podiumCard(entries[0], 1, 0);   // Gold
        html += podiumCard(entries[2], 3, 400); // Bronze

        podium.innerHTML = html;
    }

    function renderRows(entries) {
        const rest = entries.slice(3);
        if (rest.length === 0) {
            tableRows.innerHTML = '<div class="lb-empty-rows">No other contibutors yet.</div>';
            return;
        }
        tableRows.innerHTML = rest.map((e, i) => tableRow(e, i + 4)).join('');
    }

    function renderSummary(entries) {
        if (state.range === 'month') {
            summary.textContent = `Top contributors this month.`;
        } else {
            summary.textContent = `All-time top contributors.`;
        }
    }

    function render() {
        const entries = state.usingFallback ? fallbackEntries : computeEntries(state.items, state.range);
        renderPodium(entries);
        renderRows(entries);
        renderSummary(entries);

        // Trigger Count Up
        document.querySelectorAll('.lb-score[data-value]').forEach(el => {
            const val = parseInt(el.dataset.value, 10);
            if (!isNaN(val)) countUp(el, val);
        });

        if (state.usingFallback) {
            note.textContent = 'Preview data shown. Connect Supabase for live rankings.';
            return;
        }

        if (!entries.length) {
            note.textContent = 'No live ranking data in this range yet.';
            return;
        }

        note.textContent = `Live data · score = found + ${BOUNTY_WEIGHT}x bounties`;
    }

    async function loadLeaderboard() {
        note.textContent = 'Loading live data...';

        // Check config
        if (typeof BackTrackDB === 'undefined' || !BackTrackDB.isSupabaseConfigured()) {
            console.warn('[Leaderboard] Supabase not configured. Using fallback.');
            state.usingFallback = true;
            render();
            return;
        }

        try {
            console.log('[Leaderboard] Fetching items...');
            // Add timeout to prevent hanging
            const fetchPromise = BackTrackDB.getItems();
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout')), 5000)
            );

            const items = await Promise.race([fetchPromise, timeoutPromise]);

            if (!Array.isArray(items)) {
                throw new Error('Invalid data format received');
            }

            state.items = items;
            state.usingFallback = false;
            console.log('[Leaderboard] Loaded items:', state.items.length);

        } catch (error) {
            console.warn('[Leaderboard] Load failed/timed out:', error);
            state.usingFallback = true;
        }

        render();
    }

    function setRange(range) {
        if (range === state.range) return;
        state.range = range;

        rangeButtons.forEach(btn => {
            if (btn.dataset.range === range) btn.classList.add('active');
            else btn.classList.remove('active');
        });

        render();
    }

    rangeButtons.forEach(btn => {
        btn.addEventListener('click', () => setRange(btn.dataset.range));
    });

    // Start
    loadLeaderboard();

})();
