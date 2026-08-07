import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSettings, getFeaturedProducts, getCategories } from '../services/cartService';
import ProductCard from '../components/Product/ProductCard';
import SEO from '../components/SEO/SEO';

function HomeSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900 py-32">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="w-20 h-20 bg-white/10 rounded-none mx-auto mb-6" />
          <div className="h-12 bg-white/20 rounded w-1/2 mx-auto mb-4" />
          <div className="h-6 bg-white/10 rounded w-2/3 mx-auto mb-8" />
          <div className="h-12 bg-white/20 rounded w-48 mx-auto" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-3" />
        <div className="h-5 bg-gray-200 rounded w-1/3 mb-8" />
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 rounded-none w-28" />
          ))}
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-3" />
        <div className="h-5 bg-gray-200 rounded w-1/3 mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-none h-80" />
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
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getSettings(), getFeaturedProducts(), getCategories()])
      .then(([settingsData, featuredData, categoriesData]) => {
        setSettings(settingsData);
        setFeatured(featuredData);
        setCategories(categoriesData);
      })
      .catch(err => {
        setSettingsError('Gagal memuat data beranda.');
        console.error('Home page error:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <HomeSkeleton />;

  const filteredCategories = categories.filter(c => c.products_count > 0).slice(0, 12);
  const colCount = Math.min(filteredCategories.length, 5);

  return (
    <>
      <SEO
        title={settings?.store_name || 'Beranda'}
        description={settings?.store_description || `Selamat datang di ${settings?.store_name || 'toko kami'}. Temukan produk terbaik dengan harga terjangkau.`}
        settings={settings}
      />

      <div>
        {settingsError && (
          <div className="bg-danger-100 text-danger-700 p-4 text-center">
            {settingsError}
          </div>
        )}

        {/* Hero Section */}
        <section className={`relative overflow-hidden ${settings?.store_hero_background ? 'text-white' : 'bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900 text-white'}`}>
          {/* Background Image with Gradient Overlay */}
          {settings?.store_hero_background && (
            <div className="absolute inset-0">
              <img
                src={settings.store_hero_background}
                alt="Hero Background"
                className="w-full h-full object-cover"
                width={1200}
                height={500}
                loading="eager"
                fetchPriority="high"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-primary-900/85 via-primary-800/80 to-primary-900/85" />
            </div>
          )}

          {/* Animated background elements (only show if no custom background) */}
          {!settings?.store_hero_background && (
            <div className="absolute inset-0">
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-white rounded-none blur-3xl opacity-10" />
              <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-primary-300 rounded-none blur-3xl opacity-10" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-500 rounded-none blur-[120px] opacity-20" />
            </div>
          )}
          
          <div className="relative max-w-7xl mx-auto px-4 py-28 md:py-36">
            <div className="text-center max-w-3xl mx-auto">
              {/* Animated decorative elements */}
              <div className="flex items-center justify-center gap-3 mb-8">
                <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary-400" />
                <div className="w-3 h-3 bg-primary-400 rounded-none" />
                <div className="h-px w-12 bg-gradient-to-l from-transparent to-primary-400" />
              </div>

              {/* {settings?.store_logo && (
                <img
                  src={settings.store_logo}
                  alt={settings.store_name}
                  className="h-24 mx-auto mb-8 object-contain drop-shadow-2xl"
                  width={96}
                  height={96}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                />
              )} */}
              
              <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tight text-white">
                {settings?.store_name || 'Selamat Datang'}
              </h1>
              
              <p className="text-lg md:text-xl text-primary-100 mb-12 leading-relaxed max-w-2xl mx-auto">
                {settings?.store_description || 'Temukan produk terbaik dengan harga terjangkau'}
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/produk"
                  className="group inline-flex items-center gap-3 bg-white text-primary-700 px-10 py-4 rounded-none font-bold text-lg hover:bg-primary-50 hover:shadow-2xl hover:shadow-white/30 transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  Jelajahi Produk
                </Link>
                
                {settings?.store_whatsapp && (
                  <a
                    href={`https://wa.me/${settings.store_whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-3 bg-success-500 text-white px-10 py-4 rounded-none font-bold text-lg hover:bg-success-600 hover:shadow-2xl hover:shadow-success-500/40 transition-all duration-300 transform hover:-translate-y-0.5"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    Hubungi Kami
                  </a>
                )}
              </div>

            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="max-w-7xl mx-auto px-4 py-20" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 600px' }}>
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 px-4 py-1.5 rounded-none text-sm font-medium mb-4">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
              </svg>
              Kategori
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Kategori Produk</h2>
            <p className="text-gray-500 max-w-lg mx-auto">Telusuri produk berdasarkan kategori yang tersedia</p>
          </div>

          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}>
            {filteredCategories.map((category) => (
                <Link
                  key={category.id}
                  to={`/kategori/${category.slug}`}
                  className="group flex flex-col overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300"
                >
                <div className="aspect-[4/3] w-full overflow-hidden bg-gray-100">
                  {category.image ? (
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                      width={256}
                      height={192}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                      <svg className="w-10 h-10 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-gray-900 text-sm font-bold mb-1 group-hover:text-primary-600 transition-colors line-clamp-1">{category.name}</h3>
                  {category.products_count !== undefined && (
                    <p className="text-gray-500 text-xs">
                      {category.products_count} {category.products_count === 1 ? 'produk' : 'produk'}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {filteredCategories.length > 12 && (
            <div className="mt-12 text-center">
              <Link to="/kategori" className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors group">
                Lihat Semua Kategori
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            </div>
          )}
        </section>

        {/* Featured Products Section */}
        {featured.length > 0 && (
          <section className="bg-gradient-to-b from-gray-50 to-white relative overflow-hidden" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 700px' }}>
            {/* Decorative element */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-100 rounded-none blur-3xl opacity-30" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-100 rounded-none blur-3xl opacity-30" />
            
            <div className="relative max-w-7xl mx-auto px-4 py-20">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div>
                  <div className="inline-flex items-center gap-2 bg-accent-50 text-accent-700 px-4 py-1.5 rounded-none text-sm font-medium mb-4">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    Pilihan Terbaik
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Produk Unggulan</h2>
                  <p className="text-gray-500 max-w-lg">Koleksi produk terbaik yang telah kami pilih khusus untuk Anda</p>
                </div>
                <Link
                  to="/produk"
                  className="group inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-none font-semibold hover:bg-primary-700 transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 flex-shrink-0"
                >
                  Lihat Semua
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {featured.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA Section (always shown) */}
        <section className="max-w-7xl mx-auto px-4 py-20" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 350px' }}>
          <div className="relative overflow-hidden rounded-none bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900">
            <div className="absolute inset-0">
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-white rounded-none blur-3xl opacity-10" />
              <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-primary-400 rounded-none blur-3xl opacity-10" />
            </div>
            <div className="relative px-8 py-16 md:py-20 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Siap Berbelanja?</h2>
              <p className="text-primary-100 text-lg mb-8 max-w-md mx-auto">
                Dapatkan produk berkualitas dengan harga terbaik. Mulai belanja sekarang!
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/produk"
                  className="group inline-flex items-center gap-2 bg-white text-primary-700 px-8 py-3.5 rounded-none font-bold hover:bg-primary-50 hover:shadow-2xl hover:shadow-white/30 transition-all duration-300 shadow-lg"
                >
                  <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  Mulai Belanja
                </Link>
                {settings?.store_whatsapp && (
                  <a
                    href={`https://wa.me/${settings.store_whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-2 bg-success-500 text-white px-8 py-3.5 rounded-none font-bold hover:bg-success-600 hover:shadow-2xl hover:shadow-success-500/40 transition-all duration-300 shadow-lg"
                  >
                    <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                    </svg>
                    Hubungi via WhatsApp
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}