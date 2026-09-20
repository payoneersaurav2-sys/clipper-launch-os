-- 1. Add is_admin to users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- 2. Create review status enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'review_status') THEN
        CREATE TYPE review_status AS ENUM ('pending', 'approved', 'rejected', 'hidden');
    END IF;
END$$;

-- 3. Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    handle TEXT,
    role TEXT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT NOT NULL CHECK (char_length(review_text) >= 10 AND char_length(review_text) <= 1000),
    avatar_url TEXT,
    status review_status NOT NULL DEFAULT 'pending',
    is_featured BOOLEAN NOT NULL DEFAULT false,
    verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    UNIQUE(user_id)
);

-- 4. Set up RLS for reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reviews are viewable by everyone."
ON public.reviews FOR SELECT
USING (status = 'approved');

CREATE POLICY "Users can view their own reviews."
ON public.reviews FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own review."
ON public.reviews FOR INSERT
WITH CHECK (
    auth.uid() = user_id 
    AND status = 'pending' 
    AND is_featured = false 
    AND verified = false
);

CREATE POLICY "Users can update their own review."
ON public.reviews FOR UPDATE
USING (auth.uid() = user_id AND NOT (SELECT is_admin FROM public.users WHERE id = auth.uid()))
WITH CHECK (
    auth.uid() = user_id 
    AND status = 'pending' 
    AND is_featured = false
);

-- Admin policies
CREATE POLICY "Admins can do everything on reviews."
ON public.reviews FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND is_admin = true
    )
);

-- 5. Triggers to enforce read-only columns for non-admins and auto-verification
CREATE OR REPLACE FUNCTION public.handle_review_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_membership_status TEXT;
BEGIN
    SELECT membership_status INTO v_membership_status FROM public.users WHERE id = NEW.user_id;
    NEW.verified := (v_membership_status = 'active');
    NEW.status := 'pending';
    NEW.is_featured := false;
    NEW.approved_at := NULL;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_review_insert
BEFORE INSERT ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.handle_review_insert();

CREATE OR REPLACE FUNCTION public.handle_review_update()
RETURNS TRIGGER AS $$
BEGIN
    -- If user is updating their own review (not an admin overriding it):
    IF auth.uid() = NEW.user_id AND NOT (SELECT is_admin FROM public.users WHERE id = auth.uid()) THEN
        NEW.status := 'pending';
        NEW.is_featured := false;
        NEW.verified := OLD.verified;
        NEW.approved_at := NULL;
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_review_update
BEFORE UPDATE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.handle_review_update();

-- 6. Helper function to check if a user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_is_admin BOOLEAN;
BEGIN
    SELECT is_admin INTO v_is_admin FROM public.users WHERE id = auth.uid();
    RETURN COALESCE(v_is_admin, false);
END;
$$;
