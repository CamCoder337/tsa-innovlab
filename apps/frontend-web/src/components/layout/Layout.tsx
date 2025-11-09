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
import { useVehicles } from '@/hooks/useVehicles';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useAllAdminStats } from '@/hooks/useAdminStats';
import { useAddresses } from '@/hooks/useAddresses';

export default function Layout() {
  const { user, token, isAuthenticated, logout } = useAuth();
  const { fetchAddresses } = useAddresses();
  const { fetchAllStats } = useAllAdminStats();
  const { fetchCart } = useCart();
  const { fetchAdminCategories, fetchCategories } = useCategories();
  const { fetchConversations } = useChat();
  const { fetchAllMissions, fetchMyMissions, fetchMissionsStats } = useMissions();
  const { fetchNotifications, fetchNotificationStats } = useNotifications();
  const { fetchOrders } = useOrders();
  const { fetchAdminProducts, fetchProducts, fetchProductStats } = useProducts();
  const { fetchUsers, fetchUserStats } = useUsers();
  const { fetchVehicles } = useVehicles();

  useEffect(() => {
    if (user && user.role !== 'client') {
      if (user && user.role !== 'affreteur') fetchAllMissions();
      if (user && user.role !== 'admin') {
        fetchMyMissions();
      }
      if (user && user.role === 'transporteur') {
        fetchVehicles();
      }
      if (user && user.role === 'admin') {
        fetchAdminCategories();
        fetchAdminProducts();
        fetchMissionsStats();
        fetchProductStats();
        fetchUsers();
        fetchUserStats();
        fetchAllStats();
      }
      fetchAddresses();
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

  useEffect(() => {
    if (isAuthenticated && !token) logout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  return (
    <SidebarProvider>
      <>
        {/* FIXED HEADER - MUST HAVE HEIGHT */}
        <Header className="fixed top-0 left-0 right-0 z-50 h-16 border-b bg-white dark:bg-gray-900 dark:border-gray-800" />

        {/* MAIN APP - Full height, starts below header */}
        <div className="flex-1 pt-16 flex flex-col bg-gray-50 dark:bg-gray-950">
          {/* MAIN CONTENT - TAKES REMAINING HEIGHT */}
          <main className="flex flex-1 overflow-hidden">
            {/* SIDEBAR */}
            <Sidebar />

            {/* OUTLET CONTENT - FULL HEIGHT & WIDTH */}
            <section className="flex flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950">
              <Outlet /> {/* Renders Chat, Dashboard, etc. */}
            </section>
          </main>
        </div>
      </>
    </SidebarProvider>
  );
}
