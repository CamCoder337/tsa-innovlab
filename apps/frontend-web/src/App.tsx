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
const MyProfile = lazy(() => import('./pages/profiles/MyProfile'));
const MySettings = lazy(() => import('./pages/settings/MySettings'));

const Layout = lazy(() => import('./components/layout/Layout'));
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'));
const ProductsManagement = lazy(() => import('./pages/admin/ProductsManagement'));
const Users = lazy(() => import('./pages/admin/UsersManagement'));

const CreateMission = lazy(() => import('./pages/missions/CreateMission'));
const MyMissions = lazy(() => import('./pages/missions/MyMissions'));
const Mission = lazy(() => import('./pages/missions/Mission'));

const Shop = lazy(() => import('./pages/shop/Shop'));
const Product = lazy(() => import('./pages/shop/Product'));
const CartSummary = lazy(() => import('./pages/shop/CartSummary'));
const Orders = lazy(() => import('./pages/shop/Orders'));
const Order = lazy(() => import('./pages/shop/Order'));

const Chat = lazy(() => import('./pages/ChatPage'));
const Transactions = lazy(() => import('./pages/BillingPage'));
const TrackingDashboardPage = lazy(() => import('./pages/tracking/TrackingDashboardPage'));
const MissionTrackingPage = lazy(() => import('./pages/tracking/MissionTrackingPage'));

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
            <Route path=":id/edit" element={<CreateMission />} />
          </Route>

          <Route path="transactions" element={<Transactions />} />

          <Route path="users" element={<Users />} />

          <Route path="shop">
            <Route path="" element={<Shop />} />
            <Route path="product/:id" element={<Product />} />
            <Route path="cart" element={<CartSummary />} />
            <Route path="orders" element={<Orders />} />
            <Route path="order/:id" element={<Order />} />
          </Route>

          <Route path="products" element={<ProductsManagement />} />
          <Route path="chat" element={<Chat />} />
          <Route path="tracking-dashboard" element={<TrackingDashboardPage />} />
          <Route path="mission/:id/tracking" element={<MissionTrackingPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
