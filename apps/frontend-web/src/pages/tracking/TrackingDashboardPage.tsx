import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import AdminTrackingDashboard from './AdminTrackingDashboard';
import TransporteurTrackingDashboard from './TransporteurTrackingDashboard';
import AffreteurTrackingDashboard from './AffreteurTrackingDashboard';

export default function TrackingDashboardPage() {
  const { user } = useAuth();

  switch (user?.role) {
    case 'admin':
      return <AdminTrackingDashboard />;
    case 'transporteur':
      return <TransporteurTrackingDashboard />;
    case 'affreteur':
      return <AffreteurTrackingDashboard />;
    default:
      return <Navigate to="/app" />;
  }
}
