# Creator OS — Developer Documentation
**Version 1.0** | Production-Ready SaaS for Content Creators

---

## Architecture Overview

Creator OS is a full-stack SaaS monorepo built with React, TypeScript, Supabase, and OpenRouter AI.

```
CLipper launch OS/
├── apps/
│   └── web/                    # React SPA (Vite + TypeScript)
│       ├── src/
│       │   ├── components/     # Shared UI components
│       │   │   └── modules/    # Feature modules (IdeaStudio, HookEngine…)
│       │   ├── hooks/          # TanStack Query data hooks
│       │   ├── layouts/        # DashboardLayout, LandingLayout, AuthLayout
│       │   ├── lib/            # supabase client, export utils, utils
│       │   ├── pages/          # Route-level page components
│       │   ├── services/       # AIService.ts (central AI gateway)
│       │   ├── stores/         # Zustand state (auth, workspace, history, memory)
│       │   └── App.tsx         # Route tree (lazy-loaded)
│       ├── public/             # robots.txt, static assets
│       └── index.html          # SEO meta, fonts, schema.org
├── packages/
│   ├── core/                   # Shared AI provider, prompt engine, types
│   └── ui/                     # Shared UI primitives
└── supabase/
    └── migrations/             # All SQL migrations (chronological)
```

---

## Database Schema

| Table | Purpose |
|-------|---------|
| `users` | Auth users + profile + onboarding state |
| `workspaces` | Tenant isolation unit |
| `workspace_members` | User ↔ Workspace with roles |
| `clip_ideas` | AI-generated content ideas |
| `hook_variations` | Hook variants per idea |
| `captions` | Generated captions |
| `campaigns` | Campaign management |
| `clips` | Production pipeline (Kanban stages) |
| `knowledge_items` | Knowledge Vault entries |
| `notifications` | User notifications |
| `prompt_templates` | Versioned AI prompt templates |
| `workspace_memory` | Persistent AI memory per workspace |
| `generation_history` | AI generation audit log |

All tables use **Row Level Security (RLS)** enforced via `user_belongs_to_workspace()`.

---

## Authentication Flow

```
User → /login
  ├── Email/Password → supabase.auth.signInWithPassword()
  │     └── On success → /dashboard
  └── Whop OAuth → /auth/callback
        └── Edge Function: whop-auth
              └── Verify membership → Create Supabase session → /dashboard

ProtectedRoute checks:
  1. Supabase session exists (user logged in)
  2. membership_status = 'active' OR import.meta.env.DEV = true
```

---

## AI Architecture

All AI calls flow through `src/services/AIService.ts`:

```
Component
  └── AIService.generate() / generateStream()
        └── PromptEngine.compress(context)
              └── Provider (OpenRouter / OpenAI / Anthropic / Gemini)
                    └── Response → Token accounting → Return
```

**Rate limiting:** 30 requests/minute (client-side)  
**Token accounting:** Tracked in-session via `getSessionTokens()`  
**Streaming:** All generations support `generateStream()` with `onChunk` callback

---

## Environment Variables

```env
# Required
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_xxxx

# Optional — AI generations
OPENROUTER_API_KEY=sk-or-xxxx

# Optional — Whop OAuth
VITE_WHOP_CLIENT_ID=your_whop_client_id
```

---

## Running Locally

```bash
# Install dependencies
npm install

# Start development server
cd apps/web && npm run dev

# Open
http://localhost:5173
```

---

## Database Migrations

```bash
# Link to Supabase project
supabase link --project-ref <project-ref>

# Mark existing migrations as applied
supabase migration repair --status applied <timestamp>

# Push new migrations
supabase db push
```

---

## Deployment

```bash
# Production build
cd apps/web && npm run build

# Output: apps/web/dist/
# Deploy to: Vercel, Netlify, Cloudflare Pages, or any static host
```

**Vercel config:** Set environment variables in Vercel dashboard → Settings → Environment Variables.

---

## Key Design Decisions

- **Monorepo**: Turborepo with shared `@clipper/core` and `@clipper/ui` packages
- **Auth**: Supabase email auth + Whop OAuth (membership-gated)
- **AI**: Provider-agnostic via OpenRouter; swap models in AI Settings
- **State**: Zustand for auth/workspace global state; TanStack Query for server state
- **Routing**: React Router v6 with full lazy loading (Suspense)
- **Performance**: All dashboard routes are code-split; ~60% smaller initial bundle
- **Security**: RLS on every table; workspace isolation enforced at DB level

---

## Future Roadmap (v1.1+)

- [ ] Native mobile app (React Native)
- [ ] Team workspaces with role management
- [ ] Affiliate tracking system
- [ ] Supabase Storage for media uploads
- [ ] Real-time collaboration
- [ ] Webhook integrations (TikTok, YouTube, Instagram)
- [ ] Advanced analytics with custom date ranges
- [ ] AI-powered content calendar generation
- [ ] White-label licensing

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| v1.0.0  | Aug 2026 | Production release |
| v0.9.0  | Aug 2026 | Batch 5: AI Engine, Settings, Onboarding |
| v0.8.0  | Aug 2026 | Batch 4: Campaign OS, Analytics, Pipeline |
| v0.7.0  | Aug 2026 | Batch 3: AI Brain, Provider, Memory |
| v0.1.0  | Aug 2026 | Initial scaffold |
