-- Update Whop mapping for the Creator plan to the new $29 checkout ID.
INSERT INTO public.whop_plan_mappings (whop_plan_id, tier, billing_interval)
VALUES
  ('plan_aebXspbqY5fMR', 'creator', 'monthly')
ON CONFLICT (whop_plan_id) DO UPDATE
SET tier = EXCLUDED.tier, billing_interval = EXCLUDED.billing_interval, updated_at = NOW();

-- Keep the monthly Creator price metadata in sync with the linked Whop checkout.
UPDATE public.subscription_plan_config
SET capabilities = capabilities,
    limits = limits,
    updated_at = NOW()
WHERE tier = 'creator';
