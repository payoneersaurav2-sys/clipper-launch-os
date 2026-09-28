const puppeteer = require('puppeteer');

async function debugLogin() {
  const browser = await puppeteer.launch({headless: true, args: ['--no-sandbox']});
  try {
    const page = await browser.newPage();
    page.on('response', async resp => {
      if(resp.url().includes('supabase.co/auth/v1/token')) {
        console.log('SUPABASE RESP STATUS:', resp.status());
        console.log('SUPABASE RESP BODY:', await resp.text());
      }
    });

    await page.goto('http://localhost:5173/login', {waitUntil: 'networkidle2'});
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'test.free@creatoros.com');
    await page.type('input[type="password"]', 'TestFree123!');
    await page.keyboard.press('Enter');
    
    await new Promise(r => setTimeout(r, 3000));
  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
}
debugLogin();
