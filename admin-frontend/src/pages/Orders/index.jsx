import { useEffect, useState, useCallback } from 'react';
import { getOrders, getOrder, updateOrderStatus, exportOrdersCsv } from '../../services/adminService';
import { useToast } from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';

const statusConfig = {
      pending: { label: 'Menunggu', color: 'bg-warning-100 text-warning-700' },
      confirmed: { label: 'Dikonfirmasi', color: 'bg-primary-100 text-primary-600' },
      processing: { label: 'Diproses', color: 'bg-primary-100 text-primary-600' },
      shipped: { label: 'Dikirim', color: 'bg-slate-100 text-slate-700' },
      completed: { label: 'Selesai', color: 'bg-success-100 text-success-700' },
      cancelled: { label: 'Dibatalkan', color: 'bg-danger-100 text-danger-700' },
};

const statusTransitions = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['completed'],
  completed: [],
  cancelled: [],
};

function Skeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-8">
        <div className="h-8 bg-slate-200 rounded w-1/4 mb-6" />
      </div>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="p-4 space-y-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="flex gap-4">
              <div className="h-6 bg-slate-200 rounded w-1/6" />
              <div className="h-6 bg-slate-200 rounded w-1/6" />
              <div className="h-6 bg-slate-200 rounded w-1/6" />
              <div className="h-6 bg-slate-200 rounded w-24" />
              <div className="h-6 bg-slate-200 rounded w-32" />
              <div className="h-6 bg-slate-200 rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatCurrency(val) {
  return `Rp ${Number(val || 0).toLocaleString('id-ID')}`;
}

