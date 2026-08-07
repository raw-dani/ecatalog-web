import { useEffect, useState, useCallback } from 'react';
import { getUsers, createUser, updateUser, deleteUser, bulkDeleteUsers, bulkToggleUserStatus, exportUsersCsv, getActivityLogs } from '../../services/adminService';
import { useToast } from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';
import UserDetailModal from '../../components/UserDetailModal';
import { useAuth } from '../../context/AuthContext';

const emptyForm = {
  name: '',
  email: '',
  password: '',
  role: 'karyawan',
  is_active: true,
};

const ROLES = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'karyawan', label: 'Karyawan' },
  { value: 'demo', label: 'Demo' },
];

const SORT_FIELDS = [
  { value: 'name', label: 'Nama' },
  { value: 'email', label: 'Email' },
  { value: 'role', label: 'Role' },
  { value: 'is_active', label: 'Status' },
  { value: 'created_at', label: 'Tanggal Dibuat' },
  { value: 'last_login_at', label: 'Terakhir Login' },
];

function Skeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="h-8 bg-slate-200 rounded w-1/4" />
        <div className="h-10 bg-slate-200 rounded w-32" />
      </div>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="p-4 space-y-4">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="flex gap-4">
              <div className="h-6 bg-slate-200 rounded w-1/4" />
              <div className="h-6 bg-slate-200 rounded w-1/4" />
              <div className="h-6 bg-slate-200 rounded w-1/6" />
              <div className="h-6 bg-slate-200 rounded w-16" />
              <div className="h-6 bg-slate-200 rounded w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Users() {
  const { addToast } = useToast();
  const { admin: currentAdmin } = useAuth();
  const isDemo = currentAdmin?.role === 'demo';
  const availableRoles = isDemo
    ? ROLES.filter(r => r.value !== 'super_admin')
    : ROLES;
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [formErrors, setFormErrors] = useState({});
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  // Search & filter
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, total: 0 });
  const [perPage, setPerPage] = useState(20);

  // Sorting
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');

  // Bulk actions
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Confirm modals
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [bulkStatusConfirm, setBulkStatusConfirm] = useState({ open: false, isActive: false });

  // Detail modal
  const [detailModal, setDetailModal] = useState({ open: false, userId: null });

  // Activity log modal
  const [activityLogOpen, setActivityLogOpen] = useState(false);
  const [activityLogs, setActivityLogs] = useState([]);
  const [activityLogLoading, setActivityLogLoading] = useState(false);

  const fetchUsers = useCallback(async (page = 1) => {
    const params = { page, per_page: perPage, sort_field: sortField, sort_direction: sortDirection };
    if (search) params.search = search;
    if (filterRole) params.role = filterRole;
    if (filterStatus) params.is_active = filterStatus;

    const data = await getUsers(params);
    setUsers(data.data || []);
    setPagination({
      currentPage: data.current_page || 1,
      lastPage: data.last_page || 1,
      total: data.total || 0,
    });
  }, [search, filterRole, filterStatus, perPage, sortField, sortDirection]);

  useEffect(() => {
    fetchUsers(1).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading) fetchUsers(1);
  }, [search, filterRole, filterStatus, perPage, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

const getSortIcon = (field) => {
    if (sortField !== field) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 10l5 5 5-5" />
        </svg>
      );
    }
    if (sortDirection === 'asc') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      );
    }
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14M5 12l7 7 7-7" />
      </svg>
    );
  };

  const validate = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Nama wajib diisi';
    if (!formData.email.trim()) errors.email = 'Email wajib diisi';
    if (!editingUser && !formData.password) errors.password = 'Password wajib diisi';
    if (formData.password && formData.password.length < 8) errors.password = 'Password minimal 8 karakter';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({ ...emptyForm });
    setFormErrors({});
    setAvatarFile(null);
    setAvatarPreview(null);
    setModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      password: '',
      role: user.role || 'karyawan',
      is_active: user.is_active ?? true,
    });
    setFormErrors({});
    setAvatarFile(null);
    setAvatarPreview(null);
    setModalOpen(true);
  };

  const handleAvatarSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = new FormData();
      payload.append('name', formData.name);
      payload.append('email', formData.email);
      payload.append('role', formData.role);
      payload.append('is_active', formData.is_active ? '1' : '0');
      if (formData.password) payload.append('password', formData.password);
      if (avatarFile) payload.append('avatar', avatarFile);

      if (editingUser) {
        // For update, we need to use JSON + FormData for avatar
        if (avatarFile) {
          // Use FormData approach
          const result = await updateUser(editingUser.id, payload);
          setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...result.data || result } : u));
        } else {
          const jsonPayload = { ...formData };
          if (!jsonPayload.password) delete jsonPayload.password;
          const result = await updateUser(editingUser.id, jsonPayload);
          setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...result.data || result } : u));
        }
        addToast('User berhasil diperbarui', 'success');
      } else {
        const result = await createUser(payload);
        setUsers([result.data || result, ...users]);
        addToast('User berhasil dibuat', 'success');
      }

      setModalOpen(false);
    } catch (err) {
      addToast('Gagal menyimpan: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const { id } = deleteConfirm;
    try {
      await deleteUser(id);
      setUsers(users.filter(u => u.id !== id));
      setSelectedIds(prev => prev.filter(sid => sid !== id));
      addToast('User berhasil dihapus', 'success');
    } catch (err) {
      addToast('Gagal menghapus: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setDeleteConfirm({ open: false, id: null });
    }
  };

  const handleBulkDelete = async () => {
    setBulkLoading(true);
    try {
      await bulkDeleteUsers(selectedIds);
      setUsers(users.filter(u => !selectedIds.includes(u.id)));
      addToast(`${selectedIds.length} user berhasil dihapus`, 'success');
      setSelectedIds([]);
    } catch (err) {
      addToast('Gagal menghapus: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setBulkLoading(false);
      setBulkDeleteConfirm(false);
    }
  };

  const handleBulkToggleStatus = async () => {
    const isActive = bulkStatusConfirm.isActive;
    setBulkLoading(true);
    try {
      await bulkToggleUserStatus(selectedIds, isActive);
      setUsers(users.map(u => selectedIds.includes(u.id) ? { ...u, is_active: isActive } : u));
      addToast(`${selectedIds.length} user berhasil diubah statusnya`, 'success');
      setSelectedIds([]);
    } catch (err) {
      addToast('Gagal mengubah status: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setBulkLoading(false);
      setBulkStatusConfirm({ open: false, isActive: false });
    }
  };

  const handleExportCsv = async () => {
    try {
      const params = {};
      if (filterRole) params.role = filterRole;
      if (filterStatus) params.is_active = filterStatus;

      const response = await exportUsersCsv(params);
      // Create blob download
      const blob = new Blob([response], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `users-export-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      addToast('Data user berhasil diexport', 'success');
    } catch (err) {
      addToast('Gagal export: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  const handleToggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(users.map(u => u.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const openActivityLogs = async () => {
    setActivityLogOpen(true);
    setActivityLogLoading(true);
    try {
      const data = await getActivityLogs();
      setActivityLogs(data.data || []);
    } catch (err) {
      addToast('Gagal memuat activity log', 'error');
    } finally {
      setActivityLogLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  if (loading) return <Skeleton />;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Manajemen User</h1>
        <div className="flex gap-2">
<button onClick={openActivityLogs} className="border border-slate-300 text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-50 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1 inline-block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="4" />
              <line x1="8" y1="2" x2="8" y2="4" />
            </svg>
            Activity Log
          </button>
          <button onClick={handleExportCsv} className="border border-slate-300 text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-50 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1 inline-block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export CSV
          </button>
          <button onClick={openCreateModal} className="bg-primary-600 text-white px-4 py-2 rounded-xl hover:bg-primary-700">
            + Tambah User
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-xl shadow mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Cari</label>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari nama atau email..."
              className="w-full border border-slate-300 rounded-xl px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2">
              <option value="">Semua Role</option>
              {availableRoles.map(role => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2">
              <option value="">Semua Status</option>
              <option value="1">Aktif</option>
              <option value="0">Nonaktif</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tampilkan</label>
            <select value={perPage} onChange={e => setPerPage(Number(e.target.value))} className="w-full border border-slate-300 rounded-xl px-3 py-2">
              <option value={10}>10 per halaman</option>
              <option value={20}>20 per halaman</option>
              <option value={50}>50 per halaman</option>
              <option value={100}>100 per halaman</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-primary-50 border border-primary-200 p-3 rounded-xl mb-4 flex items-center justify-between">
          <span className="text-sm font-medium text-primary-800">
            {selectedIds.length} user dipilih
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setBulkStatusConfirm({ open: true, isActive: true })}
              className="px-3 py-1.5 bg-success-600 text-white rounded text-sm hover:bg-success-700"
            >
              Aktifkan
            </button>
            <button
              onClick={() => setBulkStatusConfirm({ open: true, isActive: false })}
              className="px-3 py-1.5 bg-warning-600 text-white rounded text-sm hover:bg-warning-700"
            >
              Nonaktifkan
            </button>
            <button
              onClick={() => setBulkDeleteConfirm(true)}
              className="px-3 py-1.5 bg-danger-600 text-white rounded text-sm hover:bg-danger-700"
            >
              Hapus
            </button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={users.length > 0 && selectedIds.length === users.length}
                    onChange={handleToggleSelectAll}
                    className="rounded"
                  />
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold cursor-pointer hover:text-primary-600 select-none"
                    onClick={() => handleSort('name')}>
                  Nama <span className="text-slate-400 text-xs">{getSortIcon('name')}</span>
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold cursor-pointer hover:text-primary-600 select-none"
                    onClick={() => handleSort('email')}>
                  Email <span className="text-slate-400 text-xs">{getSortIcon('email')}</span>
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold cursor-pointer hover:text-primary-600 select-none"
                    onClick={() => handleSort('role')}>
                  Role <span className="text-slate-400 text-xs">{getSortIcon('role')}</span>
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold cursor-pointer hover:text-primary-600 select-none"
                    onClick={() => handleSort('is_active')}>
                  Status <span className="text-slate-400 text-xs">{getSortIcon('is_active')}</span>
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold cursor-pointer hover:text-primary-600 select-none"
                    onClick={() => handleSort('last_login_at')}>
                  Terakhir Login <span className="text-slate-400 text-xs">{getSortIcon('last_login_at')}</span>
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold cursor-pointer hover:text-primary-600 select-none"
                    onClick={() => handleSort('created_at')}>
                  Dibuat <span className="text-slate-400 text-xs">{getSortIcon('created_at')}</span>
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    Belum ada user
                  </td>
                </tr>
              ) : (
                users.map(user => {
                  const isSuperAdmin = user.role === 'super_admin';
                  const canManage = !isDemo || !isSuperAdmin;
                  return (
                  <tr key={user.id} className={`hover:bg-slate-50 ${selectedIds.includes(user.id) ? 'bg-primary-50' : ''}`}>
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(user.id)}
                        onChange={() => handleToggleSelect(user.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-sm font-bold flex-shrink-0 overflow-hidden">
                          {user.avatar ? (
                            <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            user.name?.charAt(0).toUpperCase()
                          )}
                        </div>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm">{user.email}</td>
                    <td className="px-4 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.role === 'super_admin' ? 'bg-slate-100 text-slate-800' :
                        user.role === 'admin' ? 'bg-primary-100 text-primary-800' :
                        user.role === 'manager' ? 'bg-warning-100 text-warning-800' :
                        user.role === 'demo' ? 'bg-violet-100 text-violet-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {ROLES.find(r => r.value === user.role)?.label || user.role}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.is_active ? 'bg-success-100 text-success-700' : 'bg-danger-100 text-danger-700'
                      }`}>
                        {user.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-500">
                      {formatDate(user.last_login_at)}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-500">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => setDetailModal({ open: true, userId: user.id })} className="text-slate-500 hover:text-slate-700 text-sm flex items-center justify-center w-5 h-5" title="Detail">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 9.3 12 9.3" />
                            <path d="M12 14.4c-3.2 0-5.8 2.6-5.8 5.8v2.4h11.6v-2.4c0-3.2-2.6-5.8-5.8-5.8z" />
                          </svg>
                        </button>
                        {canManage ? (
                          <>
                            <button onClick={() => openEditModal(user)} className="text-primary-600 hover:underline text-sm">Edit</button>
                            <button onClick={() => setDeleteConfirm({ open: true, id: user.id })} className="text-danger-600 hover:underline text-sm">Hapus</button>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Demo</span>
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.lastPage > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <span className="text-sm text-slate-600">
              Total {pagination.total} user (Halaman {pagination.currentPage} dari {pagination.lastPage})
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => fetchUsers(pagination.currentPage - 1)}
                disabled={pagination.currentPage <= 1}
                className="px-3 py-1 border border-slate-300 rounded-xl text-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sebelumnya
              </button>
              <span className="px-3 py-1 text-sm">
                {pagination.currentPage} / {pagination.lastPage}
              </span>
              <button
                onClick={() => fetchUsers(pagination.currentPage + 1)}
                disabled={pagination.currentPage >= pagination.lastPage}
                className="px-3 py-1 border border-slate-300 rounded-xl text-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editingUser ? 'Edit User' : 'Tambah User'}</h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-500 hover:text-slate-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Avatar Upload */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-2xl font-bold overflow-hidden flex-shrink-0">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                  ) : editingUser?.avatar ? (
                    <img src={editingUser.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (formData.name || 'U').charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Foto Profil</label>
                  <input type="file" accept="image/jpeg,image/png,image/jpg,image/gif,image/webp" onChange={handleAvatarSelect} className="text-sm" />
                  <p className="text-xs text-slate-400 mt-1">Format: JPG, PNG, GIF, WebP. Maks 2MB</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nama <span className="text-danger-500">*</span></label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                    className={`w-full border border-slate-300 rounded-xl px-3 py-2 ${formErrors.name ? 'border-danger-500' : ''}`} />
                  {formErrors.name && <p className="text-danger-500 text-xs mt-1">{formErrors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email <span className="text-danger-500">*</span></label>
                  <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                    className={`w-full border border-slate-300 rounded-xl px-3 py-2 ${formErrors.email ? 'border-danger-500' : ''}`} />
                  {formErrors.email && <p className="text-danger-500 text-xs mt-1">{formErrors.email}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Password {editingUser ? '' : <span className="text-danger-500">*</span>}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    className={`w-full border border-slate-300 rounded-xl px-3 py-2 ${formErrors.password ? 'border-danger-500' : ''}`}
                    placeholder={editingUser ? 'Kosongkan jika tidak diubah' : ''}
                  />
                  {formErrors.password && <p className="text-danger-500 text-xs mt-1">{formErrors.password}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Role <span className="text-danger-500">*</span></label>
                  <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2">
                    {availableRoles.map(role => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} />
                  <span className="text-sm">Aktif</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border border-slate-300 rounded-xl hover:bg-slate-50">
                  Batal
                </button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:bg-slate-300">
                  {saving ? 'Menyimpan...' : (editingUser ? 'Simpan Perubahan' : 'Buat User')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={deleteConfirm.open}
        title="Hapus User"
        message="Apakah Anda yakin ingin menghapus user ini? Tindakan ini tidak dapat dibatalkan."
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ open: false, id: null })}
      />

      {/* Bulk Delete Confirmation */}
      <ConfirmModal
        open={bulkDeleteConfirm}
        title="Hapus User Massal"
        message={`Apakah Anda yakin ingin menghapus ${selectedIds.length} user yang dipilih? Tindakan ini tidak dapat dibatalkan.`}
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkDeleteConfirm(false)}
        loading={bulkLoading}
      />

      {/* Bulk Toggle Status Confirmation */}
      <ConfirmModal
        open={bulkStatusConfirm.open}
        title={bulkStatusConfirm.isActive ? 'Aktifkan User' : 'Nonaktifkan User'}
        message={`Apakah Anda yakin ingin ${bulkStatusConfirm.isActive ? 'mengaktifkan' : 'menonaktifkan'} ${selectedIds.length} user yang dipilih?`}
        confirmText={bulkStatusConfirm.isActive ? 'Aktifkan' : 'Nonaktifkan'}
        onConfirm={handleBulkToggleStatus}
        onCancel={() => setBulkStatusConfirm({ open: false, isActive: false })}
        loading={bulkLoading}
        danger={!bulkStatusConfirm.isActive}
      />

      {/* User Detail Modal */}
      <UserDetailModal
        open={detailModal.open}
        userId={detailModal.userId}
        onClose={() => setDetailModal({ open: false, userId: null })}
      />

      {/* Activity Log Modal */}
      {activityLogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Activity Log</h2>
              <button onClick={() => setActivityLogOpen(false)} className="text-slate-500 hover:text-slate-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {activityLogLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
              </div>
            ) : activityLogs.length === 0 ? (
              <p className="text-center text-slate-500 py-8">Belum ada aktivitas</p>
            ) : (
              <div className="space-y-3">
                {activityLogs.map(log => (
                  <div key={log.id} className="bg-slate-50 p-3 rounded-xl text-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            log.action === 'create' ? 'bg-success-100 text-success-700' :
                            log.action === 'update' ? 'bg-primary-100 text-primary-700' :
                            log.action === 'delete' ? 'bg-danger-100 text-danger-700' :
                            log.action === 'bulk_delete' ? 'bg-danger-100 text-danger-700' :
                            log.action === 'bulk_toggle_status' ? 'bg-warning-100 text-warning-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {log.action.replace(/_/g, ' ')}
                          </span>
                          <span className="text-slate-400 text-xs">
                            {formatDate(log.created_at)}
                          </span>
                        </div>
                        <p className="text-slate-700">{log.description}</p>
                        {log.admin && (
                          <p className="text-xs text-slate-400 mt-1">
                            Oleh: {log.admin.name} ({log.admin.email})
                          </p>
                        )}
                      </div>
                      {log.ip_address && (
                        <span className="text-xs text-slate-400 flex-shrink-0">IP: {log.ip_address}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-4 border-t mt-4">
              <button onClick={() => setActivityLogOpen(false)} className="px-4 py-2 border border-slate-300 rounded-xl hover:bg-slate-50">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
