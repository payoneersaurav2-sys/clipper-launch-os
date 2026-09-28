const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  const login = async (email, password) => {
    console.log(`Logging in as ${email}...`);
    await page.goto('http://localhost:5173/login', {waitUntil: 'networkidle0'});
    await page.type('input[type="email"]', email);
    await page.type('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log('Login complete.');
  };
  
  const logout = async () => {
    const client = await page.target().createCDPSession();
    await client.send('Network.clearBrowserCookies');
    await page.goto('about:blank');
  };

  try {
    // 1. FREE TIER TEST
    await login('test.free@creatoros.com', 'TestFree123!');
    await page.goto('http://localhost:5173/dashboard/idea-studio', {waitUntil: 'networkidle0'});
    await new Promise(r => setTimeout(r, 2000));
    const freeHtml = await page.content();
    fs.writeFileSync('qa/free_tier.html', freeHtml);
    console.log('Saved Free Tier HTML state.');
    await logout();

    // 2. CREATOR TIER TEST
    await login('test.creator@creatoros.com', 'TestCreator123!');
    await page.goto('http://localhost:5173/dashboard/idea-studio', {waitUntil: 'networkidle0'});
    await new Promise(r => setTimeout(r, 2000));
    const creatorHtml = await page.content();
    fs.writeFileSync('qa/creator_tier.html', creatorHtml);
    console.log('Saved Creator Tier HTML state.');
    
    // Check if there is a textarea for generation
    await page.evaluate(() => {
      const ta = document.querySelector('textarea');
      if (ta) {
        ta.value = 'Marketing with AI';
        ta.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    const clicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const gen = btns.find(b => b.textContent.toLowerCase().includes('generate'));
      if (gen) {
        gen.click();
        return true;
      }
      return false;
    });

    if (clicked) {
      console.log('Clicked generate! Waiting for AI...');
      await new Promise(r => setTimeout(r, 8000));
      fs.writeFileSync('qa/creator_tier_generated.html', await page.content());
      console.log('Saved AI Generation state.');
    }

    await logout();
  } catch (e) {
    console.error(e);
  } finally {
    await browser.close();
  }
})();
