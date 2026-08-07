import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { getSettings } from '../services/cartService';
import SEO from '../components/SEO/SEO';

export default function Cart() {
  const { items, removeItem, updateQuantity, clearCart } = useCart();
  const [settings, setSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsError, setSettingsError] = useState('');

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch(err => {
        setSettingsError('Gagal memuat pengaturan.');
        console.error(err);
      })
      .finally(() => setSettingsLoading(false));
  }, []);

  const getItemPrice = (item) => {
    const p = item.product;
    return p ? (p.discount_price ?? p.price) : 0;
  };

  const subtotal = items.reduce((sum, item) => sum + getItemPrice(item) * item.quantity, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <SEO
        title={items.length > 0 ? `Keranjang (${items.length} ${items.length === 1 ? 'produk' : 'produk'})` : 'Keranjang Belanja'}
        description="Lihat dan kelola keranjang belanja Anda. Lanjutkan ke checkout via WhatsApp."
        noindex={true}
      />

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Keranjang Belanja</h1>
            {items.length > 0 && (
              <p className="text-gray-500 text-sm mt-1">{totalItems} {totalItems === 1 ? 'produk' : 'produk'} di keranjang</p>
            )}
          </div>
          {items.length > 0 && (
            <button
              onClick={clearCart}
              className="flex items-center gap-1.5 text-sm text-danger-600 hover:text-danger-700 bg-danger-50 hover:bg-danger-100 px-3 py-1.5 rounded-none transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              Kosongkan
            </button>
          )}
        </div>

        {settingsError && (
          <div className="bg-danger-100 text-danger-700 p-4 rounded-none mb-6 text-center">
            {settingsError}
          </div>
        )}

        {items.length === 0 ? (
          <div className="text-center py-20">
            <div className="mb-6 flex justify-center">
              <div className="w-28 h-28 bg-gray-100 rounded-none flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-14 h-14 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Keranjang Kosong</h2>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto">Belum ada produk di keranjang Anda. Yuk, mulai belanja sekarang!</p>
            <Link
              to="/produk"
              className="inline-flex items-center gap-2 bg-primary-600 text-white px-8 py-3 rounded-none font-semibold hover:bg-primary-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              Mulai Belanja
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item, index) => {
                const price = getItemPrice(item);
                const product = item.product;
                const hasDiscount = product?.discount_price;
                return (
                  <div key={item.id || index} className="bg-white rounded-none shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow duration-200">
                    <div className="flex gap-4">
                      {/* Product Image */}
                      <div className="w-24 h-24 bg-gray-100 rounded-none overflow-hidden flex-shrink-0">
                        {product?.images?.[0] ? (
                          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                              <line x1="12" y1="22.08" x2="12" y2="12" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-gray-900 truncate">{product?.name || 'Produk'}</h3>
                            {item.notes && (
                              <p className="text-xs text-gray-400 mt-0.5">Catatan: {item.notes}</p>
                            )}
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-gray-400 hover:text-danger-500 transition-colors p-1 -mr-1 -mt-1"
                            title="Hapus"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-semibold text-primary-600">Rp {price.toLocaleString('id-ID')}</span>
                          {hasDiscount && (
                            <span className="text-xs text-gray-400 line-through">Rp {product.price.toLocaleString('id-ID')}</span>
                          )}
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center border border-gray-200 rounded-none overflow-hidden">
                            <button
                              onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                              className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 hover:text-primary-600 transition-colors text-sm font-medium"
                            >
                              −
                            </button>
                            <span className="px-4 py-1.5 text-sm font-semibold text-gray-900 border-x border-gray-200 min-w-[40px] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 hover:text-primary-600 transition-colors text-sm font-medium"
                            >
                              +
                            </button>
                          </div>
                          <p className="font-bold text-gray-900">Rp {(price * item.quantity).toLocaleString('id-ID')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-none shadow-sm border border-gray-100 p-6 sticky top-24">
                <h3 className="font-bold text-lg text-gray-900 mb-6 pb-4 border-b border-gray-100">
                  Ringkasan Belanja
                </h3>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Produk</span>
                    <span className="font-medium text-gray-900">{totalItems} {totalItems === 1 ? 'item' : 'item'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium text-gray-900">Rp {subtotal.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4 mb-6">
                  <div className="flex justify-between items-baseline">
                    <span className="text-base font-semibold text-gray-900">Total</span>
                    <span className="text-xl font-bold text-primary-600">Rp {subtotal.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const message = items.map(i => {
                      const p = i.product;
                      const name = p?.name || 'Produk';
                      const price = p ? (p.discount_price ?? p.price) : 0;
                      const lineTotal = price * i.quantity;
                      const note = i.notes ? ` (Catatan: ${i.notes})` : '';
                      return `- ${name} x${i.quantity}: Rp ${lineTotal.toLocaleString('id-ID')}${note}`;
                    }).join('\n');
                    const total = subtotal.toLocaleString('id-ID');
                    const text = `Halo, saya ingin memesan:\n\n${message}\n\nTotal: Rp ${total}`;
                    const url = `https://wa.me/${settings?.store_whatsapp}?text=${encodeURIComponent(text)}`;
                    window.open(url, '_blank');
                  }}
                  disabled={settingsLoading || !settings?.store_whatsapp}
                  className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-none font-semibold transition-all duration-200 ${
                    settingsLoading || !settings?.store_whatsapp
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-success-500 text-white hover:bg-success-600 shadow-md hover:shadow-lg hover:shadow-success-500/30'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  {settingsLoading ? 'Memuat...' : 'Checkout via WhatsApp'}
                </button>

                <Link
                  to="/produk"
                  className="w-full flex items-center justify-center gap-2 mt-3 py-2.5 border border-gray-200 rounded-none text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                  </svg>
                  Lanjut Belanja
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}