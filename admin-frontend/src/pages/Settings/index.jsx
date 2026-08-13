import { useEffect, useState, useRef, useCallback } from 'react';
import { getSettings, updateSettings, uploadLogo, uploadFavicon, resetSettingsDefaults, activateLicense, deactivateLicense, getLicenseStatus } from '../../services/adminService';
import { useToast } from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const resolveStorageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('/storage/')) return path;
  return '/storage/' + path;
};

const SETTING_FIELDS = {
  general: [
    { key: 'store_name', label: 'Nama Toko', type: 'text', required: true, validation: (v) => v.trim() ? '' : 'Nama toko wajib diisi' },
    { key: 'store_description', label: 'Deskripsi', type: 'textarea', required: false },
    { key: 'store_address', label: 'Alamat', type: 'textarea', required: false },
  ],
  contact: [
    { key: 'store_phone', label: 'No. Telepon', type: 'text', required: false, placeholder: '081234567890', validation: (v) => v && !/^[0-9+\-\s()]*$/.test(v) ? 'Format nomor telepon tidak valid' : '' },
    { key: 'store_whatsapp', label: 'No. WhatsApp (dengan kode negara)', type: 'text', required: true, placeholder: '6281234567890', validation: (v) => v && !/^[0-9]+$/.test(v) ? 'Nomor WA hanya boleh angka' : '' },
    { key: 'store_email', label: 'Email', type: 'email', required: false, validation: (v) => v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'Format email tidak valid' : '' },
  ],
  social: [
    { key: 'social_facebook', label: 'Facebook URL', type: 'text', required: false, placeholder: 'https://facebook.com/username' },
    { key: 'social_instagram', label: 'Instagram URL', type: 'text', required: false, placeholder: 'https://instagram.com/username' },
    { key: 'social_twitter', label: 'Twitter / X URL', type: 'text', required: false, placeholder: 'https://twitter.com/username' },
    { key: 'social_tiktok', label: 'TikTok URL', type: 'text', required: false, placeholder: 'https://tiktok.com/@username' },
    { key: 'social_youtube', label: 'YouTube URL', type: 'text', required: false, placeholder: 'https://youtube.com/@channel' },
  ],
  help: [
    { key: 'help_faq', label: 'FAQ', type: 'richtext', required: false },
    { key: 'help_privacy', label: 'Kebijakan Privasi', type: 'richtext', required: false },
    { key: 'help_terms', label: 'Syarat & Ketentuan', type: 'richtext', required: false },
    { key: 'help_returns', label: 'Pengembalian Barang', type: 'richtext', required: false },
  ],
  seo: [
    { key: 'meta_title', label: 'Meta Title (SEO)', type: 'text', required: false },
    { key: 'meta_description', label: 'Meta Description (SEO)', type: 'textarea', required: false },
  ],
appearance: [
     { key: 'store_maps_embed', label: 'Embed Google Maps (iframe src)', type: 'text', required: false, placeholder: 'https://www.google.com/maps/embed?pb=...' },
   ],
   favicon: [
     { key: 'store_favicon', label: 'Favicon', type: 'file', required: false },
   ],
   order: [
    { key: 'order_whatsapp_message', label: 'Template Pesan Order WhatsApp', type: 'textarea', required: false, rows: 4, placeholder: 'Halo Admin *{store_name}*, saya ingin memesan:' },
  ],
  integrations: [
    { key: 'google_search_console', label: 'Google Search Console Verification Code', type: 'text', required: false, placeholder: 'Masukkan kode verifikasi (contoh: abc123def456...)' },
    { key: 'google_analytics', label: 'Google Analytics Measurement ID', type: 'text', required: false, placeholder: 'Contoh: G-XXXXXXXXXX' },
    { key: 'google_merchant', label: 'Google Merchant Center ID', type: 'text', required: false, placeholder: 'Masukkan Merchant Center ID' },
    { key: 'google_tag_manager', label: 'Google Tag Manager ID', type: 'text', required: false, placeholder: 'Contoh: GTM-XXXXXX' },
  ],
};

function Skeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-slate-200 rounded w-1/3" />
      <div className="h-10 bg-slate-200 rounded" />
      <div className="bg-white p-6 rounded-xl shadow space-y-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="h-16 bg-slate-200 rounded" />
        ))}
      </div>
    </div>
  );
}

