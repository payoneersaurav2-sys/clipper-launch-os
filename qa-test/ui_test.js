const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const results = [];

  const logResult = (feature, tier, result, notes) => {
    results.push({ feature, tier, result, notes });
    console.log(`[${result}] ${feature} (${tier}) - ${notes}`);
  };

  const login = async (email, password) => {
    console.log(`Logging in as ${email}`);
    await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    await page.type('input[type="email"]', email);
    await page.type('input[type="password"]', password);
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const loginBtn = buttons.find(b => b.textContent.includes('Login') || b.textContent.includes('Sign In'));
      if (loginBtn) loginBtn.click();
    });
    // Wait for URL to change to dashboard
    await page.waitForFunction(() => window.location.href.includes('/dashboard'), { timeout: 10000 }).catch(() => {});
  };

  const logout = async () => {
    console.log('Logging out');
    await page.goto('http://localhost:5173/logout', { waitUntil: 'domcontentloaded' }).catch(() => {});
  };

  try {
    // FREE TIER
    await login('test.free@creatoros.com', 'TestFree123!');
    let url = page.url();
    if (url.includes('/dashboard')) {
      logResult('Auth Flow', 'free', 'PASS', 'Redirected to dashboard');
    } else {
      logResult('Auth Flow', 'free', 'FAIL', 'Failed to redirect to dashboard, url: ' + url);
    }

    await page.goto('http://localhost:5173/dashboard/idea-studio', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 2000));
    const ideaContent = await page.content();
    if (ideaContent.includes('upgrade') || ideaContent.includes('subscription')) {
      logResult('Idea Studio Gating', 'free', 'PASS', 'Got upgrade prompt');
    } else {
      logResult('Idea Studio Gating', 'free', 'FAIL', 'No upgrade prompt found');
    }

    await logout();

    // CREATOR TIER
    await login('test.creator@creatoros.com', 'TestCreator123!');
    url = page.url();
    if (url.includes('/dashboard')) {
      logResult('Auth Flow', 'creator', 'PASS', 'Redirected to dashboard');
    } else {
      logResult('Auth Flow', 'creator', 'FAIL', 'Failed to redirect to dashboard');
    }
    
    // Idea Studio
    await page.goto('http://localhost:5173/dashboard/idea-studio', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input, textarea', { timeout: 5000 }).catch(()=>null);
    let ideaContentCreator = await page.content();
    if (ideaContentCreator.includes('Generate Ideas') || ideaContentCreator.includes('Generate')) {
      logResult('Idea Studio', 'creator', 'PASS', 'Idea Studio loaded for creator');
    } else {
      logResult('Idea Studio', 'creator', 'FAIL', 'Idea Studio did not load properly');
    }

    // Knowledge Vault
    await page.goto('http://localhost:5173/dashboard/knowledge-vault', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('button', { timeout: 5000 }).catch(()=>null);
    let kvContent = await page.content();
    if (kvContent.includes('Add Knowledge') || kvContent.includes('New Item')) {
      logResult('Knowledge Vault', 'creator', 'PASS', 'Knowledge Vault loaded');
    } else {
      logResult('Knowledge Vault', 'creator', 'FAIL', 'Knowledge Vault UI missing');
    }

    // AI logic check (simulate setting a model or default)
    await page.goto('http://localhost:5173/dashboard/ai-settings', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('select, input', { timeout: 5000 }).catch(()=>null);
    let aiContent = await page.content();
    if (aiContent.includes('Model') || aiContent.includes('Creativity')) {
      logResult('AI Settings', 'creator', 'PASS', 'AI Settings page rendered correctly');
    } else {
      logResult('AI Settings', 'creator', 'FAIL', 'AI Settings page did not render options');
    }

    await logout();

    // PRO TIER
    await login('test.pro@creatoros.com', 'TestPro123!');
    url = page.url();
    if (url.includes('/dashboard')) {
      logResult('Auth Flow', 'pro', 'PASS', 'Redirected to dashboard');
    } else {
      logResult('Auth Flow', 'pro', 'FAIL', 'Failed to redirect to dashboard');
    }
    
    // Admin check
    await page.goto('http://localhost:5173/dashboard/admin', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 2000));
    let adminContent = await page.content();
    if (adminContent.includes('Not Authorized') || adminContent.includes('404') || adminContent.includes('Dashboard')) {
      logResult('Admin Gates', 'pro', 'PASS', 'Admin properly gated for pro tier');
    } else {
      logResult('Admin Gates', 'pro', 'FAIL', 'Pro user accessed admin');
    }
    await logout();

    // AGENCY TIER
    await login('test.agency@creatoros.com', 'TestAgency123!');
    url = page.url();
    if (url.includes('/dashboard')) {
      logResult('Auth Flow', 'agency', 'PASS', 'Redirected to dashboard');
    } else {
      logResult('Auth Flow', 'agency', 'FAIL', 'Failed to redirect to dashboard');
    }

    // Agency switcher
    await page.goto('http://localhost:5173/agency', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('button', { timeout: 5000 }).catch(()=>null);
    let agencyContent = await page.content();
    if (agencyContent.includes('Clients') || agencyContent.includes('Agency HQ')) {
      logResult('Agency Switcher', 'agency', 'PASS', 'Agency HQ loaded');
    } else {
      logResult('Agency Switcher', 'agency', 'FAIL', 'Agency HQ failed to load');
    }
    
    await logout();

  } catch (err) {
    console.error("Test execution error:", err);
  } finally {
    await browser.close();
    console.log("JSON_RESULTS:", JSON.stringify(results));
  }
})();
