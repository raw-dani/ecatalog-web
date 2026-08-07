import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { useCart } from '../../context/CartContext';
import { getSettings } from '../../services/cartService';
import GoogleIntegration from '../SEO/GoogleIntegration';

export default function Layout() {
  const { totalItems } = useCart();
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    getSettings().then(setSettings).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <GoogleIntegration />
      <Header cartCount={totalItems} settings={settings} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer settings={settings} />
    </div>
  );
}
