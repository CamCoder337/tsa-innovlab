import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import AffreteurSettings from './AffreteurSettings';
import TransporteurSettings from './TransporteurSettings';
import AdminSettings from '../admin/AdminSettings';
import ClientSettings from './ClientSettings';

export default function MySettings() {
  const { user } = useAuth();

  // If user is not authenticated, redirect to login
  if (!user) {
    return null; // This will be handled by routing/authentication guards
  }

  // Render appropriate component based on user role
  switch (user.role) {
    case 'affreteur':
      return <AffreteurSettings />;
    case 'transporteur':
      return <TransporteurSettings />;
    case 'admin':
      return <AdminSettings />;
    case 'client':
      return <ClientSettings />;
    default:
      return <Navigate to="/app" />;
  }
}
