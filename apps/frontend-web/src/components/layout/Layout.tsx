import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useMissions } from '@/hooks/useMissions';
import { useUsers } from '@/hooks/useUsers';
import { webSocketService } from '@/services/websocket.service';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { SidebarProvider } from '@/components/ui/sidebar';

export default function Layout() {
  const { isAuthenticated, token } = useAuth();
  useMissions();
  useProducts();
  useCategories();
  useUsers();

  useEffect(() => {
    if (isAuthenticated && token) {
      console.log('Initializing WebSocket with token');
      webSocketService.initialize(token);
    } else if (isAuthenticated && !token) {
      console.warn('User is authenticated but token is missing');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-gray-50 flex-1 flex-col">
        <Header />
        <main className="flex">
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
