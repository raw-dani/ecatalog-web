import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import LicenseLocked from './components/License/LicenseLocked';
import { onLicenseLocked } from './utils/licenseLock';
import api from './services/api';
import AdminLayout from './components/Layout/AdminLayout';
import Login from './pages/Auth/Login';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Orders from './pages/Orders';
import Settings from './pages/Settings';
import BankAccounts from './pages/BankAccounts';
import Users from './pages/Users';
import Profile from './pages/Profile';
import ChangePassword from './pages/ChangePassword';

function ProtectedRoute({ children }) {
  const { admin, loading } = useAuth();

  if (loading) return <div className="text-center py-12">Loading...</div>;
  if (!admin) return <Navigate to="/login" replace />;

  return children;
}

function PublicRoute({ children }) {
  const { admin, loading } = useAuth();

  if (loading) return <div className="text-center py-12">Loading...</div>;
  if (admin) return <Navigate to="/" replace />;

  return children;
}

function LicenseGate({ children }) {
  const [locked, setLocked] = useState(false);
  const [message, setMessage] = useState('');
  const isAuthPage = window.location.pathname === '/login' || window.location.pathname === '/forgot-password' || window.location.pathname === '/reset-password';

  useEffect(() => {
    const unsubscribe = onLicenseLocked((msg) => {
      if (msg) {
        setMessage(msg);
        setLocked(true);
      } else {
        setMessage('');
        setLocked(false);
      }
    });

    const checkLicense = async () => {
      try {
        const response = await api.get('/license/status');
        const data = response.data || response;
        if (data.status === 'invalid') {
          setLicenseLockedLocal(data.message);
        } else {
          clearLicenseLockLocal();
        }
      } catch {
        // ignore
      }
    };

    checkLicense();
    const interval = setInterval(checkLicense, 30000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const setLicenseLockedLocal = (msg) => {
    setMessage(msg || 'Lisensi tidak valid atau telah di-suspend.');
    setLocked(true);
  };

  const clearLicenseLockLocal = () => {
    setMessage('');
    setLocked(false);
  };

  if (locked && !isAuthPage) {
    return (
      <LicenseLocked
        message={message}
        onActivate={() => {
          window.location.href = '/settings';
        }}
      />
    );
  }

  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
      <Router>
        <LicenseGate>
        <Routes>
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          <Route path="/forgot-password" element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          } />
          <Route path="/reset-password" element={
            <PublicRoute>
              <ResetPassword />
            </PublicRoute>
          } />
          <Route path="/" element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="categories" element={<Categories />} />
            <Route path="orders" element={<Orders />} />
            <Route path="settings" element={<Settings />} />
            <Route path="bank-accounts" element={<BankAccounts />} />
            <Route path="users" element={<Users />} />
            <Route path="profile" element={<Profile />} />
            <Route path="change-password" element={<ChangePassword />} />
          </Route>
        </Routes>
        </LicenseGate>
      </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