const TABS = [
  {
    key: 'general', label: 'Umum',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v6m0 12v6M4.22 4.22l4.24 4.24m11.32 11.32l4.24 4.24M4 12h6m12 0h6M4.22 19.78l4.24-4.24m11.32-11.32l4.24-4.24" />
      </svg>
    ),
  },
  {
    key: 'contact', label: 'Kontak',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3-8.67 2 2 0 0 1 2.18-2.18 4.77 4.77 0 0 1 2.53 1.13 5.1 5.1 0 0 1 1.96 2.13 4.75 4.75 0 0 1 .37 2.28 19.5 19.5 0 0 0 3.84 2.75 19.5 19.5 0 0 0 2.75 3.84c.29.36.54.75.73 1.17a4.73 4.73 0 0 1 1.13 1.96z" />
      </svg>
    ),
  },
  {
    key: 'social', label: 'Sosial Media',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
  },
  {
    key: 'help', label: 'Bantuan',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  {
    key: 'seo', label: 'SEO',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    key: 'appearance', label: 'Maps',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
        <line x1="8" y1="2" x2="8" y2="18" />
        <line x1="16" y1="6" x2="16" y2="22" />
      </svg>
    ),
  },
  {
    key: 'order', label: 'Pesanan',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="4" />
        <line x1="8" y1="2" x2="8" y2="4" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    key: 'integrations', label: 'Integrasi',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 6l-2 2m0 0l-2-2m2 2v4" />
        <circle cx="12" cy="12" r="10" />
        <path d="M16 16a4 4 0 1 1-8 0" />
      </svg>
    ),
  },
];

