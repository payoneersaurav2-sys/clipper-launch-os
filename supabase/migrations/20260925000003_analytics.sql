-- Product Growth Analytics
CREATE TABLE public.product_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    properties_safe JSONB
);

-- Index for querying
CREATE INDEX idx_product_events_user_id ON public.product_events(user_id);
CREATE INDEX idx_product_events_event_name ON public.product_events(event_name);

-- RLS: users can only see their own events, or admins can see all.
-- But generally, frontend only inserts events. It doesn't read them.
ALTER TABLE public.product_events ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own events
CREATE POLICY "Users can insert their own events"
ON public.product_events
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Allow read for debugging (or admin) but keep it scoped to own for now
CREATE POLICY "Users can read own events"
ON public.product_events
FOR SELECT
TO authenticated
USING (user_id = auth.uid());
