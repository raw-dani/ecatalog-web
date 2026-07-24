import { useEffect, useState, useCallback, useRef } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory, uploadCategoryImage } from '../../services/adminService';

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
        <div className="h-8 bg-gray-200 rounded w-1/4" />
        <div className="h-10 bg-gray-200 rounded w-32" />
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 space-y-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="flex gap-4">
              <div className="h-6 bg-gray-200 rounded w-1/4" />
              <div className="h-6 bg-gray-200 rounded w-1/5" />
              <div className="h-6 bg-gray-200 rounded w-1/3" />
              <div className="h-6 bg-gray-200 rounded w-16" />
              <div className="h-6 bg-gray-200 rounded w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Categories() {
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

  // Search & pagination
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, total: 0 });

  const fetchCategories = useCallback(async (page = 1) => {
    const params = { page };
    if (search) params.search = search;

    const data = await getCategories(params);
    setCategories(data.data || []);
    setPagination({
      currentPage: data.meta?.current_page || data.current_page || 1,
      lastPage: data.meta?.last_page || data.last_page || 1,
      total: data.meta?.total || data.total || 0,
    });
  }, [search]);

  useEffect(() => {
    Promise.all([
      fetchCategories(1),
      // Fetch all for parent dropdown (no pagination)
      getCategories({ paginate: false }).then(data => setAllCategories(data.data || data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading) fetchCategories(1);
  }, [search]);

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
      } else {
        const result = await createCategory(payload);
        setCategories([result.data || result, ...categories]);
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
      alert('Gagal menyimpan: ' + (err.response?.data?.message || err.message));
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
      const result = await uploadCategoryImage(categoryId, formData);
      setImageFile(null);
      setImagePreview(null);
      await fetchCategories(pagination.currentPage);
    } catch (err) {
      alert('Gagal upload gambar: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Hapus kategori ini? Semua sub-kategori akan menjadi root.')) {
      try {
        await deleteCategory(id);
        setCategories(categories.filter(c => c.id !== id));
      } catch (err) {
        alert('Gagal menghapus: ' + (err.response?.data?.message || err.message));
      }
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
        <button onClick={openCreateModal} className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
          + Tambah Kategori
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="max-w-sm">
          <label className="block text-sm font-medium mb-1">Cari Kategori</label>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama kategori..."
            className="w-full border rounded px-3 py-2"
          />
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold">Nama</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Slug</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Induk</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Urutan</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Deskripsi</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Status</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Belum ada kategori
                  </td>
                </tr>
              ) : (
                categories.map(category => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {category.image && (
                          <img src={category.image} alt="" className="w-8 h-8 object-cover rounded" />
                        )}
                        <span className="font-medium">{category.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm">{category.slug}</td>
                    <td className="px-4 py-4 text-sm text-gray-500">{getParentName(category.parent_id)}</td>
                    <td className="px-4 py-4 text-sm">{category.sort_order}</td>
                    <td className="px-4 py-4 text-sm text-gray-500 max-w-xs truncate">{category.description || '-'}</td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                         category.is_active ? 'bg-success-100 text-success-800' : 'bg-danger-100 text-danger-800'
                      }`}>
                        {category.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                         <button onClick={() => openEditModal(category)} className="text-primary-600 hover:underline text-sm">Edit</button>
                         <button onClick={() => handleDelete(category.id)} className="text-danger-600 hover:underline text-sm">Hapus</button>
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
            <span className="text-sm text-gray-600">Total {pagination.total} kategori</span>
            <div className="flex gap-2">
              <button
                onClick={() => fetchCategories(pagination.currentPage - 1)}
                disabled={pagination.currentPage <= 1}
                className="px-3 py-1 border rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sebelumnya
              </button>
              <span className="px-3 py-1 text-sm">{pagination.currentPage} / {pagination.lastPage}</span>
              <button
                onClick={() => fetchCategories(pagination.currentPage + 1)}
                disabled={pagination.currentPage >= pagination.lastPage}
                className="px-3 py-1 border rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editingCategory ? 'Edit Kategori' : 'Tambah Kategori'}</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nama <span className="text-danger-500">*</span></label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                    className={`w-full border rounded px-3 py-2 ${formErrors.name ? 'border-danger-500' : ''}`} />
                  {formErrors.name && <p className="text-danger-500 text-xs mt-1">{formErrors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Slug <span className="text-danger-500">*</span></label>
                  <input required value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})}
                    className={`w-full border rounded px-3 py-2 ${formErrors.slug ? 'border-danger-500' : ''}`} />
                  {formErrors.slug && <p className="text-danger-500 text-xs mt-1">{formErrors.slug}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Kategori Induk</label>
                  <select value={formData.parent_id} onChange={e => setFormData({...formData, parent_id: e.target.value})}
                    className={`w-full border rounded px-3 py-2 ${formErrors.parent_id ? 'border-danger-500' : ''}`}>
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
                    className="w-full border rounded px-3 py-2" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Deskripsi</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full border rounded px-3 py-2" rows="3" />
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
                      <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400 text-xs">
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
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                    />
                    <p className="text-xs text-gray-400 mt-1">Format: JPG, PNG, GIF, SVG, WebP. Maks: 2MB</p>
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
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded hover:bg-gray-50">
                  Batal
                </button>
                <button type="submit" disabled={saving || uploadingImage}
                   className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:bg-gray-300">
                  {saving ? 'Menyimpan...' : (editingCategory ? 'Simpan Perubahan' : 'Buat Kategori')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}