import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import AffreteurSettings from './AffreteurSettings';
import TransporteurSettings from './TransporteurSettings';
import AdminSettings from '../admin/AdminSettings';

export default function MySettings() {
  const { user } = useAuth();

  // If user is not authenticated, redirect to login
  if (!user) {
    return null; // This will be handled by routing/authentication guards
  }

  // Render appropriate component based on user role
  if (user.role === 'affreteur') {
    return <AffreteurSettings />;
  }

  if (user.role === 'transporteur') {
    return <TransporteurSettings />;
  }

  if (user.role === 'admin') {
    return <AdminSettings />;
  }

  // For other roles (Client), show a generic message or redirect
  return <Navigate to="/app" />;
}
