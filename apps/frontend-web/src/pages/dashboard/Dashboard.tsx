import { useAuthStore } from '@/stores/user'
import AdminDashboard from './AdminDashboard'
import AffreteurDashboard from './AffreteurDashboard'
import TransporteurDashboard from './TransporteurDashboard'

export default function Dashboard() {
    const user = useAuthStore((s) => s.currentUser)
    const role = user?.role ?? (localStorage.getItem('userRole') as any) ?? 'Admin'

    if (role === 'Admin') return <AdminDashboard />
    if (role === 'Transporteur') return <TransporteurDashboard />
    return <AffreteurDashboard />
}


