-- Creator OS subscription entitlements.
-- This migration is deliberately additive. Apply it through the normal Supabase
-- migration process only after WHOP_* plan configuration is reviewed.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS whop_membership_id TEXT,
  ADD COLUMN IF NOT EXISTS whop_plan_id TEXT,
  ADD COLUMN IF NOT EXISTS membership_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS entitlement_updated_at TIMESTAMPTZ;

-- subscription_tier already exists in the initial schema and is the canonical
-- local plan field. It is managed exclusively by the Whop server integration.
CREATE TABLE IF NOT EXISTS public.subscription_plan_config (
  tier TEXT PRIMARY KEY CHECK (tier IN ('creator', 'pro', 'agency')),
  capabilities JSONB NOT NULL,
  limits JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.whop_plan_mappings (
  whop_plan_id TEXT PRIMARY KEY,
  tier TEXT NOT NULL REFERENCES public.subscription_plan_config(tier) ON DELETE CASCADE,
  billing_interval TEXT NOT NULL CHECK (billing_interval IN ('monthly', 'annual')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Limits are capacity safeguards, not token-based billing. They are intentionally
-- generous relative to the measured OpenRouter costs and can be adjusted in this
-- one table without changing application code.
INSERT INTO public.subscription_plan_config (tier, capabilities, limits)
VALUES
  ('creator',
    '{"core_ai":true,"campaigns":true,"clip_pipeline":true,"basic_analytics":true,"scheduling":true,"batch_generation":false,"multi_workspace":false,"knowledge_vault":true,"prompt_library":true}'::jsonb,
    '{"workspaces":1,"active_campaigns":10,"ai_generations_per_month":250,"content_batch_size":10,"max_output_tokens":4000}'::jsonb),
  ('pro',
    '{"core_ai":true,"campaigns":true,"clip_pipeline":true,"basic_analytics":true,"scheduling":true,"batch_generation":true,"multi_workspace":true,"knowledge_vault":true,"prompt_library":true}'::jsonb,
    '{"workspaces":3,"active_campaigns":50,"ai_generations_per_month":1000,"content_batch_size":30,"max_output_tokens":8000}'::jsonb),
  ('agency',
    '{"core_ai":true,"campaigns":true,"clip_pipeline":true,"basic_analytics":true,"scheduling":true,"batch_generation":true,"multi_workspace":true,"knowledge_vault":true,"prompt_library":true}'::jsonb,
    '{"workspaces":10,"active_campaigns":250,"ai_generations_per_month":3000,"content_batch_size":50,"max_output_tokens":8000}'::jsonb)
ON CONFLICT (tier) DO UPDATE
SET capabilities = EXCLUDED.capabilities, limits = EXCLUDED.limits, updated_at = NOW();

-- These IDs are the six assigned plan IDs in apps/web/src/lib/pricing.ts.
-- The duplicate, unassigned source #5 is intentionally not mapped.
INSERT INTO public.whop_plan_mappings (whop_plan_id, tier, billing_interval)
VALUES
  ('plan_aebXspbqY5fMR', 'creator', 'monthly'),
  ('plan_qDlONxyQFdDMf', 'creator', 'annual'),
  ('plan_DqQz98z72Us8l', 'pro', 'monthly'),
  ('plan_FAWP5M3r4he3u', 'pro', 'annual'),
  ('plan_JBRDyCvvE29lS', 'agency', 'monthly'),
  ('plan_dPUk9DgQILIsi', 'agency', 'annual')
ON CONFLICT (whop_plan_id) DO UPDATE
SET tier = EXCLUDED.tier, billing_interval = EXCLUDED.billing_interval, updated_at = NOW();

CREATE TABLE IF NOT EXISTS public.ai_usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('creator', 'pro', 'agency')),
  operation TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'reserved' CHECK (state IN ('reserved', 'completed')),
  provider_request_id TEXT,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.whop_webhook_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_events_user_period
  ON public.ai_usage_events (user_id, created_at DESC);

ALTER TABLE public.subscription_plan_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whop_plan_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whop_webhook_events ENABLE ROW LEVEL SECURITY;

-- No direct client policies are created for subscription configuration or usage.
-- Only SECURITY DEFINER functions and service-role Whop synchronization may mutate
-- these tables.

CREATE OR REPLACE FUNCTION public.current_creator_os_entitlements()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile public.users%ROWTYPE;
  plan public.subscription_plan_config%ROWTYPE;
BEGIN
  SELECT * INTO profile FROM public.users WHERE id = auth.uid();
  IF NOT FOUND
    OR profile.membership_status NOT IN ('active', 'trialing', 'past_due', 'completed')
    OR (profile.membership_expires_at IS NOT NULL AND profile.membership_expires_at <= NOW()) THEN
    RETURN jsonb_build_object('status', 'unsubscribed');
  END IF;

  SELECT * INTO plan FROM public.subscription_plan_config WHERE tier = profile.subscription_tier;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'unknown');
  END IF;

  RETURN jsonb_build_object(
    'status', 'active',
    'tier', plan.tier,
    'capabilities', plan.capabilities,
    'limits', plan.limits,
    'membershipExpiresAt', profile.membership_expires_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.reserve_ai_generation(p_operation TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile public.users%ROWTYPE;
  plan public.subscription_plan_config%ROWTYPE;
  usage_count INTEGER;
  monthly_limit INTEGER;
  event_id UUID;
BEGIN
  IF p_operation IS NULL OR length(trim(p_operation)) = 0 OR length(p_operation) > 64 THEN
    RAISE EXCEPTION 'Invalid AI operation';
  END IF;

  SELECT * INTO profile FROM public.users WHERE id = auth.uid() FOR UPDATE;
  IF NOT FOUND
    OR profile.membership_status NOT IN ('active', 'trialing', 'past_due', 'completed')
    OR (profile.membership_expires_at IS NOT NULL AND profile.membership_expires_at <= NOW()) THEN
    RETURN jsonb_build_object('allowed', false, 'code', 'SUBSCRIPTION_REQUIRED');
  END IF;

  SELECT * INTO plan FROM public.subscription_plan_config WHERE tier = profile.subscription_tier;
  IF NOT FOUND OR COALESCE((plan.capabilities->>'core_ai')::boolean, false) IS NOT TRUE THEN
    RETURN jsonb_build_object('allowed', false, 'code', 'PLAN_NOT_RESOLVED');
  END IF;

  monthly_limit := COALESCE((plan.limits->>'ai_generations_per_month')::integer, 0);
  SELECT count(*) INTO usage_count
  FROM public.ai_usage_events
  WHERE user_id = auth.uid()
    AND created_at >= date_trunc('month', NOW());

  IF usage_count >= monthly_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'code', 'PLAN_LIMIT_REACHED',
      'limit', monthly_limit,
      'used', usage_count,
      'tier', plan.tier,
      'maxOutputTokens', COALESCE((plan.limits->>'max_output_tokens')::integer, 4000)
    );
  END IF;

  INSERT INTO public.ai_usage_events (user_id, tier, operation)
  VALUES (auth.uid(), plan.tier, trim(p_operation))
  RETURNING id INTO event_id;

  RETURN jsonb_build_object(
    'allowed', true,
    'eventId', event_id,
    'tier', plan.tier,
    'limit', monthly_limit,
    'used', usage_count + 1,
    'maxOutputTokens', COALESCE((plan.limits->>'max_output_tokens')::integer, 4000)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_ai_generation(
  p_event_id UUID,
  p_provider_request_id TEXT,
  p_prompt_tokens INTEGER,
  p_completion_tokens INTEGER,
  p_total_tokens INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.ai_usage_events
  SET state = 'completed',
      provider_request_id = p_provider_request_id,
      prompt_tokens = GREATEST(COALESCE(p_prompt_tokens, 0), 0),
      completion_tokens = GREATEST(COALESCE(p_completion_tokens, 0), 0),
      total_tokens = GREATEST(COALESCE(p_total_tokens, 0), 0),
      completed_at = NOW()
  WHERE id = p_event_id AND user_id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.release_ai_generation(p_event_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.ai_usage_events
  WHERE id = p_event_id
    AND user_id = auth.uid()
    AND state = 'reserved'
    AND created_at > NOW() - INTERVAL '10 minutes';
END;
$$;

CREATE OR REPLACE FUNCTION public.creator_os_current_limit(p_key TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  plan_limits JSONB;
BEGIN
  SELECT config.limits INTO plan_limits
  FROM public.users profile
  JOIN public.subscription_plan_config config ON config.tier = profile.subscription_tier
  WHERE profile.id = auth.uid()
    AND profile.membership_status IN ('active', 'trialing', 'past_due', 'completed')
    AND (profile.membership_expires_at IS NULL OR profile.membership_expires_at > NOW());
  RETURN COALESCE((plan_limits ->> p_key)::INTEGER, 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_workspace_entitlement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  allowed_workspaces INTEGER;
  workspace_count INTEGER;
BEGIN
  IF auth.role() <> 'authenticated' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status NOT IN ('completed', 'archived') THEN RETURN NEW; END IF;
  IF NEW.status IN ('completed', 'archived') THEN RETURN NEW; END IF;
  IF NEW.owner_id <> auth.uid() THEN RAISE EXCEPTION 'Workspace owner must be the signed-in user'; END IF;
  allowed_workspaces := public.creator_os_current_limit('workspaces');
  SELECT count(*) INTO workspace_count
  FROM public.workspaces
  WHERE owner_id = auth.uid() AND deleted_at IS NULL;
  IF allowed_workspaces = 0 THEN RAISE EXCEPTION 'SUBSCRIPTION_REQUIRED'; END IF;
  IF workspace_count >= allowed_workspaces THEN RAISE EXCEPTION 'PLAN_LIMIT_REACHED: workspace limit reached'; END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_campaign_entitlement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  allowed_campaigns INTEGER;
  campaign_count INTEGER;
BEGIN
  IF auth.role() <> 'authenticated' THEN RETURN NEW; END IF;
  allowed_campaigns := public.creator_os_current_limit('active_campaigns');
  IF allowed_campaigns = 0 THEN RAISE EXCEPTION 'SUBSCRIPTION_REQUIRED'; END IF;
  SELECT count(*) INTO campaign_count
  FROM public.campaigns c
  JOIN public.workspaces w ON w.id = c.workspace_id
  WHERE w.owner_id = auth.uid()
    AND c.deleted_at IS NULL
    AND c.status NOT IN ('completed', 'archived');
  IF campaign_count >= allowed_campaigns THEN RAISE EXCEPTION 'PLAN_LIMIT_REACHED: active campaign limit reached'; END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_clip_batch_entitlement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  allowed_batch INTEGER;
  inserted_count INTEGER;
BEGIN
  IF auth.role() <> 'authenticated' THEN RETURN NULL; END IF;
  allowed_batch := public.creator_os_current_limit('content_batch_size');
  SELECT count(*) INTO inserted_count FROM inserted_clips;
  IF allowed_batch = 0 THEN RAISE EXCEPTION 'SUBSCRIPTION_REQUIRED'; END IF;
  IF inserted_count > allowed_batch THEN RAISE EXCEPTION 'PLAN_LIMIT_REACHED: content batch exceeds plan limit'; END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS enforce_workspace_entitlement ON public.workspaces;
CREATE TRIGGER enforce_workspace_entitlement
BEFORE INSERT ON public.workspaces
FOR EACH ROW EXECUTE FUNCTION public.enforce_workspace_entitlement();

DROP TRIGGER IF EXISTS enforce_campaign_entitlement ON public.campaigns;
CREATE TRIGGER enforce_campaign_entitlement
BEFORE INSERT OR UPDATE OF status ON public.campaigns
FOR EACH ROW EXECUTE FUNCTION public.enforce_campaign_entitlement();

DROP TRIGGER IF EXISTS enforce_clip_batch_entitlement ON public.clips;
CREATE TRIGGER enforce_clip_batch_entitlement
AFTER INSERT ON public.clips
REFERENCING NEW TABLE AS inserted_clips
FOR EACH STATEMENT EXECUTE FUNCTION public.enforce_clip_batch_entitlement();

-- Extend the existing server-managed-field protection to subscription data.
CREATE OR REPLACE FUNCTION public.prevent_client_managed_user_field_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF auth.role() = 'authenticated' THEN
    IF TG_OP = 'INSERT' AND (
      COALESCE(NEW.membership_status, 'inactive') <> 'inactive'
      OR NEW.whop_id IS NOT NULL
      OR COALESCE(NEW.subscription_tier, 'free') <> 'free'
      OR NEW.whop_membership_id IS NOT NULL
      OR NEW.whop_plan_id IS NOT NULL
    ) THEN
      RAISE EXCEPTION 'Membership and Whop identity are managed by Creator OS';
    END IF;
    IF TG_OP = 'UPDATE' AND (
      NEW.membership_status IS DISTINCT FROM OLD.membership_status
      OR NEW.whop_id IS DISTINCT FROM OLD.whop_id
      OR NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier
      OR NEW.whop_membership_id IS DISTINCT FROM OLD.whop_membership_id
      OR NEW.whop_plan_id IS DISTINCT FROM OLD.whop_plan_id
      OR NEW.membership_expires_at IS DISTINCT FROM OLD.membership_expires_at
      OR NEW.entitlement_updated_at IS DISTINCT FROM OLD.entitlement_updated_at
    ) THEN
      RAISE EXCEPTION 'Membership and Whop identity are managed by Creator OS';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
