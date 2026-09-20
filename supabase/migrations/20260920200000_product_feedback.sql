-- Creator OS: product_feedback table for capturing in-dashboard feedback sentiment

-- 1. Create the product_feedback table
CREATE TABLE IF NOT EXISTS public.product_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  event_type TEXT NOT NULL,
  sentiment TEXT NOT NULL CHECK (sentiment IN ('positive', 'negative')),
  message TEXT CHECK (char_length(message) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.product_feedback ENABLE ROW LEVEL SECURITY;

-- 3. Users can only INSERT their own feedback (cannot read back, cannot update/delete)
CREATE POLICY "Users insert own product feedback"
ON public.product_feedback FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 4. Only admins can SELECT all feedback
CREATE POLICY "Admins read all product feedback"
ON public.product_feedback FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND is_admin = true
  )
);
