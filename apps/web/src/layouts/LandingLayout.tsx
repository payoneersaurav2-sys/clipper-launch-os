import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Wordmark from '@/components/Wordmark';

const footerNav = [
  { label: 'Features', href: '/#features' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Terms', href: '/terms' },
  { label: 'Contact', href: 'mailto:sauravwhop@gmail.com' },
];

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#080808] text-[#FAFAFA] flex flex-col font-sans">

      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[#080808]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex h-20 items-center justify-between px-6">
          <Wordmark size="md" />
          <div className="flex items-center gap-3">
            <Link to="/faq">
              <Button
                variant="ghost"
                className="text-[14px] font-medium text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-white/[0.03] px-4 h-9 rounded-[10px]"
              >
                FAQ
              </Button>
            </Link>
            <Link to="/login">
              <Button
                variant="ghost"
                className="text-[14px] font-medium text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-white/[0.03] px-4 h-9 rounded-[10px]"
              >
                Sign In
              </Button>
            </Link>
            <a href="https://whop.com/clipper-launch-os-53ae/clipper-launch-os-9b/" target="_blank" rel="noopener noreferrer">
              <Button
                className="h-9 rounded-[10px] px-5 text-[14px] font-medium bg-primary text-white hover:bg-primary/90 shadow-[0_0_15px_rgba(124,58,237,0.25)] hover:shadow-[0_0_22px_rgba(124,58,237,0.45)] transition-all duration-300"
              >
                Get Started
              </Button>
            </a>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Premium Footer */}
      <footer className="border-t border-white/[0.06] bg-[#080808]">
        <div className="max-w-6xl mx-auto px-6 pt-16 pb-12">
          
          {/* Top Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pb-12 border-b border-white/[0.06]">
            
            {/* Brand Column */}
            <div className="md:col-span-1">
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
                      <a
                        href={item.href}
                        className="text-[14px] text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors tracking-tight"
                      >
                        {item.label}
                      </a>
                    ) : (
                      <Link
                        to={item.href}
                        className="text-[14px] text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors tracking-tight"
                      >
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
              <a
                href="mailto:sauravwhop@gmail.com"
                className="text-[14px] text-[#A1A1AA] hover:text-primary transition-colors tracking-tight"
              >
                sauravwhop@gmail.com
              </a>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8">
            <p className="text-[13px] text-[#71717A] tracking-tight">
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
