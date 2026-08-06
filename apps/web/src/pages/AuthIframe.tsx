import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { Loader2, AlertCircle } from 'lucide-react';

/**
 * AuthIframe — handles authentication when Creator OS is embedded inside the Whop iframe.
 *
 * Whop's production proxy (*.apps.whop.com) injects the user token via the
 * x-whop-user-token HTTP header — which a static SPA cannot read.
 *
 * Instead, we use two mechanisms in order of priority:
 *   1. URL `?token=` param  → used when launched via direct link with token
 *   2. postMessage handshake → request token from the parent Whop frame
 */
export default function AuthIframe() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);

  const [status, setStatus] = useState('Connecting to Whop...');
  const [error, setError] = useState('');

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const authenticate = async (token: string) => {
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
        setError(err.message || 'Authentication failed. Please refresh the page.');
        setStatus('');
      }
    };

    // ── Priority 1: Token in URL (direct link launch) ──────────────────────
    const urlToken = searchParams.get('token');
    if (urlToken) {
      authenticate(urlToken);
      return;
    }

    // ── Priority 2: postMessage handshake with the parent Whop frame ────────
    // Whop's frontend SDK uses postMessage to share the user token securely.
    setStatus('Requesting session from Whop...');

    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from Whop's trusted domain
      if (!event.origin.includes('whop.com') && !event.origin.includes('apps.whop.com')) return;

      const { type, token: msgToken, userToken } = event.data ?? {};

      // Whop SDK sends either { type: 'whop-user-token', token: '...' }
      // or { type: 'AUTH_TOKEN', userToken: '...' } depending on version
      const receivedToken = msgToken || userToken;
      if (receivedToken && (type?.toLowerCase().includes('token') || type?.toLowerCase().includes('auth'))) {
        clearTimeout(timeoutId);
        window.removeEventListener('message', handleMessage);
        authenticate(receivedToken);
      }
    };

    window.addEventListener('message', handleMessage);

    // Ask the parent frame for the token using Whop's SDK message protocol
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'REQUEST_USER_TOKEN' }, '*');
      // Some Whop SDK versions use this format
      window.parent.postMessage({ type: 'GET_TOKEN' }, '*');
    }

    // ── Fallback: If no token arrives in 8 seconds, show a helpful error ────
    timeoutId = setTimeout(() => {
      window.removeEventListener('message', handleMessage);
      setError(
        'Could not automatically retrieve your Whop session. ' +
        'Please use the "Continue with Whop" button to sign in manually.'
      );
      setStatus('');
    }, 8000);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('message', handleMessage);
    };
  }, [searchParams, navigate, setSession]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
        <div className="flex flex-col items-center gap-5 max-w-sm text-center animate-in fade-in zoom-in duration-500">
          <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-red-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-1">Authentication Failed</h2>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="h-10 px-6 rounded-[10px] bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Sign In Manually
          </button>
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
