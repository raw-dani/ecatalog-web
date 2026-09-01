import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProduct, getRelatedProducts, getSettings } from '../services/cartService';
import { formatCurrency } from '../utils/formatCurrency';
import WhatsAppButton from '../components/WhatsApp/WhatsAppButton';
import ShopProductCard from '../components/Product/ShopProductCard';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import SEO from '../components/SEO/SEO';

function ImageGallery({ images, productName, hasDiscount }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [imgError, setImgError] = useState(false);

  if (!images || images.length === 0 || imgError) {
    return (
      <div className="aspect-square bg-gray-100 rounded-none flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-20 h-20 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      </div>
    );
  }

  const selectedImage = images[selectedIndex];

  return (
    <div className="space-y-4 sticky top-24">
      <div className="aspect-square bg-gray-100 rounded-none overflow-hidden relative">
        <img
          src={selectedImage}
          alt={productName}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
        {hasDiscount && (
        <div className="absolute top-4 left-4 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-lg flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          DISKON
        </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {images.map((img, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={`w-20 h-20 flex-shrink-0 rounded-none overflow-hidden border-2 transition-all duration-200 ${
                selectedIndex === index
                  ? 'border-primary-600 ring-2 ring-primary-200 opacity-100'
                  : 'border-gray-200 opacity-60 hover:opacity-100 hover:border-gray-300'
              }`}
            >
              <img src={img} alt={`${productName} ${index + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="shop-theme animate-pulse min-h-screen">
      <div className="shop-container pt-6">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="aspect-square bg-gray-200 rounded-none" />
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-6 bg-gray-200 rounded w-1/3" />
            <div className="h-24 bg-gray-200 rounded-none" />
            <div className="h-14 bg-gray-200 rounded-none" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductDetail() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const { addToCart } = useCart();
  const { showStock } = useSettings();
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    getSettings().then(setSettings).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getProduct(slug)
      .then(setProduct)
      .catch(err => {
        console.error('Failed to load product', err);
        setError(err);
      })
      .finally(() => setLoading(false));

    getRelatedProducts(slug)
      .then(setRelatedProducts)
      .catch(err => {
        console.error('Failed to load related products', err);
        setRelatedProducts([]);
      });
  }, [slug]);

  const handleAddToCart = async () => {
    if (!product || product.stock === 0) return;
    const success = await addToCart(product.id, qty, '');
    if (success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };

  const storeName = settings?.store_name || 'Toko Online';

  if (loading) return <Skeleton />;
  if (error) return (
    <div className="shop-theme flex flex-col items-center justify-center py-20">
      <div className="w-20 h-20 bg-danger-50 rounded-none flex items-center justify-center mb-4">
        <svg className="w-10 h-10 text-danger-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Gagal Memuat Produk</h2>
      <p className="text-gray-500 mb-6">{error.message}</p>
      <Link to="/produk" className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-none font-semibold hover:bg-primary-700 transition-all">
        Kembali ke Produk
      </Link>
    </div>
  );
  if (!product) return (
    <div className="shop-theme flex flex-col items-center justify-center py-20">
      <div className="w-20 h-20 bg-gray-100 rounded-none flex items-center justify-center mb-4">
        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Produk Tidak Ditemukan</h2>
      <p className="text-gray-500 mb-6">Produk yang Anda cari tidak tersedia atau telah dihapus.</p>
      <Link to="/produk" className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-none font-semibold hover:bg-primary-700 transition-all">
        Lihat Produk Lain
      </Link>
    </div>
  );

  const finalPrice = product.discount_price ?? product.price;
  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock < 5;

  const seoTitle = product.meta_title || product.name;
  const seoDescription = product.meta_description || product.description?.slice(0, 160) || '';
  const seoImage = product.images && product.images.length > 0 ? product.images[0] : '';

  return (
    <div className="shop-theme flex flex-col pb-20">
      <SEO
        title={seoTitle}
        description={seoDescription}
        image={seoImage}
        type="product"
        product={{
          price: finalPrice,
          currency: 'IDR',
          availability: isOutOfStock ? 'out of stock' : 'in stock',
          condition: 'new',
          sku: product.sku,
        }}
      />

      <nav className="shop-container pt-6" style={{ paddingBottom: 0 }}>
        <div className="flex items-center gap-2 text-sm">
          <Link to="/" className="text-gray-500 hover:text-primary-600 transition-colors">Beranda</Link>
          <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <Link to="/produk" className="text-gray-500 hover:text-primary-600 transition-colors">Produk</Link>
          {product.category && (
            <>
              <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <polyline points="9 18 15 12 9 6" />
              </svg>
              <Link to={`/kategori/${product.category.slug}`} className="text-gray-500 hover:text-primary-600 transition-colors">
                {product.category.name}
              </Link>
            </>
          )}
          <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span className="text-gray-900 font-medium truncate max-w-[200px]">{product.name}</span>
        </div>
      </nav>

      <section className="shop-container">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          <div>
            <ImageGallery images={product.images} productName={product.name} hasDiscount={!!product.discount_price} />
          </div>

          <div className="flex flex-col">
            {product.category && (
              <Link
                to={`/kategori/${product.category.slug}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 bg-primary-50 px-3 py-1.5 rounded-none w-fit mb-4 hover:bg-primary-100 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                {product.category.name}
              </Link>
            )}
            {product.brand && product.brand.logo && (
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 bg-gray-50 px-3 py-1.5 rounded-none w-fit mb-4 ml-0 md:ml-2">
                <img src={product.brand.logo} alt={product.brand.name} className="w-5 h-5 object-contain rounded" />
                {product.brand.name}
              </div>
            )}

            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 leading-tight">{product.name}</h1>

            <div className="flex items-center gap-4 mb-5 text-sm text-gray-400">
              {product.sku && (
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  SKU: {product.sku}
                </span>
              )}
              {/* {product.unit && (
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                  {product.unit}
                </span>
              )} */}
            </div>

            <div className="bg-gray-50 rounded-none p-5 mb-6">
              <div className="flex items-baseline gap-3">
                {product.discount_price && (
                  <span className="text-lg text-gray-400 line-through">{formatCurrency(product.price)}</span>
                )}
                <span className="text-4xl font-bold text-gray-900">{formatCurrency(finalPrice)}</span>
              </div>
              {product.discount_price && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs font-semibold text-danger-600 bg-danger-50 px-2 py-0.5 rounded-none">
                    Hemat {formatCurrency(product.price - product.discount_price)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-6">
               {showStock && isOutOfStock ? (
                 <span className="inline-flex items-center gap-1.5 text-sm font-semibold bg-danger-100 text-danger-700 px-4 py-2 rounded-none">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <circle cx="12" cy="12" r="10" />
                     <line x1="15" y1="9" x2="9" y2="15" />
                     <line x1="9" y1="9" x2="15" y2="15" />
                   </svg>
                   Stok Habis
                 </span>
               ) : showStock && isLowStock ? (
                 <span className="inline-flex items-center gap-1.5 text-sm font-semibold bg-warning-100 text-warning-800 px-4 py-2 rounded-none">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                     <line x1="12" y1="9" x2="12" y2="13" />
                     <line x1="12" y1="17" x2="12.01" y2="17" />
                   </svg>
                   Stok Menipis: {product.stock} {product.unit}
                 </span>
               ) : showStock ? (
                 <span className="inline-flex items-center gap-1.5 text-sm font-semibold bg-success-100 text-success-800 px-4 py-2 rounded-none">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                     <polyline points="22 4 12 14.01 9 11.01" />
                   </svg>
                   Stok: {product.stock} {product.unit}
                 </span>
               ) : null}
              <span className="text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-none">
                Min. Order: {product.min_order} {product.unit}
              </span>
            </div>

            {product.description && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Deskripsi Produk
                </h3>
                <div className="bg-white border border-gray-100 rounded-lg p-4 md:p-6">
                  <p className="text-gray-700 whitespace-pre-line leading-relaxed text-sm md:text-base">{product.description}</p>
                </div>
              </div>
            )}

            {product.specifications && Array.isArray(product.specifications) && product.specifications.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Spesifikasi Produk
                </h3>
                <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
                  {product.specifications.map((spec, index) => (
                    <div key={index} className={`flex items-center py-3 md:py-4 px-4 md:px-6 ${index > 0 ? 'border-t border-gray-100' : ''}`}>
                      <span className="text-xs md:text-sm text-gray-500 w-1/3">{spec.key}</span>
                      <span className="text-xs md:text-sm font-medium text-gray-900 w-2/3">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex-1" />

            <div className="bg-white border border-gray-200 rounded-none p-5 space-y-4 sticky bottom-0 md:static">
              <div className="flex items-center justify-between">
                <label className="font-medium text-gray-900">Jumlah</label>
                <div className="flex items-center bg-gray-100 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setQty(Math.max(product.min_order || 1, qty - 1))}
                    className="px-4 py-2.5 text-gray-600 hover:bg-gray-200 hover:text-primary-600 transition-colors text-lg font-medium disabled:opacity-50 rounded-l-lg"
                    disabled={isOutOfStock || qty <= (product.min_order || 1)}
                  >
                    −
                  </button>
                  <span className="px-6 py-2.5 text-sm font-bold text-gray-900 bg-white min-w-[60px] text-center">
                    {qty}
                  </span>
                  <button
                    onClick={() => setQty(Math.min(product.stock, qty + 1))}
                    className="px-4 py-2.5 text-gray-600 hover:bg-gray-200 hover:text-primary-600 transition-colors text-lg font-medium disabled:opacity-50 rounded-r-lg"
                    disabled={isOutOfStock || qty >= product.stock}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-lg font-semibold transition-all duration-200 ${
                    isOutOfStock
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : added
                        ? 'bg-success-500 text-white shadow-md'
                        : 'bg-primary-600 text-white hover:bg-primary-700 shadow-md hover:shadow-lg'
                  }`}
                >
                  {added ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="hidden md:inline">Ditambahkan!</span>
                    </>
                  ) : isOutOfStock ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                      </svg>
                      <span className="hidden md:inline">Stok Habis</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="9" cy="21" r="1" />
                        <circle cx="20" cy="21" r="1" />
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                      </svg>
                      <span className="hidden md:inline">Tambah ke Keranjang</span>
                    </>
                  )}
                </button>
                <WhatsAppButton product={product} className="flex-1 text-white" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {relatedProducts.length > 0 && (
        <section className="shop-container mt-12">
          <div className="section-header">
            <div>
              <h2 className="section-title">Produk Serupa</h2>
              <div className="section-subtitle">Rekomendasi produk lain yang mungkin Anda sukai</div>
            </div>
            {product.category && (
              <Link
                to={`/kategori/${product.category.slug}`}
                className="text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
              >
                Lihat Semua
              </Link>
            )}
          </div>

          <section className="product-grid" role="tabpanel">
            {relatedProducts.map(related => (
              <ShopProductCard
                key={related.id}
                product={related}
                storeName={storeName}
              />
            ))}
          </section>
        </section>
      )}
    </div>
  );
}
