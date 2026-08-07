import { useEffect, useState, useCallback } from 'react';
import { getBankAccounts, createBankAccount, updateBankAccount, deleteBankAccount, toggleBankAccountStatus } from '../../services/adminService';
import { useToast } from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';

const emptyForm = {
  bank_name: '',
  account_number: '',
  account_name: '',
  branch: '',
  is_active: true,
  sort_order: 0,
};

function Skeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex justify-between mb-8">
        <div className="h-8 bg-slate-200 rounded w-1/4" />
        <div className="h-10 bg-slate-200 rounded w-32" />
      </div>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="p-4 space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="flex gap-4">
              <div className="h-6 bg-slate-200 rounded w-1/6" />
              <div className="h-6 bg-slate-200 rounded w-1/6" />
              <div className="h-6 bg-slate-200 rounded w-1/6" />
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

export default function BankAccounts() {
  const { addToast } = useToast();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [formErrors, setFormErrors] = useState({});

  // Search & sorting
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('sort_order');
  const [sortDirection, setSortDirection] = useState('asc');

  // Confirm modals
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });

  const fetchAccounts = useCallback(async () => {
    const params = { sort_field: sortField, sort_direction: sortDirection };
    if (search) params.search = search;

    const data = await getBankAccounts(params);
    setAccounts(data.data || data);
  }, [search, sortField, sortDirection]);

  useEffect(() => {
    fetchAccounts().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading) fetchAccounts();
  }, [search, sortField, sortDirection]);

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
    if (!formData.bank_name.trim()) errors.bank_name = 'Nama bank wajib diisi';
    if (!formData.account_number.trim()) errors.account_number = 'No. rekening wajib diisi';
    if (formData.account_number && !/^[0-9]+$/.test(formData.account_number.replace(/[\s\-]/g, ''))) {
      errors.account_number = 'No. rekening hanya boleh angka';
    }
    if (!formData.account_name.trim()) errors.account_name = 'Atas nama wajib diisi';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openCreateModal = () => {
    setEditingAccount(null);
    setFormData({ ...emptyForm });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (account) => {
    setEditingAccount(account);
    setFormData({
      bank_name: account.bank_name || '',
      account_number: account.account_number || '',
      account_name: account.account_name || '',
      branch: account.branch || '',
      is_active: account.is_active ?? true,
      sort_order: account.sort_order ?? 0,
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        ...formData,
        sort_order: Number(formData.sort_order),
        account_number: formData.account_number.trim(),
      };

      if (editingAccount) {
        const result = await updateBankAccount(editingAccount.id, payload);
        setAccounts(accounts.map(a => a.id === editingAccount.id ? { ...a, ...result.data || result } : a));
        addToast('Rekening berhasil diperbarui', 'success');
      } else {
        const result = await createBankAccount(payload);
        setAccounts([result.data || result, ...accounts]);
        addToast('Rekening berhasil ditambahkan', 'success');
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
      await deleteBankAccount(id);
      setAccounts(accounts.filter(a => a.id !== id));
      addToast('Rekening berhasil dihapus', 'success');
    } catch (err) {
      addToast('Gagal menghapus: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setDeleteConfirm({ open: false, id: null });
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const result = await toggleBankAccountStatus(id);
      const updated = result.data || result;
      setAccounts(accounts.map(a => a.id === id ? { ...a, is_active: updated.is_active } : a));
      addToast(`Rekening ${updated.is_active ? 'diaktifkan' : 'dinonaktifkan'}`, 'success');
    } catch (err) {
      addToast('Gagal mengubah status: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  const copyAccountNumber = (accountNumber) => {
    navigator.clipboard.writeText(accountNumber).then(() => {
      addToast('No. rekening berhasil disalin', 'success');
    }).catch(() => {
      addToast('Gagal menyalin', 'error');
    });
  };

  if (loading) return <Skeleton />;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Rekening Bank</h1>
        <button onClick={openCreateModal} className="bg-primary-600 text-white px-4 py-2 rounded-xl hover:bg-primary-700">
          + Tambah Rekening
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl shadow mb-6">
        <div className="max-w-sm">
          <label className="block text-sm font-medium mb-1">Cari Rekening</label>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama bank, no. rekening, atau atas nama..."
            className="w-full border border-slate-300 rounded-xl px-3 py-2"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold cursor-pointer hover:text-primary-600 select-none"
                    onClick={() => handleSort('bank_name')}>
                  Bank <span className="text-slate-400 text-xs">{getSortIcon('bank_name')}</span>
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold cursor-pointer hover:text-primary-600 select-none"
                    onClick={() => handleSort('account_number')}>
                  No. Rekening <span className="text-slate-400 text-xs">{getSortIcon('account_number')}</span>
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold cursor-pointer hover:text-primary-600 select-none"
                    onClick={() => handleSort('account_name')}>
                  Atas Nama <span className="text-slate-400 text-xs">{getSortIcon('account_name')}</span>
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Cabang</th>
                <th className="text-left px-4 py-3 text-sm font-semibold cursor-pointer hover:text-primary-600 select-none"
                    onClick={() => handleSort('sort_order')}>
                  Urutan <span className="text-slate-400 text-xs">{getSortIcon('sort_order')}</span>
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold cursor-pointer hover:text-primary-600 select-none"
                    onClick={() => handleSort('is_active')}>
                  Status <span className="text-slate-400 text-xs">{getSortIcon('is_active')}</span>
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {accounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    Belum ada rekening bank
                  </td>
                </tr>
              ) : (
                accounts.map(account => (
                  <tr key={account.id} className="hover:bg-slate-50">
                    <td className="px-4 py-4 font-medium">{account.bank_name}</td>
                    <td className="px-4 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span>{account.account_number}</span>
                          <button
                            onClick={() => copyAccountNumber(account.account_number)}
                            className="text-slate-400 hover:text-slate-600 text-xs flex items-center justify-center w-5 h-5"
                            title="Salin No. Rekening"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M16 4h1a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1" />
                              <rect x="8" y="2" width="8" height="4" rx="1" />
                            </svg>
                          </button>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm">{account.account_name}</td>
                    <td className="px-4 py-4 text-sm text-slate-500">{account.branch || '-'}</td>
                    <td className="px-4 py-4 text-sm">{account.sort_order}</td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => handleToggleStatus(account.id)}
                        className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
account.is_active
                            ? 'bg-success-100 text-success-700 hover:bg-success-200'
                            : 'bg-danger-100 text-danger-700 hover:bg-danger-200'
                        }`}
                        title={account.is_active ? 'Klik untuk nonaktifkan' : 'Klik untuk aktifkan'}
                      >
                        {account.is_active ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                         <button onClick={() => openEditModal(account)} className="text-primary-600 hover:underline text-sm">Edit</button>
                         <button onClick={() => setDeleteConfirm({ open: true, id: account.id })} className="text-danger-600 hover:underline text-sm">Hapus</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editingAccount ? 'Edit Rekening Bank' : 'Tambah Rekening Bank'}</h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-500 hover:text-slate-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nama Bank <span className="text-danger-500">*</span></label>
                  <input required value={formData.bank_name} onChange={e => setFormData({...formData, bank_name: e.target.value})}
                    className={`w-full border border-slate-300 rounded-xl px-3 py-2 ${formErrors.bank_name ? 'border-danger-500' : ''}`} />
                  {formErrors.bank_name && <p className="text-danger-500 text-xs mt-1">{formErrors.bank_name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">No. Rekening <span className="text-danger-500">*</span></label>
                  <input required value={formData.account_number} onChange={e => setFormData({...formData, account_number: e.target.value})}
                    className={`w-full border border-slate-300 rounded-xl px-3 py-2 ${formErrors.account_number ? 'border-danger-500' : ''}`} />
                  {formErrors.account_number && <p className="text-danger-500 text-xs mt-1">{formErrors.account_number}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Atas Nama <span className="text-danger-500">*</span></label>
                  <input required value={formData.account_name} onChange={e => setFormData({...formData, account_name: e.target.value})}
                    className={`w-full border border-slate-300 rounded-xl px-3 py-2 ${formErrors.account_name ? 'border-danger-500' : ''}`} />
                  {formErrors.account_name && <p className="text-danger-500 text-xs mt-1">{formErrors.account_name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cabang</label>
                  <input value={formData.branch} onChange={e => setFormData({...formData, branch: e.target.value})}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2" />
                </div>
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} />
                  <span className="text-sm">Aktif</span>
                </label>
                <div>
                  <label className="block text-sm font-medium mb-1">Urutan</label>
                  <input type="number" value={formData.sort_order} onChange={e => setFormData({...formData, sort_order: Number(e.target.value)})}
                    className="border rounded px-3 py-2 w-24" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded hover:bg-slate-50">
                  Batal
                </button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:bg-slate-300">
                  {saving ? 'Menyimpan...' : (editingAccount ? 'Simpan Perubahan' : 'Tambah Rekening')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={deleteConfirm.open}
        title="Hapus Rekening"
        message="Apakah Anda yakin ingin menghapus rekening bank ini?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ open: false, id: null })}
      />
    </div>
  );
}
