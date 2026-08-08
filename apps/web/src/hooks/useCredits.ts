import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';

export type CreditBalance = {
  status: 'active' | 'unsubscribed' | 'unauthenticated';
  tier?: 'free' | 'creator' | 'pro' | 'agency';
  available: number;
  free: number;
  subscription: number;
  purchased: number;
};

export function useCredits() {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ['creator-os-credits', user?.id],
    enabled: Boolean(user),
    staleTime: 20_000,
    queryFn: async (): Promise<CreditBalance> => {
      const { data, error } = await supabase.rpc('creator_os_credit_balance');
      if (error) throw error;
      return (data ?? { status: 'unauthenticated', available: 0, free: 0, subscription: 0, purchased: 0 }) as CreditBalance;
    },
  });
}
