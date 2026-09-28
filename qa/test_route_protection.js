const puppeteer = require('puppeteer');

async function runTests() {
  console.log('Starting Creator OS Full UI Tests (Round 3)...');
  const browser = await puppeteer.launch({headless: true, args: ['--no-sandbox']});
  const results = [];
  
  function logResult(feature, tier, result, notes) {
    results.push({ feature, tier, result, notes });
    console.log(`[${result}] ${feature} (${tier}) - ${notes}`);
  }

  try {
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    
    // Test the route protection fix!
    await page.goto('http://localhost:5173/dashboard/idea-studio', {waitUntil: 'networkidle2'});
    const url = page.url();
    if (url.includes('/login')) {
      logResult('Route Protection', 'unauthenticated', 'PASS', 'Redirected to /login correctly');
    } else {
      logResult('Route Protection', 'unauthenticated', 'FAIL', `Did not redirect to /login. URL is: ${url}`);
    }
    await context.close();

  } catch (error) {
    console.error('Test script error:', error);
  } finally {
    await browser.close();
    console.log('\n--- FINAL MATRIX ---');
    console.table(results);
  }
}

runTests();
