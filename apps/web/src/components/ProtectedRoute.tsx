import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';

export default function ProtectedRoute() {
  const { user, membershipStatus, isLoading } = useAuthStore();
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
  // 2. User created account directly (membership_status = 'active' set on signup), OR
  // 3. DEV mode — no membership check when running locally
  const isDev = import.meta.env.DEV;
  const hasAccess = membershipStatus === 'active' || isDev;

  if (!hasAccess) {
    return <Navigate to="/expired" replace />;
  }

  return <Outlet />;
}
