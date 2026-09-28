const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  try {
    await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded' });
    const html = await page.content();
    console.log(html);
  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
})();
