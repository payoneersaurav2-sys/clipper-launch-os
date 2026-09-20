// ============================================================
// CREATOR OS — FeedbackPopup
// Premium in-dashboard feedback + review request popup.
// Mounts once in DashboardLayout. Listens for feedback events.
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ThumbsUp, ThumbsDown, Star, Loader2, Heart, Send } from 'lucide-react';
import {
  isFeedbackEligible,
  onFeedbackPromptShown,
  onFeedbackDismissed,
  onReviewSubmitted,
  hasSubmittedReview,
  getFeatureMessage,
  type FeedbackEventOptions,
} from '@/lib/feedbackEngine';
import { useSubmitProductFeedback } from '@/hooks/useProductFeedback';
import { useAuthStore } from '@/stores/useAuthStore';
import { ReviewModal } from '@/components/landing/ReviewModal';

// ---- Animation variants ------------------------------------

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const popupVariants = {
  hidden:  { opacity: 0, y: prefersReducedMotion ? 0 : 16, scale: prefersReducedMotion ? 1 : 0.97 },
  visible: { opacity: 1, y: 0, scale: 1,
    transition: { duration: prefersReducedMotion ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, y: prefersReducedMotion ? 0 : 8, scale: prefersReducedMotion ? 1 : 0.97,
    transition: { duration: prefersReducedMotion ? 0 : 0.2, ease: 'easeIn' } },
};

const stepVariants = {
  hidden:  { opacity: 0, x: prefersReducedMotion ? 0 : 16 },
  visible: { opacity: 1, x: 0, transition: { duration: prefersReducedMotion ? 0 : 0.2 } },
  exit:    { opacity: 0, x: prefersReducedMotion ? 0 : -16, transition: { duration: prefersReducedMotion ? 0 : 0.15 } },
};

// ---- Types -------------------------------------------------

type PopupStep =
  | 'question'          // "HOW WAS THAT?"
  | 'positive_bridge'   // "LOVE TO HEAR IT 💜" + WRITE A REVIEW
  | 'negative_form'     // product feedback textarea
  | 'done_negative'     // thank-you after negative feedback
  | 'done_positive';    // review submitted (handled by ReviewModal itself)


export function FeedbackPopup() {
  const { user } = useAuthStore();
  const submitFeedback = useSubmitProductFeedback();

  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<PopupStep>('question');
  const [currentFeature, setCurrentFeature] = useState('default');
  const [currentEvent, setCurrentEvent] = useState('');
  const [negativeMessage, setNegativeMessage] = useState('');
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  const firstFocusRef = useRef<HTMLButtonElement>(null);

  // ---- Listen for feedback events from modules -------------
  const handleFeedbackEvent = useCallback((e: Event) => {
    const opts = (e as CustomEvent<FeedbackEventOptions>).detail;
    if (!opts.success) return;
    if (!user) return; // only for authenticated users

    if (isFeedbackEligible()) {
      setCurrentFeature(opts.feature);
      setCurrentEvent(opts.event);
      setStep('question');
      setNegativeMessage('');
      setVisible(true);
      onFeedbackPromptShown();
    }
  }, [user]);

  useEffect(() => {
    window.addEventListener('creator-os-feedback-event', handleFeedbackEvent);
    return () => window.removeEventListener('creator-os-feedback-event', handleFeedbackEvent);
  }, [handleFeedbackEvent]);

  // ---- Focus management when popup opens ------------------
  useEffect(() => {
    if (visible) {
      setTimeout(() => firstFocusRef.current?.focus(), 50);
    }
  }, [visible, step]);

  // ---- Handlers -------------------------------------------

  const handleDismiss = () => {
    onFeedbackDismissed();
    setVisible(false);
  };

  const handlePositive = () => {
    // If review already submitted, skip to a thank-you (no repeat ask)
    if (hasSubmittedReview()) {
      setVisible(false);
      return;
    }
    setStep('positive_bridge');
  };

  const handleNegative = () => {
    setStep('negative_form');
  };

  const handleWriteReview = () => {
    setVisible(false);
    setReviewModalOpen(true);
  };

  const handleNegativeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await submitFeedback.mutateAsync({
        feature: currentFeature,
        event_type: currentEvent,
        sentiment: 'negative',
        message: negativeMessage,
      });
    } catch {
      // Fail silently — don't punish user for backend issues
    }
    setStep('done_negative');
    setTimeout(() => setVisible(false), 2500);
  };

  const handleReviewModalClose = () => {
    setReviewModalOpen(false);
  };

  // ---- ESC to close (after handlers so handleDismiss is in scope) ---
  useEffect(() => {
    if (!visible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { handleDismiss(); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [visible]);

  // When ReviewModal successfully submits, mark locally
  useEffect(() => {
    const handler = () => { onReviewSubmitted(); };
    window.addEventListener('creator-os-review-submitted', handler);
    return () => window.removeEventListener('creator-os-review-submitted', handler);
  }, []);

  const featureMsg = getFeatureMessage(currentFeature);

  // ---- Render ---------------------------------------------

  return (
    <>
      <AnimatePresence>
        {visible && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Quick feedback"
            variants={popupVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={[
              // Position: bottom-right, above the FeedbackWidget button (bottom-5 + button h-12 + gap)
              'fixed z-50 w-full sm:w-[340px]',
              // Mobile: bottom-sheet
              'bottom-0 left-0 right-0 rounded-t-[22px]',
              // Desktop: floating card
              'sm:bottom-24 sm:right-5 sm:left-auto sm:rounded-[20px]',
              // Glass design
              'border border-white/[0.08] bg-[#111111]',
              'shadow-[0_0_0_1px_rgba(124,58,237,0.12),0_24px_60px_rgba(0,0,0,0.6),0_0_40px_rgba(124,58,237,0.08)]',
              'p-5 sm:p-6',
            ].join(' ')}
          >
            {/* Close button */}
            <button
              onClick={handleDismiss}
              aria-label="Dismiss feedback popup"
              className="absolute top-4 right-4 text-white/30 hover:text-white/70 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
            >
              <X className="h-4 w-4" />
            </button>

            <AnimatePresence mode="wait">
              {/* ── STEP 1: Initial question ── */}
              {step === 'question' && (
                <motion.div key="question" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-4">
                  <div>
                    <p className="text-[10px] font-semibold tracking-[0.14em] text-primary uppercase mb-1">
                      HOW WAS THAT?
                    </p>
                    <p className="text-[15px] font-semibold text-[#FAFAFA] leading-snug pr-5">
                      {featureMsg.question}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      ref={firstFocusRef}
                      onClick={handlePositive}
                      className="flex-1 flex items-center justify-center gap-2 h-10 rounded-[12px] border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[13px] font-medium hover:bg-emerald-500/20 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                    >
                      <ThumbsUp className="h-4 w-4" /> Yes
                    </button>
                    <button
                      onClick={handleNegative}
                      className="flex-1 flex items-center justify-center gap-2 h-10 rounded-[12px] border border-white/[0.08] bg-white/[0.03] text-[#A1A1AA] text-[13px] font-medium hover:bg-white/[0.06] hover:text-[#FAFAFA] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                    >
                      <ThumbsDown className="h-4 w-4" /> Not really
                    </button>
                  </div>

                  <button
                    onClick={handleDismiss}
                    className="w-full text-center text-[11px] text-[#71717A] hover:text-[#A1A1AA] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20 rounded py-1"
                  >
                    Maybe later
                  </button>
                </motion.div>
              )}

              {/* ── STEP 2a: Positive bridge ── */}
              {step === 'positive_bridge' && (
                <motion.div key="positive" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Heart className="h-4 w-4 text-primary fill-primary" />
                      <p className="text-[10px] font-semibold tracking-[0.14em] text-primary uppercase">
                        LOVE TO HEAR IT
                      </p>
                    </div>
                    <p className="text-[15px] font-semibold text-[#FAFAFA] leading-snug">
                      Would you share your experience with other creators?
                    </p>
                  </div>

                  {/* Star teaser */}
                  <div className="flex justify-center gap-0.5">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className="h-5 w-5 fill-primary text-primary" />
                    ))}
                  </div>

                  <button
                    ref={firstFocusRef}
                    onClick={handleWriteReview}
                    className="w-full h-10 rounded-[12px] bg-primary text-white text-[13px] font-semibold hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(124,58,237,0.3)] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    WRITE A REVIEW
                  </button>

                  <button
                    onClick={handleDismiss}
                    className="w-full text-center text-[11px] text-[#71717A] hover:text-[#A1A1AA] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20 rounded py-1"
                  >
                    Not now
                  </button>
                </motion.div>
              )}

              {/* ── STEP 2b: Negative feedback form ── */}
              {step === 'negative_form' && (
                <motion.div key="negative" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-4">
                  <div>
                    <p className="text-[10px] font-semibold tracking-[0.14em] text-[#A1A1AA] uppercase mb-1">
                      THANKS FOR THE FEEDBACK
                    </p>
                    <p className="text-[15px] font-semibold text-[#FAFAFA]">
                      What could have been better?
                    </p>
                  </div>

                  <form onSubmit={handleNegativeSubmit} className="space-y-3">
                    <textarea
                      ref={firstFocusRef as any}
                      value={negativeMessage}
                      onChange={(e) => setNegativeMessage(e.target.value.slice(0, 2000))}
                      placeholder="Share what didn't work for you…"
                      rows={3}
                      maxLength={2000}
                      aria-label="What could have been better?"
                      className="w-full rounded-[12px] border border-white/[0.08] bg-[#0D0D0D] text-[#FAFAFA] placeholder:text-[#71717A] p-3 text-[13px] resize-none outline-none focus:border-primary/50 transition-colors"
                    />

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={submitFeedback.isPending || !negativeMessage.trim()}
                        className="flex-1 h-9 rounded-[12px] bg-primary text-white text-[13px] font-medium hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        {submitFeedback.isPending
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <><Send className="h-3.5 w-3.5" /> SEND</>
                        }
                      </button>
                      <button
                        type="button"
                        onClick={handleDismiss}
                        className="px-4 h-9 rounded-[12px] border border-white/[0.08] text-[#71717A] text-[13px] hover:text-[#FAFAFA] hover:bg-white/[0.04] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                      >
                        Skip
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* ── DONE: Negative thank-you ── */}
              {step === 'done_negative' && (
                <motion.div key="done" variants={stepVariants} initial="hidden" animate="visible" exit="exit"
                  className="flex flex-col items-center text-center py-3 gap-2">
                  <div className="w-9 h-9 rounded-full bg-emerald-500/15 flex items-center justify-center">
                    <ThumbsUp className="h-4 w-4 text-emerald-400" />
                  </div>
                  <p className="text-[15px] font-semibold text-[#FAFAFA]">Got it, thank you.</p>
                  <p className="text-[12px] text-[#71717A]">Your feedback helps us improve Creator OS.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full review modal — triggered from the positive bridge */}
      <ReviewModal isOpen={reviewModalOpen} onClose={handleReviewModalClose} />
    </>
  );
}
