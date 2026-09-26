-- Drop the existing SELECT policies
DROP POLICY IF EXISTS "Users can view agencies they belong to" ON public.agencies;
DROP POLICY IF EXISTS "Users can view agency members" ON public.agency_members;

-- Function to check membership without triggering RLS
CREATE OR REPLACE FUNCTION public.check_agency_membership(check_agency_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.agency_members
    WHERE agency_id = check_agency_id AND user_id = auth.uid()
  );
END;
$$;

-- Agencies policy: inline owner check (fixes RETURNING 403), fallback to membership
CREATE POLICY "Users can view agencies they belong to" ON public.agencies
  FOR SELECT USING (
    owner_id = auth.uid() OR public.check_agency_membership(id)
  );

-- Function to check ownership without triggering RLS
CREATE OR REPLACE FUNCTION public.check_agency_ownership(check_agency_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.agencies
    WHERE id = check_agency_id AND owner_id = auth.uid()
  );
END;
$$;

-- Agency members policy: inline user check, fallback to ownership
CREATE POLICY "Users can view agency members" ON public.agency_members
  FOR SELECT USING (
    user_id = auth.uid() OR public.check_agency_ownership(agency_id)
  );
