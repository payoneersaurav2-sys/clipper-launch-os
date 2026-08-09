import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = { 'Access-Control-Allow-Origin': 'https://creator-os999.vercel.app', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const WHOP_CLIENT_ID = Deno.env.get('WHOP_CLIENT_ID') ?? 'app_NsohXjOYOE0EkK';
const WHOP_CLIENT_SECRET = Deno.env.get('WHOP_CLIENT_SECRET') ?? '';

serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  try {
    const authorization = request.headers.get('authorization') ?? '';
    if (!authorization.startsWith('Bearer ')) throw new Error('Sign in before connecting Whop.');
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    if (!supabaseUrl || !serviceRoleKey) throw new Error('CreatorOS account linking is not configured.');
    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const token = authorization.slice('Bearer '.length);
    const { data: authData, error: authError } = await admin.auth.getUser(token);
    if (authError || !authData.user) throw new Error('Your CreatorOS session has expired.');

    const { code, redirect_uri, code_verifier } = await request.json();
    if (!code || !redirect_uri || !code_verifier) throw new Error('The Whop linking session is incomplete. Please try again.');
    const payload: Record<string, string> = { grant_type: 'authorization_code', client_id: WHOP_CLIENT_ID, code, redirect_uri, code_verifier };
    if (WHOP_CLIENT_SECRET) payload.client_secret = WHOP_CLIENT_SECRET;
    const tokenResponse = await fetch('https://api.whop.com/oauth/token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!tokenResponse.ok) throw new Error('Whop could not confirm this authorization. Please restart the connection.');
    const whopTokens = await tokenResponse.json();
    const whopUserResponse = await fetch('https://api.whop.com/oauth/userinfo', { headers: { Authorization: `Bearer ${whopTokens.access_token}` } });
    if (!whopUserResponse.ok) throw new Error('Whop user verification failed.');
    const whopUser = await whopUserResponse.json();
    const whopUserId = whopUser.sub as string | undefined;
    if (!whopUserId) throw new Error('Whop did not return a user identity.');

    const { data: alreadyLinked, error: linkLookupError } = await admin.from('users').select('id').eq('whop_id', whopUserId).maybeSingle();
    if (linkLookupError) throw new Error('Could not verify the Whop account link.');
    if (alreadyLinked && alreadyLinked.id !== authData.user.id) throw new Error('This Whop account is already connected to another CreatorOS account.');

    const { error: updateError } = await admin.from('users').update({ whop_id: whopUserId, updated_at: new Date().toISOString() }).eq('id', authData.user.id);
    if (updateError) throw new Error('Could not save the Whop account connection.');
    return new Response(JSON.stringify({ linked: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not connect Whop.';
    return new Response(JSON.stringify({ error: message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
