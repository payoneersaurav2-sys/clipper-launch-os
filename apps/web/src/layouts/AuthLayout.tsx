import React from 'react';
import { Link } from 'react-router-dom';
import Wordmark from '@/components/Wordmark';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#080808] text-[#FAFAFA] font-sans relative">
      {/* Wordmark top-left */}
      <div className="absolute top-8 left-8">
        <Wordmark size="md" />
      </div>

      {/* Content card */}
      <div className="w-full flex items-center justify-center p-6 animate-in fade-in duration-500">
        {children}
      </div>

      {/* Minimal footer */}
      <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-6">
        <Link to="/terms" className="text-[12px] text-[#71717A] hover:text-[#A1A1AA] transition-colors tracking-tight">
          Terms
        </Link>
        <a href="mailto:sauravwhop@gmail.com" className="text-[12px] text-[#71717A] hover:text-[#A1A1AA] transition-colors tracking-tight">
          Contact
        </a>
      </div>
    </div>
  );
}
