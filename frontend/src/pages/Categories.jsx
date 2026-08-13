import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCategories } from '../services/cartService';
import SEO from '../components/SEO/SEO';

function CategoriesSkeleton() {
  return (
    <div className="shop-theme animate-pulse min-h-screen">
      <div className="shop-container pt-6">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-100 overflow-hidden">
              <div className="aspect-video bg-gray-200" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
                <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCategories()
      .then(data => setCategories(data.data || data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <CategoriesSkeleton />;

  return (
    <div className="shop-theme flex flex-col pb-20">
      <SEO
        title="Kategori Produk"
        description="Jelajahi semua kategori produk kami. Temukan produk terbaik dengan kualitas dan harga terjangkau."
      />

      <nav className="shop-container pt-6" style={{ paddingBottom: 0 }}>
        <div className="flex items-center gap-2 text-sm mb-6">
          <Link to="/" className="text-gray-500 hover:text-primary-600 transition-colors">Beranda</Link>
          <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span className="text-gray-900 font-medium">Kategori</span>
        </div>
      </nav>

      <section className="shop-container">
        <div className="section-header">
          <div>
            <h2 className="section-title">Kategori Produk</h2>
            <div className="section-subtitle">Jelajahi semua kategori produk kami</div>
          </div>
        </div>

        {categories.length === 0 ? (
          <div className="text-center py-12">
            <div className="mb-4 flex justify-center">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Belum Ada Kategori</h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">Belum ada kategori produk yang tersedia saat ini.</p>
            <Link
              to="/produk"
              className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span className="hidden sm:inline">Lihat Semua Produk</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {categories.map(category => {
              const hasImage = category.image && category.image !== 'logo.png';
              return (
                <Link
                  key={category.id}
                  to={`/kategori/${category.slug}`}
                  className="group bg-white border border-gray-100 rounded-lg overflow-hidden hover:shadow-md hover:border-gray-200 transition-all duration-200"
                >
                  <div className={`aspect-video flex items-center justify-center transition-all duration-200 ${
                    hasImage ? 'overflow-hidden bg-gray-100' : 'bg-gray-50 group-hover:bg-gray-100'
                  }`}>
                    {hasImage ? (
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-gray-400 group-hover:text-gray-500 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                        <line x1="12" y1="22.08" x2="12" y2="12" />
                      </svg>
                    )}
                  </div>

                  <div className="p-4 text-center">
                    <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors mb-1 text-sm md:text-base">
                      {category.name}
                    </h3>

                    {category.description && (
                      <p className="text-xs text-gray-500 line-clamp-2 mb-2">{category.description}</p>
                    )}

                    {category.products_count !== undefined && category.products_count !== null && (
                      <div className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 group-hover:bg-primary-50 group-hover:text-primary-600 px-2.5 py-1 rounded-md transition-colors">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        {category.products_count} {category.products_count === 1 ? 'produk' : 'produk'}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
