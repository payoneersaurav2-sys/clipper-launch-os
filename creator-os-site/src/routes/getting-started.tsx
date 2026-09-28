import { createFileRoute } from '@tanstack/react-router'
import { GettingStartedPage } from '#/components/getting-started/getting-started-page'
import { WORDMARK_URL } from '#/lib/site'

const TITLE = 'Getting Started — Creator OS'
const DESCRIPTION =
  'Walk through the first five steps in Creator OS: sign up, choose your niche, create an idea, score a hook, and export a caption.'

export const Route = createFileRoute('/getting-started')({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: 'description', content: DESCRIPTION },
      { property: 'og:title', content: TITLE },
      { property: 'og:description', content: DESCRIPTION },
      { property: 'og:image', content: WORDMARK_URL },
    ],
  }),
  component: GettingStartedPage,
})
