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

    // Check if we received tokens directly from the Server-Side Edge Function flow
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');

    if (accessToken) {
      console.log('[AUTH] Received tokens from Server-Side flow! Authenticating...');
      setStatus('Authenticating OS...');
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || '',
      }).then(({ data, error }) => {
        if (error) {
          console.error('Session error:', error);
          navigate(`/login?error=${encodeURIComponent(error.message)}`);
          return;
        }
        if (data.session) {
          setSession(data.session);
          navigate('/dashboard');
        }
      });
      return;
    }

    // If we only got a code, it means the old flow somehow triggered. Just error out for now
    // because the new flow ALWAYS redirects with access_token.
    console.error('[AUTH] Received raw code on client, but we are using Server-Side flow!');
    navigate('/login?error=Invalid+OAuth+Flow+Type');
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
