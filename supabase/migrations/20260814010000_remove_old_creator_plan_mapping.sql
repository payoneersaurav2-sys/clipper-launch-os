-- Remove the stale $19 Creator Whop checkout mapping now that the $29 plan is the active monthly checkout.
DELETE FROM public.whop_plan_mappings
WHERE whop_plan_id = 'plan_x36ZUqtqy8DUf';
