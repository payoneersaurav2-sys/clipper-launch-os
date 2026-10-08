const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  console.log("=== 2. Homepage Pricing Preview CTA Check ===");
  await page.goto('http://localhost:5173/');
  
  // Wait for the main elements to load, specifically the plans
  await page.waitForSelector('main', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 2000)); // allow things to render
  
  const homepagePlans = await page.evaluate(() => {
    const plans = [];
    const headings = Array.from(document.querySelectorAll('h3, h4, .text-xl, .text-2xl')).filter(h => 
      ['Free', 'Creator', 'Pro', 'Agency'].includes(h.innerText.trim())
    );
    
    for (const h of headings) {
      const card = h.closest('div.rounded-2xl, div.border, div.bg-card');
      if (!card) continue;
      
      const planName = h.innerText.trim();
      const cardText = card.innerText;
      
      // Specifically get button texts
      const buttons = Array.from(card.querySelectorAll('button, a[role="button"], a.inline-flex')).map(b => b.innerText.trim());
      
      plans.push({
        name: planName,
        hasBadge: cardText.toLowerCase().includes('3-day free trial'),
        ctaTexts: buttons
      });
    }
    return plans;
  });
  console.log('Homepage Plans CTA Check:', JSON.stringify(homepagePlans, null, 2));

  console.log("\n=== 3. Pricing Page (/pricing) ===");
  await page.goto('http://localhost:5173/pricing');
  await new Promise(r => setTimeout(r, 4000)); // Wait for React to render pricing plans
  
  const extractPricingPageInfo = async () => {
    return await page.evaluate(() => {
      const plans = [];
      const headings = Array.from(document.querySelectorAll('h3, h4, .text-xl, .text-2xl')).filter(h => 
        ['Free', 'Creator', 'Pro', 'Agency'].includes(h.innerText.trim())
      );
      
      for (const h of headings) {
        // Find the most likely card container. Let's traverse up a bit and find the largest matching container.
        const card = h.closest('div.rounded-2xl') || h.closest('div.border') || h.closest('div.bg-card') || h.closest('div.flex.flex-col');
        if (!card) continue;
        
        const planName = h.innerText.trim();
        const cardText = card.innerText;
        
        const buttons = Array.from(card.querySelectorAll('button, a[role="button"], a.inline-flex, a[href*="/login"]')).map(b => b.innerText.trim());
        
        plans.push({
          name: planName,
          hasBadge: cardText.toLowerCase().includes('3-day free trial'),
          ctaTexts: buttons
        });
      }
      return plans;
    });
  };
  
  console.log("Pricing Page (Default/Monthly):");
  const monthlyPlans = await extractPricingPageInfo();
  console.log(JSON.stringify(monthlyPlans, null, 2));
  
  // Try to find the toggle switch
  console.log("\nTrying to toggle Monthly/Yearly switch...");
  const toggled = await page.evaluate(() => {
    // Try to find radio buttons or elements that have "Year" or "Annual"
    const buttons = Array.from(document.querySelectorAll('button, label, [role="switch"]'));
    const toggle = buttons.find(b => b.innerText.toLowerCase().includes('year') || b.innerText.toLowerCase().includes('annual') || b.innerText.toLowerCase().includes('billed annually'));
    if (toggle) {
      toggle.click();
      return true;
    }
    return false;
  });
  
  if (toggled) {
    // Wait a bit for react re-render
    await new Promise(r => setTimeout(r, 2000));
    console.log("Pricing Page (Yearly):");
    const yearlyPlans = await extractPricingPageInfo();
    console.log(JSON.stringify(yearlyPlans, null, 2));
  } else {
    console.log("Could not find Monthly/Yearly toggle switch.");
  }
  
  await browser.close();
})();
