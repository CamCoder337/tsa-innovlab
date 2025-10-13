import { useAuth } from '@/hooks/useAuth';
import { lazy } from 'react';

export default function TrackingDashboardPage() {
  const { user } = useAuth();
  const AdminTrackingDashboard = lazy(() => import('./AdminTrackingDashboard'));
  const TransporteurTrackingDashboard = lazy(() => import('./TransporteurTrackingDashboard'));
  const AffréteurTrackingDashboard = lazy(() => import('./AffréteurTrackingDashboard'));

  // Détermine quelle interface afficher selon le rôle
  switch (user?.role) {
    case 'admin':
      return <AdminTrackingDashboard />;

    case 'transporteur':
      return <TransporteurTrackingDashboard />;

    case 'affreteur':
      return <AffréteurTrackingDashboard />;
  }
}
