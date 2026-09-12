import { createClient } from '@supabase/supabase-js';

const supabaseUrlFromEnv = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKeyFromEnv = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

if (import.meta.env.PROD && (!supabaseUrlFromEnv || !supabaseAnonKeyFromEnv)) {
  throw new Error('Missing required Supabase environment values for production. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

if (!import.meta.env.PROD && (!supabaseUrlFromEnv || !supabaseAnonKeyFromEnv)) {
  console.warn('Development Supabase config missing; using explicit development fallbacks. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to avoid this warning.');
}

export const supabaseUrl = supabaseUrlFromEnv || 'https://placeholder-project.supabase.co';
export const supabaseAnonKey = supabaseAnonKeyFromEnv || 'development-placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
