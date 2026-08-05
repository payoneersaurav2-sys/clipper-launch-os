-- Fix: Allow users to insert their own row in public.users
-- Without this, the onboarding upsert fails for new users because
-- the RLS only had SELECT and UPDATE policies, not INSERT.

CREATE POLICY "Users can insert their own profile" ON public.users 
FOR INSERT WITH CHECK (auth.uid() = id);
