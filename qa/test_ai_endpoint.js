require('dotenv').config({ path: 'apps/web/.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

(async () => {
  const { data: authData } = await supabase.auth.signInWithPassword({
    email: 'test.creator@creatoros.com',
    password: 'TestCreator123!'
  });
  const token = authData.session.access_token;

  console.log('Got token. Calling AI Endpoint...');
  const res = await fetch('http://localhost:5173/api/ai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'Give me a 1 sentence marketing idea for a coffee shop.' }]
    })
  });
  
  const text = await res.text();
  console.log('Status:', res.status);
  console.log('Response:', text.substring(0, 500));
})();
