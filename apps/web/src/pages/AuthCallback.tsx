import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { Loader2 } from 'lucide-react';

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

    const exchangeCode = async () => {
      try {
        // We call our Supabase Edge Function to securely exchange the Whop code
        const { data, error } = await supabase.functions.invoke('whop-auth', {
          body: { code },
        });

        if (error) throw new Error(error.message);
        if (data?.error) throw new Error(data.error);

        // The edge function will return a custom Supabase token if membership is valid
        if (data?.supabase_token) {
          setStatus('Authenticating OS...');
          
          // Exchange the custom JWT for a session via admin API
          const { data: authData, error: authError } = await (supabase.auth as any).signInWithCustomToken
            ? await (supabase.auth as any).signInWithCustomToken(data.supabase_token)
            : await supabase.auth.setSession({ access_token: data.supabase_token, refresh_token: data.refresh_token ?? '' });
          
          if (authError) throw authError;
          if (authData?.session) setSession(authData.session);
          navigate('/dashboard');
        } else {
           throw new Error('Invalid authentication response');
        }

      } catch (error: any) {
        console.error('Auth error:', error);
        navigate(`/login?error=${encodeURIComponent(error.message || 'Authentication failed')}`);
      }
    };

    exchangeCode();
  }, [searchParams, navigate, setSession]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
         <p className="text-lg font-medium text-muted-foreground">{status}</p>
      </div>
    </div>
  );
}
