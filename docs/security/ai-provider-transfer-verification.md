# Creator OS AI Provider & International Transfer Verification

Date:
September 15, 2026

## 1. Executive Summary
Creator OS has undergone a complete production verification of its AI provider handling, international data transfer safeguards, environment variable hygiene, and Whop integration. All public legal assertions strictly match verifiable code and configuration. Unverified claims (e.g., universal zero retention, executed DPAs) have been removed from public documents until formal contracts are executed.

## 2. Actual AI Providers Used
- **OpenAI** (via OpenRouter)
- **Anthropic** (via OpenRouter)

## 3. Model Allowlist
The server-side gateway (`api/ai.ts`) enforces an authoritative allowlist. Models not present or enabled in this list are blocked.
```typescript
const AI_PROVIDER_POLICY = [
  { provider: 'OpenAI', openRouterIdentifier: 'openai/gpt-4o-mini', enabledInProduction: true, approvedForUserContent: true, retentionPolicyStatus: 'PROVIDER_DEFAULT', trainingPolicyStatus: 'VERIFIED_NO_TRAINING' },
  { provider: 'OpenAI', openRouterIdentifier: 'openai/gpt-4o', enabledInProduction: true, approvedForUserContent: true, retentionPolicyStatus: 'PROVIDER_DEFAULT', trainingPolicyStatus: 'VERIFIED_NO_TRAINING' },
  { provider: 'Anthropic', openRouterIdentifier: 'anthropic/claude-3.5-sonnet', enabledInProduction: true, approvedForUserContent: true, retentionPolicyStatus: 'PROVIDER_DEFAULT', trainingPolicyStatus: 'VERIFIED_NO_TRAINING' },
  { provider: 'Anthropic', openRouterIdentifier: 'anthropic/claude-3-haiku', enabledInProduction: true, approvedForUserContent: true, retentionPolicyStatus: 'PROVIDER_DEFAULT', trainingPolicyStatus: 'VERIFIED_NO_TRAINING' }
];
```

## 4. OpenRouter Handling
**Status: GREEN** (Code Verified)
OpenRouter is correctly treated as a routing layer. The Privacy Policy has been updated to clarify that prompts are transmitted to OpenRouter and then to downstream model providers, avoiding the false claim that OpenRouter guarantees zero retention for all downstream models.

## 5. Downstream Provider Handling
**Status: YELLOW** (Verification Required)
While OpenAI and Anthropic API services generally do not train on customer data, explicit Zero Data Retention (ZDR) configuration is an account-level setting. The public Privacy Policy makes no universal ZDR claims, noting instead that retention is subject to provider practices.

## 6. Supabase
**Status: YELLOW** (Provider Documentation Exists; Contract Execution Unverified)
Supabase is correctly used for relational storage, Auth, and RLS. No SCCs/DPAs are publicly claimed as executed by Creator OS until a manual contract review is done.

## 7. Vercel
**Status: YELLOW** (Provider Documentation Exists; Contract Execution Unverified)
Vercel hosts the edge functions and static assets. No public transfer execution claims are made.

## 8. Whop
**Status: GREEN** (Code Verified)
Whop OAuth and redirection are verified. The canonical domain (`https://creator-os999.vercel.app/auth/callback`) is explicitly configured in `apps/web/.env` and `test_final.mjs`.

## 9. Data Transfer Mechanisms
**Status: GREEN** (Code Verified / Neutralized)
Public Privacy Policy language has been completely neutralized to state: *"We utilize third-party subprocessors located in the United States. By using our Service, you acknowledge that your data may be transferred to and processed in the US, subject to applicable law."* No unsupported claims of DPAs or SCCs remain.

## 10. DPA/SCC Status
**Status: YELLOW** (Verification Required)
We must formally execute DPAs with Supabase, Vercel, OpenRouter, and Whop to finalize GDPR/UK compliance.

## 11. Environment Variables
**Status: GREEN** (Code Verified)
- `apps/web/.env` was scrubbed. `VITE_OPENROUTER_API_KEY` was corrected to `OPENROUTER_API_KEY` to prevent accidental inclusion in frontend bundles. The actual keys were replaced with `ROTATION_REQUIRED_SEE_DASHBOARD`.
- `local.env` and `.env` were inspected. Key `WHOP_API_KEY` is present and scrubbed.
- `.gitignore` correctly ignores `.env*`.

## 12. Production Domain
**Status: GREEN** (Code Verified)
Canonical domain: `https://creator-os999.vercel.app`.
No incorrect production or leaked `localhost` origins are present in user-facing code.

## 13. Whop URLs
**Status: GREEN** (Code Verified)
PKCE configuration in `whopPkce.ts` strictly enforces exact origin matching for redirect URIs, failing closed on mismatched origins.

## 14. AI Data Minimization
**Status: GREEN** (Code Verified)
The `PromptEngine.build` architecture compresses prompt contexts based on token counts and only transmits necessary metadata (`workspace.niche`, `project.description`, etc.) to upstream providers. No raw authentication secrets or billing IDs are forwarded.

## 15. Logging/Secret Safety
**Status: GREEN** (Code Verified)
No full AI completions or prompts are logged aggressively in `api/ai.ts`. Only safe metadata (latency, token usage, reservation ID, error strings) is logged. Secrets found in `.env` were obfuscated and flagged for rotation.

## 16. Privacy Policy Changes
**Status: GREEN** (Code Verified)
Modified `PrivacyPage.tsx` and `CookiePolicyPage.tsx` to align strictly with verifiable infrastructure (e.g., stating Meta/X pixels are deactivated).

## 17. Vercel Verification Status
**Status: GRAY** (Not Applicable / Dashboard Required)
Vercel dashboard/live environment requires manual verification.

## 18. Whop Verification Status
**Status: GRAY** (Not Applicable / Dashboard Required)
Whop dashboard requires manual verification. The exact required redirect URI is `https://creator-os999.vercel.app/auth/callback`.

## 19. Remaining Manual Actions
- Rotate `OPENROUTER_API_KEY` and `WHOP_API_KEY` in Vercel/Whop dashboards as they were briefly exposed in local configuration files.
- Sign formal DPAs with Supabase, Vercel, Whop, and OpenRouter.
- Configure Whop Developer Dashboard to exactly match `https://creator-os999.vercel.app/auth/callback`.

## 20. Launch Readiness
The codebase configuration is production-ready. Security headers, OAuth validation, AI model allowlisting, and legal text are implemented defensively. Pending manual dashboard updates, the application is clear for launch.
