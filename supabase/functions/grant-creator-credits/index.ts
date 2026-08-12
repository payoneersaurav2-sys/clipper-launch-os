import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!supabaseUrl || !serviceRoleKey) return new Response('Not configured', { status: 503 });

  try {
    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

    // Find creator users with zero available credits
    const { data: users, error: usersErr } = await admin.rpc('get_creator_users_with_zero_credits');
    if (usersErr) {
      console.error('Failed to fetch users:', usersErr);
      return new Response(JSON.stringify({ error: usersErr.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const results: Array<{ user_id: string; granted: boolean; message?: string }> = [];
    for (const u of (users ?? [])) {
      try {
        await admin.rpc('grant_creator_os_subscription_credits', { p_user_id: u.id, p_tier: 'creator', p_membership_id: null, p_period_end: null });
        results.push({ user_id: u.id, granted: true });
      } catch (e) {
        console.error('Grant failed for', u.id, e instanceof Error ? e.message : e);
        results.push({ user_id: u.id, granted: false, message: String(e) });
      }
    }

    return new Response(JSON.stringify({ ok: true, results }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('Unexpected error:', err instanceof Error ? err.message : err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
