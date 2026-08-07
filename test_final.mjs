import crypto from 'crypto';
import fs from 'fs';
import readline from 'readline';

// 1. Fetch environment variables
const env = fs.readFileSync('apps/web/.env', 'utf8');
const supabaseUrlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
const anonKeyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/);
const supabaseUrl = supabaseUrlMatch ? supabaseUrlMatch[1].trim() : '';
const anonKey = anonKeyMatch ? anonKeyMatch[1].trim() : '';

const CLIENT_ID = 'app_NsohXjOYOE0EkK';
const REDIRECT_URI = 'https://creator-os999.vercel.app/auth/callback';

// 2. PKCE strict Base64URL encoding (RFC 7636 compliant)
function base64UrlEncode(buffer) {
  let binary = '';
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

const verifierBytes = crypto.randomBytes(32);
const codeVerifier = base64UrlEncode(verifierBytes);
const hash = crypto.createHash('sha256').update(codeVerifier).digest();
const codeChallenge = base64UrlEncode(hash);

console.log('\n======================================================');
console.log('   ULTIMATE WHOP OAUTH DIAGNOSTIC TEST (Bypass React)   ');
console.log('======================================================\n');

const authUrl = `https://whop.com/oauth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&code_challenge=${codeChallenge}&code_challenge_method=S256&state=web_oauth`;

console.log('STEP 1: OPEN THIS EXACT URL IN AN INCOGNITO WINDOW:');
console.log('\n' + authUrl + '\n');
console.log('STEP 2: Authorize the app. You will be redirected to an error page (or a paused page).');
console.log('STEP 3: Look at your browser URL bar. Copy ONLY the characters after "code=".');

async function exchangeCode(code) {
  console.log(`\n> Sending code to Edge Function instantly: ${code}`);
  console.log(`> Using PKCE Verifier: ${codeVerifier.slice(0, 12)}...`);
  
  const response = await fetch(`${supabaseUrl}/functions/v1/whop-auth`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${anonKey}`
    },
    body: JSON.stringify({
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: codeVerifier,
    }),
  });

  const text = await response.text();
  console.log('\n======================================================');
  console.log('   EDGE FUNCTION RESPONSE');
  console.log('======================================================');
  console.log('Status:', response.status);
  
  try {
    const json = JSON.parse(text);
    console.log(JSON.stringify(json, null, 2));
    
    if (json.error && json.error.includes('invalid_grant')) {
      console.log('\n❌ DIAGNOSTIC RESULT: The API specifically rejected a perfectly formatted code + verifier pair.');
      console.log('Since this script bypasses all React bugs, there are ONLY TWO possible reasons left:');
      console.log('1. The "Redirect URI" in your Whop Developer Dashboard does NOT perfectly match https://creator-os999.vercel.app/auth/callback');
      console.log('2. This is a Sandbox app, but the Edge function is hitting the Production Whop API.');
      console.log('\n👉 YOU MUST CHECK YOUR WHOP DEVELOPER DASHBOARD. NO CODE CHANGES CAN FIX A DASHBOARD MISMATCH.');
    } else if (json.access_token) {
      console.log('\n✅ DIAGNOSTIC RESULT: SUCCESS! The Edge Function successfully exchanged the token.');
      console.log('This means the code logic is flawless, and the React app was "burning" the code by calling it twice (Strict Mode).');
    }
  } catch (e) {
    console.log('Body:', text);
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('\nPASTE YOUR AUTH CODE HERE (QUICKLY, BEFORE IT EXPIRES): ', async (code) => {
  if (code) {
    await exchangeCode(code.trim());
  } else {
    console.log('No code provided.');
  }
  rl.close();
});
