-- Add free-tier Whop plan mapping so the webhook recognizes the free plan.
-- This keeps the free tier functional through the same Whop integration.

INSERT INTO public.subscription_plan_config (tier, capabilities, limits)
VALUES
  ('free',
    '{"core_ai":true,"campaigns":true,"clip_pipeline":true,"basic_analytics":true,"scheduling":true,"batch_generation":false,"multi_workspace":false,"knowledge_vault":false,"prompt_library":false}'::jsonb,
    '{"workspaces":1,"active_campaigns":10,"ai_generations_per_month":0,"content_batch_size":5,"max_output_tokens":4000}'::jsonb)
ON CONFLICT (tier) DO UPDATE
SET capabilities = EXCLUDED.capabilities, limits = EXCLUDED.limits, updated_at = NOW();

INSERT INTO public.whop_plan_mappings (whop_plan_id, tier, billing_interval)
VALUES
  ('plan_b6S1Js9cA0Gne', 'free', 'monthly')
ON CONFLICT (whop_plan_id) DO UPDATE
SET tier = EXCLUDED.tier, billing_interval = EXCLUDED.billing_interval, updated_at = NOW();
