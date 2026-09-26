# Creator OS - Product Activation & Growth Analytics

**STATUS: Phase 10.1 Complete** (Analytics Hardening applied). — Product Activation & Growth Analytics

## 1. Activation Definition

An **activated user** is defined as:

```
New account
+ at least one successful AI generation (idea, hook, caption, or campaign)
within 7 days of signup
```

This definition is measurable via the `product_events` table:
- `signup_completed` fired on redirect to dashboard
- `ai_request_completed` (feature: any) fired server-confirmed via the Vercel AI edge function

A user who has not triggered `ai_request_completed` within 7 days is **not activated**.

---

## 2. Primary First-Value Action

**→ Generate your first viral ideas in Idea Studio**

Route: `/dashboard/idea-studio`

Rationale: Idea Studio is the fastest path from zero to a tangible AI output. It requires only a workspace and one click. The result is immediately visible (10 ideas), sharable, and memorable. No prior setup required.

---

## 3. Onboarding Flow (Creator / Pro)

```
WELCOME — Dashboard home shows OnboardingChecklist if:
  - user has 0 AI generations, AND
  - user has 0 active campaigns, AND
  - localStorage key 'hide_onboarding' is not 'true'

STEP 1 — Set up your context
  → /dashboard/knowledge
  Complete when: knowledge_created event fires

STEP 2 — Generate ideas
  → /dashboard/idea-studio
  Complete when: ai_request_completed event fires with feature=idea_studio

STEP 3 — Start your first campaign
  → /dashboard/campaign-os
  Complete when: campaign_created event fires
```

Dismiss: "Skip for now" button sets `localStorage.hide_onboarding = 'true'` and fires `onboarding_skipped`.

The checklist does NOT reappear after dismissal.

---

## 4. Onboarding Flow (Agency)

```
STEP 1 — Create your first client workspace  (auto-complete if agency workspace exists)
STEP 2 — Add client brand knowledge          → /dashboard/knowledge
STEP 3 — Generate client-aware content        → /dashboard/idea-studio
STEP 4 — Build a campaign pipeline           → /dashboard/campaign-os
```

Agency users are detected via `subscriptionTier === 'agency'` from `useAuthStore`.

---

## 5. Event Taxonomy

### AUTH
| Event | When |
|---|---|
| `login_completed` | User lands on `/dashboard` |
| `signup_completed` | (manual future: fire in onboarding callback) |

### ONBOARDING
| Event | When |
|---|---|
| `onboarding_started` | (future: fire when checklist first renders) |
| `onboarding_step_completed` | (future: per-step completion event) |
| `onboarding_skipped` | User clicks "Skip for now" |
| `onboarding_completed` | All steps done |

### AI
| Event | When |
|---|---|
| `ai_request_started` | (future: before generation) |
| `ai_request_completed` | After successful generation |
| `ai_request_failed` | After failed generation |

### CONTENT
| Event | When |
|---|---|
| `content_created` | New content item saved |
| `content_updated` | Content item edited |

### KNOWLEDGE
| Event | When |
|---|---|
| `knowledge_created` | Knowledge item added |
| `knowledge_updated` | Knowledge item edited |

### CAMPAIGN
| Event | When |
|---|---|
| `campaign_created` | New campaign created |
| `campaign_updated` | Campaign edited |

### AGENCY
| Event | When |
|---|---|
| `agency_client_created` | New client workspace created |
| `agency_client_switched` | Client Switcher changes active client |
| `agency_ai_used` | AI generation inside agency client context |
| `agency_campaign_created` | Campaign created inside agency client |

### BILLING
| Event | When |
|---|---|
| `pricing_viewed` | User lands on `/pricing` |
| `checkout_started` | User clicks a plan's checkout CTA |
| `checkout_completed` | (server-side: fired by Whop webhook) |

### FEEDBACK
| Event | When |
|---|---|
| `feedback_prompt_shown` | Dashboard feedback popup shown |
| `feedback_positive` | User clicks positive feedback |
| `feedback_negative` | User clicks negative feedback |
| `review_submitted` | User submits a review |

---

## 6. Event Properties

Each event carries **only safe metadata**:

```typescript
{
  feature?: string,      // 'idea_studio' | 'hook_engine' | 'caption_os' etc.
  count?: number,        // number of items generated
  plan?: string,         // 'creator' | 'pro' | 'agency'
  path?: string,         // URL path, no query params
  success?: boolean,
}
```

**NEVER included in any event:**
- AI prompts or completions
- Knowledge Vault content
- Campaign text
- Brand Profile content
- User email
- Auth tokens
- API keys
- Client names or IDs

---

## 7. Privacy Rules

1. Only authenticated users generate events (`await supabase.auth.getUser()` verified before insert)
2. `user_id` stored is the Supabase internal UUID, never email
3. `properties_safe` is JSONB — structured, bounded. No free-text prompt or completion data allowed
4. RLS: users can only insert events tied to their own `user_id`
5. Analytics failures are caught and swallowed — they NEVER block product behavior
6. No third-party analytics vendors are added in Phase 10
7. Marketing pixel scripts (Meta/X) remain disabled per Phase 9 finding

---

## 8. Funnel

```
LANDING PAGE          → pricing_viewed (if /pricing visited)
↓
PRICING               → checkout_started
↓
WHOP CHECKOUT         → checkout_completed (authoritative: server-side webhook)
↓
SIGNUP / LOGIN        → login_completed
↓
DASHBOARD             → onboarding shown for new users
↓
FIRST AI GENERATION   → ai_request_completed → ACTIVATED USER
↓
REPEATED VALUE        → ai_request_completed (2nd+)
↓
FEEDBACK POPUP        → feedback_positive / feedback_negative
↓
REVIEW REQUEST        → review_submitted
↓
UPGRADE / RETENTION   → checkout_started (upsell moment)
```

---

## 9. Agency Activation

An Agency user is activated when:
```
agency tier confirmed
+ agency_client_created
+ ai_request_completed inside client context
```

---

## 10. Creator/Pro Activation

A Creator or Pro user is activated when:
```
creator or pro tier confirmed
+ ai_request_completed (any feature)
```

---

## 11. Upgrade Moments

Upgrade prompts appear **only** when a real limit is reached:
- Credit exhaustion → `UpgradePrompt` component shown
- Knowledge limit reached → `UpgradePrompt` with plan description
- NOT shown after every action, NOT shown as timed popups

Upgrade copy is strictly limited to verified capabilities. Example:
> "You've used your available credits. Upgrade to Creator for a monthly credit allowance."

---

## 12. Review Integration

The existing feedback flow is preserved:
1. `feedbackEngine.ts` fires after product actions (`recordFeedbackEvent`)
2. Positive feedback triggers a review request popup
3. Review submitted → `status = 'pending'` → moderation
4. Approved reviews only appear on landing page

Phase 10 adds `feedback_prompt_shown`, `feedback_positive`, `feedback_negative`, `review_submitted` to the event taxonomy for measurement. No new review engine is created.

---

## 13. Data Retention

The `product_events` table has no hard deletion policy configured in Phase 10.

**Recommended future action:** Add a scheduled Supabase function to delete events older than 12 months (sufficient for meaningful cohort analysis without indefinite raw event accumulation).

```sql
-- Future scheduled job (not implemented in Phase 10)
DELETE FROM product_events WHERE occurred_at < NOW() - INTERVAL '12 months';
```

