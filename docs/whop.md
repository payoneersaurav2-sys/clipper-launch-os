# Whop integration

Whop supports two checked-in paths:

- OAuth/PKCE: `/login` → Whop → `/auth/callback` → `whop-auth`.
- Embedded app: `/auth/iframe` receives `x-whop-user-token` through `/api/get-whop-token` or URL token → `whop-iframe-auth`.

Required values are split by runtime: web uses `VITE_WHOP_CLIENT_ID`; `whop-auth` uses `WHOP_CLIENT_ID`, `WHOP_CLIENT_SECRET`; iframe auth needs `WHOP_API_KEY`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY`. Do not commit values. The fixed production callback in code is `https://creator-os999.vercel.app/auth/callback`.

The OAuth web flow uses Whop's S256 PKCE authorize/token endpoints and completes the existing Supabase session handoff server-side. Manual verification is still mandatory: Whop app URL/template and exact redirect URI, test purchase/product access, token header availability in Vercel, Supabase user/profile synchronization, onboarding routing, expiry/revocation behavior, and sign-out/session refresh.
