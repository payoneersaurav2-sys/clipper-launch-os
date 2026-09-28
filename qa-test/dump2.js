const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  try {
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2', timeout: 15000 });
  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
})();
