const sharp = require('sharp');
const fs = require('fs');

async function processWordmark() {
  await sharp('apps/web/public/brand/creator-os-wordmark-transparent.png')
    .resize({ width: 144 })
    .webp({ quality: 65, effort: 6 })
    .toFile('apps/web/public/brand/creator-os-wordmark-optimized.webp');
    
  console.log('Wordmark optimized down to 144px successfully.');
}

processWordmark().catch(console.error);
