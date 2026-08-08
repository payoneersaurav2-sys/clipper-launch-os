# AI and OpenRouter

The intended AI entry points are `AIService.ts` and `useAI.ts`; both use the shared `@clipper/core` OpenRouter provider and `PromptEngine`. Modules build typed contexts for ideas, hooks, captions, campaign plans, analytics, and Knowledge Vault answers. Context supports workspace metadata, preferences, local memory, prior generations, JSON schemas, retry, and an in-browser 30 request/minute limiter.

OpenRouter is the actual provider. The default model is `openai/gpt-4o-mini`; UI settings expose several OpenRouter model IDs. Browser requests go through the authenticated same-origin Vercel endpoint at `/api/ai`; the OpenRouter credential must be supplied only as Vercel's `OPENROUTER_API_KEY` environment variable. Never set or use `VITE_OPENROUTER_API_KEY` in production.

`supabase/functions/ai-router` exists but the web client does not call it. It imports package code via a relative path that is not normally deployable in Supabase Functions, writes an object (not workspace ID) to `prompt_history.workspace_id`, has comments calling it a mock, and does not implement streaming. Treat it as incomplete/non-production until redesigned and tested with the existing OpenRouter contract.

AI history, settings, and memory stores are browser-persisted Zustand state. Database tables exist for `ai_memory` and `prompt_history`, but current module paths do not demonstrate durable workspace-memory retrieval or full generation-history persistence.
# Local cost measurement

Use the development-only analyzer in [`dev/ai-cost-analyzer/README.md`](../dev/ai-cost-analyzer/README.md) to measure real OpenRouter costs before pricing any AI allowance. It is excluded from the product build and requires an explicit `--run --confirm` command before it can contact OpenRouter. Packaging decisions are documented in [AI-PRICING-PLAN.md](AI-PRICING-PLAN.md).
