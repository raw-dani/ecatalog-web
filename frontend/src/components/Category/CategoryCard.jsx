import { Link } from 'react-router-dom';

export default function CategoryCard({ category }) {
  const hasImage = category.image && category.image !== 'logo.png';

  return (
    <Link to={`/kategori/${category.slug}`} className="group">
      <div className="bg-white rounded-lg shadow p-6 text-center hover:shadow-lg transition h-full flex flex-col items-center">
        {/* Image or Icon */}
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden ${hasImage ? '' : 'bg-primary-100 group-hover:bg-primary-200'} transition`}>
          {hasImage ? (
            <img
              src={category.image}
              alt={category.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-primary-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          )}
        </div>

        {/* Name */}
        <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
          {category.name}
        </h3>

        {/* Description */}
        {category.description && (
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{category.description}</p>
        )}

        {/* Product Count */}
        {category.products_count !== undefined && category.products_count !== null && (
          <p className="text-xs text-gray-400 mt-2">
            {category.products_count} {category.products_count === 1 ? 'produk' : 'produk'}
          </p>
        )}
      </div>
    </Link>
  );
}