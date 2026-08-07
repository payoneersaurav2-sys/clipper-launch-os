import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { WHOP_REDIRECT_URI, getStoredCodeVerifier } from '@/lib/whopPkce';
import { Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const [status, setStatus] = useState('Ready to Complete Login');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleManualExchange = async () => {
    const code = searchParams.get('code');
    if (!code) {
      setErrorMsg('No authorization code found in URL.');
      return;
    }

    setIsProcessing(true);
    setStatus('Exchanging token with Whop...');
    setErrorMsg('');

    try {
      // Primary source: state param in URL (where we stored the verifier)
      // Fallback: sessionStorage
      const codeVerifier = getStoredCodeVerifier(searchParams) ?? undefined;

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
        setStatus('Authenticating OS...');
        const { data: authData, error: authError } = await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });
        if (authError) throw authError;
        if (authData?.session) {
          setSession(authData.session);
          navigate('/dashboard');
        }
      } else {
        throw new Error('Invalid authentication response');
      }
    } catch (err: any) {
      console.error('Exchange failed:', err);
      setErrorMsg(err.message || 'Authentication failed');
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6 p-8 bg-card border border-border rounded-xl shadow-lg max-w-md w-full animate-in fade-in zoom-in duration-500">
        <div className="h-16 w-16 rounded-[16px] bg-primary flex items-center justify-center shadow-[0_0_30px_rgba(124,58,237,0.35)]">
          <span className="font-bold text-white text-[22px] tracking-tighter">CO</span>
        </div>
        
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Creator OS</h1>
          <p className="text-muted-foreground">{status}</p>
        </div>

        {errorMsg && (
          <div className="w-full p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm text-center">
            {errorMsg}
          </div>
        )}

        <Button 
          size="lg" 
          className="w-full h-12"
          onClick={handleManualExchange}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <>
              Complete Login <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
