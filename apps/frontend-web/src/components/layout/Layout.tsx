import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useMissions } from '@/hooks/useMissions';
import { usePropositions } from '@/hooks/usePropositions';
import { webSocketService } from '@/services/websocket.service';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function Layout() {
  const { isAuthenticated, token } = useAuth();
  useMissions();
  usePropositions();
  useProducts();
  useCategories();

  useEffect(() => {
    if (isAuthenticated && token) {
      webSocketService.initialize(token);
      webSocketService.connect();
    }
  }, [isAuthenticated, token]);

  return (
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
  );
}
