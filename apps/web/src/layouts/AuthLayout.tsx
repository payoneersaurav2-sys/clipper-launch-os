import React from 'react';
import { Link } from 'react-router-dom';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080808] text-[#FAFAFA] font-sans relative">
      <Link to="/" className="absolute top-8 left-8 flex items-center gap-3">
        <div className="h-7 w-7 rounded-[10px] bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.3)]">
          <span className="font-bold text-white text-[11px] tracking-tighter">CR</span>
        </div>
        <span className="font-semibold tracking-tight text-[15px]">Creator OS</span>
      </Link>
      <div className="w-full flex items-center justify-center p-8 animate-in fade-in duration-700">
        {children}
      </div>
    </div>
  );
}
