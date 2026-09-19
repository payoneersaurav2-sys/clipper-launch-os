const sharp = require('sharp');
const fs = require('fs');

async function processImages() {
  // 1. Re-generate wordmark at 288x56
  await sharp('apps/web/public/brand/creator-os-wordmark-transparent.png')
    .resize(288, 56)
    .webp({ quality: 75 })
    .toFile('apps/web/public/brand/creator-os-wordmark-optimized.webp');
    
  console.log('Wordmark generated at 288x56.');

  // 2. Compress icon-192.png to be under 10 KiB
  await sharp('apps/web/public/brand/creator-os-mark.png')
    .resize(192, 192)
    .png({ quality: 50, compressionLevel: 9, palette: true })
    .toFile('apps/web/public/icon-192.png');
    
  console.log('icon-192.png heavily compressed.');
}

processImages().catch(console.error);
