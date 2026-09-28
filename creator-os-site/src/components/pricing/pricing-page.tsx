import { useState } from 'react'
import { Check, Sparkles } from 'lucide-react'
import { annualSavings, PLANS } from '#/lib/site'
import { cn } from '#/lib/cn'

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

export function PricingPage() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')
  const annual = billing === 'annual'

  return (
    <div className="relative overflow-hidden">
      <div className="grid-hero pointer-events-none absolute inset-0" />
      <section className="relative px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24">
        <div className="mx-auto max-w-6xl text-center">
          <div className="mb-4 inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-[12px] font-medium backdrop-blur-md">
            <Sparkles className="mr-2 h-3.5 w-3.5 text-primary" />
            <span className="tracking-wide text-muted-foreground">PRICING</span>
          </div>
          <p className="mb-3 text-[11px] font-semibold tracking-[0.16em] text-primary">
            CHOOSE YOUR OPERATING SYSTEM
          </p>
          <h1 className="text-[36px] font-semibold leading-[1.05] tracking-tight sm:text-[52px] md:text-[64px]">
            Build your content operation.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[16px] text-muted-foreground">
            Start simple. Scale when your workflow demands it.
          </p>

          <div className="mt-8 inline-flex items-center rounded-full border border-border bg-card p-1">
            {(['monthly', 'annual'] as const).map((id) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={billing === id}
                onClick={() => setBilling(id)}
                className={cn(
                  'relative h-9 rounded-full px-5 text-[12px] font-semibold uppercase tracking-wide transition-colors',
                  billing === id ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {id === 'monthly' ? 'MONTHLY' : 'ANNUAL'}
              </button>
            ))}
          </div>
          <p className="mt-3 text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
            ANNUAL SAVES 17%
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-6xl gap-5 lg:grid-cols-3">
          {PLANS.map((plan) => {
            const savings = annualSavings(plan.monthlyPrice, plan.annualPrice)
            const price = annual ? plan.annualPrice : plan.monthlyPrice
            return (
              <article
                key={plan.id}
                className={cn(
                  'relative flex flex-col rounded-[24px] border bg-card p-6 text-left shadow-sm sm:p-8',
                  plan.recommended
                    ? 'border-primary/40 shadow-[0_0_0_1px_rgba(100,26,230,0.12),0_18px_40px_rgba(124,58,237,0.12)]'
                    : 'border-border',
                )}
              >
                {plan.recommended ? (
                  <span className="absolute right-6 top-6 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
                    MOST POPULAR
                  </span>
                ) : null}
                <h2 className="text-[22px] font-semibold tracking-tight">{plan.name}</h2>
                <p className="mt-1 min-h-[40px] text-[14px] text-muted-foreground">{plan.positioning}</p>
                <div className="mt-6 border-t border-border pt-6">
                  <div className="flex items-end gap-1">
                    <span className="text-[48px] font-semibold leading-none tracking-tight">
                      {money.format(price)}
                    </span>
                    <span className="mb-2 text-[14px] text-muted-foreground">
                      /{annual ? 'year' : 'month'}
                    </span>
                  </div>
                  <div className="mt-3 min-h-[40px] text-[12px] leading-5 text-muted-foreground">
                    {annual ? (
                      <>
                        Billed annually.
                        <br />
                        Save {money.format(savings.amount)}/year · {savings.percent}%
                      </>
                    ) : (
                      <>
                        Billed monthly.
                        <br />
                        Pay annually to save {money.format(savings.amount)}/year.
                      </>
                    )}
                  </div>
                </div>
                <ul className="mt-6 space-y-3" aria-label={`${plan.name} capabilities`}>
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-[14px]">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2.4} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href={plan.checkout[billing]}
                  aria-label={`${plan.cta}: ${plan.name} ${billing} plan`}
                  className={cn(
                    'mt-8 inline-flex h-11 items-center justify-center rounded-[12px] text-[14px] font-semibold transition-all',
                    plan.recommended
                      ? 'bg-primary text-white shadow-[0_0_22px_rgba(124,58,237,0.3)] hover:bg-primary/90 hover:shadow-[0_0_30px_rgba(124,58,237,0.48)]'
                      : 'border border-border bg-secondary text-foreground hover:border-primary/50 hover:bg-primary/15',
                  )}
                >
                  {plan.cta}
                </a>
              </article>
            )
          })}
        </div>
        <p className="mx-auto mt-8 max-w-2xl text-center text-[13px] text-muted-foreground">
          Secure checkout is handled by Whop. Annual billing is clearly shown before checkout.
        </p>
      </section>
    </div>
  )
}
