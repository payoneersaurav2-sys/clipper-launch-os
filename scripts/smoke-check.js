const http = require('http');
const fs = require('fs');
let attempts = 0;
const max = 30;
function check() {
  attempts++;
  http.get('http://127.0.0.1:4173', (res) => {
    console.log('UP', res.statusCode);
    let body = '';
    res.on('data', c => body += c);
    res.on('end', () => {
      try {
        fs.writeFileSync('dist/preview-index.html', body, 'utf8');
        console.log('SAVED dist/preview-index.html');
      } catch (e) {
        console.error('SAVE_FAILED', e.message);
      }
      process.exit(0);
    });
  }).on('error', () => {
    if (attempts >= max) {
      console.error('TIMEOUT');
      process.exit(1);
    } else {
      setTimeout(check, 1000);
    }
  });
}
check();
