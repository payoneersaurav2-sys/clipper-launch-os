import { useApprovedReviews } from '@/hooks/useReviews';
import { usePublicStats } from '@/hooks/usePublicStats';
import { motion, useReducedMotion } from 'framer-motion';
import { Star } from 'lucide-react';

export function SocialProofStrip() {
  const { data: reviews } = useApprovedReviews();
  const { data: stats, isLoading: statsLoading } = usePublicStats();
  const reduceMotion = useReducedMotion();

  // If reviews haven't loaded yet, or stats are loading, we can show a placeholder or just wait.
  // But if stats errors out (e.g., RPC not deployed), stats will be undefined but isLoading will be false.
  
  // We need at least reviews to proceed gracefully if stats fails.
  if (!reviews) return null;

  // Fallback to reviews count if stats RPC fails (e.g. if the user hasn't deployed the migration to prod yet)
  const totalUsers = stats?.total_users || reviews.length || 0;
  const totalReviews = reviews.length;
  
  const averageRating = totalReviews > 0 
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews 
    : 5; 
  
  const displayCount = totalUsers > 10 ? '10+' : totalUsers > 4 ? '4+' : totalUsers.toString();
  const displayRating = averageRating % 1 === 0 ? averageRating.toString() + '.0' : averageRating.toFixed(1);

  if (totalUsers === 0) return null;

  return (
    <section className="relative z-10 w-full bg-background border-t border-border/40 py-8" aria-label="Social Proof">
      <div className="max-w-4xl mx-auto px-4 flex flex-col items-center">
        <motion.div 
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16 w-full"
        >
          <div className="flex flex-col items-center text-center">
            <span className="text-3xl font-bold tracking-tight text-foreground mb-1">{displayCount}</span>
            <span className="text-sm font-medium tracking-wide text-muted-foreground uppercase">Verified Creators</span>
          </div>
          
          {totalReviews > 0 && (
            <>
              <div className="hidden sm:block w-px h-12 bg-border/50" aria-hidden="true" />
              
              <div className="flex flex-col items-center text-center">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-3xl font-bold tracking-tight text-foreground">{displayRating}/5</span>
                </div>
                <div className="flex items-center gap-1 mb-1" aria-label={`${displayRating} stars`}>
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`h-3.5 w-3.5 ${i < Math.round(averageRating) ? 'fill-primary text-primary' : 'text-muted-foreground/30'}`} 
                    />
                  ))}
                </div>
                <span className="text-sm font-medium tracking-wide text-muted-foreground uppercase mt-0.5">Average Rating</span>
              </div>
            </>
          )}

          <div className="hidden sm:block w-px h-12 bg-border/50" aria-hidden="true" />

          <div className="flex flex-col items-center text-center max-w-[200px]">
             <span className="text-sm leading-snug font-medium text-muted-foreground">
               Built for creators who want one system for ideas, campaigns, and execution.
             </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
