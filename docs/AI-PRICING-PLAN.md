# Creator OS AI packaging plan

This is a decision plan, not a production billing or entitlement change. All cost inputs must come from `dev/ai-cost-analyzer` measurements before prices, limits, or credits are finalized.

## Goal

Maximize sustainable gross profit without silently degrading output quality or presenting users with confusing artificial limits. Price the value of a creator workflow; use AI costs as a hard unit-economics guardrail.

## Phase 1 — establish the cost floor

1. Run the local smoke suite with a $2 cap to validate credentials and response quality.
2. Run the five-run small/normal/large baseline with a reviewed cap.
3. Review sample outputs manually for usefulness, JSON validity, and latency; do not choose a cheap model on cost alone.
4. Run model comparisons only for the operations that dominate P95 cost (usually campaign plans and scripts).
5. Treat P95, not average, as the cost basis for included high-variance operations.

Deliverable: local `AI-COST-DATA.json` and `AI-COST-REPORT.md`, ranked expensive to cheap.

## Phase 2 — create profitable allowances

For each prospective plan, choose a target AI gross margin and calculate the maximum included AI cost:

`safe monthly AI cost = monthly plan price × (1 - target gross margin)`

Use 70–80% as the preferred target for paid plans until non-AI costs (Whop fees, payment fees, Supabase, storage, support, refunds, and acquisition) are added. A 50–60% AI-only margin may be too thin once those costs are included.

Convert that cost pool into allowances using measured **P95 cost per operation**. Reserve 15–25% of the pool for retries, unusually long requests, and support goodwill. Never base a plan allowance on average cost alone.

## Recommended packaging shape (pending measurements)

| Package | Customer promise | AI allowance design | Margin guard |
|---|---|---|---|
| Free | Let creators experience a complete small workflow | A tightly capped mix of ideas, hooks, captions and one low-cost production action | No unlimited generation; prevent campaign/script-heavy use |
| Creator | Weekly content workflow | Most allowance weighted to ideas/hooks/captions; a limited number of campaign and script actions | Target 80% AI margin |
| Pro | Daily creator operating system | Higher workflow allowance, campaigns, batch production and analytics analysis | Target 75–80% AI margin |
| Agency | Multi-client throughput | Workspace/client governance plus clearly metered expensive operations | Target 70–75% AI margin; require overage packs |

Do not announce numeric prices, credits, or "unlimited AI" until the measured P95 costs and expected behavior are available.

## Credit design after measurement

Use a transparent internal cost unit rather than arbitrary feature counts:

1. Select a credit value only after the cheapest reliable measured operation is known.
2. Set each operation's credits from its rounded P95 measured cost, including the observed JSON-retry rate.
3. Make expensive operations (campaign plans, scripts/storyboards, batch generations) visibly consume more credits than simple hooks/captions.
4. Keep a 15–25% unallocated reserve in every included plan.
5. Price extra packs so their AI cost remains below the same target margin; packs should be lower value than annual committed usage, not a loss leader.

The eventual customer UI should show remaining generation capacity in understandable operation terms, with credits only as the billing mechanic.

## Maximum-profit safeguards

- Use the lowest-cost model that passes manual quality review for each operation; configure expensive models only where evidence shows a meaningful quality improvement.
- Cap batch sizes and queue/concurrency before they cause surprise spending.
- Meter retries as real cost; do not hide malformed JSON or silently offer unlimited retries.
- Separate `Scheduled` from `Published`; never incur third-party publishing costs under an AI allowance.
- Enforce server-side entitlement checks before every production AI request when billing is implemented. Browser controls are not authorization.
- Review P95 spend, failure rate, retry rate, and output-quality samples monthly; update allowances before changing public price.

## Decision gates

1. **Measurement gate:** baseline and top-cost model comparison complete.
2. **Quality gate:** owner accepts output examples at the selected model.
3. **Unit-economics gate:** plan price covers P95 AI allowance plus all non-AI variable costs at target margin.
4. **Abuse gate:** server-side metering, rate limits, and audited overage behavior are implemented.
5. **Launch gate:** billing/Whop entitlement behavior tested in a non-production environment.

No production billing change is authorized by this document.
