import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useEntitlements } from '@/hooks/useEntitlements';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button } from '@/components/ui/button';

export default function CheckoutCompletePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 15; // 15 attempts * 2 seconds = 30 seconds max polling

  const { data: entitlements, refetch, isError } = useEntitlements();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (user === null) { // null specifically, meaning initialized and no user
      navigate('/login?returnTo=/checkout/complete');
    }
  }, [user, navigate]);

  // Poll for entitlements
  useEffect(() => {
    if (!user) return;
    
    // If we already have a paying tier, redirect to dashboard
    if (entitlements?.tier && entitlements.tier !== 'free') {
      const timer = setTimeout(() => navigate('/dashboard'), 2000);
      return () => clearTimeout(timer);
    }

    // Otherwise, poll every 2 seconds
    if (attempts < maxAttempts) {
      const timer = setTimeout(() => {
        refetch();
        setAttempts(prev => prev + 1);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [user, entitlements, attempts, refetch, navigate]);

  const hasSucceeded = entitlements?.tier && entitlements.tier !== 'free';
  const hasFailed = isError || (attempts >= maxAttempts && !hasSucceeded);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center shadow-xl relative overflow-hidden"
      >
        {/* Background visual effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          {hasSucceeded ? (
            <>
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground mb-3">
                You're all set.
              </h1>
              <p className="text-muted-foreground text-[15px] leading-relaxed mb-8">
                Your Creator OS {entitlements?.tier} access is active. Taking you to the dashboard...
              </p>
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </>
          ) : hasFailed ? (
            <>
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground mb-3">
                We're still waiting on Whop
              </h1>
              <p className="text-muted-foreground text-[15px] leading-relaxed mb-8">
                Your payment might still be processing, or there was a delay in receiving the confirmation. Your account will automatically upgrade once the payment clears.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
                <Button variant="outline" onClick={() => navigate('/dashboard')} className="w-full sm:w-auto">
                  Go to Dashboard
                </Button>
                <Button onClick={() => window.location.reload()} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white">
                  Check Again
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 border border-primary/20">
                <Sparkles className="w-8 h-8 text-primary animate-pulse" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground mb-3">
                Finalizing your access...
              </h1>
              <p className="text-muted-foreground text-[15px] leading-relaxed mb-8">
                Please wait while we verify your subscription with Whop. This usually takes just a few seconds.
              </p>
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
