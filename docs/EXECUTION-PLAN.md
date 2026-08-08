# Creator OS execution plan

Last audited: 2026-08-08. This is an evidence-based backlog, not a statement that external services are configured. Status values are intentionally limited to `[ ] NOT STARTED`, `[-] IN PROGRESS`, `[x] COMPLETED`, and `[!] BLOCKED`.

## Verified in this health pass

### COS-HEALTH-001

Priority: P1 | Area: Quality gates | Status: [x] COMPLETED | Complexity: Small

Task: Restore meaningful lint and TypeScript gates and remove the identified unused code/import errors.

Why it matters: CI must reject basic regressions.

Dependencies: None.

Acceptance criteria: `npm run lint` and `npm run typecheck` pass from the repository root.

### COS-HEALTH-002

Priority: P1 | Area: Workspace data | Status: [x] COMPLETED | Complexity: Small

Task: Prevent persisted active-workspace state and cached clips from leaking across workspace changes.

Why it matters: Incorrect tenant context can produce stale or misleading creator data.

Dependencies: Existing Supabase RLS.

Acceptance criteria: The active workspace is reset to a fetched, authorized workspace; clip queries and invalidations include the workspace identifier.

### COS-HEALTH-003

Priority: P1 | Area: Auth/UI correctness | Status: [x] COMPLETED | Complexity: Small

Task: Stop iframe authentication from displaying token-fetch diagnostics, correct duplicate tour navigation, and remove the fake API-key control.

Why it matters: Avoids disclosure, confusing navigation, and a misleading security control.

Dependencies: None.

Acceptance criteria: Iframe errors are generic; tour navigation occurs once per step; no generated pseudo-secret is presented as a working key.

## P0 - blockers

### COS-AUTH-001

Priority: P0 | Area: Whop OAuth | Status: [!] BLOCKED | Complexity: Medium

Task: Deploy `whop-auth`, configure production secrets and exact Whop redirect URI, then exercise the OAuth callback with a purchased user.

Why it matters: OAuth token exchange and Supabase-session creation cannot be verified from source alone.

Dependencies: Whop Experience/OAuth configuration, Supabase Edge Function deployment and secrets.

Acceptance criteria: A purchased user reaches the dashboard; invalid, replayed, expired, and state-mismatched codes fail safely; no token is logged or shown.

### COS-AUTH-002

Priority: P0 | Area: Whop iframe | Status: [!] BLOCKED | Complexity: Medium

Task: Deploy and verify `whop-iframe-auth` with the live Whop Experience token path and refresh behavior.

Why it matters: The embedded paid-product launch path is unverified.

Dependencies: Whop Experience configuration, Supabase Edge Function deployment and secrets.

Acceptance criteria: Existing session reuse works; a valid Whop token creates a Supabase session; missing/invalid tokens show a safe error; unauthorized users never reach protected routes.

### COS-AUTH-003

Priority: P0 | Area: Product gating | Status: [ ] NOT STARTED | Complexity: Medium

Task: Decide and implement the production policy for email/password signup versus Whop entitlement. Do not grant paid membership merely because a user self-registers.

Why it matters: The current self-signup path can conflict with a product-gated Whop offering.

Dependencies: Product decision on supported non-Whop access.

Acceptance criteria: Every supported login path has an explicit entitlement rule; inactive or expired users cannot use protected functionality.

### COS-AI-001

Priority: P0 | Area: OpenRouter security | Status: [ ] NOT STARTED | Complexity: Large

Task: Move all production OpenRouter calls behind an authenticated server/Edge Function route and remove `VITE_OPENROUTER_API_KEY` from the client bundle.

Why it matters: `VITE_*` values are public to every browser user and cannot protect an AI-provider key.

Dependencies: Server-side secret configuration; completion/correction of the AI route.

Acceptance criteria: No OpenRouter secret is built into frontend assets; route checks user/workspace authorization; rate-limit, malformed-response, and provider errors are handled.

### COS-DB-001

Priority: P0 | Area: Supabase security | Status: [!] BLOCKED | Complexity: Medium

