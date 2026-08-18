import { useState, useEffect, useRef } from 'react';
import { getAdminMe, updateAdminProfile } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';

export default function Profile() {
  const { setAdmin } = useAuth();
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    avatar: null,
  });
  const [currentAvatar, setCurrentAvatar] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingInit, setLoadingInit] = useState(true);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getAdminMe();
        const adminData = data.admin;
        setFormData({
          name: adminData.name || '',
          email: adminData.email || '',
          avatar: null,
        });
        setCurrentAvatar(adminData.avatar || '');
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoadingInit(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      setFormData({ ...formData, [name]: files[0] });
      if (files[0]) {
        setCurrentAvatar(URL.createObjectURL(files[0]));
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let payload;
      if (formData.avatar) {
        payload = new FormData();
        payload.append('name', formData.name);
        payload.append('email', formData.email);
        payload.append('avatar', formData.avatar);
      } else {
        payload = {
          name: formData.name,
          email: formData.email,
        };
      }
      const data = await updateAdminProfile(payload);
      if (data.admin) {
        setAdmin(data.admin);
      }
      addToast('Profil berhasil diperbarui', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal memperbarui profil', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loadingInit) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/4 mb-6"></div>
          <div className="bg-white rounded-xl shadow p-6 border border-slate-100">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 bg-slate-200 rounded-full"></div>
              <div>
                <div className="h-4 bg-slate-200 rounded w-32 mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-48"></div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-10 bg-slate-200 rounded"></div>
              <div className="h-10 bg-slate-200 rounded"></div>
              <div className="h-10 bg-slate-200 rounded w-1/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Profil Saya</h1>
        <p className="text-sm text-slate-500 mt-1">Perbarui informasi akun dan foto profil Anda</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow border border-slate-100 p-6">
          {/* <div className="flex items-center gap-6 mb-6">
            <div className="relative">
              {currentAvatar ? (
                <img src={currentAvatar} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-2 border-slate-100" />
              ) : (
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold text-xl">
                  {formData.name ? formData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'A'}
                </div>
              )}
              <label
                htmlFor="avatar"
                className="absolute bottom-0 right-0 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-primary-700 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 7h.01M17 7l3-3 3 3M7 7v6a3 3 0 0 0 3 3h4a3 3 0 0 0 3-3V7" />
                  <path d="M10 10h4a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-.5" />
                  <circle cx="12" cy="11" r="1" />
                </svg>
              </label>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">Foto Profil</label>
              <p className="text-sm text-slate-600 mt-1">Klik ikon kamera untuk mengganti foto</p>
            </div>
            <input
              type="file"
              id="avatar"
              name="avatar"
              ref={fileInputRef}
              onChange={handleChange}
              accept="image/*"
              className="hidden"
            />
          </div> */}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                required
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 text-sm font-medium transition flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Menyimpan...
              </>
            ) : 'Simpan Perubahan'}
          </button>
        </div>
      </form>
    </div>
  );
}

