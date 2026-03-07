/**
 * LEADERBOARD
 */
(function () {
    var BOUNTY_WEIGHT = 2;
    var MONTH_WINDOW_DAYS = 30;
    var RANGE_ORDER = ['month', 'all'];
    var RANGE_LABELS = {
        month: 'Monthly',
        all: 'All Time'
    };

    var podiumWrap = document.getElementById('lbPodium');
    var tableRows = document.getElementById('lbTableRows');
    var tableWrap = tableRows ? tableRows.closest('.lb-table-wrap') : null;
    var sectionEl = document.querySelector('.lb-section');
    var spotlight = document.getElementById('lbSpotlight');
    var contributorsEl = document.getElementById('lbContributors');
    var foundEl = document.getElementById('lbItemsFound');
    var bountiesEl = document.getElementById('lbBounties');
    var topScoreEl = document.getElementById('lbTopScore');
    var summaryEl = document.getElementById('lbSummary');
    var noteEl = document.getElementById('lbNote');
    var rangeButtons = Array.from(document.querySelectorAll('.lb-range-btn'));
    var prefersReducedMotion = Boolean(
        window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );

    if (!podiumWrap || !tableRows || !rangeButtons.length) return;

    var fallbackEntries = [
        { key: 'fallback:jolie', name: 'Jolie Joie', found: 26, bounties: 10, score: 46, lastSeen: 0 },
        { key: 'fallback:brian', name: 'Brian Ngo', found: 20, bounties: 8, score: 36, lastSeen: 0 },
        { key: 'fallback:david', name: 'David Do', found: 16, bounties: 6, score: 28, lastSeen: 0 },
        { key: 'fallback:henrietta', name: 'Henrietta O', found: 13, bounties: 4, score: 21, lastSeen: 0 },
        { key: 'fallback:darrel', name: 'Darrel Bins', found: 12, bounties: 3, score: 18, lastSeen: 0 },
        { key: 'fallback:mia', name: 'Mia Ross', found: 10, bounties: 3, score: 16, lastSeen: 0 }
    ];

    var state = {
        range: 'month',
        usingFallback: false,
        items: [],
        currentUser: null,
        byRange: {
            month: [],
            all: []
        }
    };

    function norm(v) {
        return String(v || '').trim().replace(/\s+/g, ' ');
    }

    function fmt(v) {
        return new Intl.NumberFormat('en-US').format(Number(v) || 0);
    }

    function esc(v) {
        return String(v || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function initials(name) {
        var n = norm(name);
        if (!n) return '--';
        return n
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map(function (part) { return part[0].toUpperCase(); })
            .join('');
    }

    function prettyEmail(email) {
        if (!email || email.indexOf('@') === -1) return '';
        var left = email.split('@')[0].replace(/[._-]+/g, ' ').trim();
        return left ? left.replace(/\b\w/g, function (char) { return char.toUpperCase(); }) : '';
    }

    function displayName(item) {
        var finderName = norm(item.finder_name);
        if (finderName) return finderName;

        var emailName = prettyEmail(item.contact_email);
        if (emailName) return emailName;

        var userId = String(item.submitted_by || '').trim();
        if (userId) return 'User ' + userId.slice(0, 6);

        return 'Unknown Finder';
    }

    function contribKey(item) {
        var userId = String(item.submitted_by || '').trim();
        if (userId) return 'uid:' + userId;

        var email = String(item.contact_email || '').trim().toLowerCase();
        if (email) return 'email:' + email;

        var name = norm(item.finder_name).toLowerCase();
        if (name) return 'name:' + name;

        return '';
    }

    function ts(item) {
        var stamp = Date.parse(item.created_at || item.updated_at || item.date_lost || '');
        return Number.isFinite(stamp) ? stamp : 0;
    }

    function inRange(item, range) {
        if (range !== 'month') return true;
        var stamp = ts(item);
        return !stamp || stamp >= Date.now() - MONTH_WINDOW_DAYS * 864e5;
    }

    function compute(items, range) {
        var map = new Map();

        items.forEach(function (item) {
            var status = String(item.status || '').toLowerCase();
            if (status !== 'found' && status !== 'claimed') return;
            if (!inRange(item, range)) return;

            var key = contribKey(item);
            if (!key) return;

            if (!map.has(key)) {
                map.set(key, {
                    key: key,
                    name: displayName(item),
                    found: 0,
                    bounties: 0,
                    lastSeen: 0
                });
            }

            var entry = map.get(key);
            var bestName = displayName(item);
            if ((entry.name === 'Unknown Finder' || entry.name.indexOf('User ') === 0)
                && bestName !== 'Unknown Finder' && bestName.indexOf('User ') !== 0) {
                entry.name = bestName;
            }

            entry.found += 1;
            if (status === 'claimed') entry.bounties += 1;
            entry.lastSeen = Math.max(entry.lastSeen, ts(item));
        });

        return Array.from(map.values())
            .map(function (entry) {
                return Object.assign({}, entry, {
                    score: entry.found + entry.bounties * BOUNTY_WEIGHT
                });
            })
            .sort(function (a, b) {
                return b.score - a.score
                    || b.found - a.found
                    || b.bounties - a.bounties
                    || b.lastSeen - a.lastSeen
                    || a.name.localeCompare(b.name);
            });
    }

    function getUserKeys() {
        if (!state.currentUser) return [];

        var keys = [];
        var userId = String(state.currentUser.id || '').trim();
        if (userId) keys.push('uid:' + userId);

        var email = String(state.currentUser.email || '').trim().toLowerCase();
        if (email) keys.push('email:' + email);

        return keys;
    }

    function findUserPlacement(entries) {
        var keys = getUserKeys();
        if (!keys.length) return null;

        for (var i = 0; i < entries.length; i += 1) {
            if (keys.indexOf(entries[i].key) !== -1) {
                return { entry: entries[i], rank: i + 1 };
            }
        }

        return null;
    }

    function trendFor(entry, rank, allRankMap) {
        if (!entry) return { cls: 'flat', label: '--' };
        if (state.range !== 'month') return { cls: 'flat', label: 'ALL' };

        var allRank = allRankMap.get(entry.key);
        if (!allRank) return { cls: 'up', label: 'NEW' };

        var delta = allRank - rank;
        if (delta > 0) return { cls: 'up', label: 'UP ' + delta };
        if (delta < 0) return { cls: 'down', label: 'DOWN ' + Math.abs(delta) };
        return { cls: 'flat', label: 'EVEN' };
    }

    function calcTotals(entries) {
        return entries.reduce(function (totals, entry) {
            totals.found += Number(entry.found || 0);
            totals.bounties += Number(entry.bounties || 0);
            return totals;
        }, { found: 0, bounties: 0 });
    }

    function setInsights(entries) {
        if (!contributorsEl || !foundEl || !bountiesEl || !topScoreEl) return;

        var totals = calcTotals(entries);
        countUp(contributorsEl, entries.length);
        countUp(foundEl, totals.found);
        countUp(bountiesEl, totals.bounties);
        countUp(topScoreEl, entries[0] ? entries[0].score : 0);
    }

    function setSpotlight(entries) {
        if (!spotlight) return;

        if (!state.currentUser) {
            spotlight.textContent = 'Log in to see your leaderboard position and movement.';
            return;
        }

        var placement = findUserPlacement(entries);
        if (!placement) {
            spotlight.textContent = state.range === 'month'
                ? 'You are not ranked this month yet. Return one item to get on the board.'
                : 'You are not ranked all-time yet. Return one item to get on the board.';
            return;
        }

        var movement = '';
        if (state.range === 'month') {
            var allEntries = state.usingFallback ? fallbackEntries : (state.byRange.all || []);
            var allRank = allEntries.findIndex(function (entry) {
                return entry.key === placement.entry.key;
            });
            if (allRank >= 0) {
                var delta = (allRank + 1) - placement.rank;
                if (delta > 0) movement = ' Up ' + delta + ' compared to all-time.';
                if (delta < 0) movement = ' Down ' + Math.abs(delta) + ' compared to all-time.';
                if (delta === 0) movement = ' Same placement as all-time.';
            }
        }

        spotlight.textContent = 'You are #' + placement.rank
            + ' with ' + fmt(placement.entry.score) + ' points '
            + '(' + fmt(placement.entry.found) + ' found, '
            + fmt(placement.entry.bounties) + ' bounties).'
            + movement;
    }

    function setSummary(entries) {
        if (summaryEl) {
            var rangeLabel = state.range === 'month'
                ? RANGE_LABELS.month + ' (last ' + MONTH_WINDOW_DAYS + ' days)'
                : RANGE_LABELS.all;
            var leader = entries[0] ? ' - Leader: ' + entries[0].name : '';
            summaryEl.textContent = rangeLabel + ' - ' + fmt(entries.length) + ' ranked contributors' + leader;
        }

        if (noteEl) {
            noteEl.textContent = state.usingFallback
                ? 'Showing demo data. Connect Supabase to enable live rankings.'
                : 'Scores = found items + (' + BOUNTY_WEIGHT + ' x bounty claims).';
        }
    }

    function countUp(el, end) {
        if (!el) return;

        var targetValue = Math.max(0, Number(end) || 0);
        if (el.dataset.lbValue === String(targetValue)) return;
        el.dataset.lbValue = String(targetValue);

        if (prefersReducedMotion) {
            el.textContent = fmt(targetValue);
            return;
        }

        var startValue = Number(el.textContent.replace(/[^0-9.-]/g, '')) || 0;
        var startAt = null;

        function tick(now) {
            if (!startAt) startAt = now;
            var progress = Math.min((now - startAt) / 650, 1);
            var eased = 1 - Math.pow(1 - progress, 3);
            var value = Math.floor(startValue + (targetValue - startValue) * eased);
            el.textContent = fmt(value);
            if (progress < 1) {
                requestAnimationFrame(tick);
            } else {
                el.textContent = fmt(targetValue);
            }
        }

        requestAnimationFrame(tick);
    }

    function rankLabel(rank) {
        if (rank === 1) return '1st';
        if (rank === 2) return '2nd';
        if (rank === 3) return '3rd';
        return String(rank);
    }

    function podiumCard(entry, rank, trend, isSelf) {
        var empty = !entry;
        var avatar = empty ? '--' : esc(initials(entry.name));
        var name = empty ? 'Open Spot' : esc(entry.name);
        var scoreAttr = empty ? '' : ' data-value="' + entry.score + '"';
        var score = empty ? '--' : '0';
        var medal = empty ? '' : '<span class="lb-medal lb-medal-' + rank + '" aria-hidden="true">' + rank + '</span>';
        var youBadge = isSelf && !empty ? '<span class="lb-you-badge lb-you-badge-card">You</span>' : '';
        var meta = empty
            ? 'Waiting for live data'
            : fmt(entry.found) + ' found / ' + fmt(entry.bounties) + ' bounties';
        var trendClass = empty ? 'flat' : trend.cls;
        var trendLabel = empty ? '--' : trend.label;

        return '<article class="lb-podium-place rank-' + rank + (empty ? ' empty' : '') + (isSelf ? ' is-self' : '') + '">'
            + '<div class="lb-podium-card">'
            + '<div class="lb-card-header">'
            + medal
            + '<span class="lb-card-rank-text">' + rankLabel(rank) + ' place</span>'
            + youBadge
            + '</div>'
            + '<div class="lb-avatar">' + avatar + '</div>'
            + '<div class="lb-card-name">' + name + '</div>'
            + '<div class="lb-card-meta">' + esc(meta) + '</div>'
            + '<div class="lb-card-score-wrap">'
            + '<div class="lb-card-score"' + scoreAttr + '>' + score + '</div>'
            + '<div class="lb-card-label">score</div>'
            + '</div>'
            + '<span class="lb-card-trend ' + trendClass + '">' + esc(trendLabel) + '</span>'
            + '</div>'
            + '<div class="lb-podium-bar"><span class="lb-bar-rank">#' + rank + '</span></div>'
            + '</article>';
    }

    function tableRow(entry, rank, trend, isSelf) {
        if (!entry) return '';

        var rowClass = 'lb-row' + (isSelf ? ' is-self' : '');
        var youBadge = isSelf ? '<span class="lb-you-badge">You</span>' : '';
        var rowSub = fmt(entry.found) + ' found / ' + fmt(entry.bounties) + ' bounties';

        return '<article class="' + rowClass + '">'
            + '<div class="lb-cell-rank">' + rank + '</div>'
            + '<div class="lb-cell lb-cell-user">'
            + '<span class="lb-row-avatar" aria-hidden="true">' + esc(initials(entry.name)) + '</span>'
            + '<div class="lb-row-user-meta">'
            + '<div class="lb-row-name">' + esc(entry.name) + '</div>'
            + '<div class="lb-row-sub">' + esc(rowSub) + '</div>'
            + '</div>'
            + youBadge
            + '</div>'
            + '<div class="lb-cell lb-cell-found" data-label="Found">' + fmt(entry.found) + '</div>'
            + '<div class="lb-cell lb-cell-bounties" data-label="Bounties">' + fmt(entry.bounties) + '</div>'
            + '<div class="lb-cell lb-cell-score" data-label="Score">' + fmt(entry.score) + '</div>'
            + '<div class="lb-cell lb-cell-trend"><span class="lb-table-trend ' + trend.cls + '">' + esc(trend.label) + '</span></div>'
            + '</article>';
    }

    function doRender() {
        var entries = state.usingFallback
            ? fallbackEntries.slice()
            : (state.byRange[state.range] || []);

        var allEntries = state.usingFallback
            ? fallbackEntries
            : (state.byRange.all || []);

        var allRankMap = new Map(
            allEntries.map(function (entry, idx) {
                return [entry.key, idx + 1];
            })
        );

        var t1 = trendFor(entries[0], 1, allRankMap);
        var t2 = trendFor(entries[1], 2, allRankMap);
        var t3 = trendFor(entries[2], 3, allRankMap);

        var userKeys = getUserKeys();
        var top1Self = Boolean(entries[0] && userKeys.indexOf(entries[0].key) !== -1);
        var top2Self = Boolean(entries[1] && userKeys.indexOf(entries[1].key) !== -1);
        var top3Self = Boolean(entries[2] && userKeys.indexOf(entries[2].key) !== -1);

        podiumWrap.innerHTML = '<div class="lb-podium">'
            + podiumCard(entries[1], 2, t2, top2Self)
            + podiumCard(entries[0], 1, t1, top1Self)
            + podiumCard(entries[2], 3, t3, top3Self)
            + '</div>';

        var rest = entries.slice(3);
        var userPlacement = findUserPlacement(entries);

        tableRows.innerHTML = rest.length
            ? rest.map(function (entry, idx) {
                var rank = idx + 4;
                var trend = trendFor(entry, rank, allRankMap);
                var isSelf = Boolean(userPlacement && userPlacement.entry && userPlacement.entry.key === entry.key);
                return tableRow(entry, rank, trend, isSelf);
            }).join('')
            : '<div class="lb-empty-rows">No additional contributors yet.</div>';

        setInsights(entries);
        setSpotlight(entries);
        setSummary(entries);

        document.querySelectorAll('.lb-card-score[data-value]').forEach(function (el) {
            var value = parseInt(el.dataset.value, 10);
            if (!isNaN(value)) countUp(el, value);
        });
    }

    function render(isSwitch) {
        if (!isSwitch || prefersReducedMotion) {
            doRender();
            return;
        }

        podiumWrap.classList.add('lb-exit');
        if (tableWrap) tableWrap.classList.add('lb-exit');

        setTimeout(function () {
            doRender();
            podiumWrap.classList.remove('lb-exit');
            if (tableWrap) tableWrap.classList.remove('lb-exit');
        }, 180);
    }

    function syncRangeButtons() {
        rangeButtons.forEach(function (button) {
            var isActive = button.dataset.range === state.range;
            button.classList.toggle('active', isActive);
            button.setAttribute('role', 'tab');
            button.setAttribute('aria-selected', isActive ? 'true' : 'false');
            button.setAttribute('tabindex', isActive ? '0' : '-1');
        });
    }

    function setRange(range) {
        if (RANGE_ORDER.indexOf(range) === -1) return;
        if (range === state.range) return;
        state.range = range;
        syncRangeButtons();
        render(true);
    }

    function moveRange(direction) {
        var currentIndex = RANGE_ORDER.indexOf(state.range);
        if (currentIndex === -1) currentIndex = 0;

        var nextIndex = currentIndex + direction;
        if (nextIndex < 0) nextIndex = RANGE_ORDER.length - 1;
        if (nextIndex >= RANGE_ORDER.length) nextIndex = 0;

        var nextRange = RANGE_ORDER[nextIndex];
        setRange(nextRange);

        var targetButton = rangeButtons.find(function (button) {
            return button.dataset.range === nextRange;
        });
        if (targetButton) targetButton.focus();
    }

    function setupRangeButtons() {
        syncRangeButtons();

        rangeButtons.forEach(function (button) {
            button.addEventListener('click', function () {
                setRange(button.dataset.range);
            });

            button.addEventListener('keydown', function (event) {
                if (event.key === 'ArrowRight') {
                    event.preventDefault();
                    moveRange(1);
                    return;
                }

                if (event.key === 'ArrowLeft') {
                    event.preventDefault();
                    moveRange(-1);
                    return;
                }

                if (event.key === 'Home') {
                    event.preventDefault();
                    setRange(RANGE_ORDER[0]);
                    rangeButtons[0].focus();
                    return;
                }

                if (event.key === 'End') {
                    event.preventDefault();
                    var lastIndex = RANGE_ORDER.length - 1;
                    setRange(RANGE_ORDER[lastIndex]);
                    rangeButtons[lastIndex].focus();
                }
            });
        });
    }

    function buildRanges() {
        state.byRange.month = compute(state.items, 'month');
        state.byRange.all = compute(state.items, 'all');
    }

    async function load() {
        if (typeof BackTrackDB === 'undefined' || !BackTrackDB.isSupabaseConfigured()) {
            state.usingFallback = true;
            render();
            return;
        }

        try {
            if (BackTrackDB.supabase && BackTrackDB.supabase.auth) {
                var authRes = await BackTrackDB.supabase.auth.getUser();
                state.currentUser = authRes && authRes.data ? authRes.data.user : null;
            }

            var items = await Promise.race([
                BackTrackDB.getItems(),
                new Promise(function (_, reject) {
                    setTimeout(function () {
                        reject(new Error('Timeout'));
                    }, 5000);
                })
            ]);

            if (!Array.isArray(items)) throw new Error('Invalid items payload');

            state.items = items;
            state.usingFallback = false;
            buildRanges();
        } catch (error) {
            state.usingFallback = true;
        }

        render();
    }

    function triggerConfetti() {
        if (prefersReducedMotion) return;
        if (typeof confetti !== 'function') return;

        var duration = 2200;
        var animationEnd = Date.now() + duration;
        var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

        function randomInRange(min, max) {
            return Math.random() * (max - min) + min;
        }

        var interval = setInterval(function () {
            var timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) {
                clearInterval(interval);
                return;
            }

            var particleCount = 42 * (timeLeft / duration);
            confetti(Object.assign({}, defaults, {
                particleCount: particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
            }));
            confetti(Object.assign({}, defaults, {
                particleCount: particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
            }));
        }, 250);
    }

    function initScrollAnimations() {
        if (!sectionEl) return;

        if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
            sectionEl.classList.add('animated');
            return;
        }

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    sectionEl.classList.add('animated');
                    setTimeout(triggerConfetti, 380);
                    observer.unobserve(sectionEl);
                }
            });
        }, { threshold: 0.25 });

        observer.observe(sectionEl);
    }

    setupRangeButtons();
    initScrollAnimations();
    load();
})();
