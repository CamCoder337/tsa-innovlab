import { useAuth } from '@/hooks/useAuth';
import MyMissionsAffreteur from './MyMissionsAffreteur';
import MyMissionsTransporteur from './MyMissionsTransporteur';
import { Navigate } from 'react-router-dom';

export default function MyMissions() {
    const { user } = useAuth();

    // If user is not authenticated, redirect to login
    if (!user) {
        return null; // This will be handled by routing/authentication guards
    }

    // Render appropriate component based on user role
    if (user.role === 'Affreteur') {
        return <MyMissionsAffreteur />;
    }

    if (user.role === 'Transporteur') {
        return <MyMissionsTransporteur />;
    }

    // For other roles (Admin, Client), show a generic message or redirect
    return (
        <Navigate to="/app" />
    );
}
