import { ArrowUpRight, LockKeyhole } from 'lucide-react';
import { pricingPlans } from '@/lib/pricing';
import { PlanTier } from '@/lib/entitlements';
import { Button } from '@/components/ui/button';
import { useEntitlements } from '@/hooks/useEntitlements';
import { useAuthStore } from '@/stores/useAuthStore';
import { useCheckout } from '@/hooks/useCheckout';

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
  const { beginCheckout } = useCheckout();

  const resolvedRequiredPlan = requiredPlan ?? 'creator';
  const plan = pricingPlans.find((entry) => entry.id === resolvedRequiredPlan);
    const paddlePriceId = plan?.checkout.monthly.paddlePriceId;

  // If the user already has the required plan or better, hide prompt
  const tierOrder: Record<PlanTier, number> = { free: 0, creator: 1, pro: 2, agency: 3 };
  const userTier = (entitlements?.tier ?? subscriptionTier ?? 'free') as PlanTier;
  const alreadyHas = tierOrder[userTier] >= tierOrder[resolvedRequiredPlan];

  if (alreadyHas) {
    return null;
  }

  const handleUpgrade = () => {
    beginCheckout(undefined, paddlePriceId, { planId: resolvedRequiredPlan, billing: 'monthly' });
  };

  return (
    <section className={compact
      ? 'flex items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/[0.05] px-3 py-2'
      : 'flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-primary/20 bg-primary/[0.05] p-5'}>
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
      {plan && (
        <Button
          type="button"
          size="sm"
          className="shrink-0"
          onClick={handleUpgrade}
          aria-label={`Upgrade to ${plan?.name ?? resolvedRequiredPlan}`}
        >
          Upgrade <ArrowUpRight className="ml-1 h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      )}
    </section>
  );
}
