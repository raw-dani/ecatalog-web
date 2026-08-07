import { useState, useEffect } from 'react';
import { getUser } from '../services/adminService';

export default function UserDetailModal({ open, userId, onClose }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && userId) {
      setLoading(true);
      setError('');
      getUser(userId)
        .then(res => {
          setUser(res.data || res);
        })
        .catch(err => {
          setError('Gagal memuat data user: ' + (err.response?.data?.message || err.message));
        })
        .finally(() => setLoading(false));
    }
  }, [open, userId]);

  if (!open) return null;

  const ROLES = [
    { value: 'super_admin', label: 'Super Admin' },
    { value: 'admin', label: 'Admin' },
    { value: 'manager', label: 'Manager' },
    { value: 'karyawan', label: 'Karyawan' },
    { value: 'demo', label: 'Demo' },
  ];

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const getRoleLabel = (role) => {
    return ROLES.find(r => r.value === role)?.label || role;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Detail User</h2>
              <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-danger-600 mb-4">{error}</p>
            <button onClick={onClose} className="px-4 py-2 border rounded hover:bg-slate-50">
              Tutup
            </button>
          </div>
        ) : user ? (
          <div className="space-y-6">
            {/* Avatar & Basic Info */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-2xl font-bold">
                {user.avatar ? (
                  <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  user.name?.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold">{user.name}</h3>
                <p className="text-sm text-slate-500">{user.email}</p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs ${
                  user.role === 'super_admin' ? 'bg-slate-100 text-slate-800' :
                  user.role === 'admin' ? 'bg-primary-100 text-primary-800' :
                  user.role === 'manager' ? 'bg-warning-100 text-warning-800' :
                  user.role === 'demo' ? 'bg-violet-100 text-violet-800' :
                  'bg-slate-100 text-slate-800'
                }`}>
                  {getRoleLabel(user.role)}
                </span>
              </div>
            </div>

            {/* Detail Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Status</p>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  user.is_active ? 'bg-success-100 text-success-800' : 'bg-danger-100 text-danger-800'
                }`}>
                  {user.is_active ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Role</p>
                <p className="font-medium">{getRoleLabel(user.role)}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Terakhir Login</p>
                <p className="font-medium">{formatDate(user.last_login_at)}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Email Verifikasi</p>
                <p className="font-medium">{formatDate(user.email_verified_at) || 'Belum diverifikasi'}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Tanggal Dibuat</p>
                <p className="font-medium">{formatDate(user.created_at)}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Terakhir Diperbarui</p>
                <p className="font-medium">{formatDate(user.updated_at)}</p>
              </div>
            </div>

            {/* Roles from pivot */}
            {user.roles && user.roles.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Roles (Pivot):</p>
                <div className="flex flex-wrap gap-2">
                  {user.roles.map((role, i) => (
                    <span key={i} className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t">
              <button onClick={onClose} className="px-4 py-2 border rounded hover:bg-slate-50">
                Tutup
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
