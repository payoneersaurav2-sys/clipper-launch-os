import { useState } from 'react'
import { Plus } from 'lucide-react'
import { CONTACT_EMAIL, FAQ_PAGE } from '#/lib/site'
import { cn } from '#/lib/cn'

export function FaqPage() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className="px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-3xl text-center">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          SUPPORT
        </p>
        <h1 className="text-[36px] font-semibold leading-[1.08] tracking-tight sm:text-[52px]">
          Frequently Asked
          <br />
          Questions
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[16px] text-muted-foreground">
          Everything you need to know about Creator OS. Can't find the answer? Email us.
        </p>
      </div>

      <div className="mx-auto mt-12 max-w-3xl overflow-hidden rounded-[24px] border border-border bg-card">
        {FAQ_PAGE.map((item, index) => {
          const isOpen = open === index
          return (
            <div key={item.question} className={index === 0 ? '' : 'border-t border-border'}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : index)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                aria-expanded={isOpen}
              >
                <span className="text-[15px] font-medium tracking-tight">{item.question}</span>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground">
                  <Plus className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-45')} />
                </span>
              </button>
              {isOpen ? (
                <p className="px-6 pb-5 text-[14px] leading-relaxed text-muted-foreground">
                  {item.answer}
                </p>
              ) : null}
            </div>
          )
        })}
      </div>

      <p className="mt-10 text-center text-[14px] text-muted-foreground">
        Still have questions?{' '}
        <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-foreground hover:text-primary">
          {CONTACT_EMAIL}
        </a>
      </p>
    </section>
  )
}
