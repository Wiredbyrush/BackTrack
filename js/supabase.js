// Avoid re-defining Supabase client if the script is loaded twice.
if (!window.BackTrackDB) {
    const ADMIN_OVERRIDE_EMAILS = new Set([
        'rushwanthmahendran1@gmail.com',
        'anithsascy09@gmail.com'
    ]);

    // Supabase Configuration
    const SUPABASE_URL = 'https://imdumigrlvujbyvczbpm.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltZHVtaWdybHZ1amJ5dmN6YnBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NjcwMTQsImV4cCI6MjA4NDQ0MzAxNH0.cm68e3sGIolEqIl-H4vlJGhE7YISe1vKqAoQncKWYsE';

    // Initialize Supabase client
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const supabaseConfig = {
        url: SUPABASE_URL,
        anonKey: SUPABASE_ANON_KEY
    };

    function isSupabaseConfigured() {
        return !supabase.supabaseUrl.includes('YOUR_SUPABASE');
    }

    // ============================================
    // ITEMS FUNCTIONS
    // ============================================

    // Get all items (with optional filters)
    async function getItems(filters = {}) {
        let query = supabase
            .from('items')
            .select('*')
            .order('created_at', { ascending: false });

        // Apply status filter (default hides pending items)
        if (filters.status) {
            if (Array.isArray(filters.status)) {
                query = query.in('status', filters.status);
            } else {
                query = query.eq('status', filters.status);
            }
        } else {
            query = query.in('status', ['found', 'claimed']);
        }

        // Apply category filter
        if (filters.category && filters.category.length > 0) {
            const categoryValues = Array.from(new Set(
                filters.category
                    .map((value) => String(value || '').trim())
                    .filter(Boolean)
                    .flatMap((value) => {
                        const lower = value.toLowerCase();
                        return [value, lower, lower.toUpperCase(), lower.charAt(0).toUpperCase() + lower.slice(1)];
                    })
            ));
            if (categoryValues.length > 0) {
                query = query.in('category', categoryValues);
            }
        }

        // Apply location filter
        if (filters.location && filters.location !== 'All Locations') {
            if (Array.isArray(filters.location)) {
                // If it's an array, query matching any of the locations
                query = query.in('location', filters.location);
            } else {
                query = query.eq('location', filters.location);
            }
        }

        // Apply date range filter
        if (filters.startDate) {
            query = query.gte('date_lost', filters.startDate);
        }
        if (filters.endDate) {
            query = query.lte('date_lost', filters.endDate);
        }

        // Apply search filter
        if (filters.search && String(filters.search).trim().length > 0) {
            const safeSearch = String(filters.search)
                .trim()
                .replace(/[%_,'"]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            if (safeSearch) {
                query = query.or(
                    `name.ilike.%${safeSearch}%,description.ilike.%${safeSearch}%,location.ilike.%${safeSearch}%,category.ilike.%${safeSearch}%`
                );
            }
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching items:', error);
            return [];
        }

        return data;
    }

    // Get single item by ID
    async function getItemById(id) {
        const { data, error } = await supabase
            .from('items')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching item:', error);
            return null;
        }

        return data;
    }

    // Add new item
    async function addItem(item) {
        const payload = { ...item };
        const user = await getCurrentUser();

        if (user && user.id && !payload.submitted_by) {
            payload.submitted_by = user.id;
        }

        // Preserve explicit form values, but backfill from auth when missing.
        if (user && user.email && !payload.contact_email) {
            payload.contact_email = user.email;
        }

        if (user && !payload.finder_name) {
            const fullName = user.user_metadata?.full_name
                || [user.user_metadata?.first_name, user.user_metadata?.last_name].filter(Boolean).join(' ')
                || '';
            if (fullName) payload.finder_name = fullName;
        }

        const isUserAdmin = await isAdmin();
        if (!isUserAdmin) {
            payload.status = 'pending';
        }

        const { data, error } = await supabase
            .from('items')
            .insert([payload])
            .select();

        if (error) {
            const details = [
                error.message,
                error.details,
                error.hint,
                error.code
            ].filter(Boolean).join(' | ');
            console.error('Error adding item:', error);
            throw new Error(details || 'Failed to add item');
        }

        return data?.[0] || null;
    }

    // Update item
    async function updateItem(id, updates) {
        const { data, error } = await supabase
            .from('items')
            .update(updates)
            .eq('id', id)
            .select();

        if (error) {
            console.error('Error updating item:', error);
            return null;
        }

        return data[0];
    }

    async function setItemStatus(id, status) {
        return updateItem(id, { status });
    }

    // Delete item
    async function deleteItem(id) {
        const admin = await isAdmin();
        if (!admin) {
            console.warn('Blocked deleteItem: non-admin attempted to delete an item.');
            return false;
        }

        const { error } = await supabase
            .from('items')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting item:', error);
            return false;
        }

        return true;
    }

    // ============================================
    // CLAIMS + ADMIN FUNCTIONS
    // ============================================

    async function addClaim(claim) {
        const payload = { ...claim };
        const user = await getCurrentUser();

        if (user && user.id && !payload.claimer_id) {
            payload.claimer_id = user.id;
        }

        if (user && user.email && !payload.claimer_email) {
            payload.claimer_email = user.email;
        }

        if (user && !payload.claimer_name) {
            const fullName = user.user_metadata?.full_name
                || [user.user_metadata?.first_name, user.user_metadata?.last_name].filter(Boolean).join(' ')
                || '';
            if (fullName) payload.claimer_name = fullName;
        }

        const { data, error } = await supabase
            .from('claims')
            .insert([payload])
            .select();

        if (error) {
            console.error('Error adding claim:', error);
            return null;
        }

        return data?.[0] || null;
    }

    async function getClaims(filters = {}) {
        let query = supabase
            .from('claims')
            .select('*, items (id, name, location, category, image_url, status)')
            .order('created_at', { ascending: false });

        if (filters.status) {
            if (Array.isArray(filters.status)) {
                query = query.in('status', filters.status);
            } else {
                query = query.eq('status', filters.status);
            }
        }

        if (filters.itemId) {
            query = query.eq('item_id', filters.itemId);
        }

        const { data, error } = await query;
        if (error) {
            console.error('Error fetching claims:', error);
            return [];
        }

        return data || [];
    }

    async function getPendingItems() {
        const { data, error } = await supabase
            .from('items')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching pending items:', error);
            return [];
        }

        return data || [];
    }

    async function getPendingClaims() {
        const { data, error } = await supabase
            .from('claims')
            .select('*, items (id, name, location, category, image_url, status)')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching pending claims:', error);
            return [];
        }

        return data || [];
    }

    async function updateClaimStatus(id, status) {
        const { data, error } = await supabase
            .from('claims')
            .update({ status })
            .eq('id', id)
            .select();

        if (error) {
            console.error('Error updating claim:', error);
            return null;
        }

        return data?.[0] || null;
    }

    async function isAdmin() {
        const user = await getCurrentUser();
        if (!user) return false;
        const normalizedEmail = String(user.email || '').toLowerCase();

        // Explicit override list for bootstrap admin access.
        if (ADMIN_OVERRIDE_EMAILS.has(normalizedEmail)) return true;

        const { data, error } = await supabase
            .from('admins')
            .select('id')
            .or(`user_id.eq.${user.id},email.eq.${normalizedEmail}`)
            .limit(1);

        if (error) {
            console.error('Error checking admin:', error);
            return false;
        }

        return Array.isArray(data) && data.length > 0;
    }

    async function getAdmins() {
        const { data, error } = await supabase
            .from('admins')
            .select('id, user_id, email, created_at')
            .order('created_at', { ascending: false });

        if (error) {
            // If policy blocks this for non-admin users, caller can still degrade gracefully.
            console.warn('Error fetching admins:', error.message);
            return [];
        }

        return data || [];
    }

    async function getAdminMessages(limit = 50) {
        const { data, error } = await supabase
            .from('admin_messages')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            // Table might not exist yet in older environments.
            console.warn('Admin messages unavailable:', error.message);
            return [];
        }

        return data || [];
    }

    async function addAdminMessage(message) {
        const { data, error } = await supabase
            .from('admin_messages')
            .insert([message])
            .select()
            .single();

        if (error) {
            console.error('Error adding admin message:', error);
            return null;
        }

        return data || null;
    }

    async function getRewardCatalog(filters = {}) {
        let query = supabase
            .from('reward_catalog')
            .select('*')
            .order('points_cost', { ascending: true })
            .order('created_at', { ascending: false });

        if (filters.activeOnly) {
            query = query.eq('is_active', true);
        }

        if (filters.category) {
            query = query.eq('category', filters.category);
        }

        const { data, error } = await query;
        if (error) {
            // Older environments may not have reward_catalog yet.
            console.warn('Reward catalog unavailable:', error.message);
            return [];
        }

        return data || [];
    }

    async function addRewardCatalogItem(reward) {
        const payload = {
            ...reward,
            name: String(reward?.name || '').trim(),
            description: String(reward?.description || '').trim(),
            category: String(reward?.category || 'other').toLowerCase(),
            points_cost: Number(reward?.points_cost || 0),
            stock: reward?.stock === null || reward?.stock === undefined || reward?.stock === ''
                ? null
                : Number(reward.stock),
            is_active: reward?.is_active !== false
        };

        const { data, error } = await supabase
            .from('reward_catalog')
            .insert([payload])
            .select()
            .single();

        if (error) {
            console.error('Error adding reward catalog item:', error);
            return null;
        }

        return data || null;
    }

    async function updateRewardCatalogItem(id, updates) {
        const payload = { ...updates };

        if (Object.prototype.hasOwnProperty.call(payload, 'name')) {
            payload.name = String(payload.name || '').trim();
        }
        if (Object.prototype.hasOwnProperty.call(payload, 'description')) {
            payload.description = String(payload.description || '').trim();
        }
        if (Object.prototype.hasOwnProperty.call(payload, 'category')) {
            payload.category = String(payload.category || 'other').toLowerCase();
        }
        if (Object.prototype.hasOwnProperty.call(payload, 'points_cost')) {
            payload.points_cost = Number(payload.points_cost || 0);
        }
        if (Object.prototype.hasOwnProperty.call(payload, 'stock')) {
            payload.stock = payload.stock === null || payload.stock === undefined || payload.stock === ''
                ? null
                : Number(payload.stock);
        }

        const { data, error } = await supabase
            .from('reward_catalog')
            .update(payload)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating reward catalog item:', error);
            return null;
        }

        return data || null;
    }

    async function deleteRewardCatalogItem(id) {
        const { error } = await supabase
            .from('reward_catalog')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting reward catalog item:', error);
            return false;
        }

        return true;
    }

    async function getRedemptions(options = {}) {
        let query = supabase
            .from('redemptions')
            .select('*')
            .order('created_at', { ascending: false });

        if (options.userId) {
            query = query.eq('user_id', options.userId);
        }

        if (options.status) {
            if (Array.isArray(options.status)) {
                query = query.in('status', options.status);
            } else {
                query = query.eq('status', options.status);
            }
        }

        if (options.limit) {
            query = query.limit(Number(options.limit));
        }

        const { data, error } = await query;
        if (error) {
            console.warn('Redemptions unavailable:', error.message);
            return [];
        }

        return data || [];
    }

    async function updateRedemptionStatus(id, status) {
        const { data, error } = await supabase
            .from('redemptions')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating redemption status:', error);
            return null;
        }

        return data || null;
    }

    // ============================================
    // IMAGE UPLOAD FUNCTIONS
    // ============================================

    // Upload image to Supabase Storage
    async function uploadImage(file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `items/${fileName}`;

        const { data, error } = await supabase.storage
            .from('images')
            .upload(filePath, file);

        if (error) {
            console.error('Error uploading image:', error);
            return null;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('images')
            .getPublicUrl(filePath);

        return urlData.publicUrl;
    }

    // ============================================
    // AUTHENTICATION FUNCTIONS
    // ============================================

    // Sign up with email
    async function signUp(email, password) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            console.error('Error signing up:', error);
            return { error: error.message };
        }

        return { user: data.user };
    }

    // Sign in with email
    async function signIn(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            console.error('Error signing in:', error);
            return { error: error.message };
        }

        return { user: data.user };
    }

    function normalizeHttpOrigin(value) {
        const raw = String(value || '').trim().replace(/\/+$/, '');
        return /^https?:\/\//i.test(raw) ? raw : '';
    }

    function getAuthRedirectOrigin() {
        let storedOrigin = '';
        try {
            storedOrigin = window.localStorage?.getItem('backtrack_auth_redirect_origin') || '';
        } catch (e) {
            storedOrigin = '';
        }

        const explicitOrigin = normalizeHttpOrigin(
            window.BACKTRACK_AUTH_REDIRECT_ORIGIN
            || storedOrigin
        );
        if (explicitOrigin) return explicitOrigin;

        const currentOrigin = normalizeHttpOrigin(window.location?.origin);
        if (currentOrigin) return currentOrigin;

        // Fallback for file:// launches to avoid defaulting to Supabase Site URL.
        return 'http://127.0.0.1:5501';
    }

    function getAuthRedirectUrl(page = 'login.html') {
        const origin = getAuthRedirectOrigin();
        if (!origin) return null;

        const safePage = String(page || 'login.html').replace(/^\/+/, '');
        const pathname = window.location?.pathname || '/';
        const isGithubProjectPath = window.location?.hostname === 'wiredbyrush.github.io'
            || pathname.startsWith('/backtrack-fbla/');
        const basePath = isGithubProjectPath ? '/backtrack-fbla/' : '/';

        return `${origin}${basePath}${safePage}`;
    }

    // Sign in with Google OAuth
    async function signInWithGoogle(redirectPage = 'login.html') {
        const options = {};
        const redirectUrl = getAuthRedirectUrl(redirectPage);
        if (redirectUrl) {
            options.redirectTo = redirectUrl;
        } else {
            return { error: 'Could not determine a local OAuth redirect URL.' };
        }

        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options
        });

        if (error) {
            console.error('Error signing in with Google:', error);
            return { error: error.message };
        }

        return { data };
    }

    // Sign out
    async function signOut() {
        const { error } = await supabase.auth.signOut();

        if (error) {
            console.error('Error signing out:', error);
            return false;
        }

        return true;
    }

    // Get current user
    async function getCurrentUser() {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    }

    // Listen for auth changes
    function onAuthStateChange(callback) {
        supabase.auth.onAuthStateChange((event, session) => {
            callback(event, session?.user || null);
        });
    }

    async function getSession() {
        const { data } = await supabase.auth.getSession();
        return data.session;
    }

    // ============================================
    // MAP + CHATBOT HOOKS (SUPABASE)
    // ============================================

    async function getMapItems(filters = {}) {
        return getItems(filters);
    }

    async function getMapRooms(school = 'Denmark High School') {
        const { data, error } = await supabase
            .from('map_rooms')
            .select('school, floor, room_id, name, room_type, x, y, w, h, clickable, sort_order')
            .eq('school', school)
            .order('floor', { ascending: true })
            .order('sort_order', { ascending: true })
            .order('room_id', { ascending: true });

        if (error) {
            // Table may not exist in older projects; map page falls back to local defaults.
            console.warn('Map rooms unavailable:', error.message);
            return [];
        }

        return data || [];
    }

    async function getMapLocationAliases(school = 'Denmark High School') {
        const { data, error } = await supabase
            .from('map_location_aliases')
            .select('school, alias, room_id')
            .eq('school', school)
            .order('alias', { ascending: true });

        if (error) {
            console.warn('Map aliases unavailable:', error.message);
            return [];
        }

        return data || [];
    }

    async function sendChatMessage(message) {
        const { data, error } = await supabase.functions.invoke('chatbot', {
            body: { message }
        });

        if (error) {
            console.error('Error invoking chatbot function:', error);
            return { error: error.message };
        }

        return data;
    }

    // ============================================
    // SEMANTIC SEARCH (EMBEDDINGS)
    // ============================================

    async function searchItems(query, filters = {}) {
        const { data, error } = await supabase.functions.invoke('search-items', {
            body: {
                query,
                filters
            }
        });

        if (error) {
            console.error('Error searching items:', error);
            return [];
        }

        return data?.items || [];
    }

    // ============================================
    // EXPORT FOR USE IN OTHER FILES
    // ============================================

    window.BackTrackDB = {
        // Items
        getItems,
        getItemById,
        addItem,
        updateItem,
        setItemStatus,
        deleteItem,

        // Images
        uploadImage,

        // Claims + admin
        addClaim,
        getClaims,
        getPendingItems,
        getPendingClaims,
        updateClaimStatus,
        isAdmin,
        getAdmins,
        getAdminMessages,
        addAdminMessage,
        getRewardCatalog,
        addRewardCatalogItem,
        updateRewardCatalogItem,
        deleteRewardCatalogItem,
        getRedemptions,
        updateRedemptionStatus,

        // Auth
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        getCurrentUser,
        onAuthStateChange,
        getSession,

        // Map + chatbot
        getMapItems,
        getMapRooms,
        getMapLocationAliases,
        sendChatMessage,
        searchItems,

        isSupabaseConfigured,

        // Direct Supabase access if needed
        supabase,

        // Config for non-Supabase JS usage
        config: supabaseConfig
    };
}
