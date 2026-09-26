import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';


export default function AgencyProtectedRoute() {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[300px]">
        <div className="h-8 w-8 rounded-full border-b-2 border-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // We cannot simply check subscriptionTier === 'agency' because team members
  // might not have the subscription themselves. The backend RLS protects the routes,
  // but we should just render the Outlet and let useAgency return null if they have no access.
  return <Outlet />;
}