export default function Settings() {
  const { addToast } = useToast();
  const [settings, setSettings] = useState({});
  const [originalSettings, setOriginalSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState('general');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [licenseStatus, setLicenseStatus] = useState(null);
  const [activatingLicense, setActivatingLicense] = useState(false);
  const activatingLicenseRef = useRef(false);
  const [licenseCooldown, setLicenseCooldown] = useState(0);
  const [deactivatingLicense, setDeactivatingLicense] = useState(false);
  const deactivatingLicenseRef = useRef(false);

  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [heroBackgroundPreview, setHeroBackgroundPreview] = useState(null);
  const [heroBackgroundFile, setHeroBackgroundFile] = useState(null);
  const [uploadingHeroBackground, setUploadingHeroBackground] = useState(false);

  const [faviconPreview, setFaviconPreview] = useState(null);
  const [faviconFile, setFaviconFile] = useState(null);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

  const [resetConfirm, setResetConfirm] = useState({ open: false });

  const fileInputRef = useRef(null);

  useEffect(() => {
    getSettings()
      .then(data => {
        const settingsMap = {};
        if (data.settings) {
          data.settings.forEach(s => settingsMap[s.key] = s.value);
        } else {
          Object.entries(data).forEach(([key, value]) => {
            if (key !== 'license') settingsMap[key] = value;
          });
        }
        setSettings(settingsMap);
        setOriginalSettings(settingsMap);
        setLicenseStatus(data.license || null);
        if (settingsMap.store_logo) {
          setLogoPreview(resolveStorageUrl(settingsMap.store_logo));
        }
        if (settingsMap.store_hero_background) {
          setHeroBackgroundPreview(resolveStorageUrl(settingsMap.store_hero_background));
        }
        if (settingsMap.store_favicon) {
          setFaviconPreview(resolveStorageUrl(settingsMap.store_favicon));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (settings.store_favicon) {
      let link = document.querySelector("link[rel='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = resolveStorageUrl(settings.store_favicon);
    }
  }, [settings.store_favicon]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const checkUnsavedChanges = useCallback((newSettings) => {
    const changed = Object.keys(newSettings).some(key => newSettings[key] !== originalSettings[key]);
    setHasUnsavedChanges(changed);
  }, [originalSettings]);

  const handleChange = (key, value) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      checkUnsavedChanges(newSettings);
      return newSettings;
    });
    if (errors[key]) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }
  };

  const validate = () => {
    const newErrors = {};
    Object.values(SETTING_FIELDS).flat().forEach(field => {
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
    try {
      const { store_logo, store_hero_background, store_favicon, ...settingsToSave } = settings;
      await updateSettings(settingsToSave);
      setOriginalSettings({ ...settings });
      setHasUnsavedChanges(false);
      addToast('Pengaturan berhasil disimpan', 'success');
    } catch (err) {
      addToast('Gagal menyimpan pengaturan: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    try {
      const data = await resetSettingsDefaults();
      const defaults = data.settings || {};
      const newSettings = { ...settings, ...defaults };
      setSettings(newSettings);
      setOriginalSettings(newSettings);
      setHasUnsavedChanges(false);
      addToast('Pengaturan berhasil direset ke default', 'success');
      setResetConfirm({ open: false });
    } catch (err) {
      addToast('Gagal reset pengaturan: ' + (err.response?.data?.message || err.message), 'error');
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
      addToast('Logo berhasil diupload', 'success');
    } catch (err) {
      addToast('Gagal upload logo: ' + (err.response?.data?.message || err.message), 'error');
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
      addToast('Hero background berhasil diupload', 'success');
    } catch (err) {
      addToast('Gagal upload hero background: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setUploadingHeroBackground(false);
    }
  };

  const handleFaviconChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFaviconFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setFaviconPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleUploadFavicon = async () => {
    if (!faviconFile) return;
    setUploadingFavicon(true);
    try {
      const formData = new FormData();
      formData.append('favicon', faviconFile);
      const result = await uploadFavicon(formData);
      setSettings(prev => ({ ...prev, store_favicon: result.url }));
      setFaviconPreview(result.url);
      setFaviconFile(null);
      addToast('Favicon berhasil diupload', 'success');
    } catch (err) {
      addToast('Gagal upload favicon: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setUploadingFavicon(false);
    }
  };

  const testWaLink = () => {
    const waNumber = settings.store_whatsapp || '6281234567890';
    const testMessage = encodeURIComponent('Halo, ini adalah pesan test dari admin panel.');
    window.open(`https://wa.me/${waNumber}?text=${testMessage}`, '_blank');
  };

  const handleActivateLicense = async () => {
    if (activatingLicenseRef.current) return;
    if (licenseCooldown > 0) return;

    activatingLicenseRef.current = true;
    setActivatingLicense(true);
    try {
      await activateLicense({});
      const status = await getLicenseStatus();
      setLicenseStatus(status);
      addToast('License berhasil diaktifkan', 'success');
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Gagal mengaktifkan license';
      addToast('Gagal mengaktifkan license: ' + message, 'error');
      const code = err.response?.status;
      if (code === 429 || message.toLowerCase().includes('too many attempts')) {
        setLicenseCooldown(60);
      }
    } finally {
      activatingLicenseRef.current = false;
      setActivatingLicense(false);
    }
  };

  const handleDeactivateLicense = async () => {
    if (deactivatingLicenseRef.current) return;

    const confirmed = window.confirm('Apakah Anda yakin ingin menonaktifkan license? Setelah dinonaktifkan, customer tidak akan bisa mengakses aplikasi sampai license diaktifkan kembali.');
    if (!confirmed) return;

    deactivatingLicenseRef.current = true;
    setDeactivatingLicense(true);
    try {
      await deactivateLicense({});
      const status = await getLicenseStatus();
      setLicenseStatus(status);
      addToast('License berhasil dinonaktifkan', 'success');
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Gagal menonaktifkan license';
      addToast('Gagal menonaktifkan license: ' + message, 'error');
    } finally {
      deactivatingLicenseRef.current = false;
      setDeactivatingLicense(false);
    }
  };

  useEffect(() => {
    if (licenseCooldown <= 0) return;
    const timer = setInterval(() => {
      setLicenseCooldown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [licenseCooldown]);

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-8">Pengaturan</h1>
        <Skeleton />
      </div>
    );
  }

  const renderFields = (fields) => {
    return fields.map(field => (
      <div key={field.key}>
        <label className="block text-sm font-medium mb-1">
          {field.label}
          {field.required && <span className="text-danger-500 ml-1">*</span>}
        </label>
        {field.type === 'richtext' ? (
          <div className={`border border-slate-300 rounded-xl overflow-hidden ${errors[field.key] ? 'border-danger-500' : ''}`}>
            <ReactQuill
              theme="snow"
              value={settings[field.key] || ''}
              onChange={value => handleChange(field.key, value)}
              placeholder={field.placeholder || ''}
              modules={{
                toolbar: [
                  [{ header: [1, 2, 3, false] }],
                  ['bold', 'italic', 'underline', 'strike'],
                  [{ list: 'ordered' }, { list: 'bullet' }],
                  [{ indent: '-1' }, { indent: '+1' }],
                  ['link'],
                  ['clean'],
                ],
              }}
            />
          </div>
        ) : field.type === 'textarea' ? (
          <textarea
            value={settings[field.key] || ''}
            onChange={e => handleChange(field.key, e.target.value)}
            className={`w-full border border-slate-300 rounded-xl px-3 py-2 ${errors[field.key] ? 'border-danger-500' : ''}`}
            rows={field.rows || 3}
            placeholder={field.placeholder || ''}
          />
        ) : (
          <input
            type={field.type || 'text'}
            value={settings[field.key] || ''}
            onChange={e => handleChange(field.key, e.target.value)}
            className={`w-full border border-slate-300 rounded-xl px-3 py-2 ${errors[field.key] ? 'border-danger-500' : ''}`}
            placeholder={field.placeholder || ''}
          />
        )}
        {errors[field.key] && (
          <p className="text-danger-500 text-xs mt-1">{errors[field.key]}</p>
        )}
      </div>
    ));
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Pengaturan</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setResetConfirm({ open: true })}
            className="border border-danger-500 text-danger-600 px-4 py-2 rounded-xl hover:bg-danger-50 text-sm"
          >
            Reset ke Default
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="bg-primary-600 text-white px-6 py-2 rounded-xl hover:bg-primary-700 disabled:bg-slate-300"
          >
            {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Logo & Hero Background Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Logo */}
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-xl font-semibold mb-4">Logo Toko</h2>
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo Toko" className="w-32 h-32 object-contain border rounded-xl" />
                ) : (
                  <div className="w-32 h-32 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400 text-sm">
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
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
                <p className="text-xs text-slate-400">Format: JPG, PNG, GIF, SVG, WebP. Maks: 2MB</p>
                {logoFile && (
                  <button
                    onClick={handleUploadLogo}
                    disabled={uploadingLogo}
className="bg-success-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-success-700 disabled:bg-slate-300"
                  >
                    {uploadingLogo ? 'Mengupload...' : 'Upload Logo'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Hero Background */}
          {/* <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-xl font-semibold mb-4">Hero Background</h2>
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0">
                {heroBackgroundPreview ? (
                  <img src={heroBackgroundPreview} alt="Hero Background" className="w-40 h-24 object-cover border rounded-xl" />
                ) : (
                  <div className="w-40 h-24 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-400 text-sm">
                    Belum ada background
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleHeroBackgroundChange}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
                <p className="text-xs text-slate-400">Format: JPG, PNG. Rekomendasi ukuran: 1920x1080px. Maks: 2MB</p>
                {heroBackgroundFile && (
                  <button
                    type="button"
                    onClick={handleUploadHeroBackground}
                    disabled={uploadingHeroBackground}
                    className="bg-success-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-success-700 disabled:bg-slate-300"
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
                      addToast('Hero background berhasil dihapus', 'success');
                    }}
                    className="bg-danger-500 text-white px-4 py-2 rounded-xl text-sm hover:bg-danger-600"
                  >
                    Hapus Background
                  </button>
                )}
              </div>
            </div>
          </div> */}
          {/* Favicon Upload */}
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-xl font-semibold mb-4">Favicon</h2>
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0">
                {faviconPreview ? (
                  <img src={faviconPreview} alt="Favicon" className="w-32 h-32 object-contain border rounded-xl" />
                ) : (
                  <div className="w-32 h-32 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-400 text-sm">
                    No favicon
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-3">
                <input
                  type="file"
                  accept="image/x-icon,image/png,image/svg+xml"
                  onChange={handleFaviconChange}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
                <p className="text-xs text-slate-400">Format: ICO, PNG, SVG. Rekomendasi ukuran: 32x32px. Maks: 2MB</p>
                {faviconFile && (
                  <button
                    type="button"
                    onClick={handleUploadFavicon}
                    disabled={uploadingFavicon}
                    className="bg-success-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-success-700 disabled:bg-slate-300"
                  >
                    {uploadingFavicon ? 'Mengupload...' : 'Upload Favicon'}
                  </button>
                )}
                {settings?.store_favicon && !faviconFile && (
                  <button
                    type="button"
                    onClick={() => {
                      setSettings(prev => ({ ...prev, store_favicon: null }));
                      setFaviconPreview(null);
                      addToast('Favicon berhasil dihapus', 'success');
                    }}
                    className="bg-danger-500 text-white px-4 py-2 rounded-xl text-sm hover:bg-danger-600"
                  >
                    Hapus Favicon
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        

        {/* Live Hero Preview */}
        {/* {(heroBackgroundPreview || settings.store_hero_background) && (
          <div className="bg-white p-6 rounded-xl shadow mb-6">
            <h2 className="text-xl font-semibold mb-4">Preview Hero Section</h2>
            <div
              className="h-48 bg-cover bg-center rounded-xl flex items-center justify-center"
              style={{ backgroundImage: `url(${heroBackgroundPreview || resolveStorageUrl(settings.store_hero_background)})` }}
            >
              <div className="bg-black bg-opacity-50 text-white p-6 rounded-xl text-center">
                <h3 className="text-3xl font-bold mb-2">{settings.store_name || 'Nama Toko'}</h3>
                <p className="text-lg opacity-90">{settings.store_description || 'Deskripsi toko'}</p>
              </div>
            </div>
          </div>
        )} */}

        {/* License Status */}
      {licenseStatus && (
        <div className="bg-white p-6 rounded-xl shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Status License</h2>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              licenseStatus.status === 'valid'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {licenseStatus.status === 'valid' ? 'Valid' : 'Tidak Valid'}
            </span>
            <span className="text-sm text-slate-600">
              {licenseStatus.message}
            </span>
          </div>
          {licenseStatus.data && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">License Key:</span>
                <span className="ml-2 font-mono text-slate-700">{licenseStatus.license_key}</span>
              </div>
              <div>
                <span className="text-slate-500">Platform:</span>
                <span className="ml-2 text-slate-700">{licenseStatus.platform}</span>
              </div>
              {licenseStatus.data.expires_at && (
                <div>
                  <span className="text-slate-500">Expires At:</span>
                  <span className="ml-2 text-slate-700">{licenseStatus.data.expires_at}</span>
                </div>
              )}
              {licenseStatus.data.customer_name && (
                <div>
                  <span className="text-slate-500">Customer:</span>
                  <span className="ml-2 text-slate-700">{licenseStatus.data.customer_name}</span>
                </div>
              )}
            </div>
          )}
          <div className="mt-4 flex gap-2">
            {licenseStatus.status !== 'valid' ? (
              <button
                type="button"
                onClick={handleActivateLicense}
                disabled={activatingLicense || licenseCooldown > 0}
                className="bg-primary-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-primary-700 disabled:bg-slate-300"
              >
                {activatingLicense ? 'Mengaktifkan...' : licenseCooldown > 0 ? `Coba lagi dalam ${licenseCooldown}s` : 'Aktifkan License'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDeactivateLicense}
                disabled={deactivatingLicense}
                className="bg-danger-500 text-white px-4 py-2 rounded-xl text-sm hover:bg-danger-600 disabled:bg-slate-300"
              >
                {deactivatingLicense ? 'Menonaktifkan...' : 'Nonaktifkan License'}
              </button>
            )}
            <button
              type="button"
              onClick={async () => {
                const status = await getLicenseStatus();
                setLicenseStatus(status);
                addToast('Status license diperbarui', 'success');
              }}
              className="border border-slate-300 text-slate-700 px-4 py-2 rounded-xl text-sm hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>
        </div>
      )}

      {/* Settings Tabs */}
        <div className="bg-white p-6 rounded-xl shadow mb-6">
          <div className="border-b mb-4">
            <nav className="flex gap-1 overflow-x-auto">
              {TABS.map(tab => (
                <button
                  type="button"
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2 text-sm font-medium rounded-t-xl transition-colors flex items-center gap-2 ${
                    activeTab === tab.key
                      ? 'bg-primary-50 text-primary-700 border-b-2 border-primary-700'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="space-y-4">
            {renderFields(SETTING_FIELDS[activeTab])}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={testWaLink}
            className="bg-success-500 text-white px-4 py-2 rounded-xl hover:bg-success-600 text-sm"
            title="Test nomor WhatsApp yang sudah diisi"
          >
            Test Link WhatsApp
          </button>
        </div>
      </form>

      {/* Reset Confirmation Modal */}
      <ConfirmModal
        open={resetConfirm.open}
        title="Reset ke Default"
        message="Apakah Anda yakin ingin mereset semua pengaturan ke nilai default? Tindakan ini tidak bisa dibatalkan."
        confirmText="Ya, Reset"
        onConfirm={handleResetDefaults}
        onCancel={() => setResetConfirm({ open: false })}
        danger
      />
    </div>
  );
}
