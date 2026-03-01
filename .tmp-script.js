
        // DOM Elements
        const itemsGrid = document.querySelector('.items-grid');
        const initialItemsMarkup = itemsGrid.innerHTML;

        itemsGrid.addEventListener('click', (event) => {
            const target = event.target;
            if (target.closest('.debug-toggle')) return;
            const saveBtn = target.closest('.save-btn');
            if (saveBtn) {
                event.stopPropagation();
                const card = saveBtn.closest('.item-card');
                const id = card ? card.dataset.id : null;
                if (id) {
                    const saved = toggleSavedItem(id);
                    card.dataset.saved = saved;
                    saveBtn.textContent = saved ? 'Saved' : 'Save';
                    saveBtn.setAttribute('aria-pressed', saved ? 'true' : 'false');
                }
                return;
            }
            const card = target.closest('.item-card');
            if (!card) return;
            const id = card.dataset.id;
            if (id) {
                window.location.href = `claim.html?item=${id}`;
            }
        });
        const searchInput = document.querySelector('.search-bar input');
        const statusBtns = document.querySelectorAll('.status-btn');
        const datePickerBtn = document.getElementById('datePickerBtn');
        const dateRangePanel = document.getElementById('dateRangePanel');
        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');
        const resultsCount = document.getElementById('resultsCount');
        const activeFilters = document.getElementById('activeFilters');
        const clearFiltersBtn = document.getElementById('clearFiltersBtn');
        const categoryCheckboxes = document.querySelectorAll('.checkbox-item input[type="checkbox"]');
        const savedToggle = document.getElementById('savedToggle');
        const locationBtn = document.querySelector('.location-btn');
        const locationMenu = document.querySelector('.location-menu');
        const locationItems = document.querySelectorAll('.location-item');
        const pageBody = document.body;
        let lastImageQuery = '';
        let lastImageKeywords = [];
        let currentUserIsAdmin = false;

        function updateNavBorder() {
            pageBody.classList.toggle('nav-scrolled', window.scrollY > 4);
        }

        let itemToDeleteId = null;

        function deleteItemCard(id) {
            itemToDeleteId = id;
            document.getElementById('adminDeleteModal').classList.add('active');
        }

        function closeAdminDeleteModal() {
            itemToDeleteId = null;
            document.getElementById('adminDeleteModal').classList.remove('active');
        }

        document.getElementById('adminConfirmDeleteBtn').addEventListener('click', async () => {
            if (!itemToDeleteId) return;
            const btn = document.getElementById('adminConfirmDeleteBtn');
            const originalText = btn.textContent;
            btn.textContent = 'Deleting...';
            btn.disabled = true;

            try {
                const { error } = await window.BackTrackDB.deleteItem(itemToDeleteId);
                if (error) throw error;

                // Remove from DOM immediately
                const card = document.querySelector(`.item-card[data-id="${itemToDeleteId}"]`);
                if (card) {
                    card.style.transition = 'all 0.3s ease';
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.9)';
                    setTimeout(() => {
                        card.remove();
                        // Update counts
                        const itemsLeft = itemsGrid.querySelectorAll('.item-card').length;
                        updateResultsCount(itemsLeft);
                    }, 300);
                }
                closeAdminDeleteModal();
            } catch (err) {
                console.error('Error deleting item:', err);
                alert('Failed to delete item. You may not have permission.');
            } finally {
                btn.textContent = originalText;
                btn.disabled = false;
            }
        });

        // Current filters state
        let currentFilters = {
            category: [],
            location: 'All Locations',
            search: '',
            startDate: '',
            endDate: '',
            savedOnly: false,
            status: ['found', 'claimed']
        };

        const allCategories = Array.from(categoryCheckboxes).map((checkbox) => {
            return checkbox.parentElement.querySelector('.checkbox-label').textContent;
        });

        let activeMatchContext = null;

        const demoItems = Array.from(itemsGrid.querySelectorAll('.item-card')).map((card, index) => {
            const image = card.querySelector('img');
            const name = card.querySelector('.item-name');
            const date = card.querySelector('.item-date');
            const location = card.querySelector('.item-location');
            const badge = card.querySelector('.ai-match-badge');
            return {
                id: `demo-${index}`,
                name: name ? name.textContent.trim() : 'Item',
                date_lost: date ? date.textContent.trim() : new Date().toISOString(),
                location: location ? location.textContent.trim() : 'Location',
                image_url: image ? image.getAttribute('src') : null,
                similarity: badge ? 0.9 : null
            };
        });

        function isSupabaseConfigured() {
            return window.BackTrackDB && window.BackTrackDB.config &&
                !window.BackTrackDB.config.url.includes('YOUR_SUPABASE');
        }

        // Format date for display
        function formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }

        function getSavedItems() {
            try {
                return new Set(JSON.parse(localStorage.getItem('savedItems') || '[]'));
            } catch (err) {
                return new Set();
            }
        }

        function setSavedItems(ids) {
            localStorage.setItem('savedItems', JSON.stringify(Array.from(ids)));
        }

        function isSavedItem(id) {
            return getSavedItems().has(id);
        }

        function toggleSavedItem(id) {
            const saved = getSavedItems();
            if (saved.has(id)) {
                saved.delete(id);
            } else {
                saved.add(id);
            }
            setSavedItems(saved);
            return saved.has(id);
        }

        function buildImageCandidates(imageUrl) {
            if (!imageUrl) return [];

            const trimmed = imageUrl.trim();
            if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
                return [trimmed.replace(/\s+/g, '')];
            }

            if (trimmed.startsWith('http')) {
                const candidates = [trimmed];
                const fixedBucket = trimmed.replace(/\/storage\/v1\/object\/public\/[^/]+\//, '/storage/v1/object/public/images/');
                if (fixedBucket !== trimmed) {
                    candidates.push(fixedBucket);
                }
                return candidates;
            }

            const cleanPath = trimmed.replace(/^\/+/, '');
            const baseUrl = window.BackTrackDB?.config?.url || 'https://mzzcwukenxzuelgpuiap.supabase.co';
            const paths = [];
            if (!cleanPath.startsWith('items/')) {
                paths.push(`items/${cleanPath}`);
            }
            paths.push(cleanPath);
            return paths.map((path) => `${baseUrl}/storage/v1/object/public/images/${encodeURI(path)}`);
        }

        function computeMatchScore(item, keywords) {
            if (!keywords || keywords.length === 0) return null;
            const haystack = [
                item.name,
                item.description,
                item.category,
                item.location
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            const uniqueKeywords = Array.from(new Set(keywords.map((keyword) => keyword.toLowerCase())));
            const hits = uniqueKeywords.filter((keyword) => haystack.includes(keyword));
            const rawScore = Math.round((hits.length / uniqueKeywords.length) * 100);
            return Math.max(rawScore, hits.length > 0 ? 35 : 0);
        }

        // Create item card HTML
        function createItemCard(item, matchPercent = null) {
            const placeholderImage = 'logo.png';
            const rawImage = item.image_url || '';
            const immediateCandidates = buildImageCandidates(rawImage);
            const initialSrc = immediateCandidates.length &&
                (rawImage.startsWith('data:') || rawImage.startsWith('blob:') || rawImage.startsWith('http'))
                ? immediateCandidates[0]
                : placeholderImage;
            const dataPath = (rawImage.startsWith('data:') || rawImage.startsWith('blob:') || rawImage.startsWith('http'))
                ? ''
                : rawImage;
            const similarityScore = typeof item.similarity === 'number'
                ? Math.min(99, Math.max(70, Math.round(item.similarity * 100)))
                : null;
            const resolvedMatch = matchPercent !== null ? matchPercent : similarityScore;
            const badge = resolvedMatch !== null
                ? `<span class="ai-match-badge">${resolvedMatch}% AI MATCH</span>`
                : '';
            const saved = isSavedItem(item.id);
            // Delete button is always in DOM, purely shown/hidden by body.admin-mode CSS
            const deleteBtn = `
                   <button type="button" class="admin-delete-btn" onclick="event.preventDefault(); event.stopPropagation(); deleteItemCard('${item.id}'); return false;" aria-label="Delete Item" title="Delete Item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                    </svg>
                   </button>`;

            return `
                <div class="item-card" data-id="${item.id}" data-saved="${saved}">
                    <div class="item-image">
                        <img class="item-image-img" src="${initialSrc}" data-image-path="${dataPath}" data-image-raw="${rawImage}" alt="${item.name}">
                        ${badge}
                        <button class="save-btn" type="button" aria-pressed="${saved}" aria-label="Save item">
                            ${saved ? 'Saved' : 'Save'}
                        </button>
                    </div>
                    <div class="item-info">
                        <h3 class="item-name">${item.name}</h3>
                        <p class="item-date">${formatDate(item.date_lost)}</p>
                        <p class="item-location">${item.location}</p>
                        <div style="display: flex; gap: 8px; align-items: center; margin-top: 12px;">
                            <button type="button" class="claim-card-btn" style="flex: 1;" onclick="event.stopPropagation(); window.location.href='claim.html?item=${item.id}'">Claim Item</button>
                            ${deleteBtn}
                        </div>
                    </div>
                </div>
            `;
        }

        // Render items to grid
        function hydrateItemImages() {
            const placeholder = 'logo.png';
            const images = itemsGrid.querySelectorAll('.item-image-img');
            images.forEach((img) => {
                const path = img.getAttribute('data-image-path');
                if (!path) {
                    return;
                }
                const candidates = buildImageCandidates(path);
                let index = 0;
                const tryNext = () => {
                    if (index >= candidates.length) {
                        img.src = placeholder;
                        img.onerror = null;
                        return;
                    }
                    img.src = candidates[index];
                    index += 1;
                };
                img.onerror = () => tryNext();
                tryNext();
            });

            const toggles = itemsGrid.querySelectorAll('.debug-toggle');
            toggles.forEach((toggle) => {
                toggle.addEventListener('click', () => {
                    const value = toggle.getAttribute('data-image-path') || '(empty)';
                    const container = toggle.parentElement;
                    const label = container.querySelector('.debug-value');
                    if (!label) return;
                    const isHidden = label.hasAttribute('hidden');
                    if (isHidden) {
                        label.textContent = value;
                        label.removeAttribute('hidden');
                        toggle.textContent = 'Hide image URL';
                    } else {
                        label.textContent = '';
                        label.setAttribute('hidden', '');
                        toggle.textContent = 'Show image URL';
                    }
                });
            });
        }

        function renderItems(items, showDemoFallback = false) {
            let visibleItems = items;
            if (currentFilters.savedOnly) {
                const saved = getSavedItems();
                visibleItems = items.filter(item => saved.has(item.id));
            }

            if (visibleItems.length === 0) {
                if (showDemoFallback && initialItemsMarkup.trim().length > 0) {
                    itemsGrid.innerHTML = initialItemsMarkup;
                    updateResultsCount(demoItems.length, true);
                    return;
                }

                itemsGrid.innerHTML = '<p style="color: #888; grid-column: 1/-1; text-align: center; padding: 40px;">No items found. Be the first to <a href="submit.html" style="color: #fff; text-decoration: underline;">submit an item</a>!</p>';
                updateResultsCount(0);
                return;
            }
            if (activeMatchContext && Array.isArray(activeMatchContext.keywords)) {
                const scored = visibleItems.map((item) => {
                    const score = computeMatchScore(item, activeMatchContext.keywords);
                    return { item, score: score ?? 0 };
                });
                scored.sort((a, b) => b.score - a.score);
                itemsGrid.innerHTML = scored
                    .map(({ item, score }) => createItemCard(item, score))
                    .join('');
                hydrateItemImages();
                updateResultsCount(scored.length, showDemoFallback);
                return;
            }

            itemsGrid.innerHTML = visibleItems.map((item) => createItemCard(item)).join('');
            hydrateItemImages();
            updateResultsCount(visibleItems.length, showDemoFallback);
        }

        function updateResultsCount(count, isDemo = false) {
            if (!resultsCount) return;
            const label = isDemo ? 'Showing demo items' : 'Showing items';
            resultsCount.textContent = `${label}: ${count}`;
        }

        function updateActiveFilters() {
            if (!activeFilters || !clearFiltersBtn) return;
            const chips = [];

            if (currentFilters.search && currentFilters.search.trim()) {
                chips.push(`<div class="filter-chip"><span>Query</span>${currentFilters.search.trim()}</div>`);
            }

            if (currentFilters.category.length > 0 && currentFilters.category.length < allCategories.length) {
                chips.push(`<div class="filter-chip"><span>Category</span>${currentFilters.category.join(', ')}</div>`);
            }

            if (currentFilters.location && currentFilters.location !== 'All Locations') {
                chips.push(`<div class="filter-chip"><span>Location</span>${currentFilters.location}</div>`);
            }

            if (currentFilters.startDate || currentFilters.endDate) {
                const startLabel = currentFilters.startDate || 'Any';
                const endLabel = currentFilters.endDate || 'Any';
                chips.push(`<div class="filter-chip"><span>Date</span>${startLabel} → ${endLabel}</div>`);
            }

            if (currentFilters.savedOnly) {
                chips.push('<div class="filter-chip"><span>Saved</span>Only</div>');
            }

            if (lastImageQuery) {
                chips.push(`<div class="filter-chip"><span>AI</span>${lastImageQuery}</div>`);
            } else if (lastImageKeywords.length) {
                chips.push(`<div class="filter-chip"><span>AI</span>${lastImageKeywords.join(', ')}</div>`);
            }

            activeFilters.innerHTML = chips.join('');
            clearFiltersBtn.style.display = chips.length ? 'inline-flex' : 'none';
        }

        function renderLoadingState() {
            const placeholders = Array.from({ length: 8 }, () => (
                `<div class="skeleton-card">
                    <div class="skeleton-image"></div>
                    <div class="skeleton-body">
                        <div class="skeleton-line"></div>
                        <div class="skeleton-line short"></div>
                        <div class="skeleton-line short"></div>
                    </div>
                </div>`
            )).join('');
            itemsGrid.innerHTML = placeholders;
        }

        function renderDemoItems() {
            if (activeMatchContext) {
                renderItems(demoItems);
                return;
            }

            const query = (currentFilters.search || '').trim().toLowerCase();
            if (!query) {
                renderItems(demoItems, true);
                return;
            }
            const filtered = demoItems.filter((item) => item.name.toLowerCase().includes(query));
            renderItems(filtered, true);
        }

        function syncCategoryFiltersFromUI() {
            const selectedCategories = [];
            categoryCheckboxes.forEach(checkbox => {
                if (checkbox.checked) {
                    const label = checkbox.parentElement.querySelector('.checkbox-label').textContent;
                    selectedCategories.push(label);
                }
            });
            currentFilters.category = selectedCategories.length === allCategories.length ? [] : selectedCategories;
            updateActiveFilters();
        }

        // Fetch and display items
        async function loadItems() {
            if (!isSupabaseConfigured() || typeof window.BackTrackDB.getItems !== 'function') {
                renderDemoItems();
                return;
            }

            if (!currentUserIsAdmin) {
                currentUserIsAdmin = await window.BackTrackDB.isAdmin();
            }

            const hasExistingItems = itemsGrid.querySelectorAll('.item-card:not(.skeleton-card)').length > 0;
            if (!hasExistingItems) {
                renderLoadingState();
            }

            const items = await window.BackTrackDB.getItems(currentFilters);
            renderItems(items);
        }

        // Location dropdown toggle
        let locationMenuOpen = false;
        locationBtn.addEventListener('click', () => {
            locationMenuOpen = !locationMenuOpen;
            locationMenu.style.display = locationMenuOpen ? 'block' : 'none';
        });

        // Location selection
        locationItems.forEach(item => {
            item.addEventListener('click', () => {
                activeMatchContext = null;
                currentFilters.location = item.textContent;
                locationBtn.childNodes[0].textContent = item.textContent + ' ';
                locationMenu.style.display = 'none';
                locationMenuOpen = false;
                updateActiveFilters();
                loadItems();
            });
        });

        // Close location menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.location-dropdown')) {
                locationMenu.style.display = 'none';
                locationMenuOpen = false;
            }
        });

        // Category filter
        categoryCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                activeMatchContext = null;
                const label = checkbox.parentElement.querySelector('.checkbox-label').textContent;
                if (checkbox.checked) {
                    currentFilters.category.push(label);
                } else {
                    currentFilters.category = currentFilters.category.filter(c => c !== label);
                }
                updateActiveFilters();
                loadItems();
            });
        });

        if (savedToggle) {
            savedToggle.addEventListener('change', () => {
                currentFilters.savedOnly = savedToggle.checked;
                updateActiveFilters();
                loadItems();
            });
        }

        datePickerBtn.addEventListener('click', () => {
            dateRangePanel.classList.toggle('active');
        });

        function applyDateRange() {
            activeMatchContext = null;
            currentFilters.startDate = startDateInput.value;
            currentFilters.endDate = endDateInput.value;
            updateActiveFilters();
            loadItems();
        }

        startDateInput.addEventListener('change', applyDateRange);
        endDateInput.addEventListener('change', applyDateRange);

        // Search functionality
        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                activeMatchContext = null;
                currentFilters.search = searchInput.value;
                updateActiveFilters();
                if (isSupabaseConfigured()) {
                    loadItems();
                } else {
                    renderDemoItems();
                }
            }, 300);
        });

        function setUploadStatus(text, isError = false) {
            if (!text) {
                uploadStatus.textContent = '';
                uploadStatus.classList.remove('error');
                return;
            }
            uploadStatus.textContent = text;
            uploadStatus.classList.toggle('error', isError);
        }

        // Uses credentials from supabase.js
        const MATCH_SUPABASE_URL = window.BackTrackDB?.config?.url || 'YOUR_SUPABASE_PROJECT_URL';
        const MATCH_SUPABASE_ANON_KEY = window.BackTrackDB?.config?.anonKey || 'YOUR_SUPABASE_ANON_KEY';

        async function requestImageMatch(base64DataUrl) {
            const response = await fetch(`${MATCH_SUPABASE_URL}/functions/v1/image-match`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    apikey: MATCH_SUPABASE_ANON_KEY,
                    Authorization: `Bearer ${MATCH_SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({ imageBase64: base64DataUrl })
            });

            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
                const errorDetail = payload.error || `HTTP ${response.status}`;
                throw new Error(errorDetail);
            }
            return payload;
        }

        statusBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                statusBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const status = btn.getAttribute('data-status');
                if (status === 'lost') {
                    currentFilters.status = ['lost'];
                    searchInput.placeholder = "Search lost bounties...";
                } else {
                    currentFilters.status = ['found', 'claimed'];
                    searchInput.placeholder = "Search smart (earbuds, AirPods, headphones)...";
                }
                updateActiveFilters();
                if (isSupabaseConfigured()) {
                    loadItems();
                } else {
                    renderDemoItems();
                }
            });
        });

        // Add URL parameter checking for status matching
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('status') === 'lost') {
            const lostBtn = document.querySelector('.status-btn[data-status="lost"]');
            if (lostBtn) lostBtn.click();
        }

        clearFiltersBtn.addEventListener('click', () => {
            currentFilters.search = '';
            currentFilters.location = 'All Locations';
            currentFilters.category = [];
            currentFilters.startDate = '';
            currentFilters.endDate = '';
            currentFilters.savedOnly = false;
            lastImageQuery = '';
            lastImageKeywords = [];
            activeMatchContext = null;
            searchInput.value = '';
            locationBtn.childNodes[0].textContent = 'All Locations ';
            startDateInput.value = '';
            endDateInput.value = '';
            categoryCheckboxes.forEach((checkbox) => {
                checkbox.checked = true;
            });
            if (savedToggle) savedToggle.checked = false;
            syncCategoryFiltersFromUI();
            updateActiveFilters();
            loadItems();
        });

        // Initialize - check if Supabase is configured
        document.addEventListener('DOMContentLoaded', async () => {
            // Check for AI scan params
            const scanParams = new URLSearchParams(window.location.search);
            if (scanParams.get('ai_scan') === 'true') {
                try {
                    const keys = JSON.parse(sessionStorage.getItem('ai_scan_keywords') || '[]');
                    const desc = sessionStorage.getItem('ai_scan_query') || '';
                    if (keys.length > 0) {
                        activeMatchContext = { keywords: keys, description: desc };
                        lastImageKeywords = keys;
                        lastImageQuery = desc;
                        // wipe it so refresh doesn't keep triggering
                        sessionStorage.removeItem('ai_scan_keywords');
                        sessionStorage.removeItem('ai_scan_query');
                        // Make sure we show 'found' explicitly to search the whole database
                        currentFilters.status = ['found', 'claimed'];
                        // remove URL param visually while maintaining state
                        window.history.replaceState({}, document.title, window.location.pathname);
                    }
                } catch (e) { }
            }

            // Hide location menu by default
            locationMenu.style.display = 'none';

            updateNavBorder();
            window.addEventListener('scroll', updateNavBorder, { passive: true });

            categoryCheckboxes.forEach((checkbox) => {
                checkbox.checked = true;
            });
            syncCategoryFiltersFromUI();
            activeMatchContext = null;
            updateActiveFilters();

            // Check if Supabase is configured
            if (isSupabaseConfigured()) {
                window.BackTrackDB.onAuthStateChange(async (event, session) => {
                    const wasAdmin = currentUserIsAdmin;
                    if (!currentUserIsAdmin) {
                        currentUserIsAdmin = await window.BackTrackDB.isAdmin();
                    }
                    if (currentUserIsAdmin) {
                        document.body.classList.add('admin-mode');
                    }
                    if (wasAdmin !== currentUserIsAdmin) {
                        // no need to reload items just to show buttons! CSS handles it.
                    }
                });

                if (!currentUserIsAdmin) {
                    currentUserIsAdmin = await window.BackTrackDB.isAdmin();
                    if (currentUserIsAdmin) {
                        document.body.classList.add('admin-mode');
                    }
                }
                loadItems();

                setInterval(() => {
                    // Only auto-refresh if user is not actively typing or hovering a card
                    const isHovering = document.querySelector('.item-card:hover');
                    if (document.activeElement !== searchInput && !isHovering) {
                        loadItems();
                    }
                }, 20000);
            } else {
                console.log('Supabase not configured - showing demo items');
                renderDemoItems();
            }
        });


        // Chatbot
        const chatbotToggle = document.getElementById('chatbotToggle');
        const chatbotPanel = document.getElementById('chatbotPanel');
        const chatbotClose = document.getElementById('chatbotClose');
        const chatbotMessages = document.getElementById('chatbotMessages');
        const chatbotInput = document.getElementById('chatbotInput');
        const chatbotSend = document.getElementById('chatbotSend');
        const chatbotStatus = document.getElementById('chatbotStatus');

        function setChatStatus(text, type) {
            if (!text) { chatbotStatus.textContent = ''; chatbotStatus.className = 'chatbot-status'; return; }
            chatbotStatus.textContent = text;
            chatbotStatus.className = `chatbot-status ${type || ''}`.trim();
        }

        function addChatMessage(text, role) {
            const message = document.createElement('div');
            message.className = `chatbot-message ${role || ''}`.trim();
            message.textContent = text;
            chatbotMessages.appendChild(message);
            chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
        }

        function toggleChat(open) { chatbotPanel.classList.toggle('open', open); }

        chatbotToggle.addEventListener('click', () => toggleChat(true));
        chatbotClose.addEventListener('click', () => toggleChat(false));

        const CHAT_SUPABASE_URL = window.BackTrackDB?.config?.url || 'YOUR_SUPABASE_PROJECT_URL';
        const CHAT_SUPABASE_ANON_KEY = window.BackTrackDB?.config?.anonKey || 'YOUR_SUPABASE_ANON_KEY';

        async function fetchChatbotReply(message) {
            if (!CHAT_SUPABASE_URL || !CHAT_SUPABASE_ANON_KEY || CHAT_SUPABASE_URL.includes('YOUR_SUPABASE')) {
                throw new Error('Supabase is not configured.');
            }
            const response = await fetch(`${CHAT_SUPABASE_URL}/functions/v1/chatbot`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', apikey: CHAT_SUPABASE_ANON_KEY, Authorization: `Bearer ${CHAT_SUPABASE_ANON_KEY}` },
                body: JSON.stringify({ message })
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
            return payload.reply || '';
        }

        async function sendChat() {
            const text = chatbotInput.value.trim();
            if (!text) return;
            chatbotInput.value = '';
            addChatMessage(text, 'user');
            setChatStatus('');
            addChatMessage('Thinking...');
            const thinkingMessage = chatbotMessages.lastElementChild;
            try {
                const reply = await fetchChatbotReply(text);
                thinkingMessage.textContent = reply || 'No response received.';
            } catch (error) {
                setChatStatus('Chatbot error: ' + String(error), 'error');
                thinkingMessage.textContent = 'Sorry, something went wrong. Please try again.';
            }
        }

        chatbotSend.addEventListener('click', sendChat);
        chatbotInput.addEventListener('keydown', (event) => { if (event.key === 'Enter') sendChat(); });

        // Page transitions
        const pageTransition = document.getElementById('pageTransition');
        const transitionLinks = document.querySelectorAll('a[href$=".html"]');

        transitionLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href === window.location.pathname.split('/').pop() || href.startsWith('http')) return;

                e.preventDefault();
                pageTransition.classList.add('active');

                setTimeout(() => {
                    window.location.href = href;
                }, 400);
            });
        });
    