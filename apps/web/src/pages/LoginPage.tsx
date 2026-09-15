import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import BrandMark from '@/components/BrandMark';
import { WhopOAuthButton } from '@/components/auth/WhopOAuthButton';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { BOT_PROTECTION_ENABLED, loadTurnstileScript, verifyTurnstileToken } from '@/lib/botProtection';

const AUTH_ATTEMPT_STORAGE_KEY = 'creator_os_auth_attempts';

function getAuthAttemptState() {
  try {
    const raw = sessionStorage.getItem(AUTH_ATTEMPT_STORAGE_KEY);
    return raw ? JSON.parse(raw) as { count: number; resetAt: number } : { count: 0, resetAt: 0 };
  } catch {
    return { count: 0, resetAt: 0 };
  }
}

function setAuthAttemptState(next: { count: number; resetAt: number }) {
  try {
    sessionStorage.setItem(AUTH_ATTEMPT_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage failures; the app still blocks obvious abuse in memory.
  }
}

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
  const [mode, setMode] = useState<'login' | 'signup'>(() => searchParams.get('mode') === 'signup' ? 'signup' : 'login');
  const [success, setSuccess] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const captchaWidgetRef = React.useRef<string | null>(null);
  const [rememberMe, setRememberMe] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('creator_os_remember_me') === 'true';
  });
    const googleConfigured = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

  const resetCaptcha = React.useCallback(() => {
    setCaptchaToken('');
    const activeWidgetId = captchaWidgetRef.current;
    if (activeWidgetId && window.turnstile) {
      window.turnstile.reset(activeWidgetId);
    }
  }, []);

  React.useEffect(() => {
    if (!BOT_PROTECTION_ENABLED || typeof document === 'undefined') return;

    let isMounted = true;

    const renderCaptcha = async () => {
      try {
        await loadTurnstileScript();
        const container = document.getElementById('creator-os-turnstile');
        if (!container || !window.turnstile || !isMounted) return;

        const widgetId = window.turnstile.render(container, {
          sitekey: import.meta.env.VITE_TURNSTILE_SITE_KEY,
          action: mode === 'signup' ? 'creator_os_signup' : 'creator_os_login',
          callback: (token: string) => setCaptchaToken(token),
          'error-callback': () => setCaptchaToken(''),
          'expired-callback': () => setCaptchaToken(''),
          'timeout-callback': () => setCaptchaToken(''),
        });

        captchaWidgetRef.current = widgetId;
      } catch {
        setCaptchaToken('');
      }
    };

    setCaptchaToken('');
    if (captchaWidgetRef.current && window.turnstile) {
      window.turnstile.remove(captchaWidgetRef.current);
      captchaWidgetRef.current = null;
    }

    renderCaptcha();

    return () => {
      isMounted = false;
      const currentWidgetId = captchaWidgetRef.current;
      if (currentWidgetId && window.turnstile) {
        window.turnstile.remove(currentWidgetId);
      }
      captchaWidgetRef.current = null;
    };
  }, [mode]);

  const persistRememberPreference = (next: boolean) => {
    if (next) {
      sessionStorage.setItem('creator_os_remember_me', 'true');
    } else {
      sessionStorage.removeItem('creator_os_remember_me');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    
    if (BOT_PROTECTION_ENABLED && !captchaToken) {
      setErr('Please complete the security check before continuing.');
      return;
    }

    if (BOT_PROTECTION_ENABLED) {
      const captchaValid = await verifyTurnstileToken(captchaToken, mode === 'signup' ? 'creator_os_signup' : 'creator_os_login');
      if (!captchaValid) {
        setErr('Security check failed. Please try again.');
        resetCaptcha();
        return;
      }
    }

    const attemptState = getAuthAttemptState();
    const windowMs = 60_000;
    const now = Date.now();
    if (attemptState.resetAt > now && attemptState.count >= 5) {
      setErr('Too many attempts. Please wait a minute before trying again.');
      return;
    }

    if (attemptState.resetAt <= now) {
      setAuthAttemptState({ count: 0, resetAt: now + windowMs });
    }

    setLoading(true);
    setErr('');
    setSuccess('');

    if (mode === 'signup') {
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            terms_accepted: true
          }
        }
      });
      if (signUpErr) {
        const next = getAuthAttemptState();
        const updated = { count: next.count + 1, resetAt: next.resetAt || Date.now() + windowMs };
        setAuthAttemptState(updated);
        resetCaptcha();
        setErr(signUpErr.message);
        setLoading(false);
        return;
      }

      if (signUpData.user) {
        await supabase.from('users').upsert({
          id: signUpData.user.id,
          full_name: email.split('@')[0],
        });
      }

      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signInErr) {
        const next = getAuthAttemptState();
        setAuthAttemptState({ count: next.count + 1, resetAt: next.resetAt || Date.now() + windowMs });
        resetCaptcha();
        setSuccess('Account created! Check your inbox and confirm your email, then sign in.');
        setMode('login');
        setLoading(false);
        return;
      }
      setAuthAttemptState({ count: 0, resetAt: Date.now() + windowMs });
      resetCaptcha();
      persistRememberPreference(rememberMe);
      setLoading(false);
      navigate('/dashboard');
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const next = getAuthAttemptState();
      setAuthAttemptState({ count: next.count + 1, resetAt: next.resetAt || Date.now() + windowMs });
      resetCaptcha();
      setErr(error.message);
      setLoading(false);
      return;
    }
    setAuthAttemptState({ count: 0, resetAt: Date.now() + windowMs });
    resetCaptcha();
    persistRememberPreference(rememberMe);
    setLoading(false);
    navigate('/dashboard');
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
        <label className="flex items-center gap-2 text-[12px] text-[#A1A1AA]">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => {
              const checked = event.target.checked;
              setRememberMe(checked);
              persistRememberPreference(checked);
            }}
            className="h-4 w-4 rounded border-white/10 bg-[#0D0D0D] text-primary focus:ring-primary"
          />
          Remember me
        </label>
                {BOT_PROTECTION_ENABLED && (
          <div className="rounded-[12px] border border-white/[0.06] bg-[#0D0D0D] p-2">
            <div id="creator-os-turnstile" className="min-h-[65px]" />
          </div>
        )}
        <Button type="submit" disabled={loading || !email || !password || (BOT_PROTECTION_ENABLED && !captchaToken)}
          className="w-full h-11 rounded-[12px] bg-primary hover:bg-primary/90 text-white font-medium text-[14px] shadow-[0_0_15px_rgba(124,58,237,0.3)] transition-all mt-1">
          {loading
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : mode === 'login' ? 'Sign In' : 'Get Started'
          }
        </Button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-white/[0.06]" />
        <span className="text-[12px] text-[#71717A]">or</span>
        <div className="flex-1 h-px bg-white/[0.06]" />
      </div>

      {/* Whop OAuth (Only for returning users) */}
      {mode === 'login' && (
        <WhopOAuthButton
          onClick={async () => {
            try {
              persistRememberPreference(rememberMe);
              const { buildWhopOAuthUrl } = await import('@/lib/whopPkce');
              const url = await buildWhopOAuthUrl();
              window.location.assign(url);
            } catch {
              setErr('We could not start Whop sign-in. Please try again.');
            }
          }}
          loading={false}
        />
      )}

      {googleConfigured ? <GoogleSignInButton rememberMe={rememberMe} onError={setErr} /> : (
        <p className="text-center text-xs text-[#71717A]">Google sign-in is being configured.</p>
      )}

      {/* Toggle login/signup */}
            <p className="text-center text-[11px] leading-relaxed text-[#71717A]">
        By continuing, you agree to Creator OS's <a href="/terms" className="text-white hover:text-primary transition-colors underline underline-offset-2">Terms of Service</a> and <a href="/privacy" className="text-white hover:text-primary transition-colors underline underline-offset-2">Privacy Policy</a>.
      </p>

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
