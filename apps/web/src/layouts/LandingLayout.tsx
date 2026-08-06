import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Wordmark from '@/components/Wordmark';
import { Menu, X } from 'lucide-react';

const footerNav = [
  { label: 'Features', href: '/#features' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Terms', href: '/terms' },
  { label: 'Contact', href: 'mailto:sauravwhop@gmail.com' },
];

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Priority 1: token in URL (e.g. from direct link)
    const token = searchParams.get('token');
    if (token) {
      navigate(`/auth/iframe?token=${token}`);
      return;
    }

    // Priority 2: If inside Whop iframe, request token from parent frame via postMessage
    if (window !== window.top) {
      // Immediately redirect to the iframe auth handler which manages the postMessage flow
      navigate('/auth/iframe');
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-[#080808] text-[#FAFAFA] flex flex-col font-sans">

      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[#080808]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex h-16 lg:h-20 items-center justify-between px-4 sm:px-6">
          <Wordmark size="md" />

          {/* Desktop Nav */}
          <div className="hidden sm:flex items-center gap-2 lg:gap-3">
            <Link to="/faq">
              <Button variant="ghost" className="text-[14px] font-medium text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-white/[0.03] px-3 lg:px-4 h-9 rounded-[10px]">
                FAQ
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="ghost" className="text-[14px] font-medium text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-white/[0.03] px-3 lg:px-4 h-9 rounded-[10px]">
                Sign In
              </Button>
            </Link>
            <a href="https://whop.com/forgeos/creator-os-ee/" target="_blank" rel="noopener noreferrer">
              <Button className="h-9 rounded-[10px] px-4 lg:px-5 text-[13px] lg:text-[14px] font-medium bg-primary text-white hover:bg-primary/90 shadow-[0_0_15px_rgba(124,58,237,0.25)] hover:shadow-[0_0_22px_rgba(124,58,237,0.45)] transition-all duration-300">
                Get Started
              </Button>
            </a>
          </div>

          {/* Mobile: hamburger */}
          <button
            className="sm:hidden text-[#71717A] hover:text-[#FAFAFA] p-2 rounded-[8px] hover:bg-white/[0.05] transition-colors"
            onClick={() => setMobileMenuOpen(v => !v)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="sm:hidden border-t border-white/[0.06] bg-[#080808]"
            >
              <div className="px-4 py-4 flex flex-col gap-2">
                <Link to="/faq" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start text-[14px] font-medium text-[#A1A1AA] hover:text-[#FAFAFA] h-10 rounded-[10px]">
                    FAQ
                  </Button>
                </Link>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start text-[14px] font-medium text-[#A1A1AA] hover:text-[#FAFAFA] h-10 rounded-[10px]">
                    Sign In
                  </Button>
                </Link>
                <a href="https://whop.com/forgeos/creator-os-ee/" target="_blank" rel="noopener noreferrer" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full h-10 rounded-[10px] text-[14px] font-medium bg-primary text-white hover:bg-primary/90 mt-1">
                    Get Started
                  </Button>
                </a>
              </div>
            </motion.div>
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
              <h4 className="text-[12px] font-medium text-[#71717A] tracking-widest uppercase mb-5">
                Navigation
              </h4>
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
              <h4 className="text-[12px] font-medium text-[#71717A] tracking-widest uppercase mb-5">
                Contact
              </h4>
              <a href="mailto:sauravwhop@gmail.com" className="text-[14px] text-[#A1A1AA] hover:text-primary transition-colors tracking-tight break-all">
                sauravwhop@gmail.com
              </a>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8">
            <p className="text-[13px] text-[#71717A] tracking-tight text-center sm:text-left">
              © 2026 Creator OS. All rights reserved.
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
