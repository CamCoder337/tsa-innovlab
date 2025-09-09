import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import AffreteurSettings from './AffreteurSettings';
import TransporteurSettings from './TransporteurSettings';
import AdminSettings from './AdminSettings';

export default function MyProfile() {
    const { user } = useAuth();

    // If user is not authenticated, redirect to login
    if (!user) {
        return null; // This will be handled by routing/authentication guards
    }

    // Render appropriate component based on user role
    if (user.role === 'Affreteur') {
        return <AffreteurSettings />;
    }

    if (user.role === 'Transporteur') {
        return <TransporteurSettings />;
    }

    if (user.role === 'Admin') {
        return <AdminSettings />;
    }

    // For other roles (Client), show a generic message or redirect
    return <Navigate to="/app" />;
}
