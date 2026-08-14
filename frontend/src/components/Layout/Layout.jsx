import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import MobileBottomNav from './MobileBottomNav';
import { useCart } from '../../context/CartContext';
import { getSettings } from '../../services/cartService';
import GoogleIntegration from '../SEO/GoogleIntegration';
import WhatsAppButton from '../WhatsAppButton/WhatsAppButton';

export default function Layout() {
  const { totalItems } = useCart();
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    getSettings().then(setSettings).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen flex flex-col shop-theme">
      <GoogleIntegration />
      <Header cartCount={totalItems} settings={settings} />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 pb-6">
        <Outlet />
      </main>
      <Footer settings={settings} />
      <MobileBottomNav />
      <WhatsAppButton whatsappNumber={settings?.store_whatsapp} />
    </div>
  );
}
