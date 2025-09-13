import './App.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ProtectedRoute from '@/components/routing/ProtectedRoute';
import Dashboard from './pages/dashboard/Dashboard';
import VerifyEmail from './pages/auth/VerifyEmail';
import Layout from './components/layout/Layout';
import CreateMission from './pages/missions/CreateMission';
import MyMissions from './pages/missions/MyMissions';
import MyProfile from './pages/profiles/MyProfile';
import MySettings from './pages/settings/MySettings';
import Shop from './pages/shop/Shop';

function App() {
    return (
        <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />

            <Route path="/app" element={<Layout />}>
                <Route path="" element={<ProtectedRoute element={<Dashboard />} />} />

                <Route path="missions">
                    <Route path="" element={<ProtectedRoute element={<MyMissions />} />} />
                    <Route path="create" element={<ProtectedRoute element={<CreateMission />} />} />
                </Route>

                <Route path="shop" element={<ProtectedRoute element={<Shop />} />} />

                <Route path="profile" element={<ProtectedRoute element={<MyProfile />} />} />
                <Route path="settings" element={<ProtectedRoute element={<MySettings />} />} />
            </Route>

            <Route path="*" element={<ProtectedRoute element={<Navigate to="/app" replace />} />} />
        </Routes>
    );
}

export default App;
