import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, BadgeCheck, MessageSquare } from 'lucide-react';
import { useApprovedReviews, Review } from '@/hooks/useReviews';
import { ReviewModal } from './ReviewModal';

const ReviewCard = ({ review, featured = false }: { review: Review; featured?: boolean }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`relative flex h-full flex-col justify-between overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#0A0A0A]/60 backdrop-blur-xl p-6 sm:p-8 transition-colors hover:bg-[#111111]/80 ${
        featured ? 'ring-1 ring-primary/20 shadow-[0_0_40px_rgba(124,58,237,0.15)]' : ''
      }`}
    >
      <div>
        <div className="mb-4 flex space-x-1" aria-label={`${review.rating} out of 5 stars`}>
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-5 w-5 ${
                i < review.rating ? 'fill-primary text-primary' : 'text-white/10'
              }`}
            />
          ))}
        </div>
        <p
          className={`mb-8 font-medium leading-relaxed tracking-tight text-white/90 ${
            featured ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'
          }`}
        >
          "{review.review_text}"
        </p>
      </div>

      <div className="flex items-center space-x-4 mt-auto pt-4">
        {review.avatar_url ? (
          <img
            src={review.avatar_url}
            alt={review.name}
            className="h-12 w-12 rounded-full border border-white/10 object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 shrink-0">
            <span className="text-lg font-semibold text-white/60">
              {review.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="flex flex-col overflow-hidden">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-white truncate">{review.name}</span>
            {review.verified && (
              <BadgeCheck className="h-4 w-4 text-primary shrink-0" aria-label="Verified Creator" />
            )}
          </div>
          {(review.handle || review.role) && (
            <span className="text-sm text-white/50 truncate">
              {review.handle ? `${review.handle}` : ''}
              {review.handle && review.role ? ' • ' : ''}
              {review.role ? review.role : ''}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export function ReviewsSection() {
  const { data: reviews, isLoading } = useApprovedReviews();
  const [modalOpen, setModalOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const featuredReview = reviews?.find(r => r.is_featured) || reviews?.[0];
  const otherReviews = reviews?.filter(r => r.id !== featuredReview?.id) || [];

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -350 : 350;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <section className="py-24" aria-busy="true">
        <div className="flex justify-center"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div></div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden bg-[#030303] px-4 py-20 sm:px-6 sm:py-28 lg:py-32" aria-labelledby="reviews-heading">
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[800px] rounded-full bg-primary/10 opacity-50 blur-[120px]" />

      <div className="mx-auto max-w-7xl">
        <div className="mb-16 md:text-center">
          <p className="mb-3 text-[11px] font-semibold tracking-[0.16em] text-primary uppercase">
            Creators are building with Creator OS
          </p>
          <h2 id="reviews-heading" className="text-[32px] font-semibold leading-[1.08] tracking-[-0.04em] text-white sm:text-[46px]">
            What creators are saying
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-white/60 max-w-2xl md:mx-auto">
            Real experiences from creators using Creator OS to create, organize, and grow.
          </p>
        </div>

        {(!reviews || reviews.length === 0) ? (
          <div className="mx-auto flex max-w-3xl flex-col items-center justify-center rounded-[24px] border border-white/5 bg-white/[0.02] p-12 text-center backdrop-blur-sm sm:p-20">
            <MessageSquare className="mb-6 h-12 w-12 text-white/20" />
            <h3 className="mb-4 text-2xl font-semibold tracking-tight text-white">No reviews yet</h3>
            <p className="mb-8 text-white/60">Be one of the first creators to share their experience.</p>
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex h-12 items-center justify-center rounded-[12px] bg-primary px-8 text-[14px] font-semibold text-white shadow-sm transition-colors hover:bg-primary/90"
            >
              WRITE A REVIEW &rarr;
            </button>
          </div>
        ) : (
          <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row">
            {featuredReview && (
              <div className="w-full lg:w-[45%] flex-shrink-0">
                <ReviewCard review={featuredReview} featured />
              </div>
            )}

            <div className="flex flex-1 flex-col justify-center overflow-hidden relative min-h-[300px]">
              {otherReviews.length > 0 ? (
                <>
                  <div 
                    ref={scrollContainerRef}
                    className="flex overflow-x-auto gap-6 pb-4 pt-2 snap-x snap-mandatory hide-scrollbar relative"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {otherReviews.map((review) => (
                      <div key={review.id} className="w-[85%] sm:w-[45%] md:w-[350px] shrink-0 snap-start">
                        <ReviewCard review={review} />
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-end space-x-3 pr-2">
                    <button
                      onClick={() => handleScroll('left')}
                      aria-label="Previous reviews"
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleScroll('right')}
                      aria-label="Next reviews"
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex h-full items-center justify-center rounded-[24px] border border-white/[0.04] bg-white/[0.01] p-8 text-center text-white/40">
                  More reviews coming soon.
                </div>
              )}
            </div>
          </div>
        )}

        {reviews && reviews.length > 0 && (
          <div className="mt-20 flex flex-col items-center justify-center text-center">
            <h3 className="mb-2 text-xl font-semibold tracking-tight text-white">Using Creator OS?</h3>
            <p className="mb-8 text-white/60">Share your experience with other creators.</p>
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex h-12 items-center justify-center rounded-[12px] bg-primary px-8 text-[14px] font-semibold text-white shadow-sm transition-colors hover:bg-primary/90"
            >
              WRITE A REVIEW &rarr;
            </button>
          </div>
        )}
      </div>

      <ReviewModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </section>
  );
}
