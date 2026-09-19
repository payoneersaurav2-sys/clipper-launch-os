const sharp = require('sharp');
const fs = require('fs');

async function processImages() {
  // Create icon-192.png
  await sharp('apps/web/public/brand/creator-os-mark.png')
    .resize(192, 192)
    .toFile('apps/web/public/icon-192.png');
  
  // Create icon-512.png
  await sharp('apps/web/public/brand/creator-os-mark.png')
    .resize(512, 512)
    .toFile('apps/web/public/icon-512.png');

  // Optimize wordmark
  // Original is 1135x220, we need width 330px
  await sharp('apps/web/public/brand/creator-os-wordmark-transparent.png')
    .resize(330)
    .webp({ quality: 80 })
    .toFile('apps/web/public/brand/creator-os-wordmark-optimized.webp');
    
  console.log('Images optimized successfully.');
}

processImages().catch(console.error);
