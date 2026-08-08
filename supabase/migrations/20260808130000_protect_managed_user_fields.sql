-- Membership and Whop identities are authoritative server-managed fields.
-- Apply this through the normal Supabase migration process when approved.

CREATE OR REPLACE FUNCTION public.prevent_client_managed_user_field_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF auth.role() = 'authenticated' THEN
    IF TG_OP = 'INSERT' AND (
      COALESCE(NEW.membership_status, 'inactive') <> 'inactive'
      OR NEW.whop_id IS NOT NULL
    ) THEN
      RAISE EXCEPTION 'Membership and Whop identity are managed by Creator OS';
    END IF;

    IF TG_OP = 'UPDATE' AND (
      NEW.membership_status IS DISTINCT FROM OLD.membership_status
      OR NEW.whop_id IS DISTINCT FROM OLD.whop_id
    ) THEN
      RAISE EXCEPTION 'Membership and Whop identity are managed by Creator OS';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_client_managed_user_field_changes ON public.users;

CREATE TRIGGER prevent_client_managed_user_field_changes
BEFORE INSERT OR UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.prevent_client_managed_user_field_changes();
