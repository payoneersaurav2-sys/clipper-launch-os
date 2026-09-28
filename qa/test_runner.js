const puppeteer = require('puppeteer');

async function runTests() {
  console.log('Starting Creator OS Full UI Tests...');
  const browser = await puppeteer.launch({headless: true, args: ['--no-sandbox']});
  const results = [];
  
  function logResult(feature, tier, result, notes) {
    results.push({ feature, tier, result, notes });
    console.log(`[${result}] ${feature} (${tier}) - ${notes}`);
  }

  try {
    const page = await browser.newPage();
    // Helper login
    const login = async (email, password) => {
      await page.goto('http://localhost:5173/login', {waitUntil: 'networkidle2'});
      await page.waitForSelector('input[type="email"]');
      await page.type('input[type="email"]', email);
      await page.type('input[type="password"]', password);
      await page.keyboard.press('Enter');
      try {
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 });
      } catch (e) {
        // Sometimes wait for navigation times out in SPAs, just wait a bit
        await new Promise(r => setTimeout(r, 2000));
      }
    };

    const logout = async () => {
      await page.goto('http://localhost:5173/logout', {waitUntil: 'networkidle2'}).catch(()=>{});
    };

    // --- FREE TIER ---
    await login('test.free@creatoros.com', 'TestFree123!');
    let url = page.url();
    if (url.includes('/dashboard')) logResult('Auth Flow', 'free', 'PASS', 'Redirected to /dashboard');
    else logResult('Auth Flow', 'free', 'FAIL', `URL is ${url}`);
    
    await page.goto('http://localhost:5173/dashboard/idea-studio', {waitUntil: 'networkidle2'});
    let content = await page.content();
    if (content.toLowerCase().includes('upgrade') || content.toLowerCase().includes('subscribe') || content.toLowerCase().includes('unlock')) {
      logResult('Idea Studio Gating', 'free', 'PASS', 'Upgrade prompt found');
    } else {
      logResult('Idea Studio Gating', 'free', 'FAIL', 'No gating found');
    }
    await logout();

    // --- CREATOR TIER ---
    await login('test.creator@creatoros.com', 'TestCreator123!');
    url = page.url();
    if (url.includes('/dashboard')) logResult('Auth Flow', 'creator', 'PASS', 'Redirected to /dashboard');
    else logResult('Auth Flow', 'creator', 'FAIL', `URL is ${url}`);

    await page.goto('http://localhost:5173/dashboard/idea-studio', {waitUntil: 'networkidle2'});
    content = await page.content();
    if (content.toLowerCase().includes('generate') || content.toLowerCase().includes('ideas')) {
      logResult('Idea Studio', 'creator', 'PASS', 'Idea Studio loaded');
    } else {
      logResult('Idea Studio', 'creator', 'FAIL', 'Idea Studio failed to load');
    }

    await page.goto('http://localhost:5173/dashboard/knowledge-vault', {waitUntil: 'networkidle2'});
    content = await page.content();
    if (content.toLowerCase().includes('knowledge') || content.toLowerCase().includes('add') || content.toLowerCase().includes('new')) {
      logResult('Knowledge Vault', 'creator', 'PASS', 'Knowledge Vault loaded');
    } else {
      logResult('Knowledge Vault', 'creator', 'FAIL', 'Knowledge Vault failed to load');
    }
    await logout();

    // --- PRO TIER ---
    await login('test.pro@creatoros.com', 'TestPro123!');
    url = page.url();
    if (url.includes('/dashboard')) logResult('Auth Flow', 'pro', 'PASS', 'Redirected to /dashboard');
    else logResult('Auth Flow', 'pro', 'FAIL', `URL is ${url}`);

    await page.goto('http://localhost:5173/dashboard/admin', {waitUntil: 'networkidle2'});
    content = await page.content();
    if (content.toLowerCase().includes('unauthorized') || content.toLowerCase().includes('404') || page.url().endsWith('/dashboard')) {
      logResult('Admin Gates', 'pro', 'PASS', 'Admin access denied');
    } else {
      logResult('Admin Gates', 'pro', 'FAIL', 'Admin access permitted');
    }
    await logout();

    // --- AGENCY TIER ---
    await login('test.agency@creatoros.com', 'TestAgency123!');
    url = page.url();
    if (url.includes('/dashboard')) logResult('Auth Flow', 'agency', 'PASS', 'Redirected to /dashboard');
    else logResult('Auth Flow', 'agency', 'FAIL', `URL is ${url}`);

    await page.goto('http://localhost:5173/agency', {waitUntil: 'networkidle2'});
    content = await page.content();
    if (content.toLowerCase().includes('client') || content.toLowerCase().includes('agency') || content.toLowerCase().includes('brand')) {
      logResult('Agency Switcher', 'agency', 'PASS', 'Agency HQ / Client Switcher loaded');
    } else {
      logResult('Agency Switcher', 'agency', 'FAIL', 'Agency features missing');
    }
    await logout();

  } catch (error) {
    console.error('Test script error:', error);
  } finally {
    await browser.close();
    console.log('\n--- FINAL MATRIX ---');
    console.table(results);
  }
}

runTests();
