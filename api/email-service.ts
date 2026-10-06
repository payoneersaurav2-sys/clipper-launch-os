import { Resend } from 'resend';

// Reusable server-side email functions
// These should ONLY be called from secure server contexts (Cron, Webhooks, Edge Functions).

const environment = () => (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};

export async function sendWelcomeEmail(to: string, userName: string = 'Creator') {
  const env = environment();
  const apiKey = env.RESEND_API_KEY;
  const emailFrom = env.EMAIL_FROM || 'Creator OS <hello@creator-os.online>';

  if (!apiKey) throw new Error('Missing RESEND_API_KEY');
  const resend = new Resend(apiKey);

  const html = `
    <h1>Welcome to Creator OS, ${userName}!</h1>
    <p>We're thrilled to have you on board.</p>
    <p>Get started by setting up your first Brand Profile and generating ideas in the Idea Studio.</p>
    <br/>
    <p>The Creator OS Team</p>
  `;

  return resend.emails.send({
    from: emailFrom,
    to,
    subject: 'Welcome to Creator OS! 🚀',
    html,
  });
}

export async function sendOnboardingEmail(to: string, userName: string = 'Creator') {
  const env = environment();
  const apiKey = env.RESEND_API_KEY;
  const emailFrom = env.EMAIL_FROM || 'Creator OS <hello@creator-os.online>';

  if (!apiKey) throw new Error('Missing RESEND_API_KEY');
  const resend = new Resend(apiKey);

  const html = `
    <h2>Your Creator OS Onboarding Guide</h2>
    <p>Hi ${userName},</p>
    <p>Ready to level up your content workflow? Here are 3 steps to master Creator OS:</p>
    <ol>
      <li><strong>Add your Brand Knowledge:</strong> Go to the Knowledge Vault and feed your guidelines.</li>
      <li><strong>Generate a Campaign:</strong> Use Campaign OS to structure your next launch.</li>
      <li><strong>Write Captions:</strong> Let Caption OS turn your ideas into ready-to-post drafts.</li>
    </ol>
    <p>Need help? Reply to this email and we'll jump in.</p>
    <br/>
    <p>Cheers,</p>
    <p>The Creator OS Team</p>
  `;

  return resend.emails.send({
    from: emailFrom,
    to,
    subject: 'Master your content workflow with Creator OS',
    html,
  });
}

export async function processEmailQueue(supabaseAdmin: any) {
  const env = environment();
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) throw new Error('Missing RESEND_API_KEY');
  
  // 1. Fetch pending emails
  const { data: queue, error: fetchErr } = await supabaseAdmin
    .from('email_queue')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString())
    .limit(10); // Process in smaller batches
    
  if (fetchErr) throw fetchErr;
  if (!queue || queue.length === 0) return { processed: 0 };
  
  let processed = 0;
  
  for (const job of queue) {
    // 2. Lock / Claim the job using optimistic locking
    const { data: claimedJob, error: claimErr } = await supabaseAdmin
      .from('email_queue')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', job.id)
      .eq('status', 'pending')
      .select()
      .single();

    if (claimErr || !claimedJob) {
      // Someone else grabbed it or it's no longer pending, skip it safely
      continue;
    }

    try {
      let sendResult;
      
      if (job.email_type === 'welcome') {
        sendResult = await sendWelcomeEmail(job.email);
      } else if (job.email_type === 'onboarding_step_1') {
        sendResult = await sendOnboardingEmail(job.email);
      } else if (job.email_type === 'test_email') {
        const env = environment();
        const resend = new Resend(env.RESEND_API_KEY);
        sendResult = await resend.emails.send({
          from: env.EMAIL_FROM || 'Creator OS <hello@creator-os.online>',
          to: job.email,
          subject: 'Creator OS Email System Test',
          html: `<p>Hi Saurav,</p><p>This is a controlled test email from the Creator OS email system.</p><p>It confirms that the server-side Resend integration is working correctly.</p><br/><p>— Creator OS</p>`,
        });
      } else {
        throw new Error(`Unknown email_type: ${job.email_type}`);
      }
      
      if (sendResult.error) {
        throw new Error(sendResult.error.message);
      }
      
      // 3. Mark as sent
      await supabaseAdmin
        .from('email_queue')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          provider_message_id: sendResult.data?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', job.id);
        
      processed++;
    } catch (err: any) {
      console.error(`[Email Cron] Failed to send job ${job.id}:`, err);
      
      // 4. Handle Failure & Retries
      const newRetryCount = (job.retry_count || 0) + 1;
      const isFailed = newRetryCount >= 3;
      
      // Calculate backoff if not completely failed
      const nextSchedule = new Date();
      nextSchedule.setMinutes(nextSchedule.getMinutes() + (newRetryCount * 30)); // 30m, 60m backoff

      await supabaseAdmin
        .from('email_queue')
        .update({
          status: isFailed ? 'failed' : 'pending',
          retry_count: newRetryCount,
          error_log: err.message || 'Unknown error',
          scheduled_for: isFailed ? job.scheduled_for : nextSchedule.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', job.id);
    }
  }
  
  return { processed };
}
