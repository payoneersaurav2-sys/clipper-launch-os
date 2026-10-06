import { createClient } from '@supabase/supabase-js';
import { processEmailQueue } from './email-service';

export const config = { runtime: 'edge' };

const environment = () => (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
const json = (body: unknown, status: number) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const env = environment();
  const cronSecret = env.CRON_SECRET;
  
  // Verify Vercel Cron Secret if configured
  if (cronSecret) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return json({ error: 'Unauthorized' }, 401);
    }
  }

  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  const supabaseServiceRole = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRole) {
    console.error('[Cron] Missing Supabase environment variables');
    return json({ error: 'Server configuration missing' }, 500);
  }

  try {
    const adminClient = createClient(supabaseUrl, supabaseServiceRole, { auth: { persistSession: false } });
    
    // Process email queue
    const { processed } = await processEmailQueue(adminClient);
    
    return json({ success: true, processed }, 200);
  } catch (err: any) {
    console.error('[Cron] Error processing jobs:', err);
    return json({ error: 'Failed to process jobs' }, 500);
  }
}
