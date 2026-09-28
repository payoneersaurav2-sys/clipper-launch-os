# Feature Inventory
This document lists the product features, their components, and expected behaviors.

## 1. Agency HQ
- **Components:** `AgencyOverview.tsx`, `AgencyTeam.tsx`, `AgencyClients.tsx`, `AgencyAcceptInvite.tsx`, `AgencyProtectedRoute.tsx`
- **Expected Behaviors:**
  - Displays a dashboard summarizing clients for agency owners.
  - Allows creating, viewing, and organizing clients.
  - Ensures routes are protected and only accessible to users with Agency tier entitlements.
  - Displays an empty state with a "Create Client" call to action when no clients exist.

## 2. Billing & Entitlements
- **Components:** `PricingPage.tsx`, `CreditStorePage.tsx`, `UpgradePrompt.tsx`
- **Database/SQL:** `subscription_entitlements`, `credit_ledger`, `dynamic_credit_reservation`
- **Expected Behaviors:**
  - `PricingPage.tsx` displays available upgrade options and masks lower tiers based on the user's current tier (Free < Creator < Pro < Agency).
  - Integrates with Whop for checkout and OAuth.
  - Enforces prompt and knowledge limits based on tier (e.g., unlimited for some, blocked for free).
  - Displays `UpgradePrompt` across modules when accessing locked features (e.g., Knowledge Vault on Free tier).
  - `CreditStorePage` allows users to track and purchase credits, managing transactions through the credit ledger.

## 3. AI Workflows (Idea Studio, Caption OS, Hook Engine, Campaign OS)
- **Components:** `modules/IdeaStudio.tsx`, `modules/CaptionOS.tsx`, `modules/HookEngine.tsx`, `CampaignOSPage.tsx`, `ClipPipelinePage.tsx`
- **Expected Behaviors:**
  - **Idea Studio:** Allows AI generation of ideas based on workspace context. Supports Expanding ideas. Includes "Send to" flows to pass ideas to Hook Engine or Caption OS. Integrates "Prompt selector" and "Knowledge selector" which check entitlements.
  - Uses `useAI` hooks and makes JSON generation requests.
  - Emits tracking events (`recordFeedbackEvent`, `trackEvent`) for AI actions.
  - Handles errors gracefully, displaying visual feedback for failed AI generations.

## 4. Knowledge Vault
- **Components:** `modules/KnowledgeVault.tsx`, `ContentWorkspacePage.tsx`
- **Database/SQL:** `knowledge_items`, `knowledge_chunks`, `knowledge-ingest` edge function
- **Expected Behaviors:**
  - Requires 'Creator' tier or higher. Displays `UpgradePrompt` if unentitled.
  - Allows adding knowledge via Text, File (PDF, TXT, MD up to 10MB), or Website URL.
  - Website ingestion invokes a background Supabase Edge Function (`knowledge-ingest`).
  - Supports searching and asking questions using semantic search over `knowledge_chunks`.
  - Supports refreshing website sources.
  - Includes deletion capabilities.

## 5. Analytics & Brand Profiles
- **Components:** `AnalyticsDashboard.tsx`, `AdminMetricsPage.tsx`, `modules/Analytics.tsx`, `BrandProfilePage.tsx`
- **Expected Behaviors:**
  - Requires specific tiers to access analytics (e.g., requires 'Creator' plan).
  - Admin view (`AdminMetricsPage`) tracks retention, overall metrics.
  - Brand profile management for maintaining content styling and identity.

## 6. Feedback & Reviews
- **Components:** `FeedbackWidget.tsx`, `FeedbackPopup.tsx`, `AdminReviewsPage.tsx`, `landing/ReviewsSection.tsx`
- **Expected Behaviors:**
  - Allows users to submit feedback which is captured into the system.
  - Reviews shown on the landing page. Admin interface to manage them.

## 7. Authentication & Legal
- **Components:** `LoginPage.tsx`, `SignupPage.tsx`, `AuthCallback.tsx`, `OnboardingPage.tsx`, `LegalAcceptancePage.tsx`
- **Expected Behaviors:**
  - Social login options (Google, Whop).
  - Mandatory legal acceptance during onboarding (Terms, Privacy).
