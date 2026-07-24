import { useEffect, useState, useRef } from 'react';
import { getSettings, updateSettings, uploadLogo } from '../../services/adminService';

const SETTING_FIELDS = [
  { key: 'store_name', label: 'Nama Toko', type: 'text', required: true, validation: (v) => v.trim() ? '' : 'Nama toko wajib diisi' },
  { key: 'store_description', label: 'Deskripsi', type: 'textarea', required: false },
  { key: 'store_address', label: 'Alamat', type: 'textarea', required: false },
  { key: 'store_phone', label: 'No. Telepon', type: 'text', required: false, placeholder: '081234567890', validation: (v) => v && !/^[0-9+\-\s()]*$/.test(v) ? 'Format nomor telepon tidak valid' : '' },
  { key: 'store_whatsapp', label: 'No. WhatsApp (dengan kode negara)', type: 'text', required: true, placeholder: '6281234567890', validation: (v) => v && !/^[0-9]+$/.test(v) ? 'Nomor WA hanya boleh angka' : '' },
  { key: 'store_email', label: 'Email', type: 'email', required: false, validation: (v) => v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'Format email tidak valid' : '' },
  { key: 'meta_title', label: 'Meta Title (SEO)', type: 'text', required: false },
  { key: 'meta_description', label: 'Meta Description (SEO)', type: 'textarea', required: false },
  { key: 'order_whatsapp_message', label: 'Template Pesan Order WhatsApp', type: 'textarea', required: false, rows: 4,
    placeholder: 'Halo Admin *{store_name}*, saya ingin memesan:' },
  { key: 'store_maps_embed', label: 'Embed Google Maps (iframe src)', type: 'text', required: false,
    placeholder: 'https://www.google.com/maps/embed?pb=...' },
];

function Skeleton() {
  return (
    <div className="animate-pulse space-y-4 max-w-2xl">
      <div className="h-8 bg-gray-200 rounded w-1/3" />
      <div className="h-10 bg-gray-200 rounded" />
      <div className="h-24 bg-gray-200 rounded" />
      <div className="h-20 bg-gray-200 rounded" />
      <div className="h-10 bg-gray-200 rounded" />
      <div className="h-10 bg-gray-200 rounded" />
      <div className="h-10 bg-gray-200 rounded w-1/4" />
    </div>
  );
}

