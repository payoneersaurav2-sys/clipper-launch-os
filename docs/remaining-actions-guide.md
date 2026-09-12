# Remaining production actions guide

## 1) What I can do from this environment

I can do the following directly from this workspace:

- inspect the repo and code
- run local validation commands
- create and update documentation
- patch app code locally
- prepare deployment scripts and checklists

I cannot directly access your GitHub, Vercel, or Supabase account without an authenticated session or valid credentials in this environment.

> Local verification evidence: the last repo validation command completed successfully with exit code 0, including `git status`, `npm run typecheck`, `npm run lint`, `npm run build`, and the audit check.

---

## 2) What is still required for live production

These are the remaining operational tasks that must be confirmed in the live provider consoles:

1. GitHub repository access and remote push permissions
2. Vercel project access and production environment variables
3. Supabase project link and deployment permissions
4. Whop callback URLs and redirect allowlists
5. CAPTCHA/bot protection configuration
6. Auth provider and password-reset configuration
7. Production monitoring, alerts, backup, and incident response setup

---

## 3) If you want me to perform the external actions for you

I can do them only if you provide one of these:

- GitHub auth already configured in this terminal (`gh auth status` works)
- Vercel auth already configured (`npx vercel whoami` works)
- Supabase auth already configured (`supabase status` or `supabase projects list` works)
- or valid tokens/credentials exported in the terminal environment

If you want to grant access, send me:

- GitHub PAT or `gh auth` status
- Vercel token or valid Vercel login state
- Supabase access token or login state
- Production env values for:
  - `VITE_WHOP_CLIENT_ID`
  - `VITE_WHOP_REDIRECT_URI`
  - `WHOP_CLIENT_ID`
  - `WHOP_REDIRECT_URI`
  - `WHOP_WEBHOOK_SECRET`
  - `OPENROUTER_API_KEY`
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - any `VITE_SUPABASE_*` keys used by the web app

---

## 4) Stepwise guide for the remaining production tasks

### Step 1: Verify GitHub repo and branch

Run:

```bash
git status --short --branch
git remote -v
git branch -vv
```

Check:

- the correct repo is configured
- you are on the intended production branch
- the remote is the correct GitHub repository

If it is not configured:

```bash
git remote add origin <github-repo-url>
```

Then push:

```bash
git add .
git commit -m "Production hardening and deployment finalization"
git push origin <branch-name>
```

---

### Step 2: Verify production environment variables in Vercel

Open your Vercel dashboard and confirm the following are set in the production environment:

- `VITE_WHOP_CLIENT_ID`
- `VITE_WHOP_REDIRECT_URI`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `OPENROUTER_API_KEY` if required by runtime

Also verify:

- the production domain matches the actual live app URL
- redirect URIs exactly match the deployed app callback route
- no localhost or staging URL is accidentally used in production

---

### Step 3: Verify Supabase project settings

Run:

```bash
supabase link --project-ref <project-ref>
supabase db push
supabase functions list
```

Confirm that these functions are deployed:

- `whop-auth`
- `whop-link-account`
- `whop-membership-webhook`
- `ai-router`

Then deploy them explicitly:

```bash
supabase functions deploy whop-auth
supabase functions deploy whop-link-account
supabase functions deploy whop-membership-webhook
supabase functions deploy ai-router
```

Also verify in the Supabase dashboard:

- Auth → URL configuration
- Auth → providers → Whop / Google / others
- Database → tables and policies
- Edge Functions → secrets and runtime env

---

### Step 4: Verify the Whop callback configuration

In the Whop dashboard and app config, confirm:

- the redirect URI matches the exact production callback URL
- the callback route is the final deployed URL, not a preview or localhost value
- the same redirect value is used consistently in both browser and server flows

For this app, the relevant values should be aligned with:

- browser callback: `/auth/callback`
- server-side redirect config: the canonical deployed HTTPS origin

Make sure the redirect allowlist is strict and does not accept arbitrary hostnames.

---

### Step 5: Confirm bot protection / CAPTCHA

If your auth flow is exposed to public login/signup, set up a CAPTCHA provider in Supabase or at the app edge.

Check the Supabase config file and uncomment the supported provider configuration if using self-hosted auth:

```toml
[auth.captcha]
provider = "hcaptcha"
```

Then verify in the dashboard that the challenge is required on sign-in/sign-up and abuse attempts are throttled.

This is still a live operational step; it is not fully proven by app code alone.

---

### Step 6: Verify AI rate limiting for production deployment

The repo has local in-memory limits, but production should use a shared or durable rate-limiting solution if the app is deployed across multiple instances.

Recommended production options:

- Redis-backed rate limiting
- Supabase edge function global throttle
- upstream provider-side quotas and retry logic

Check whether the app is:

- single-instance only
- or multi-instance / multi-region

If multi-instance, replace the local in-memory bucket with a shared store.

---

### Step 7: Confirm provider-side security controls

These controls cannot be proven from the repo alone and must be validated in provider dashboards:

- MFA enforcement
- password reset policy
- alerting / abuse monitoring
- backup and PITR / retention settings
- SQL security and RLS monitoring
- auth session expiry and session invalidation rules

---

### Step 8: Final live smoke test

After deployment, test these flows:

1. sign up / sign in
2. Whop OAuth flow
3. Whop account link flow
4. AI generation request
5. quota/rate-limit behavior
6. webhook handling for subscription changes
7. logout and session expiry
8. production callback behavior with the real domain

---

## 5) Recommended final status wording

Use this wording for the live state:

> The identified code-level vulnerabilities have been remediated in the repository, and the remaining provider/operational controls have been explicitly documented for live verification in the production environment.

---

## 6) If you want me to continue automatically

Send me any one of the following and I can proceed immediately:

- a working GitHub auth session in this terminal
- a valid Vercel auth session
- a valid Supabase login session
- or the exact production env values and credentials required to run the live deployment commands

Without that access, I can continue to do local validation, code fixes, and documentation work here, but I cannot operate your live external accounts from this environment.
