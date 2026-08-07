import { useState } from 'react';
import { getOrder } from '../services/cartService';
import SEO from '../components/SEO/SEO';

export default function OrderTracking() {
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setOrder(null);

    try {
      const order = await getOrder(orderNumber);
      if (order.customer_phone !== phone) {
        setError('Nomor telepon tidak cocok dengan data pesanan.');
        setLoading(false);
        return;
      }
      setOrder(order);
    } catch (err) {
      setError('Pesanan tidak ditemukan. Periksa kembali nomor dan telepon.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setOrder(null);
    setOrderNumber('');
    setPhone('');
    setError('');
  };

  return (
    <>
      <SEO
        title="Lacak Pesanan"
        description="Lacak status pesanan Anda dengan nomor pesanan dan nomor telepon."
        noindex={true}
      />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8 text-center">Lacak Pesanan</h1>

        {!order ? (
          <form onSubmit={handleSubmit} className="max-w-md mx-auto bg-white p-6 rounded-none shadow">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nomor Pesanan</label>
                <input
                  type="text"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Contoh: ORD-1234567890"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nomor Telepon</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Nomor telepon saat checkout"
                  required
                />
              </div>
              {error && (
                <div className="bg-danger-100 text-danger-700 p-3 rounded text-sm">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-600 text-white py-2 rounded-none font-semibold hover:bg-primary-700 disabled:bg-gray-300"
              >
                {loading ? 'Mencari...' : 'Lacak Pesanan'}
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-white p-6 rounded-none shadow">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold">Pesanan {order.order_number}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <span className="px-3 py-1 rounded-none text-sm font-medium bg-warning-100 text-warning-800 capitalize">
                {order.status}
              </span>
            </div>

              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Nama Pelanggan</span>
                  <span className="font-medium">{order.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Telepon</span>
                  <span className="font-medium">{order.customer_phone}</span>
                </div>
                {order.customer_email && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email</span>
                    <span className="font-medium">{order.customer_email}</span>
                  </div>
                )}
                {order.shipping_address && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Alamat Pengiriman</span>
                    <span className="font-medium text-right max-w-md">{order.shipping_address}</span>
                  </div>
                )}
                {order.source && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sumber</span>
                    <span className="font-medium capitalize">{order.source}</span>
                  </div>
                )}
              <div className="flex justify-between">
                <span className="text-gray-600">Metode Pembayaran</span>
                <span className="font-medium capitalize">{order.payment_method || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">Rp {Number(order.subtotal).toLocaleString('id-ID')}</span>
              </div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Diskon</span>
                  <span className="font-medium text-success-600">-Rp {Number(order.discount).toLocaleString('id-ID')}</span>
                </div>
              )}
              {Number(order.shipping_cost) > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Ongkos Kirim</span>
                  <span className="font-medium">Rp {Number(order.shipping_cost).toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t pt-3">
                <span>Total</span>
                <span>Rp {Number(order.total).toLocaleString('id-ID')}</span>
              </div>
            </div>

            {order.items?.length > 0 && (
              <div className="border-t pt-4 mt-6">
                <h3 className="font-semibold text-lg mb-3">Detail Produk</h3>
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <div>
                        <span className="font-medium">{item.product_name}</span>
                        <span className="text-gray-500"> x{item.quantity}</span>
                        {item.notes && <span className="text-gray-400 italic"> ({item.notes})</span>}
                      </div>
                      <span className="font-medium">Rp {Number(item.subtotal).toLocaleString('id-ID')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {order.notes && (
              <div className="mt-4 p-3 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Catatan:</span> {order.notes}
                </p>
              </div>
            )}

            {order.payment_proof && (
              <div className="mt-4">
                <a href={order.payment_proof} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline text-sm">
                  Lihat Bukti Pembayaran
                </a>
              </div>
            )}

            <div className="border-t pt-4 mt-6">
              <button
                type="button"
                onClick={handleReset}
                className="w-full border border-gray-300 py-2 rounded-none hover:bg-gray-50"
              >
                Lacak Pesanan Lain
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}