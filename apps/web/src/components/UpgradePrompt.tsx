import { ArrowUpRight, LockKeyhole } from 'lucide-react';
import { pricingPlans } from '@/lib/pricing';
import { PlanTier } from '@/lib/entitlements';
import { Button } from '@/components/ui/button';

type UpgradePromptProps = {
  feature: string;
  requiredPlan: PlanTier;
  description: string;
  compact?: boolean;
};

export function UpgradePrompt({
  feature,
  requiredPlan,
  description,
  compact = false,
}: UpgradePromptProps) {
  const plan = pricingPlans.find((entry) => entry.id === requiredPlan);
  const checkoutUrl = plan?.checkout.monthly.url;

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
            {description} Available with {plan?.name ?? requiredPlan}.
          </p>
        </div>
      </div>
      {checkoutUrl && (
        <Button
          type="button"
          size="sm"
          className="shrink-0"
          onClick={() => window.location.assign(checkoutUrl)}
          aria-label={`Upgrade to ${plan?.name ?? requiredPlan}`}
        >
          Upgrade <ArrowUpRight className="ml-1 h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      )}
    </section>
  );
}
