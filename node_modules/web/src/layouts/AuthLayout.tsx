import React from 'react';
import { Link } from 'react-router-dom';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground relative">
      <Link to="/" className="absolute top-8 left-8 font-bold tracking-tight text-xl">
        Clipper OS
      </Link>
      <div className="w-full max-w-md p-8 animate-in fade-in zoom-in-95 duration-500">
        {children}
      </div>
    </div>
  );
}
