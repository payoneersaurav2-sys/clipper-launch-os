# Architecture

Creator OS is an npm-workspaces Turborepo. The deployable web app is `apps/web`: a Vite React 18 SPA with React Router v6 and lazy-loaded dashboard pages. `packages/core` holds AI types, prompt construction, response schemas, and the OpenRouter provider. `packages/ui` is declared but contains no repository-tracked source files.

Global state uses Zustand (`useAuthStore`, `useWorkspaceStore`, AI settings/history/memory); Supabase data is fetched and mutated with TanStack Query hooks. `main.tsx` initializes auth before the React tree is rendered. `DashboardLayout.tsx` loads workspaces and owns the responsive sidebar, header, tour, notifications, feedback widget, and route outlet.

Supabase is represented by SQL migrations and three Edge Functions: `whop-auth`, `whop-iframe-auth`, and `ai-router`. Vercel builds with `npx turbo run build`, serves `apps/web/dist`, keeps `/api/*` on Vercel functions, and rewrites remaining paths to the SPA.

The codebase is the current implementation source of truth; SQL migrations do not prove they have been applied to the remote Supabase project.