Task: Apply migrations to the intended production project and independently verify RLS policies with two test users and two workspaces.

Why it matters: Local migration files are not proof of live schema or tenant isolation.

Dependencies: Supabase project access and test accounts.

Acceptance criteria: Users can only read/write authorized workspace rows; no browser uses service-role credentials; storage policies are verified if uploads are enabled.

## P1 - production readiness

### COS-AI-002

Priority: P1 | Area: AI route | Status: [ ] NOT STARTED | Complexity: Large

Task: Complete or replace the unused `ai-router` within the existing Supabase architecture: deployable imports, valid workspace ID, validated request/response schema, and client adoption.

Why it matters: The current server route is not a safe production replacement for direct client calls.

Dependencies: COS-AI-001.

Acceptance criteria: All Idea, Hook, Caption, and workspace AI calls use one authenticated server path with actionable UI errors.

### COS-TEST-001

Priority: P1 | Area: Test automation | Status: [ ] NOT STARTED | Complexity: Large

Task: Add a test runner and CI gates for auth utilities, protected routing, workspace isolation, campaign/clip mutations, and AI response parsing.

Why it matters: There is currently no automated test suite.

Dependencies: Test Supabase/Whop fakes or staging environment.

Acceptance criteria: `npm test` is defined; critical paths run in CI; regressions block merges.

### COS-DEPLOY-001

Priority: P1 | Area: Vercel/release | Status: [!] BLOCKED | Complexity: Medium

Task: Audit Vercel production environment variables, Edge Function deployment, redirect domains, build runtime, and a release smoke-test checklist.

Why it matters: Repository success does not prove production wiring.

Dependencies: Vercel, Whop, and Supabase dashboard access.

Acceptance criteria: Production build deploys without relying on local variables; public pages and Whop entry flows pass a documented smoke test.

### COS-PIPE-001

Priority: P1 | Area: Clip Pipeline | Status: [ ] NOT STARTED | Complexity: Large

Task: Implement the specified source-to-performance workflow: source registration, clip discovery/selection, review, preparation, ready/published states, and performance capture.

Why it matters: The present board only persists manual clip stage changes and is not the promised end-to-end short-form workflow.

Dependencies: Final source/media and analytics integration decision; storage/RLS verification.

Acceptance criteria: Each stage in `docs/features/clip-pipeline.md` has persisted data, loading/empty/error states, mobile behavior, and ownership enforcement.

### COS-ANALYTICS-001

Priority: P1 | Area: Analytics | Status: [ ] NOT STARTED | Complexity: Large

Task: Replace mocked trends/sparklines with an agreed real ingestion path and disclosure of data freshness.

Why it matters: Mock analytics cannot support creator iteration decisions.

Dependencies: Platform data source and credentials; COS-DB-001.

Acceptance criteria: Metrics identify their source/time range, persist securely, degrade gracefully, and are scoped to workspace/campaign.

### COS-CAMPAIGN-001

Priority: P1 | Area: Campaign OS | Status: [x] COMPLETED | Complexity: Medium

Task: Implement the existing Campaign Edit action or mark it unavailable until a real editor exists.

Why it matters: The menu currently presents a no-op action.

Dependencies: Confirm campaign-field specification.

Acceptance criteria: Edit opens a working form, persists authorized changes, and handles loading/success/error states.

### COS-CAMPAIGN-002

Priority: P1 | Area: Campaign OS | Status: [x] COMPLETED | Complexity: Medium

Task: Add a real campaign detail route backed by the existing campaign and clip relationships.

Why it matters: Campaign cards need an operational view for creators to monitor and manage associated content.

Dependencies: Existing `campaigns` and `clips` migrations.

Acceptance criteria: A campaign opens directly; linked clips, real manual metrics, progress, status, and publishing-date changes persist; the Clip Pipeline opens scoped to the campaign.

### COS-SETTINGS-001

Priority: P1 | Area: Settings | Status: [ ] NOT STARTED | Complexity: Medium

Task: Persist notification preferences, make profile/workspace saves surface Supabase failures, and implement a secure account-deletion workflow or remove the action until available.

