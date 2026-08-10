import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';

export default function ProtectedRoute() {
  const { user, membershipStatus, subscriptionTier, onboardingComplete, isLoading } = useAuthStore();
  const location = useLocation();
  const isLocalAccess = ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080808]">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (!user && !isLocalAccess) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Allow access if:
  // 1. Whop membership is active, OR
  // 2. User created account directly (membership_status = 'active' set on signup), OR
  // 3. DEV mode — no membership check when running locally
  const isDev = import.meta.env.DEV || isLocalAccess;
  const hasAccess = subscriptionTier === 'free' || ['active', 'trialing', 'past_due', 'completed'].includes(membershipStatus ?? '') || isDev;

  if (!hasAccess && !isLocalAccess) {
    return <Navigate to="/expired" replace />;
  }

  // Whop-authenticated users are marked onboarding-complete by the verified
  // server-side iframe flow. Web users retain the normal onboarding flow.
  if (onboardingComplete !== true && !isLocalAccess) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}
