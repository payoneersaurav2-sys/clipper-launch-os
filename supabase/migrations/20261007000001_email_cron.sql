-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS supabase_vault;

-- Schedule the cron job to run every 15 minutes
SELECT cron.schedule(
  'process-email-queue',
  '*/15 * * * *',
  $$
    DO $block$
    DECLARE
      v_cron_secret TEXT;
      v_webhook_url TEXT := 'https://creator-os.online/api/cron';
      v_request_id BIGINT;
    BEGIN
      -- Retrieve secret from vault
      -- The user must add this secret manually in the Supabase Dashboard:
      -- INSERT INTO vault.secrets (name, secret) VALUES ('cron_secret', 'your_secret_here');
      SELECT secret INTO v_cron_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret' LIMIT 1;
      
      IF v_cron_secret IS NULL THEN
        RAISE WARNING 'Cron secret not found in vault.secrets under name "cron_secret"';
        RETURN;
      END IF;

      -- Fire HTTP POST via pg_net
      SELECT net.http_post(
          url := v_webhook_url,
          headers := jsonb_build_object(
            'Authorization', 'Bearer ' || v_cron_secret,
            'Content-Type', 'application/json'
          ),
          body := '{}'::jsonb
      ) INTO v_request_id;
    END;
    $block$;
  $$
);
