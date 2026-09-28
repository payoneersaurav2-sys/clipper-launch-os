const puppeteer = require('puppeteer');

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  const login = async (email, password) => {
    console.log(`Logging in as ${email}...`);
    await page.goto('http://localhost:5173/login', {waitUntil: 'domcontentloaded'});
    await page.waitForSelector('input[type="email"]'); await page.type('input[type="email"]', email);
    await page.type('input[type="password"]', password);
    await page.click('button[type="submit"]');
    
    // Custom wait since SPAs don't trigger normal navigation
    await new Promise(r => setTimeout(r, 4000));
    console.log('Login complete.');
  };
  
  const logout = async () => {
    const client = await page.target().createCDPSession();
    await client.send('Network.clearBrowserCookies');
    await page.goto('about:blank');
  };

  try {
    // 1. FREE TIER TEST
    console.log('Testing Free Tier...');
    await login('test.free@creatoros.com', 'TestFree123!');
    await page.goto('http://localhost:5173/dashboard/idea-studio', {waitUntil: 'domcontentloaded'});
    await new Promise(r => setTimeout(r, 2000));
    
    // Check for upgrade/paywall
    const hasPaywall = await page.evaluate(() => {
      const text = document.body.innerText.toLowerCase();
      return text.includes('upgrade') || text.includes('subscribe') || text.includes('renew');
    });
    if (hasPaywall) {
      console.log('✅ Free Tier: Paywall/Upgrade correctly displayed on dashboard.');
    } else {
      console.error('❌ Free Tier: Paywall MISSING.');
    }
    await logout();

    // 2. CREATOR TIER TEST (AI Generation)
    console.log('\nTesting Creator Tier (AI Generation)...');
    await login('test.creator@creatoros.com', 'TestCreator123!');
    await page.goto('http://localhost:5173/dashboard/idea-studio', {waitUntil: 'domcontentloaded'});
    await new Promise(r => setTimeout(r, 2000));
    
    // Fill out the topic input and click generate
    await page.evaluate(() => {
      const inputs = document.querySelectorAll('input, textarea');
      if (inputs.length > 0) {
        inputs[0].value = 'Future of AI in marketing';
        inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    const clicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const generateBtn = buttons.find(b => b.innerText.toLowerCase().includes('generate'));
      if (generateBtn) {
        generateBtn.click();
        return true;
      }
      return false;
    });

    if (clicked) {
      console.log('✅ Creator Tier: Clicked Generate button.');
      console.log('Waiting for AI response...');
      await new Promise(r => setTimeout(r, 8000)); // Wait for generation
      
      const responseText = await page.evaluate(() => {
        return document.body.innerText.toLowerCase();
      });
      
      if (responseText.includes('error') || responseText.includes('failed')) {
        console.log('❌ Creator Tier: AI Generation threw an error.');
      } else {
        console.log('✅ Creator Tier: AI Generation successful (no error).');
      }
    } else {
      console.log('⚠️ Creator Tier: Could not find Generate button.');
    }
    
    await logout();

    console.log('\nAll functional tests finished.');
  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    await browser.close();
  }
})();
