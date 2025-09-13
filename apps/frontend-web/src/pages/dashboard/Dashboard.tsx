import { useAuthStore } from '@/stores/authStore';
import AdminDashboard from './AdminDashboard';
import AffreteurDashboard from './AffreteurDashboard';
import TransporteurDashboard from './TransporteurDashboard';

export default function Dashboard() {
    const user = useAuthStore((s) => s.currentUser);
    const role = user?.role ?? (localStorage.getItem('role')) ?? 'admin';

    if (role === 'admin') return <AdminDashboard />;
    if (role === 'transporteur') return <TransporteurDashboard />;
    return <AffreteurDashboard />;
}
