// Avoid re-defining Supabase client if the script is loaded twice.
if (!window.BackTrackDB) {
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
    if (filters.search && filters.search.trim().length > 0) {
        if (!filters.status) {
            filters.status = ['found', 'claimed'];
        }
        return searchItems(filters.search, filters);
    }

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
        query = query.in('category', filters.category);
    }

    // Apply location filter
    if (filters.location && filters.location !== 'All Locations') {
        query = query.eq('location', filters.location);
    }

    // Apply date range filter
    if (filters.startDate) {
        query = query.gte('date_lost', filters.startDate);
    }
    if (filters.endDate) {
        query = query.lte('date_lost', filters.endDate);
    }

    // Apply search filter
    if (filters.search) {
        query = query.ilike('name', `%${filters.search}%`);
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
    const { data, error } = await supabase
        .from('items')
        .insert([item])
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
    const { data, error } = await supabase
        .from('claims')
        .insert([claim])
        .select();

    if (error) {
        console.error('Error adding claim:', error);
        return null;
    }

    return data?.[0] || null;
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

    const { data, error } = await supabase
        .from('admins')
        .select('id')
        .or(`user_id.eq.${user.id},email.eq.${user.email}`)
        .limit(1);

    if (error) {
        console.error('Error checking admin:', error);
        return false;
    }

    return Array.isArray(data) && data.length > 0;
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

// Sign in with Google OAuth
async function signInWithGoogle() {
    const options = {};
    if (window.location && window.location.origin && window.location.origin !== 'null') {
        const path = window.location.pathname || '/';
        options.redirectTo = `${window.location.origin}${path}`;
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
    getPendingItems,
    getPendingClaims,
    updateClaimStatus,
    isAdmin,

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
    sendChatMessage,
    searchItems,

    isSupabaseConfigured,

    // Direct Supabase access if needed
    supabase,

    // Config for non-Supabase JS usage
        config: supabaseConfig
    };
}
