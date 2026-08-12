-- Dynamic credit reservation and credit cost updates
-- Grants a quantity-aware reservation RPC and updates operation costs

-- Update operation credits to commercial pricing
UPDATE public.creator_os_credit_operations
SET credits = CASE operation
  WHEN 'idea_generation' THEN 4
  WHEN 'idea_expansion' THEN 4
  WHEN 'hook_generation' THEN 6
  WHEN 'hook_scoring' THEN 2
  WHEN 'caption_generation' THEN 3
  WHEN 'caption_variants' THEN 4
  WHEN 'campaign_strategy' THEN 18
  WHEN 'campaign_content_plan' THEN 18
  WHEN 'storyboard_script' THEN 4
  WHEN 'analytics_analysis' THEN 5
  WHEN 'knowledge_answer' THEN 15
  WHEN 'prompt_library_execution' THEN 10
  ELSE credits END
WHERE operation IN (
  'idea_generation','idea_expansion','hook_generation','hook_scoring','caption_generation','caption_variants','campaign_strategy','campaign_content_plan','storyboard_script','analytics_analysis','knowledge_answer','prompt_library_execution'
);

-- Create quantity-aware reservation function
CREATE OR REPLACE FUNCTION public.reserve_creator_os_credits_with_quantity(p_operation TEXT, p_quantity INTEGER)
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
  required_credits INTEGER;
BEGIN
  IF p_quantity IS NULL OR p_quantity < 1 THEN p_quantity := 1; END IF;

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

  required_credits := operation_row.credits * p_quantity;

  SELECT COALESCE(SUM(remaining_credits), 0) INTO available_credits
  FROM public.credit_lots
  WHERE user_id = auth.uid()
    AND remaining_credits > 0
    AND (expires_at IS NULL OR expires_at > NOW());
  IF available_credits < required_credits THEN
    RETURN jsonb_build_object(
      'allowed', false, 'code', 'INSUFFICIENT_CREDITS',
      'required', required_credits, 'available', available_credits
    );
  END IF;

  remaining_to_take := required_credits;
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
  VALUES (auth.uid(), operation_row.operation, required_credits, allocation)
  RETURNING id INTO reservation_id;
  INSERT INTO public.credit_transactions (user_id, amount, transaction_type, source, operation, reservation_id, metadata)
  VALUES (auth.uid(), -required_credits, 'ai_usage', 'usage', operation_row.operation, reservation_id, jsonb_build_object('state', 'reserved', 'quantity', p_quantity));
  RETURN jsonb_build_object(
    'allowed', true, 'reservationId', reservation_id, 'credits', required_credits,
    'available', available_credits - required_credits
  );
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_creator_os_credits_with_quantity(TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reserve_creator_os_credits_with_quantity(TEXT, INTEGER) TO authenticated;
