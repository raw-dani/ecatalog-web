import { useEffect, useState, useCallback } from 'react';
import { getProducts, getCategories, createProduct, updateProduct, deleteProduct, uploadProductImages, deleteProductImage } from '../../services/adminService';

const emptyForm = {
  name: '',
  slug: '',
  category_id: '',
  price: '',
  discount_price: '',
  stock: '',
  min_order: 1,
  unit: 'pcs',
  sku: '',
  description: '',
  specifications: [],
  meta_title: '',
  meta_description: '',
  is_active: true,
  is_featured: false,
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
          {[1,2,3,4,5].map(i => (
            <div key={i} className="flex gap-4">
              <div className="h-6 bg-gray-200 rounded w-1/3" />
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

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [formErrors, setFormErrors] = useState({});
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Search & filter state
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, total: 0 });

  const fetchProducts = useCallback(async (page = 1) => {
    const params = { page };
    if (search) params.search = search;
    if (filterCategory) params.category_id = filterCategory;
    if (filterStatus) params.is_active = filterStatus;

    const data = await getProducts(params);
    setProducts(data.data || []);
    setPagination({
      currentPage: data.meta?.current_page || data.current_page || 1,
      lastPage: data.meta?.last_page || data.last_page || 1,
      total: data.meta?.total || data.total || 0,
    });
  }, [search, filterCategory, filterStatus]);

  useEffect(() => {
    Promise.all([
      fetchProducts(1),
      getCategories().then(data => setCategories(data.data || data)),
    ]).finally(() => setLoading(false));
  }, []);

  // Refetch when filters change
  useEffect(() => {
    if (!loading) fetchProducts(1);
  }, [search, filterCategory, filterStatus]);

  const validate = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Nama produk wajib diisi';
    if (!formData.slug.trim()) errors.slug = 'Slug wajib diisi';
    if (!formData.category_id) errors.category_id = 'Kategori wajib dipilih';
    if (!formData.price || Number(formData.price) < 0) errors.price = 'Harga harus diisi dan >= 0';
    if (formData.discount_price && Number(formData.discount_price) < 0) errors.discount_price = 'Harga diskon harus >= 0';
    if (formData.discount_price && Number(formData.discount_price) >= Number(formData.price)) errors.discount_price = 'Harga diskon harus lebih kecil dari harga';
    if (!formData.stock || Number(formData.stock) < 0) errors.stock = 'Stok harus diisi dan >= 0';
    if (formData.sku && formData.sku.length > 100) errors.sku = 'SKU maksimal 100 karakter';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({ ...emptyForm });
    setFormErrors({});
    setSelectedImages([]);
    setImagePreviews([]);
    setModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      slug: product.slug || '',
      category_id: product.category_id || '',
      price: product.price || '',
      discount_price: product.discount_price || '',
      stock: product.stock ?? '',
      min_order: product.min_order ?? 1,
      unit: product.unit || 'pcs',
      sku: product.sku || '',
      description: product.description || '',
      specifications: product.specifications || [],
      meta_title: product.meta_title || '',
      meta_description: product.meta_description || '',
      is_active: product.is_active ?? true,
      is_featured: product.is_featured ?? false,
    });
    setFormErrors({});
    setSelectedImages([]);
    setImagePreviews([]);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        ...formData,
        category_id: Number(formData.category_id),
        price: Number(formData.price),
        discount_price: formData.discount_price ? Number(formData.discount_price) : null,
        stock: Number(formData.stock),
        min_order: Number(formData.min_order),
        specifications: formData.specifications.length > 0 ? formData.specifications : null,
      };

      if (editingProduct) {
        const result = await updateProduct(editingProduct.id, payload);
        setProducts(products.map(p => p.id === editingProduct.id ? { ...p, ...result.data || result } : p));
      } else {
        const result = await createProduct(payload);
        setProducts([result.data || result, ...products]);
      }

      setModalOpen(false);

      // Upload images if any
      if (selectedImages.length > 0) {
        const productId = editingProduct ? editingProduct.id : (products[0]?.id || null);
        // For newly created product, refetch to get correct ID
        if (!editingProduct) {
          await fetchProducts(pagination.currentPage);
        } else {
          await uploadImages(productId);
        }
      }
    } catch (err) {
      alert('Gagal menyimpan: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const uploadImages = async (productId) => {
    if (selectedImages.length === 0) return;
    setUploadingImages(true);
    try {
      const formData = new FormData();
      selectedImages.forEach(file => formData.append('images[]', file));
      await uploadProductImages(productId, formData);
      setSelectedImages([]);
      setImagePreviews([]);
      await fetchProducts(pagination.currentPage);
    } catch (err) {
      alert('Gagal upload gambar: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploadingImages(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Hapus produk ini?')) {
      try {
        await deleteProduct(id);
        setProducts(products.filter(p => p.id !== id));
      } catch (err) {
        alert('Gagal menghapus: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedImages(prev => [...prev, ...files]);
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const removeSelectedImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleDeleteProductImage = async (productId, imagePath) => {
    if (window.confirm('Hapus gambar ini?')) {
      try {
        await deleteProductImage(productId, imagePath);
        await fetchProducts(pagination.currentPage);
      } catch (err) {
        alert('Gagal hapus gambar: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const addSpecification = () => {
    setFormData(prev => ({
      ...prev,
      specifications: [...prev.specifications, { key: '', value: '' }],
    }));
  };

  const updateSpecification = (index, field, value) => {
    setFormData(prev => {
      const specs = [...prev.specifications];
      specs[index] = { ...specs[index], [field]: value };
      return { ...prev, specifications: specs };
    });
  };

  const removeSpecification = (index) => {
    setFormData(prev => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== index),
    }));
  };

  if (loading) return <Skeleton />;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Manajemen Produk</h1>
        <button onClick={openCreateModal} className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
          + Tambah Produk
        </button>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Cari</label>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari nama produk..."
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Kategori</label>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="w-full border rounded px-3 py-2">
              <option value="">Semua Kategori</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full border rounded px-3 py-2">
              <option value="">Semua Status</option>
              <option value="1">Aktif</option>
              <option value="0">Nonaktif</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold">Nama</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Kategori</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Harga</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Diskon</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Stok</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Unggulan</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Status</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    Belum ada produk
                  </td>
                </tr>
              ) : (
                products.map(product => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {product.images && product.images.length > 0 && (
                          <img src={product.images[0]} alt="" className="w-10 h-10 object-cover rounded" />
                        )}
                        <span className="font-medium">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm">{product.category?.name}</td>
                    <td className="px-4 py-4 text-sm">Rp {Number(product.price).toLocaleString('id-ID')}</td>
                    <td className="px-4 py-4 text-sm">
                      {product.discount_price ? (
                        <span className="text-success-600">Rp {Number(product.discount_price).toLocaleString('id-ID')}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <span className={product.stock < 5 ? 'text-danger-600 font-semibold' : ''}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      {product.is_featured ? (
                         <span className="text-warning-500">★ Unggulan</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                         product.is_active ? 'bg-success-100 text-success-800' : 'bg-danger-100 text-danger-800'
                      }`}>
                        {product.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                         <button onClick={() => openEditModal(product)} className="text-primary-600 hover:underline text-sm">Edit</button>
                         <button onClick={() => handleDelete(product.id)} className="text-danger-600 hover:underline text-sm">Hapus</button>
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
            <span className="text-sm text-gray-600">
              Total {pagination.total} produk
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => fetchProducts(pagination.currentPage - 1)}
                disabled={pagination.currentPage <= 1}
                className="px-3 py-1 border rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sebelumnya
              </button>
              <span className="px-3 py-1 text-sm">
                {pagination.currentPage} / {pagination.lastPage}
              </span>
              <button
                onClick={() => fetchProducts(pagination.currentPage + 1)}
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
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editingProduct ? 'Edit Produk' : 'Tambah Produk'}</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nama Produk <span className="text-danger-500">*</span></label>
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
                  <label className="block text-sm font-medium mb-1">Kategori <span className="text-danger-500">*</span></label>
                  <select value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})}
                    className={`w-full border rounded px-3 py-2 ${formErrors.category_id ? 'border-danger-500' : ''}`}>
                    <option value="">Pilih Kategori</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  {formErrors.category_id && <p className="text-danger-500 text-xs mt-1">{formErrors.category_id}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">SKU</label>
                  <input value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})}
                    className={`w-full border rounded px-3 py-2 ${formErrors.sku ? 'border-danger-500' : ''}`} placeholder="Kode unik produk" />
                  {formErrors.sku && <p className="text-danger-500 text-xs mt-1">{formErrors.sku}</p>}
                </div>
              </div>

              {/* Pricing & Stock */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Harga <span className="text-danger-500">*</span></label>
                  <input type="number" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})}
                    className={`w-full border rounded px-3 py-2 ${formErrors.price ? 'border-danger-500' : ''}`} />
                  {formErrors.price && <p className="text-danger-500 text-xs mt-1">{formErrors.price}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Harga Diskon</label>
                  <input type="number" value={formData.discount_price} onChange={e => setFormData({...formData, discount_price: e.target.value})}
                    className={`w-full border rounded px-3 py-2 ${formErrors.discount_price ? 'border-danger-500' : ''}`} />
                  {formErrors.discount_price && <p className="text-danger-500 text-xs mt-1">{formErrors.discount_price}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Stok <span className="text-danger-500">*</span></label>
                  <input type="number" required value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})}
                    className={`w-full border rounded px-3 py-2 ${formErrors.stock ? 'border-danger-500' : ''}`} />
                  {formErrors.stock && <p className="text-danger-500 text-xs mt-1">{formErrors.stock}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Min. Order</label>
                  <input type="number" value={formData.min_order} onChange={e => setFormData({...formData, min_order: e.target.value})}
                    className="w-full border rounded px-3 py-2" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Unit</label>
                  <input value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})}
                    className="w-full border rounded px-3 py-2" placeholder="pcs, kg, meter, dll" />
                </div>
                <div className="flex items-end gap-4 pb-2">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} />
                    <span className="text-sm">Aktif</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={formData.is_featured} onChange={e => setFormData({...formData, is_featured: e.target.checked})} />
                    <span className="text-sm">Unggulan</span>
                  </label>
                </div>
              </div>

              {/* Images */}
              <div>
                <label className="block text-sm font-medium mb-2">Gambar Produk</label>
                <div className="flex flex-wrap gap-3 mb-3">
                  {editingProduct && editingProduct.images && editingProduct.images.map((img, i) => (
                    <div key={i} className="relative group">
                      <img src={img} alt="" className="w-20 h-20 object-cover rounded border" />
                      <button
                        type="button"
                        onClick={() => handleDeleteProductImage(editingProduct.id, img)}
                         className="absolute -top-2 -right-2 bg-danger-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {imagePreviews.map((preview, i) => (
                    <div key={`new-${i}`} className="relative">
                      <img src={preview} alt="" className="w-20 h-20 object-cover rounded border" />
                      <button
                        type="button"
                        onClick={() => removeSelectedImage(i)}
                         className="absolute -top-2 -right-2 bg-danger-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                   <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded flex items-center justify-center cursor-pointer hover:border-primary-500">
                    <span className="text-2xl text-gray-400">+</span>
                    <input type="file" accept="image/jpeg,image/png,image/jpg,image/gif,image/webp" multiple onChange={handleImageSelect} className="hidden" />
                  </label>
                </div>
                {uploadingImages && <p className="text-sm text-primary-600">Mengupload gambar...</p>}
                <p className="text-xs text-gray-400 mt-1">Format yang didukung: <strong>JPG, PNG, GIF, WebP</strong>. AVIF tidak didukung.</p>
              </div>

              {/* Specifications */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">Spesifikasi Produk</label>
                  <button type="button" onClick={addSpecification} className="text-primary-600 text-sm hover:underline">
                    + Tambah Spesifikasi
                  </button>
                </div>
                {formData.specifications.length > 0 ? (
                  <div className="space-y-2">
                    {formData.specifications.map((spec, i) => (
                      <div key={i} className="flex gap-2 items-start">
                        <input
                          value={spec.key} onChange={e => updateSpecification(i, 'key', e.target.value)}
                          placeholder="Label (misal: Berat)"
                          className="flex-1 border rounded px-3 py-2 text-sm"
                        />
                        <input
                          value={spec.value} onChange={e => updateSpecification(i, 'value', e.target.value)}
                          placeholder="Nilai (misal: 1 kg)"
                          className="flex-1 border rounded px-3 py-2 text-sm"
                        />
                        <button type="button" onClick={() => removeSpecification(i)} className="text-danger-500 hover:text-danger-700 px-2 py-2">
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">Belum ada spesifikasi</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-1">Deskripsi</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full border rounded px-3 py-2" rows="3" />
              </div>

              {/* Meta */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Meta Title (SEO)</label>
                  <input value={formData.meta_title} onChange={e => setFormData({...formData, meta_title: e.target.value})}
                    className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Meta Description (SEO)</label>
                  <textarea value={formData.meta_description} onChange={e => setFormData({...formData, meta_description: e.target.value})}
                    className="w-full border rounded px-3 py-2" rows="2" />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded hover:bg-gray-50">
                  Batal
                </button>
                <button type="submit" disabled={saving || uploadingImages}
                  className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:bg-gray-300">
                  {saving ? 'Menyimpan...' : (editingProduct ? 'Simpan Perubahan' : 'Buat Produk')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}