export default function Settings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [errors, setErrors] = useState({});
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [heroBackgroundPreview, setHeroBackgroundPreview] = useState(null);
  const [heroBackgroundFile, setHeroBackgroundFile] = useState(null);
  const [uploadingHeroBackground, setUploadingHeroBackground] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    getSettings()
      .then(data => {
        const settingsMap = {};
        data.forEach(s => settingsMap[s.key] = s.value);
        setSettings(settingsMap);
        if (settingsMap.store_logo) {
          setLogoPreview(settingsMap.store_logo);
        }
        if (settingsMap.store_hero_background) {
          setHeroBackgroundPreview(settingsMap.store_hero_background);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const validate = () => {
    const newErrors = {};
    SETTING_FIELDS.forEach(field => {
      if (field.validation) {
        const err = field.validation(settings[field.key] || '');
        if (err) newErrors[field.key] = err;
      }
      if (field.required && !(settings[field.key] || '').trim()) {
        newErrors[field.key] = `${field.label} wajib diisi`;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      // Exclude store_logo and store_hero_background from settings payload since they're uploaded separately
      const { store_logo, store_hero_background, ...settingsToSave } = settings;
      await updateSettings(settingsToSave);
      setMessage({ type: 'success', text: 'Pengaturan berhasil disimpan' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Gagal menyimpan pengaturan: ' + (err.response?.data?.message || err.message) });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleUploadLogo = async () => {
    if (!logoFile) return;
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('logo', logoFile);
      const result = await uploadLogo(formData);
      setSettings(prev => ({ ...prev, store_logo: result.url }));
      setLogoPreview(result.url);
      setLogoFile(null);
      setMessage({ type: 'success', text: 'Logo berhasil diupload' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Gagal upload logo: ' + (err.response?.data?.message || err.message) });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleHeroBackgroundChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setHeroBackgroundFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setHeroBackgroundPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleUploadHeroBackground = async () => {
    if (!heroBackgroundFile) return;
    setUploadingHeroBackground(true);
    try {
      const formData = new FormData();
      formData.append('hero_background', heroBackgroundFile);
      const result = await uploadLogo(formData);
      setSettings(prev => ({ ...prev, store_hero_background: result.url }));
      setHeroBackgroundPreview(result.url);
      setHeroBackgroundFile(null);
      setMessage({ type: 'success', text: 'Hero background berhasil diupload' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Gagal upload hero background: ' + (err.response?.data?.message || err.message) });
    } finally {
      setUploadingHeroBackground(false);
    }
  };

  const testWaLink = () => {
    const waNumber = settings.store_whatsapp || '6281234567890';
    const testMessage = encodeURIComponent('Halo, ini adalah pesan test dari admin panel.');
    window.open(`https://wa.me/${waNumber}?text=${testMessage}`, '_blank');
  };

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-8">Pengaturan</h1>
        <Skeleton />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Pengaturan</h1>

      {/* Logo Section */}
      <div className="bg-white p-6 rounded-lg shadow max-w-2xl mb-6">
        <h2 className="text-xl font-semibold mb-4">Logo Toko</h2>
        <div className="flex items-start gap-6">
          <div className="flex-shrink-0">
            {logoPreview ? (
              <img src={logoPreview} alt="Logo Toko" className="w-32 h-32 object-contain border rounded-lg" />
            ) : (
              <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 text-sm">
                Belum ada logo
              </div>
            )}
          </div>
          <div className="flex-1 space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
               className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
            <p className="text-xs text-gray-400">Format: JPG, PNG, GIF, SVG, WebP. Maks: 2MB</p>
            {logoFile && (
              <button
                onClick={handleUploadLogo}
                disabled={uploadingLogo}
                className="bg-success-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-success-700 disabled:bg-gray-300"
              >
                {uploadingLogo ? 'Mengupload...' : 'Upload Logo'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Hero Background Section */}
      <div className="bg-white p-6 rounded-lg shadow max-w-2xl mb-6">
        <h2 className="text-xl font-semibold mb-4">Hero Background</h2>
        <div className="flex items-start gap-6">
          <div className="flex-shrink-0">
            {heroBackgroundPreview ? (
              <img src={heroBackgroundPreview} alt="Hero Background" className="w-40 h-24 object-cover border rounded-lg" />
            ) : (
              <div className="w-40 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 text-sm">
                Belum ada background
              </div>
            )}
          </div>
          <div className="flex-1 space-y-3">
            <input
              type="file"
              accept="image/*"
              onChange={handleHeroBackgroundChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
            <p className="text-xs text-gray-400">Format: JPG, PNG. Rekomendasi ukuran: 1920x1080px. Maks: 2MB</p>
            {heroBackgroundFile && (
              <button
                type="button"
                onClick={handleUploadHeroBackground}
                disabled={uploadingHeroBackground}
                className="bg-success-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-success-700 disabled:bg-gray-300"
              >
                {uploadingHeroBackground ? 'Mengupload...' : 'Upload Hero Background'}
              </button>
            )}
            {settings?.store_hero_background && !heroBackgroundFile && (
              <button
                type="button"
                onClick={() => {
                  setSettings(prev => ({ ...prev, store_hero_background: null }));
                  setHeroBackgroundPreview(null);
                }}
                className="bg-danger-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-danger-600"
              >
                Hapus Background
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow max-w-2xl space-y-4">
        {message.text && (
          <div className={`p-3 rounded ${
            message.type === 'success' ? 'bg-success-100 text-success-700' : 'bg-danger-100 text-danger-700'
          }`}>
            {message.text}
          </div>
        )}

        {SETTING_FIELDS.map(field => (
          <div key={field.key}>
            <label className="block text-sm font-medium mb-1">
              {field.label}
              {field.required && <span className="text-danger-500 ml-1">*</span>}
            </label>
            {field.type === 'textarea' ? (
              <textarea
                value={settings[field.key] || ''}
                onChange={e => handleChange(field.key, e.target.value)}
                className={`w-full border rounded px-3 py-2 ${errors[field.key] ? 'border-danger-500' : ''}`}
                rows={field.rows || 3}
                placeholder={field.placeholder || ''}
              />
            ) : (
              <input
                type={field.type || 'text'}
                value={settings[field.key] || ''}
                onChange={e => handleChange(field.key, e.target.value)}
                className={`w-full border rounded px-3 py-2 ${errors[field.key] ? 'border-danger-500' : ''}`}
                placeholder={field.placeholder || ''}
              />
            )}
            {errors[field.key] && (
              <p className="text-danger-500 text-xs mt-1">{errors[field.key]}</p>
            )}
          </div>
        ))}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
             className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:bg-gray-300"
          >
            {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
          <button
            type="button"
            onClick={testWaLink}
             className="bg-success-500 text-white px-4 py-2 rounded-lg hover:bg-success-600 text-sm"
            title="Test nomor WhatsApp yang sudah diisi"
          >
            Test Link WhatsApp
          </button>
        </div>
      </form>
    </div>
  );
}