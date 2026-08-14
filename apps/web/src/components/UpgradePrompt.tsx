import { ArrowUpRight, LockKeyhole, CreditCard } from 'lucide-react';
import { pricingPlans } from '@/lib/pricing';
import { PlanTier } from '@/lib/entitlements';
import { Button } from '@/components/ui/button';
import { useEntitlements } from '@/hooks/useEntitlements';
import { useAuthStore } from '@/stores/useAuthStore';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

type UpgradePromptProps = {
  feature: string;
  requiredPlan?: Exclude<PlanTier, 'free'>;
  description: string;
  compact?: boolean;
};

export function UpgradePrompt({
  feature,
  requiredPlan,
  description,
  compact = false,
}: UpgradePromptProps) {
  const { data: entitlements } = useEntitlements();
  const { subscriptionTier } = useAuthStore();
  const { user } = useAuthStore();

  const resolvedRequiredPlan = requiredPlan ?? 'creator';
  const plan = pricingPlans.find((entry) => entry.id === resolvedRequiredPlan);
  const checkoutUrl = plan?.checkout.monthly.url;

  // If the user already has the required plan or better, show next actions
  const tierOrder: Record<PlanTier, number> = { free: 0, creator: 1, pro: 2, agency: 3 };
  const userTier = (entitlements?.tier ?? subscriptionTier ?? 'free') as PlanTier;
  const alreadyHas = tierOrder[userTier] >= tierOrder[resolvedRequiredPlan];

  // If entitlements are not active but user has available credits, treat as having access
  const { data: creditSum } = useQuery({
    queryKey: ['available_credits', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { data } = await supabase
        .from('credit_lots')
        .select('remaining_credits', { count: 'exact' })
        .eq('user_id', user.id)
        .gt('remaining_credits', 0);
      if (!data) return 0;
      return data.reduce((acc: number, r: any) => acc + Number(r.remaining_credits ?? 0), 0);
    },
    enabled: Boolean(user?.id),
    staleTime: 30_000,
  });

  const hasCredits = Number(creditSum ?? 0) > 0;
  const effectiveHas = alreadyHas || hasCredits;

  if (effectiveHas) {
    return (
      <section className={compact
        ? 'flex items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/[0.03] px-3 py-2'
        : 'rounded-2xl border border-primary/20 bg-primary/[0.03] p-5'}>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <CreditCard className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">Feature available</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">You already have access to this feature. Here are recommended upgrades to consider now.</p>
            <div className="mt-2 flex gap-2">
              <Button size="sm" onClick={() => window.location.assign('/dashboard/credits')}>
                Buy Credits
              </Button>
              {tierOrder[userTier] < tierOrder['creator'] && (
                <Button size="sm" variant="outline" onClick={() => window.location.assign('/dashboard/pricing')}>
                  Upgrade plans
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={compact
      ? 'flex items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/[0.05] px-3 py-2'
      : 'rounded-2xl border border-primary/20 bg-primary/[0.05] p-5'}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <LockKeyhole className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-semibold text-foreground">{feature}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            {description} Available with {plan?.name ?? resolvedRequiredPlan}.
          </p>
        </div>
      </div>
      {checkoutUrl && (
        <Button
          type="button"
          size="sm"
          className="shrink-0"
          onClick={() => window.location.assign(checkoutUrl)}
          aria-label={`Upgrade to ${plan?.name ?? resolvedRequiredPlan}`}
        >
          Upgrade <ArrowUpRight className="ml-1 h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      )}
    </section>
  );
}
