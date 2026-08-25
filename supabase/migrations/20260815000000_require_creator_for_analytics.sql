-- Analytics is a Creator-tier feature. Free plans should not expose it in the entitlement matrix.
UPDATE public.subscription_plan_config
SET capabilities = jsonb_set(capabilities, '{basic_analytics}', 'false'::jsonb, true)
WHERE tier = 'free';
