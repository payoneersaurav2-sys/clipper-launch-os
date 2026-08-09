import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';

type GoogleSignInButtonProps = { onError: (message: string) => void };

/** Google's own rendered Identity Services control; CreatorOS does not imitate it. */
export function GoogleSignInButton({ onError }: GoogleSignInButtonProps) {
  const navigate = useNavigate();
  const syncSession = useAuthStore((state) => state.syncSession);

  return (
    <div className="flex min-h-12 w-full items-center justify-center overflow-hidden rounded-[12px] bg-white">
      <GoogleLogin
        theme="outline"
        size="large"
        shape="rectangular"
        text="continue_with"
        width="332"
        onError={() => onError('Google sign-in was cancelled or could not be started. Please try again.')}
        onSuccess={async (response) => {
          try {
            if (!response.credential) throw new Error('Google did not return an identity token.');
            const { data, error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: response.credential });
            if (error || !data.session || !data.user) throw error ?? new Error('Google sign-in did not create a session.');
            const { data: profile, error: profileError } = await supabase.from('users').upsert({
              id: data.user.id,
              full_name: data.user.user_metadata?.full_name ?? data.user.user_metadata?.name ?? data.user.email?.split('@')[0] ?? 'Creator',
              avatar_url: data.user.user_metadata?.avatar_url ?? null,
            }, { onConflict: 'id' }).select('onboarding_complete').single();
            if (profileError) throw profileError;
            await syncSession(data.session);
            navigate(profile?.onboarding_complete ? '/dashboard' : '/onboarding');
          } catch (error) {
            onError(error instanceof Error ? error.message : 'Google sign-in failed. Please try again.');
          }
        }}
      />
    </div>
  );
}