Why it matters: Settings must not claim success without durable data changes or offer dead destructive controls.

Dependencies: Data model and deletion policy.

Acceptance criteria: Every displayed setting has persistent behavior and error feedback; account deletion meets retention requirements.

### COS-FEEDBACK-001

Priority: P1 | Area: Feedback | Status: [ ] NOT STARTED | Complexity: Small

Task: Define a feedback table/endpoint and RLS policy instead of repurposing notifications.

Why it matters: The widget now reports write errors correctly, but the current notifications table is not an appropriate durable feedback store.

Dependencies: Supabase migration and RLS review.

Acceptance criteria: Authenticated feedback is stored with creator ownership/context; failure never masquerades as success.

### COS-OBS-001

Priority: P1 | Area: Observability | Status: [ ] NOT STARTED | Complexity: Medium

Task: Add privacy-safe production error monitoring, correlation IDs for Edge Functions, and release alerts.

Why it matters: Authentication and AI failures need actionable evidence without logging secrets.

Dependencies: Monitoring provider and privacy decision.

Acceptance criteria: Client/Edge failures are captured with redaction; alerts and runbook are documented.

## P2 - high-value improvements

### COS-UX-001

Priority: P2 | Area: Responsive QA | Status: [-] IN PROGRESS | Complexity: Medium

Task: Complete visual/interaction QA for all public and authenticated routes at mobile, tablet, laptop, desktop, and wide breakpoints.

Why it matters: Public static route checks are limited; authenticated data views need live test data.

Dependencies: Test account and deployed/stable local app session.

Acceptance criteria: No horizontal overflow, clipped dialogs, unusable tables, or inaccessible navigation across documented viewports.

### COS-PERF-001

Priority: P2 | Area: Frontend performance | Status: [ ] NOT STARTED | Complexity: Medium

Task: Profile dashboard bundles and lazy-load clearly isolated heavy modules after baseline measurement.

Why it matters: The current main JavaScript bundle is about 404 kB before gzip.

Dependencies: Production build profiling.

Acceptance criteria: Change has measured benefit and does not regress routing or loading UX.

### COS-DOC-001

Priority: P2 | Area: Documentation | Status: [ ] NOT STARTED | Complexity: Small

Task: Archive the supplied Antigravity history into the repository or a controlled documentation system and link it as historical, not implementation, truth.

Why it matters: `docs/antigravity-history.md` is referenced in requests but is not present in this checkout.

Dependencies: Owner approval for history location/content.

Acceptance criteria: Future maintainers can find the source history and the current code/docs remain the implementation authority.

### COS-DEPS-001

Priority: P2 | Area: Dependencies | Status: [x] COMPLETED | Complexity: Small

Task: Align declared Vite range with the locked and installed Vite 8.2.0 version.

Why it matters: `npm ls` previously reported Vite as invalid because the manifest declared Vite 5 while the lock installed Vite 8.

Dependencies: None.

Acceptance criteria: Manifest and lock agree; build remains passing. Vite configuration deprecation warnings are tracked for a later compatibility cleanup.

## P3 - future enhancements

### COS-PIPE-002

Priority: P3 | Area: Clip Pipeline | Status: [ ] NOT STARTED | Complexity: Large

Task: Add drag-and-drop/reordering and optional publishing integrations only after the persisted source-to-performance workflow is complete.

Why it matters: Improves throughput but should not replace foundational workflow work.

Dependencies: COS-PIPE-001.

Acceptance criteria: Accessible keyboard alternatives, optimistic-state rollback, and audit-safe publishing state.

### COS-AI-003

Priority: P3 | Area: AI UX | Status: [ ] NOT STARTED | Complexity: Medium

Task: Consolidate duplicated prompts and add controlled prompt/version history once server-side AI calls are secure.

Why it matters: Makes output quality and changes traceable.

Dependencies: COS-AI-001 and COS-AI-002.

Acceptance criteria: Prompt versions are attributable, workspace-safe, and do not store secrets or unnecessary personal data.
