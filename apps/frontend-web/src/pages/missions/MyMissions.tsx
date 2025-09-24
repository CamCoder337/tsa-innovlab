import { useAuth } from '@/hooks/useAuth';
import MyMissionsAffreteur from './MyMissionsAffreteur';
import MyMissionsTransporteur from './MyMissionsTransporteur';
import MyMissionsAdmin from '../admin/MissionsManagement';
import { Navigate } from 'react-router-dom';
import { useMissions } from '@/hooks/useMissions';
import { useEffect } from 'react';

export default function MyMissions() {
  const { user } = useAuth();

  const { setCurrentMission } = useMissions();

  useEffect(() => {
    setCurrentMission(null);
  }, [setCurrentMission]);

  // If user is not authenticated, redirect to login
  if (!user) {
    return null; // This will be handled by routing/authentication guards
  }

  // Render appropriate component based on user role
  if (user.role === 'affreteur') {
    return <MyMissionsAffreteur />;
  }

  if (user.role === 'transporteur') {
    return <MyMissionsTransporteur />;
  }

  if (user.role === 'admin') {
    return <MyMissionsAdmin />;
  }

  // For other roles (Admin, Client), show a generic message or redirect
  return <Navigate to="/app" />;
}
