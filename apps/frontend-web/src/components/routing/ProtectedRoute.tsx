import { Navigate, useLocation } from 'react-router-dom';
import type { UserRole } from '@/types/auth.types';
import { useAuth } from '@/hooks/useAuth';
import type { ReactElement } from 'react';

export default function ProtectedRoute({
  element,
  requiredRole,
}: {
  element: ReactElement;
  requiredRole?: UserRole;
}) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (
    !isAuthenticated &&
    location.pathname !== '/app/shop' &&
    !location.pathname.startsWith('/app/shop/product')
  )
    return <Navigate to="/" replace />;
  if (requiredRole && user?.role !== requiredRole) return <Navigate to="/app" replace />;
  return element;
}
