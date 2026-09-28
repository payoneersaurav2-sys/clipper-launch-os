import { Wordmark } from '#/components/site/header'
import { CONTACT_EMAIL, FAQ_URL, FEATURES_URL, FOR_AGENCIES_URL, PRICING_URL, SIGN_IN_URL, START_URL, TERMS_URL } from '#/lib/site'

const NAV: Array<{ label: string; href: string }> = [
  { label: 'Features', href: FEATURES_URL },
  { label: 'For Agencies', href: FOR_AGENCIES_URL },
  { label: 'Pricing', href: PRICING_URL },
  { label: 'FAQ', href: FAQ_URL },
  { label: 'Terms', href: TERMS_URL },
  { label: 'Contact', href: `mailto:${CONTACT_EMAIL}` },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background dark:border-white/[0.06] dark:bg-[#080808]">
      <div className="mx-auto max-w-6xl px-4 pb-10 pt-12 sm:px-6 lg:pb-12 lg:pt-16">
        <div className="grid grid-cols-1 gap-8 border-b border-border pb-10 sm:grid-cols-2 md:grid-cols-3 lg:gap-12 dark:border-white/[0.06]">
          <div className="sm:col-span-2 md:col-span-1">
            <Wordmark size="md" />
            <p className="mt-3 max-w-[260px] text-[14px] leading-relaxed tracking-tight text-muted-foreground">
              Operating System for Modern Creators.
            </p>
          </div>
          <div>
            <p className="mb-5 text-[12px] font-medium uppercase tracking-widest text-muted-foreground">
              Navigation
            </p>
            <ul className="space-y-3">
              {NAV.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="text-[14px] tracking-tight text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-5 text-[12px] font-medium uppercase tracking-widest text-muted-foreground">
              Get Access
            </p>
            <div className="space-y-3">
              <a
                href={START_URL}
                className="block text-[14px] tracking-tight text-primary transition-colors hover:text-primary/80 font-medium"
              >
                Get Started Free →
              </a>
              <a
                href={SIGN_IN_URL}
                className="block text-[14px] tracking-tight text-muted-foreground transition-colors hover:text-foreground"
              >
                Sign In
              </a>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="block text-[14px] tracking-tight text-muted-foreground transition-colors hover:text-primary break-all"
              >
                {CONTACT_EMAIL}
              </a>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-between gap-4 pt-8 sm:flex-row">
          <p className="text-center text-[13px] tracking-tight text-muted-foreground sm:text-left">
            © 2026 Creator OS. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
