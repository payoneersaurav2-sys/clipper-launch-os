-- Add is_admin column if it doesn't already exist from the previous migrations
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
