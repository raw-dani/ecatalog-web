import { useEffect, useState, useCallback } from 'react';
import { getOrders, getOrder, updateOrderStatus } from '../../services/adminService';

const statusConfig = {
  pending: { label: 'Menunggu', color: 'bg-warning-100 text-warning-800' },
  confirmed: { label: 'Dikonfirmasi', color: 'bg-primary-100 text-primary-800' },
  processing: { label: 'Diproses', color: 'bg-indigo-100 text-indigo-800' },
  shipped: { label: 'Dikirim', color: 'bg-purple-100 text-purple-800' },
  completed: { label: 'Selesai', color: 'bg-success-100 text-success-800' },
  cancelled: { label: 'Dibatalkan', color: 'bg-danger-100 text-danger-800' },
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
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6" />
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 space-y-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="flex gap-4">
              <div className="h-6 bg-gray-200 rounded w-1/6" />
              <div className="h-6 bg-gray-200 rounded w-1/6" />
              <div className="h-6 bg-gray-200 rounded w-1/6" />
              <div className="h-6 bg-gray-200 rounded w-24" />
              <div className="h-6 bg-gray-200 rounded w-32" />
              <div className="h-6 bg-gray-200 rounded w-16" />
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
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, total: 0 });
  const [updatingStatus, setUpdatingStatus] = useState(null);

  const fetchOrders = useCallback(async (page = 1) => {
    const params = { page };
    if (search) params.search = search;
    if (filterStatus) params.status = filterStatus;

    const data = await getOrders(params);
    setOrders(data.data || []);
    setPagination({
      currentPage: data.meta?.current_page || data.current_page || 1,
      lastPage: data.meta?.last_page || data.last_page || 1,
      total: data.meta?.total || data.total || 0,
    });
  }, [search, filterStatus]);

  useEffect(() => {
    fetchOrders(1).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading) fetchOrders(1);
  }, [search, filterStatus]);

  const handleStatusChange = async (id, newStatus) => {
    const order = orders.find(o => o.id === id);
    const currentLabel = statusConfig[order?.status]?.label || order?.status;
    const newLabel = statusConfig[newStatus]?.label || newStatus;

    if (!window.confirm(`Ubah status pesanan ${order?.order_number} dari "${currentLabel}" menjadi "${newLabel}"?`)) {
      return;
    }

    setUpdatingStatus(id);
    try {
      await updateOrderStatus(id, newStatus);
      setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
      if (selectedOrder?.id === id) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err) {
      alert('Gagal mengubah status: ' + (err.response?.data?.message || err.message));
    } finally {
      setUpdatingStatus(null);
    }
  };

  const openDetail = async (order) => {
    setDetailLoading(true);
    try {
      const data = await getOrder(order.id);
      setSelectedOrder(data.data || data);
    } catch (err) {
      alert('Gagal memuat detail pesanan');
    } finally {
      setDetailLoading(false);
    }
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
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Cari Pesanan</label>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="No. pesanan, nama, atau no. telepon..."
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full border rounded px-3 py-2">
              <option value="">Semua Status</option>
              {Object.entries(statusConfig).map(([value, config]) => (
                <option key={value} value={value}>{config.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold">No. Pesanan</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Tanggal</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Pelanggan</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Total</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Status</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Belum ada pesanan
                  </td>
                </tr>
              ) : (
                orders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 font-medium">{order.order_number}</td>
                    <td className="px-4 py-4 text-sm text-gray-500">{formatDate(order.created_at)}</td>
                    <td className="px-4 py-4">
                      <div>
                        <span className="font-medium">{order.customer_name}</span>
                        <br />
                        <span className="text-sm text-gray-500">{order.customer_phone}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm font-medium">{formatCurrency(order.total)}</td>
                    <td className="px-4 py-4">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
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
            <span className="text-sm text-gray-600">Total {pagination.total} pesanan</span>
            <div className="flex gap-2">
              <button
                onClick={() => fetchOrders(pagination.currentPage - 1)}
                disabled={pagination.currentPage <= 1}
                className="px-3 py-1 border rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sebelumnya
              </button>
              <span className="px-3 py-1 text-sm">{pagination.currentPage} / {pagination.lastPage}</span>
              <button
                onClick={() => fetchOrders(pagination.currentPage + 1)}
                disabled={pagination.currentPage >= pagination.lastPage}
                className="px-3 py-1 border rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Detail Pesanan {selectedOrder.order_number}</h2>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>

            {detailLoading ? (
              <div className="text-center py-8">
                <div className="animate-pulse space-y-4 max-w-md mx-auto">
                  <div className="h-6 bg-gray-200 rounded" />
                  <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto" />
                  <div className="h-32 bg-gray-200 rounded" />
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Customer Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3 text-sm text-gray-500 uppercase tracking-wide">Informasi Pelanggan</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">Nama:</span>
                      <p className="font-semibold">{selectedOrder.customer_name}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Telepon:</span>
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
                        <span className="text-gray-500">Email:</span>
                        <p className="font-semibold">{selectedOrder.customer_email}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500">Tanggal:</span>
                      <p className="font-semibold">{formatDate(selectedOrder.created_at)}</p>
                    </div>
                  </div>
                  {selectedOrder.shipping_address && (
                    <div className="mt-3">
                      <span className="text-gray-500 text-sm">Alamat:</span>
                      <p className="font-semibold text-sm mt-1">{selectedOrder.shipping_address}</p>
                    </div>
                  )}
                  {selectedOrder.notes && (
                    <div className="mt-3">
                      <span className="text-gray-500 text-sm">Catatan:</span>
                      <p className="text-sm mt-1 italic">"{selectedOrder.notes}"</p>
                    </div>
                  )}
                </div>

                {/* Order Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3 text-sm text-gray-500 uppercase tracking-wide">Informasi Pesanan</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <p className={`mt-1 inline-block px-2 py-1 rounded-full text-xs font-medium ${statusConfig[selectedOrder.status]?.color || ''}`}>
                        {statusConfig[selectedOrder.status]?.label || selectedOrder.status}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Sumber:</span>
                      <p className="font-semibold mt-1 capitalize">{selectedOrder.source || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Pembayaran:</span>
                      <p className="font-semibold mt-1 capitalize">{selectedOrder.payment_method || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Ongkir:</span>
                      <p className="font-semibold mt-1">{formatCurrency(selectedOrder.shipping_cost)}</p>
                    </div>
                  </div>
                  {selectedOrder.payment_proof && (
                    <div className="mt-3">
                      <span className="text-gray-500 text-sm">Bukti Pembayaran:</span>
                       <a href={selectedOrder.payment_proof} target="_blank" rel="noopener noreferrer" className="block mt-1 text-primary-600 hover:underline text-sm">
                        Lihat Bukti Pembayaran
                      </a>
                    </div>
                  )}
                </div>

                {/* Order Items */}
                <div>
                  <h3 className="font-semibold mb-3 text-sm text-gray-500 uppercase tracking-wide">Item Pesanan</h3>
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-2 text-sm">Produk</th>
                        <th className="text-center px-4 py-2 text-sm">Qty</th>
                        <th className="text-right px-4 py-2 text-sm">Harga</th>
                        <th className="text-right px-4 py-2 text-sm">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
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
                    <span className="text-gray-500">Subtotal</span>
                    <span>{formatCurrency(selectedOrder.subtotal)}</span>
                  </div>
                  {Number(selectedOrder.discount) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Diskon</span>
                      <span className="text-success-600">-{formatCurrency(selectedOrder.discount)}</span>
                    </div>
                  )}
                  {Number(selectedOrder.shipping_cost) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Ongkos Kirim</span>
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