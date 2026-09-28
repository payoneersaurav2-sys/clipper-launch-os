import { createFileRoute } from '@tanstack/react-router'
import { FaqPage } from '#/components/faq/faq-page'
import { SITE_TITLE, WORDMARK_URL } from '#/lib/site'

export const Route = createFileRoute('/faq')({
  head: () => ({
    meta: [
      { title: SITE_TITLE },
      { name: 'description', content: "Everything you need to know about Creator OS. Can't find the answer? Email us." },
      { property: 'og:title', content: SITE_TITLE },
      { property: 'og:image', content: WORDMARK_URL },
    ],
  }),
  component: FaqPage,
})
