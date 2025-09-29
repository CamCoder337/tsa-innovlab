import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useMissions } from '@/hooks/useMissions';
import { usePropositions } from '@/hooks/usePropositions';

export default function Layout() {
  useMissions();
  usePropositions();
  useProducts();
  useCategories();

  return (
    <div className="flex h-screen bg-gray-50 flex-1 flex-col">
      <Header />
      <main className="flex">
        <div>
          <Sidebar />
        </div>
        <div className="w-full p-6 top-16 relative">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
