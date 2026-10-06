import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

export const config = { runtime: 'edge' };

const environment = () => (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
const json = (body: unknown, status: number) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

export default async function handler(req: Request) {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const env = environment();
  const resendApiKey = env.RESEND_API_KEY;
  const emailFrom = env.EMAIL_FROM || 'Creator OS <hello@creator-os.online>';
  
  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  const supabaseServiceRole = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!resendApiKey) {
    console.error('[Email Service] Missing RESEND_API_KEY environment variable');
    return json({ error: 'Email service configuration missing' }, 500);
  }

  if (!supabaseUrl || !supabaseServiceRole) {
    console.error('[Email Service] Missing Supabase environment variables');
    return json({ error: 'Server configuration missing' }, 500);
  }

  const authHeader = req.headers.get('authorization');
  if (!authHeader) return json({ error: 'Missing authorization' }, 401);

  // Authenticate user
  const supabase = createClient(supabaseUrl, supabaseServiceRole, {
    auth: { persistSession: false },
    global: { headers: { Authorization: authHeader } }
  });

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return json({ error: 'Unauthorized' }, 401);

  try {
    const { action, email, subject, text, html, type, idempotencyKey } = await req.json();

    const resend = new Resend(resendApiKey);

    if (action === 'test') {
      const { data, error } = await resend.emails.send({
        from: emailFrom,
        to: email || user.email,
        subject: subject || 'Test Email from Creator OS',
        html: html || '<p>This is a test email sent from Creator OS</p>',
      });

      if (error) {
        console.error('[Email Service] Resend Test Error:', error);
        return json({ error: 'Failed to send test email' }, 500);
      }

      console.log(`[Email Service] Sent test email to ${email || user.email}`);
      return json({ success: true, message: 'Test email sent successfully', id: data?.id }, 200);
    }
    
    // Add logic for real emails if we want them synchronously sent,
    // though the prompt asks to PREPARE for cron queue sending.
    if (action === 'send_direct') {
      // Must enforce rate limiting / policies here in production
      
      const { data, error } = await resend.emails.send({
        from: emailFrom,
        to: email || user.email,
        subject: subject,
        html: html,
        text: text,
      });

      if (error) {
         console.error('[Email Service] Resend Direct Send Error:', error);
         return json({ error: 'Failed to send email' }, 500);
      }
      
      return json({ success: true, message: 'Email sent successfully', id: data?.id }, 200);
    }

    if (action === 'queue_onboarding') {
      if (!type || !idempotencyKey) return json({ error: 'Missing required parameters' }, 400);

      // We queue it securely using service role so it bypasses RLS inserts, but user identity is verified.
      const adminClient = createClient(supabaseUrl, supabaseServiceRole, { auth: { persistSession: false } });
      
      const { data, error } = await adminClient
        .from('email_queue')
        .insert({
          user_id: user.id,
          email: user.email,
          email_type: type,
          status: 'pending',
          idempotency_key: idempotencyKey,
        })
        .select()
        .single();
        
      if (error) {
        if (error.code === '23505') {
          console.log(`[Email Service] Idempotent key already exists for user ${user.id} and type ${type}`);
          return json({ success: true, message: 'Email already queued (idempotency met)' }, 200);
        }
        console.error('[Email Service] Queue Error:', error);
        throw error;
      }
      
      return json({ success: true, message: 'Email queued successfully' }, 200);
    }

    return json({ error: 'Invalid action' }, 400);
  } catch (err: any) {
    console.error('[Email Service] Unexpected error:', err);
    return json({ error: 'An unexpected error occurred.' }, 500);
  }
}
