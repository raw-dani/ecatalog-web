import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../utils/formatCurrency';

export default function ShopProductCard({ product, storeName = 'Toko' }) {
  const { addToCart } = useCart();
  const [adding, setAdding] = useState(false);

  const image = product.images && product.images.length > 0 ? product.images[0] : '/placeholder.jpg';
  const finalPrice = product.discount_price ?? product.price;
  const hasDiscount = !!product.discount_price;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (adding || product.stock === 0) return;
    setAdding(true);
    await addToCart(product.id, 1, '');
    setAdding(false);
  };

  const handleShare = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const url = typeof window !== 'undefined' ? window.location.origin + '/produk/' + product.slug : '';
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, text: `Lihat ${product.name} di ${storeName}`, url });
      } catch {
        // dibatalkan
      }
    } else if (navigator.clipboard && url) {
      try {
        await navigator.clipboard.writeText(url);
        alert('Link produk berhasil disalin.');
      } catch {
        alert('Silakan salin URL halaman ini.');
      }
    }
  };

  const getBadge = () => {
    if (hasDiscount) {
      const discountPercent = Math.round(((product.price - product.discount_price) / product.price) * 100);
      return { text: `-${discountPercent}%`, className: 'discount' };
    }
    if (product.is_featured) {
      return { text: 'TERLARIS', className: '' };
    }
    return null;
  };

  const badge = getBadge();

  return (
    <article className="product-card">
      <div className="product-image">
        <Link to={`/produk/${product.slug}`} onClick={(e) => e.stopPropagation()}>
          <img src={image} alt={product.name} loading="lazy" />
        </Link>

        {badge && (
          <span className={`product-badge ${badge.className}`}>
            {badge.className === 'discount' && (
              <svg className="w-3 h-3 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            )}
            {badge.text}
          </span>
        )}

        <div className="image-actions">
          {/* <button
            className="image-action cart-button"
            onClick={handleAddToCart}
            disabled={adding || product.stock === 0}
            type="button"
            aria-label="Tambah ke keranjang"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
          </button> */}
          <button
            className="image-action"
            onClick={handleShare}
            aria-label="Share"
            type="button"
          >
            ↗
          </button>
        </div>
      </div>

      <div className="product-content">
        <Link to={`/produk/${product.slug}`}>
          <h3 className="product-name">{product.name}</h3>
        </Link>

        <div className="product-info">
          <div>
            <div className="product-price">{formatCurrency(finalPrice)}</div>
            {hasDiscount && (
              <span className="product-old-price">{formatCurrency(product.price)}</span>
            )}
          </div>
        </div>

        <div className="product-footer">
          <button
            className="cart-button"
            onClick={handleAddToCart}
            disabled={adding || product.stock === 0}
            type="button"
            aria-label="Tambah ke keranjang"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
          </button>
          <Link
            to={`/produk/${product.slug}`}
            className="detail-button"
            onClick={(e) => e.stopPropagation()}
          >
            Detail
          </Link>
          {/* <Link
            to={`/produk/${product.slug}`}
            className="buy-button"
            onClick={(e) => e.stopPropagation()}
          >
            Beli Sekarang
          </Link> */}
        </div>
      </div>
    </article>
  );
}
