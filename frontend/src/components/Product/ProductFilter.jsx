import { useState } from 'react';

export default function ProductFilter({ onFilterChange }) {
  const [sort, setSort] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onFilterChange({ sort, min_price: minPrice, max_price: maxPrice });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Urutkan</label>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="w-full border rounded px-3 py-2">
            <option value="">Pilih</option>
            <option value="price_asc">Harga: Rendah ke Tinggi</option>
            <option value="price_desc">Harga: Tinggi ke Rendah</option>
            <option value="name">Nama A-Z</option>
            <option value="newest">Terbaru</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Harga Minimum</label>
          <input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="Min" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Harga Maksimum</label>
          <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="Max" />
        </div>
        <div className="flex items-end">
          <button type="submit" className="w-full bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700">
            Filter
          </button>
        </div>
      </div>
    </form>
  );
}
