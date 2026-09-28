export const SITE_TITLE =
  'Creator OS — AI Hook Generator & Short-Form Content Operating System'
export const SITE_DESCRIPTION =
  'More than just a Trello alternative for video production. Score viral hooks, automate TikTok captions, and manage short-form campaigns from a single dashboard.'

export const WORDMARK_URL =
  'https://creator-os.online/brand/creator-os-wordmark-optimized.webp'

export const CONTACT_EMAIL = 'sauravwhop@gmail.com'
export const PRODUCT_URL = 'https://creator-os.online'
export const APP_URL = 'https://whop.com/forgeos/exp_sZcNr5kIjUQW9e/app/'
export const SIGN_IN_URL = 'https://creator-os.online/login'
export const START_URL = 'https://creator-os.online/login?mode=signup'

// External Vercel site page links — all navigation redirects here
export const PRICING_URL = 'https://creator-os.online/pricing'
export const FAQ_URL = 'https://creator-os.online/faq'
export const FEATURES_URL = 'https://creator-os.online/#features'
export const FOR_AGENCIES_URL = 'https://creator-os.online/for-agencies'
export const CHANGELOG_URL = 'https://creator-os.online/changelog'
export const TERMS_URL = 'https://creator-os.online/terms'

export const PLANS = [
  {
    id: 'creator',
    name: 'Creator',
    positioning: 'Build your content engine.',
    monthlyPrice: 29,
    annualPrice: 290,
    cta: 'Start Creating',
    recommended: false,
    features: [
      'Idea Studio and Hook Engine',
      'Platform-ready Caption OS',
      'Core Campaign OS and Clip Pipeline',
      '3 workspaces · 50 active campaigns',
      '30-item content batches',
      'Higher AI workflow capacity',
    ],
    checkout: {
      monthly: 'https://whop.com/checkout/ch_VuECyj3ukzhcPZz/',
      annual: 'https://whop.com/checkout/ch_6YNyBLUa0uC3QG5/',
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    positioning: 'Run your complete creator workflow.',
    monthlyPrice: 49,
    annualPrice: 490,
    cta: 'Start Pro',
    recommended: true,
    features: [
      'Idea Studio and Hook Engine',
      'Platform-ready Caption OS',
      'Core Campaign OS and Clip Pipeline',
      '10 workspaces · 250 active campaigns',
      '50-item content batches',
      'Highest AI workflow capacity',
    ],
    checkout: {
      monthly: 'https://whop.com/checkout/ch_epe1aRH4HV0KoVr/',
      annual: 'https://whop.com/checkout/ch_0hbmhUPceFCSoTB/',
    },
  },
  {
    id: 'agency',
    name: 'Agency',
    positioning: 'Scale content across brands and clients.',
    monthlyPrice: 149,
    annualPrice: 1490,
    cta: 'Start Scaling',
    recommended: false,
    features: [
      'Idea Studio and Hook Engine',
      'Platform-ready Caption OS',
      'Core Campaign OS and Clip Pipeline',
      '10 workspaces · 250 active campaigns',
      '50-item content batches',
      'Highest AI workflow capacity',
    ],
    checkout: {
      monthly: 'https://whop.com/checkout/ch_FbbfDDCEMilgH4u/',
      annual: 'https://whop.com/checkout/ch_aNYkJbqP4MEYOQo/',
    },
  },
] as const

export function annualSavings(monthlyPrice: number, annualPrice: number) {
  const monthlyTotal = monthlyPrice * 12
  const amount = monthlyTotal - annualPrice
  const percent = Math.round((amount / monthlyTotal) * 100)
  return { amount, percent, monthlyTotal }
}

export const SAURAV_REVIEW = {
  name: 'Saurav',
  role: 'Creator.',
  text: 'Absolutely fantastic Liked a lot . Has helped in every project for me....',
  rating: 5,
}

export const HOME_FAQS = [
  {
    question: "Do I need video editing skills to use Creator OS?",
    answer: "No. Creator OS is not a video editor. It is a workflow operating system that focuses on planning, ideation, hook scoring, SEO captions, campaigns, and knowledge management. You still use your own video editor (like Premiere, CapCut, or Opus Clip) to cut the actual video."
  },
  {
    question: "Can I use Creator OS for client work?",
    answer: "Yes. With the Agency plan, you can set up isolated client workspaces (Brand Profiles). This ensures client-specific knowledge, context, and AI generations remain completely separated. You can also invite team members with specific roles and access permissions."
  },
  {
    question: "Can I start Creator OS for free?",
    answer: "Yes, Creator OS has a Free plan that lets you explore the platform. You get 1 Workspace, up to 10 active campaigns, and access to core Idea & Hook tools. You can upgrade when your workflow demands it."
  },
  {
    question: "Who is Creator OS built for?",
    answer: "Creator OS is built for short-form video creators, solopreneurs, UGC creators, and agencies who want a repeatable system for content creation instead of chaotic spreadsheets."
  },
  {
    question: "Does Creator OS work for agencies?",
    answer: "Yes. Creator OS helps agencies manage multiple brands without mixing their context. Agency workspaces provide multi-client environment isolation and client-scoped AI context."
  },
  {
    question: "Can Creator OS use my brand and knowledge?",
    answer: "Yes. You can add specific brand guidelines, facts, and context into your Knowledge Vault. The AI will securely use this information as context to ensure generated ideas, hooks, and captions sound like your brand."
  },
  {
    question: "What can I do with Creator OS?",
    answer: "You can brainstorm viral angles in the Idea Studio, predict viewer retention with the Hook Engine, write platform-specific SEO captions with Caption OS, organize deliverables in the Campaign Center, and store brand facts in the Knowledge Vault."
  },
  {
    question: "What happens when I upgrade my plan?",
    answer: "When you upgrade, your account immediately unlocks higher AI generation limits, more workspaces, and advanced features like the Knowledge Vault or Agency client isolation. Billing and subscriptions are securely handled through Whop."
  }
]

export const FAQ_PAGE = [
  {
    question: 'What is Creator OS?',
    answer:
      'Creator OS is an all-in-one operating system that helps creators generate ideas, create content, manage campaigns, and organize their entire workflow from one place. It replaces the chaos of juggling disconnected tools with a single, cohesive workspace engineered for modern creators.',
  },
  {
    question: 'Who is Creator OS for?',
    answer:
      'Creator OS is designed for creators, clippers, UGC creators, freelancers, agencies, and anyone building a serious content business. Whether you are just starting out or managing a team, Creator OS scales with your ambitions.',
  },
  {
    question: 'Do I need AI experience to use Creator OS?',
    answer:
      'No. Creator OS is built to be immediately accessible for beginners while remaining powerful enough for experienced creators. The AI tools are guided, contextual, and require no technical background.',
  },
  {
    question: 'Does Creator OS guarantee income?',
    answer:
      'No. Creator OS provides premium tools and structured workflows that significantly improve your productivity and output quality. Success depends on your execution, consistency, and content strategy.',
  },
  {
    question: 'Will I receive future updates?',
    answer:
      'Yes. Product updates and improvements are included according to your purchased plan. We continuously ship new features, modules, and improvements based on creator feedback.',
  },
  {
    question: 'Can I cancel my subscription?',
    answer:
      'Yes. Recurring subscriptions can be cancelled at any time directly from your account settings. Cancellation takes effect at the end of the current billing period.',
  },
  {
    question: 'Can I use Creator OS on multiple devices?',
    answer:
      'Yes. Creator OS is a web-based application. Simply sign into your account from any supported device and browser.',
  },
  {
    question: 'How can I contact support?',
    answer:
      'Reach us directly at sauravwhop@gmail.com. We aim to respond to all inquiries within 24–48 hours.',
  },
  {
    question: "Do I need video editing skills to use Creator OS?",
    answer: "No. Creator OS is not a video editor. It is a workflow operating system that focuses on planning, ideation, hook scoring, SEO captions, campaigns, and knowledge management. You still use your own video editor (like Premiere, CapCut, or Opus Clip) to cut the actual video."
  },
  {
    question: "Can I use Creator OS for client work?",
    answer: "Yes. With the Agency plan, you can set up isolated client workspaces (Brand Profiles). This ensures client-specific knowledge, context, and AI generations remain completely separated. You can also invite team members with specific roles and access permissions."
  },
  {
    question: "Can I start Creator OS for free?",
    answer: "Yes, Creator OS has a Free plan that lets you explore the platform. You get 1 Workspace, up to 10 active campaigns, and access to core Idea & Hook tools. You can upgrade when your workflow demands it."
  },
  {
    question: "Does Creator OS work for agencies?",
    answer: "Yes. Creator OS helps agencies manage multiple brands without mixing their context. Agency workspaces provide multi-client environment isolation and client-scoped AI context."
  },
  {
    question: "Can Creator OS use my brand and knowledge?",
    answer: "Yes. You can add specific brand guidelines, facts, and context into your Knowledge Vault. The AI will securely use this information as context to ensure generated ideas, hooks, and captions sound like your brand."
  },
  {
    question: "What happens when I upgrade my plan?",
    answer: "When you upgrade, your account immediately unlocks higher AI generation limits, more workspaces, and advanced features like the Knowledge Vault or Agency client isolation. Billing and subscriptions are securely handled through Whop."
  }
]
