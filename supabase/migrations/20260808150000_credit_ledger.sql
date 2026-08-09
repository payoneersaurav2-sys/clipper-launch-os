-- Creator OS freemium, subscription-credit, and purchased-credit ledger.
-- This follows the entitlement migration and is deliberately append-only.

ALTER TABLE public.subscription_plan_config
  DROP CONSTRAINT IF EXISTS subscription_plan_config_tier_check;
ALTER TABLE public.subscription_plan_config
  ADD CONSTRAINT subscription_plan_config_tier_check
  CHECK (tier IN ('free', 'creator', 'pro', 'agency'));

ALTER TABLE public.ai_usage_events
  DROP CONSTRAINT IF EXISTS ai_usage_events_tier_check;
ALTER TABLE public.ai_usage_events
  ADD CONSTRAINT ai_usage_events_tier_check
  CHECK (tier IN ('free', 'creator', 'pro', 'agency'));

INSERT INTO public.subscription_plan_config (tier, capabilities, limits)
VALUES (
  'free',
  '{"core_ai":true,"campaigns":true,"clip_pipeline":true,"basic_analytics":true,"scheduling":true,"batch_generation":false,"multi_workspace":false,"knowledge_vault":false,"prompt_library":false}'::jsonb,
  '{"workspaces":1,"active_campaigns":1,"content_batch_size":5,"max_output_tokens":4000,"monthly_credits":0}'::jsonb
)
ON CONFLICT (tier) DO UPDATE
SET capabilities = EXCLUDED.capabilities, limits = EXCLUDED.limits, updated_at = NOW();

UPDATE public.subscription_plan_config
SET limits = limits || jsonb_build_object(
  'monthly_credits',
  CASE tier WHEN 'creator' THEN 500 WHEN 'pro' THEN 2000 WHEN 'agency' THEN 7500 ELSE 0 END
)
WHERE tier IN ('creator', 'pro', 'agency');

