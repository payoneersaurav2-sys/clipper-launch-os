import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  membershipStatus: string | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  signOut: () => Promise<void>;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  membershipStatus: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, membershipStatus: null });
  },
  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    // Fetch membership status if session exists
    let status = null;
    if (session?.user) {
      const { data } = await supabase.from('users').select('membership_status').eq('id', session.user.id).single();
      if (data) status = data.membership_status;
    }

    set({ session, user: session?.user ?? null, membershipStatus: status, isLoading: false });

    supabase.auth.onAuthStateChange(async (_event, session) => {
      let status = null;
      if (session?.user) {
        const { data } = await supabase.from('users').select('membership_status').eq('id', session.user.id).single();
        if (data) status = data.membership_status;
      }
      set({ session, user: session?.user ?? null, membershipStatus: status, isLoading: false });
    });
  },
}));
