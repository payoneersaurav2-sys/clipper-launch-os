# Creator OS Phase 0 Audit

## Purpose
This document captures the Phase 0 inspection of the Creator OS repository before any code changes are applied. The focus is on the Knowledge Vault ingestion auth flow, AI/gateway architecture, billing/Whop integration, and production readiness risks.

## Scope Reviewed
- `apps/web/src/components/modules/KnowledgeVault.tsx`
- `supabase/functions/knowledge-ingest/index.ts`
- `apps/web/src/lib/supabase.ts`
- `apps/web/src/pages/AuthCallback.tsx`
- `apps/web/src/stores/useAuthStore.ts`
- `api/ai.ts`
- `apps/web/src/lib/ai-api.ts`
- `supabase/functions/ai-router/index.ts`
- `supabase/functions/whop-auth/index.ts`
- `supabase/migrations/20260805100000_batch5_extensions.sql`
- `supabase/migrations/20260808150000_credit_ledger.sql`
- `supabase/migrations/20260809110000_expand_knowledge_ingestion.sql`
- `supabase/migrations/20260809120001_add_knowledge_chunks.sql`

## Immediate Findings

### 1. Knowledge Vault ingestion auth path
- The front-end uses a direct `fetch()` to Supabase Edge Function:
  - Endpoint: `${supabaseUrl}/functions/v1/knowledge-ingest`
  - Authorization: `Bearer <accessToken>`
- `KnowledgeVault.tsx` refreshes the Supabase session when `refresh_token` exists.
- `knowledge-ingest` validates the request using `supabase.auth.getUser()` on a client created with `SUPABASE_ANON_KEY` plus the incoming `Authorization` header.
- If auth fails, the function returns `401` and logs `knowledge-ingest auth validation failed` with debug info.

### 2. Most likely root cause of the reported deployed `401`
- The deployed function is correctly checking the Bearer token; therefore the failure is likely auth-related rather than content ingestion logic.
- Possible failure modes:
  - `Authorization` header is missing or stripped in transit.
  - Access token is expired or invalid.
  - Session refresh is not effective because the stored `refresh_token` is missing, empty, or unusable.
  - The deployed function environment has an incorrect `SUPABASE_URL`/`SUPABASE_ANON_KEY` pair, causing `supabase.auth.getUser()` to fail.
- The browser code uses `mode: 'cors'` and `credentials: 'omit'`, which is appropriate for a cross-origin function request with a custom auth header.

### 3. Auth and sign-in flow concerns
- The Whop sign-in path stores the Supabase session using `supabase.auth.setSession()` in `AuthCallback.tsx`.
- If the Whop exchange response lacks a valid `refresh_token`, the later `getValidAccessToken()` refresh path may be unable to renew the access token.
- `useAuthStore.ts` maintains app-level session state, but the browser-side Supabase client is still the source-of-truth for session existence via `supabase.auth.getSession()`.

### 4. Multiple AI gateway implementations
- There are two separate AI gateway layers in the repo:
  - `api/ai.ts` (front-end `/api/ai` gateway used by `apps/web/src/lib/ai-api.ts`)
  - `supabase/functions/ai-router/index.ts` (Supabase Edge Function, appears to be a legacy or alternate gateway)
- The front-end currently calls `/api/ai`, not the Supabase `ai-router` function.
- This divergence represents technical debt and potential confusion in a production deployment.

### 5. Billing / credit and Whop integration
- The AI gateway in `api/ai.ts` reserves and completes credit reservations via Supabase RPCs:
  - `reserve_creator_os_credits`
  - `release_creator_os_credit_reservation`
  - `complete_creator_os_credit_reservation`
- Plan/credit eligibility is enforced in `api/ai.ts` before provider invocation.
- The Whop membership lookup and Supabase user mapping are implemented in `supabase/functions/whop-auth/index.ts`.
- `Pricing`, `Credit Packs`, and `Whop` checkout configuration are hard-coded in frontend libs (`apps/web/src/lib/pricing.ts`, `apps/web/src/lib/credits.ts`).

## Production Readiness Risks

### Risk 1: Authentication robustness
- The website ingestion path is highly sensitive to auth token validity.
- There is no explicit token expiration check or fallback in the ingestion flow beyond refresh.
- If `supabase.auth.getUser()` returns a problem, the function returns `401` with debug information.

### Risk 2: CORS and cross-origin function invocation
- The function handles `OPTIONS` and allows `Authorization`, but the browser call is cross-origin.
- The current implementation should work, yet this is a risk area if the deployed function host or origin changes.

### Risk 3: Environment / deployment drift
- `supabase/functions/knowledge-ingest/index.ts` depends on service env vars:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- Any mismatch between local and deployed function environment can cause unpredictable failures.

### Risk 4: Duplicate AI service surfaces
- Two different AI gateway stacks exist; this increases the chance of stale code and inconsistent behaviour.
- Production should have one canonical AI gateway.

### Risk 5: No automated test coverage visible
- There is no front-end or integration test harness in the repository for the ingestion/auth flow.
- Build scripts exist, but no tests are configured in `apps/web/package.json`.

## Phase 0 Recommendations

### Verification steps before code changes
1. Reproduce the live failure with a valid token and capture the actual function response body.
2. Inspect deployed function logs for `knowledge-ingest received request` and `knowledge-ingest auth validation failed` entries.
3. Confirm the deployed function environment values for `SUPABASE_URL` and `SUPABASE_ANON_KEY` match expectations.
4. Verify whether the access token obtained by `getValidAccessToken()` is still valid just before the fetch.
5. Check whether `refresh_token` is populated after Whop sign-in and persisted in the browser session.

### Suggested next-phase changes
- Phase 1: Add diagnostics and token-expiry validation for website ingestion.
  - Log `authHeaderPresent` and the user ID / error details in the deployed function.
  - Add a browser-side check to detect expired access tokens before invoking ingestion.
- Phase 2: Rationalize AI gateway architecture.
  - Consolidate to one gateway implementation.
  - Remove legacy `supabase/functions/ai-router` if it is not used.
- Phase 3: Improve production resilience.
  - Add test coverage for Supabase auth flows and function invocation.
  - Harden Whop/Supabase sign-in and refresh token handling.
  - Add end-to-end monitoring/alerts for function auth failures.

## Conclusion
This Phase 0 audit has inspected the relevant repository surface and identified the Knowledge Vault auth path as the most likely source of the deployed `401` error.

## Audit update
Phase 1 has been executed: the website ingestion auth validation pathway was hardened to use a direct Supabase `/auth/v1/user` verification call, and the browser refresh path now persists newly refreshed Supabase sessions before invoking ingestion.

If you want, I can now deploy the updated function and verify the live ingestion path immediately.