-- Align subscription plan limits and capabilities to the intended product tiers.
--
-- Free    : all core tools, 1 workspace, 10 active campaigns (previously 1)
-- Creator : 3 workspaces, 50 active campaigns, 30-item content batches,
--           batch_generation + multi_workspace enabled (previously 1/10/false)
-- Pro     : 10 workspaces, 250 active campaigns, 50-item content batches
--           (previously 3/50/30 — these shift up from the old creator tier)
-- Agency  : unchanged — already matches the highest tier

-- Free: raise active_campaigns from 1 → 10
UPDATE public.subscription_plan_config
SET
  capabilities = '{
    "core_ai": true,
    "campaigns": true,
    "clip_pipeline": true,
    "basic_analytics": true,
    "scheduling": true,
    "batch_generation": false,
    "multi_workspace": false
  }'::jsonb,
  limits = '{
    "workspaces": 1,
    "active_campaigns": 10,
    "content_batch_size": 5,
    "max_output_tokens": 4000,
    "monthly_credits": 0
  }'::jsonb,
  updated_at = NOW()
WHERE tier = 'free';

-- Creator: 3 workspaces · 50 campaigns · 30-item batches · batch + multi_workspace on
UPDATE public.subscription_plan_config
SET
  capabilities = '{
    "core_ai": true,
    "campaigns": true,
    "clip_pipeline": true,
    "basic_analytics": true,
    "scheduling": true,
    "batch_generation": true,
    "multi_workspace": true
  }'::jsonb,
  limits = '{
    "workspaces": 3,
    "active_campaigns": 50,
    "ai_generations_per_month": 250,
    "content_batch_size": 30,
    "max_output_tokens": 4000,
    "monthly_credits": 500
  }'::jsonb,
  updated_at = NOW()
WHERE tier = 'creator';

-- Pro: 10 workspaces · 250 campaigns · 50-item batches
UPDATE public.subscription_plan_config
SET
  capabilities = '{
    "core_ai": true,
    "campaigns": true,
    "clip_pipeline": true,
    "basic_analytics": true,
    "scheduling": true,
    "batch_generation": true,
    "multi_workspace": true
  }'::jsonb,
  limits = '{
    "workspaces": 10,
    "active_campaigns": 250,
    "ai_generations_per_month": 1000,
    "content_batch_size": 50,
    "max_output_tokens": 8000,
    "monthly_credits": 2000
  }'::jsonb,
  updated_at = NOW()
WHERE tier = 'pro';

-- Agency: 10 workspaces · 250 campaigns · 50-item batches (kept aligned with pro highest tier)
UPDATE public.subscription_plan_config
SET
  capabilities = '{
    "core_ai": true,
    "campaigns": true,
    "clip_pipeline": true,
    "basic_analytics": true,
    "scheduling": true,
    "batch_generation": true,
    "multi_workspace": true
  }'::jsonb,
  limits = '{
    "workspaces": 10,
    "active_campaigns": 250,
    "ai_generations_per_month": 3000,
    "content_batch_size": 50,
    "max_output_tokens": 8000,
    "monthly_credits": 7500
  }'::jsonb,
  updated_at = NOW()
WHERE tier = 'agency';
