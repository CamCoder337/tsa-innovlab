import { Navigate } from 'react-router-dom';
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

  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (requiredRole && user?.role !== requiredRole) return <Navigate to="/app" replace />;
  return element;
}
