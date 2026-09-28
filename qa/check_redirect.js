const puppeteer = require('puppeteer');

async function checkRedirect() {
  const browser = await puppeteer.launch({headless: true, args: ['--no-sandbox']});
  try {
    const page = await browser.newPage();
    await page.goto('http://localhost:5173/dashboard/idea-studio', {waitUntil: 'networkidle2'});
    console.log('URL AFTER GOTO IDEA STUDIO:', page.url());
  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
}
checkRedirect();
