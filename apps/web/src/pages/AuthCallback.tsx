import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { WHOP_REDIRECT_URI, getStoredCodeVerifier } from '@/lib/whopPkce';
import { Loader2 } from 'lucide-react';
let hasExchanged = false;

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const [status, setStatus] = useState('Verifying Whop Membership...');

  useEffect(() => {
    const code = searchParams.get('code');

    if (!code) {
      navigate('/login?error=No+authorization+code+provided');
      return;
    }
    console.log('[AUTH] Checking lock. hasExchanged:', hasExchanged);
    if (hasExchanged) {
      console.warn('[AUTH] Prevented double execution of code exchange!');
      return;
    }
    hasExchanged = true;
    console.log('[AUTH] Lock acquired. Pausing for manual diagnostic test...');

    // TEMPORARY DIAGNOSTIC PAUSE
    // We are stopping the automatic exchange so the user can copy the code
    setStatus(`PAUSED FOR DIAGNOSTICS. Your auth code is: ${code}`);
    
  }, [searchParams, navigate, setSession]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500">
        <div className="relative">
          <div className="h-14 w-14 rounded-[16px] bg-primary flex items-center justify-center shadow-[0_0_30px_rgba(124,58,237,0.35)]">
            <span className="font-bold text-white text-[18px] tracking-tighter">CO</span>
          </div>
          <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-background border-2 border-background flex items-center justify-center">
            <Loader2 className="h-3 w-3 animate-spin text-primary" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-base font-semibold text-foreground">Creator OS</p>
          <p className="text-sm text-muted-foreground mt-0.5">{status}</p>
        </div>
      </div>
    </div>
  );
}
