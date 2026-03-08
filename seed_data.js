const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase Client
// We will need the user to provide their Supabase URL and Service Role Key (or Anon Key if RLS allows)
// Note: Since RLS might be strict, using Service Role Key is best for a seed script.
// However, since we don't know it, we'll try with the Anon Key from frontend config first,
// but the user might need to run this from their own environment or provide the service role key.

// Let's read from supabase.js to grab the anon key and url if possible, or just ask the user
const supabaseUrl = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const ASSETS_DIR = '/Users/rushwanthmahendran/.gemini/antigravity/brain/cebd7939-f18f-4604-a497-6647da495954';

const mockData = [
    {
        title: "Blue Hydro Flask",
        category: "Bottles",
        location: "Chemistry Lab, Room 302",
        description: "A dark blue Hydro Flask with a small dent on the bottom. Left it after 4th period.",
        item_date: "2024-03-05", // Example dates
        is_bounty: false,
        status: "lost",
        image: "blue_water_bottle_1772939358908.png"
    },
    {
        title: "Black JanSport Backpack",
        category: "Bags",
        location: "Cafeteria, near the vending machines",
        description: "Plain black backpack. Has my AP History textbook and some notebooks inside. Really need this back!",
        item_date: "2024-03-06",
        is_bounty: true,
        reward_amount: 15.00,
        status: "bounty",
        image: "black_backpack_1772939370070.png"
    },
    {
        title: "AirPods Pro (2nd Gen)",
        category: "Electronics",
        location: "Gymnasium Bleachers",
        description: "White AirPods Pro case. The right earbud is missing, only the case and left earbud are there.",
        item_date: "2024-03-07",
        is_bounty: true,
        reward_amount: 50.00,
        status: "bounty",
        image: "wireless_earbuds_1772939385637.png"
    },
    {
        title: "TI-84 Plus CE Graphing Calculator",
        category: "Electronics",
        location: "Library, 2nd floor silent area",
        description: "Black TI-84 calculator. It has 'Property of Math Dept' scratched off lightly on the back.",
        item_date: "2024-03-04",
        is_bounty: true,
        reward_amount: 25.00,
        status: "bounty",
        image: "graphing_calculator_1772939402942.png"
    },
    {
        title: "Red Nike Zip-Up Hoodie",
        category: "Clothing",
        location: "Mr. Smith's Room (114)",
        description: "Size Medium red Nike hoodie. Has a small tear on the left sleeve.",
        item_date: "2024-03-05",
        is_bounty: false,
        status: "lost",
        image: "red_hoodie_1772939415650.png"
    },
    {
        title: "Honda Car Keys on Lanyard",
        category: "Keys",
        location: "Cafeteria Table 4",
        description: "Silver Honda key fob with a few other keys on a black FBLA lanyard.",
        item_date: "2024-03-07",
        is_bounty: true,
        reward_amount: 30.00,
        status: "bounty",
        image: "silver_keys_1772939435071.png"
    },
    {
        title: "MacBook Air M1",
        category: "Electronics",
        location: "Media Center",
        description: "Silver MacBook Air. Has a few stick residue marks on the top cover.",
        item_date: "2024-03-06",
        is_bounty: true,
        reward_amount: 100.00,
        status: "bounty",
        image: "macbook_air_1772939451456.png"
    },
    {
        title: "Pink Hydro Flask with Stickers",
        category: "Bottles",
        location: "Track Field bleachers",
        description: "Bright pink 32oz Hydro Flask with an 'Adventure' sticker and a 'Save the turtles' sticker.",
        item_date: "2024-03-02",
        is_bounty: false,
        status: "lost",
        image: "hydroflask_pink_1772939466584.png"
    },
    {
        title: "Blue Nike Gym Bag",
        category: "Bags",
        location: "Boys Locker Room Hallway",
        description: "Medium-sized blue duffel bag. Has my gym clothes and a pair of white running shoes inside.",
        item_date: "2024-03-07",
        is_bounty: false,
        status: "lost",
        image: "gym_bag_1772939481729.png"
    },
    {
        title: "Ray-Ban Classic Sunglasses",
        category: "Accessories",
        location: "Courtyard Benches",
        description: "Classic black Ray-Ban Wayfarers. Left them on the concrete bench during lunch.",
        item_date: "2024-03-01",
        is_bounty: true,
        reward_amount: 20.00,
        status: "bounty",
        image: "sunglasses_1772939496764.png"
    }
];

async function uploadImage(imageName) {
    const sourcePath = path.join(ASSETS_DIR, imageName);
    if (!fs.existsSync(sourcePath)) {
        console.error(`File not found: ${sourcePath}`);
        return null;
    }

    const targetDir = path.join(__dirname, 'assets', 'img');
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    const fileName = `${Date.now()}_${imageName}`;
    const targetPath = path.join(targetDir, fileName);

    console.log(`Copying ${fileName} to local assets...`);
    fs.copyFileSync(sourcePath, targetPath);

    return `assets/img/${fileName}`;
}

async function seedData() {
    let dummyUserId = 'd0b81aa6-3bea-4078-a006-03c03164ad0a'; // Try to use a known good ID or let RLS handle it if we are using service key.
    // If using anon key, we might need a real authenticated user. Let's try to just insert.

    for (const item of mockData) {
        console.log(`Processing item: ${item.title}`);

        let imageUrl = null;
        if (item.image) {
            imageUrl = await uploadImage(item.image);
        }

        const insertData = {
            name: item.title,
            category: item.category,
            location: item.location,
            description: item.description,
            date_lost: item.item_date,
            is_bounty: item.is_bounty,
            status: item.status,
            image_url: imageUrl,
            contact_email: "test@example.com",
            finder_name: item.status === 'found' ? "John Doe" : null
        };

        const { data, error } = await supabase
            .from('items')
            .insert([insertData])
            .select();

        if (error) {
            console.error(`Error inserting ${item.title}:`, error.message);
        } else {
            console.log(`Successfully inserted ${item.title} (ID: ${data[0].id})`);
        }
    }
    console.log("Seeding complete.");
}

seedData();
