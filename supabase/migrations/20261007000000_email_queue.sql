CREATE TABLE IF NOT EXISTS public.email_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    email_type TEXT NOT NULL,
    scheduled_for TIMESTAMPTZ DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'pending',
    sent_at TIMESTAMPTZ,
    provider_message_id TEXT,
    idempotency_key TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own email queue" 
    ON public.email_queue 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_email_queue_status_scheduled ON public.email_queue(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_email_queue_user_id ON public.email_queue(user_id);
