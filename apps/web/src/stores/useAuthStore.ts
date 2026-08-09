import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  membershipStatus: string | null;
  subscriptionTier: string | null;
  whopId: string | null;
  onboardingComplete: boolean | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  syncSession: (session: Session | null) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  membershipStatus: null,
  subscriptionTier: null,
  whopId: null,
  onboardingComplete: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session, user: session?.user ?? null, isLoading: false }),
  syncSession: async (session) => {
    let status = null;
    let tier = null;
    let whopId = null;
    let onboarded = null;

    if (session?.user) {
      const { data } = await supabase
        .from('users')
        .select('membership_status, subscription_tier, membership_expires_at, onboarding_complete, whop_id')
        .eq('id', session.user.id)
        .single();
      if (data) {
        const expired = Boolean(data.membership_expires_at && new Date(data.membership_expires_at).getTime() <= Date.now());
        status = expired ? 'inactive' : data.membership_status;
        tier = expired ? 'free' : data.subscription_tier;
        whopId = data.whop_id;
        onboarded = data.onboarding_complete;
      }
    }

    set({
      session,
      user: session?.user ?? null,
      membershipStatus: status,
      subscriptionTier: tier,
      whopId,
      onboardingComplete: onboarded,
      isLoading: false,
    });
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, membershipStatus: null, subscriptionTier: null, whopId: null, onboardingComplete: null });
  },
  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    await get().syncSession(session);

    supabase.auth.onAuthStateChange(async (_event, session) => {
      await get().syncSession(session);
    });
  },
}));
