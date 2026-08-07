import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { WHOP_REDIRECT_URI, getStoredCodeVerifier } from '@/lib/whopPkce';
import { Loader2 } from 'lucide-react';

// Module-level flag — survives React Strict Mode's double-mount/unmount cycle.
// Reset on every full page navigation (new module load).
let exchangeInProgress = false;

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const [status, setStatus] = useState('Verifying Whop membership...');
  const didRun = useRef(false);

  useEffect(() => {
    // useRef guard: prevents double-fire within the same mount instance
    if (didRun.current) return;
    // Module-level guard: prevents double-fire across Strict Mode remounts
    if (exchangeInProgress) return;

    didRun.current = true;
    exchangeInProgress = true;

    const code = searchParams.get('code');
    if (!code) {
      exchangeInProgress = false;
      navigate('/login?error=No+authorization+code+provided');
      return;
    }

    // Get verifier: primary = state param in URL, fallback = sessionStorage
    const codeVerifier = getStoredCodeVerifier(searchParams) ?? undefined;

    console.log('[AUTH] Starting exchange:', {
      code_prefix: code.slice(0, 8),
      has_verifier: !!codeVerifier,
      verifier_prefix: codeVerifier?.slice(0, 12) ?? 'NONE',
    });

    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('whop-auth', {
          body: {
            code,
            redirect_uri: WHOP_REDIRECT_URI,
            code_verifier: codeVerifier,
          },
        });

        if (error) throw new Error(error.message);
        if (data?.error) throw new Error(data.error);

        if (data?.access_token) {
          setStatus('Authenticated! Loading your OS...');
          const { data: authData, error: authError } = await supabase.auth.setSession({
            access_token: data.access_token,
            refresh_token: data.refresh_token ?? '',
          });
          if (authError) throw authError;
          if (authData?.session) setSession(authData.session);
          navigate('/dashboard');
        } else {
          throw new Error('No access token in response');
        }
      } catch (err: any) {
        console.error('[AUTH] Exchange failed:', err.message);
        exchangeInProgress = false;
        navigate(`/login?error=${encodeURIComponent(err.message || 'Authentication failed')}`);
      }
    })();
  }, []); // Empty deps — run once on mount only

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
