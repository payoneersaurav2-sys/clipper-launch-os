import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminReviews, useUpdateReviewAdmin } from '@/hooks/useReviews';
import { useAdminProductFeedback } from '@/hooks/useProductFeedback';
import { Loader2, Star, CheckCircle, XCircle, EyeOff, Star as StarOutline, MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';

type AdminTab = 'reviews' | 'feedback';

export default function AdminReviewsPage() {
  const { isAdmin } = useAuthStore();
  const { data: reviews, isLoading } = useAdminReviews();
  const updateReview = useUpdateReviewAdmin();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'hidden' | 'featured'>('all');
  const [activeTab, setActiveTab] = useState<AdminTab>('reviews');

  // ---- Feedback filters
  const [feedbackSentiment, setFeedbackSentiment] = useState<'positive' | 'negative' | undefined>(undefined);
  const { data: feedbackItems, isLoading: feedbackLoading } = useAdminProductFeedback({
    sentiment: feedbackSentiment,
  });

  // Verify admin authorization strictly (frontend guard — RLS enforces server-side)
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateReview.mutateAsync({ id, status });
    } catch (error: any) {
      alert(error.message || 'Failed to update review');
    }
  };

  const handleToggleFeature = async (id: string, currentFeatured: boolean) => {
    try {
      await updateReview.mutateAsync({ id, is_featured: !currentFeatured });
    } catch (error: any) {
      alert(error.message || 'Failed to update review');
    }
  };

  const filteredReviews = (reviews ?? []).filter((r) => {
    if (filter === 'all') return true;
    if (filter === 'featured') return r.is_featured;
    return r.status === filter;
  });

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-20">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Admin Moderation</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage reviews and product feedback.</p>
      </div>

      {/* ---- Top-level tabs ---- */}
      <div className="flex gap-1 border-b border-white/[0.06]">
        {([
          { id: 'reviews' as AdminTab, label: 'Reviews', icon: Star },
          { id: 'feedback' as AdminTab, label: 'Product Feedback', icon: MessageSquare },
        ]).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === id
                ? 'border-primary text-primary'
                : 'border-transparent text-[#71717A] hover:text-[#FAFAFA]'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ======================================================
          TAB 1: REVIEWS
      ====================================================== */}
      {activeTab === 'reviews' && (
        <>
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Filter pills */}
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {['all', 'pending', 'approved', 'rejected', 'hidden', 'featured'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f as any)}
                    className={`rounded-[8px] px-4 py-2 text-sm font-medium capitalize transition-colors whitespace-nowrap ${
                      filter === f ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground hover:bg-white/5'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                {filteredReviews.length === 0 ? (
                  <div className="rounded-[16px] border border-border bg-card p-12 text-center text-muted-foreground">
                    No reviews found for this filter.
                  </div>
                ) : (
                  filteredReviews.map((review) => (
                    <div key={review.id} className="flex flex-col sm:flex-row gap-6 rounded-[16px] border border-border bg-card p-6">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="font-semibold text-foreground">{review.name}</span>
                            <span className="text-xs text-muted-foreground">{review.handle || review.role}</span>
                            {review.verified && <span className="rounded bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-500 uppercase">Verified</span>}
                            <span className={`rounded px-2 py-0.5 text-[10px] font-medium uppercase ${
                              review.status === 'approved' ? 'bg-green-500/10 text-green-500' :
                              review.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                              'bg-red-500/10 text-red-500'
                            }`}>
                              {review.status}
                            </span>
                            {review.is_featured && <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary uppercase">Featured</span>}
                          </div>
                          <div className="text-xs text-muted-foreground shrink-0">
                            {new Date(review.created_at).toLocaleDateString()}
                          </div>
                        </div>

                        <div className="mb-3 flex text-primary">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-current' : 'text-muted-foreground/30'}`} />
                          ))}
                        </div>

                        <p className="text-sm text-foreground/90 bg-background/50 p-4 rounded-lg border border-border/50">
                          {review.review_text}
                        </p>
                      </div>

                      <div className="flex flex-row sm:flex-col gap-2 shrink-0 sm:w-32">
                        {review.status !== 'approved' && (
                          <button onClick={() => handleStatusChange(review.id, 'approved')} disabled={updateReview.isPending} className="flex items-center justify-center gap-2 rounded-[8px] bg-green-500/10 py-2 text-xs font-medium text-green-500 hover:bg-green-500/20">
                            <CheckCircle className="h-3 w-3" /> Approve
                          </button>
                        )}
                        {review.status !== 'rejected' && (
                          <button onClick={() => handleStatusChange(review.id, 'rejected')} disabled={updateReview.isPending} className="flex items-center justify-center gap-2 rounded-[8px] bg-red-500/10 py-2 text-xs font-medium text-red-500 hover:bg-red-500/20">
                            <XCircle className="h-3 w-3" /> Reject
                          </button>
                        )}
                        {review.status !== 'hidden' && (
                          <button onClick={() => handleStatusChange(review.id, 'hidden')} disabled={updateReview.isPending} className="flex items-center justify-center gap-2 rounded-[8px] bg-gray-500/10 py-2 text-xs font-medium text-gray-400 hover:bg-gray-500/20">
                            <EyeOff className="h-3 w-3" /> Hide
                          </button>
                        )}
                        {review.status === 'approved' && (
                          <button onClick={() => handleToggleFeature(review.id, review.is_featured)} disabled={updateReview.isPending} className={`flex items-center justify-center gap-2 rounded-[8px] py-2 text-xs font-medium ${review.is_featured ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}>
                            <StarOutline className={`h-3 w-3 ${review.is_featured ? 'fill-current' : ''}`} />
                            {review.is_featured ? 'Unfeature' : 'Feature'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* ======================================================
          TAB 2: PRODUCT FEEDBACK
      ====================================================== */}
      {activeTab === 'feedback' && (
        <>
          {/* Sentiment filter */}
          <div className="flex gap-2">
            {([
              { value: undefined, label: 'All' },
              { value: 'positive' as const, label: '👍 Positive' },
              { value: 'negative' as const, label: '👎 Negative' },
            ]).map(({ value, label }) => (
              <button
                key={label}
                onClick={() => setFeedbackSentiment(value)}
                className={`rounded-[8px] px-4 py-2 text-sm font-medium transition-colors ${
                  feedbackSentiment === value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-foreground hover:bg-white/5'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {feedbackLoading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !feedbackItems || feedbackItems.length === 0 ? (
            <div className="rounded-[16px] border border-border bg-card p-12 text-center text-muted-foreground">
              No product feedback found.
            </div>
          ) : (
            <div className="space-y-3">
              {feedbackItems.map((item) => (
                <div key={item.id} className="rounded-[14px] border border-border bg-card p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      {item.sentiment === 'positive'
                        ? <ThumbsUp className="h-4 w-4 text-emerald-400" />
                        : <ThumbsDown className="h-4 w-4 text-red-400" />
                      }
                      <span className={`text-xs font-semibold uppercase ${item.sentiment === 'positive' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {item.sentiment}
                      </span>
                      <span className="text-xs text-muted-foreground px-2 py-0.5 rounded bg-white/5 capitalize">
                        {item.feature.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-muted-foreground px-2 py-0.5 rounded bg-white/5">
                        {item.event_type.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {item.message ? (
                    <p className="text-sm text-foreground/80 bg-background/50 p-3 rounded-lg border border-border/50 leading-relaxed">
                      {item.message}
                    </p>
                  ) : (
                    <p className="text-xs italic text-muted-foreground">(No message provided)</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
