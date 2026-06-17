import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { PageLoader } from '@/components/ui/Spinner';
import type { Role } from '@/types';

export function ProtectedRoute({ roles, children }: { roles?: Role[]; children: React.ReactNode }) {
  const { user, activeRole, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  if (roles && activeRole && !roles.includes(activeRole) && !user.roles.some((r) => roles.includes(r))) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
