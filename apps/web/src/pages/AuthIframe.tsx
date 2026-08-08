import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { Loader2 } from 'lucide-react';

export default function AuthIframe() {
  const [searchParams] = useSearchParams();
  const { experienceId } = useParams();
  const navigate = useNavigate();
  const syncSession = useAuthStore((state) => state.syncSession);
  const [status, setStatus] = useState('Connecting to Whop...');
  const [error, setError] = useState('');

  useEffect(() => {
    const run = async () => {
      // ── Fast path: reuse existing Supabase session (repeat visits are instant) ──
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      if (existingSession) {
        await syncSession(existingSession);
        navigate('/dashboard');
        return;
      }

      let token = searchParams.get('token');

      if (!token) {
        try {
          // Whop injects x-whop-user-token only on same-origin requests.
          const res = await fetch('/api/get-whop-token', { cache: 'no-store' });

          if (res.ok) {
            const data = await res.json();
            if (data.token) {
              token = data.token;
            }
          }
        } catch {
          // Do not expose token-endpoint responses or diagnostics in the iframe.
        }
      }

      // ── Path A: Whop URL template injected the token directly ──────────
      if (token) {
        try {
          setStatus('Verifying your membership...');
          const { data, error: fnError } = await supabase.functions.invoke('whop-iframe-auth', {
            body: { token, experienceId },
          });

          if (fnError) throw new Error(fnError.message);
          if (data?.error) throw new Error(data.error);

          if (data?.access_token) {
            setStatus('Loading your workspace...');
            const { data: authData, error: authError } = await supabase.auth.setSession({
              access_token: data.access_token,
              refresh_token: data.refresh_token,
            });
            if (authError) throw authError;
            if (!authData?.session) throw new Error('Supabase did not create a session.');
            await syncSession(authData.session);
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
      setError('We could not verify your Whop session. Please reopen Creator OS from Whop and try again.');
      setStatus('');
    };

    run();
  }, [searchParams, experienceId, navigate, syncSession]);

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
