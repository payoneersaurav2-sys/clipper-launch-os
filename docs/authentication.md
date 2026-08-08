# Authentication

`useAuthStore` initializes from Supabase Auth, fetches `users.membership_status` and `onboarding_complete`, and subscribes to later auth changes. `ProtectedRoute` requires a session, active membership (or Vite development mode), then completed onboarding.

Email/password login and signup use the browser Supabase client. The signup UI directly upserts `public.users` with `membership_status: active`; this does not match a strict Whop-only product-gate claim and must be treated as a policy decision, not an accidental refactor target.

Whop OAuth starts in `whopPkce.ts`, returns to `/auth/callback`, then invokes `whop-auth`. The web client uses OAuth 2.1 S256 PKCE with an opaque CSRF state. `whop-auth` exchanges the code, fetches Whop userinfo, synchronizes a Supabase Auth/profile user, and returns a real Supabase session for `supabase.auth.setSession`.

This flow needs deployed `whop-auth` code plus `SUPABASE_SERVICE_ROLE_KEY`; configure `WHOP_CLIENT_ID` and `WHOP_CLIENT_SECRET` for the registered Whop app as applicable. Validate it with a real Whop account before treating it as production-verified.

`/auth/iframe` accepts a Whop token from the URL or Vercel `/api/get-whop-token`, calls `whop-iframe-auth`, then sets the supplied Supabase session. That edge function verifies a Whop JWT, synchronizes/creates a Supabase user, marks membership active, and signs in using a derived password. It needs real Whop, Supabase service-role, and RLS verification before release claims.
