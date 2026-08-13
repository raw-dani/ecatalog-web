import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSettings, getFeaturedProducts, getCategories, getProducts } from '../services/cartService';
import ShopProductCard from '../components/Product/ShopProductCard';
import SEO from '../components/SEO/SEO';

function HomeSkeleton() {
  return (
    <div className="shop-theme animate-pulse min-h-screen">
      <div className="shop-container">
        <div className="shop-profile">
          <div className="shop-profile-main">
            <div className="w-[120px] h-[120px] bg-gray-200 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="h-6 bg-gray-200 rounded w-1/3" />
              <div className="h-4 bg-gray-200 rounded w-1/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          </div>
        </div>
        <div className="product-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="product-card">
              <div className="product-image bg-gray-200" />
              <div className="product-content space-y-2">
                <div className="h-3 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-4 bg-gray-200 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [settings, setSettings] = useState(null);
  const [settingsError, setSettingsError] = useState('');
  const [featured, setFeatured] = useState([]);
  const [_categories, setCategories] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Untuk Anda');
  const [following, setFollowing] = useState(false);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [subscribeEmail, setSubscribeEmail] = useState('');
  const [subscribeLoading, setSubscribeLoading] = useState(false);
  const [subscribeMessage, setSubscribeMessage] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);

  const getVisibleProducts = () => {
    switch (activeTab) {
      case 'Semua Produk':
        return allProducts;
      case 'Terbaru':
        return allProducts;
      case 'Terlaris':
        return featured.length > 0 ? featured : allProducts;
      case 'Promo':
        return allProducts.filter(p => p.discount_price);
      case 'Untuk Anda':
      default:
        return featured.length > 0 ? featured : allProducts;
    }
  };

  useEffect(() => {
    Promise.all([
      getSettings(),
      getFeaturedProducts(),
      getCategories(),
      getProducts({ sort: 'newest', per_page: 20 })
    ])
      .then(([settingsData, featuredData, categoriesData, productsData]) => {
        setSettings(settingsData);
        setFeatured(featuredData);
        setCategories(categoriesData);
        const products = Array.isArray(productsData) ? productsData : (productsData.data || []);
        setAllProducts(products);
      })
      .catch(err => {
        setSettingsError('Gagal memuat data beranda.');
        console.error('Home page error:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <HomeSkeleton />;

  const visibleProducts = getVisibleProducts();

  const storeName = settings?.store_name || 'Toko Online';
  const storeInitial = storeName.charAt(0).toUpperCase();

  const shareToWhatsApp = () => {
    const text = `Kunjungi toko ${storeName}: ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    setShowShareModal(false);
  };

  const shareToFacebook = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=600,height=400');
    setShowShareModal(false);
  };

  const shareToTwitter = () => {
    const text = encodeURIComponent(`Kunjungi toko ${storeName}`);
    const url = encodeURIComponent(window.location.href);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'width=600,height=400');
    setShowShareModal(false);
  };

  const shareToTelegram = () => {
    const text = encodeURIComponent(`Kunjungi toko ${storeName}\n${window.location.href}`);
    window.open(`https://t.me/share/url?text=${text}`, '_blank');
    setShowShareModal(false);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert('Link berhasil disalin!');
    } catch {
      alert('Gagal menyalin link.');
    }
    setShowShareModal(false);
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    setSubscribeLoading(true);
    setSubscribeMessage(null);

    try {
      const response = await fetch('/api/store/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: subscribeEmail }),
      });
      const data = await response.json();

      if (data.success) {
        setSubscribeMessage({ type: 'success', text: data.message });
        setFollowing(true);
        setSubscribeEmail('');
        setTimeout(() => {
          setShowSubscribeModal(false);
          setSubscribeMessage(null);
        }, 2000);
      } else {
        setSubscribeMessage({ type: 'error', text: data.message });
      }
    } catch {
      setSubscribeMessage({ type: 'error', text: 'Terjadi kesalahan. Coba lagi.' });
    } finally {
      setSubscribeLoading(false);
    }
  };

  const tabs = [
    { key: 'Untuk Anda', label: 'Untuk Anda' },
    { key: 'Semua Produk', label: 'Semua Produk' },
    { key: 'Terbaru', label: 'Terbaru' },
    { key: 'Terlaris', label: 'Terlaris' },
    { key: 'Promo', label: 'Promo' },
  ];

  return (
    <>
      <SEO
        title={settings?.store_name || 'Beranda'}
        description={settings?.store_description || `Selamat datang di ${settings?.store_name || 'toko kami'}. Temukan produk terbaik dengan harga terjangkau.`}
        settings={settings}
      />

      <div className="shop-theme flex flex-col pb-20">
        {settingsError && (
          <div className="bg-danger-100 text-danger-700 p-4 text-center">
            {settingsError}
          </div>
        )}

        {/* Shop Profile */}
        <section className="shop-profile">
          <div className="shop-profile-main">
            <div className="shop-avatar">
              {settings?.store_favicon ? (
                <img src={settings.store_favicon} alt={storeName} />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-3xl font-bold text-gray-400">
                  {storeInitial}
                </div>
              )}
            </div>

            <div className="shop-info">
              <div className="shop-title">
                <h1 className="shop-name">{storeName}</h1>
                <span className="verified">✓</span>
              </div>

              <div className="shop-username">@{storeName.toLowerCase().replace(/\s+/g, '')}</div>

              <div className="shop-stats">
                <div className="shop-stat">
                  <strong>{allProducts.length || featured.length}</strong>
                  <span>Produk</span>
                </div>
                {[
                  { key: 'social_facebook', label: 'Facebook', icon: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' },
                  { key: 'social_instagram', label: 'Instagram', icon: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z' },
                  { key: 'social_tiktok', label: 'TikTok', icon: 'M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.11V9.01a6.29 6.29 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.87a8.28 8.28 0 004.84 1.57V7.18a4.85 4.85 0 01-3.77-1.49z' },
                  { key: 'social_youtube', label: 'YouTube', icon: 'M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' },
                  { key: 'social_twitter', label: 'Twitter', icon: 'M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z' },
                ]
                  .filter(item => settings?.[item.key])
                  .map(item => (
                    <a
                      key={item.key}
                      href={settings[item.key]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shop-social-icon"
                      aria-label={item.label}
                      title={item.label}
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                        <path d={item.icon} />
                      </svg>
                    </a>
                  ))}
              </div>

              <div className="shop-bio">
                <div className="shop-bio-title">{storeName}</div>
                <div>
                  {settings?.store_description || 'Temukan produk terbaik dengan harga terjangkau'}
                </div>

                <div className="shop-location">
                  {settings?.store_address && (
                    <span>📍 {settings.store_address}</span>
                  )}
                  {settings?.store_address && <span>•</span>}
                  <span>🚚 Pengiriman seluruh Indonesia</span>
                </div>
              </div>

              <div className="shop-actions">
                <button
                  className={`follow-button ${following ? 'following' : ''}`}
                  onClick={() => {
                    if (following) {
                      setFollowing(false);
                    } else {
                      setShowSubscribeModal(true);
                    }
                  }}
                  type="button"
                >
                  {following ? '✓ Mengikuti' : '+ Ikuti Toko'}
                </button>
                <button className="share-button" onClick={() => setShowShareModal(true)} type="button">
                  ↗ Bagikan
                </button>
              </div>
            </div>
          </div>

          <div className="shop-benefits">
            <div className="benefit">
              <div className="benefit-icon">🚚</div>
              <div className="benefit-text">
                <strong>Pengiriman Cepat</strong>
                <span>Diproses setiap hari</span>
              </div>
            </div>
            <div className="benefit">
              <div className="benefit-icon">✓</div>
              <div className="benefit-text">
                <strong>Produk Original</strong>
                <span>Terjamin kualitasnya</span>
              </div>
            </div>
            <div className="benefit">
              <div className="benefit-icon">↩</div>
              <div className="benefit-text">
                <strong>Garansi Produk</strong>
                <span>Belanja lebih aman</span>
              </div>
            </div>
          </div>
        </section>

        {/* Shop Tabs */}
        <div className="shop-tabs-wrapper">
          <nav className="shop-tabs" role="tablist">
            {tabs.map(tab => (
              <button
                key={tab.key}
                role="tab"
                className={`tab ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Section Header */}
        <div className="section-header">
          <div>
            <h2 className="section-title">Temukan Produk</h2>
            <div className="section-subtitle">Produk pilihan dari {storeName}</div>
          </div>
          <button className="sort-button" type="button">↕ Urutkan</button>
        </div>

        {/* Product Grid */}
        <section className="product-grid" role="tabpanel">
          {visibleProducts.length > 0 ? (
            visibleProducts.map(product => (
              <ShopProductCard
                key={product.id}
                product={product}
                storeName={storeName}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-gray-500">
              Tidak ada produk untuk saat ini.
            </div>
          )}
        </section>

        {/* Mobile Bottom Nav */}
        <nav className="bottom-nav">
          <Link to="/" className="bottom-item active">
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>Home</span>
          </Link>
          <Link to="/produk" className="bottom-item">
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span>Explore</span>
          </Link>
          <Link to="/kategori" className="bottom-item">
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            <span>Kategori</span>
          </Link>
          <Link to="/keranjang" className="bottom-item">
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <span>Cart</span>
          </Link>
          <Link to="/kontak" className="bottom-item">
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>Profile</span>
          </Link>
        </nav>

        {/* Subscribe Modal */}
        {showSubscribeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowSubscribeModal(false)} />
            <div className="relative bg-white rounded-none shadow-xl max-w-md w-full p-6">
              <button
                onClick={() => setShowSubscribeModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                type="button"
                aria-label="Tutup"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              <h3 className="text-xl font-bold text-gray-900 mb-2">Ikuti Toko</h3>
              <p className="text-sm text-gray-500 mb-4">
                Dapatkan notifikasi email setiap kali ada produk baru di {storeName}.
              </p>

              <form onSubmit={handleSubscribe}>
                <div className="mb-4">
                  <label htmlFor="subscribe-email" className="block text-sm font-medium text-gray-700 mb-1">
                    Alamat Email
                  </label>
                  <input
                    id="subscribe-email"
                    type="email"
                    value={subscribeEmail}
                    onChange={e => setSubscribeEmail(e.target.value)}
                    placeholder="nama@email.com"
                    required
                    className="w-full border border-gray-200 rounded-none px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>

                {subscribeMessage && (
                  <div className={`mb-4 p-3 rounded-none text-sm ${
                    subscribeMessage.type === 'success'
                      ? 'bg-success-50 text-success-700 border border-success-200'
                      : 'bg-danger-50 text-danger-700 border border-danger-200'
                  }`}>
                    {subscribeMessage.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={subscribeLoading}
                  className="w-full bg-primary-600 text-white py-3 rounded-none font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {subscribeLoading ? 'Mendaftarkan...' : 'Ikuti Toko'}
                </button>
              </form>

              <p className="text-xs text-gray-400 mt-3 text-center">
                Kami menghargai privasi Anda. Bisa unsubscribe kapan saja.
              </p>
            </div>
          </div>
        )}

        {/* Share Modal */}
        {showShareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowShareModal(false)} />
            <div className="relative bg-white rounded-none shadow-xl max-w-sm w-full p-6">
              <button
                onClick={() => setShowShareModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                type="button"
                aria-label="Tutup"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              <h3 className="text-xl font-bold text-gray-900 mb-4">Bagikan ke</h3>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={shareToWhatsApp}
                  className="flex items-center gap-3 p-3 rounded-none border border-gray-100 hover:bg-gray-50 transition-colors"
                  type="button"
                >
                  <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#25D366]" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.472-.148-.67.15-.197.297-.767.966-.94 1.164-.173.198-.347.223-.644.075-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.298-1.045 1.02-1.045 2.488 0 1.469 1.07 2.887 1.219 3.087.149.198 2.095 3.202 5.078 4.487.709.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.72 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.006a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">WhatsApp</span>
                </button>

                <button
                  onClick={shareToFacebook}
                  className="flex items-center gap-3 p-3 rounded-none border border-gray-100 hover:bg-gray-50 transition-colors"
                  type="button"
                >
                  <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#1877F2]" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">Facebook</span>
                </button>

                <button
                  onClick={shareToTwitter}
                  className="flex items-center gap-3 p-3 rounded-none border border-gray-100 hover:bg-gray-50 transition-colors"
                  type="button"
                >
                  <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#000000]" fill="currentColor">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">Twitter / X</span>
                </button>

                <button
                  onClick={shareToTelegram}
                  className="flex items-center gap-3 p-3 rounded-none border border-gray-100 hover:bg-gray-50 transition-colors"
                  type="button"
                >
                  <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#0088cc]" fill="currentColor">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">Telegram</span>
                </button>

                <button
                  onClick={copyLink}
                  className="flex items-center gap-3 p-3 rounded-none border border-gray-100 hover:bg-gray-50 transition-colors"
                  type="button"
                >
                  <svg viewBox="0 0 24 24" className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">Salin Tautan</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
