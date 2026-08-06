import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { Loader2, AlertCircle } from 'lucide-react';

/**
 * AuthIframe — handles authentication when Creator OS is embedded inside the Whop iframe.
 *
 * Whop injects the user token via the Web App URL template:
 *   https://creator-os999.vercel.app/auth/iframe?token={USER_TOKEN}
 *
 * The {USER_TOKEN} placeholder is replaced by Whop automatically.
 */
export default function AuthIframe() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);

  const [status, setStatus] = useState('Connecting to Whop...');
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      // No token in URL — show a friendly fallback with a manual sign-in option
      setError('No session token received from Whop.');
      return;
    }

    const authenticate = async () => {
      try {
        setStatus('Verifying your membership...');
        const { data, error: fnError } = await supabase.functions.invoke('whop-iframe-auth', {
          body: { token },
        });

        if (fnError) throw new Error(fnError.message);
        if (data?.error) throw new Error(data.error);

        if (data?.supabase_token) {
          setStatus('Loading your workspace...');
          const { data: authData, error: authError } = await supabase.auth.setSession({
            access_token: data.supabase_token,
            refresh_token: data.refresh_token ?? '',
          });

          if (authError) throw authError;
          if (authData?.session) setSession(authData.session);

          navigate('/dashboard');
        } else {
          throw new Error('Invalid authentication response from server.');
        }
      } catch (err: any) {
        console.error('Iframe Auth error:', err);
        setError(err.message || 'Authentication failed. Please try signing in manually.');
      }
    };

    authenticate();
  }, [searchParams, navigate, setSession]);

  const handleManualLogin = () => {
    const WHOP_CLIENT_ID = import.meta.env.VITE_WHOP_CLIENT_ID || 'app_NsohXjOYOE0EkK';
    const redirectUrl = 'https://creator-os999.vercel.app/auth/callback';
    const redirectUri = encodeURIComponent(redirectUrl);
    // Navigate the TOP frame (parent Whop window) to avoid iframe OAuth restrictions
    if (window.top) {
      window.top.location.href = `https://whop.com/oauth?client_id=${WHOP_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code`;
    } else {
      window.location.href = `https://whop.com/oauth?client_id=${WHOP_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code`;
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
        <div className="flex flex-col items-center gap-5 max-w-sm text-center animate-in fade-in zoom-in duration-500">
          <div className="h-14 w-14 rounded-[16px] bg-primary flex items-center justify-center shadow-[0_0_30px_rgba(124,58,237,0.35)]">
            <span className="font-bold text-white text-[18px] tracking-tighter">CO</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-1">Creator OS</h2>
            <p className="text-sm text-muted-foreground">Sign in with your Whop account to continue.</p>
          </div>
          <button
            onClick={handleManualLogin}
            className="w-full h-11 px-6 rounded-[12px] bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(124,58,237,0.3)] flex items-center justify-center gap-2"
          >
            <img src="https://whop.com/favicon.ico" alt="Whop" className="w-4 h-4 filter brightness-0 invert" />
            Continue with Whop
          </button>
          <p className="text-[11px] text-muted-foreground/60">
            Secure sign-in powered by Whop
          </p>
        </div>
      </div>
    );
  }

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
