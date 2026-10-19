-- Ensure subscription credits are granted to paid tier users when balance is checked
CREATE OR REPLACE FUNCTION public.creator_os_credit_balance()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE profile public.users%ROWTYPE;
BEGIN
  SELECT * INTO profile FROM public.users WHERE id = auth.uid();
  IF NOT FOUND THEN RETURN jsonb_build_object('status', 'unauthenticated', 'available', 0); END IF;
  
  -- A missed cancellation/expiration webhook must not strand bought credits
  -- behind a stale paid tier. Safely fall back to the free experience here.
  IF profile.subscription_tier <> 'free'
    AND profile.membership_expires_at IS NOT NULL
    AND profile.membership_expires_at <= NOW() THEN
    UPDATE public.users
    SET subscription_tier = 'free', membership_status = 'inactive', entitlement_updated_at = NOW(), updated_at = NOW()
    WHERE id = profile.id
    RETURNING * INTO profile;
  END IF;

  IF profile.subscription_tier = 'free' THEN 
    PERFORM public.ensure_creator_os_free_trial(); 
  ELSIF profile.subscription_tier IN ('creator', 'pro', 'agency') 
    AND profile.membership_status IN ('active', 'trialing') THEN
    PERFORM public.grant_creator_os_subscription_credits(
      profile.id,
      profile.subscription_tier,
      COALESCE(profile.paddle_subscription_id, profile.id::TEXT),
      profile.membership_expires_at
    );
  END IF;

  RETURN (
    SELECT jsonb_build_object(
      'status', CASE WHEN public.creator_os_has_access(profile) THEN 'active' ELSE 'unsubscribed' END,
      'tier', profile.subscription_tier,
      'available', COALESCE(SUM(remaining_credits), 0),
      'free', COALESCE(SUM(remaining_credits) FILTER (WHERE source = 'free'), 0),
      'subscription', COALESCE(SUM(remaining_credits) FILTER (WHERE source = 'subscription'), 0),
      'purchased', COALESCE(SUM(remaining_credits) FILTER (WHERE source = 'purchased'), 0)
    )
    FROM public.credit_lots
    WHERE user_id = auth.uid()
      AND remaining_credits > 0
      AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$;
