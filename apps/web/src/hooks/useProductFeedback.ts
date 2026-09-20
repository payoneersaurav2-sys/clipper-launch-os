import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';

export interface ProductFeedback {
  id: string;
  user_id: string;
  feature: string;
  event_type: string;
  sentiment: 'positive' | 'negative';
  message: string | null;
  created_at: string;
}

// ---- Submit product feedback (user-facing) ------------------

export function useSubmitProductFeedback() {
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (payload: {
      feature: string;
      event_type: string;
      sentiment: 'positive' | 'negative';
      message?: string;
    }) => {
      if (!user) throw new Error('Must be signed in to submit feedback.');

      const { error } = await supabase.from('product_feedback').insert({
        user_id: user.id,
        feature: payload.feature,
        event_type: payload.event_type,
        sentiment: payload.sentiment,
        message: payload.message?.trim().slice(0, 2000) || null,
      });

      if (error) throw error;
    },
  });
}

// ---- Admin: read all product feedback ----------------------

export function useAdminProductFeedback(filter?: {
  sentiment?: 'positive' | 'negative';
  feature?: string;
}) {
  return useQuery({
    queryKey: ['admin_product_feedback', filter],
    queryFn: async () => {
      let query = supabase
        .from('product_feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter?.sentiment) query = query.eq('sentiment', filter.sentiment);
      if (filter?.feature) query = query.eq('feature', filter.feature);

      const { data, error } = await query;
      if (error) throw error;
      return data as ProductFeedback[];
    },
  });
}
