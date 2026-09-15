import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import Wordmark from '@/components/Wordmark';
import { Button } from '@/components/ui/button';
import { Check, AlertCircle, Loader2 } from 'lucide-react';

export default function LegalAcceptancePage() {
  const navigate = useNavigate();
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [versions, setVersions] = useState<{ terms: string; privacy: string } | null>(null);

  useEffect(() => {
    const fetchVersions = async () => {
      try {
        const { data } = await supabase.rpc('check_legal_status');
        if (data) {
          setVersions({ terms: data.terms_version || '1.0.0', privacy: data.privacy_version || '1.0.0' });
        } else {
          setVersions({ terms: '1.0.0', privacy: '1.0.0' });
        }
      } catch {
        setVersions({ terms: '1.0.0', privacy: '1.0.0' });
      }
    };
    fetchVersions();
  }, []);
  
  const handleAccept = async () => {
    if (!accepted) return;
    setLoading(true);
    setError('');
    
    try {
      const { error: rpcError } = await supabase.rpc('record_legal_acceptance');
      if (rpcError) throw rpcError;
      
      // Update local auth store so ProtectedRoute lets them pass
      const { data: { session } } = await supabase.auth.getSession();
      await useAuthStore.getState().syncSession(session);
      
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      console.error('Failed to record legal acceptance:', err);
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  if (!versions) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#080808]">
        <div className="h-8 w-8 rounded-full border-b-2 border-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#080808] p-4 text-[#FAFAFA] font-sans">
      <div className="w-full max-w-md bg-[#111111] rounded-[24px] border border-white/[0.06] p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-500">
        <div className="flex justify-center mb-8">
          <Wordmark size="md" as="div" />
        </div>
        
        <h1 className="text-[20px] font-semibold tracking-tight text-center mb-2">
          Updated Legal Terms
        </h1>
        <p className="text-[14px] text-[#A1A1AA] text-center mb-8 leading-relaxed">
          Please review and accept our updated Terms of Service (v{versions.terms}) and Privacy Policy (v{versions.privacy}) to continue using Creator OS.
        </p>

        {error && (
          <div className="flex items-center gap-2 p-3 mb-6 text-[13px] font-medium text-red-400 bg-red-400/10 border border-red-400/20 rounded-[12px]">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <label className="flex items-start gap-3 p-4 rounded-[12px] border border-white/[0.06] bg-[#0D0D0D] cursor-pointer hover:border-white/[0.15] transition-colors group mb-6">
          <div className={`mt-0.5 shrink-0 flex items-center justify-center h-5 w-5 rounded border ${accepted ? 'bg-primary border-primary' : 'bg-transparent border-white/20'} transition-colors`}>
            {accepted && <Check className="h-3.5 w-3.5 text-white" />}
          </div>
          <input 
            type="checkbox" 
            className="sr-only" 
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            aria-label="I agree to the Terms of Service and Privacy Policy"
          />
          <div className="text-[13px] text-[#A1A1AA] leading-relaxed">
            I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary transition-colors underline underline-offset-2">Terms of Service</a> and acknowledge the <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary transition-colors underline underline-offset-2">Privacy Policy</a>.
          </div>
        </label>

        <Button 
          onClick={handleAccept}
          disabled={!accepted || loading}
          className="w-full h-12 rounded-[12px] bg-primary hover:bg-primary/90 text-white font-medium text-[14px] shadow-[0_0_15px_rgba(124,58,237,0.3)] transition-all"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Accept & Continue'}
        </Button>
      </div>
    </div>
  );
}
