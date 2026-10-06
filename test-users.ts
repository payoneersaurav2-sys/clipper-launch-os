import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

async function run() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceRole) throw new Error('Missing DB credentials');

  const supabase = createClient(supabaseUrl, supabaseServiceRole, { auth: { persistSession: false } });

  // Query public.users
  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, email:id') // Actually email is usually in auth.users, let's just get everything
    
  if (error) throw error;
  
  // To get emails, we need auth.users
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) throw authError;
  
  const users = authData.users.map(u => ({
    id: u.id,
    email: u.email,
    full_name: u.user_metadata?.full_name || data.find(pu => pu.id === u.id)?.full_name || ''
  }));

  const matched = users.filter(u => u.full_name?.toLowerCase().includes('saurav') || u.full_name?.toLowerCase().includes('saurab') || u.email?.toLowerCase().includes('saurav') || u.email?.toLowerCase().includes('saurab'));
  
  console.log('---MATCHED USERS---');
  console.log(JSON.stringify(matched, null, 2));
}
run();
