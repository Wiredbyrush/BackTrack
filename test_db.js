const SUPABASE_URL = 'https://imdumigrlvujbyvczbpm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltZHVtaWdybHZ1amJ5dmN6YnBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NjcwMTQsImV4cCI6MjA4NDQ0MzAxNH0.cm68e3sGIolEqIl-H4vlJGhE7YISe1vKqAoQncKWYsE';

async function mockGetItems() {
    const filters = { status: ['pending', 'found', 'claimed', 'lost', 'bounty'] };
    // Simulated exactly how getItems is written:
    
    // query = supabase.from('items').select('*').order('created_at', { ascending: false });
    // if (filters.status) {
    //    if (Array.isArray(filters.status)) {
    //        query = query.in('status', filters.status);
    //    } ...
    // }
    
    const params = new URLSearchParams();
    params.set('select', '*');
    params.set('status', `in.(${filters.status.join(',')})`);
    params.set('order', 'created_at.desc');
    
    const res = await fetch(`${SUPABASE_URL}/rest/v1/items?${params.toString()}`, {
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
    });
    
    const data = await res.json();
    console.log("Mock getItems returned items:", data.length);
    const statuses = [...new Set(data.map(d=>d.status))];
    console.log("Statuses in result:", statuses);
    
    const bounties = data.filter((item) => {
        const status = String(item.status || '').toLowerCase();
        if (status === 'approved' || status === 'rejected') return false;
        if (status === 'bounty' || status === 'lost') return true;
        return Boolean(item.is_bounty) && status !== 'pending';
    });
    console.log("Bounties array length:", bounties.length);
}
mockGetItems();
