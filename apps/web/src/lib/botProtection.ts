import { supabase } from '@/lib/supabase';

export const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim() || '';
export const BOT_PROTECTION_ENABLED = Boolean(TURNSTILE_SITE_KEY);

declare global {
  interface Window {
    turnstile?: {
      render: (element: string | HTMLElement, options: Record<string, unknown>) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId?: string) => void;
      getResponse: (widgetId?: string) => string;
    };
  }
}

const TURNSTILE_SCRIPT_ID = 'creator-os-turnstile-script';

export async function loadTurnstileScript(): Promise<void> {
  if (!TURNSTILE_SITE_KEY || typeof document === 'undefined') return;

  if (document.getElementById(TURNSTILE_SCRIPT_ID)) return;

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.id = TURNSTILE_SCRIPT_ID;
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load bot protection script.'));
    document.head.appendChild(script);
  });
}

export async function verifyTurnstileToken(token: string, action: string, hostname?: string): Promise<boolean> {
  if (!token || !BOT_PROTECTION_ENABLED) return true;

  try {
    const { data, error } = await supabase.functions.invoke('verify-captcha', {
      body: {
        token,
        action,
        hostname: hostname || window.location.hostname,
      },
    });

    if (error) {
      console.error('Captcha verification failed:', error);
      return false;
    }

    return Boolean(data?.success);
  } catch (error) {
    console.error('Captcha verification exception:', error);
    return false;
  }
}
