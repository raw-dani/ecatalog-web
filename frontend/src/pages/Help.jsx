import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO/SEO';
import { getSettings } from '../services/cartService';

const SECTIONS = [
  { key: 'help_faq', title: 'FAQ', description: 'Pertanyaan yang sering diajukan', id: 'faq' },
  { key: 'help_privacy', title: 'Kebijakan Privasi', description: 'Bagaimana kami melindungi data Anda', id: 'privasi' },
  { key: 'help_terms', title: 'Syarat & Ketentuan', description: 'Aturan penggunaan layanan', id: 'syarat' },
  { key: 'help_returns', title: 'Pengembalian Barang', description: 'Kebijakan retur dan pengembalian', id: 'pengembalian' },
];

const normalizeSpaces = (html) => {
  if (!html) return '';
  return html
    .replace(/&nbsp;/g, ' ')
    .replace(/\u00A0/g, ' ');
};

export default function Help() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [openSection, setOpenSection] = useState(null);

  useEffect(() => {
    getSettings()
      .then(data => setSettings(data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    const match = SECTIONS.find(s => s.id === hash);
    if (match) {
      setOpenSection(match.key);
      setTimeout(() => {
        const el = document.getElementById(match.id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, []);

  return (
    <div className="shop-theme flex flex-col pb-20">
      <SEO
        title={`Bantuan - ${settings.store_name || 'E-Catalog'}`}
        description={settings.store_description || 'Halaman bantuan dan informasi'}
        settings={settings}
      />

      <nav className="shop-container pt-6" style={{ paddingBottom: 0 }}>
        <div className="flex items-center gap-2 text-sm mb-6">
          <Link to="/" className="text-gray-500 hover:text-primary-600 transition-colors">Beranda</Link>
          <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span className="text-gray-900 font-medium">Bantuan</span>
        </div>
      </nav>

      <section className="shop-container">
        <div className="section-header">
          <div>
            <h2 className="section-title">Bantuan</h2>
            <div className="section-subtitle">Temukan informasi dan jawaban untuk pertanyaan Anda</div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {SECTIONS.map(section => {
              const content = settings[section.key];
              if (!content) return null;

              const isOpen = openSection === section.key;

              return (
                <div key={section.key} id={section.id} className="bg-white border border-gray-100 rounded-lg overflow-hidden hover:shadow-md hover:border-gray-200 transition-all duration-200">
                  <button
                    onClick={() => {
                      const newOpen = isOpen ? null : section.key;
                      setOpenSection(newOpen);
                      if (newOpen) {
                        setTimeout(() => {
                          const el = document.getElementById(section.id);
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 100);
                      }
                    }}
                    className="w-full flex items-center justify-between p-5 md:p-6 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <h2 className="text-base md:text-lg font-bold text-gray-900">{section.title}</h2>
                      <p className="text-xs md:text-sm text-gray-500 mt-1">{section.description}</p>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {isOpen && (
                    <div className="px-5 md:px-6 pb-5 md:pb-6 pt-0">
                      <div
                        className="text-gray-600 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: normalizeSpaces(content) }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
