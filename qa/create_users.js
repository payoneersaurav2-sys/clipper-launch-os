require('dotenv').config({ path: 'apps/web/.env' });
const { createClient } = require('@supabase/supabase-js');

// Must use the SERVICE_ROLE_KEY to bypass RLS and create users bypassing the trigger (or just sign them up natively)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321',
  process.env.VITE_SUPABASE_ANON_KEY
);

async function main() {
  const users = [
    { email: 'test.free@creatoros.com', password: 'TestFree123!' },
    { email: 'test.creator@creatoros.com', password: 'TestCreator123!' },
    { email: 'test.pro@creatoros.com', password: 'TestPro123!' },
    { email: 'test.agency@creatoros.com', password: 'TestAgency123!' },
    { email: 'premium@creatoros.com', password: 'Premium123!@#' }
  ];

  for (const u of users) {
    const { data, error } = await supabase.auth.signUp({
      email: u.email,
      password: u.password,
    });
    if (error) {
      console.log(`Failed to create ${u.email}:`, error.message);
    } else {
      console.log(`Created ${u.email} successfully.`);
    }
  }
}
main();
