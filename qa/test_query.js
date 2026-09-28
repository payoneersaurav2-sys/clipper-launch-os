require('dotenv').config({ path: 'apps/web/.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321',
  process.env.VITE_SUPABASE_ANON_KEY
);
(async () => {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'test.free@creatoros.com',
    password: 'TestFree123!'
  });
  if (authError) { console.error('Auth error', authError); return; }
  
  const { data, error } = await supabase
    .from('users')
    .select('membership_status, subscription_tier, membership_expires_at, onboarding_complete, whop_id, avatar_url, is_admin')
    .eq('id', authData.user.id)
    .maybeSingle();

  console.log('User data:', data);
  console.log('Error:', error);
})();
