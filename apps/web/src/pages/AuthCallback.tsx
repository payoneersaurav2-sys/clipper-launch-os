import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { Loader2 } from 'lucide-react';
import BrandMark from '@/components/BrandMark';
import { trackEvent } from '@/lib/analytics';

// Module-level flag — survives React Strict Mode's double-mount/unmount cycle.
let exchangeInProgress = false;

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const syncSession = useAuthStore((state) => state.syncSession);
  const [status, setStatus] = useState('Completing sign-in...');
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current) return;
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

    (async () => {
      try {
        setStatus('Verifying session...');
        let sessionToSync = null;

        if (code) {
          // Exchange code for Supabase session (Google OAuth PKCE flow)
          setStatus('Connecting your account...');
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error || !data.session) throw error ?? new Error('No session was created.');
          sessionToSync = data.session;
        } else {
          // Check for existing session established by client (implicit flow)
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          if (sessionError || !session) {
            throw new Error('Authentication failed or was cancelled.');
          }
          sessionToSync = session;
        }

        const user = sessionToSync.user;
        const profileData = {
          id: user.id,
          full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email?.split('@')[0] ?? 'Creator',
          avatar_url: user.user_metadata?.avatar_url ?? null,
        };

        const { data: existingProfile, error: lookupError } = await supabase
          .from('users')
          .select('onboarding_complete')
          .eq('id', user.id)
          .maybeSingle();

        if (lookupError) throw lookupError;

        let profile;
        if (!existingProfile) {
          const { data: insertedProfile, error: insertError } = await supabase
            .from('users')
            .insert(profileData)
            .select('onboarding_complete')
            .single();
          if (insertError) throw insertError;
          profile = insertedProfile;
          trackEvent('signup_completed');
        } else {
          const { data: updatedProfile, error: updateError } = await supabase
            .from('users')
            .update({
              full_name: profileData.full_name,
              avatar_url: profileData.avatar_url,
            })
            .eq('id', user.id)
            .select('onboarding_complete')
            .single();
          if (updateError) throw updateError;
          profile = updatedProfile;
        }

        await syncSession(sessionToSync);
        navigate(profile?.onboarding_complete ? '/dashboard' : '/onboarding');
      } catch (err: unknown) {
        exchangeInProgress = false;
        navigate(`/login?error=${encodeURIComponent(err instanceof Error ? err.message : 'Sign-in failed')}`);
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
