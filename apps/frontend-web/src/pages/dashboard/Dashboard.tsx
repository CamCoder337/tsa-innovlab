import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import AffreteurDashboard from './AffreteurDashboard';
import TransporteurDashboard from './TransporteurDashboard';
import AdminDashboard from '../admin/AdminDashboard';
import { useAuth } from '@/hooks/useAuth';
import { useMissions } from '@/hooks/useMissions';

export default function Dashboard() {
  const { user } = useAuth();
  const { setCurrentMission } = useMissions();

  useEffect(() => {
    setCurrentMission(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  switch (user?.role) {
    case 'affreteur':
      return <AffreteurDashboard />;
    case 'transporteur':
      return <TransporteurDashboard />;
    case 'admin':
      return <AdminDashboard />;
    default:
      return <Navigate to="/app" />;
  }
}
