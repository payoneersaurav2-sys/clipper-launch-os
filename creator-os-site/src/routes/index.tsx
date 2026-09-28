import { createFileRoute } from '@tanstack/react-router'
import { HomePage } from '#/components/home/home-page'
import { SITE_DESCRIPTION, SITE_TITLE, WORDMARK_URL } from '#/lib/site'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: SITE_TITLE },
      { name: 'description', content: SITE_DESCRIPTION },
      { property: 'og:title', content: SITE_TITLE },
      { property: 'og:description', content: SITE_DESCRIPTION },
      { property: 'og:image', content: WORDMARK_URL },
    ],
  }),
  component: HomePage,
})
