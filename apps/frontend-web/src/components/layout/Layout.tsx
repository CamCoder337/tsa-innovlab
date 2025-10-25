import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useCategories } from '@/hooks/useCategories';
import { useChat } from '@/hooks/useChat';
import { useMissions } from '@/hooks/useMissions';
import { useNotifications } from '@/hooks/useNotifications';
import { useOrders } from '@/hooks/useOrders';
import { useProducts } from '@/hooks/useProducts';
import { useUsers } from '@/hooks/useUsers';
import { SidebarProvider } from '@/components/ui/sidebar';

export default function Layout() {
  const { user } = useAuth();
  const { fetchCart } = useCart();
  const { fetchAdminCategories, fetchCategories } = useCategories();
  const { fetchConversations } = useChat();
  const { fetchAllMissions, fetchMyMissions, fetchMissionsStats } = useMissions();
  const { fetchNotifications, fetchNotificationStats } = useNotifications();
  const { fetchOrders } = useOrders();
  const { fetchAdminProducts, fetchProducts, fetchProductStats } = useProducts();
  const { fetchUsers, fetchUserStats } = useUsers();

  useEffect(() => {
    if (user && user.role !== 'client') {
      if (user && user.role !== 'affreteur') fetchAllMissions();
      if (user && user.role !== 'admin') {
        fetchMyMissions();
      }
      if (user && user.role === 'admin') {
        fetchAdminCategories();
        fetchAdminProducts();
        fetchMissionsStats();
        fetchProductStats();
        fetchUsers();
        fetchUserStats();
      }
      fetchConversations();
      fetchNotifications();
      fetchNotificationStats();
    }
    if (!user || user.role !== 'admin') {
      if (user) {
        fetchCart();
        fetchOrders();
      }
      fetchCategories();
      fetchProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // WebSocket initialization is now handled by NotificationProvider
  // to avoid conflicts and page reloads on notification receive

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-gray-50 flex-1 flex-col">
        <Header />
        <main className="flex h-full">
          <div>
            <Sidebar />
          </div>
          <div className="w-full top-16 relative">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
