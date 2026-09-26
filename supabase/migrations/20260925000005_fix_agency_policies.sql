-- Drop the existing SELECT policy
DROP POLICY IF EXISTS "Users can view agencies they belong to" ON public.agencies;

-- Recreate with direct check instead of SECURITY DEFINER function to avoid RETURNING clause issues
CREATE POLICY "Users can view agencies they belong to" ON public.agencies
  FOR SELECT USING (
    owner_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.agency_members
      WHERE agency_id = id AND user_id = auth.uid()
    )
  );

-- Update user_belongs_to_agency to use the same logic directly (optional, but good for consistency)
CREATE OR REPLACE FUNCTION public.user_belongs_to_agency(check_agency_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.agencies
    WHERE id = check_agency_id AND owner_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.agency_members
    WHERE agency_id = check_agency_id AND user_id = auth.uid()
  );
END;
$$;
