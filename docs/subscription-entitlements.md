# Creator OS subscription entitlements

## Authority and flow

Whop is the billing authority. Creator OS never infers access from a checkout URL, local storage, or a value sent from the browser.

1. Whop authentication identifies a Whop user.
2. The server calls Whop's memberships API for that user.
3. Only active, trialing, past_due, or completed memberships with a mapped Whop plan ID are accepted.
4. The server stores the membership ID, plan ID, tier, status, and expiry on public.users.
5. PostgreSQL uses that server-managed state to enforce database limits; the AI API reserves capacity through a protected RPC before contacting OpenRouter.
6. Signed Whop membership webhooks keep the state fresh after upgrades, cancellations, and expirations.

Unknown, expired, canceled, or unmapped memberships fail closed.

## Feature matrix

| Feature | Creator | Pro | Agency | Limit/enforcement |
| --- | :---: | :---: | :---: | --- |
| Dashboard, Idea Studio, Hook Engine, Caption OS | Yes | Yes | Yes | 250 / 1,000 / 3,000 AI workflows per month; RPC + API |
| Campaign creation and content workflow | Yes | Yes | Yes | 10 / 50 / 250 active campaigns; database trigger |
| Clip Pipeline and content workspace | Yes | Yes | Yes | Existing workspace RLS plus plan-backed parent operations |
| Content-plan generation | 10 per operation | 30 per operation | 50 per operation | Database statement trigger + UI |
| Scheduling state and media workflow | Yes | Yes | Yes | Existing data model/RLS; no fake publishing entitlement |
| Basic analytics and AI performance reports | Yes | Yes | Yes | AI workflow capacity enforced server-side |
| Multiple workspaces | No | 3 | 10 | Workspace insert trigger + UI guidance |

There is no real social publishing integration or client-management role system in the current product, so neither is advertised as a plan capability.

## Canonical configuration

public.subscription_plan_config is the authoritative runtime entitlement configuration. It contains capabilities and editable limits. public.whop_plan_mappings maps exactly the six assigned Whop plan IDs to a tier:

| Tier | Monthly Whop plan | Annual Whop plan |
| --- | --- | --- |
| Creator | plan_x36ZUqtqy8DUf | plan_qDlONxyQFdDMf |
| Pro | plan_DqQz98z72Us8l | plan_FAWP5M3r4he3u |
| Agency | plan_JBRDyCvvE29lS | plan_dPUk9DgQILIsi |

The duplicate unused checkout URL remains intentionally unmapped.

apps/web/src/lib/entitlements.ts mirrors those values only for UI states. It is never authorization.

## Required production configuration

Before enabling this system:

1. Apply 20260808140000_subscription_entitlements.sql after the prior migrations.
2. Confirm the six plan IDs in Whop are exactly the plans above.
3. Ensure the existing WHOP_API_KEY can read memberships.
4. Deploy the updated whop-auth and whop-iframe-auth functions.
5. Deploy whop-membership-webhook, set WHOP_WEBHOOK_SECRET, and configure Whop to send membership.activated and membership.deactivated events to it.
6. Verify Creator, Pro, Agency, canceled, expired, and unknown-plan accounts in Whop before enabling customer access.

No plan is granted when any of these lookups fail.

## Test checklist

- Creator: 1 workspace, up to 10 active campaigns, 10-item content plans, 250 AI workflows/month.
- Pro: Creator access plus 3 workspaces, 30-item plans, 1,000 AI workflows/month.
- Agency: Pro access plus 10 workspaces, 50-item plans, 3,000 AI workflows/month.
- Unsubscribed/expired/canceled/unknown: no protected access and the AI API returns a controlled entitlement error.
- Direct Supabase insert attempts beyond workspace, campaign, or batch limits fail with PLAN_LIMIT_REACHED.
- Replayed/invalid webhook requests are rejected; duplicate valid events are idempotent.
