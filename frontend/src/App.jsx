import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import { canAccess } from './utils/permissions';

// Public pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';

// Protected pages
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import FarmManagement from './pages/FarmManagement';
import Crops from './pages/Crops';
import Livestock from './pages/Livestock';
import Inventory from './pages/Inventory';
import Finance from './pages/Finance';
import Workers from './pages/Workers';
import Equipment from './pages/Equipment';
import Weather from './pages/Weather';
import Predictions from './pages/Predictions';
import Monitoring from './pages/Monitoring';
import Sales from './pages/Sales';
import Marketplace from './pages/Marketplace';
import Notifications from './pages/Notifications';

function ProtectedLayout() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Layout /> : <Navigate to="/landing" replace />;
}

// Redirects to /dashboard if the user's role doesn't allow this route
function Guard({ path, children }) {
  const { user } = useAuth();
  if (!canAccess(user?.role, path)) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Routes>
        {/* Root: redirect based on auth */}
        <Route index element={<Navigate to={isAuthenticated ? '/dashboard' : '/landing'} replace />} />

        {/* Public routes */}
        <Route path="/landing"  element={<Landing />} />
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes */}
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard"     element={<Dashboard />} />
          <Route path="/users"         element={<Guard path="/users"><UserManagement /></Guard>} />
          <Route path="/farms"         element={<Guard path="/farms"><FarmManagement /></Guard>} />
          <Route path="/crops"         element={<Guard path="/crops"><Crops /></Guard>} />
          <Route path="/livestock"     element={<Guard path="/livestock"><Livestock /></Guard>} />
          <Route path="/inventory"     element={<Guard path="/inventory"><Inventory /></Guard>} />
          <Route path="/finance"       element={<Guard path="/finance"><Finance /></Guard>} />
          <Route path="/workers"       element={<Guard path="/workers"><Workers /></Guard>} />
          <Route path="/equipment"     element={<Guard path="/equipment"><Equipment /></Guard>} />
          <Route path="/sales"         element={<Guard path="/sales"><Sales /></Guard>} />
          <Route path="/marketplace"   element={<Guard path="/marketplace"><Marketplace /></Guard>} />
          <Route path="/weather"       element={<Guard path="/weather"><Weather /></Guard>} />
          <Route path="/predictions"   element={<Guard path="/predictions"><Predictions /></Guard>} />
          <Route path="/monitoring"    element={<Guard path="/monitoring"><Monitoring /></Guard>} />
          <Route path="/notifications" element={<Guard path="/notifications"><Notifications /></Guard>} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/landing'} replace />} />
      </Routes>
    </>
  );
}
