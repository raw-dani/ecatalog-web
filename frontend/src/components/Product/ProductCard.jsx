import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatCurrency';
import { useSettings } from '../../context/SettingsContext';

export default function ProductCard({ product }) {
  const { showStock } = useSettings();
  const image = product.images && product.images.length > 0 ? product.images[0] : '/placeholder.jpg';
  const finalPrice = product.discount_price ?? product.price;

  return (
    <Link to={`/produk/${product.slug}`} className="group">
      <div className="bg-white rounded-none shadow overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group will-change-transform">
        <div className="aspect-square bg-gray-100 overflow-hidden">
          <img src={image} alt={product.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" />
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 line-clamp-2">{product.name}</h3>
          <div className="mt-1">
            {product.category?.name && (
              <p className="text-sm text-gray-500">{product.category.name}</p>
            )}
            {product.brand && product.brand.logo && (
              <div className="flex items-center gap-1.5 mt-1">
                <img src={product.brand.logo} alt={product.brand.name} className="w-4 h-4 object-contain" />
                <span className="text-xs text-gray-500">{product.brand.name}</span>
              </div>
            )}
          </div>
          <div className="mt-2">
            {product.discount_price && (
              <span className="text-sm text-gray-400 line-through mr-2">
                {formatCurrency(product.price)}
              </span>
            )}
            <span className="text-lg font-bold text-danger-600">{formatCurrency(finalPrice)}</span>
          </div>
           {showStock && product.stock > 0 && (
             <span className="inline-block mt-2 text-xs bg-success-100 text-success-700 px-2 py-1 rounded">
               Stok: {product.stock}
             </span>
           )}
        </div>
      </div>
    </Link>
  );
}
