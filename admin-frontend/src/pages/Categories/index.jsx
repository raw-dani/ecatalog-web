import { useEffect, useState, useCallback, useRef } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory, uploadCategoryImage, toggleCategoryStatus, exportCategoriesCsv } from '../../services/adminService';
import { useToast } from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';

const emptyForm = {
  name: '',
  slug: '',
  description: '',
  image: '',
  parent_id: '',
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

export default function Categories() {
  const { addToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [formErrors, setFormErrors] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

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

  const fetchCategories = useCallback(async (page = 1) => {
    const params = { page, per_page: perPage, sort_field: sortField, sort_direction: sortDirection, paginate: true };
    if (search) params.search = search;
    if (filterStatus) params.is_active = filterStatus;

    const data = await getCategories(params);
    setCategories(data.data || []);
    setPagination({
      currentPage: data.meta?.current_page || data.current_page || 1,
      lastPage: data.meta?.last_page || data.last_page || 1,
      total: data.meta?.total || data.total || 0,
    });
  }, [search, filterStatus, perPage, sortField, sortDirection]);

  useEffect(() => {
    Promise.all([
      fetchCategories(1),
      getCategories({ paginate: false }).then(data => setAllCategories(data.data || data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading) fetchCategories(1);
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
    if (!formData.name.trim()) errors.name = 'Nama kategori wajib diisi';
    if (!formData.slug.trim()) errors.slug = 'Slug wajib diisi';
    if (formData.parent_id === editingCategory?.id) errors.parent_id = 'Kategori tidak bisa menjadi parent dari dirinya sendiri';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({ ...emptyForm });
    setFormErrors({});
    setImageFile(null);
    setImagePreview(null);
    setModalOpen(true);
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name || '',
      slug: category.slug || '',
      description: category.description || '',
      image: category.image || '',
      parent_id: category.parent_id || '',
      is_active: category.is_active ?? true,
      sort_order: category.sort_order ?? 0,
    });
    setFormErrors({});
    setImageFile(null);
    setImagePreview(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        ...formData,
        parent_id: formData.parent_id ? Number(formData.parent_id) : null,
        sort_order: Number(formData.sort_order),
      };

      if (editingCategory) {
        const result = await updateCategory(editingCategory.id, payload);
        setCategories(categories.map(c => c.id === editingCategory.id ? { ...c, ...result.data || result } : c));
        addToast('Kategori berhasil diperbarui', 'success');
      } else {
        const result = await createCategory(payload);
        setCategories([result.data || result, ...categories]);
        addToast('Kategori berhasil dibuat', 'success');
      }

      setModalOpen(false);

      // Upload image if selected
      if (imageFile) {
        const catId = editingCategory ? editingCategory.id : null;
        if (!editingCategory) {
          await fetchCategories(pagination.currentPage);
        } else {
          await handleUploadImage(catId);
        }
      }
    } catch (err) {
      addToast('Gagal menyimpan: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadImage = async (categoryId) => {
    if (!imageFile || !categoryId) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      await uploadCategoryImage(categoryId, formData);
      setImageFile(null);
      setImagePreview(null);
      await fetchCategories(pagination.currentPage);
      addToast('Gambar berhasil diupload', 'success');
    } catch (err) {
      addToast('Gagal upload gambar: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDelete = async () => {
    const { id } = deleteConfirm;
    try {
      await deleteCategory(id);
      setCategories(categories.filter(c => c.id !== id));
      addToast('Kategori berhasil dihapus', 'success');
    } catch (err) {
      addToast('Gagal menghapus: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setDeleteConfirm({ open: false, id: null });
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const result = await toggleCategoryStatus(id);
      const updated = result.data || result;
      setCategories(categories.map(c => c.id === id ? { ...c, is_active: updated.is_active } : c));
      addToast(`Kategori ${updated.is_active ? 'diaktifkan' : 'dinonaktifkan'}`, 'success');
    } catch (err) {
      addToast('Gagal mengubah status: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  const handleExportCsv = async () => {
    try {
      const params = {};
      if (filterStatus) params.is_active = filterStatus;

      const response = await exportCategoriesCsv(params);
      const blob = new Blob([response], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `categories-export-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      addToast('Data kategori berhasil diexport', 'success');
    } catch (err) {
      addToast('Gagal export: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const getParentName = (parentId) => {
    const parent = allCategories.find(c => c.id === parentId);
    return parent ? parent.name : '-';
  };

  if (loading) return <Skeleton />;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Manajemen Kategori</h1>
        <div className="flex gap-2">
          <button onClick={handleExportCsv} className="border border-slate-300 text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-50 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1 inline-block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export CSV
          </button>
          <button onClick={openCreateModal} className="bg-primary-600 text-white px-4 py-2 rounded-xl hover:bg-primary-700">
            + Tambah Kategori
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-xl shadow mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Cari Kategori</label>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari nama kategori..."
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

      {/* Categories Table */}
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
                <th className="text-left px-4 py-3 text-sm font-semibold">Induk</th>
                <th className="text-left px-4 py-3 text-sm font-semibold cursor-pointer hover:text-primary-600 select-none"
                    onClick={() => handleSort('sort_order')}>
                  Urutan <span className="text-slate-400 text-xs">{getSortIcon('sort_order')}</span>
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Deskripsi</th>
                <th className="text-left px-4 py-3 text-sm font-semibold cursor-pointer hover:text-primary-600 select-none"
                    onClick={() => handleSort('products_count')}>
                  Produk <span className="text-slate-400 text-xs">{getSortIcon('products_count')}</span>
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold cursor-pointer hover:text-primary-600 select-none"
                    onClick={() => handleSort('is_active')}>
                  Status <span className="text-slate-400 text-xs">{getSortIcon('is_active')}</span>
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    Belum ada kategori
                  </td>
                </tr>
              ) : (
                categories.map(category => (
                  <tr key={category.id} className="hover:bg-slate-50">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {category.image && (
                          <img src={category.image} alt="" className="w-8 h-8 object-cover rounded" />
                        )}
                        <span className="font-medium">{category.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm">{category.slug}</td>
                    <td className="px-4 py-4 text-sm text-slate-500">{getParentName(category.parent_id)}</td>
                    <td className="px-4 py-4 text-sm">{category.sort_order}</td>
                    <td className="px-4 py-4 text-sm text-slate-500 max-w-xs truncate">{category.description || '-'}</td>
                    <td className="px-4 py-4 text-sm">
                      <span className="font-medium">{category.products_count ?? 0}</span>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => handleToggleStatus(category.id)}
                        className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                          category.is_active
                            ? 'bg-success-100 text-success-800 hover:bg-success-200'
                            : 'bg-danger-100 text-danger-800 hover:bg-danger-200'
                        }`}
                        title={category.is_active ? 'Klik untuk nonaktifkan' : 'Klik untuk aktifkan'}
                      >
                        {category.is_active ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                         <button onClick={() => openEditModal(category)} className="text-primary-600 hover:underline text-sm">Edit</button>
                         <button onClick={() => setDeleteConfirm({ open: true, id: category.id })} className="text-danger-600 hover:underline text-sm">Hapus</button>
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
              Total {pagination.total} kategori (Halaman {pagination.currentPage} dari {pagination.lastPage})
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => fetchCategories(pagination.currentPage - 1)}
                disabled={pagination.currentPage <= 1}
                className="px-3 py-1 border rounded text-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sebelumnya
              </button>
              <span className="px-3 py-1 text-sm">{pagination.currentPage} / {pagination.lastPage}</span>
              <button
                onClick={() => fetchCategories(pagination.currentPage + 1)}
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
              <h2 className="text-xl font-bold">{editingCategory ? 'Edit Kategori' : 'Tambah Kategori'}</h2>
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
                  <label className="block text-sm font-medium mb-1">Nama <span className="text-danger-500">*</span></label>
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
                <div>
                  <label className="block text-sm font-medium mb-1">Kategori Induk</label>
                  <select value={formData.parent_id} onChange={e => setFormData({...formData, parent_id: e.target.value})}
                    className={`w-full border border-slate-300 rounded-xl px-3 py-2 ${formErrors.parent_id ? 'border-danger-500' : ''}`}>
                    <option value="">Tidak ada (root)</option>
                    {allCategories
                      .filter(c => editingCategory ? c.id !== editingCategory.id : true)
                      .map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))
                    }
                  </select>
                  {formErrors.parent_id && <p className="text-danger-500 text-xs mt-1">{formErrors.parent_id}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Urutan</label>
                  <input type="number" value={formData.sort_order} onChange={e => setFormData({...formData, sort_order: Number(e.target.value)})}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Deskripsi</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2" rows="3" />
              </div>

              {/* Image */}
              <div>
                <label className="block text-sm font-medium mb-2">Gambar Kategori</label>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-20 h-20 object-cover rounded border" />
                    ) : editingCategory?.image ? (
                      <img src={editingCategory.image} alt="Current" className="w-20 h-20 object-cover rounded border" />
                    ) : (
                      <div className="w-20 h-20 border-2 border-dashed border-slate-300 rounded flex items-center justify-center text-slate-400 text-xs">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                    />
                    <p className="text-xs text-slate-400 mt-1">Format: JPG, PNG, GIF, SVG, WebP. Maks: 2MB</p>
                  </div>
                </div>
                   {uploadingImage && <p className="text-sm text-primary-600 mt-2">Mengupload gambar...</p>}
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} />
                  <span className="text-sm">Aktif</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded hover:bg-slate-50">
                  Batal
                </button>
                <button type="submit" disabled={saving || uploadingImage}
                   className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:bg-slate-300">
                  {saving ? 'Menyimpan...' : (editingCategory ? 'Simpan Perubahan' : 'Buat Kategori')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={deleteConfirm.open}
        title="Hapus Kategori"
        message="Apakah Anda yakin ingin menghapus kategori ini? Semua sub-kategori akan menjadi root."
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ open: false, id: null })}
      />
    </div>
  );
}
