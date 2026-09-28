import https from 'https';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function run() {
  try {
    const html = await fetchUrl('https://creator-os999.vercel.app');
    const scripts = [...html.matchAll(/src="(\/assets\/index-[^"]+\.js)"/g)];
    
    if (scripts.length > 0) {
      const scriptUrl = 'https://creator-os999.vercel.app' + scripts[0][1];
      const js = await fetchUrl(scriptUrl);
      
      const sbUrlMatch = js.match(/"(https:\/\/[a-z0-9]+\.supabase\.co)"/);
      const sbKeyMatch = js.match(/"(eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[^"]+)"/);
      
      if (sbUrlMatch && sbKeyMatch) {
        console.log('SUPABASE_URL=' + sbUrlMatch[1]);
        console.log('SUPABASE_ANON_KEY=' + sbKeyMatch[1]);
      } else {
        console.log("Could not find keys in JS.");
      }
    }
  } catch (err) {
    console.error(err);
  }
}

run();
