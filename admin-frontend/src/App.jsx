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

function setStoredLicense(status, message, bindingRequired = false) {
  try {
    localStorage.setItem(
      LICENSE_STORAGE_KEY,
      JSON.stringify({
        status,
        message,
        binding_required: !!bindingRequired,
        expiresAt: Date.now() + LICENSE_STORAGE_TTL,
      })
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
  const [bindingRequired, setBindingRequired] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const intervalRef = useRef(null);
  const channelRef = useRef(null);

  const setSuspendedLocal = useCallback((msg) => {
    setMessage(msg || 'Lisensi tidak valid atau telah di-suspend.');
    setSuspended(true);
    setBindingRequired(false);
  }, []);

  const setBindingLocal = useCallback((msg) => {
    setMessage(msg || 'License belum terikat ke server ini.');
    setSuspended(true);
    setBindingRequired(true);
  }, []);

  const clearSuspendedLocal = useCallback(() => {
    setMessage('');
    setSuspended(false);
    setBindingRequired(false);
  }, []);

  const checkLicense = useCallback(async () => {
    const stored = getStoredLicense();
    if (stored?.status === 'invalid') {
      if (stored.binding_required) {
        setBindingLocal(stored.message);
      } else {
        setSuspendedLocal(stored.message);
      }
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
        setStoredLicense('invalid', data.message, data.binding_required);
        if (data.binding_required) {
          setBindingLocal(data.message);
        } else {
          setSuspendedLocal(data.message);
        }
      } else {
        setStoredLicense('valid', '', false);
        clearSuspendedLocal();
      }
    } catch {
      // ignore
    }
  }, [setSuspendedLocal, setBindingLocal, clearSuspendedLocal]);

  useEffect(() => {
    const stored = getStoredLicense();
    if (stored?.status === 'invalid') {
      setMessage(stored.message || 'Lisensi tidak valid atau telah di-suspend.');
      setSuspended(true);
      setBindingRequired(!!stored.binding_required);
    }

    const unsubscribe = onLicenseLocked((msg, meta) => {
      if (msg) {
        setStoredLicense('invalid', msg, meta?.binding_required);
        setMessage(msg);
        setSuspended(true);
        setBindingRequired(!!meta?.binding_required);
      } else {
        setStoredLicense('valid', '', false);
        setMessage('');
        setSuspended(false);
        setBindingRequired(false);
      }
    });

    const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('ecatalog_license') : null;
    channelRef.current = channel;

    const handleMessage = (event) => {
      const data = event.data;
      if (!data || data.type !== 'license-status') return;
      if (data.status === 'invalid') {
        setStoredLicense('invalid', data.message, data.binding_required);
        setMessage(data.message);
        setSuspended(true);
        setBindingRequired(!!data.binding_required);
      } else if (data.status === 'valid') {
        setStoredLicense('valid', '', false);
        setMessage('');
        setSuspended(false);
        setBindingRequired(false);
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
            setBindingRequired(!!parsed.binding_required);
          } else if (parsed.status === 'valid') {
            setMessage('');
            setSuspended(false);
            setBindingRequired(false);
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

  return (
    <>
      {bindingRequired && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-start sm:items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mt-0.5 sm:mt-0 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <div className="flex-1 text-sm">
              <strong className="block sm:inline">License belum terikat ke server ini.</strong>
              <span className="block sm:inline sm:ml-1 opacity-90">
                {message} Buka halaman{' '}
                <button
                  type="button"
                  onClick={() => navigate('/settings')}
                  className="underline font-semibold hover:opacity-80"
                >
                  Pengaturan → License Binding
                </button>{' '}
                untuk bind dengan transfer token dari admin.
              </span>
            </div>
          </div>
        </div>
      )}
      {children}
    </>
  );
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
