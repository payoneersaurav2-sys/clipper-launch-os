# Creator OS — AI Capability Truth

This document evaluates current marketing claims against the actual, code-verified AI implementation architecture (Phase 10.1).

## Product Claims vs. Reality

### 1. "AI that knows your context"
- **Actually True?** YES
- **Evidence:** The server-side AI gateway (`api/ai.ts`) intercepts every request that has a valid workspace ID and automatically resolves and injects workspace-level context.
- **Supported Features:** Idea Studio, Hook Engine, Caption OS, Launch Center, Analytics, Prompt Library, AI Assistant.
- **Missing Implementation:** None for basic context, but context resolution falls back to `default` due to naming mismatches (e.g., `idea_generation` vs `idea-studio`).

### 2. "AI that remembers your brand"
- **Actually True?** YES
- **Evidence:** `resolveAgencyAIContext` in `api/context-resolver.ts` performs a database fetch for `brand_profiles` matching the active workspace. It extracts target audience, tone, and description, formatting them as a `<client_profile>` block in the AI prompt.
- **Supported Features:** ALL AI requests routed through `useAI` for an active workspace.
- **Missing Implementation:** The UI features (like Idea Studio) do not show that Brand Profile is being used, making it seem disconnected.

### 3. "Your Knowledge Vault powers AI"
- **Actually True?** PARTIALLY TRUE (With severe architectural flaws)
- **Evidence:** Knowledge Vault is connected via two independent systems:
  1. **UI-Level:** Users can manually select knowledge snippets in workflows (Idea Studio, Launch Center) which are injected into the developer instructions.
  2. **Server-Level:** `resolveAgencyAIContext` blindly queries the first 2-5 rows from the `knowledge_items` table and injects them as `<client_knowledge>`. 
- **Missing Implementation:** There is **NO semantic search / RAG**. The server just grabs the most recent/first rows. If a client has 50 knowledge items, 45 of them will never reach the AI automatically.

### 4. "AI recognizes your brand"
- **Actually True?** YES
- **Evidence:** The `brand_profiles` fields are securely queried server-side using RLS and workspace validation. The AI has access to `target_audience`, `tone`, and `short_description`.
- **Missing Implementation:** Specific feature policies (like `hook-engine`) request `primary_offer` and `content_pillars`, but the mismatch in `billingOperation` names causes it to fall back to the generic `default` profile fields.

### 5. "Prompt Centre powers your workflows"
- **Actually True?** YES
- **Evidence:** The Prompt Library UI has a `handleRun` method that successfully resolves template variables (using Regex `{{ }}`) and fires `useAI()`. Saved prompts can also be attached to workflows like Idea Studio.
- **Missing Implementation:** None. It works exactly as a prompt execution engine.

---

## Critical Product Gaps (Implementation vs. UX)

1. **The "Blind Retrieval" Gap:** Knowledge Vault is not a vector database or semantic RAG. It is a dumb SQL query with a `LIMIT` clause. It cannot intelligently answer questions based on a large knowledge base.
2. **The "Silent Context" Gap:** The user types into "Brand Profile", but when they use Idea Studio, there is no UI indicator that their brand profile is actually being applied. The injection happens invisibly on the server.
3. **The "Policy Name" Gap:** The `AI_CONTEXT_POLICIES` map uses UI-friendly keys (`hook-engine`), but the AI gateway passes `billingOperation` strings (`hook_generation`), forcing all requests to use the generic `default` context injection policy.
