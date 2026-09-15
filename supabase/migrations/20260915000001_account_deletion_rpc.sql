-- Complete server-side account deletion
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, storage
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get the authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. Delete Storage Objects
  -- Deleting from storage.objects triggers Supabase's internal physical deletion
  DELETE FROM storage.objects WHERE owner = v_user_id;

  -- 2. Delete Workspaces & Members (Cascades to campaigns, knowledge_items, etc.)
  DELETE FROM public.workspace_members WHERE user_id = v_user_id;
  DELETE FROM public.workspaces WHERE owner_id = v_user_id;

  -- 3. Delete Credits & Transactions
  DELETE FROM public.credit_transactions WHERE user_id = v_user_id;
  DELETE FROM public.credit_lots WHERE user_id = v_user_id;

  -- 4. Delete Profile
  DELETE FROM public.users WHERE id = v_user_id;

  -- 5. Delete Auth Identity
  -- This is the secure auth.users table
  DELETE FROM auth.users WHERE id = v_user_id;

END;
$$;
