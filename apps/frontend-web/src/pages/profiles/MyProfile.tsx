import { useAuth } from '@/hooks/useAuth';
import AffreteurProfile from './AffreteurProfile';
import TransporteurProfile from './TransporteurProfile';
import { Navigate } from 'react-router-dom';
import AdminProfile from './AdminProfile';

export default function MyProfile() {
  const { user } = useAuth();

  // If user is not authenticated, redirect to login
  if (!user) {
    return null; // This will be handled by routing/authentication guards
  }

  // Render appropriate component based on user role
  if (user.role === 'affreteur') {
    return <AffreteurProfile />;
  }

  if (user.role === 'transporteur') {
    return <TransporteurProfile />;
  }

  if (user.role === 'admin') {
    return <AdminProfile />;
  }

  // For other roles (Client), show a generic message or redirect
  return <Navigate to="/app" />;
}
