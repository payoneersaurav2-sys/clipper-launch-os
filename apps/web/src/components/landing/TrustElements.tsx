import { motion } from 'framer-motion';
import { Star, BadgeCheck } from 'lucide-react';
import type { Review } from '@/hooks/useReviews';

interface TrustProps {
  review?: Review;
}

export function HeroTrustStrip({ review }: TrustProps) {
  if (!review) {
    return (
      <div className="flex flex-col items-center justify-center mt-12 mb-4">
        <p className="text-sm font-medium text-muted-foreground">
          Built for creators who want one connected workflow.
        </p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="mt-14 mb-4 flex flex-col items-center justify-center text-center max-w-lg mx-auto"
    >
      <div className="flex items-center gap-1 mb-3 text-primary" aria-label={`${review.rating} stars`}>
        {[...Array(5)].map((_, i) => (
          <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-current' : 'text-white/10 fill-white/10'}`} />
        ))}
      </div>
      <p className="text-[15px] sm:text-[17px] font-medium tracking-tight text-white/90 mb-3 leading-relaxed">
        "{review.review_text.length > 90 ? review.review_text.substring(0, 90) + '...' : review.review_text}"
      </p>
      <div className="flex items-center gap-2 text-sm text-white/60">
        <span className="font-semibold text-white/80">{review.name}</span>
        {(review.role || review.handle) && (
          <>
            <span className="text-white/30">•</span>
            <span>{review.role || review.handle}</span>
          </>
        )}
        {review.verified && <BadgeCheck className="h-4 w-4 text-primary ml-1" />}
      </div>
    </motion.div>
  );
}

export function FeatureReviewSnippet({ review, align = 'left' }: TrustProps & { align?: 'left' | 'center' }) {
  if (!review) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`mt-6 inline-flex flex-col ${align === 'center' ? 'items-center text-center' : 'items-start text-left'}`}
    >
      <div className="flex items-center gap-1 mb-2 text-primary">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'fill-current' : 'text-white/10 fill-white/10'}`} />
        ))}
      </div>
      <p className="text-[14px] italic text-white/80 leading-relaxed max-w-sm mb-2">
        "{review.review_text.length > 120 ? review.review_text.substring(0, 120) + '...' : review.review_text}"
      </p>
      <div className="flex items-center gap-2 text-[12px] text-white/50">
        <span className="font-semibold text-white/70">{review.name}</span>
        {review.verified && <BadgeCheck className="h-3 w-3 text-primary" />}
      </div>
    </motion.div>
  );
}

export function PricingTrustSnippet({ review }: TrustProps) {
  if (!review) return null;

  return (
    <div className="mt-8 pt-8 border-t border-white/5 max-w-md mx-auto">
      <p className="text-sm font-semibold text-white/40 uppercase tracking-widest mb-4">Still deciding?</p>
      <div className="flex items-center justify-center gap-1 mb-2 text-primary">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-current' : 'text-white/10 fill-white/10'}`} />
        ))}
      </div>
      <p className="text-[15px] font-medium text-white/90 leading-relaxed mb-3">
        "{review.review_text.length > 100 ? review.review_text.substring(0, 100) + '...' : review.review_text}"
      </p>
      <p className="text-[13px] text-white/60">
        — <span className="text-white/80">{review.name}</span>
      </p>
    </div>
  );
}
