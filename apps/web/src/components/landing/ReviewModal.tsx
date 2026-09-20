import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSubmitReview, useMyReview } from '@/hooks/useReviews';
import { Link } from 'react-router-dom';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReviewModal({ isOpen, onClose }: ReviewModalProps) {
  const { user } = useAuthStore();
  const { data: myReview, isLoading: isLoadingReview } = useMyReview();
  const submitReview = useSubmitReview();

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Pre-fill form if user has an existing review or user profile data
  useEffect(() => {
    if (myReview) {
      setRating(myReview.rating);
      setReviewText(myReview.review_text);
      setName(myReview.name);
      setHandle(myReview.handle || '');
      setRole(myReview.role || '');
    } else if (user) {
      setName(user.user_metadata?.full_name || '');
    }
  }, [myReview, user]);

  // Reset internal state when closed
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setSuccess(false);
        setError(null);
      }, 300);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError('You must be signed in to submit a review.');
      return;
    }

    if (rating < 1 || rating > 5) {
      setError('Please select a star rating.');
      return;
    }

    if (reviewText.trim().length < 10) {
      setError('Your review must be at least 10 characters long.');
      return;
    }

    try {
      await submitReview.mutateAsync({
        id: myReview?.id,
        name: name.trim(),
        handle: handle.trim(),
        role: role.trim(),
        rating,
        review_text: reviewText.trim(),
      });
      setSuccess(true);
      // Notify FeedbackPopup engine that a review was submitted
      window.dispatchEvent(new CustomEvent('creator-os-review-submitted'));
    } catch (err: any) {
      setError(err.message || 'An error occurred while submitting your review. Please try again.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg overflow-hidden rounded-[24px] border border-border bg-card shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
              <h2 className="text-xl font-semibold text-foreground">Write a Review</h2>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              {!user ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="mb-4 rounded-full bg-primary/10 p-4">
                    <Star className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">Sign in to review</h3>
                  <p className="mb-6 text-sm text-muted-foreground">
                    You need a Creator OS account to share your experience with the community.
                  </p>
                  <Link
                    to="/login"
                    onClick={onClose}
                    className="inline-flex h-11 items-center justify-center rounded-[12px] bg-primary px-8 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                  >
                    Sign in to Creator OS
                  </Link>
                </div>
              ) : isLoadingReview ? (
                <div className="flex h-48 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : success ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="mb-4 rounded-full bg-green-500/10 p-4">
                    <Star className="h-8 w-8 text-green-500" fill="currentColor" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">Thank You!</h3>
                  <p className="text-sm text-muted-foreground">
                    Your review has been submitted for approval.
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-8 inline-flex h-11 items-center justify-center rounded-[12px] border border-border bg-transparent px-8 text-sm font-semibold text-foreground transition-colors hover:bg-white/5"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {myReview && (
                    <div className="rounded-[12px] border border-primary/20 bg-primary/5 p-4 text-sm text-primary">
                      You've already submitted a review. Editing this form will overwrite your previous review and return it to pending status.
                    </div>
                  )}

                  <div className="flex flex-col items-center justify-center space-y-2">
                    <p className="text-sm font-medium text-foreground">Overall Rating</p>
                    <div 
                      className="flex space-x-1" 
                      role="radiogroup" 
                      aria-label="Star rating"
                    >
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                          aria-label={`${star} out of 5 stars`}
                          aria-checked={rating === star}
                          role="radio"
                        >
                          <Star
                            className={`h-8 w-8 transition-all duration-200 ${
                              (hoverRating || rating) >= star
                                ? 'fill-primary text-primary scale-110'
                                : 'text-muted-foreground hover:text-primary/50'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-foreground">
                        Display Name *
                      </label>
                      <input
                        id="name"
                        type="text"
                        required
                        maxLength={50}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-[12px] border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="Jane Doe"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="handle" className="mb-1.5 block text-sm font-medium text-foreground">
                          Handle (Optional)
                        </label>
                        <input
                          id="handle"
                          type="text"
                          maxLength={30}
                          value={handle}
                          onChange={(e) => setHandle(e.target.value)}
                          className="w-full rounded-[12px] border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          placeholder="@janedoe"
                        />
                      </div>
                      <div>
                        <label htmlFor="role" className="mb-1.5 block text-sm font-medium text-foreground">
                          Role (Optional)
                        </label>
                        <input
                          id="role"
                          type="text"
                          maxLength={50}
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                          className="w-full rounded-[12px] border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          placeholder="Video Editor"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="review_text" className="mb-1.5 block text-sm font-medium text-foreground">
                        Your Review *
                      </label>
                      <textarea
                        id="review_text"
                        required
                        minLength={10}
                        maxLength={1000}
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        className="h-32 w-full resize-none rounded-[12px] border border-border bg-background px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="Tell other creators what your experience with Creator OS has been like..."
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-[8px] bg-red-500/10 p-3 text-sm text-red-500">
                      {error}
                    </div>
                  )}

                  <div className="space-y-4 pt-2">
                    <p className="text-xs text-muted-foreground">
                      By submitting, you agree that your review and the public profile information you provide may be displayed on the Creator OS website.
                    </p>
                    <button
                      type="submit"
                      disabled={submitReview.isPending}
                      className="inline-flex w-full items-center justify-center rounded-[12px] bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
                    >
                      {submitReview.isPending ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        myReview ? 'UPDATE REVIEW' : 'SUBMIT REVIEW'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
