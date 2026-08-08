# Campaign OS functionality gap report

Audited against the current source and local Supabase migrations on 2026-08-08.
The codebase is the implementation source of truth; no live Supabase schema or
social-platform credential was available to verify.

## Working

- Campaign CRUD, soft deletion, duplication, dates, and RLS-backed workspace queries.
- `clips` are persisted campaign content records and appear in the responsive Clip Pipeline.
- Manual pipeline movement is persisted; desktop drag/drop and mobile stage actions exist.
- Basic clip metrics (views, likes, comments, shares, revenue) are stored.

## Incomplete

- Campaign creation lacks objective, audience, pillars, frequency, and persisted AI strategy.
- Campaign plans created in Launch Center are local React state only.
- A campaign content row has no production workspace or persisted script/CTA/media workflow.
- Scheduling is only a date field; there is no readiness validation, timezone, or publication state.
- Analytics can aggregate saved records, but the AI report is transient and not based on clip performance.

## Mocked or non-production data

- Dashboard analytic trends/sparklines are presentation data rather than imported platform performance.
- No social platform publisher is implemented; the UI must never claim a post was published automatically.

## Broken lifecycle behavior

- Pipeline stage changes do not validate required production assets.
- "Generate Campaign Plan" does not create a campaign or content records.
- Campaign and pipeline views are linked by IDs, but the content production flow is missing.

## Missing / external dependencies

- Supabase Storage bucket and policy for binary media uploads (the app can only safely persist an attached media URL until configured).
- Official platform OAuth/API integrations and a background scheduler/worker for publication and performance ingestion.
- A server-side AI gateway: the current browser OpenRouter setup remains a security deployment blocker.
- Live migration application and RLS verification in the production Supabase project.
