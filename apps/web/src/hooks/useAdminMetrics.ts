import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface AdminMetrics {
  totalUsers: number;
  totalSignups: number;
  totalActivated: number;
  totalAIRequests: number;
  totalContent: number;
  totalCampaigns: number;
  totalKnowledge: number;
  totalAgencyClients: number;
  totalCheckoutStarts: number;
}

export function useAdminMetrics() {
  return useQuery({
    queryKey: ['admin_metrics'],
    queryFn: async (): Promise<AdminMetrics> => {
      // Because product_events has RLS allowing admins to read everything,
      // we can do simple count queries. 
      // For a real production app with millions of events, these counts 
      // might need to be pre-aggregated, but this fits the minimal requirement.
      
      const getCount = async (eventName: string) => {
        const { count, error } = await supabase
          .from('product_events')
          .select('*', { count: 'exact', head: true })
          .eq('event_name', eventName);
        if (error) throw error;
        return count ?? 0;
      };

      const { count: usersCount, error: usersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      if (usersError) throw usersError;

      const [
        totalSignups,
        totalActivated,
        totalAIRequests,
        totalContent,
        totalCampaigns,
        totalKnowledge,
        totalAgencyClients,
        totalCheckoutStarts
      ] = await Promise.all([
        getCount('signup_completed'),
        getCount('ai_request_completed'), // Simplified activation metric (first-value action)
        getCount('ai_request_completed'), // total AI generations
        getCount('content_created'),
        getCount('campaign_created'),
        getCount('knowledge_created'),
        getCount('agency_client_created'),
        getCount('checkout_started'),
      ]);

      return {
        totalUsers: usersCount ?? 0,
        totalSignups,
        totalActivated, // In a robust query this would be a distinct user_id count where event is ai_request_completed
        totalAIRequests,
        totalContent,
        totalCampaigns,
        totalKnowledge,
        totalAgencyClients,
        totalCheckoutStarts,
      };
    },
  });
}
