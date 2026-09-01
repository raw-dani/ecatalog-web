import { useEffect, useState, useRef, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { SettingsProvider } from './context/SettingsContext';
import { getSettings } from './services/cartService';
import LicenseLocked from './components/License/LicenseLocked';
import OfflineBanner from './components/Offline/OfflineBanner';
import VisitTracker from './components/VisitTracker';
import { onLicenseLocked } from './utils/licenseLock';
import api from './services/api';
import Layout from './components/Layout/Layout';
import Home from './pages/Home';
import Categories from './pages/Categories';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import HowToOrder from './pages/HowToOrder';
import Contact from './pages/Contact';
import OrderTracking from './pages/OrderTracking';
import Help from './pages/Help';

const LICENSE_STORAGE_KEY = 'ecatalog_license_status';
const LICENSE_STORAGE_TTL = 60 * 1000;
const LICENSE_POLL_INTERVAL = 30000;

function FaviconUpdater() {
  useEffect(() => {
    getSettings()
      .then((data) => {
        if (data.store_favicon) {
          const link = document.querySelector("link[rel='icon']");
          if (link) {
            link.href = data.store_favicon;
          }
        }
      })
      .catch(() => {});
  }, []);
  return null;
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

function LicenseChecker() {
  const [locked, setLocked] = useState(false);
  const [message, setMessage] = useState('');
  const channelRef = useRef(null);
  const intervalRef = useRef(null);
  const visibleRef = useRef(typeof document !== 'undefined' ? !document.hidden : true);

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
        visibleRef.current = false;
      } else {
        visibleRef.current = true;
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

  if (locked) {
    return <LicenseLocked message={message} />;
  }

  return null;
}

export default function App() {
  return (
    <SettingsProvider>
      <CartProvider>
        <OfflineBanner />
        <Router>
          <VisitTracker />
          <FaviconUpdater />
          <LicenseChecker />
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="produk" element={<Products />} />
              <Route path="produk/:slug" element={<ProductDetail />} />
              <Route path="kategori" element={<Categories />} />
              <Route path="kategori/:slug" element={<Products />} />
              <Route path="keranjang" element={<Cart />} />
              <Route path="cara-pemesanan" element={<HowToOrder />} />
              <Route path="kontak" element={<Contact />} />
              <Route path="bantuan" element={<Help />} />
              <Route path="pesanan/:orderNumber" element={<OrderTracking />} />
            </Route>
          </Routes>
        </Router>
      </CartProvider>
    </SettingsProvider>
  );
}
