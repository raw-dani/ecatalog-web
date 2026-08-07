import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { getSettings } from './services/cartService';
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
      .then(data => {
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

export default function App() {
  return (
    <CartProvider>
      <Router>
        <FaviconUpdater />
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
