const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixImageUrls() {
    console.log("Fetching items with assets/img/% prefix...");
    const { data: items, error: fetchError } = await supabase
        .from('items')
        .select('id, image_url')
        .like('image_url', 'assets/img/%');

    if (fetchError) {
        console.error("Error fetching items:", fetchError);
        return;
    }

    if (!items || items.length === 0) {
        console.log("No items found needing correction.");
        return;
    }

    console.log(`Found ${items.length} items. Updating...`);

    // We will prefix the relative URL with a dummy https:// prefix that the frontend strips or ignores, OR 
    // actually, let's just make it a real absolute URL based on the current domain.
    // The easiest is to just use window.location.origin in the frontend, but we can't do that here.
    // Let's prepend the Vercel app domain.
    const BASE_URL = 'https://back-track-de46.vercel.app/';

    for (const item of items) {
        const newUrl = BASE_URL + item.image_url;
        console.log(`Updating ${item.id} -> ${newUrl}`);

        const { error: updateError } = await supabase
            .from('items')
            .update({ image_url: newUrl })
            .eq('id', item.id);

        if (updateError) {
            console.error(`Error updating ${item.id}:`, updateError);
        }
    }

    console.log("Updates complete.");
}

fixImageUrls();
