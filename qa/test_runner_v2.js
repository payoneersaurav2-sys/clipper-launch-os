const puppeteer = require('puppeteer');

async function runTests() {
  console.log('Starting Creator OS Full UI Tests (Round 2)...');
  const browser = await puppeteer.launch({headless: true, args: ['--no-sandbox']});
  const results = [];
  
  function logResult(feature, tier, result, notes) {
    results.push({ feature, tier, result, notes });
    console.log(`[${result}] ${feature} (${tier}) - ${notes}`);
  }

  try {
    const testTier = async (email, password, tierName, callback) => {
      const context = await browser.createBrowserContext();
      const page = await context.newPage();
      
      try {
        await page.goto('http://localhost:5173/login', {waitUntil: 'networkidle2'});
        await page.waitForSelector('input[type="email"]');
        await page.type('input[type="email"]', email);
        await page.type('input[type="password"]', password);
        await page.keyboard.press('Enter');
        
        // Wait for login to complete and redirect
        try {
          await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 8000 });
        } catch (e) {
          await new Promise(r => setTimeout(r, 2000));
        }

        const url = page.url();
        if (url.includes('/dashboard')) {
          logResult('Auth Flow', tierName, 'PASS', 'Redirected to /dashboard');
          await callback(page);
        } else {
          logResult('Auth Flow', tierName, 'FAIL', `URL is ${url}`);
        }
      } catch (err) {
        logResult('Auth Flow', tierName, 'ERROR', err.message);
      } finally {
        await context.close();
      }
    };

    // --- FREE TIER ---
    await testTier('test.free@creatoros.com', 'TestFree123!', 'free', async (page) => {
      await page.goto('http://localhost:5173/dashboard/idea-studio', {waitUntil: 'networkidle2'});
      let content = await page.content();
      if (content.toLowerCase().includes('upgrade') || content.toLowerCase().includes('subscribe') || content.toLowerCase().includes('unlock') || content.toLowerCase().includes('inactive')) {
        logResult('Idea Studio Gating', 'free', 'PASS', 'Upgrade prompt found');
      } else {
        logResult('Idea Studio Gating', 'free', 'FAIL', 'No gating found');
      }
    });

    // --- CREATOR TIER ---
    await testTier('test.creator@creatoros.com', 'TestCreator123!', 'creator', async (page) => {
      await page.goto('http://localhost:5173/dashboard/idea-studio', {waitUntil: 'networkidle2'});
      let content = await page.content();
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
    });

    // --- PRO TIER ---
    await testTier('test.pro@creatoros.com', 'TestPro123!', 'pro', async (page) => {
      await page.goto('http://localhost:5173/dashboard/admin', {waitUntil: 'networkidle2'});
      await new Promise(r => setTimeout(r, 1000));
      let content = await page.content();
      if (content.toLowerCase().includes('not authorized') || content.toLowerCase().includes('404') || page.url().endsWith('/dashboard') || content.toLowerCase().includes('not found')) {
        logResult('Admin Gates', 'pro', 'PASS', 'Admin access denied');
      } else {
        logResult('Admin Gates', 'pro', 'FAIL', 'Admin access permitted');
      }
    });

    // --- AGENCY TIER ---
    await testTier('test.agency@creatoros.com', 'TestAgency123!', 'agency', async (page) => {
      await page.goto('http://localhost:5173/agency', {waitUntil: 'networkidle2'});
      await new Promise(r => setTimeout(r, 1000));
      let content = await page.content();
      if (content.toLowerCase().includes('client') || content.toLowerCase().includes('agency') || content.toLowerCase().includes('brand')) {
        logResult('Agency Switcher', 'agency', 'PASS', 'Agency HQ / Client Switcher loaded');
      } else {
        logResult('Agency Switcher', 'agency', 'FAIL', 'Agency features missing');
      }
    });

  } catch (error) {
    console.error('Test script error:', error);
  } finally {
    await browser.close();
    console.log('\n--- FINAL MATRIX ---');
    console.table(results);
  }
}

runTests();
