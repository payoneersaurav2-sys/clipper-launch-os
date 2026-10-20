import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/useAuthStore';

export default function CheckoutCompletePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isLoading: isAuthLoading } = useAuthStore();

  // Wait for Supabase session restoration before treating the user as signed out.
  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) {
      navigate('/login?returnTo=%2Fdashboard', { replace: true });
      return;
    }

    void queryClient.invalidateQueries({ queryKey: ['entitlements', user.id] });
    navigate('/dashboard', { replace: true });
  }, [isAuthLoading, user, navigate, queryClient]);

  return null;
}
