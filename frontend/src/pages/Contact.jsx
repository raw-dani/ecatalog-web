import { useEffect, useState } from 'react';
import SEO from '../components/SEO/SEO';
import { getSettings, getBankAccounts } from '../services/cartService';

function BankSvgIcon({ className = 'w-6 h-6' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 21 21 21 21 18 3 18 3 21" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <polyline points="5 6 12 2 19 6" />
      <line x1="4" y1="10" x2="4" y2="18" />
      <line x1="20" y1="10" x2="20" y2="18" />
      <line x1="8" y1="14" x2="8" y2="18" />
      <line x1="12" y1="14" x2="12" y2="18" />
      <line x1="16" y1="14" x2="16" y2="18" />
    </svg>
  );
}

function BuildingSvgIcon({ className = 'w-6 h-6' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
      <line x1="9" y1="6" x2="9" y2="6.01" />
      <line x1="15" y1="6" x2="15" y2="6.01" />
      <line x1="9" y1="10" x2="9" y2="10.01" />
      <line x1="15" y1="10" x2="15" y2="10.01" />
      <line x1="9" y1="14" x2="9" y2="14.01" />
      <line x1="15" y1="14" x2="15" y2="14.01" />
      <line x1="9" y1="18" x2="9" y2="18.01" />
      <line x1="15" y1="18" x2="15" y2="18.01" />
    </svg>
  );
}

function AtmSvgIcon({ className = 'w-6 h-6' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
      <circle cx="8" cy="14" r="1" />
      <circle cx="16" cy="14" r="1" />
      <line x1="12" y1="10" x2="12" y2="16" />
    </svg>
  );
}

function MosqueSvgIcon({ className = 'w-6 h-6' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l-4 4h8l-4-4z" />
      <path d="M6 22V10l-3 2v10" />
      <path d="M18 22V10l3 2v10" />
      <path d="M10 22V16h4v6" />
      <path d="M4 22h16" />
      <circle cx="12" cy="8" r="1" />
      <path d="M8 6v2" />
      <path d="M16 6v2" />
    </svg>
  );
}

function getBankIcon(bankName) {
  if (!bankName) return <BankSvgIcon />;
  const name = bankName.toLowerCase().trim();
  const syariahKeywords = ['syariah', 'bsi', 'bank syariah indonesia'];
  const buildingKeywords = ['bca', 'bnp', 'bni', 'cimb', 'cimb niaga', 'maybank', 'bank bca', 'bank bnp', 'bank bni', 'bank maybank'];
  const atmKeywords = ['mandiri', 'bank mandiri'];

  for (const keyword of syariahKeywords) {
    if (name.includes(keyword)) return <MosqueSvgIcon />;
  }
  for (const keyword of buildingKeywords) {
    if (name.includes(keyword)) return <BuildingSvgIcon />;
  }
  for (const keyword of atmKeywords) {
    if (name.includes(keyword)) return <AtmSvgIcon />;
  }
  return <BankSvgIcon />;
}

function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(() => {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    });
  } else {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}

function Skeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-8" />
      <div className="h-48 bg-gray-200 rounded-none mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-none shadow-sm space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-10 bg-gray-200 rounded w-1/3" />
        </div>
        <div className="bg-white p-6 rounded-none shadow-sm space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/2" />
          {[1,2,3].map(i => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-3 bg-gray-200 rounded w-2/3" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Contact() {
  const [settings, setSettings] = useState(null);
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);

  useEffect(() => {
    Promise.all([getSettings(), getBankAccounts()])
      .then(([settingsData, banksData]) => {
        setSettings(settingsData);
        setBanks(banksData);
      })
      .catch(err => {
        setError('Gagal memuat data. Silakan coba lagi nanti.');
        console.error('Contact page error:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = (text, index) => {
    copyToClipboard(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (loading) return <Skeleton />;

  return (
    <>
      <SEO
        title="Kontak Kami"
        description={`Hubungi ${settings?.store_name || 'kami'} untuk informasi lebih lanjut. Telepon, WhatsApp, email, dan alamat toko.`}
        settings={settings}
      />

      {/* Page Header */}
      <section className="bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900 text-white py-16">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="w-12 h-12 bg-white/10 rounded-none flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3 text-white">Kontak Kami</h1>
          <p className="text-primary-100 text-lg max-w-lg mx-auto">
            Kami siap membantu Anda. Jangan ragu untuk menghubungi kami melalui berbagai saluran berikut.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 -mt-8 relative z-10 pb-16">
        {error && (
          <div className="bg-danger-100 text-danger-700 p-4 rounded-none mb-6 text-center border border-danger-200">
            {error}
          </div>
        )}

        {/* Embedded Google Maps */}
        {settings?.store_maps_embed && (
          <div className="bg-white rounded-none shadow-sm border border-gray-100 mb-8 overflow-hidden hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
              <div className="w-9 h-9 bg-primary-50 rounded-none flex items-center justify-center">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Lokasi Toko</h2>
            </div>
            <div className="w-full aspect-[21/9] overflow-hidden">
              <iframe
                src={settings.store_maps_embed}
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: '300px' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Lokasi Toko"
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Info */}
          <div className="bg-white rounded-none shadow-sm border border-gray-100 p-6 lg:p-8 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
              
              <h2 className="text-xl font-bold text-gray-900">Informasi Kontak</h2>
            </div>

            <div className="space-y-4">
              {/* Address */}
              {settings?.store_address && (
                <div className="flex items-start gap-4 p-4 bg-gray-50/50 rounded-none hover:bg-primary-50/50 transition-all duration-200 group">
                  <div className="w-12 h-12 bg-white rounded-none flex items-center justify-center flex-shrink-0 shadow-sm group-hover:shadow-md transition-all">
                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Alamat</p>
                    <p className="font-semibold text-gray-900 leading-relaxed">{settings.store_address}</p>
                    {/* <a
                      href={`https://www.google.com/maps/search/${encodeURIComponent(settings.store_address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-primary-600 hover:text-primary-700 text-sm mt-2 font-semibold transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Lihat di Google Maps
                    </a> */}
                  </div>
                </div>
              )}

              {/* Phone */}
              {settings?.store_phone && (
                <div className="flex items-start gap-4 p-4 bg-gray-50/50 rounded-none hover:bg-primary-50/50 transition-all duration-200 group">
                  <div className="w-12 h-12 bg-white rounded-none flex items-center justify-center flex-shrink-0 shadow-sm group-hover:shadow-md transition-all">
                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Telepon</p>
                    <a href={`tel:${settings.store_phone}`} className="font-semibold text-gray-900 hover:text-primary-600 transition-colors text-lg">
                      {settings.store_phone}
                    </a>
                  </div>
                </div>
              )}

              {/* WhatsApp */}
              {settings?.store_whatsapp && (
                <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-success-50/50 to-white rounded-none border border-success-100/50 hover:border-success-200 hover:shadow-md transition-all duration-200 group">
                  <div className="w-12 h-12 bg-white rounded-none flex items-center justify-center flex-shrink-0 shadow-sm group-hover:shadow-md transition-all">
                    <svg className="w-5 h-5 text-success-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">WhatsApp</p>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <span className="font-semibold text-gray-900 text-lg">{settings.store_whatsapp}</span>
                      <a
                        href={`https://wa.me/${settings.store_whatsapp}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 border border-success-500 text-success-500 px-4 py-2 rounded-none text-sm font-semibold hover:bg-success-500 hover:text-white transition-all duration-200"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                        </svg>
                        Chat Sekarang
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Email */}
              {settings?.store_email && (
                <div className="flex items-start gap-4 p-4 bg-gray-50/50 rounded-none hover:bg-primary-50/50 transition-all duration-200 group">
                  <div className="w-12 h-12 bg-white rounded-none flex items-center justify-center flex-shrink-0 shadow-sm group-hover:shadow-md transition-all">
                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Email</p>
                    <a href={`mailto:${settings.store_email}`} className="font-semibold text-gray-900 hover:text-primary-600 transition-colors text-lg">
                      {settings.store_email}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bank Accounts */}
          <div className="bg-white rounded-none shadow-sm border border-gray-100 p-6 lg:p-8 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">              
              <h2 className="text-xl font-bold text-gray-900">Rekening Bank</h2>
            </div>

            {banks.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-50 rounded-none flex items-center justify-center mx-auto mb-4">
                  <BankSvgIcon className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">Belum ada rekening yang terdaftar.</p>
                <p className="text-gray-400 text-sm mt-1">Segera hubungi kami untuk informasi pembayaran.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {banks.map((bank, index) => (
                  <div key={bank.id || index} className="border border-gray-100 rounded-none p-5 hover:border-primary-100 hover:shadow-sm transition-all duration-200">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-10 h-10 bg-primary-50 rounded-none flex items-center justify-center flex-shrink-0">
                        <span className="text-primary-600">{getBankIcon(bank.bank_name)}</span>
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{bank.bank_name}</p>
                        {bank.branch && (
                          <p className="text-xs text-gray-400">Cabang: {bank.branch}</p>
                        )}
                      </div>
                    </div>

                    <div className="ml-14 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-400 font-medium">No. Rekening</p>
                          <p className="font-mono font-bold text-gray-900 text-sm tracking-wide">{bank.account_number}</p>
                        </div>
                        <button
                          onClick={() => handleCopy(bank.account_number, index)}
                          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-none transition-all duration-200 ${
                            copiedIndex === index
                              ? 'bg-success-50 text-success-700 border border-success-200'
                              : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 hover:border-gray-300'
                          }`}
                          title="Salin nomor rekening"
                        >
                          {copiedIndex === index ? (
                            <>
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span>Tersalin</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              <span>Salin</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="text-sm text-gray-600">
                          <span className="text-gray-400">A/N:</span> {bank.account_name}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}