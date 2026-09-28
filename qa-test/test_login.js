const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log("Navigating to http://localhost:5173");
  await page.goto('http://localhost:5173');
  await page.waitForLoadState('networkidle');
  
  console.log("Title: " + await page.title());
  
  // Save page content
  const html = await page.content();
  fs.writeFileSync('page_dump.html', html);
  
  // Also try to find inputs and buttons
  const inputs = await page.$$eval('input', els => els.map(el => ({type: el.type, id: el.id, name: el.name, placeholder: el.placeholder})));
  const buttons = await page.$$eval('button', els => els.map(el => ({text: el.innerText.trim(), id: el.id, type: el.type})));
  
  console.log("Inputs:", inputs);
  console.log("Buttons:", buttons);

  await browser.close();
})();
