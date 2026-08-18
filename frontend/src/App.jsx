import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { getSettings } from './services/cartService';
import LicenseLocked from './components/License/LicenseLocked';
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

function LicenseChecker() {
  const [locked, setLocked] = useState(false);
  const [message, setMessage] = useState('');

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

  if (locked) {
    return <LicenseLocked message={message} />;
  }

  return null;
}

export default function App() {
  return (
    <CartProvider>
      <Router>
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
  );
}
