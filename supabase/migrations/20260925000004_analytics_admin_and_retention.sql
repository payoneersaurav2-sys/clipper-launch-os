-- Add Admin SELECT policy for product_events to enable admin analytics
CREATE POLICY "Admins can view all product events"
ON public.product_events
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.is_admin = true
  )
);

-- Note: 12-month data retention for product_events requires a cron job.
-- If pg_cron is enabled in this Supabase project, the following job will run daily:
--
-- SELECT cron.schedule(
--   'product-events-retention',
--   '0 3 * * *', -- Every day at 3 AM
--   $$
--     DELETE FROM public.product_events WHERE occurred_at < NOW() - INTERVAL '12 months';
--   $$
-- );
