# Creator OS maintainer guide

## Identity and operating rule

Creator OS (repository name: `clipper-launch-os`) is a premium creator workflow OS. Preserve its established dark, precise Creator OS identity and its incremental-extension architecture. Do not rebuild, rebrand, swap Supabase/OpenRouter, or replace routing without an approved, evidence-backed reason.

## Stack and commands

- npm workspaces + Turborepo; React 18, TypeScript, Vite, Tailwind, Framer Motion.
- Server state: TanStack Query. Client state: Zustand. Backend: Supabase (Postgres, RLS, Edge Functions). AI provider: OpenRouter.
- `npm run build` — currently passes.
- `npm run lint` — currently fails during ESLint rule loading, before linting source.
- `npm run typecheck` — currently executes zero Turbo tasks; it is not a typecheck gate.
- No automated test script or test runner is configured. Use targeted checks and manual validation for changed flows.

## Routes and modules

- Public: `/`, `/faq`, `/terms`, `/changelog`, `/help`.
- Auth: `/login`, `/signup`, `/auth/callback`, `/auth/iframe`, `/expired`, `/onboarding`.
- Protected routes live beneath `/dashboard`: idea studio, hook engine, caption OS, campaign OS, clip pipeline, analytics, knowledge vault, prompt library, AI settings, settings, help, changelog.
- `apps/web/src/App.tsx` is the route source of truth; `DashboardLayout.tsx` owns app navigation and global dashboard UI.

## Security and integrations

- Never expose or add API keys, service-role keys, Whop secrets, or JWT secrets. `.env` is intentionally untracked.
- Supabase schema evolution belongs in chronological `supabase/migrations/`; do not edit applied migrations or infer live database state from files.
- Keep tenant queries scoped to the active workspace and preserve RLS. Check policies before adding any table or query.
- Components should use the AI service/hooks rather than calling OpenRouter directly. Do not introduce another provider path.
- Whop has OAuth (`whop-auth`) and iframe-token (`whop-iframe-auth`) paths. Treat both as security-sensitive; validate with real Whop/Supabase credentials before claiming they work.

## Design rules

- Inter font; near-black surfaces (`#080808`, `#111111`, `#161616`), off-white text, muted grays, and Creator OS purple `#7C3AED`.
- Preserve compact radii, subtle low-opacity borders, Lucide icons, Framer Motion transitions, desktop Kanban/mobile list fallback, existing wordmark/navigation hierarchy.
- New UI must extend existing primitives and layout patterns, not introduce a generic SaaS look.

## Known constraints at takeover

- OpenRouter requests currently run from the browser using `VITE_OPENROUTER_API_KEY`; this exposes a key to clients. The server-side `ai-router` exists but is not used by the web client and has correctness issues documented in `docs/ai.md`.
- The OAuth callback expects Supabase session tokens from `whop-auth`, but the checked-in function only performs a Whop OAuth token exchange. The iframe route is structurally more complete but requires live verification.
- Prompt Library is a stub. Analytics has mocked sparklines/trends. Campaign edit is a no-op. Clip Pipeline supports manual stage moves, not drag-and-drop or source-clip extraction.

## Documentation

See `README.md` for the inherited overview. Current evidence-based takeover documentation is in `docs/`: architecture, product, design system, authentication, database, AI, Whop, and Clip Pipeline.
