const puppeteer = require('puppeteer');

async function checkAdminGates() {
  console.log('Testing Admin Gates Fix...');
  const browser = await puppeteer.launch({headless: true, args: ['--no-sandbox']});
  try {
    const page = await browser.newPage();
    
    // Login as Pro
    await page.goto('http://localhost:5173/login', {waitUntil: 'networkidle2'});
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'test.pro@creatoros.com');
    await page.type('input[type="password"]', 'TestPro123!');
    await page.keyboard.press('Enter');
    
    try {
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 });
    } catch(e) {}
    
    // Test Admin Gate
    await page.goto('http://localhost:5173/dashboard/admin/metrics', {waitUntil: 'networkidle2'});
    
    // Give it a moment for the react-router <Navigate /> component to act
    await new Promise(r => setTimeout(r, 2000));
    
    const url = page.url();
    if (url === 'http://localhost:5173/dashboard' || url.endsWith('/dashboard')) {
      console.log('[PASS] Admin Gates (pro) - Redirected away from admin correctly.');
    } else {
      console.log(`[FAIL] Admin Gates (pro) - User stayed on ${url}`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
}

checkAdminGates();
