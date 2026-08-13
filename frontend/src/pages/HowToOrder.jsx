import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSettings } from '../services/cartService';
import SEO from '../components/SEO/SEO';

const defaultSteps = [
  {
    title: 'Pilih Produk', desc: 'Telusuri katalog dan pilih produk yang Anda inginkan.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    )
  },
  {
    title: 'Tambah ke Keranjang', desc: 'Klik tombol "Tambah ke Keranjang" pada produk pilihan.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
    )
  },
  {
    title: 'Checkout via WhatsApp', desc: 'Buka keranjang dan klik "Checkout via WhatsApp".',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    )
  },
  {
    title: 'Konfirmasi Pesanan', desc: 'Tim kami akan merespon dan mengkonfirmasi pesanan Anda.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    )
  },
  {
    title: 'Pembayaran', desc: 'Lakukan pembayaran sesuai nomor rekening yang diberikan.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    )
  },
  {
    title: 'Pesanan Dikirim', desc: 'Pesanan akan diproses dan dikirim ke alamat Anda.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    )
  },
];

function Skeleton() {
  return (
    <div className="shop-theme animate-pulse min-h-screen">
      <div className="shop-container pt-6">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-6" />
        <div className="space-y-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-4 items-start">
              <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-5 bg-gray-200 rounded w-1/3" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HowToOrder() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch(err => {
        setError('Gagal memuat data. Silakan coba lagi nanti.');
        console.error('HowToOrder error:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;

  return (
    <div className="shop-theme flex flex-col pb-20">
      <SEO
        title="Cara Pemesanan"
        description="Panduan lengkap cara pemesanan di toko kami. Mudah, cepat, dan aman."
        settings={settings}
      />

      <nav className="shop-container pt-6" style={{ paddingBottom: 0 }}>
        <div className="flex items-center gap-2 text-sm mb-6">
          <Link to="/" className="text-gray-500 hover:text-primary-600 transition-colors">Beranda</Link>
          <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span className="text-gray-900 font-medium">Cara Pemesanan</span>
        </div>
      </nav>

      <section className="shop-container">
        <div className="section-header">
          <div>
            <h2 className="section-title">Cara Pemesanan</h2>
            <div className="section-subtitle">Panduan lengkap cara pemesanan di toko kami</div>
          </div>
        </div>

        {error && (
          <div className="bg-danger-100 text-danger-700 p-4 rounded-lg mb-6 text-center border border-danger-200">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {defaultSteps.map((step, index) => (
            <div key={index} className="bg-white border border-gray-100 rounded-lg p-5 hover:shadow-md hover:border-gray-200 transition-all duration-200 flex items-start gap-4">
              <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center text-primary-600 flex-shrink-0">
                {step.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-2.5 py-1 rounded-md">
                    Langkah {index + 1}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-0.5 text-sm md:text-base">{step.title}</h3>
                <p className="text-xs md:text-sm text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {settings?.order_whatsapp_message && (
          <div className="mt-8 bg-white border border-gray-100 rounded-lg p-5 md:p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-primary-50 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm md:text-base">Template Pesanan WhatsApp</h3>
                <p className="text-xs text-gray-400">Pesan otomatis yang akan dikirim saat checkout</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 italic leading-relaxed">"{settings.order_whatsapp_message}"</p>
            </div>
          </div>
        )}

        <div className="mt-8 bg-white border border-gray-100 rounded-lg p-6 md:p-8 text-center">
          <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">Siap untuk Berbelanja?</h3>
          <p className="text-sm text-gray-500 mb-5 max-w-lg mx-auto">Mulai jelajahi produk-produk kami dan temukan yang Anda butuhkan.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/produk"
              className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span className="hidden sm:inline text-white">Lihat Produk</span>
            </Link>
            {settings?.store_whatsapp && (
              <a
                href={`https://wa.me/${settings.store_whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-success-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-success-600 transition-colors"
              >
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span className="hidden sm:inline text-white">Hubungi Kami</span>
              </a>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
