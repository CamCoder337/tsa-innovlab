import { lazy } from 'react';
import { useAuthStore } from '@/stores/authStore';

const AdminDashboard = lazy(() => import('../admin/AdminDashboard'));
const AffreteurDashboard = lazy(() => import('./AffreteurDashboard'));
const TransporteurDashboard = lazy(() => import('./TransporteurDashboard'));

export default function Dashboard() {
  const user = useAuthStore((s) => s.currentUser);
  const role = user?.role ?? localStorage.getItem('role') ?? 'admin';

  if (role === 'admin') return <AdminDashboard />;
  if (role === 'transporteur') return <TransporteurDashboard />;
  return <AffreteurDashboard />;
}
