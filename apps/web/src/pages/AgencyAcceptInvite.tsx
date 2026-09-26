import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function AgencyAcceptInvite() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const navigate = useNavigate();
  const { session } = useAuthStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMsg('Invalid invitation link.');
      return;
    }
    if (!session) {
      // Must be logged in to accept
      return;
    }

    const accept = async () => {
      try {
        const res = await fetch('/api/invite', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ action: 'accept', token })
        });
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || 'Failed to accept invitation');
        }
        
        setStatus('success');
        setTimeout(() => navigate('/agency'), 2000);
      } catch (err: any) {
        setStatus('error');
        setErrorMsg(err.message);
      }
    };

    accept();
  }, [token, session, navigate]);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-6 max-w-md w-full bg-[#111111] border-white/10 text-center">
          <h2 className="text-xl font-bold text-white mb-2">Sign in to accept</h2>
          <p className="text-sm text-zinc-400 mb-6">You must be signed in to accept this agency invitation.</p>
          <Button onClick={() => navigate('/login', { state: { returnTo: `/agency/accept-invite?token=${token}` } })} className="w-full bg-primary text-white">
            Sign In
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="p-6 max-w-md w-full bg-[#111111] border-white/10 text-center space-y-4">
        {status === 'loading' && (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <h2 className="text-xl font-bold text-white">Accepting Invitation...</h2>
            <p className="text-sm text-zinc-400">Please wait while we set up your access.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto text-primary text-2xl font-bold">✓</div>
            <h2 className="text-xl font-bold text-white">Invitation Accepted!</h2>
            <p className="text-sm text-zinc-400">Redirecting to agency dashboard...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="h-12 w-12 rounded-full bg-red-400/20 flex items-center justify-center mx-auto text-red-400 text-2xl font-bold">!</div>
            <h2 className="text-xl font-bold text-white">Invitation Failed</h2>
            <p className="text-sm text-red-400">{errorMsg}</p>
            <Button onClick={() => navigate('/dashboard')} variant="outline" className="mt-4 border-white/10 text-white">
              Go to Dashboard
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}

