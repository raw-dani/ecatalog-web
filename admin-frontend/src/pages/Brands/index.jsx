import { useEffect, useState, useCallback } from 'react';
import { getBrands, createBrand, updateBrand, deleteBrand, uploadBrandLogo, toggleBrandStatus } from '../../services/adminService';
import { useToast } from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';

const emptyForm = {
  name: '',
  slug: '',
  description: '',
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
          {[1,2,3,4].map(i => (
            <div key={i} className="flex gap-4">
              <div className="h-6 bg-slate-200 rounded w-1/4" />
              <div className="h-6 bg-slate-200 rounded w-1/5" />
              <div className="h-6 bg-slate-200 rounded w-1/3" />
              <div className="h-6 bg-slate-200 rounded w-16" />
              <div className="h-6 bg-slate-200 rounded w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Brands() {
  const { addToast } = useToast();
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [formErrors, setFormErrors] = useState({});
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Search & filter
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, total: 0 });
  const [perPage, setPerPage] = useState(20);

  // Sorting
  const [sortField, setSortField] = useState('sort_order');
  const [sortDirection, setSortDirection] = useState('asc');

  // Confirm modals
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });

  const fetchBrands = useCallback(async (page = 1) => {
    const params = { page, per_page: perPage, sort_field: sortField, sort_direction: sortDirection, paginate: true };
    if (search) params.search = search;
    if (filterStatus) params.is_active = filterStatus;

    const data = await getBrands(params);
    setBrands(data.data || []);
    setPagination({
      currentPage: data.meta?.current_page || data.current_page || 1,
      lastPage: data.meta?.last_page || data.last_page || 1,
      total: data.meta?.total || data.total || 0,
    });
  }, [search, filterStatus, perPage, sortField, sortDirection]);

  useEffect(() => {
    fetchBrands(1).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading) fetchBrands(1);
  }, [search, filterStatus, perPage, sortField, sortDirection]);

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
          <path d="M12 19V5M5 12l7 7 7-7" />
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
    if (!formData.name.trim()) errors.name = 'Nama brand wajib diisi';
    if (!formData.slug.trim()) errors.slug = 'Slug wajib diisi';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openCreateModal = () => {
    setEditingBrand(null);
    setFormData({ ...emptyForm });
    setFormErrors({});
    setLogoFile(null);
    setLogoPreview(null);
    setModalOpen(true);
  };

  const openEditModal = (brand) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name || '',
      slug: brand.slug || '',
      description: brand.description || '',
      is_active: brand.is_active ?? true,
      sort_order: brand.sort_order ?? 0,
    });
    setFormErrors({});
    setLogoFile(null);
    setLogoPreview(null);
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
      };

      if (editingBrand) {
        const result = await updateBrand(editingBrand.id, payload);
        setBrands(brands.map(b => b.id === editingBrand.id ? { ...b, ...result.data || result } : b));
        addToast('Brand berhasil diperbarui', 'success');
      } else {
        const result = await createBrand(payload);
        setBrands([result.data || result, ...brands]);
        addToast('Brand berhasil dibuat', 'success');
      }

      setModalOpen(false);

      if (logoFile && editingBrand) {
        await handleUploadLogo(editingBrand.id);
      }
    } catch (err) {
      addToast('Gagal menyimpan: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadLogo = async (brandId) => {
    if (!logoFile || !brandId) return;
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('logo', logoFile);
      await uploadBrandLogo(brandId, formData);
      setLogoFile(null);
      setLogoPreview(null);
      await fetchBrands(pagination.currentPage);
      addToast('Logo brand berhasil diupload', 'success');
    } catch (err) {
      addToast('Gagal upload logo: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleDelete = async () => {
    const { id } = deleteConfirm;
    try {
      await deleteBrand(id);
      setBrands(brands.filter(b => b.id !== id));
      addToast('Brand berhasil dihapus', 'success');
    } catch (err) {
      addToast('Gagal menghapus: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setDeleteConfirm({ open: false, id: null });
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const result = await toggleBrandStatus(id);
      const updated = result.data || result;
      setBrands(brands.map(b => b.id === id ? { ...b, is_active: updated.is_active } : b));
      addToast(`Brand ${updated.is_active ? 'diaktifkan' : 'dinonaktifkan'}`, 'success');
    } catch (err) {
      addToast('Gagal mengubah status: ' + (err.response?.data?.message || err.message), 'error');
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

  if (loading) return <Skeleton />;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Manajemen Brand</h1>
        <button onClick={openCreateModal} className="bg-primary-600 text-white px-4 py-2 rounded-xl hover:bg-primary-700">
          + Tambah Brand
        </button>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-xl shadow mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Cari Brand</label>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari nama brand..."
              className="w-full border border-slate-300 rounded-xl px-3 py-2"
            />
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

      {/* Brands Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold cursor-pointer hover:text-primary-600 select-none"
                    onClick={() => handleSort('name')}>
                  Nama <span className="text-slate-400 text-xs">{getSortIcon('name')}</span>
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold cursor-pointer hover:text-primary-600 select-none"
                    onClick={() => handleSort('slug')}>
                  Slug <span className="text-slate-400 text-xs">{getSortIcon('slug')}</span>
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Logo</th>
                <th className="text-left px-4 py-3 text-sm font-semibold cursor-pointer hover:text-primary-600 select-none"
                    onClick={() => handleSort('sort_order')}>
                  Urutan <span className="text-slate-400 text-xs">{getSortIcon('sort_order')}</span>
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Deskripsi</th>
                <th className="text-left px-4 py-3 text-sm font-semibold cursor-pointer hover:text-primary-600 select-none"
                    onClick={() => handleSort('is_active')}>
                  Status <span className="text-slate-400 text-xs">{getSortIcon('is_active')}</span>
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {brands.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    Belum ada brand
                  </td>
                </tr>
              ) : (
                brands.map(brand => (
                  <tr key={brand.id} className="hover:bg-slate-50">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {brand.logo && (
                          <img src={brand.logo} alt="" className="w-8 h-8 object-cover rounded" />
                        )}
                        <span className="font-medium">{brand.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm">{brand.slug}</td>
                    <td className="px-4 py-4 text-sm">
                      {brand.logo ? (
                        <img src={brand.logo} alt={brand.name} className="w-10 h-10 object-cover rounded border" />
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm">{brand.sort_order}</td>
                    <td className="px-4 py-4 text-sm text-slate-500 max-w-xs truncate">{brand.description || '-'}</td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => handleToggleStatus(brand.id)}
                        className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                          brand.is_active
                            ? 'bg-success-100 text-success-800 hover:bg-success-200'
                            : 'bg-danger-100 text-danger-800 hover:bg-danger-200'
                        }`}
                        title={brand.is_active ? 'Klik untuk nonaktifkan' : 'Klik untuk aktifkan'}
                      >
                        {brand.is_active ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                         <button onClick={() => openEditModal(brand)} className="text-primary-600 hover:underline text-sm">Edit</button>
                         <button onClick={() => setDeleteConfirm({ open: true, id: brand.id })} className="text-danger-600 hover:underline text-sm">Hapus</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.lastPage > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <span className="text-sm text-slate-600">
              Total {pagination.total} brand (Halaman {pagination.currentPage} dari {pagination.lastPage})
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => fetchBrands(pagination.currentPage - 1)}
                disabled={pagination.currentPage <= 1}
                className="px-3 py-1 border rounded text-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sebelumnya
              </button>
              <span className="px-3 py-1 text-sm">{pagination.currentPage} / {pagination.lastPage}</span>
              <button
                onClick={() => fetchBrands(pagination.currentPage + 1)}
                disabled={pagination.currentPage >= pagination.lastPage}
                className="px-3 py-1 border rounded text-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
              <h2 className="text-xl font-bold">{editingBrand ? 'Edit Brand' : 'Tambah Brand'}</h2>
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
                  <label className="block text-sm font-medium mb-1">Nama Brand <span className="text-danger-500">*</span></label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                    className={`w-full border border-slate-300 rounded-xl px-3 py-2 ${formErrors.name ? 'border-danger-500' : ''}`} />
                  {formErrors.name && <p className="text-danger-500 text-xs mt-1">{formErrors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Slug <span className="text-danger-500">*</span></label>
                  <input required value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})}
                    className={`w-full border border-slate-300 rounded-xl px-3 py-2 ${formErrors.slug ? 'border-danger-500' : ''}`} />
                  {formErrors.slug && <p className="text-danger-500 text-xs mt-1">{formErrors.slug}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Deskripsi</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2" rows="3" />
              </div>

              {/* Logo */}
              <div>
                <label className="block text-sm font-medium mb-2">Logo Brand</label>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Preview" className="w-20 h-20 object-cover rounded border" />
                    ) : editingBrand?.logo ? (
                      <img src={editingBrand.logo} alt="Current" className="w-20 h-20 object-cover rounded border" />
                    ) : (
                      <div className="w-20 h-20 border-2 border-dashed border-slate-300 rounded flex items-center justify-center text-slate-400 text-xs">
                        No Logo
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/jpg,image/gif,image/svg,image/webp"
                      onChange={handleLogoChange}
                      className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                    />
                    <p className="text-xs text-slate-400 mt-1">Format: JPG, PNG, GIF, SVG, WebP. Maks: 2MB</p>
                  </div>
                </div>
                 {uploadingLogo && <p className="text-sm text-primary-600 mt-2">Mengupload logo...</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Urutan</label>
                  <input type="number" value={formData.sort_order} onChange={e => setFormData({...formData, sort_order: Number(e.target.value)})}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2" />
                </div>
                <div className="flex items-end gap-4 pb-2">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} />
                    <span className="text-sm">Aktif</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border border-slate-300 rounded-xl hover:bg-slate-50 flex items-center justify-center min-w-[100px]">
                  Batal
                </button>
                <button type="submit" disabled={saving || uploadingLogo}
                  className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:bg-slate-300 flex items-center justify-center min-w-[140px]">
                  {saving ? 'Menyimpan...' : (editingBrand ? 'Simpan Perubahan' : 'Buat Brand')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={deleteConfirm.open}
        title="Hapus Brand"
        message="Apakah Anda yakin ingin menghapus brand ini? Produk yang menggunakan brand ini akan tetap tersimpan, tetapi brand akan dihapus."
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ open: false, id: null })}
      />
    </div>
  );
}
