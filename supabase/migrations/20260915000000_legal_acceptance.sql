-- Legal Configuration
CREATE TABLE IF NOT EXISTS public.legal_config (
    id INT PRIMARY KEY DEFAULT 1,
    terms_version TEXT NOT NULL,
    privacy_version TEXT NOT NULL,
    require_all_users BOOLEAN NOT NULL DEFAULT FALSE,
    deployed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ensure_single_row CHECK (id = 1)
);

-- Initialize config (to be updated in production)
INSERT INTO public.legal_config (id, terms_version, privacy_version) 
VALUES (1, '2026-09-15', '2026-09-15')
ON CONFLICT (id) DO NOTHING;

-- Revoke all modifications from authenticated/anon roles
REVOKE ALL ON public.legal_config FROM authenticated, anon;
GRANT SELECT ON public.legal_config TO authenticated, anon;


-- Legal Acceptance Ledger
CREATE TABLE IF NOT EXISTS public.user_legal_acceptance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    terms_version TEXT NOT NULL,
    privacy_version TEXT NOT NULL,
    accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address TEXT,
    user_agent TEXT,
    CONSTRAINT unique_user_versions UNIQUE (user_id, terms_version, privacy_version)
);

-- Enable RLS on ledger
ALTER TABLE public.user_legal_acceptance ENABLE ROW LEVEL SECURITY;

-- Users can only view their own acceptances
CREATE POLICY "Users can view own acceptances" 
    ON public.user_legal_acceptance FOR SELECT 
    USING (auth.uid() = user_id);

-- Explicitly disallow direct inserts from the frontend API
-- We enforce that acceptance goes through the `record_legal_acceptance` RPC.


-- Check Legal Requirement Function (Security Definer to query safely)
CREATE OR REPLACE FUNCTION public.requires_legal_acceptance(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_terms TEXT;
    v_privacy TEXT;
    v_require_all BOOLEAN;
    v_deployed_at TIMESTAMPTZ;
    v_user_created_at TIMESTAMPTZ;
    v_has_accepted BOOLEAN;
BEGIN
    SELECT terms_version, privacy_version, require_all_users, deployed_at 
    INTO v_terms, v_privacy, v_require_all, v_deployed_at
    FROM public.legal_config WHERE id = 1;

    IF NOT FOUND THEN
        RETURN FALSE; -- Fail open if no config exists
    END IF;

    -- Has the user accepted current versions?
    SELECT EXISTS (
        SELECT 1 FROM public.user_legal_acceptance
        WHERE user_id = p_user_id
          AND terms_version = v_terms
          AND privacy_version = v_privacy
    ) INTO v_has_accepted;

    IF v_has_accepted THEN
        RETURN FALSE;
    END IF;

    IF v_require_all THEN
        RETURN TRUE;
    END IF;

    -- Grandfathering check
    SELECT created_at INTO v_user_created_at FROM auth.users WHERE id = p_user_id;
    IF v_user_created_at IS NOT NULL AND v_user_created_at < v_deployed_at THEN
        RETURN FALSE;
    END IF;

    RETURN TRUE;
END;
$$;


-- Record Acceptance Function (Security Definer)
CREATE OR REPLACE FUNCTION public.record_legal_acceptance()
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_terms TEXT;
    v_privacy TEXT;
    v_uid UUID;
BEGIN
    v_uid := auth.uid();
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT terms_version, privacy_version INTO v_terms, v_privacy
    FROM public.legal_config WHERE id = 1;

    INSERT INTO public.user_legal_acceptance (user_id, terms_version, privacy_version)
    VALUES (v_uid, v_terms, v_privacy)
    ON CONFLICT (user_id, terms_version, privacy_version) DO NOTHING;

    RETURN TRUE;
END;
$$;


-- Status Endpoint for Frontend
CREATE OR REPLACE FUNCTION public.check_legal_status()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_req BOOLEAN;
    v_terms TEXT;
    v_privacy TEXT;
BEGIN
    v_req := public.requires_legal_acceptance(auth.uid());
    SELECT terms_version, privacy_version INTO v_terms, v_privacy
    FROM public.legal_config WHERE id = 1;
    
    RETURN json_build_object(
        'requires_acceptance', v_req,
        'terms_version', v_terms,
        'privacy_version', v_privacy
    );
END;
$$;


-- Signup Metadata Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user_legal_acceptance()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_terms TEXT;
    v_privacy TEXT;
BEGIN
    -- Only honor 'terms_accepted: true' if it arrives on INSERT for auth.users
    -- This handles the email/password signup flow where the checkbox is required.
    IF (NEW.raw_user_meta_data->>'terms_accepted')::boolean = true THEN
        SELECT terms_version, privacy_version INTO v_terms, v_privacy
        FROM public.legal_config WHERE id = 1;

        INSERT INTO public.user_legal_acceptance (user_id, terms_version, privacy_version)
        VALUES (NEW.id, v_terms, v_privacy)
        ON CONFLICT (user_id, terms_version, privacy_version) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_legal ON auth.users;
CREATE TRIGGER on_auth_user_created_legal
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_legal_acceptance();
