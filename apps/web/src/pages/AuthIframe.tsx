import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { buildWhopOAuthUrl } from '@/lib/whopPkce';
import { Loader2 } from 'lucide-react';

export default function AuthIframe() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const [status, setStatus] = useState('Connecting to Whop...');
  const [error, setError] = useState('');

  useEffect(() => {
    const run = async () => {
      let token = searchParams.get('token');
      let debugLog = `URL Token: ${token || 'None'}\n`;

      if (!token) {
        try {
          debugLog += `Fetching /api/get-whop-token...\n`;
          const res = await fetch('/api/get-whop-token');
          debugLog += `Response Status: ${res.status} ${res.statusText}\n`;
          
          if (res.ok) {
            const data = await res.json();
            debugLog += `Data received: ${JSON.stringify(data)}\n`;
            if (data.token) {
              token = data.token;
            }
          } else {
            const text = await res.text();
            debugLog += `Response Body: ${text.slice(0, 100)}\n`;
          }
        } catch (e: any) {
          debugLog += `Fetch Error: ${e.message}\n`;
        }
      }

      // ── Path A: Whop URL template injected the token directly ──────────
      if (token) {
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
            throw new Error('Invalid authentication response.');
          }
        } catch (err: any) {
          console.error('Iframe token auth error:', err);
          setError(err.message || 'Authentication failed');
          setStatus('');
        }
        return;
      }

      // ── STRICT IFRAME MODE ──
      // The user wants NO redirects. It must happen entirely inside the iframe.
      setError(`No token provided by Whop.\n\nDebug Info:\n${debugLog}`);
      setStatus('');
    };

    run();
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
          {error ? (
            <p className="text-sm text-destructive mt-2 max-w-md bg-destructive/10 p-4 rounded-md border border-destructive/20 break-all text-left whitespace-pre-wrap">
              <strong>Error:</strong> {error}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground mt-0.5">{status}</p>
          )}
        </div>
      </div>
    </div>
  );
}
