import { getSettings } from './cartService';

export const getWaNumber = async () => {
  const settings = await getSettings();
  return settings.store_whatsapp;
};

export const getStoreName = async () => {
  const settings = await getSettings();
  return settings.store_name;
};

export const generateProductInquiryMessage = (productName, price, url) => {
  const safePrice = typeof price === 'number' ? price : (parseFloat(price) || 0);
  return `Halo Admin *${productName}*, saya ingin menanyakan produk:\n\n📦 *${productName}*\n💵 Harga: Rp ${safePrice.toLocaleString('id-ID')}\n🔗 Link: ${url}\n\nApakah masih tersedia?`;
};

export const generateOrderMessage = (items, total, customerData) => {
  let message = 'Halo Admin, saya ingin memesan:\n\n';
  message += '📋 *DAFTAR PESANAN:*\n';
  items.forEach(item => {
    const name = item.product_name || item.name || 'Produk';
    const subtotal = typeof item.subtotal === 'number' ? item.subtotal : (parseFloat(item.subtotal) || 0);
    message += `- ${name} x ${item.quantity} = Rp ${subtotal.toLocaleString('id-ID')}\n`;
  });
  const safeTotal = typeof total === 'number' ? total : (parseFloat(total) || 0);
  message += `\n💰 *Total: Rp ${safeTotal.toLocaleString('id-ID')}*\n`;
  message += '\n📝 *Data Pemesan:*\n';
  message += `Nama: ${customerData?.customer_name || customerData?.name || '-'}\n`;
  message += `Telp: ${customerData?.customer_phone || customerData?.phone || '-'}\n`;
  if (customerData?.customer_email || customerData?.email) message += `Email: ${customerData.customer_email || customerData.email}\n`;
  if (customerData?.shipping_address || customerData?.address) message += `Alamat: ${customerData.shipping_address || customerData.address}\n`;
  if (customerData?.notes) message += `Catatan: ${customerData.notes}\n`;
  message += '\nMohon konfirmasi ketersediaan dan total pembayaran. Terima kasih!';
  return message;
};

export const generateWaLink = (message, waNumber) => {
  return `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
};
