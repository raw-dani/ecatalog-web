import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { getSettings } from '../services/cartService';

const defaultSteps = [
  {
    title: 'Pilih Produk', desc: 'Telusuri katalog dan pilih produk yang Anda inginkan.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    )
  },
  {
    title: 'Tambah ke Keranjang', desc: 'Klik tombol "Tambah ke Keranjang" pada produk pilihan.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
    )
  },
  {
    title: 'Checkout via WhatsApp', desc: 'Buka keranjang dan klik "Checkout via WhatsApp".',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    )
  },
  {
    title: 'Konfirmasi Pesanan', desc: 'Tim kami akan merespon dan mengkonfirmasi pesanan Anda.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    )
  },
  {
    title: 'Pembayaran', desc: 'Lakukan pembayaran sesuai nomor rekening yang diberikan.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    )
  },
  {
    title: 'Pesanan Dikirim', desc: 'Pesanan akan diproses dan dikirim ke alamat Anda.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    )
  },
];

function Skeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 animate-pulse">
      <div className="h-48 bg-gray-200 rounded-2xl mb-12" />
      <div className="space-y-8">
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="flex gap-6">
            <div className="w-14 h-14 bg-gray-200 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-3 pt-2">
              <div className="h-5 bg-gray-200 rounded w-1/4" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
            </div>
          </div>
        ))}
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
    <>
      <Helmet>
        <title>Cara Pemesanan</title>
        <meta name="description" content="Panduan lengkap cara pemesanan di toko kami. Mudah, cepat, dan aman." />
      </Helmet>

      {/* Page Header */}
      <section className="bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900 text-white overflow-hidden relative">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-primary-300 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 py-20 md:py-28 text-center">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-5 backdrop-blur-sm">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Cara Pemesanan</h1>
          <p className="text-primary-100 text-lg max-w-xl mx-auto leading-relaxed">
            Ikuti langkah-langkah mudah berikut untuk berbelanja di {settings?.store_name || 'toko kami'}
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 -mt-8 relative z-10">
        {error && (
          <div className="bg-danger-100 text-danger-700 p-4 rounded-xl mb-6 text-center border border-danger-200">
            {error}
          </div>
        )}

        {/* Steps Timeline */}
        <div className="relative">
          {/* Vertical line decoration */}
          <div className="absolute left-7 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-200 via-primary-300 to-primary-200 hidden md:block" />

          <div className="space-y-8 md:space-y-0">
            {defaultSteps.map((step, index) => (
              <div key={index} className="md:flex md:gap-8 md:items-start relative">
                {/* Step Number & Icon */}
                <div className="md:flex md:flex-col md:items-center md:w-14 flex-shrink-0 mb-4 md:mb-0">
                  <div className="relative">
                    <div className="w-14 h-14 bg-white rounded-2xl shadow-lg border border-gray-100 flex items-center justify-center text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-all duration-300 z-10 relative">
                      <span className="text-xl">{step.icon}</span>
                    </div>
                    {/* Step badge */}
                    {/* <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md">
                      {index + 1}
                    </div> */}
                  </div>
                </div>

                {/* Content Card */}
                <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 hover:shadow-md hover:border-primary-100 transition-all duration-300 md:ml-0 group ml-[calc(3.5rem+1rem)] md:ml-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 bg-primary-50 px-3 py-1 rounded-full">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                          </svg>
                          Langkah {index + 1}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                      <p className="text-gray-500 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Template Message Preview */}
        {settings?.order_whatsapp_message && (
          <div className="mt-12 bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-6 md:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Template Pesanan WhatsApp</h3>
                <p className="text-xs text-gray-400">Pesan otomatis yang akan dikirim saat checkout</p>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-success-50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-success-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <p className="text-sm text-gray-700 italic leading-relaxed">"{settings.order_whatsapp_message}"</p>
              </div>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 mb-16 relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-white rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-primary-400 rounded-full blur-3xl" />
          </div>
          <div className="relative px-8 py-12 md:py-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Siap untuk Berbelanja?</h2>
            <p className="text-primary-100 text-lg mb-8 max-w-lg mx-auto leading-relaxed">
              Mulai jelajahi produk-produk kami dan temukan yang Anda butuhkan.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/produk"
                className="inline-flex items-center gap-2.5 bg-white text-primary-700 px-8 py-3.5 rounded-xl font-bold hover:bg-primary-50 hover:shadow-lg hover:shadow-white/20 transition-all duration-200 shadow-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Lihat Produk
              </Link>
              {settings?.store_whatsapp && (
                <a
                  href={`https://wa.me/${settings.store_whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 bg-success-500 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-success-600 hover:shadow-lg hover:shadow-success-500/30 transition-all duration-200 shadow-md"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Hubungi Kami
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}