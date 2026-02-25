const puppeteer = require('puppeteer');
const fs = require('fs');

const logos = {
    "East_Forsyth": "https://images.maxpreps.com/school-logo/b/2/a/76412678-c711-477f-a6dd-c1a779ca740b.png?version=637762696800000000",
    "Forsyth_Central": "https://images.maxpreps.com/school-logo/8/7/e/04f8e6cf-306d-4762-b91c-99fb0e5a9ee0.png?version=637761920400000000",
    "Lambert": "https://images.maxpreps.com/school-logo/f/3/5/834ee511-bd78-43da-9195-21d3f2276ccb.png?version=638421443400000000",
    "North_Forsyth": "https://images.maxpreps.com/school-logo/f/3/5/fa8324f9-712f-47dc-8d76-5085d38cc972.png?version=638423689200000000",
    "South_Forsyth": "https://images.maxpreps.com/school-logo/8/0/5/ce56543b-3990-449e-9ae9-e9100171fdc3.png?version=638421443400000000",
    "West_Forsyth": "https://images.maxpreps.com/school-logo/d/6/a/4c75ca78-8386-4401-a477-d46db150ec8b.png?version=638421443400000000"
};

(async () => {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    // Set a realistic user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');

    for (const [school, url] of Object.entries(logos)) {
        try {
            console.log(`Downloading ${school}...`);
            const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
            const buffer = await response.buffer();
            fs.writeFileSync(`/Users/rushwanthmahendran/FBLA Website coding and development/logos/${school}.png`, buffer);
            console.log(`Successfully saved ${school}.png`);
        } catch (error) {
            console.error(`Error downloading ${school}:`, error);
        }
    }

    await browser.close();
})();
