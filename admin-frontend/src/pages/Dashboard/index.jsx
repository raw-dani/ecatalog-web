import { useEffect, useState, useCallback, useRef } from 'react';
import { getDashboardStats } from '../../services/adminService';
import { useNavigate } from 'react-router-dom';

const statusConfig = {
  pending: { label: 'Menunggu', color: 'bg-warning-100 text-warning-700' },
  confirmed: { label: 'Dikonfirmasi', color: 'bg-primary-100 text-primary-600' },
  processing: { label: 'Diproses', color: 'bg-primary-100 text-primary-600' },
  shipped: { label: 'Dikirim', color: 'bg-slate-100 text-slate-600' },
  completed: { label: 'Selesai', color: 'bg-success-100 text-success-700' },
  cancelled: { label: 'Dibatalkan', color: 'bg-danger-100 text-danger-700' },
};

function Skeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-slate-200 rounded w-1/4 mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="bg-slate-200 h-24 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-200 h-48 rounded-xl" />
        <div className="bg-slate-200 h-48 rounded-xl" />
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

function getTrendIcon(current, previous) {
  if (previous === 0) return { icon: 'trend-up', color: 'text-success-500' };
  const diff = ((current - previous) / previous) * 100;
  if (diff > 0) return { icon: 'trend-up', color: 'text-success-500' };
  if (diff < 0) return { icon: 'trend-down', color: 'text-danger-500' };
  return { icon: 'trend-horizontal', color: 'text-slate-400' };
}

