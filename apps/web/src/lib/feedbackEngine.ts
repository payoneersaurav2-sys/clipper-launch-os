// ============================================================
// CREATOR OS — Feedback Engine
// Smart trigger logic for the in-dashboard feedback popup.
// Uses localStorage for non-sensitive UX counters.
// ============================================================

// ---- Config (all values easily adjustable) -----------------

export const FEEDBACK_CONFIG = {
  /** Minimum meaningful AI successes before first prompt */
  MIN_ACTIONS_BEFORE_PROMPT: 3,

  /** Base cooldown in days after a dismissal */
  BASE_COOLDOWN_DAYS: 7,

  /** Progressive backoff: after N dismissals, extend cooldown */
  DISMISSAL_BACKOFF_DAYS: [7, 14, 30] as const,

  /** After review is submitted, never ask for review again */
  REVIEW_SUBMITTED_PERMANENT_SUPPRESS: true,
} as const;

// ---- LocalStorage keys (non-sensitive, UX only) ------------

const KEYS = {
  ACTION_COUNT:      'cos_feedback_action_count',
  LAST_PROMPT_AT:    'cos_feedback_last_prompt_at',
  DISMISSAL_COUNT:   'cos_feedback_dismissal_count',
  REVIEW_SUBMITTED:  'cos_feedback_review_submitted',
  SESSION_SHOWN:     'cos_feedback_session_shown', // sessionStorage
} as const;

// ---- Helpers -----------------------------------------------

function getInt(key: string, fallback = 0): number {
  try { return parseInt(localStorage.getItem(key) ?? String(fallback), 10) || fallback; }
  catch { return fallback; }
}

function setItem(key: string, value: string | number): void {
  try { localStorage.setItem(key, String(value)); } catch { /* quota exceeded — ignore */ }
}

function daysSince(isoTimestamp: string | null): number {
  if (!isoTimestamp) return Infinity;
  const ms = Date.now() - new Date(isoTimestamp).getTime();
  return ms / (1000 * 60 * 60 * 24);
}

function getCooldownDays(): number {
  const dismissals = getInt(KEYS.DISMISSAL_COUNT);
  const backoffs = FEEDBACK_CONFIG.DISMISSAL_BACKOFF_DAYS;
  const idx = Math.min(dismissals, backoffs.length - 1);
  return backoffs[idx];
}

// ---- Public API --------------------------------------------

export interface FeedbackEventOptions {
  /** Short identifier for the feature (e.g. 'idea_studio') */
  feature: string;
  /** Describes what happened (e.g. 'ideas_generated') */
  event: string;
  /** Only trigger on success = true */
  success: boolean;
}

/**
 * Call this after every meaningful successful AI action.
 * Increments the action counter. The popup decides itself whether to show.
 */
export function recordFeedbackEvent(opts: FeedbackEventOptions): void {
  if (!opts.success) return;

  // Never count during SSR/non-browser contexts
  if (typeof window === 'undefined') return;

  const current = getInt(KEYS.ACTION_COUNT);
  setItem(KEYS.ACTION_COUNT, current + 1);

  // Dispatch a custom event so the popup can react without prop drilling
  window.dispatchEvent(
    new CustomEvent('creator-os-feedback-event', { detail: opts })
  );
}

/** Returns true if the popup is currently eligible to show */
export function isFeedbackEligible(): boolean {
  if (typeof window === 'undefined') return false;

  // Don't show more than once per browser session
  try {
    if (sessionStorage.getItem(KEYS.SESSION_SHOWN) === '1') return false;
  } catch { /* ignore */ }

  // Review already submitted — never show review prompt again
  // (still allow negative feedback, handled at popup level)
  const reviewSubmitted = localStorage.getItem(KEYS.REVIEW_SUBMITTED) === '1';

  // Check action count threshold
  const actionCount = getInt(KEYS.ACTION_COUNT);
  if (actionCount < FEEDBACK_CONFIG.MIN_ACTIONS_BEFORE_PROMPT) return false;

  // Check cooldown since last prompt
  const lastPromptAt = localStorage.getItem(KEYS.LAST_PROMPT_AT);
  const cooldown = getCooldownDays();
  if (daysSince(lastPromptAt) < cooldown) return false;

  // If review was submitted, we still allow the popup but it won't offer the review path
  // (the popup itself checks reviewSubmitted to show only the feedback step)
  void reviewSubmitted; // acknowledged — handled in FeedbackPopup

  return true;
}

/** Call when popup is shown — records the prompt timestamp + resets counter + marks session */
export function onFeedbackPromptShown(): void {
  try {
    setItem(KEYS.LAST_PROMPT_AT, new Date().toISOString());
    setItem(KEYS.ACTION_COUNT, 0);
    sessionStorage.setItem(KEYS.SESSION_SHOWN, '1');
  } catch { /* ignore */ }
}

/** Call when user clicks "Maybe later" */
export function onFeedbackDismissed(): void {
  try {
    const current = getInt(KEYS.DISMISSAL_COUNT);
    setItem(KEYS.DISMISSAL_COUNT, current + 1);
    setItem(KEYS.LAST_PROMPT_AT, new Date().toISOString());
  } catch { /* ignore */ }
}

/** Call when a review has been successfully submitted */
export function onReviewSubmitted(): void {
  try {
    setItem(KEYS.REVIEW_SUBMITTED, '1');
  } catch { /* ignore */ }
}

/** Returns true if this user has already submitted a review (local signal only) */
export function hasSubmittedReview(): boolean {
  try { return localStorage.getItem(KEYS.REVIEW_SUBMITTED) === '1'; }
  catch { return false; }
}

// ---- Feature-specific context messages ---------------------

export const FEEDBACK_FEATURE_MESSAGES: Record<string, { question: string; positiveLabel?: string }> = {
  idea_studio:  { question: 'Did Creator OS help you find your next content idea?' },
  hook_engine:  { question: 'Did these hooks help you get unstuck?' },
  caption_os:   { question: 'Did Creator OS make writing captions faster?' },
  knowledge_vault: { question: 'Was this knowledge context helpful for your workflow?' },
  default:      { question: 'Did Creator OS help you get this done faster?' },
};

export function getFeatureMessage(feature: string) {
  return FEEDBACK_FEATURE_MESSAGES[feature] ?? FEEDBACK_FEATURE_MESSAGES['default'];
}
