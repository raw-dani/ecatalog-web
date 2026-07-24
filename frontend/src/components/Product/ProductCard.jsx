import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatCurrency';

export default function ProductCard({ product }) {
  const image = product.images && product.images.length > 0 ? product.images[0] : '/placeholder.jpg';
  const finalPrice = product.discount_price ?? product.price;

  return (
    <Link to={`/produk/${product.slug}`} className="group">
      <div className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition">
        <div className="aspect-square bg-gray-200 overflow-hidden">
          <img src={image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
        </div>
        <div className="p-4">
           <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 line-clamp-2">{product.name}</h3>
          <p className="text-sm text-gray-500 mt-1">{product.category?.name}</p>
          <div className="mt-2">
            {product.discount_price && (
              <span className="text-sm text-gray-400 line-through mr-2">
                {formatCurrency(product.price)}
              </span>
            )}
             <span className="text-lg font-bold text-danger-600">{formatCurrency(finalPrice)}</span>
          </div>
          {product.stock > 0 && (
             <span className="inline-block mt-2 text-xs bg-success-100 text-success-800 px-2 py-1 rounded">
              Stok: {product.stock}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
