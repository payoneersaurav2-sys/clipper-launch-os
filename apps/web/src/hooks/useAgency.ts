import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { useEntitlements } from '@/hooks/useEntitlements';

export interface Agency {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export const useAgency = () => {
  const { user, subscriptionTier } = useAuthStore();
  const { data: entitlements } = useEntitlements();
  const effectiveTier = entitlements?.tier ?? subscriptionTier;
  const queryClient = useQueryClient();

  const fetchAgency = async (): Promise<Agency | null> => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('agencies')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  };

  const query = useQuery({
    queryKey: ['agency', user?.id],
    queryFn: fetchAgency,
    enabled: !!user,
  });

  const createAgency = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('agencies')
        .insert([{ name, owner_id: user?.id }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency'] });
    },
  });

  const ensuredForUserId = useRef<string | null>(null);
  useEffect(() => {
    if (!user || effectiveTier !== 'agency') {
      ensuredForUserId.current = null;
      return;
    }
    if (query.isSuccess && !query.data && ensuredForUserId.current !== user.id) {
      ensuredForUserId.current = user.id;
      createAgency.mutate('My Agency');
    }
  }, [createAgency, query.data, query.isSuccess, user, effectiveTier]);

  return { ...query, createAgency };
};