const TrendIcon = ({ type, colorClass }) => {
  if (type === 'trend-up') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 ${colorClass}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="18 15 12 9 6 15" />
      </svg>
    );
  }
  if (type === 'trend-down') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 ${colorClass}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 ${colorClass}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12h2v2H3z M7 10h2v4H7z M11 8h2v6h-2z M15 6h2v8h-2z" />
    </svg>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const autoRefreshRef = useRef(null);

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

  // Auto-refresh every 60 seconds
  useEffect(() => {
    if (autoRefresh) {
      autoRefreshRef.current = setInterval(() => {
        fetchStats(true);
      }, 60000);
    }
    return () => {
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
    };
  }, [autoRefresh, fetchStats]);

  const handleExportDashboard = () => {
    if (!stats) return;

    const rows = [
      ['Metrik', 'Nilai'],
      ['Total Produk', stats.total_products],
      ['Produk Aktif', stats.active_products],
      ['Total Kategori', stats.total_categories],
      ['Total Pesanan', stats.total_orders],
      ['Pesanan Pending', stats.pending_orders],
      ['Total Pendapatan', formatCurrency(stats.total_revenue)],
      ['Pesanan Hari Ini', stats.today_orders],
      ['Pendapatan Hari Ini', formatCurrency(stats.today_revenue)],
      ['Pesanan Kemarin', stats.yesterday_orders],
      ['Pendapatan Kemarin', formatCurrency(stats.yesterday_revenue)],
      ['Total Rekening Bank', stats.total_bank_accounts],
      ['', ''],
      ['Status Pesanan', 'Jumlah'],
    ];

    if (stats.order_counts) {
      Object.entries(statusConfig).forEach(([status, config]) => {
        const count = stats.order_counts[status + '_orders'] || 0;
        rows.push([config.label, count]);
      });
    }

    const csv = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `dashboard-export-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) return <Skeleton />;

  const mainCards = [
    {
      label: 'Total Produk', value: stats?.total_products,       color: 'bg-primary-50 border border-primary-200 text-slate-900',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-primary-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      )
    },
    {
      label: 'Produk Aktif', value: stats?.active_products,       color: 'bg-success-50 border border-success-200 text-slate-900',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-success-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      )
    },
    {
      label: 'Total Kategori', value: stats?.total_categories,       color: 'bg-warning-50 border border-warning-200 text-slate-900',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-warning-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      )
    },
    {
      label: 'Total Pesanan', value: stats?.total_orders,       color: 'bg-slate-50 border border-slate-200 text-slate-900',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      )
    },
    {
      label: 'Pesanan Pending', value: stats?.pending_orders,       color: 'bg-danger-50 border border-danger-200 text-slate-900',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-danger-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      )
    },
    {
      label: 'Total Pendapatan', value: formatCurrency(stats?.total_revenue),       color: 'bg-primary-50 border border-primary-200 text-slate-900',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-primary-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      )
    },
  ];

  const orderCounts = stats?.order_counts || {};
  const todayTrend = getTrendIcon(stats?.today_orders || 0, stats?.yesterday_orders || 0);
  const revenueTrend = getTrendIcon(stats?.today_revenue || 0, stats?.yesterday_revenue || 0);

  const quickActions = [
    { label: 'Tambah Produk', icon: (<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /><line x1="12" y1="12" x2="12" y2="2" /></svg>), onClick: () => navigate('/products'), color: 'bg-primary-50 hover:bg-primary-100 text-primary-600' },
    { label: 'Lihat Pesanan', icon: (<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>), onClick: () => navigate('/orders'), color: 'bg-slate-50 hover:bg-slate-100 text-slate-600' },
    { label: 'Kelola Kategori', icon: (<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /><path d="M9 12l2 2 4-4" /></svg>), onClick: () => navigate('/categories'), color: 'bg-warning-50 hover:bg-warning-100 text-warning-600' },
    { label: 'Rekening Bank', icon: (<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 21 21 21 21 18 3 18 3 21" /><line x1="3" y1="10" x2="21" y2="10" /><polyline points="5 6 12 2 19 6" /><line x1="4" y1="10" x2="4" y2="18" /><line x1="20" y1="10" x2="20" y2="18" /></svg>), onClick: () => navigate('/bank-accounts'), color: 'bg-success-50 hover:bg-success-100 text-success-600' },
  ];

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="bg-white rounded-xl shadow p-6 mb-6 border border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              Auto Refresh
            </label>
            <button
              onClick={handleExportDashboard}
              className="border border-slate-200 text-slate-700 px-3 py-2 rounded-xl hover:bg-slate-50 text-sm flex items-center gap-1 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export
            </button>
            <button
              onClick={() => fetchStats(true)}
              disabled={refreshing}
              className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-200 disabled:opacity-50 text-sm transition-colors"
            >
              <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {refreshing ? 'Memuat...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-5 rounded-xl shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-70">Pesanan Hari Ini</p>
              <p className="text-3xl font-bold mt-1">{stats?.today_orders || 0}</p>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-50">Kemarin: {stats?.yesterday_orders || 0}</p>
              <div className="flex items-center justify-end gap-1 mt-1">
                <TrendIcon type={todayTrend.icon} colorClass={todayTrend.color} />
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-5 rounded-xl shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-70">Pendapatan Hari Ini</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(stats?.today_revenue)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-50">Kemarin: {formatCurrency(stats?.yesterday_revenue)}</p>
              <div className="flex items-center justify-end gap-1 mt-1">
                <TrendIcon type={revenueTrend.icon} colorClass={revenueTrend.color} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {quickActions.map((action, i) => (
          <button
            key={i}
            onClick={action.onClick}
            className={`${action.color} p-4 rounded-xl text-sm font-medium transition-all flex flex-col items-center gap-2 shadow hover:shadow-lg border border-slate-100`}
          >
            {action.icon}
            {action.label}
          </button>
        ))}
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {mainCards.map((card, index) => (
          <div key={index} className={`${card.color} p-6 rounded-xl shadow border border-slate-100/50 hover:shadow-lg transition-all`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm opacity-70 mb-1">{card.label}</p>
                <p className="text-3xl font-bold mt-1">{card.value}</p>
              </div>
              <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-xl bg-white/50">
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Second Row: Order Breakdown + Top Selling */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Order Status Breakdown */}
        {/* <div className="bg-white p-6 rounded-xl shadow border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Status Pesanan</h2>
          <div className="space-y-4">
            {Object.entries(statusConfig).map(([status, config]) => {
              const count = orderCounts[status + '_orders'] || 0;
              const total = stats?.total_orders || 1;
              const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-700">{config.label}</span>
                    <span className="text-slate-500">{count} ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full ${config.color.split(' ')[0]}`}
                      style={{ width: `${percentage}%`}}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between text-sm">
            <span className="text-slate-500">Total Rekening Bank</span>
            <span className="font-semibold text-slate-800">{stats?.total_bank_accounts || 0}</span>
          </div>
        </div> */}

        {/* Top Selling Products */}
        {/* <div className="bg-white p-6 rounded-xl shadow border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-warning-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2v10" />
              <path d="M12 12l7 5v-2a5 5 0 0 0-10 0v2z" />
            </svg>
            Produk Terlaris
          </h2>
          {stats?.top_selling_products?.length > 0 ? (
            <div className="divide-y">
              {stats.top_selling_products.map((product, index) => (
                <div key={product.id} className="flex items-center gap-3 py-2.5">
                  <span className="text-sm font-bold text-slate-400 w-6">#{index + 1}</span>
                  {product.image ? (
                    <img src={product.image} alt="" className="w-8 h-8 object-cover rounded" />
                  ) : (
                    <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                        <line x1="12" y1="22.08" x2="12" y2="12" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{product.name}</p>
                    <p className="text-xs text-slate-400">{formatCurrency(product.price)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-medium text-primary-600">{product.total_qty} terjual</p>
                    <p className="text-xs text-slate-400">{formatCurrency(product.total_revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-sm py-4 text-center">Belum ada data penjualan</p>
          )}
        </div> */}
      </div>

      {/* Third Row: Low Stock + Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Products */}
        {/* <div className="bg-white p-6 rounded-xl shadow border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
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
                  <span className="text-sm text-slate-600 truncate mr-2">{product.name}</span>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-sm text-slate-500">{formatCurrency(product.price)}</span>
                    <span className={`text-sm font-semibold ${product.stock === 0 ? 'text-danger-600' : 'text-warning-500'}`}>
                      {product.stock === 0 ? 'Habis' : product.stock}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-sm py-4 text-center">Semua produk stok aman</p>
          )}
        </div> */}

        {/* Recent Orders */}
        {/* <div className="bg-white rounded-xl shadow border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">Pesanan Terbaru</h2>
            <button onClick={() => navigate('/orders')} className="text-primary-600 hover:underline text-sm flex items-center gap-1">
              Lihat Semua
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-slate-700">No. Pesanan</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-slate-700">Pelanggan</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-slate-700">Total</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-slate-700">Status</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-slate-700">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {stats?.recent_orders?.length > 0 ? (
                  stats.recent_orders.map(order => (
                    <tr key={order.id} className="hover:bg-slate-50">
                      <td className="px-6 py-3 text-sm font-medium text-slate-800">{order.order_number}</td>
                      <td className="px-6 py-3 text-sm text-slate-600">{order.customer_name}</td>
                      <td className="px-6 py-3 text-sm text-slate-600">{formatCurrency(order.total)}</td>
                      <td className="px-6 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[order.status]?.color || 'bg-slate-100 text-slate-600'}`}>
                          {statusConfig[order.status]?.label || order.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-slate-500">{formatDate(order.created_at)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                      Belum ada pesanan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div> */}
      </div>
    </div>
  );
}