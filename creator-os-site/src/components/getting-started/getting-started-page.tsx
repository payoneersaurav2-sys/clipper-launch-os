import { START_URL } from '#/lib/site'

const STEPS = [
  {
    n: '01',
    title: 'Sign up with email or Whop',
    body: 'Create your Creator OS account with email or continue with Whop. You land in the dashboard in under a minute.',
    img: '/getting-started/gs-signup.png',
    alt: 'Sign up screen with email and Whop options',
  },
  {
    n: '02',
    title: 'Choose your niche and platforms',
    body: 'Pick the niche you create for and the platforms you publish on. Creator OS uses this to score hooks and write captions that fit each feed.',
    img: '/getting-started/gs-niche.png',
    alt: 'Onboarding screen for niche and platform selection',
  },
  {
    n: '03',
    title: 'Create your first idea in Idea Studio',
    body: 'Drop a link or a rough concept. Idea Studio breaks it into focused angles you can actually film.',
    img: '/getting-started/gs-idea.png',
    alt: 'Idea Studio generating content angles',
  },
  {
    n: '04',
    title: 'Score a hook with Hook Engine',
    body: 'Paste a first line and get a retention score before you shoot. Rewrite until the opening three seconds are strong.',
    img: '/getting-started/gs-hook.png',
    alt: 'Hook Engine scoring a video hook',
  },
  {
    n: '05',
    title: 'Export your first caption',
    body: 'Turn the winning hook into a platform-ready caption, copy it, and post. That is the first full loop.',
    img: '/getting-started/gs-caption.png',
    alt: 'Caption OS export screen',
  },
]

export function GettingStartedPage() {
  return (
    <section className="px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-3xl text-center">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Getting started
        </p>
        <h1 className="text-[36px] font-semibold leading-[1.08] tracking-tight sm:text-[52px]">
          Your first five steps
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[16px] text-muted-foreground">
          From signup to an exported caption. Follow these steps in order the first time you open Creator OS.
        </p>
      </div>

      <ol className="mx-auto mt-14 max-w-3xl space-y-4">
        {STEPS.map((step) => (
          <li
            key={step.n}
            className="overflow-hidden rounded-[24px] border border-border bg-card"
          >
            <details className="group" open={step.n === '01'}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-left [&::-webkit-details-marker]:hidden">
                <span className="flex items-baseline gap-3">
                  <span className="text-[12px] font-semibold uppercase tracking-widest text-primary">
                    {step.n}
                  </span>
                  <span className="text-[17px] font-medium tracking-tight">{step.title}</span>
                </span>
                <span className="text-[13px] text-muted-foreground group-open:hidden">Show</span>
                <span className="hidden text-[13px] text-muted-foreground group-open:inline">Hide</span>
              </summary>
              <div className="space-y-4 border-t border-border px-6 py-5">
                <p className="text-[15px] leading-relaxed text-muted-foreground">{step.body}</p>
                <img
                  src={step.img}
                  alt={step.alt}
                  width={1280}
                  height={720}
                  className="w-full rounded-[16px] border border-border"
                />
              </div>
            </details>
          </li>
        ))}
      </ol>

      <div className="mx-auto mt-12 max-w-3xl rounded-[24px] border border-border bg-card px-6 py-10 text-center">
        <h2 className="text-[24px] font-semibold tracking-tight">Ready when you are</h2>
        <p className="mx-auto mt-2 max-w-md text-[15px] text-muted-foreground">
          Start a free trial and run this loop on your own content.
        </p>
        <a
          href={START_URL}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-[10px] bg-primary px-6 text-[14px] font-medium text-white shadow-[0_0_15px_rgba(124,58,237,0.25)] transition-all hover:bg-primary/90"
        >
          Start Free Trial
        </a>
      </div>
    </section>
  )
}
