import { useEffect, useState, useCallback } from 'react';
import { getProducts, getCategories, createProduct, updateProduct, deleteProduct, uploadProductImages, deleteProductImage, duplicateProduct, bulkDeleteProducts, bulkToggleProductStatus, bulkToggleProductFeatured, exportProductsCsv } from '../../services/adminService';
import { useToast } from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';

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

const SORT_FIELDS = [
  { value: 'name', label: 'Nama' },
  { value: 'price', label: 'Harga' },
  { value: 'stock', label: 'Stok' },
  { value: 'is_active', label: 'Status' },
  { value: 'is_featured', label: 'Unggulan' },
  { value: 'created_at', label: 'Tanggal Dibuat' },
  { value: 'category_id', label: 'Kategori' },
];

function Skeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex justify-between mb-8">
        <div className="h-8 bg-slate-200 rounded w-1/4" />
        <div className="h-10 bg-slate-200 rounded w-32" />
      </div>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="p-4 space-y-4">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="flex gap-4">
              <div className="h-6 bg-slate-200 rounded w-1/3" />
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

export default function Products() {
  const { addToast } = useToast();
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

  // Search & filter
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterStock, setFilterStock] = useState('');
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
  const [bulkFeaturedConfirm, setBulkFeaturedConfirm] = useState({ open: false, isFeatured: false });

  const fetchProducts = useCallback(async (page = 1) => {
    const params = { page, per_page: perPage, sort_field: sortField, sort_direction: sortDirection };
    if (search) params.search = search;
    if (filterCategory) params.category_id = filterCategory;
    if (filterStatus) params.is_active = filterStatus;
    if (filterStock) params.stock_status = filterStock;

    const data = await getProducts(params);
    setProducts(data.data || []);
    setPagination({
      currentPage: data.meta?.current_page || data.current_page || 1,
      lastPage: data.meta?.last_page || data.last_page || 1,
      total: data.meta?.total || data.total || 0,
    });
  }, [search, filterCategory, filterStatus, filterStock, perPage, sortField, sortDirection]);

  useEffect(() => {
    Promise.all([
      fetchProducts(1),
      getCategories().then(data => setCategories(data.data || data)),
    ]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading) fetchProducts(1);
  }, [search, filterCategory, filterStatus, filterStock, perPage, sortField, sortDirection]);

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
        addToast('Produk berhasil diperbarui', 'success');
      } else {
        const result = await createProduct(payload);
        setProducts([result.data || result, ...products]);
        addToast('Produk berhasil dibuat', 'success');
      }

      setModalOpen(false);

      // Upload images if any
      if (selectedImages.length > 0) {
        const productId = editingProduct ? editingProduct.id : (products[0]?.id || null);
        if (!editingProduct) {
          await fetchProducts(pagination.currentPage);
        } else {
          await uploadImages(productId);
        }
      }
    } catch (err) {
      addToast('Gagal menyimpan: ' + (err.response?.data?.message || err.message), 'error');
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
      addToast('Gambar berhasil diupload', 'success');
    } catch (err) {
      addToast('Gagal upload gambar: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleDelete = async () => {
    const { id } = deleteConfirm;
    try {
      await deleteProduct(id);
      setProducts(products.filter(p => p.id !== id));
      setSelectedIds(prev => prev.filter(sid => sid !== id));
      addToast('Produk berhasil dihapus', 'success');
    } catch (err) {
      addToast('Gagal menghapus: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setDeleteConfirm({ open: false, id: null });
    }
  };

  const handleDuplicate = async (id) => {
    try {
      const result = await duplicateProduct(id);
      setProducts([result.data || result, ...products]);
      addToast('Produk berhasil diduplikasi', 'success');
    } catch (err) {
      addToast('Gagal menduplikasi: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  const handleBulkDelete = async () => {
    setBulkLoading(true);
    try {
      await bulkDeleteProducts(selectedIds);
      setProducts(products.filter(p => !selectedIds.includes(p.id)));
      addToast(`${selectedIds.length} produk berhasil dihapus`, 'success');
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
      await bulkToggleProductStatus(selectedIds, isActive);
      setProducts(products.map(p => selectedIds.includes(p.id) ? { ...p, is_active: isActive } : p));
      addToast(`${selectedIds.length} produk berhasil diubah statusnya`, 'success');
      setSelectedIds([]);
    } catch (err) {
      addToast('Gagal mengubah status: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setBulkLoading(false);
      setBulkStatusConfirm({ open: false, isActive: false });
    }
  };

  const handleBulkToggleFeatured = async () => {
    const isFeatured = bulkFeaturedConfirm.isFeatured;
    setBulkLoading(true);
    try {
      await bulkToggleProductFeatured(selectedIds, isFeatured);
      setProducts(products.map(p => selectedIds.includes(p.id) ? { ...p, is_featured: isFeatured } : p));
      addToast(`${selectedIds.length} produk berhasil diubah status unggulannya`, 'success');
      setSelectedIds([]);
    } catch (err) {
      addToast('Gagal mengubah status unggulan: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setBulkLoading(false);
      setBulkFeaturedConfirm({ open: false, isFeatured: false });
    }
  };

  const handleExportCsv = async () => {
    try {
      const params = {};
      if (filterCategory) params.category_id = filterCategory;
      if (filterStatus) params.is_active = filterStatus;

      const response = await exportProductsCsv(params);
      const blob = new Blob([response], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `products-export-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      addToast('Data produk berhasil diexport', 'success');
    } catch (err) {
      addToast('Gagal export: ' + (err.response?.data?.message || err.message), 'error');
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
    try {
      await deleteProductImage(productId, imagePath);
      await fetchProducts(pagination.currentPage);
      addToast('Gambar berhasil dihapus', 'success');
    } catch (err) {
      addToast('Gagal hapus gambar: ' + (err.response?.data?.message || err.message), 'error');
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

  const handleToggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(products.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  if (loading) return <Skeleton />;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Manajemen Produk</h1>
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
            + Tambah Produk
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-xl shadow mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Cari (Nama / SKU)</label>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari nama atau SKU..."
              className="w-full border border-slate-300 rounded-xl px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Kategori</label>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2">
              <option value="">Semua Kategori</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
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
            <label className="block text-sm font-medium mb-1">Stok</label>
            <select value={filterStock} onChange={e => setFilterStock(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2">
              <option value="">Semua Stok</option>
              <option value="available">Tersedia</option>
              <option value="low">Stok Menipis ({'<'} 5)</option>
              <option value="out">Habis</option>
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
            {selectedIds.length} produk dipilih
          </span>
            <div className="flex gap-2">
              <button
                onClick={() => setBulkFeaturedConfirm({ open: true, isFeatured: true })}
                className="px-3 py-1.5 bg-warning-500 text-white rounded-xl text-sm hover:bg-warning-600 flex items-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l3.09 6.26L21 10l-5 4.87 1.18 6.87L12 17.27l-6.18 3.63L7 14.87 3 10l4.91-1.74L12 2z" />
                </svg>
                <span>Jadikan Unggulan</span>
              </button>
              <button
                onClick={() => setBulkFeaturedConfirm({ open: true, isFeatured: false })}
                className="px-3 py-1.5 bg-slate-500 text-white rounded-xl text-sm hover:bg-slate-600"
              >
                Hapus Unggulan
              </button>
              <button
                onClick={() => setBulkStatusConfirm({ open: true, isActive: true })}
                className="px-3 py-1.5 bg-success-600 text-white rounded-xl text-sm hover:bg-success-700"
              >
                Aktifkan
              </button>
              <button
                onClick={() => setBulkStatusConfirm({ open: true, isActive: false })}
                className="px-3 py-1.5 bg-warning-600 text-white rounded-xl text-sm hover:bg-warning-700"
              >
                Nonaktifkan
              </button>
              <button
                onClick={() => setBulkDeleteConfirm(true)}
                className="px-3 py-1.5 bg-danger-600 text-white rounded-xl text-sm hover:bg-danger-700"
              >
                Hapus
              </button>
            </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={products.length > 0 && selectedIds.length === products.length}
                    onChange={handleToggleSelectAll}
                    className="rounded"
                  />
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold cursor-pointer hover:text-primary-600 select-none"
                    onClick={() => handleSort('name')}>
                  Nama <span className="text-slate-400 text-xs">{getSortIcon('name')}</span>
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold cursor-pointer hover:text-primary-600 select-none"
                    onClick={() => handleSort('category_id')}>
                  Kategori <span className="text-slate-400 text-xs">{getSortIcon('category_id')}</span>
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold cursor-pointer hover:text-primary-600 select-none"
                    onClick={() => handleSort('price')}>
                  Harga <span className="text-slate-400 text-xs">{getSortIcon('price')}</span>
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Diskon</th>
                <th className="text-left px-4 py-3 text-sm font-semibold cursor-pointer hover:text-primary-600 select-none"
                    onClick={() => handleSort('stock')}>
                  Stok <span className="text-slate-400 text-xs">{getSortIcon('stock')}</span>
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold cursor-pointer hover:text-primary-600 select-none"
                    onClick={() => handleSort('is_featured')}>
                  Unggulan <span className="text-slate-400 text-xs">{getSortIcon('is_featured')}</span>
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold cursor-pointer hover:text-primary-600 select-none"
                    onClick={() => handleSort('is_active')}>
                  Status <span className="text-slate-400 text-xs">{getSortIcon('is_active')}</span>
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                    Belum ada produk
                  </td>
                </tr>
              ) : (
                products.map(product => (
                  <tr key={product.id} className={`hover:bg-slate-50 ${selectedIds.includes(product.id) ? 'bg-primary-50' : ''}`}>
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(product.id)}
                        onChange={() => handleToggleSelect(product.id)}
                        className="rounded"
                      />
                    </td>
<td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {product.images && product.images.length > 0 && (
                          <img src={product.images[0]} alt="" className="w-10 h-10 object-cover rounded-xl border" />
                        )}
                        <div>
                          <span className="font-medium">{product.name}</span>
                          {product.sku && <p className="text-xs text-slate-400">SKU: {product.sku}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm">{product.category?.name}</td>
                    <td className="px-4 py-4 text-sm">Rp {Number(product.price).toLocaleString('id-ID')}</td>
                    <td className="px-4 py-4 text-sm">
                      {product.discount_price ? (
                        <span className="text-success-600">Rp {Number(product.discount_price).toLocaleString('id-ID')}</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <span className={product.stock < 5 ? 'text-danger-600 font-semibold' : product.stock === 0 ? 'text-slate-400' : ''}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      {product.is_featured ? (
                        <span className="flex items-center gap-1.5 text-warning-600 font-medium">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2l3.09 6.26L21 10l-5 4.87 1.18 6.87L12 17.27l-6.18 3.63L7 14.87 3 10l4.91-1.74L12 2z" />
                          </svg>
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                         product.is_active ? 'bg-success-100 text-success-700' : 'bg-danger-100 text-danger-700'
                      }`}>
                        {product.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-1">
                        <button onClick={() => handleDuplicate(product.id)} className="text-slate-500 hover:text-slate-700 flex items-center justify-center w-7 h-7 rounded-xl hover:bg-slate-100" title="Duplikat">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 4h1a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1" />
                            <rect x="8" y="2" width="8" height="4" rx="1" />
                          </svg>
                        </button>
                        <button onClick={() => openEditModal(product)} className="text-primary-600 flex items-center justify-center w-7 h-7 rounded-xl hover:bg-primary-50" title="Edit">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <line x1="13.5" y1="3.5" x2="17.5" y2="7.5" />
                            <polyline points="13 7 9 11 8 14 11 13l4-4" />
                          </svg>
                        </button>
                        <button onClick={() => setDeleteConfirm({ open: true, id: product.id })} className="text-danger-600 flex items-center justify-center w-7 h-7 rounded-xl hover:bg-danger-50" title="Hapus">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18M9 6V3h6v3M4 10h16l-1 14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2L4 10z" />
                            <line x1="10" y1="14" x2="14" y2="14" />
                            <line x1="10" y1="18" x2="14" y2="18" />
                          </svg>
                        </button>
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
              Total {pagination.total} produk (Halaman {pagination.currentPage} dari {pagination.lastPage})
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => fetchProducts(pagination.currentPage - 1)}
                disabled={pagination.currentPage <= 1}
                className="px-3 py-1 border border-slate-300 rounded-xl text-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sebelumnya
              </button>
              <span className="px-3 py-1 text-sm">
                {pagination.currentPage} / {pagination.lastPage}
              </span>
              <button
                onClick={() => fetchProducts(pagination.currentPage + 1)}
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
          <div className="bg-white rounded-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editingProduct ? 'Edit Produk' : 'Tambah Produk'}</h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-500 hover:text-slate-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nama Produk <span className="text-danger-500">*</span></label>
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
                  <label className="block text-sm font-medium mb-1">Kategori <span className="text-danger-500">*</span></label>
                  <select value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})}
                    className={`w-full border border-slate-300 rounded-xl px-3 py-2 ${formErrors.category_id ? 'border-danger-500' : ''}`}>
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
                    className={`w-full border border-slate-300 rounded-xl px-3 py-2 ${formErrors.sku ? 'border-danger-500' : ''}`} placeholder="Kode unik produk" />
                  {formErrors.sku && <p className="text-danger-500 text-xs mt-1">{formErrors.sku}</p>}
                </div>
              </div>

              {/* Pricing & Stock */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Harga <span className="text-danger-500">*</span></label>
                  <input type="number" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})}
                    className={`w-full border border-slate-300 rounded-xl px-3 py-2 ${formErrors.price ? 'border-danger-500' : ''}`} />
                  {formErrors.price && <p className="text-danger-500 text-xs mt-1">{formErrors.price}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Harga Diskon</label>
                  <input type="number" value={formData.discount_price} onChange={e => setFormData({...formData, discount_price: e.target.value})}
                    className={`w-full border border-slate-300 rounded-xl px-3 py-2 ${formErrors.discount_price ? 'border-danger-500' : ''}`} />
                  {formErrors.discount_price && <p className="text-danger-500 text-xs mt-1">{formErrors.discount_price}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Stok <span className="text-danger-500">*</span></label>
                  <input type="number" required value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})}
                    className={`w-full border border-slate-300 rounded-xl px-3 py-2 ${formErrors.stock ? 'border-danger-500' : ''}`} />
                  {formErrors.stock && <p className="text-danger-500 text-xs mt-1">{formErrors.stock}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Min. Order</label>
                  <input type="number" value={formData.min_order} onChange={e => setFormData({...formData, min_order: e.target.value})}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Unit</label>
                  <input value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2" placeholder="pcs, kg, meter, dll" />
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
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
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
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                  ))}
                   <label className="w-20 h-20 border-2 border-dashed border-slate-300 rounded flex items-center justify-center cursor-pointer hover:border-primary-500">
                    <span className="text-2xl text-slate-400">+</span>
                    <input type="file" accept="image/jpeg,image/png,image/jpg,image/gif,image/webp" multiple onChange={handleImageSelect} className="hidden" />
                  </label>
                </div>
                {uploadingImages && <p className="text-sm text-primary-600">Mengupload gambar...</p>}
                <p className="text-xs text-slate-400 mt-1">Format yang didukung: <strong>JPG, PNG, GIF, WebP</strong>. AVIF tidak didukung.</p>
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
                          className="flex-1 border border-slate-300 rounded-xl px-3 py-2 text-sm"
                        />
                        <input
                          value={spec.value} onChange={e => updateSpecification(i, 'value', e.target.value)}
                          placeholder="Nilai (misal: 1 kg)"
                          className="flex-1 border border-slate-300 rounded-xl px-3 py-2 text-sm"
                        />
                        <button type="button" onClick={() => removeSpecification(i)} className="text-danger-500 hover:text-danger-700 px-2 py-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">Belum ada spesifikasi</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-1">Deskripsi</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2" rows="3" />
              </div>

              {/* Meta */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Meta Title (SEO)</label>
                  <input value={formData.meta_title} onChange={e => setFormData({...formData, meta_title: e.target.value})}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Meta Description (SEO)</label>
                  <textarea value={formData.meta_description} onChange={e => setFormData({...formData, meta_description: e.target.value})}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2" rows="2" />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border border-slate-300 rounded-xl hover:bg-slate-50 flex items-center justify-center min-w-[100px]">
                  Batal
                </button>
                <button type="submit" disabled={saving || uploadingImages}
                  className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:bg-slate-300 flex items-center justify-center min-w-[140px]">
                  {saving ? 'Menyimpan...' : (editingProduct ? 'Simpan Perubahan' : 'Buat Produk')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={deleteConfirm.open}
        title="Hapus Produk"
        message="Apakah Anda yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan."
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ open: false, id: null })}
      />

      {/* Bulk Delete Confirmation */}
      <ConfirmModal
        open={bulkDeleteConfirm}
        title="Hapus Produk Massal"
        message={`Apakah Anda yakin ingin menghapus ${selectedIds.length} produk yang dipilih? Tindakan ini tidak dapat dibatalkan.`}
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkDeleteConfirm(false)}
        loading={bulkLoading}
      />

      {/* Bulk Toggle Status Confirmation */}
      <ConfirmModal
        open={bulkStatusConfirm.open}
        title={bulkStatusConfirm.isActive ? 'Aktifkan Produk' : 'Nonaktifkan Produk'}
        message={`Apakah Anda yakin ingin ${bulkStatusConfirm.isActive ? 'mengaktifkan' : 'menonaktifkan'} ${selectedIds.length} produk yang dipilih?`}
        confirmText={bulkStatusConfirm.isActive ? 'Aktifkan' : 'Nonaktifkan'}
        onConfirm={handleBulkToggleStatus}
        onCancel={() => setBulkStatusConfirm({ open: false, isActive: false })}
        loading={bulkLoading}
        danger={!bulkStatusConfirm.isActive}
      />

      {/* Bulk Toggle Featured Confirmation */}
      <ConfirmModal
        open={bulkFeaturedConfirm.open}
        title={bulkFeaturedConfirm.isFeatured ? 'Jadikan Unggulan' : 'Hapus Unggulan'}
        message={`Apakah Anda yakin ingin ${bulkFeaturedConfirm.isFeatured ? 'menjadikan' : 'menghapus status unggulan dari'} ${selectedIds.length} produk yang dipilih?`}
        confirmText={bulkFeaturedConfirm.isFeatured ? 'Jadikan Unggulan' : 'Hapus Unggulan'}
        onConfirm={handleBulkToggleFeatured}
        onCancel={() => setBulkFeaturedConfirm({ open: false, isFeatured: false })}
        loading={bulkLoading}
        danger={false}
      />
    </div>
  );
}
