import { useState } from 'react';

export default function ProductFilter({ onFilterChange, className = '' }) {
  const [sort, setSort] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onFilterChange({ sort, min_price: minPrice, max_price: maxPrice });
  };

  const handleReset = () => {
    setSort('');
    setMinPrice('');
    setMaxPrice('');
    onFilterChange({ sort: '', min_price: '', max_price: '' });
  };

  const baseClasses = "bg-white border border-gray-100 rounded-lg p-4 mb-6";
  const formClassName = className ? `${baseClasses} ${className}` : baseClasses;

  return (
    <form onSubmit={handleSubmit} className={formClassName}>
      <div className="flex flex-col gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Urutkan</label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          >
            <option value="">Pilih pengurutan</option>
            <option value="price_asc">Harga: Rendah ke Tinggi</option>
            <option value="price_desc">Harga: Tinggi ke Rendah</option>
            <option value="name">Nama A-Z</option>
            <option value="newest">Terbaru</option>
          </select>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Harga Min</label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">Rp</span>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full border border-gray-200 rounded-lg pl-8 pr-2 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                placeholder="0"
              />
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Harga Max</label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">Rp</span>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full border border-gray-200 rounded-lg pl-8 pr-2 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                placeholder="Max"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors"
          >
            Filter
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 px-3 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-100 transition-colors"
            title="Reset filter"
          >
            Reset
          </button>
        </div>
      </div>
    </form>
  );
}
