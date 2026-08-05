import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { Loader2 } from 'lucide-react';

export default function AuthIframe() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const [status, setStatus] = useState('Authenticating Whop App...');

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      navigate('/login?error=No+Whop+Token+Found');
      return;
    }

    const verifyToken = async () => {
      try {
        setStatus('Verifying Token securely...');
        const { data, error } = await supabase.functions.invoke('whop-iframe-auth', {
          body: { token },
        });

        if (error) throw new Error(error.message);
        if (data?.error) throw new Error(data.error);

        if (data?.supabase_token) {
          setStatus('Loading OS...');
          
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
        console.error('Iframe Auth error:', error);
        navigate(`/login?error=${encodeURIComponent(error.message || 'Authentication failed')}`);
      }
    };

    verifyToken();
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
