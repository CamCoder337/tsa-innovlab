import './App.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import ProtectedRoute from '@/components/routing/ProtectedRoute';
import { Loader } from 'lucide-react';

// Lazy-loaded components
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const VerifyEmail = lazy(() => import('./pages/auth/VerifyEmail'));
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'));
const Layout = lazy(() => import('./components/layout/Layout'));
const CreateMission = lazy(() => import('./pages/missions/CreateMission'));
const MyMissions = lazy(() => import('./pages/missions/MyMissions'));
const Mission = lazy(() => import('./pages/missions/[id]'))
const MyProfile = lazy(() => import('./pages/profiles/MyProfile'));
const MySettings = lazy(() => import('./pages/settings/MySettings'));
const Shop = lazy(() => import('./pages/shop/Shop'));
const ProductsManagement = lazy(() => import('./pages/admin/ProductsManagement'));

// Loading component for Suspense fallback
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen">
    <Loader className="animate-spin h-12 w-12 text-tsa-blue" />
  </div>
);

function App() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        <Route path="/app" element={<ProtectedRoute element={<Layout />} />}>
          <Route path="" element={<Dashboard />} />
          <Route path="profile" element={<MyProfile />} />
          <Route path="settings" element={<MySettings />} />

          <Route path="missions">
            <Route path="" element={<MyMissions />} />
            <Route path="create" element={<CreateMission />} />
            <Route path=":id" element={<Mission />} />
          </Route>

          <Route path="shop" element={<Shop />} />

          <Route path="products" element={<ProductsManagement />} />
        </Route>

        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
