import { Navigate } from 'react-router-dom';
import AffreteurDashboard from './AffreteurDashboard';
import TransporteurDashboard from './TransporteurDashboard';
import AdminDashboard from '../admin/AdminDashboard';
import { useAuth } from '@/hooks/useAuth';

export default function Dashboard() {
  const { user } = useAuth();

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
