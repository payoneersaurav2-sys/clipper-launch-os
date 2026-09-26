import { createClient } from '@supabase/supabase-js';

export const config = { runtime: 'edge' };

const environment = () => (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
const json = (body: unknown, status: number) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

// Pseudo-crypto for Edge to hash tokens
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default async function handler(req: Request) {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const env = environment();
  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  const supabaseServiceRole = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRole) {
    return json({ error: 'Server configuration missing' }, 500);
  }

  const authHeader = req.headers.get('authorization');
  if (!authHeader) return json({ error: 'Missing authorization' }, 401);

  // We use the service role key to perform DB checks securely but we validate the requesting user first
  const supabase = createClient(supabaseUrl, supabaseServiceRole, {
    auth: { persistSession: false },
    global: { headers: { Authorization: authHeader } }
  });

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return json({ error: 'Unauthorized' }, 401);

  try {
    const { action, agencyId, email, role, workspaceIds, token } = await req.json();

    if (action === 'create') {
      // 1. Authorize: Is user owner/admin of agencyId?
      const authCheck = await fetch(`${supabaseUrl}/rest/v1/rpc/user_can_manage_agency`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceRole,
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ check_agency_id: agencyId })
      });
      if (!authCheck.ok) throw new Error('Authorization check failed');
      const canManage = await authCheck.json();
      if (!canManage) return json({ error: 'Unauthorized to manage agency' }, 403);

      // 2. Generate and hash secure token
      const rawToken = crypto.randomUUID() + crypto.randomUUID();
      const tokenHash = await hashToken(rawToken);

      // 3. Create invitation using service role (so we can insert easily, we already authorized)
      const adminClient = createClient(supabaseUrl, supabaseServiceRole, { auth: { persistSession: false } });
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

      const { data: invite, error: inviteErr } = await adminClient
        .from('agency_invitations')
        .insert({
          agency_id: agencyId,
          email: email.toLowerCase(),
          role: role,
          token_hash: tokenHash,
          invited_by: user.id,
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();
      
      if (inviteErr) {
        if (inviteErr.code === '23505') return json({ error: 'User is already invited.' }, 400);
        throw inviteErr;
      }

      if (workspaceIds && workspaceIds.length > 0) {
        const clients = workspaceIds.map((id: string) => ({
          invitation_id: invite.id,
          workspace_id: id
        }));
        await adminClient.from('agency_invitation_clients').insert(clients);
      }

      // Mock sending email
      console.log(`Mock Email to ${email}: You have been invited to join an agency. Link: /agency/accept-invite?token=${rawToken}`);

      return json({ success: true, message: 'Invitation sent.' }, 200);
    }
    
    if (action === 'accept') {
      if (!token) return json({ error: 'Missing token' }, 400);
      const tokenHash = await hashToken(token);
      
      const adminClient = createClient(supabaseUrl, supabaseServiceRole, { auth: { persistSession: false } });
      
      const { data: invite, error: inviteErr } = await adminClient
        .from('agency_invitations')
        .select('*, agency_invitation_clients(workspace_id)')
        .eq('token_hash', tokenHash)
        .single();
        
      if (inviteErr || !invite) return json({ error: 'Invalid invitation' }, 400);
      
      if (new Date(invite.expires_at) < new Date()) {
        return json({ error: 'Invitation expired' }, 400);
      }
      
      if (invite.email !== user.email?.toLowerCase()) {
        return json({ error: 'This invitation was sent to a different email address.' }, 403);
      }
      
      // Add member to agency
      const { error: memberErr } = await adminClient
        .from('agency_members')
        .upsert({
          agency_id: invite.agency_id,
          user_id: user.id,
          role: invite.role
        });
        
      if (memberErr) throw memberErr;
      
      // Add workspace access
      if (invite.agency_invitation_clients && invite.agency_invitation_clients.length > 0) {
        const access = invite.agency_invitation_clients.map((c: any) => ({
          workspace_id: c.workspace_id,
          user_id: user.id,
          role: 'member'
        }));
        await adminClient.from('workspace_members').upsert(access);
      }
      
      // Delete invite
      await adminClient.from('agency_invitations').delete().eq('id', invite.id);
      
      return json({ success: true }, 200);
    }

    return json({ error: 'Invalid action' }, 400);
  } catch (err: any) {
    console.error('Invite handler error:', err);
    return json({ error: 'An unexpected error occurred.' }, 500);
  }
}
