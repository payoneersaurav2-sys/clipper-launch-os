import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function check() {
  const key = process.env.PADDLE_API_KEY;
  if (!key) {
    console.error('Missing PADDLE_API_KEY in .env.local');
    return;
  }

  console.log('Fetching subscriptions from Paddle Sandbox...');
  const subRes = await fetch('https://sandbox-api.paddle.com/subscriptions', {
    headers: { 'Authorization': `Bearer ${key}` }
  });
  const subData = await subRes.json();
  console.log('=== PADDLE SUBSCRIPTIONS ===');
  console.log(JSON.stringify(subData, null, 2));

  console.log('\nFetching transactions from Paddle Sandbox...');
  const txnRes = await fetch('https://sandbox-api.paddle.com/transactions', {
    headers: { 'Authorization': `Bearer ${key}` }
  });
  const txnData = await txnRes.json();
  console.log('=== PADDLE TRANSACTIONS ===');
  console.log(JSON.stringify(txnData, null, 2));
}

check().catch(console.error);
