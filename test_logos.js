const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('file:///Users/rushwanthmahendran/FBLA%20Website%20coding%20and%20development/index.html');
  
  const blendMode = await page.$eval('.school-icon-img', el => getComputedStyle(el).mixBlendMode);
  console.log(`The applied blend mode for logos is: ${blendMode}`);
  
  await browser.close();
})();
