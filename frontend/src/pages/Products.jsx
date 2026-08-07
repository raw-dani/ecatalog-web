import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { getProducts, getCategoryProducts, getCategory } from '../services/cartService';
import ProductGrid from '../components/Product/ProductGrid';
import ProductFilter from '../components/Product/ProductFilter';
import SEO from '../components/SEO/SEO';

function HeaderSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-48 bg-gray-200 rounded-none mb-8" />
      <div className="h-10 bg-gray-200 rounded w-1/4 mb-4" />
      <div className="h-6 bg-gray-200 rounded w-1/2 mb-8" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
        {[1,2,3,4,5,6,7,8].map(i => (
          <div key={i} className="bg-gray-200 rounded-none h-64" />
        ))}
      </div>
    </div>
  );
}

export default function Products() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  useEffect(() => {
    setLoading(true);
    setError('');

    if (slug) {
      getCategoryProducts(slug)
        .then(data => {
          setProducts(data.data || data);
          return getCategory(slug);
        })
        .then(data => setCategory(data))
        .catch(err => {
          setError('Gagal memuat produk. Silakan coba lagi nanti.');
          console.error('Products page error:', err);
        })
        .finally(() => setLoading(false));
    } else {
      const params = {};
      if (searchQuery) params.search = searchQuery;
      getProducts(params)
        .then(data => {
          setProducts(data.data || data);
          setCategory({
            name: searchQuery ? `Hasil Pencarian: "${searchQuery}"` : 'Semua Produk',
            description: searchQuery ? `Menampilkan hasil pencarian untuk "${searchQuery}"` : 'Jelajahi seluruh koleksi produk kami',
          });
        })
        .catch(err => {
          setError('Gagal memuat produk. Silakan coba lagi nanti.');
          console.error('Products page error:', err);
        })
        .finally(() => setLoading(false));
    }
  }, [slug, searchQuery]);

  const handleFilterChange = (params) => {
    if (slug) {
      getCategoryProducts(slug, params).then(data => setProducts(data.data || data));
    } else {
      const mergedParams = { ...params };
      if (searchQuery) mergedParams.search = searchQuery;
      getProducts(mergedParams).then(data => setProducts(data.data || data));
    }
  };

  return (
    <>
      <SEO
        title={category?.name || (searchQuery ? `Hasil Pencarian: "${searchQuery}"` : 'Produk')}
        description={category?.description ? category.description.slice(0, 160) : (searchQuery ? `Menampilkan hasil pencarian untuk "${searchQuery}"` : 'Koleksi produk kami. Temukan produk terbaik dengan harga terjangkau.')}
      />

      {/* Page Header */}
      <section className="bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900 text-white overflow-hidden relative">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white rounded-none blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-primary-300 rounded-none blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-20">
          <div className="text-center max-w-3xl mx-auto">
            <div className="w-12 h-12 bg-white/10 rounded-none flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              {slug ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              ) : searchQuery ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              )}
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-3 text-white">{category?.name || 'Produk'}</h1>
            {category?.description && (
              <p className="text-primary-100 text-lg max-w-lg mx-auto leading-relaxed">{category.description}</p>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 -mt-6 relative z-10 pb-16">
        

        {/* Controls Bar */}
        <div className="bg-white rounded-none shadow-sm border border-gray-100 px-5 py-4 mb-6">
          {/* Breadcrumb */}
        <nav className="bg-white rounded-none shadow-sm border border-gray-100 px-5 py-3 mb-6 flex items-center gap-2 text-sm">
          <Link to="/" className="text-gray-500 hover:text-primary-600 transition-colors">Beranda</Link>
          <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          {!slug && !searchQuery ? (
            <span className="text-primary-600 font-medium">Produk</span>
          ) : (
            <>
              <Link to="/produk" className="text-gray-500 hover:text-primary-600 transition-colors">Produk</Link>
              <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <polyline points="9 18 15 12 9 6" />
              </svg>
              <span className="text-primary-600 font-medium truncate max-w-[200px]">{category?.name}</span>
            </>
          )}
        </nav>

        {error && (
          <div className="bg-danger-100 text-danger-700 p-4 rounded-none mb-6 text-center border border-danger-200">
            {error}
          </div>
        )}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary-50 rounded-none flex items-center justify-center">
                <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{products.length} {products.length === 1 ? 'Produk' : 'Produk'} ditemukan</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="flex items-center bg-gray-100 rounded-none p-0.5">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-none transition-all duration-200 ${viewMode === 'grid' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  title="Grid View"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-none transition-all duration-200 ${viewMode === 'list' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  title="List View"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {!loading && (
          <>
            <ProductFilter onFilterChange={handleFilterChange} />
            <ProductGrid products={products} loading={loading} viewMode={viewMode} />
          </>
        )}

        {/* Loading State (after header loaded) */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="bg-white rounded-none shadow-sm border border-gray-100 overflow-hidden animate-pulse">
                <div className="aspect-square bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}