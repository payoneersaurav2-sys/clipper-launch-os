import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Wordmark from '@/components/Wordmark';
import { Menu, X, ChevronDown } from 'lucide-react';
import { AppearanceSwitcher } from '@/components/AppearanceSwitcher';

const footerNav = [
  { label: 'Features', href: '/#features' },
  { label: 'For Agencies', href: '/for-agencies' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Terms', href: '/terms' },
  { label: 'Contact', href: 'mailto:sauravwhop@gmail.com' },
];

const FEATURE_GROUPS = [
  {
    title: 'CREATE',
    items: [
      { name: 'Idea Studio', description: 'Turn a concept into structured content ideas.', href: '/#idea-studio' },
      { name: 'Hook Engine', description: 'Optimize retention with AI hook scoring.', href: '/#hook-engine' },
      { name: 'Caption OS', description: 'Generate platform-ready SEO captions.', href: '/#caption-os' },
    ]
  },
  {
    title: 'PLAN & EXECUTE',
    items: [
      { name: 'Campaign OS', description: 'Organize related content into campaigns.', href: '/#campaign-os' },
      { name: 'Clip Pipeline', description: 'Visual kanban board for production stages.', href: '/dashboard/clip-pipeline' },
      { name: 'Content Workspace', description: 'Batch process clips and assets.', href: '/dashboard/content-workspace' },
    ]
  },
  {
    title: 'INTELLIGENCE',
    items: [
      { name: 'Knowledge Vault', description: 'Store your brand facts for AI context.', href: '/dashboard/knowledge-vault' },
      { name: 'Prompt Library', description: 'Save and reuse your best AI prompts.', href: '/dashboard/prompt-library' },
      { name: 'Analytics', description: 'Track your content performance trends.', href: '/dashboard/analytics' },
    ]
  },
  {
    title: 'AGENCY',
    items: [
      { name: 'Agency HQ', description: 'Manage multiple clients in one place.', href: '/for-agencies' },
      { name: 'Brand Profiles', description: 'Unique AI context for each client.', href: '/for-agencies' },
      { name: 'Team Access', description: 'Invite team members to collaborate.', href: '/for-agencies' },
    ]
  }
];

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      navigate(`/auth/iframe?token=${token}`);
      return;
    }
    if (window !== window.top) {
      navigate('/auth/iframe');
    }
  }, [searchParams, navigate]);

  // Handle escape key and click outside for dropdown
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFeaturesOpen(false);
        setMobileMenuOpen(false);
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setFeaturesOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-[#080808] text-[#FAFAFA] flex flex-col font-sans">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[#080808]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex h-16 lg:h-20 items-center justify-between px-4 sm:px-6 relative">
          <Wordmark size="md" />

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
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
              
              <AnimatePresence>
                {featuresOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[600px] rounded-xl border border-white/[0.08] bg-[#111111]/95 backdrop-blur-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] overflow-hidden"
                  >
                    <div className="grid grid-cols-2 gap-x-6 gap-y-8 p-6">
                      {FEATURE_GROUPS.map((group) => (
                        <div key={group.title}>
                          <h3 className="text-[11px] font-semibold text-primary uppercase tracking-wider mb-3">{group.title}</h3>
                          <ul className="space-y-3">
                            {group.items.map((item) => (
                              <li key={item.name}>
                                <Link 
                                  to={item.href} 
                                  className="block group"
                                  onClick={() => setFeaturesOpen(false)}
                                >
                                  <p className="text-[14px] font-medium text-[#E4E4E7] group-hover:text-primary transition-colors">{item.name}</p>
                                  <p className="text-[12px] text-[#A1A1AA] mt-0.5 group-hover:text-[#A1A1AA]/80 transition-colors">{item.description}</p>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link to="/for-agencies">
              <Button variant="ghost" className={`text-[14px] font-medium px-3 lg:px-4 h-9 rounded-[10px] ${isActive('/for-agencies') ? 'text-[#FAFAFA] bg-white/[0.05]' : 'text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-white/[0.03]'}`}>
                For Agencies
              </Button>
            </Link>
            
            <Link to="/pricing">
              <Button variant="ghost" className={`text-[14px] font-medium px-3 lg:px-4 h-9 rounded-[10px] ${isActive('/pricing') ? 'text-[#FAFAFA] bg-white/[0.05]' : 'text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-white/[0.03]'}`}>
                Pricing
              </Button>
            </Link>

            <Link to="/faq">
              <Button variant="ghost" className={`text-[14px] font-medium px-3 lg:px-4 h-9 rounded-[10px] ${isActive('/faq') ? 'text-[#FAFAFA] bg-white/[0.05]' : 'text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-white/[0.03]'}`}>
                FAQ
              </Button>
            </Link>
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <AppearanceSwitcher />
            <Link to="/login">
              <Button variant="ghost" className="text-[14px] font-medium text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-white/[0.03] px-3 lg:px-4 h-9 rounded-[10px]">
                Sign In
              </Button>
            </Link>
            <Link to="/login?mode=signup">
              <Button className="h-9 rounded-[10px] px-4 lg:px-5 text-[13px] lg:text-[14px] font-medium bg-primary text-white hover:bg-primary/90 shadow-[0_0_15px_rgba(124,58,237,0.25)] hover:shadow-[0_0_22px_rgba(124,58,237,0.45)] transition-all duration-300">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile: hamburger */}
          <button
            className="md:hidden text-[#71717A] hover:text-[#FAFAFA] p-2 rounded-[8px] hover:bg-white/[0.05] transition-colors"
            onClick={() => setMobileMenuOpen(v => !v)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Menu Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 top-[64px] z-40 bg-black/60 backdrop-blur-sm md:hidden"
                onClick={() => setMobileMenuOpen(false)}
              />
              
              {/* Drawer */}
              <motion.div
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute w-full z-50 md:hidden border-b border-white/[0.06] bg-[#080808] max-h-[calc(100vh-64px)] overflow-y-auto shadow-2xl"
              >
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
                                <Link 
                                  to={item.href} 
                                  className="block text-[14px] text-[#E4E4E7]"
                                  onClick={() => setMobileMenuOpen(false)}
                                >
                                  {item.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="h-px w-full bg-white/[0.06] my-2" />

                  <Link to="/for-agencies" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className={`w-full justify-start text-[14px] font-medium h-11 rounded-[10px] ${isActive('/for-agencies') ? 'text-primary bg-white/[0.05]' : 'text-[#E4E4E7] hover:bg-white/[0.03]'}`}>
                      For Agencies
                    </Button>
                  </Link>
                  <Link to="/pricing" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className={`w-full justify-start text-[14px] font-medium h-11 rounded-[10px] ${isActive('/pricing') ? 'text-primary bg-white/[0.05]' : 'text-[#E4E4E7] hover:bg-white/[0.03]'}`}>
                      Pricing
                    </Button>
                  </Link>
                  <Link to="/faq" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className={`w-full justify-start text-[14px] font-medium h-11 rounded-[10px] ${isActive('/faq') ? 'text-primary bg-white/[0.05]' : 'text-[#E4E4E7] hover:bg-white/[0.03]'}`}>
                      FAQ
                    </Button>
                  </Link>
                  
                  <div className="h-px w-full bg-white/[0.06] my-2" />
                  
                  <div className="flex items-center justify-between px-3 py-3">
                    <span className="text-[14px] font-medium text-[#E4E4E7]">Appearance</span>
                    <AppearanceSwitcher />
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full h-11 rounded-[10px] text-[14px] font-medium border-white/[0.1] bg-transparent text-[#E4E4E7]">
                        Sign In
                      </Button>
                    </Link>
                    <Link to="/login?mode=signup" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full h-11 rounded-[10px] text-[14px] font-medium bg-primary text-white">
                        Get Started
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>

      {/* Page Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] bg-[#080808]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 lg:pt-16 pb-10 lg:pb-12">
          {/* Top Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 lg:gap-12 pb-10 border-b border-white/[0.06]">
            {/* Brand Column */}
            <div className="sm:col-span-2 md:col-span-1">
              <Wordmark size="md" as="div" />
              <p className="mt-3 text-[14px] text-[#71717A] leading-relaxed tracking-tight max-w-[260px]">
                Operating System for Modern Creators.
              </p>
            </div>

            {/* Navigation */}
            <div>
              <p className="text-[12px] font-medium text-muted-foreground tracking-widest uppercase mb-5">
                Navigation
              </p>
              <ul className="space-y-3">
                {footerNav.map((item) => (
                  <li key={item.label}>
                    {item.href.startsWith('mailto') ? (
                      <a href={item.href} className="text-[14px] text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors tracking-tight">
                        {item.label}
                      </a>
                    ) : (
                      <Link to={item.href} className="text-[14px] text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors tracking-tight">
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <p className="text-[12px] font-medium text-muted-foreground tracking-widest uppercase mb-5">
                Contact
              </p>
              <a href="mailto:sauravwhop@gmail.com" className="text-[14px] text-[#A1A1AA] hover:text-primary transition-colors tracking-tight break-all">
                sauravwhop@gmail.com
              </a>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8">
            <p className="text-[13px] text-[#71717A] tracking-tight text-center sm:text-left">
              Ac 2026 Creator OS. All rights reserved.
            </p>
            <Link to="/terms" className="text-[13px] text-[#71717A] hover:text-[#A1A1AA] transition-colors tracking-tight">
              Terms & Conditions
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
