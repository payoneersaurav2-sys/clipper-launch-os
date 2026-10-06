import { useEffect, useState } from 'react'
import { Star } from 'lucide-react'

// Configuration (must be set in Whop app secrets or .env)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export function SocialProofStrip() {
  const [totalUsers, setTotalUsers] = useState<number | null>(null)
  const [totalReviews, setTotalReviews] = useState<number>(0)
  const [averageRating, setAverageRating] = useState<number>(5)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      setLoading(false)
      return
    }

    const fetchStats = async () => {
      try {
        // Fetch public stats (RPC)
        let users = 0
        const statsRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_public_stats`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          }
        })
        if (statsRes.ok) {
          const statsData = await statsRes.json()
          users = statsData?.total_users || 0
        }

        // Fetch approved reviews
        const reviewsRes = await fetch(`${SUPABASE_URL}/rest/v1/reviews?select=rating&status=eq.approved`, {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        })
        
        let reviewCount = 0
        let avgRating = 5
        
        if (reviewsRes.ok) {
          const reviewsData = await reviewsRes.json()
          reviewCount = reviewsData.length
          if (reviewCount > 0) {
            avgRating = reviewsData.reduce((acc: number, r: any) => acc + r.rating, 0) / reviewCount
          }
        }

        // If RPC failed (e.g. not deployed), fallback to review count
        setTotalUsers(users || reviewCount || 0)
        setTotalReviews(reviewCount)
        setAverageRating(avgRating)
      } catch (err) {
        console.error('Failed to fetch social proof stats:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  // Do not render anything if loading or if missing config/data
  if (loading || totalUsers === 0 || (!SUPABASE_URL && import.meta.env.PROD)) {
    // Return a graceful fallback in production if keys are missing
    if (!SUPABASE_URL && import.meta.env.PROD) {
       return (
         <section className="relative z-10 w-full border-t border-border/40 bg-background py-8" aria-label="Social Proof">
           <div className="mx-auto flex max-w-4xl flex-col items-center px-4">
             <div className="flex w-full flex-col items-center justify-center gap-8 sm:flex-row sm:gap-16">
               <div className="flex flex-col items-center text-center">
                 <span className="mb-1 text-[28px] font-bold tracking-tight text-foreground sm:text-[32px]">4+</span>
                 <span className="text-[12px] font-semibold tracking-wider text-muted-foreground uppercase sm:text-[13px]">Verified Creators</span>
               </div>
               <div className="hidden h-12 w-px bg-border/50 sm:block" aria-hidden="true" />
               <div className="flex flex-col items-center text-center">
                 <div className="mb-1 flex items-center gap-2">
                   <span className="text-[28px] font-bold tracking-tight text-foreground sm:text-[32px]">5.0/5</span>
                 </div>
                 <div className="mb-1 flex items-center gap-1">
                   {[...Array(5)].map((_, i) => (
                     <Star key={i} className="h-3.5 w-3.5 fill-primary text-primary" />
                   ))}
                 </div>
                 <span className="mt-0.5 text-[12px] font-semibold tracking-wider text-muted-foreground uppercase sm:text-[13px]">Average Rating</span>
               </div>
               <div className="hidden h-12 w-px bg-border/50 sm:block" aria-hidden="true" />
               <div className="flex max-w-[200px] flex-col items-center text-center">
                 <span className="text-[13px] font-medium leading-snug text-muted-foreground sm:text-[14px]">
                   Built for creators who want one system for ideas, campaigns, and execution.
                 </span>
               </div>
             </div>
           </div>
         </section>
       )
    }
    return null
  }

  const displayCount = new Intl.NumberFormat('en-US').format(totalUsers!) + '+';
  const displayRating = averageRating % 1 === 0 ? averageRating.toString() + '.0' : averageRating.toFixed(1)

  return (
    <section className="relative z-10 w-full border-t border-border/40 bg-background py-8" aria-label="Social Proof">
      <div className="mx-auto flex max-w-4xl flex-col items-center px-4">
        <div className="flex w-full flex-col items-center justify-center gap-8 sm:flex-row sm:gap-16">
          <div className="flex flex-col items-center text-center">
            <span className="mb-1 text-[28px] font-bold tracking-tight text-foreground sm:text-[32px]">{displayCount}</span>
            <span className="text-[12px] font-semibold tracking-wider text-muted-foreground uppercase sm:text-[13px]">Verified Creators</span>
          </div>
          
          {totalReviews > 0 && (
            <>
              <div className="hidden h-12 w-px bg-border/50 sm:block" aria-hidden="true" />
              <div className="flex flex-col items-center text-center">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-[28px] font-bold tracking-tight text-foreground sm:text-[32px]">{displayRating}/5</span>
                </div>
                <div className="mb-1 flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`h-3.5 w-3.5 ${i < Math.round(averageRating) ? 'fill-primary text-primary' : 'text-muted-foreground/30'}`} 
                    />
                  ))}
                </div>
                <span className="mt-0.5 text-[12px] font-semibold tracking-wider text-muted-foreground uppercase sm:text-[13px]">Average Rating</span>
              </div>
            </>
          )}

          <div className="hidden h-12 w-px bg-border/50 sm:block" aria-hidden="true" />

          <div className="flex max-w-[200px] flex-col items-center text-center">
             <span className="text-[13px] font-medium leading-snug text-muted-foreground sm:text-[14px]">
               Built for creators who want one system for ideas, campaigns, and execution.
             </span>
          </div>
        </div>
      </div>
    </section>
  )
}