CREATE TABLE IF NOT EXISTS public.creator_os_credit_operations (
  operation TEXT PRIMARY KEY,
  credits INTEGER NOT NULL CHECK (credits > 0),
  measured_p95_cost_usd NUMERIC(12, 8) NOT NULL CHECK (measured_p95_cost_usd >= 0),
  active BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO public.creator_os_credit_operations (operation, credits, measured_p95_cost_usd) VALUES
  ('idea_generation', 21, 0.00209220),
  ('idea_expansion', 4, 0.00031200),
  ('hook_generation', 6, 0.00050835),
  ('hook_scoring', 2, 0.00019620),
  ('caption_generation', 3, 0.00025740),
  ('caption_variants', 4, 0.00032505),
  ('campaign_strategy', 18, 0.00176520),
  ('campaign_content_plan', 18, 0.00174495),
  ('storyboard_script', 4, 0.00036225),
  ('analytics_analysis', 5, 0.00044010),
  ('knowledge_answer', 3, 0.00028065)
ON CONFLICT (operation) DO UPDATE
SET credits = EXCLUDED.credits, measured_p95_cost_usd = EXCLUDED.measured_p95_cost_usd, active = TRUE;

-- This is deliberately separate from subscription plan mappings: these Whop plans
-- are one-off capacity packs, not Creator/Pro/Agency access plans.
CREATE TABLE IF NOT EXISTS public.creator_os_credit_pack_mappings (
  whop_plan_id TEXT PRIMARY KEY,
  credits INTEGER NOT NULL CHECK (credits > 0),
  usd_price NUMERIC(10, 2) NOT NULL CHECK (usd_price > 0),
  active BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO public.creator_os_credit_pack_mappings (whop_plan_id, credits, usd_price) VALUES
  ('plan_pHajojZffyDxv', 1000, 9),
  ('plan_5IB8JVbpg8rik', 5000, 29),
  ('plan_3SbRI3CB8aiur', 15000, 69),
  ('plan_cpIr2MLFacoNX', 50000, 149),
  ('plan_2eRxyfJ19G1eu', 150000, 299)
ON CONFLICT (whop_plan_id) DO UPDATE
SET credits = EXCLUDED.credits, usd_price = EXCLUDED.usd_price, active = TRUE;

CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount <> 0),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('free_trial_grant', 'subscription_grant', 'credit_purchase', 'ai_usage', 'ai_refund')),
  source TEXT NOT NULL CHECK (source IN ('free', 'subscription', 'purchased', 'usage', 'refund')),
  operation TEXT,
  reference_id TEXT,
  reservation_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS credit_transactions_unique_grant_reference
  ON public.credit_transactions (user_id, transaction_type, reference_id)
  WHERE reference_id IS NOT NULL
    AND transaction_type IN ('free_trial_grant', 'subscription_grant', 'credit_purchase');
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_created
  ON public.credit_transactions (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.credit_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES public.credit_transactions(id) ON DELETE RESTRICT,
  source TEXT NOT NULL CHECK (source IN ('free', 'subscription', 'purchased', 'refund')),
  granted_credits INTEGER NOT NULL CHECK (granted_credits > 0),
  remaining_credits INTEGER NOT NULL CHECK (remaining_credits >= 0),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_credit_lots_available
  ON public.credit_lots (user_id, source, expires_at, created_at)
  WHERE remaining_credits > 0;

CREATE TABLE IF NOT EXISTS public.credit_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  operation TEXT NOT NULL REFERENCES public.creator_os_credit_operations(operation),
  credits INTEGER NOT NULL CHECK (credits > 0),
  state TEXT NOT NULL DEFAULT 'reserved' CHECK (state IN ('reserved', 'completed', 'released')),
  allocations JSONB NOT NULL DEFAULT '[]'::jsonb,
  ai_usage_event_id UUID REFERENCES public.ai_usage_events(id) ON DELETE SET NULL,
  provider_request_id TEXT,
  actual_cost_usd NUMERIC(12, 8),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_credit_reservations_user_created
  ON public.credit_reservations (user_id, created_at DESC);

ALTER TABLE public.creator_os_credit_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_os_credit_pack_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_reservations ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.creator_os_has_access(profile public.users)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT profile.subscription_tier = 'free'
    OR (
      profile.membership_status IN ('active', 'trialing', 'past_due', 'completed')
      AND (profile.membership_expires_at IS NULL OR profile.membership_expires_at > NOW())
    );
$$;

CREATE OR REPLACE FUNCTION public.grant_creator_os_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_transaction_type TEXT,
  p_source TEXT,
  p_reference_id TEXT,
  p_expires_at TIMESTAMPTZ DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE transaction_id UUID;
BEGIN
  IF p_amount <= 0 THEN RAISE EXCEPTION 'Credit grant must be positive'; END IF;
  INSERT INTO public.credit_transactions (user_id, amount, transaction_type, source, reference_id, metadata)
  VALUES (p_user_id, p_amount, p_transaction_type, p_source, p_reference_id, p_metadata)
  ON CONFLICT (user_id, transaction_type, reference_id)
    WHERE reference_id IS NOT NULL
      AND transaction_type IN ('free_trial_grant', 'subscription_grant', 'credit_purchase')
  DO NOTHING
  RETURNING id INTO transaction_id;

  IF transaction_id IS NULL THEN RETURN NULL; END IF;
  INSERT INTO public.credit_lots (user_id, transaction_id, source, granted_credits, remaining_credits, expires_at)
  VALUES (p_user_id, transaction_id, p_source, p_amount, p_amount, p_expires_at);
  RETURN transaction_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_creator_os_free_trial()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE profile public.users%ROWTYPE;
BEGIN
  SELECT * INTO profile FROM public.users WHERE id = auth.uid() FOR UPDATE;
  IF NOT FOUND OR profile.subscription_tier <> 'free' THEN RETURN; END IF;
  PERFORM public.grant_creator_os_credits(
    auth.uid(), 100, 'free_trial_grant', 'free', 'free-trial-v1', NULL,
    jsonb_build_object('one_time', true)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.grant_creator_os_subscription_credits(
  p_user_id UUID, p_tier TEXT, p_membership_id TEXT, p_period_end TIMESTAMPTZ
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE allocation INTEGER;
BEGIN
  SELECT COALESCE((limits->>'monthly_credits')::INTEGER, 0) INTO allocation
  FROM public.subscription_plan_config WHERE tier = p_tier;
  IF allocation <= 0 THEN RETURN NULL; END IF;
  RETURN public.grant_creator_os_credits(
    p_user_id, allocation, 'subscription_grant', 'subscription',
    p_membership_id || ':' || COALESCE(p_period_end::TEXT, 'open-ended'),
    p_period_end, jsonb_build_object('tier', p_tier, 'membershipId', p_membership_id)
  );
END;
$$;

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
  IF profile.subscription_tier = 'free' THEN PERFORM public.ensure_creator_os_free_trial(); END IF;
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

CREATE OR REPLACE FUNCTION public.reserve_creator_os_credits(p_operation TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile public.users%ROWTYPE;
  operation_row public.creator_os_credit_operations%ROWTYPE;
  lot RECORD;
  amount_to_take INTEGER;
  remaining_to_take INTEGER;
  allocation JSONB := '[]'::jsonb;
  reservation_id UUID;
  available_credits INTEGER;
BEGIN
  SELECT * INTO profile FROM public.users WHERE id = auth.uid() FOR UPDATE;
  IF FOUND AND profile.subscription_tier <> 'free'
    AND profile.membership_expires_at IS NOT NULL
    AND profile.membership_expires_at <= NOW() THEN
    UPDATE public.users
    SET subscription_tier = 'free', membership_status = 'inactive', entitlement_updated_at = NOW(), updated_at = NOW()
    WHERE id = profile.id
    RETURNING * INTO profile;
  END IF;
  IF NOT FOUND OR NOT public.creator_os_has_access(profile) THEN
    RETURN jsonb_build_object('allowed', false, 'code', 'SUBSCRIPTION_REQUIRED');
  END IF;
  IF profile.subscription_tier = 'free' THEN PERFORM public.ensure_creator_os_free_trial(); END IF;

  SELECT * INTO operation_row FROM public.creator_os_credit_operations
  WHERE operation = p_operation AND active = TRUE;
  IF NOT FOUND THEN RETURN jsonb_build_object('allowed', false, 'code', 'CREDIT_OPERATION_UNAVAILABLE'); END IF;

  SELECT COALESCE(SUM(remaining_credits), 0) INTO available_credits
  FROM public.credit_lots
  WHERE user_id = auth.uid()
    AND remaining_credits > 0
    AND (expires_at IS NULL OR expires_at > NOW());
  IF available_credits < operation_row.credits THEN
    RETURN jsonb_build_object(
      'allowed', false, 'code', 'INSUFFICIENT_CREDITS',
      'required', operation_row.credits, 'available', available_credits
    );
  END IF;

  remaining_to_take := operation_row.credits;
  FOR lot IN
    SELECT id, remaining_credits
    FROM public.credit_lots
    WHERE user_id = auth.uid()
      AND remaining_credits > 0
      AND (expires_at IS NULL OR expires_at > NOW())
    ORDER BY CASE source WHEN 'free' THEN 1 WHEN 'subscription' THEN 2 WHEN 'refund' THEN 3 ELSE 4 END, created_at, id
    FOR UPDATE
  LOOP
    EXIT WHEN remaining_to_take = 0;
    amount_to_take := LEAST(lot.remaining_credits, remaining_to_take);
    UPDATE public.credit_lots SET remaining_credits = remaining_credits - amount_to_take WHERE id = lot.id;
    allocation := allocation || jsonb_build_array(jsonb_build_object('lotId', lot.id, 'credits', amount_to_take));
    remaining_to_take := remaining_to_take - amount_to_take;
  END LOOP;

  INSERT INTO public.credit_reservations (user_id, operation, credits, allocations)
  VALUES (auth.uid(), operation_row.operation, operation_row.credits, allocation)
  RETURNING id INTO reservation_id;
  INSERT INTO public.credit_transactions (user_id, amount, transaction_type, source, operation, reservation_id, metadata)
  VALUES (auth.uid(), -operation_row.credits, 'ai_usage', 'usage', operation_row.operation, reservation_id, jsonb_build_object('state', 'reserved'));
  RETURN jsonb_build_object(
    'allowed', true, 'reservationId', reservation_id, 'credits', operation_row.credits,
    'available', available_credits - operation_row.credits
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_creator_os_credit_reservation(
  p_reservation_id UUID, p_provider_request_id TEXT, p_actual_cost_usd NUMERIC, p_ai_usage_event_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.credit_reservations
  SET state = 'completed', provider_request_id = p_provider_request_id, actual_cost_usd = p_actual_cost_usd,
      ai_usage_event_id = p_ai_usage_event_id, completed_at = NOW()
  WHERE id = p_reservation_id AND user_id = auth.uid() AND state = 'reserved';
END;
$$;

CREATE OR REPLACE FUNCTION public.release_creator_os_credit_reservation(p_reservation_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE reservation public.credit_reservations%ROWTYPE; allocation JSONB; item JSONB;
BEGIN
  SELECT * INTO reservation FROM public.credit_reservations
  WHERE id = p_reservation_id AND user_id = auth.uid() AND state = 'reserved' FOR UPDATE;
  IF NOT FOUND THEN RETURN; END IF;
  FOR item IN SELECT value FROM jsonb_array_elements(reservation.allocations)
  LOOP
    UPDATE public.credit_lots
    SET remaining_credits = remaining_credits + (item->>'credits')::INTEGER
    WHERE id = (item->>'lotId')::UUID AND user_id = auth.uid();
  END LOOP;
  UPDATE public.credit_reservations SET state = 'released', released_at = NOW() WHERE id = reservation.id;
  INSERT INTO public.credit_transactions (user_id, amount, transaction_type, source, operation, reservation_id, metadata)
  VALUES (auth.uid(), reservation.credits, 'ai_refund', 'refund', reservation.operation, reservation.id, jsonb_build_object('reason', 'provider_failure'));
END;
$$;

-- Only narrowly scoped, user-bound read/reserve functions are callable by the client.
REVOKE ALL ON FUNCTION public.grant_creator_os_credits(UUID, INTEGER, TEXT, TEXT, TEXT, TIMESTAMPTZ, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.grant_creator_os_subscription_credits(UUID, TEXT, TEXT, TIMESTAMPTZ) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.ensure_creator_os_free_trial() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.creator_os_credit_balance() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reserve_creator_os_credits(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.complete_creator_os_credit_reservation(UUID, TEXT, NUMERIC, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.release_creator_os_credit_reservation(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.grant_creator_os_credits(UUID, INTEGER, TEXT, TEXT, TEXT, TIMESTAMPTZ, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.grant_creator_os_subscription_credits(UUID, TEXT, TEXT, TIMESTAMPTZ) TO service_role;
GRANT EXECUTE ON FUNCTION public.ensure_creator_os_free_trial() TO authenticated;
GRANT EXECUTE ON FUNCTION public.creator_os_credit_balance() TO authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_creator_os_credits(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_creator_os_credit_reservation(UUID, TEXT, NUMERIC, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.release_creator_os_credit_reservation(UUID) TO authenticated;

-- Existing entitlement functions must also recognize the free trial tier.
CREATE OR REPLACE FUNCTION public.current_creator_os_entitlements()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE profile public.users%ROWTYPE; plan public.subscription_plan_config%ROWTYPE;
BEGIN
  SELECT * INTO profile FROM public.users WHERE id = auth.uid();
  IF FOUND AND profile.subscription_tier <> 'free'
    AND profile.membership_expires_at IS NOT NULL
    AND profile.membership_expires_at <= NOW() THEN
    profile.subscription_tier := 'free';
    profile.membership_status := 'inactive';
  END IF;
  IF NOT FOUND OR NOT public.creator_os_has_access(profile) THEN RETURN jsonb_build_object('status', 'unsubscribed'); END IF;
  SELECT * INTO plan FROM public.subscription_plan_config WHERE tier = profile.subscription_tier;
  IF NOT FOUND THEN RETURN jsonb_build_object('status', 'unknown'); END IF;
  RETURN jsonb_build_object('status', 'active', 'tier', plan.tier, 'capabilities', plan.capabilities, 'limits', plan.limits, 'membershipExpiresAt', profile.membership_expires_at);
END; $$;

-- Keep existing workspace, campaign, and batch-limit triggers aligned with the
-- free tier. The original entitlement function only considered paid memberships.
CREATE OR REPLACE FUNCTION public.creator_os_current_limit(p_key TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE profile public.users%ROWTYPE; value INTEGER;
BEGIN
  SELECT * INTO profile FROM public.users WHERE id = auth.uid();
  IF NOT FOUND OR NOT public.creator_os_has_access(profile) THEN RETURN 0; END IF;
  SELECT COALESCE((limits ->> p_key)::INTEGER, 0) INTO value
  FROM public.subscription_plan_config WHERE tier = profile.subscription_tier;
  RETURN COALESCE(value, 0);
END;
$$;
