import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { WHOP_REDIRECT_URI, getStoredWhopTransaction } from '@/lib/whopPkce';
import { Loader2 } from 'lucide-react';
import BrandMark from '@/components/BrandMark';

// Module-level flag — survives React Strict Mode's double-mount/unmount cycle.
// Reset on every full page navigation (new module load).
let exchangeInProgress = false;

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const syncSession = useAuthStore((state) => state.syncSession);
  const [status, setStatus] = useState('Completing sign-in...');
  const didRun = useRef(false);

  useEffect(() => {
    // useRef guard: prevents double-fire within the same mount instance
    if (didRun.current) return;
    // Module-level guard: prevents double-fire across Strict Mode remounts
    if (exchangeInProgress) return;

    didRun.current = true;
    exchangeInProgress = true;

    const oauthError = searchParams.get('error');
    if (oauthError) {
      exchangeInProgress = false;
      navigate(`/login?error=${encodeURIComponent(searchParams.get('error_description') || oauthError)}`);
      return;
    }

    const code = searchParams.get('code');
    const hash = window.location.hash;

    // Detect Supabase implicit flow (Google OAuth returns #access_token=... instead of ?code=...)
    if (!code && hash && hash.includes('access_token=')) {
      (async () => {
        try {
          setStatus('Connecting your account...');
          // Supabase JS client automatically parses the hash and sets the session. We just wait for it.
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          if (sessionError || !session) throw sessionError ?? new Error('Session could not be retrieved from URL.');
          
          const { data: profile, error: profileError } = await supabase.from('users').upsert({
            id: session.user.id,
            full_name: session.user.user_metadata?.full_name ?? session.user.user_metadata?.name ?? session.user.email?.split('@')[0] ?? 'Creator',
            avatar_url: session.user.user_metadata?.avatar_url ?? null,
          }, { onConflict: 'id' }).select('onboarding_complete').single();
          if (profileError) throw profileError;
          
          await syncSession(session);
          navigate(profile?.onboarding_complete ? '/dashboard' : '/onboarding');
        } catch (err: unknown) {
          exchangeInProgress = false;
          navigate(`/login?error=${encodeURIComponent(err instanceof Error ? err.message : 'Sign-in failed')}`);
        }
      })();
      return;
    }

    if (!code) {
      exchangeInProgress = false;
      // Dump the entire URL so we can see what Supabase actually sent back
      const dump = encodeURIComponent(`URL: ${window.location.href}`);
      navigate(`/login?error=No+authorization+code+provided.+${dump}`);
      return;
    }

    // Detect Supabase social OAuth (Google PKCE flow) — no Whop state stored means it's a social redirect
    const transaction = getStoredWhopTransaction(searchParams);
    if (!transaction) {
      (async () => {
        try {
          setStatus('Connecting your account...');
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error || !data.user || !data.session) throw error ?? new Error('No session was created.');
          const { data: profile, error: profileError } = await supabase.from('users').upsert({
            id: data.user.id,
            full_name: data.user.user_metadata?.full_name ?? data.user.user_metadata?.name ?? data.user.email?.split('@')[0] ?? 'Creator',
            avatar_url: data.user.user_metadata?.avatar_url ?? null,
          }, { onConflict: 'id' }).select('onboarding_complete').single();
          if (profileError) throw profileError;
          await syncSession(data.session);
          navigate(profile?.onboarding_complete ? '/dashboard' : '/onboarding');
        } catch (err: unknown) {
          exchangeInProgress = false;
          navigate(`/login?error=${encodeURIComponent(err instanceof Error ? err.message : 'Sign-in failed')}`);
        }
      })();
      return;
    }

    if (!transaction.intent) {
      exchangeInProgress = false;
      navigate('/login?error=Your+Whop+sign-in+session+expired.+Please+try+again.');
      return;
    }

    (async () => {
      try {
        if (transaction.intent === 'link_account') {
          setStatus('Securely linking your Whop account...');
          const { data, error } = await supabase.functions.invoke('whop-link-account', {
            body: { code, redirect_uri: WHOP_REDIRECT_URI, code_verifier: transaction.codeVerifier },
          });
          if (error) throw new Error(error.message);
          if (data?.error) throw new Error(data.error);
          const { data: { session } } = await supabase.auth.getSession();
          if (session) await syncSession(session);
          navigate('/dashboard/credits?linked=whop');
          return;
        }

        const { data, error } = await supabase.functions.invoke('whop-auth', {
          body: {
            code,
            redirect_uri: WHOP_REDIRECT_URI,
            code_verifier: transaction.codeVerifier,
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
          if (!authData?.session) throw new Error('Supabase did not create a session.');
          await syncSession(authData.session);
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
  }, [navigate, searchParams, syncSession]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500">
        <div className="relative">
          <BrandMark size="md" className="shadow-[0_0_30px_rgba(124,58,237,0.35)]" />
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
