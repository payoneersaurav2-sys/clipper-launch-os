import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface PublicStats {
  total_users: number;
}

export function usePublicStats() {
  return useQuery({
    queryKey: ['public_stats'],
    queryFn: async (): Promise<PublicStats> => {
      const { data, error } = await supabase.rpc('get_public_stats');
      if (error) throw error;
      return data as PublicStats;
    },
    staleTime: 1000 * 60 * 5, // cache for 5 mins
  });
}
