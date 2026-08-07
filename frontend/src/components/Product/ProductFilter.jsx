import { useState } from 'react';

export default function ProductFilter({ onFilterChange }) {
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

  return (
    <form onSubmit={handleSubmit} className="bg-gradient-to-br from-white to-gray-50 rounded-none shadow border border-gray-100 p-5 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-end">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
            </svg>
            Urutkan
          </label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="w-full border border-gray-200 rounded-none px-3.5 py-2.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200"
          >
            <option value="">Pilih pengurutan</option>
            <option value="price_asc">Harga: Rendah ke Tinggi</option>
            <option value="price_desc">Harga: Tinggi ke Rendah</option>
            <option value="name">Nama A-Z</option>
            <option value="newest">Terbaru</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Harga Min</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rp</span>
            <input
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-full border border-gray-200 rounded-xl pl-10 pr-3 py-2.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 placeholder:text-gray-400"
              placeholder="0"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Harga Max</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rp</span>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full border border-gray-200 rounded-xl pl-10 pr-3 py-2.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 placeholder:text-gray-400"
              placeholder="Tidak terbatas"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-5 py-2.5 rounded-none font-semibold hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h18M3 16h18M3 20h18" />
            </svg>
            <span>Filter</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-2.5 border border-gray-200 text-gray-600 rounded-none hover:bg-gray-100 transition-all duration-200 flex items-center justify-center"
            title="Reset filter"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M18.36 6.34A8 8 0 0012 4C8.13 4 4.82 6.69 3.5 10.5c0 .08.01.16.03.24A5.5 5.5 0 1012 19a5.45 5.45 0 004.78-2.83 1 1 0 00-.16-.14l-2.5-2.5a1 1 0 00-1.2.2l-.7.7a1 1 0 00.52 1.45 3.5 3.5 0 01-1.44 2.9 3.5 3.5 0 01-4.3-2.85 5.5 5.5 0 019.3-3.16 1 1 0 001.1-1.63z" />
            </svg>
          </button>
        </div>
      </div>
    </form>
  );
}
