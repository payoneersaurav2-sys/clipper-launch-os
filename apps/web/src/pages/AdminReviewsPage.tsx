import { useState } from 'react';
import { useAdminReviews, useUpdateReviewAdmin } from '@/hooks/useReviews';
import { Loader2, Star, CheckCircle, XCircle, EyeOff, Star as StarOutline } from 'lucide-react';

export default function AdminReviewsPage() {
  const { data: reviews, isLoading } = useAdminReviews();
  const updateReview = useUpdateReviewAdmin();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'hidden' | 'featured'>('all');

  // Verify admin authorization strictly.
  // Assuming the user_metadata or app_metadata contains the admin flag, or we just rely on RLS.
  // Actually, we must rely on RLS and graceful error handling if they are not admin.
  // We'll show a basic check here. If the query fails due to RLS, it handles it.
  
  if (isLoading) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If no reviews and an error occurred, the user might not be an admin.
  if (!reviews) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <XCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-muted-foreground">You do not have permission to view this page.</p>
      </div>
    );
  }

  const filteredReviews = reviews.filter((r) => {
    if (filter === 'all') return true;
    if (filter === 'featured') return r.is_featured;
    return r.status === filter;
  });

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

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-20">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Review Moderation</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage and moderate customer reviews for the landing page.</p>
      </div>

      <div className="flex space-x-2 overflow-x-auto pb-2">
        {['all', 'pending', 'approved', 'rejected', 'hidden', 'featured'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`rounded-[8px] px-4 py-2 text-sm font-medium capitalize transition-colors ${
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
                  <div className="flex items-center gap-3">
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
                  <div className="text-xs text-muted-foreground">
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
                    <StarOutline className={`h-3 w-3 ${review.is_featured ? 'fill-current' : ''}`} /> {review.is_featured ? 'Unfeature' : 'Feature'}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
