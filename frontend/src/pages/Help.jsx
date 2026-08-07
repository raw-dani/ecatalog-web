import { useEffect, useState } from 'react';
import SEO from '../components/SEO/SEO';
import { getSettings } from '../services/cartService';

const SECTIONS = [
  { key: 'help_faq', title: 'FAQ', description: 'Pertanyaan yang sering diajukan', id: 'faq' },
  { key: 'help_privacy', title: 'Kebijakan Privasi', description: 'Bagaimana kami melindungi data Anda', id: 'privasi' },
  { key: 'help_terms', title: 'Syarat & Ketentuan', description: 'Aturan penggunaan layanan', id: 'syarat' },
  { key: 'help_returns', title: 'Pengembalian Barang', description: 'Kebijakan retur dan pengembalian', id: 'pengembalian' },
];

// Konten rich text dari Quill terkadang mengandung &nbsp; (non-breaking space)
// yang mencegah browser memutus baris di antara kata, menyebabkan teks terpotong per huruf.
// Ganti &nbsp; dengan spasi biasa agar pemotongan kalimat menjadi per kata.
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
    <>
      <SEO
        title={`Bantuan - ${settings.store_name || 'E-Catalog'}`}
        description={settings.store_description || 'Halaman bantuan dan informasi'}
        settings={settings}
      />

      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Bantuan</h1>
          <p className="text-gray-500 max-w-lg mx-auto">
            Temukan informasi dan jawaban untuk pertanyaan Anda di sini
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {SECTIONS.map(section => {
              const content = settings[section.key];
              if (!content) return null;

              const isOpen = openSection === section.key;

              return (
                <div key={section.key} id={section.id} className="bg-white border border-gray-100 shadow-sm overflow-hidden">
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
                    className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">{section.title}</h2>
                      <p className="text-sm text-gray-500 mt-1">{section.description}</p>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 pt-2">
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
      </div>
    </>
  );
}
