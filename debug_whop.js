import crypto from 'node:crypto';
import fs from 'node:fs';
import readline from 'node:readline';

const env = fs.readFileSync('apps/web/.env', 'utf8'); 
const supabaseUrl = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const anonKey = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();

const CLIENT_ID = 'app_NsohXjOYOE0EkK';
const REDIRECT_URI = 'https://creator-os999.vercel.app/auth/callback';

function base64UrlEncode(buffer) {
  return buffer.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

const verifierBytes = crypto.randomBytes(32);
const codeVerifier = base64UrlEncode(verifierBytes);
const hash = crypto.createHash('sha256').update(codeVerifier).digest();
const codeChallenge = base64UrlEncode(hash);

console.log('\n--- STEP 1: PKCE GENERATED ---');
console.log('code_verifier :', codeVerifier);
console.log('code_challenge:', codeChallenge);

const authUrl = `https://whop.com/oauth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&code_challenge=${codeChallenge}&code_challenge_method=S256&state=web_oauth`;

console.log('\n--- STEP 2: OPEN THIS EXACT URL IN AN INCOGNITO BROWSER ---');
console.log(authUrl);

async function exchangeCode(code) {
  console.log(`\nExchanging code: ${code} via Edge Function...`);
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
  console.log('\n--- EDGE FUNCTION RESPONSE ---');
  console.log('Status:', response.status);
  console.log('Body:', text);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('\n--- STEP 3: AFTER AUTHORIZING, YOU WILL BE REDIRECTED TO AN ERROR PAGE. LOOK AT THE URL IN YOUR BROWSER.\nCOPY THE "code=..." PART AND PASTE IT HERE ---\nCode: ', async (code) => {
  if (code) await exchangeCode(code.trim());
  rl.close();
});
