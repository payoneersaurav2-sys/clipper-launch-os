import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';

export interface Review {
  id: string;
  user_id: string;
  name: string;
  handle?: string;
  role?: string;
  rating: number;
  review_text: string;
  avatar_url?: string;
  status: 'pending' | 'approved' | 'rejected' | 'hidden';
  is_featured: boolean;
  verified: boolean;
  created_at: string;
}

export function useApprovedReviews() {
  return useQuery({
    queryKey: ['approved_reviews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('status', 'approved')
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Review[];
    },
  });
}

export function useMyReview() {
  const user = useAuthStore((state) => state.user);
  
  return useQuery({
    queryKey: ['my_review', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as Review | null;
    },
    enabled: !!user,
  });
}

export function useSubmitReview() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: async (review: Partial<Review>) => {
      if (!user) throw new Error('Must be logged in to submit a review');
      const payload: any = {
          name: review.name,
          handle: review.handle || null,
          role: review.role || null,
          rating: review.rating,
          review_text: review.review_text,
          user_id: user.id,
      };
      
      if (review.id) {
          payload.id = review.id;
      }

      const { data, error } = await supabase
        .from('reviews')
        .upsert(payload, { onConflict: 'user_id' })
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my_review'] });
    },
  });
}

export function useAdminReviews() {
  return useQuery({
    queryKey: ['admin_reviews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Review[];
    },
  });
}

export function useUpdateReviewAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (update: { id: string; status?: string; is_featured?: boolean }) => {
      const { data, error } = await supabase
        .from('reviews')
        .update({
            status: update.status,
            is_featured: update.is_featured,
            ...(update.status === 'approved' ? { approved_at: new Date().toISOString() } : {})
        })
        .eq('id', update.id)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_reviews'] });
      queryClient.invalidateQueries({ queryKey: ['approved_reviews'] });
    },
  });
}
