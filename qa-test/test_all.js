const { chromium } = require('playwright');
const fs = require('fs');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const results = {};

  try {
    console.log("=== PHASE A: Authentication ===");
    await page.goto('http://localhost:5173/login');
    await page.waitForLoadState('networkidle');
    
    const emailInput = await page.$('input[type="email"]');
    const passInput = await page.$('input[type="password"]');
    
    if (emailInput && passInput) {
      await emailInput.fill('premium@creatoros.com');
      await passInput.fill('Premium123!@#');
      const submit = await page.$('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');
      if (submit) {
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => {}),
          submit.click()
        ]);
        await delay(3000);
        
        const urlAfterLogin = page.url();
        console.log("URL after login:", urlAfterLogin);
        results['A_Auth'] = urlAfterLogin.includes('/dashboard') || urlAfterLogin !== 'http://localhost:5173/login' ? 'PASS' : 'FAIL';
      } else {
        results['A_Auth'] = 'FAIL_NO_SUBMIT';
      }
    } else {
      results['A_Auth'] = 'FAIL_NO_INPUTS';
    }
    
    // Dump current links/buttons to see what is next
    const links = await page.$$eval('a', els => els.map(el => ({text: el.innerText.trim(), href: el.href})));
    console.log("Links after login:", links);

  } catch (e) {
    console.error("Error:", e);
  } finally {
    fs.writeFileSync('test_results.json', JSON.stringify(results, null, 2));
    await browser.close();
  }
})();
