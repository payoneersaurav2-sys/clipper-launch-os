import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';

export default function ProtectedRoute() {
  const { user, membershipStatus, subscriptionTier, onboardingComplete, requiresLegalAcceptance, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080808]">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Allow access if:
  // 1. Whop membership is active, OR
  // 2. User created account directly (membership_status = 'active' set on signup)
  const hasAccess = subscriptionTier === 'free' || ['active', 'trialing', 'past_due', 'completed'].includes(membershipStatus ?? '');

  if (!hasAccess) {
    return <Navigate to="/expired" replace />;
  }

  // Whop-authenticated users are marked onboarding-complete by the verified
  // server-side iframe flow. Web users retain the normal onboarding flow.
  if (onboardingComplete !== true) {
    return <Navigate to="/onboarding" replace />;
  }

  // Legal Acceptance check
  if (requiresLegalAcceptance === true) {
    return <Navigate to="/legal-acceptance" replace />;
  }

  return <Outlet />;
}
