import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { useCart } from '../../context/CartContext';

export default function Layout() {
  const { totalItems } = useCart();

  return (
    <div className="min-h-screen flex flex-col">
      <Header cartCount={totalItems} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
