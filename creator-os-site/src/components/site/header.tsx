import { useState, useRef, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { Menu, X, ChevronDown } from 'lucide-react'
import { FAQ_URL, PRICING_URL, SIGN_IN_URL, START_URL, PRODUCT_URL, FOR_AGENCIES_URL } from '#/lib/site'

const FEATURE_GROUPS = [
  {
    title: 'CREATE',
    items: [
      { name: 'Idea Studio', description: 'Turn a concept into structured content ideas.', href: `${PRODUCT_URL}/#idea-studio` },
      { name: 'Hook Engine', description: 'Optimize retention with AI hook scoring.', href: `${PRODUCT_URL}/#hook-engine` },
      { name: 'Caption OS', description: 'Generate platform-ready SEO captions.', href: `${PRODUCT_URL}/#caption-os` },
    ]
  },
  {
    title: 'PLAN & EXECUTE',
    items: [
      { name: 'Campaign OS', description: 'Organize related content into campaigns.', href: `${PRODUCT_URL}/#campaign-os` },
      { name: 'Clip Pipeline', description: 'Visual kanban board for production stages.', href: `${PRODUCT_URL}/dashboard/clip-pipeline` },
      { name: 'Content Workspace', description: 'Batch process clips and assets.', href: `${PRODUCT_URL}/dashboard/content-workspace` },
    ]
  },
  {
    title: 'INTELLIGENCE',
    items: [
      { name: 'Knowledge Vault', description: 'Store your brand facts for AI context.', href: `${PRODUCT_URL}/dashboard/knowledge-vault` },
      { name: 'Prompt Library', description: 'Save and reuse your best AI prompts.', href: `${PRODUCT_URL}/dashboard/prompt-library` },
      { name: 'Analytics', description: 'Track your content performance trends.', href: `${PRODUCT_URL}/dashboard/analytics` },
    ]
  },
  {
    title: 'AGENCY',
    items: [
      { name: 'Agency HQ', description: 'Manage multiple clients in one place.', href: FOR_AGENCIES_URL },
      { name: 'Brand Profiles', description: 'Unique AI context for each client.', href: FOR_AGENCIES_URL },
      { name: 'Team Access', description: 'Invite team members to collaborate.', href: FOR_AGENCIES_URL },
    ]
  }
];

export function Wordmark({
  size = 'md',
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const widths = {
    sm: 'w-[98px] sm:w-[108px]',
    md: 'w-[132px] sm:w-[144px]',
    lg: 'w-[188px] sm:w-[212px]',
  }
  return (
    <img
      src="/brand/creator-os-wordmark-optimized.webp"
      alt="Creator OS"
      width={132}
      height={26}
      fetchPriority="high"
      className={`block h-auto select-none ${widths[size]} ${className}`}
    />
  )
}

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const [featuresOpen, setFeaturesOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFeaturesOpen(false)
    }
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setFeaturesOpen(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[#080808]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:h-20 relative">
        <Link to="/" className="flex items-center" aria-label="Creator OS home">
          <Wordmark size="md" />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 sm:flex lg:gap-2">
          {/* Features Dropdown */}
          <div 
            className="relative" 
            ref={dropdownRef}
            onMouseEnter={() => setFeaturesOpen(true)}
            onMouseLeave={() => setFeaturesOpen(false)}
          >
            <button 
              onClick={() => setFeaturesOpen(!featuresOpen)}
              className={`flex items-center gap-1 text-[14px] font-medium px-3 lg:px-4 h-9 rounded-[10px] transition-colors ${featuresOpen ? 'text-[#FAFAFA] bg-white/[0.05]' : 'text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-white/[0.03]'}`}
              aria-expanded={featuresOpen}
            >
              Features
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${featuresOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {featuresOpen && (
              <div
                className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[600px] rounded-xl border border-white/[0.08] bg-[#111111]/95 backdrop-blur-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-150 origin-top"
              >
                <div className="grid grid-cols-2 gap-x-6 gap-y-8 p-6">
                  {FEATURE_GROUPS.map((group) => (
                    <div key={group.title}>
                      <h3 className="text-[11px] font-semibold text-primary uppercase tracking-wider mb-3">{group.title}</h3>
                      <ul className="space-y-3">
                        {group.items.map((item) => (
                          <li key={item.name}>
                            <a 
                              href={item.href} 
                              className="block group"
                              onClick={() => setFeaturesOpen(false)}
                            >
                              <p className="text-[14px] font-medium text-[#E4E4E7] group-hover:text-primary transition-colors">{item.name}</p>
                              <p className="text-[12px] text-[#A1A1AA] mt-0.5 group-hover:text-[#A1A1AA]/80 transition-colors">{item.description}</p>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <a href={FOR_AGENCIES_URL} className="flex items-center text-[14px] font-medium text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-white/[0.03] px-3 lg:px-4 h-9 rounded-[10px] transition-colors">
            For Agencies
          </a>
          
          <a href={PRICING_URL} className="flex items-center text-[14px] font-medium text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-white/[0.03] px-3 lg:px-4 h-9 rounded-[10px] transition-colors">
            Pricing
          </a>

          <a href={FAQ_URL} className="flex items-center text-[14px] font-medium text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-white/[0.03] px-3 lg:px-4 h-9 rounded-[10px] transition-colors">
            FAQ
          </a>
        </nav>

        {/* Right CTA */}
        <div className="hidden sm:flex items-center gap-2">
          <a href={SIGN_IN_URL} className="flex items-center text-[14px] font-medium text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-white/[0.03] px-3 lg:px-4 h-9 rounded-[10px] transition-colors">
            Sign In
          </a>
          <a href={START_URL} className="inline-flex items-center justify-center h-9 rounded-[10px] px-4 lg:px-5 text-[13px] lg:text-[14px] font-medium bg-primary text-white hover:bg-primary/90 shadow-[0_0_15px_rgba(124,58,237,0.25)] hover:shadow-[0_0_22px_rgba(124,58,237,0.45)] transition-all duration-300">
            Get Started
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="rounded-[8px] p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5 text-[#FAFAFA]" /> : <Menu className="h-5 w-5 text-[#FAFAFA]" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open ? (
        <div className="absolute top-full left-0 w-full border-b border-white/[0.06] bg-[#080808]/95 backdrop-blur-xl shadow-2xl overflow-y-auto max-h-[calc(100vh-80px)] sm:hidden">
          <div className="px-4 py-4 flex flex-col gap-1">
            
            {/* Mobile Features List */}
            <div className="py-2 px-3">
              <h2 className="text-[13px] font-semibold text-primary mb-3">Features</h2>
              <div className="pl-2 space-y-5">
                {FEATURE_GROUPS.map(group => (
                  <div key={group.title}>
                    <h3 className="text-[11px] font-medium text-[#71717A] uppercase tracking-wider mb-2">{group.title}</h3>
                    <ul className="space-y-3">
                      {group.items.map(item => (
                        <li key={item.name}>
                          <a 
                            href={item.href} 
                            className="block text-[14px] text-[#E4E4E7]"
                            onClick={() => setOpen(false)}
                          >
                            {item.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="h-px bg-white/[0.06] my-2" />
            
            <a href={FOR_AGENCIES_URL} onClick={() => setOpen(false)} className="flex items-center text-[14px] font-medium text-[#E4E4E7] hover:bg-white/[0.03] px-3 h-11 rounded-[10px]">
              For Agencies
            </a>
            <a href={PRICING_URL} onClick={() => setOpen(false)} className="flex items-center text-[14px] font-medium text-[#E4E4E7] hover:bg-white/[0.03] px-3 h-11 rounded-[10px]">
              Pricing
            </a>
            <a href={FAQ_URL} onClick={() => setOpen(false)} className="flex items-center text-[14px] font-medium text-[#E4E4E7] hover:bg-white/[0.03] px-3 h-11 rounded-[10px]">
              FAQ
            </a>

            <div className="mt-4 pt-4 border-t border-white/[0.06] flex flex-col gap-2">
              <a href={SIGN_IN_URL} className="flex items-center justify-center text-[14px] font-medium text-[#E4E4E7] hover:bg-white/[0.03] h-11 rounded-[10px]">
                Sign In
              </a>
              <a href={START_URL} className="flex items-center justify-center h-11 rounded-[10px] bg-primary text-white font-medium shadow-[0_0_15px_rgba(124,58,237,0.25)]">
                Get Started
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  )
}
