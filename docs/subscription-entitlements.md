# Creator OS subscription entitlements

## Authority and flow

Whop is the paid-billing authority. Creator OS never infers an upgrade, a purchase, or access beyond the free allowance from a checkout URL, local storage, or a value sent from the browser.

1. Whop authentication identifies a Whop user.
2. The server calls Whop's memberships API for that user.
3. An account with no paid membership receives the explicit `free` tier; active, trialing, past_due, or completed memberships with a mapped Whop plan ID receive their paid tier.
4. The server stores the membership ID, plan ID, tier, status, and expiry on public.users.
5. PostgreSQL uses that server-managed state to enforce database limits; the AI API atomically reserves credits through a protected RPC before contacting OpenRouter.
6. Signed Whop membership and payment webhooks keep access, monthly allocations, and verified credit purchases fresh.

Unknown, expired, canceled, or unmapped paid memberships fail closed to paid access. A user who has only the free tier can use the one-time free allowance.

## Credits

`20260808150000_credit_ledger.sql` adds an append-only ledger and credit lots. It grants exactly 100 one-time free credits, then grants 500 / 2,000 / 7,500 subscription credits per verified Creator / Pro / Agency billing period. Purchased lots never expire; subscription lots expire at their supplied billing-period end.

| AI operation | Credits | Measured P95 OpenRouter cost |
| --- | ---: | ---: |
| Idea generation | 21 | $0.00209220 |
| Idea expansion | 4 | $0.00031200 |
| Hook generation | 6 | $0.00050835 |
| Hook scoring | 2 | $0.00019620 |
| Caption generation | 3 | $0.00025740 |
| Caption variants | 4 | $0.00032505 |
| Campaign strategy | 18 | $0.00176520 |
| Campaign content plan | 18 | $0.00174495 |
| Storyboard/script | 4 | $0.00036225 |
| Analytics analysis | 5 | $0.00044010 |
| Knowledge answer | 3 | $0.00028065 |

Credit-pack plan IDs are server-mapped only: 1,000 / $9 = `plan_pHajojZffyDxv`; 5,000 / $29 = `plan_5IB8JVbpg8rik`; 15,000 / $69 = `plan_3SbRI3CB8aiur`; 50,000 / $149 = `plan_cpIr2MLFacoNX`; 150,000 / $299 = `plan_2eRxyfJ19G1eu`.

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

1. Apply 20260808140000_subscription_entitlements.sql and then 20260808150000_credit_ledger.sql after the prior migrations.
2. Confirm the six plan IDs in Whop are exactly the plans above.
3. Ensure the existing WHOP_API_KEY can read memberships.
4. Deploy the updated whop-auth and whop-iframe-auth functions.
5. Deploy whop-membership-webhook, set WHOP_WEBHOOK_SECRET, and configure Whop to send membership lifecycle events plus `payment.succeeded` to it.
6. Verify free, Creator, Pro, Agency, canceled, expired, unknown-plan, successful-credit-purchase, failed-payment, and replayed-webhook accounts in Whop before enabling customer access.

No plan is granted when any of these lookups fail.

## Test checklist

- Free: exactly 100 credits once, 1 workspace, 1 active campaign, up to 5 content items per insert; verify repeated balance calls do not create a second grant.
- Creator / Pro / Agency: 500 / 2,000 / 7,500 monthly credits and their existing capacity limits.
- Successful credit payment: one purchased lot matching the plan mapping; failed payments add nothing; a replayed event adds nothing.
- Insufficient balance: the AI API returns `INSUFFICIENT_CREDITS` before contacting OpenRouter; provider failures release the reservation.
- Expired/canceled/unknown paid membership: no paid access and no future monthly grant; purchased lots are retained.
- Direct Supabase insert attempts beyond workspace, campaign, or batch limits fail with PLAN_LIMIT_REACHED.
- Replayed/invalid webhook requests are rejected; duplicate valid events are idempotent.
