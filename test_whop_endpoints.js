const WHOP_CLIENT_ID = 'app_NsohXjOYOE0EkK';
const WHOP_CLIENT_SECRET = process.env.WHOP_CLIENT_SECRET || 'fake_secret';
const REDIRECT_URI = 'https://creator-os999.vercel.app/auth/callback';
const FAKE_CODE = 'fake_code_123';
const FAKE_VERIFIER = 'fake_verifier_1234567890123456789012345678901234567890';

async function testEndpoint(url) {
  const formParams = new URLSearchParams();
  formParams.append('client_id', WHOP_CLIENT_ID);
  formParams.append('client_secret', WHOP_CLIENT_SECRET);
  formParams.append('grant_type', 'authorization_code');
  formParams.append('code', FAKE_CODE);
  formParams.append('redirect_uri', REDIRECT_URI);
  formParams.append('code_verifier', FAKE_VERIFIER);

  const basicAuth = btoa(`${WHOP_CLIENT_ID}:${WHOP_CLIENT_SECRET}`);

  console.log(`\nTesting ${url}...`);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`
      },
      body: formParams.toString(),
    });
    
    console.log(`Status: ${res.status}`);
    const text = await res.text();
    console.log(`Response: ${text}`);
  } catch (e) {
    console.error(`Error: ${e.message}`);
  }
}

async function run() {
  await testEndpoint('https://api.whop.com/oauth/token');
  await testEndpoint('https://whop.com/oauth/token');
  await testEndpoint('https://api.whop.com/api/v2/oauth/token');
}

run();
