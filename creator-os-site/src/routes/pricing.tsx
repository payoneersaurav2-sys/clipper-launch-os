import { createFileRoute } from '@tanstack/react-router'
import { PricingPage } from '#/components/pricing/pricing-page'
import { SITE_TITLE, WORDMARK_URL } from '#/lib/site'

export const Route = createFileRoute('/pricing')({
  head: () => ({
    meta: [
      { title: SITE_TITLE },
      { name: 'description', content: 'Build your content operation. Start simple. Scale when your workflow demands it.' },
      { property: 'og:title', content: SITE_TITLE },
      { property: 'og:image', content: WORDMARK_URL },
    ],
  }),
  component: PricingPage,
})
