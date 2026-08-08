# AI and OpenRouter

The intended AI entry points are `AIService.ts` and `useAI.ts`; both use the shared `@clipper/core` OpenRouter provider and `PromptEngine`. Modules build typed contexts for ideas, hooks, captions, campaign plans, analytics, and Knowledge Vault answers. Context supports workspace metadata, preferences, local memory, prior generations, JSON schemas, retry, and an in-browser 30 request/minute limiter.

OpenRouter is the actual provider. The default model is `openai/gpt-4o-mini`; UI settings expose several OpenRouter model IDs. Non-stream and stream requests go directly from the browser to OpenRouter with `VITE_OPENROUTER_API_KEY`, meaning the key is bundled into client code. Do not add a second provider or expose another secret; resolving server-only delivery is a high-priority follow-up.

`supabase/functions/ai-router` exists but the web client does not call it. It imports package code via a relative path that is not normally deployable in Supabase Functions, writes an object (not workspace ID) to `prompt_history.workspace_id`, has comments calling it a mock, and does not implement streaming. Treat it as incomplete/non-production until redesigned and tested with the existing OpenRouter contract.

AI history, settings, and memory stores are browser-persisted Zustand state. Database tables exist for `ai_memory` and `prompt_history`, but current module paths do not demonstrate durable workspace-memory retrieval or full generation-history persistence.
