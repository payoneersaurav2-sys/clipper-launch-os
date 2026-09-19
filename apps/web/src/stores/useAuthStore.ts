import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

let profileSubscription: ReturnType<typeof supabase.channel> | null = null;
let authStateListenerRegistered = false;

interface AuthState {
  user: User | null;
  session: Session | null;
  membershipStatus: string | null;
  subscriptionTier: string | null;
  whopId: string | null;
  avatarUrl: string | null;
  onboardingComplete: boolean | null;
  requiresLegalAcceptance: boolean | null;
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
  avatarUrl: null,
  onboardingComplete: null,
  requiresLegalAcceptance: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session, user: session?.user ?? null, isLoading: false }),
  syncSession: async (session) => {
    let status = null;
    let tier = null;
    let whopId = null;
    let avatarUrl = null;
    let onboarded = null;
    let requiresLegalAcceptance = false;

    if (session?.user) {
      // Parallelize profile and legal status fetches
      const [userRes, legalRes] = await Promise.all([
        supabase
          .from('users')
          .select('membership_status, subscription_tier, membership_expires_at, onboarding_complete, whop_id, avatar_url')
          .eq('id', session.user.id)
          .maybeSingle(),
        supabase.rpc('check_legal_status')
      ]);

      const data = userRes.data;
      if (data) {
        const expired = Boolean(data.membership_expires_at && new Date(data.membership_expires_at).getTime() <= Date.now());
        const storedTier = data.subscription_tier ?? 'free';
        status = expired ? 'inactive' : (data.membership_status ?? 'inactive');
        tier = expired ? 'free' : storedTier;
        whopId = data.whop_id;
        avatarUrl = data.avatar_url;
        onboarded = data.onboarding_complete;
      }
      if (legalRes.data) {
        requiresLegalAcceptance = Boolean(legalRes.data.requires_acceptance);
      }
    }

    set({
      session,
      user: session?.user ?? null,
      membershipStatus: status,
      subscriptionTier: tier,
      whopId,
      avatarUrl,
      onboardingComplete: onboarded,
      requiresLegalAcceptance,
      isLoading: false,
    });
  },
  signOut: async () => {
    if (profileSubscription) {
      await profileSubscription.unsubscribe();
      profileSubscription = null;
    }
    sessionStorage.removeItem('creator_os_remember_me');
    await supabase.auth.signOut();
    set({ user: null, session: null, membershipStatus: null, subscriptionTier: null, whopId: null, avatarUrl: null, onboardingComplete: null, requiresLegalAcceptance: null });
  },
  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    await get().syncSession(session);

    const attachProfileSubscription = async (nextSession: Session | null) => {
      if (profileSubscription) {
        await profileSubscription.unsubscribe();
        profileSubscription = null;
      }

      const userId = nextSession?.user?.id;
      if (!userId) return;

      profileSubscription = supabase.channel(`creator-os-profile-${userId}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${userId}`,
        }, async () => {
          const { data: { session: refreshedSession } } = await supabase.auth.getSession();
          await get().syncSession(refreshedSession);
        })
        .subscribe();
    };

    await attachProfileSubscription(session);

    if (!authStateListenerRegistered) {
      authStateListenerRegistered = true;
      supabase.auth.onAuthStateChange(async (_event, nextSession) => {
        await get().syncSession(nextSession);
        await attachProfileSubscription(nextSession);
      });
    }
  },
}));
