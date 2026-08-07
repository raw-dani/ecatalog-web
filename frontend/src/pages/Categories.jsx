import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCategories } from '../services/cartService';
import SEO from '../components/SEO/SEO';

function Skeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12 animate-pulse">
      <div className="h-48 bg-gray-200 rounded-none mb-12" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
        {[1,2,3,4,5,6,7,8].map(i => (
          <div key={i} className="bg-white rounded-none p-6">
            <div className="w-16 h-16 bg-gray-200 rounded-none mx-auto mb-4" />
            <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto mb-2" />
            <div className="h-3 bg-gray-200 rounded w-1/3 mx-auto" />
          </div>
        ))}
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

  if (loading) return <Skeleton />;

  return (
    <>
      <SEO
        title="Kategori Produk"
        description="Jelajahi semua kategori produk kami. Temukan produk terbaik dengan kualitas dan harga terjangkau."
      />

      {/* Page Header */}
      <section className="bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900 text-white overflow-hidden relative">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white rounded-none blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-primary-300 rounded-none blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-28 text-center">
          <div className="w-14 h-14 bg-white/10 rounded-none flex items-center justify-center mx-auto mb-5 backdrop-blur-sm">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Kategori Produk</h1>
          <p className="text-primary-100 text-lg max-w-xl mx-auto leading-relaxed">
            Jelajahi semua kategori produk kami. Temukan produk terbaik dengan kualitas dan harga terjangkau.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 -mt-8 relative z-10">
        {categories.length === 0 ? (
          <div className="text-center py-20">
            <div className="mb-6 flex justify-center">
              <div className="w-24 h-24 bg-gray-100 rounded-none flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Belum Ada Kategori</h2>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto">Belum ada kategori produk yang tersedia saat ini. Silakan cek kembali nanti.</p>
            <Link
              to="/produk"
              className="inline-flex items-center gap-2 bg-primary-600 text-white px-8 py-3 rounded-none font-semibold hover:bg-primary-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              Lihat Semua Produk
            </Link>
          </div>
        ) : (
          <>
            {/* Category Stats */}
            <div className="flex items-center justify-between mb-8 bg-white rounded-none shadow-sm border border-gray-100 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-50 rounded-none flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Kategori</p>
                  <p className="font-bold text-gray-900 text-lg">{categories.length} Kategori</p>
                </div>
              </div>
              <div className="hidden sm:block text-sm text-gray-400">
                Klik kategori untuk melihat produk
              </div>
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 mb-12">
              {categories.map(category => {
                const hasImage = category.image && category.image !== 'logo.png';
                return (
                  <Link
                    key={category.id}
                    to={`/kategori/${category.slug}`}
                    className="group bg-white rounded-none shadow-sm border border-gray-100 p-6 text-center hover:shadow-lg hover:border-primary-100 hover:-translate-y-1 transition-all duration-300"
                  >
                    {/* Image or Icon */}
                    <div className={`w-full aspect-video rounded-none flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-105 ${
                      hasImage ? 'overflow-hidden' : 'bg-primary-50 group-hover:bg-primary-100'
                    }`}>
                      {hasImage ? (
                        <img
                          src={category.image}
                          alt={category.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-primary-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                          <line x1="12" y1="22.08" x2="12" y2="12" />
                        </svg>
                      )}
                    </div>

                    {/* Name */}
                    <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors mb-1">
                      {category.name}
                    </h3>

                    {/* Description */}
                    {category.description && (
                      <p className="text-xs text-gray-400 line-clamp-2 mb-2">{category.description}</p>
                    )}

                    {/* Product Count */}
                    {category.products_count !== undefined && category.products_count !== null && (
                      <div className="inline-flex items-center gap-1 text-xs text-gray-400 bg-gray-50 group-hover:bg-primary-50 group-hover:text-primary-500 px-3 py-1 rounded-none transition-colors">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        {category.products_count} {category.products_count === 1 ? 'produk' : 'produk'}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </>
  );
}