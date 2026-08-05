import React from 'react';
import { Link } from 'react-router-dom';
import Wordmark from '@/components/Wordmark';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#080808] text-[#FAFAFA] font-sans">
      {/* Wordmark */}
      <div className="flex justify-center pt-8 pb-4 px-4">
        <Wordmark size="md" />
      </div>

      {/* Content card — fills remaining space and centres vertically */}
      <div className="flex-1 flex items-center justify-center w-full px-4 py-6 animate-in fade-in duration-500">
        {children}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-center gap-6 pb-6 px-4">
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