export default function Orders() {
  const { addToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPayment, setFilterPayment] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, total: 0 });
  const [perPage, setPerPage] = useState(20);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  // Sorting
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');

  // Status change confirm modal
  const [statusConfirm, setStatusConfirm] = useState({ open: false, id: null, newStatus: '' });

  const fetchOrders = useCallback(async (page = 1) => {
    const params = { page, per_page: perPage, sort_field: sortField, sort_direction: sortDirection };
    if (search) params.search = search;
    if (filterStatus) params.status = filterStatus;
    if (filterPayment) params.payment_method = filterPayment;
    if (filterDateFrom) params.date_from = filterDateFrom;
    if (filterDateTo) params.date_to = filterDateTo;

    const data = await getOrders(params);
    setOrders(data.data || []);
    setPagination({
      currentPage: data.meta?.current_page || data.current_page || 1,
      lastPage: data.meta?.last_page || data.last_page || 1,
      total: data.meta?.total || data.total || 0,
    });
  }, [search, filterStatus, filterPayment, filterDateFrom, filterDateTo, perPage, sortField, sortDirection]);

  useEffect(() => {
    fetchOrders(1).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading) fetchOrders(1);
  }, [search, filterStatus, filterPayment, filterDateFrom, filterDateTo, perPage, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 10l5 5 5-5" />
        </svg>
      );
    }
    if (sortDirection === 'asc') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 19V5M5 12l7 7 7-7" />
        </svg>
      );
    }
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14M5 12l7 7 7-7" />
      </svg>
    );
  };

  const handleStatusChange = async () => {
    const { id, newStatus } = statusConfirm;
    setUpdatingStatus(id);
    try {
      await updateOrderStatus(id, newStatus);
      setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
      if (selectedOrder?.id === id) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
      }
      addToast('Status berhasil diubah', 'success');
    } catch (err) {
      addToast('Gagal mengubah status: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setUpdatingStatus(null);
      setStatusConfirm({ open: false, id: null, newStatus: '' });
    }
  };

  const openDetail = async (order) => {
    setDetailLoading(true);
    try {
      const data = await getOrder(order.id);
      setSelectedOrder(data.data || data);
    } catch (err) {
      addToast('Gagal memuat detail pesanan', 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterPayment) params.payment_method = filterPayment;
      if (filterDateFrom) params.date_from = filterDateFrom;
      if (filterDateTo) params.date_to = filterDateTo;

      const response = await exportOrdersCsv(params);
      const blob = new Blob([response], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `orders-export-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      addToast('Data pesanan berhasil diexport', 'success');
    } catch (err) {
      addToast('Gagal export: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  const copyOrderNumber = (orderNumber) => {
    navigator.clipboard.writeText(orderNumber).then(() => {
      addToast('No. pesanan berhasil disalin', 'success');
    }).catch(() => {
      addToast('Gagal menyalin', 'error');
    });
  };

  const getPaymentMethodLabel = (method) => {
    if (!method) return '-';
    const labels = {
      transfer: 'Transfer',
      cod: 'COD',
      qris: 'QRIS',
      gerai: 'Gerai',
    };
    return labels[method] || method;
  };

  if (loading) return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Manajemen Pesanan</h1>
      <Skeleton />
    </div>
  );

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Manajemen Pesanan</h1>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-xl shadow mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Cari Pesanan</label>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="No. pesanan, nama, atau no. telepon..."
              className="w-full border rounded-xl px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full border rounded-xl px-3 py-2">
              <option value="">Semua Status</option>
              {Object.entries(statusConfig).map(([value, config]) => (
                <option key={value} value={value}>{config.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Pembayaran</label>
            <select value={filterPayment} onChange={e => setFilterPayment(e.target.value)} className="w-full border rounded-xl px-3 py-2">
              <option value="">Semua</option>
              <option value="transfer">Transfer</option>
              <option value="cod">COD</option>
              <option value="qris">QRIS</option>
              <option value="gerai">Gerai</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Dari Tanggal</label>
            <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
              className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Sampai Tanggal</label>
            <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
              className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tampilkan</label>
            <select value={perPage} onChange={e => setPerPage(Number(e.target.value))} className="w-full border rounded-xl px-3 py-2">
              <option value={10}>10 per halaman</option>
              <option value={20}>20 per halaman</option>
              <option value={50}>50 per halaman</option>
              <option value={100}>100 per halaman</option>
            </select>
          </div>
        </div>
      </div>

      {/* Export Button */}
      <div className="flex justify-end mb-4">
        <button onClick={handleExportCsv} className="border border-slate-300 text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-50 text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1 inline-block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold cursor-pointer hover:text-primary-600 select-none"
                    onClick={() => handleSort('order_number')}>
                  No. Pesanan <span className="text-slate-400 text-xs">{getSortIcon('order_number')}</span>
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold cursor-pointer hover:text-primary-600 select-none"
                    onClick={() => handleSort('created_at')}>
                  Tanggal <span className="text-slate-400 text-xs">{getSortIcon('created_at')}</span>
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold cursor-pointer hover:text-primary-600 select-none"
                    onClick={() => handleSort('customer_name')}>
                  Pelanggan <span className="text-slate-400 text-xs">{getSortIcon('customer_name')}</span>
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Pembayaran</th>
                <th className="text-left px-4 py-3 text-sm font-semibold cursor-pointer hover:text-primary-600 select-none"
                    onClick={() => handleSort('total')}>
                  Total <span className="text-slate-400 text-xs">{getSortIcon('total')}</span>
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold cursor-pointer hover:text-primary-600 select-none"
                    onClick={() => handleSort('status')}>
                  Status <span className="text-slate-400 text-xs">{getSortIcon('status')}</span>
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    Belum ada pesanan
                  </td>
                </tr>
              ) : (
                orders.map(order => (
                  <tr key={order.id} className={`hover:bg-slate-50 ${order.status === 'pending' ? 'bg-warning-50' : ''}`}>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{order.order_number}</span>
                        <button
                          onClick={() => copyOrderNumber(order.order_number)}
                          className="text-slate-400 hover:text-slate-600 text-xs flex items-center justify-center w-5 h-5"
                          title="Salin No. Pesanan"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 4h1a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1" />
                            <rect x="8" y="2" width="8" height="4" rx="1" />
                          </svg>
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-500">{formatDate(order.created_at)}</td>
                    <td className="px-4 py-4">
                      <div>
                        <span className="font-medium">{order.customer_name}</span>
                        <br />
                        <span className="text-sm text-slate-500">{order.customer_phone}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <span className="px-2 py-1 rounded text-xs bg-slate-100 text-slate-700">
                        {getPaymentMethodLabel(order.payment_method)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm font-medium">{formatCurrency(order.total)}</td>
                    <td className="px-4 py-4">
                      <select
                        value={order.status}
                        onChange={(e) => {
                          const newStatus = e.target.value;
                          if (newStatus !== order.status) {
                            setStatusConfirm({ open: true, id: order.id, newStatus });
                          }
                        }}
                        disabled={updatingStatus === order.id}
                        className={`border rounded px-2 py-1 text-sm font-medium ${statusConfig[order.status]?.color || ''}`}
                      >
                        {Object.entries(statusConfig).map(([value, config]) => (
                          <option key={value} value={value} disabled={!statusTransitions[order.status]?.includes(value) && value !== order.status}>
                            {config.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-4">
                       <button onClick={() => openDetail(order)} className="text-primary-600 hover:underline text-sm">
                        Detail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.lastPage > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <span className="text-sm text-slate-600">
              Total {pagination.total} pesanan (Halaman {pagination.currentPage} dari {pagination.lastPage})
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => fetchOrders(pagination.currentPage - 1)}
                disabled={pagination.currentPage <= 1}
                className="px-3 py-1 border rounded text-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sebelumnya
              </button>
              <span className="px-3 py-1 text-sm">{pagination.currentPage} / {pagination.lastPage}</span>
              <button
                onClick={() => fetchOrders(pagination.currentPage + 1)}
                disabled={pagination.currentPage >= pagination.lastPage}
                className="px-3 py-1 border rounded text-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Status Change Confirmation Modal */}
      <ConfirmModal
        open={statusConfirm.open}
        title="Ubah Status Pesanan"
        message={`Apakah Anda yakin ingin mengubah status pesanan menjadi "${statusConfig[statusConfirm.newStatus]?.label || statusConfirm.newStatus}"?`}
        confirmText="Ubah Status"
        onConfirm={handleStatusChange}
        onCancel={() => setStatusConfirm({ open: false, id: null, newStatus: '' })}
        loading={updatingStatus === statusConfirm.id}
        danger={statusConfirm.newStatus === 'cancelled'}
      />

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Detail Pesanan {selectedOrder.order_number}</h2>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-500 hover:text-slate-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {detailLoading ? (
              <div className="text-center py-8">
                <div className="animate-pulse space-y-4 max-w-md mx-auto">
                  <div className="h-6 bg-slate-200 rounded" />
                  <div className="h-6 bg-slate-200 rounded w-3/4 mx-auto" />
                  <div className="h-32 bg-slate-200 rounded" />
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Customer Info */}
                <div className="bg-slate-50 p-4 rounded-xl">
                  <h3 className="font-semibold mb-3 text-sm text-slate-500 uppercase tracking-wide">Informasi Pelanggan</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-slate-500">Nama:</span>
                      <p className="font-semibold">{selectedOrder.customer_name}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Telepon:</span>
                      <p className="font-semibold">
                        {selectedOrder.customer_phone}
                        {selectedOrder.customer_phone && (
                          <a
                            href={`https://wa.me/${selectedOrder.customer_phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 text-success-600 hover:text-success-700 text-xs"
                            title="Chat via WhatsApp"
                          >
                            (Chat WA)
                          </a>
                        )}
                      </p>
                    </div>
                    {selectedOrder.customer_email && (
                      <div>
                        <span className="text-slate-500">Email:</span>
                        <p className="font-semibold">{selectedOrder.customer_email}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-slate-500">Tanggal:</span>
                      <p className="font-semibold">{formatDate(selectedOrder.created_at)}</p>
                    </div>
                  </div>
                  {selectedOrder.shipping_address && (
                    <div className="mt-3">
                      <span className="text-slate-500 text-sm">Alamat:</span>
                      <p className="font-semibold text-sm mt-1">{selectedOrder.shipping_address}</p>
                    </div>
                  )}
                  {selectedOrder.notes && (
                    <div className="mt-3">
                      <span className="text-slate-500 text-sm">Catatan:</span>
                      <p className="text-sm mt-1 italic">"{selectedOrder.notes}"</p>
                    </div>
                  )}
                </div>

                {/* Order Info */}
                <div className="bg-slate-50 p-4 rounded-xl">
                  <h3 className="font-semibold mb-3 text-sm text-slate-500 uppercase tracking-wide">Informasi Pesanan</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-slate-500">Status:</span>
                      <p className={`mt-1 inline-block px-2 py-1 rounded-full text-xs font-medium ${statusConfig[selectedOrder.status]?.color || ''}`}>
                        {statusConfig[selectedOrder.status]?.label || selectedOrder.status}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Sumber:</span>
                      <p className="font-semibold mt-1 capitalize">{selectedOrder.source || '-'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Pembayaran:</span>
                      <p className="font-semibold mt-1 capitalize">{selectedOrder.payment_method || '-'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Ongkir:</span>
                      <p className="font-semibold mt-1">{formatCurrency(selectedOrder.shipping_cost)}</p>
                    </div>
                  </div>
                  {selectedOrder.payment_proof && (
                    <div className="mt-3">
                      <span className="text-slate-500 text-sm">Bukti Pembayaran:</span>
                       <a href={selectedOrder.payment_proof} target="_blank" rel="noopener noreferrer" className="block mt-1 text-primary-600 hover:underline text-sm">
                        Lihat Bukti Pembayaran
                      </a>
                    </div>
                  )}
                </div>

                {/* Order Items */}
                <div>
                  <h3 className="font-semibold mb-3 text-sm text-slate-500 uppercase tracking-wide">Item Pesanan</h3>
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left px-4 py-2 text-sm">Produk</th>
                        <th className="text-center px-4 py-2 text-sm">Qty</th>
                        <th className="text-right px-4 py-2 text-sm">Harga</th>
                        <th className="text-right px-4 py-2 text-sm">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {selectedOrder.items?.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-sm">{item.product_name}</td>
                          <td className="text-center px-4 py-3 text-sm">{item.quantity}</td>
                          <td className="text-right px-4 py-3 text-sm">{formatCurrency(item.unit_price)}</td>
                          <td className="text-right px-4 py-3 text-sm font-medium">{formatCurrency(item.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Total Summary */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Subtotal</span>
                    <span>{formatCurrency(selectedOrder.subtotal)}</span>
                  </div>
                  {Number(selectedOrder.discount) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Diskon</span>
                      <span className="text-success-600">-{formatCurrency(selectedOrder.discount)}</span>
                    </div>
                  )}
                  {Number(selectedOrder.shipping_cost) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Ongkos Kirim</span>
                      <span>{formatCurrency(selectedOrder.shipping_cost)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Total</span>
                    <span>{formatCurrency(selectedOrder.total)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
