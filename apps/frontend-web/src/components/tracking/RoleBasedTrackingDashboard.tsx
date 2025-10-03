import { useAuth } from '@/hooks/useAuth';
import AffréteurTrackingDashboard from './AffréteurTrackingDashboard';
import TransporteurTrackingDashboard from './TransporteurTrackingDashboard';
import AdminTrackingDashboard from './AdminTrackingDashboard';
import TrackingDashboard from './TrackingDashboard'; // Fallback générique

export default function RoleBasedTrackingDashboard() {
  const { user } = useAuth();

  // Détermine quelle interface afficher selon le rôle
  switch (user?.role) {
    case 'admin':
      return <AdminTrackingDashboard />;

    case 'transporteur':
      return <TransporteurTrackingDashboard />;

    case 'affreteur':
      return <AffréteurTrackingDashboard />;

    default:
      // Interface générique pour les utilisateurs sans rôle spécifique
      return <TrackingDashboard />;
  }
}
