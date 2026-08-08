import { Check, Sparkles } from 'lucide-react';
import { CREDIT_PACKS } from '@/lib/credits';
import { useCredits } from '@/hooks/useCredits';
import { Button } from '@/components/ui/button';

export default function CreditStorePage() {
  const { data: balance, isLoading } = useCredits();

  return (
    <div className="mx-auto max-w-6xl space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">Production capacity</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">CreatorOS Credits</h1>
          <p className="mt-2 text-sm text-muted-foreground">Add production capacity whenever you need it.</p>
        </div>
        <section className="min-w-[190px] rounded-2xl border border-primary/20 bg-primary/[0.05] p-4">
          <p className="text-xs text-muted-foreground">Available credits</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{isLoading ? '—' : (balance?.available ?? 0).toLocaleString()}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">{balance?.tier === 'free' ? 'Your one-time free balance' : 'Subscription and purchased credits'}</p>
        </section>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {CREDIT_PACKS.map((pack) => {
          const cardClass = pack.popular
            ? 'relative flex min-h-[240px] flex-col rounded-[20px] border border-primary/50 bg-primary/[0.06] p-6 shadow-[0_0_28px_rgba(124,58,237,0.12)]'
            : 'relative flex min-h-[240px] flex-col rounded-[20px] border border-white/[0.08] bg-[#111111] p-6';
          return (
            <article key={pack.id} className={cardClass}>
              {pack.popular && <span className="absolute right-5 top-5 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">Most popular</span>}
              <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
              <h2 className="mt-5 text-xl font-semibold text-foreground">{pack.credits.toLocaleString()} Credits</h2>
              <p className="mt-1 text-sm text-muted-foreground">Extra CreatorOS production capacity that does not expire with your subscription.</p>
              <p className="mt-5 text-3xl font-semibold text-foreground">$ {pack.price}</p>
              <ul className="mt-5 space-y-2 text-xs text-muted-foreground">
                <li className="flex gap-2"><Check className="h-3.5 w-3.5 text-primary" />Rolls over</li>
                <li className="flex gap-2"><Check className="h-3.5 w-3.5 text-primary" />Applied only after verified payment</li>
              </ul>
              <Button className="mt-auto h-11 w-full" onClick={() => window.location.assign(pack.checkoutUrl)}>Buy Credits</Button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
