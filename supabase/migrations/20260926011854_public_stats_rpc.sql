-- Migration to add a safe, public endpoint for aggregate counts.
-- This function runs as SECURITY DEFINER, meaning it bypasses RLS,
-- but it ONLY returns an aggregate count (an integer), so it is completely safe to expose to the public.

CREATE OR REPLACE FUNCTION get_public_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_users integer;
BEGIN
  -- Count total users
  SELECT count(*) INTO total_users FROM public.users;
  
  -- Return as JSON
  RETURN json_build_object(
    'total_users', total_users
  );
END;
$$;

-- Grant execute to public/anon
GRANT EXECUTE ON FUNCTION get_public_stats() TO anon;
GRANT EXECUTE ON FUNCTION get_public_stats() TO authenticated;
