import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import AffreteurProfile from './AffreteurProfile';
import TransporteurProfile from './TransporteurProfile';
import AdminProfile from '../admin/AdminProfile';
import ClientProfile from './ClientProfile';

export default function MyProfile() {
  const { user } = useAuth();

  // If user is not authenticated, redirect to login
  if (!user) {
    return null; // This will be handled by routing/authentication guards
  }

  // Render appropriate component based on user role
  switch (user?.role) {
    case 'affreteur':
      return <AffreteurProfile />;
    case 'transporteur':
      return <TransporteurProfile />;
    case 'admin':
      return <AdminProfile />;
    case 'client':
      return <ClientProfile />;
    default:
      return <Navigate to="/app" />;
  }
}
