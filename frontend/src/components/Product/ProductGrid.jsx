import ProductCard from './ProductCard';

export default function ProductGrid({ products, loading, viewMode = 'grid' }) {
  if (loading) {
    return (
      <div className={viewMode === 'grid' 
        ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'
        : 'flex flex-col gap-4'
      }>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-none shadow overflow-hidden">
            <div className={viewMode === 'grid' ? 'aspect-square bg-gray-200 animate-pulse' : 'h-32 bg-gray-200 animate-pulse'} />
            <div className="p-4 space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
              <div className="h-5 bg-gray-200 rounded animate-pulse w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return <p className="text-center text-gray-500 py-8">Tidak ada produk ditemukan.</p>;
  }

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-none shadow overflow-hidden divide-y">
        {products.map(product => (
          <div key={product.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition">
            <div className="w-24 h-24 flex-shrink-0 bg-gray-200 rounded overflow-hidden">
              {product.images && product.images.length > 0 ? (
                <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
               <h3 className="font-semibold text-gray-900 hover:text-primary-600 truncate">{product.name}</h3>
              <p className="text-sm text-gray-500">{product.category?.name}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="mb-1">
                {product.discount_price && (
                  <span className="text-sm text-gray-400 line-through mr-2">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(product.price)}
                  </span>
                )}
                 <span className="text-lg font-bold text-danger-600">
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(product.discount_price ?? product.price)}
                </span>
              </div>
              {product.stock > 0 ? (
                <span className="text-xs bg-success-100 text-success-700 px-2 py-1 rounded">Stok: {product.stock}</span>
              ) : (
                <span className="text-xs bg-danger-100 text-danger-700 px-2 py-1 rounded">Habis</span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}