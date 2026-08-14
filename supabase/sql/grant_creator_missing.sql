-- Grant monthly Creator subscription credits to Creator users missing credits
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT u.id
    FROM public.users u
    LEFT JOIN public.credit_lots l ON l.user_id = u.id AND (l.expires_at IS NULL OR l.expires_at > now())
    WHERE u.subscription_tier = 'creator'
    GROUP BY u.id
    HAVING COALESCE(SUM(l.remaining_credits), 0) = 0
  LOOP
    PERFORM grant_creator_os_subscription_credits(r.id, 'creator', NULL, NULL);
    RAISE NOTICE 'Granted Creator credits to %', r.id;
  END LOOP;
END;
$$;

SELECT 'done' as status;
