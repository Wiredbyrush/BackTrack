// Supabase Configuration
// Replace these with your actual Supabase project credentials
const SUPABASE_URL = window.SUPABASE_URL || 'https://mzzcwukenxzuelgpuiap.supabase.co';
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16emN3dWtlbnh6dWVsZ3B1aWFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3OTQzMTUsImV4cCI6MjA4NDM3MDMxNX0.1JqsDG1585d9QhspNoFcBzqiaSD59ceiKQBhWJKOcdw';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
        console.error('Error adding item:', error);
        return null;
    }

    return data[0];
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
        options.redirectTo = `${window.location.origin}/login.html`;
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
// EXPORT FOR USE IN OTHER FILES
// ============================================

window.BackTrackDB = {
    // Items
    getItems,
    getItemById,
    addItem,
    updateItem,
    deleteItem,

    // Images
    uploadImage,

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

    isSupabaseConfigured,

    // Direct Supabase access if needed
    supabase
};
