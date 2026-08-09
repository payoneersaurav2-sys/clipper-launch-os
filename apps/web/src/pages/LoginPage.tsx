import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { buildWhopOAuthUrl } from '@/lib/whopPkce';
import { WhopOAuthButton } from '@/components/auth/WhopOAuthButton';
import BrandMark from '@/components/BrandMark';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const errorMsg = searchParams.get('error');

  React.useEffect(() => {
    const token = searchParams.get('token');
    if (token) navigate(`/auth/iframe?token=${token}`);
  }, [searchParams, navigate]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [success, setSuccess] = useState('');
  const [whopLoading, setWhopLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    setErr('');
    setSuccess('');

    if (mode === 'signup') {
      // 1. Create the Supabase auth user
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({ email, password });
      if (signUpErr) { setErr(signUpErr.message); setLoading(false); return; }

      // 2. Upsert into public.users with active membership
      if (signUpData.user) {
        await supabase.from('users').upsert({
          id: signUpData.user.id,
          full_name: email.split('@')[0],
        });
      }

      // 3. Auto sign-in immediately (works when email confirm is disabled)
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signInErr) {
        // Email confirmation required — tell user
        setSuccess('Account created! Check your inbox and confirm your email, then sign in.');
        setMode('login');
        setLoading(false);
        return;
      }
      setLoading(false);
      navigate('/dashboard');
      return;
    }

    // Login
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setErr(error.message);
      setLoading(false);
      return;
    }
    setLoading(false);
    navigate('/dashboard');
  };

  const handleWhopLogin = async () => {
    setWhopLoading(true);
    try {
      const url = await buildWhopOAuthUrl();
      window.location.assign(url);
    } catch {
      setWhopLoading(false);
      setErr('We could not start Whop sign-in. Please try again.');
    }
  };

  const handleGoogleLogin = async () => {
    setSocialLoading(true);
    setErr('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?provider=google` },
    });
    if (error) {
      setSocialLoading(false);
      setErr(error.message);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-500 font-sans text-[#FAFAFA] w-full max-w-[380px] mx-auto p-8 rounded-[20px] bg-[#111111] border border-white/[0.06] shadow-xl">
      {/* Header */}
      <div className="flex flex-col items-center text-center">
        <BrandMark size="sm" className="mb-5 shadow-[0_0_20px_rgba(124,58,237,0.28)]" />
        <h1 className="text-[22px] font-semibold tracking-tight text-[#FAFAFA]">Creator OS</h1>
        <p className="text-[13px] text-[#A1A1AA] mt-1.5">
          {mode === 'login' ? 'Sign in to your workspace.' : 'Create your Creator OS account.'}
        </p>
      </div>

      {/* Alerts */}
      {(errorMsg || err) && (
        <div className="flex items-center gap-2 p-3 text-[13px] font-medium text-red-400 bg-red-400/10 border border-red-400/20 rounded-[12px]">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p>{errorMsg || err}</p>
        </div>
      )}
      {success && (
        <div className="p-3 text-[13px] text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-[12px] text-center">
          {success}
        </div>
      )}

      {/* Email / Password Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#71717A]" />
          <Input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="Email address" aria-label="Email address" autoComplete="email" required
            className="h-11 pl-10 rounded-[12px] bg-[#0D0D0D] border-white/[0.08] text-[#FAFAFA] placeholder:text-[#71717A] focus:border-primary/50 focus:ring-primary/20"
          />
        </div>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#71717A]" />
          <Input
            type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Password" aria-label="Password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={6}
            className="h-11 pl-10 pr-10 rounded-[12px] bg-[#0D0D0D] border-white/[0.08] text-[#FAFAFA] placeholder:text-[#71717A] focus:border-primary/50"
          />
          <button type="button" onClick={() => setShowPw(v => !v)} aria-label={showPw ? 'Hide password' : 'Show password'}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#FAFAFA] transition-colors">
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <Button type="submit" disabled={loading || !email || !password}
          className="w-full h-11 rounded-[12px] bg-primary hover:bg-primary/90 text-white font-medium text-[14px] shadow-[0_0_15px_rgba(124,58,237,0.3)] transition-all mt-1">
          {loading
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : mode === 'login' ? 'Sign In' : 'Create Account'
          }
        </Button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-white/[0.06]" />
        <span className="text-[12px] text-[#71717A]">or</span>
        <div className="flex-1 h-px bg-white/[0.06]" />
      </div>

      {/* Whop OAuth */}
      <button type="button" onClick={handleGoogleLogin} disabled={socialLoading || whopLoading || loading}
        className="flex h-12 w-full items-center justify-center gap-3 rounded-[12px] border border-white/[0.10] bg-white text-[14px] font-semibold text-[#171717] transition-colors hover:bg-[#F4F4F5] disabled:cursor-not-allowed disabled:opacity-65">
        <span className="text-[18px] font-bold text-[#4285F4]" aria-hidden="true">G</span>
        {socialLoading ? 'Redirecting to Googleâ€¦' : 'Continue with Google'}
      </button>
      <WhopOAuthButton onClick={handleWhopLogin} loading={whopLoading} />

      {/* Toggle login/signup */}
      <div className="text-center text-[13px] text-[#71717A]">
        {mode === 'login' ? (
          <>Don't have an account?{' '}
            <button onClick={() => { setMode('signup'); setErr(''); }}
              className="font-medium text-[#FAFAFA] hover:text-primary transition-colors">
              Create one
            </button>
          </>
        ) : (
          <>Already have an account?{' '}
            <button onClick={() => { setMode('login'); setErr(''); }}
              className="font-medium text-[#FAFAFA] hover:text-primary transition-colors">
              Sign in
            </button>
          </>
        )}
      </div>
    </div>
  );
}
