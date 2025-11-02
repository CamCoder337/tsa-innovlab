import './App.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense, useEffect, useState } from 'react';
import ProtectedRoute from '@/components/routing/ProtectedRoute';
import { Loader } from 'lucide-react';
import { getCookie, useAuthStore } from '@/stores/authStore';
import { clearTSALocalStorage } from '@/utils/localStorage.utils';

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
const OrdersManagement = lazy(() => import('./pages/admin/OrdersManagement'));
const Users = lazy(() => import('./pages/admin/UsersManagement'));
const User = lazy(() => import('./pages/admin/UserProfile'));
const AddUser = lazy(() => import('./pages/admin/AddUser'));

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
  <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-950">
    <Loader className="animate-spin h-12 w-12 text-tsa-blue dark:text-tsa-white" />
  </div>
);

const LoadingFallback2 = () => (
  <div className="flex h-full w-full items-center justify-center bg-gray-50 dark:bg-gray-950">
    <Loader className="h-12 w-12 animate-spin text-tsa-blue dark:text-tsa-white" />
  </div>
);

function App() {
  const [token, setToken] = useState(getCookie('tsa_access_token'));
  const { currentUser: user, isLoading, getUser } = useAuthStore.getState();

  useEffect(() => {
    if (!token) {
      clearTSALocalStorage();
      setToken(null);
    } else {
      if (!user && !isLoading) getUser();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

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
            <Suspense fallback={<LoadingFallback2 />}>
              <Dashboard />
            </Suspense>
          }
        />
        <Route
          path="profile"
          element={
            <Suspense fallback={<LoadingFallback2 />}>
              <MyProfile />
            </Suspense>
          }
        />
        <Route
          path="settings"
          element={
            <Suspense fallback={<LoadingFallback2 />}>
              <MySettings />
            </Suspense>
          }
        />

        <Route path="missions">
          <Route
            path=""
            element={
              <Suspense fallback={<LoadingFallback2 />}>
                <MyMissions />
              </Suspense>
            }
          />
          <Route
            path="create"
            element={
              <Suspense fallback={<LoadingFallback2 />}>
                <CreateMission />
              </Suspense>
            }
          />
          <Route
            path=":id"
            element={
              <Suspense fallback={<LoadingFallback2 />}>
                <Mission />
              </Suspense>
            }
          />
          <Route
            path=":id/edit"
            element={
              <Suspense fallback={<LoadingFallback2 />}>
                <CreateMission />
              </Suspense>
            }
          />
        </Route>

        <Route
          path="transactions"
          element={
            <Suspense fallback={<LoadingFallback2 />}>
              <Transactions />
            </Suspense>
          }
        />

        <Route path="users">
          <Route
            path=""
            element={
              <Suspense fallback={<LoadingFallback2 />}>
                <Users />
              </Suspense>
            }
          />
          <Route
            path=":id"
            element={
              <Suspense fallback={<LoadingFallback2 />}>
                <User />
              </Suspense>
            }
          />
          <Route
            path="add"
            element={
              <Suspense fallback={<LoadingFallback2 />}>
                <AddUser />
              </Suspense>
            }
          />
        </Route>

        <Route path="shop">
          <Route
            path=""
            element={
              <Suspense fallback={<LoadingFallback2 />}>
                <Shop />
              </Suspense>
            }
          />
          <Route
            path="product/:id"
            element={
              <Suspense fallback={<LoadingFallback2 />}>
                <Product />
              </Suspense>
            }
          />
          <Route
            path="cart"
            element={
              <Suspense fallback={<LoadingFallback2 />}>
                <CartSummary />
              </Suspense>
            }
          />
          <Route
            path="orders"
            element={
              <Suspense fallback={<LoadingFallback2 />}>
                <Orders />
              </Suspense>
            }
          />
          <Route
            path="order/:id"
            element={
              <Suspense fallback={<LoadingFallback2 />}>
                <Order />
              </Suspense>
            }
          />
        </Route>

        <Route
          path="products"
          element={
            <Suspense fallback={<LoadingFallback2 />}>
              <ProductsManagement />
            </Suspense>
          }
        />

        <Route
          path="orders"
          element={
            <Suspense fallback={<LoadingFallback2 />}>
              <OrdersManagement />
            </Suspense>
          }
        />

        <Route
          path="vehicles"
          element={
            <Suspense fallback={<LoadingFallback2 />}>
              <Vehicles />
            </Suspense>
          }
        />
        <Route
          path="chat"
          element={
            <Suspense fallback={<LoadingFallback2 />}>
              <Chat />
            </Suspense>
          }
        />
        <Route
          path="tracking-dashboard"
          element={
            <Suspense fallback={<LoadingFallback2 />}>
              <TrackingDashboardPage />
            </Suspense>
          }
        />
        <Route
          path="mission/:id/tracking"
          element={
            <Suspense fallback={<LoadingFallback2 />}>
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
