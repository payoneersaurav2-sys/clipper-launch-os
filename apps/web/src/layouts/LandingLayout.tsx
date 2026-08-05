import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#080808] text-[#FAFAFA] flex flex-col font-sans">
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[#080808]/90 backdrop-blur-md">
        <div className="container flex h-20 max-w-6xl mx-auto items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center space-x-3">
              <div className="h-7 w-7 rounded-[10px] bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.3)]">
                <span className="font-bold text-white text-[11px] tracking-tighter">CR</span>
              </div>
              <span className="font-semibold tracking-tight text-[15px]">Creator OS</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" className="text-[14px] font-medium text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-white/[0.03] px-4 rounded-[12px]">Sign In</Button>
            </Link>
            <Link to="/signup">
              <Button className="h-10 rounded-[12px] px-6 text-[14px] font-medium bg-primary text-white hover:bg-primary/90 shadow-[0_0_15px_rgba(124,58,237,0.3)] hover:shadow-[0_0_20px_rgba(124,58,237,0.5)] transition-all">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
      <footer className="border-t border-white/[0.06] py-10 bg-[#080808]">
        <div className="container max-w-6xl mx-auto flex flex-col items-center justify-between gap-4 md:flex-row px-6">
          <div className="flex items-center gap-3">
            <span className="font-semibold tracking-tight text-[15px]">Creator OS</span>
          </div>
          <p className="text-center text-[13px] text-[#71717A] md:text-left tracking-wide">
            The definitive workspace for digital empires.
          </p>
        </div>
      </footer>
    </div>
  );
}
