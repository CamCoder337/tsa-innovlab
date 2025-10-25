import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { useMissions } from '@/hooks/useMissions';
import { useEffect } from 'react';
import MyMissionsAffreteur from './MyMissionsAffreteur';
import MyMissionsTransporteur from './MyMissionsTransporteur';
import MyMissionsAdmin from '../admin/MissionsManagement';

export default function MyMissions() {
  const { user } = useAuth();
  const { setCurrentMission } = useMissions();

  useEffect(() => {
    setCurrentMission(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user) {
    return null;
  }
  switch (user.role) {
    case 'affreteur':
      return <MyMissionsAffreteur />;
    case 'transporteur':
      return <MyMissionsTransporteur />;
    case 'admin':
      return <MyMissionsAdmin />;
    default:
      return <Navigate to="/app" />;
  }
}
