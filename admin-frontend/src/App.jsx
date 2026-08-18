import { useState, useEffect, useRef, useCallback } from 'react';
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

const LICENSE_STORAGE_KEY = 'ecatalog_admin_license_status';
const LICENSE_STORAGE_TTL = 60 * 1000;
const LICENSE_POLL_INTERVAL = 30000;

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

function LicenseGate({ children }) {
  const [locked, setLocked] = useState(false);
  const [message, setMessage] = useState('');
  const intervalRef = useRef(null);
  const channelRef = useRef(null);
  const isAuthPage = window.location.pathname === '/login' || window.location.pathname === '/forgot-password' || window.location.pathname === '/reset-password';

  const setLicenseLockedLocal = useCallback((msg) => {
    setMessage(msg || 'Lisensi tidak valid atau telah di-suspend.');
    setLocked(true);
  }, []);

  const clearLicenseLockLocal = useCallback(() => {
    setMessage('');
    setLocked(false);
  }, []);

  const checkLicense = useCallback(async () => {
    const stored = getStoredLicense();
    if (stored?.status === 'invalid') {
      setLicenseLockedLocal(stored.message);
      return;
    }
    if (stored?.status === 'valid') {
      clearLicenseLockLocal();
      return;
    }

    try {
      const response = await api.get('/license/status');
      const data = response.data || response;
      if (data.status === 'invalid') {
        setStoredLicense('invalid', data.message);
        setLicenseLockedLocal(data.message);
      } else {
        setStoredLicense('valid', '');
        clearLicenseLockLocal();
      }
    } catch {
      // ignore
    }
  }, [setLicenseLockedLocal, clearLicenseLockLocal]);

  useEffect(() => {
    const stored = getStoredLicense();
    if (stored?.status === 'invalid') {
      setMessage(stored.message || 'Lisensi tidak valid atau telah di-suspend.');
      setLocked(true);
    }

    const unsubscribe = onLicenseLocked((msg) => {
      if (msg) {
        setStoredLicense('invalid', msg);
        setMessage(msg);
        setLocked(true);
      } else {
        setStoredLicense('valid', '');
        setMessage('');
        setLocked(false);
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
        setLocked(true);
      } else if (data.status === 'valid') {
        setStoredLicense('valid', '');
        setMessage('');
        setLocked(false);
      }
    };

    channel?.addEventListener('message', handleMessage);
    window.addEventListener('storage', (event) => {
      if (event.key === LICENSE_STORAGE_KEY && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue);
          if (parsed.status === 'invalid') {
            setMessage(parsed.message || 'Lisensi tidak valid atau telah di-suspend.');
            setLocked(true);
          } else if (parsed.status === 'valid') {
            setMessage('');
            setLocked(false);
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
