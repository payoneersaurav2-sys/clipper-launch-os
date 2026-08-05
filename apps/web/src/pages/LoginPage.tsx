import React from 'react';
import { Button } from '@/components/ui/button';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const errorMsg = searchParams.get('error');

  const handleWhopLogin = () => {
    // This will redirect to the Whop OAuth screen
    // The exact CLIENT_ID must be provided in the .env file in production
    const clientId = import.meta.env.VITE_WHOP_CLIENT_ID || 'dummy_client_id';
    const redirectUri = encodeURIComponent(`${window.location.origin}/auth/callback`);
    window.location.href = `https://whop.com/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code`;
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in zoom-in-95 duration-500 font-sans text-[#FAFAFA] w-full max-w-[360px] mx-auto p-8 rounded-[20px] bg-[#111111] border border-white/[0.06] shadow-xl">
      <div className="flex flex-col items-center text-center">
        <div className="h-10 w-10 mb-6 rounded-[12px] bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.3)]">
          <span className="font-bold text-white text-[14px] tracking-tighter">CL</span>
        </div>
        <h1 className="text-[24px] font-semibold tracking-tight text-[#FAFAFA]">Creator OS</h1>
        <p className="text-[14px] text-[#A1A1AA] mt-2 tracking-tight">
          Sign in to your workspace.
        </p>
      </div>
      
      {errorMsg && (
        <div className="flex items-center gap-2 p-3 text-[13px] font-medium text-red-400 bg-red-400/10 border border-red-400/20 rounded-[12px]">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p>{errorMsg}</p>
        </div>
      )}

      <Button onClick={handleWhopLogin} className="w-full h-12 rounded-[12px] bg-[#FF6243] hover:bg-[#FF6243]/90 text-white font-medium text-[15px] border-0 transition-all duration-300">
        <img src="https://whop.com/favicon.ico" alt="Whop" className="w-[16px] h-[16px] mr-2 filter brightness-0 invert" />
        Continue with Whop
      </Button>

      <div className="text-center text-[13px] text-[#71717A]">
        New to Creator OS?{' '}
        <Link to="/signup" className="font-medium text-[#FAFAFA] hover:text-primary transition-colors">
          Get access
        </Link>
      </div>
    </div>
  );
}
