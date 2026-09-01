import { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import { onLicenseLocked } from './utils/licenseLock';
import api from './services/api';
import AdminLayout from './components/Layout/AdminLayout';
import Login from './pages/Auth/Login';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Brands from './pages/Brands';
// import Orders from './pages/Orders'; // Sementara disembunyikan: fitur pesanan/order
import Settings from './pages/Settings';
import BankAccounts from './pages/BankAccounts';
import Users from './pages/Users';
import Profile from './pages/Profile';
import ChangePassword from './pages/ChangePassword';

const LICENSE_STORAGE_KEY = 'ecatalog_admin_license_status';
const LICENSE_STORAGE_TTL = 60 * 1000;
const LICENSE_POLL_INTERVAL = 30000;

const ALLOWED_SUSPENDED_PATHS = ['/settings'];

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

function getStoredLicense() {
  try {
    const raw = localStorage.getItem(LICENSE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
      localStorage.removeItem(LICENSE_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function setStoredLicense(status, message) {
  try {
    localStorage.setItem(
      LICENSE_STORAGE_KEY,
      JSON.stringify({ status, message, expiresAt: Date.now() + LICENSE_STORAGE_TTL })
    );
  } catch {
    // ignore
  }
}

function isSuspendedPath(pathname) {
  if (pathname === '/login' || pathname === '/forgot-password' || pathname === '/reset-password') {
    return true;
  }
  return ALLOWED_SUSPENDED_PATHS.some(path => pathname === path || pathname.startsWith(path + '/'));
}

function LicenseGate({ children }) {
  const [suspended, setSuspended] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const intervalRef = useRef(null);
  const channelRef = useRef(null);

  const setSuspendedLocal = useCallback((msg) => {
    setMessage(msg || 'Lisensi tidak valid atau telah di-suspend.');
    setSuspended(true);
  }, []);

  const clearSuspendedLocal = useCallback(() => {
    setMessage('');
    setSuspended(false);
  }, []);

  const checkLicense = useCallback(async () => {
    const stored = getStoredLicense();
    if (stored?.status === 'invalid') {
      setSuspendedLocal(stored.message);
      return;
    }
    if (stored?.status === 'valid') {
      clearSuspendedLocal();
      return;
    }

    try {
      const response = await api.get('/license/status');
      const data = response.data || response;
      if (data.status === 'invalid') {
        setStoredLicense('invalid', data.message);
        setSuspendedLocal(data.message);
      } else {
        setStoredLicense('valid', '');
        clearSuspendedLocal();
      }
    } catch {
      // ignore
    }
  }, [setSuspendedLocal, clearSuspendedLocal]);

  useEffect(() => {
    const stored = getStoredLicense();
    if (stored?.status === 'invalid') {
      setMessage(stored.message || 'Lisensi tidak valid atau telah di-suspend.');
      setSuspended(true);
    }

    const unsubscribe = onLicenseLocked((msg) => {
      if (msg) {
        setStoredLicense('invalid', msg);
        setMessage(msg);
        setSuspended(true);
      } else {
        setStoredLicense('valid', '');
        setMessage('');
        setSuspended(false);
      }
    });

    const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('ecatalog_license') : null;
    channelRef.current = channel;

    const handleMessage = (event) => {
      const data = event.data;
      if (!data || data.type !== 'license-status') return;
      if (data.status === 'invalid') {
        setStoredLicense('invalid', data.message);
        setMessage(data.message);
        setSuspended(true);
      } else if (data.status === 'valid') {
        setStoredLicense('valid', '');
        setMessage('');
        setSuspended(false);
      }
    };

    channel?.addEventListener('message', handleMessage);
    window.addEventListener('storage', (event) => {
      if (event.key === LICENSE_STORAGE_KEY && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue);
          if (parsed.status === 'invalid') {
            setMessage(parsed.message || 'Lisensi tidak valid atau telah di-suspend.');
            setSuspended(true);
          } else if (parsed.status === 'valid') {
            setMessage('');
            setSuspended(false);
          }
        } catch {
          // ignore
        }
      }
    });

    const startPolling = () => {
      checkLicense();
      intervalRef.current = setInterval(checkLicense, LICENSE_POLL_INTERVAL);
    };

    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    startPolling();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        checkLicense();
        startPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      unsubscribe();
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      channel?.removeEventListener('message', handleMessage);
      channel?.close();
    };
  }, [checkLicense]);

  useEffect(() => {
    if (suspended && !isSuspendedPath(location.pathname)) {
      navigate('/settings', { replace: true });
    }
  }, [suspended, location.pathname, navigate]);

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
            <Route path="brands" element={<Brands />} />
            {/* Sementara disembunyikan: fitur pesanan/order. Aktifkan kembali bila diperlukan. */}
            <Route path="orders" element={<Navigate to="/" replace />} />
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
