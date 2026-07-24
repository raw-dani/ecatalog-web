import { useEffect, useState, useCallback } from 'react';
import { getDashboardStats } from '../../services/adminService';

const statusConfig = {
  pending: { label: 'Menunggu', color: 'bg-warning-100 text-warning-800' },
  confirmed: { label: 'Dikonfirmasi', color: 'bg-primary-100 text-primary-800' },
  processing: { label: 'Diproses', color: 'bg-indigo-100 text-indigo-800' },
  shipped: { label: 'Dikirim', color: 'bg-purple-100 text-purple-800' },
  completed: { label: 'Selesai', color: 'bg-success-100 text-success-800' },
  cancelled: { label: 'Dibatalkan', color: 'bg-danger-100 text-danger-800' },
};

function Skeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/4 mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="bg-gray-200 h-24 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-200 h-48 rounded-lg" />
        <div className="bg-gray-200 h-48 rounded-lg" />
      </div>
    </div>
  );
}

function formatCurrency(val) {
  return `Rp ${Number(val || 0).toLocaleString('id-ID')}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) return <Skeleton />;

  const mainCards = [
    {
      label: 'Total Produk', value: stats?.total_products, color: 'bg-primary-500',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      )
    },
    {
      label: 'Produk Aktif', value: stats?.active_products, color: 'bg-success-500',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      )
    },
    {
      label: 'Total Kategori', value: stats?.total_categories, color: 'bg-warning-500',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      )
    },
    {
      label: 'Total Pesanan', value: stats?.total_orders, color: 'bg-purple-500',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      )
    },
    {
      label: 'Pesanan Pending', value: stats?.pending_orders, color: 'bg-danger-500',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      )
    },
    {
      label: 'Total Pendapatan', value: formatCurrency(stats?.total_revenue), color: 'bg-indigo-500',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      )
    },
  ];

  const orderCounts = stats?.order_counts || {};

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <button
          onClick={() => fetchStats(true)}
          disabled={refreshing}
          className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 text-sm"
        >
          <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {refreshing ? 'Memuat...' : 'Refresh'}
        </button>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {mainCards.map((card, index) => (
          <div key={index} className={`${card.color} text-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm opacity-80">{card.label}</p>
                <p className="text-3xl font-bold mt-2">{card.value}</p>
              </div>
              <span className="text-2xl opacity-50">{card.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Second Row: Order Breakdown + Bank Accounts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Order Status Breakdown */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Status Pesanan</h2>
          <div className="space-y-3">
            {Object.entries(statusConfig).map(([status, config]) => {
              const count = orderCounts[status + '_orders'] || 0;
              const total = stats?.total_orders || 1;
              const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{config.label}</span>
                    <span>{count} ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${config.color.split(' ')[0]}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t flex justify-between text-sm">
            <span className="text-gray-500">Total Rekening Bank</span>
            <span className="font-semibold">{stats?.total_bank_accounts || 0}</span>
          </div>
        </div>

        {/* Low Stock Products */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-warning-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Stok Menipis
            {stats?.low_stock_products?.length > 0 && (
              <span className="text-xs bg-danger-100 text-danger-700 px-2 py-0.5 rounded-full">
                {stats.low_stock_products.length}
              </span>
            )}
          </h2>
          {stats?.low_stock_products?.length > 0 ? (
            <div className="divide-y">
              {stats.low_stock_products.map(product => (
                <div key={product.id} className="flex items-center justify-between py-2">
                  <span className="text-sm truncate mr-2">{product.name}</span>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-sm text-gray-500">{formatCurrency(product.price)}</span>
                    <span className={`text-sm font-bold ${product.stock === 0 ? 'text-danger-600' : 'text-warning-500'}`}>
                      {product.stock === 0 ? 'Habis' : product.stock}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm py-4 text-center">Semua produk stok aman</p>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">Pesanan Terbaru</h2>
          <a href="/admin/orders" className="text-primary-600 hover:underline text-sm">Lihat Semua →</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-semibold">No. Pesanan</th>
                <th className="text-left px-6 py-3 text-sm font-semibold">Pelanggan</th>
                <th className="text-left px-6 py-3 text-sm font-semibold">Total</th>
                <th className="text-left px-6 py-3 text-sm font-semibold">Status</th>
                <th className="text-left px-6 py-3 text-sm font-semibold">Tanggal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stats?.recent_orders?.length > 0 ? (
                stats.recent_orders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm font-medium">{order.order_number}</td>
                    <td className="px-6 py-3 text-sm">{order.customer_name}</td>
                    <td className="px-6 py-3 text-sm">{formatCurrency(order.total)}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[order.status]?.color || ''}`}>
                        {statusConfig[order.status]?.label || order.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-500">{formatDate(order.created_at)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    Belum ada pesanan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}