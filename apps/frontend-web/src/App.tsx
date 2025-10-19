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

const Vehicles = lazy(() => import('./pages/vehicles/MyVehicles'));
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
    <Routes>
      <Route
        path="/"
        element={
          <Suspense fallback={<LoadingFallback />}>
            <Login />
          </Suspense>
        }
      />
      <Route
        path="/register"
        element={
          <Suspense fallback={<LoadingFallback />}>
            <Register />
          </Suspense>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <Suspense fallback={<LoadingFallback />}>
            <ForgotPassword />
          </Suspense>
        }
      />
      <Route
        path="/verify-email"
        element={
          <Suspense fallback={<LoadingFallback />}>
            <VerifyEmail />
          </Suspense>
        }
      />

      <Route
        path="/app"
        element={
          <ProtectedRoute
            element={
              <Suspense fallback={<LoadingFallback />}>
                <Layout />
              </Suspense>
            }
          />
        }
      >
        <Route
          path=""
          element={
            <Suspense fallback={<LoadingFallback />}>
              <Dashboard />
            </Suspense>
          }
        />
        <Route
          path="profile"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <MyProfile />
            </Suspense>
          }
        />
        <Route
          path="settings"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <MySettings />
            </Suspense>
          }
        />

        <Route path="missions">
          <Route
            path=""
            element={
              <Suspense fallback={<LoadingFallback />}>
                <MyMissions />
              </Suspense>
            }
          />
          <Route
            path="create"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <CreateMission />
              </Suspense>
            }
          />
          <Route
            path=":id"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <Mission />
              </Suspense>
            }
          />
          <Route
            path=":id/edit"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <CreateMission />
              </Suspense>
            }
          />
        </Route>

        <Route
          path="transactions"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <Transactions />
            </Suspense>
          }
        />

        <Route
          path="users"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <Users />
            </Suspense>
          }
        />

        <Route path="shop">
          <Route
            path=""
            element={
              <Suspense fallback={<LoadingFallback />}>
                <Shop />
              </Suspense>
            }
          />
          <Route
            path="product/:id"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <Product />
              </Suspense>
            }
          />
          <Route
            path="cart"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <CartSummary />
              </Suspense>
            }
          />
          <Route
            path="orders"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <Orders />
              </Suspense>
            }
          />
          <Route
            path="order/:id"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <Order />
              </Suspense>
            }
          />
        </Route>

        <Route
          path="products"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <ProductsManagement />
            </Suspense>
          }
        />
        <Route
          path="vehicles"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <Vehicles />
            </Suspense>
          }
        />
        <Route
          path="chat"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <Chat />
            </Suspense>
          }
        />
        <Route
          path="tracking-dashboard"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <TrackingDashboardPage />
            </Suspense>
          }
        />
        <Route
          path="mission/:id/tracking"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <MissionTrackingPage />
            </Suspense>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
}

export default App;
