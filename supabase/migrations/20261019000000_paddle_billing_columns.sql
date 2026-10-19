-- Migration: Add Paddle billing columns alongside existing Whop columns.
--
-- IMPORTANT: Whop columns (whop_id, whop_membership_id, whop_plan_id) are NOT
-- removed. Existing Whop customers must remain fully operational in parallel.
--
-- New columns:
--   users.paddle_customer_id      — Paddle customer ID (ctm_...)
--   users.paddle_subscription_id  — Paddle subscription ID (sub_...)
--
-- New table:
--   paddle_webhook_events         — Idempotency store, mirrors whop_webhook_events.

-- ── 1. Extend users table ────────────────────────────────────────────────────

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS paddle_customer_id     TEXT,
  ADD COLUMN IF NOT EXISTS paddle_subscription_id TEXT;

-- Index for webhook lookups by Paddle customer ID.
CREATE INDEX IF NOT EXISTS idx_users_paddle_customer_id
  ON public.users (paddle_customer_id)
  WHERE paddle_customer_id IS NOT NULL;

-- ── 2. Idempotency table ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.paddle_webhook_events (
  id          TEXT        PRIMARY KEY,   -- Paddle notification ID
  event_type  TEXT        NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS (only service-role / SECURITY DEFINER functions should write here).
ALTER TABLE public.paddle_webhook_events ENABLE ROW LEVEL SECURITY;

-- No SELECT/INSERT policies for authenticated users — webhook handler uses service role.
-- Admins can inspect rows directly via the Supabase dashboard with service role.

COMMENT ON TABLE  public.paddle_webhook_events                IS 'Idempotency store for Paddle webhook notifications. Mirrors whop_webhook_events.';
COMMENT ON COLUMN public.paddle_webhook_events.id             IS 'Paddle notification ID (used as idempotency key).';
COMMENT ON COLUMN public.users.paddle_customer_id             IS 'Paddle customer ID (ctm_...). NULL for Whop-only customers.';
COMMENT ON COLUMN public.users.paddle_subscription_id         IS 'Paddle subscription ID (sub_...). NULL for Whop-only customers.';
