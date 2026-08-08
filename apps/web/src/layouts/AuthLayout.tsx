import React from 'react';
import { Link } from 'react-router-dom';
import Wordmark from '@/components/Wordmark';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-[#080808] text-[#FAFAFA] font-sans">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_40%_at_50%_22%,rgba(124,58,237,.13),transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_22%,#000_20%,transparent_100%)]" />
      {/* Wordmark */}
      <div className="relative flex justify-center pt-8 pb-4 px-4">
        <Wordmark size="md" />
      </div>

      {/* Content card — fills remaining space and centres vertically */}
      <div className="relative flex-1 flex items-center justify-center w-full px-4 py-6 animate-in fade-in duration-500">
        {children}
      </div>

      {/* Footer */}
      <div className="relative flex items-center justify-center gap-6 pb-6 px-4">
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
