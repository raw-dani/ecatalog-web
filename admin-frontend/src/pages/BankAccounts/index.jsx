import { useEffect, useState } from 'react';
import { getBankAccounts, createBankAccount, updateBankAccount, deleteBankAccount } from '../../services/adminService';

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
        <div className="h-8 bg-gray-200 rounded w-1/4" />
        <div className="h-10 bg-gray-200 rounded w-32" />
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="flex gap-4">
              <div className="h-6 bg-gray-200 rounded w-1/6" />
              <div className="h-6 bg-gray-200 rounded w-1/6" />
              <div className="h-6 bg-gray-200 rounded w-1/6" />
              <div className="h-6 bg-gray-200 rounded w-1/6" />
              <div className="h-6 bg-gray-200 rounded w-16" />
              <div className="h-6 bg-gray-200 rounded w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function BankAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    getBankAccounts()
      .then(data => setAccounts(data.data || data))
      .finally(() => setLoading(false));
  }, []);

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
      } else {
        const result = await createBankAccount(payload);
        setAccounts([result.data || result, ...accounts]);
      }

      setModalOpen(false);
    } catch (err) {
      alert('Gagal menyimpan: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Hapus rekening ini?')) {
      try {
        await deleteBankAccount(id);
        setAccounts(accounts.filter(a => a.id !== id));
      } catch (err) {
        alert('Gagal menghapus: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  if (loading) return <Skeleton />;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Rekening Bank</h1>
        <button onClick={openCreateModal} className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
          + Tambah Rekening
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold">Bank</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">No. Rekening</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Atas Nama</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Cabang</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Urutan</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Status</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {accounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Belum ada rekening bank
                  </td>
                </tr>
              ) : (
                accounts.map(account => (
                  <tr key={account.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 font-medium">{account.bank_name}</td>
                    <td className="px-4 py-4 text-sm">{account.account_number}</td>
                    <td className="px-4 py-4 text-sm">{account.account_name}</td>
                    <td className="px-4 py-4 text-sm text-gray-500">{account.branch || '-'}</td>
                    <td className="px-4 py-4 text-sm">{account.sort_order}</td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                         account.is_active ? 'bg-success-100 text-success-800' : 'bg-danger-100 text-danger-800'
                      }`}>
                        {account.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                         <button onClick={() => openEditModal(account)} className="text-primary-600 hover:underline text-sm">Edit</button>
                         <button onClick={() => handleDelete(account.id)} className="text-danger-600 hover:underline text-sm">Hapus</button>
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
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editingAccount ? 'Edit Rekening Bank' : 'Tambah Rekening Bank'}</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nama Bank <span className="text-danger-500">*</span></label>
                  <input required value={formData.bank_name} onChange={e => setFormData({...formData, bank_name: e.target.value})}
                    className={`w-full border rounded px-3 py-2 ${formErrors.bank_name ? 'border-danger-500' : ''}`} />
                  {formErrors.bank_name && <p className="text-danger-500 text-xs mt-1">{formErrors.bank_name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">No. Rekening <span className="text-danger-500">*</span></label>
                  <input required value={formData.account_number} onChange={e => setFormData({...formData, account_number: e.target.value})}
                    className={`w-full border rounded px-3 py-2 ${formErrors.account_number ? 'border-danger-500' : ''}`} />
                  {formErrors.account_number && <p className="text-danger-500 text-xs mt-1">{formErrors.account_number}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Atas Nama <span className="text-danger-500">*</span></label>
                  <input required value={formData.account_name} onChange={e => setFormData({...formData, account_name: e.target.value})}
                    className={`w-full border rounded px-3 py-2 ${formErrors.account_name ? 'border-danger-500' : ''}`} />
                  {formErrors.account_name && <p className="text-danger-500 text-xs mt-1">{formErrors.account_name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cabang</label>
                  <input value={formData.branch} onChange={e => setFormData({...formData, branch: e.target.value})}
                    className="w-full border rounded px-3 py-2" />
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
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded hover:bg-gray-50">
                  Batal
                </button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:bg-gray-300">
                  {saving ? 'Menyimpan...' : (editingAccount ? 'Simpan Perubahan' : 'Tambah Rekening')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}