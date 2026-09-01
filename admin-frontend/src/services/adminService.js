import api from './api';

export const adminLogin = (credentials) => api.post('/admin/login', credentials).then(res => res.data);
export const getAdminMe = () => api.get('/admin/me').then(res => res.data);
export const adminLogout = () => api.post('/admin/logout').then(res => res.data);
export const updateAdminProfile = (data) => api.put('/admin/profile', data).then(res => res.data);
export const changeAdminPassword = (data) => api.put('/admin/change-password', data).then(res => res.data);
export const forgotPassword = (email) => api.post('/admin/forgot-password', { email }).then(res => res.data);
export const resetPassword = (data) => api.post('/admin/reset-password', data).then(res => res.data);

export const getDashboardStats = () => api.get('/admin/dashboard').then(res => res.data);

export const getTrafficStats = () => api.get('/admin/traffic').then(res => res.data);

export const getProducts = (params) => api.get('/admin/products', { params }).then(res => res.data);
export const getProduct = (id) => api.get(`/admin/products/${id}`).then(res => res.data);
export const createProduct = (data) => api.post('/admin/products', data).then(res => res.data);
export const updateProduct = (id, data) => api.put(`/admin/products/${id}`, data).then(res => res.data);
export const deleteProduct = (id) => api.delete(`/admin/products/${id}`).then(res => res.data);
export const uploadProductImages = (id, formData) => api.post(`/admin/products/${id}/images`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
}).then(res => res.data);
export const deleteProductImage = (id, image) => api.delete(`/admin/products/${id}/images`, { data: { image } }).then(res => res.data);
export const reorderProductImages = (id, images) => api.put(`/admin/products/${id}/images/order`, { images }).then(res => res.data);
export const duplicateProduct = (id) => api.post(`/admin/products/${id}/duplicate`).then(res => res.data);
export const bulkDeleteProducts = (ids) => api.post('/admin/products/bulk/delete', { ids }).then(res => res.data);
export const bulkToggleProductStatus = (ids, is_active) => api.post('/admin/products/bulk/toggle-status', { ids, is_active }).then(res => res.data);
export const bulkToggleProductFeatured = (ids, is_featured) => api.post('/admin/products/bulk/toggle-featured', { ids, is_featured }).then(res => res.data);
export const exportProductsCsv = (params) => api.get('/admin/products/export/csv', { params, responseType: 'blob' }).then(res => res.data);

export const getCategories = (params) => api.get('/admin/categories', { params }).then(res => res.data);
export const getCategory = (id) => api.get(`/admin/categories/${id}`).then(res => res.data);
export const createCategory = (data) => api.post('/admin/categories', data).then(res => res.data);
export const updateCategory = (id, data) => api.put(`/admin/categories/${id}`, data).then(res => res.data);
export const deleteCategory = (id) => api.delete(`/admin/categories/${id}`).then(res => res.data);
export const uploadCategoryImage = (id, formData) => api.post(`/admin/categories/${id}/image`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
}).then(res => res.data);
export const toggleCategoryStatus = (id) => api.put(`/admin/categories/${id}/toggle-status`).then(res => res.data);
export const exportCategoriesCsv = (params) => api.get('/admin/categories/export/csv', { params, responseType: 'blob' }).then(res => res.data);

export const getBrands = (params) => api.get('/admin/brands', { params }).then(res => res.data);
export const getBrand = (id) => api.get(`/admin/brands/${id}`).then(res => res.data);
export const createBrand = (data) => api.post('/admin/brands', data).then(res => res.data);
export const updateBrand = (id, data) => api.put(`/admin/brands/${id}`, data).then(res => res.data);
export const deleteBrand = (id) => api.delete(`/admin/brands/${id}`).then(res => res.data);
export const uploadBrandLogo = (id, formData) => api.post(`/admin/brands/${id}/logo`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
}).then(res => res.data);
export const toggleBrandStatus = (id) => api.put(`/admin/brands/${id}/toggle-status`).then(res => res.data);

export const getOrders = (params) => api.get('/admin/orders', { params }).then(res => res.data);
export const getOrder = (id) => api.get(`/admin/orders/${id}`).then(res => res.data);
export const updateOrderStatus = (id, status) => api.put(`/admin/orders/${id}/status`, { status }).then(res => res.data);
export const exportOrdersCsv = (params) => api.get('/admin/orders/export/csv', { params, responseType: 'blob' }).then(res => res.data);

export const getSettings = () => api.get('/admin/settings').then(res => res.data);
export const updateSettings = (settings) => api.put('/admin/settings', { settings }).then(res => res.data);
export const uploadLogo = (formData) => api.post('/admin/settings/logo', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
}).then(res => res.data);
export const uploadFavicon = (formData) => api.post('/admin/settings/favicon', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
}).then(res => res.data);
export const resetSettingsDefaults = () => api.post('/admin/settings/reset-defaults').then(res => res.data);

export const getBankAccounts = (params) => api.get('/admin/bank-accounts', { params }).then(res => res.data);
export const createBankAccount = (data) => api.post('/admin/bank-accounts', data).then(res => res.data);
export const updateBankAccount = (id, data) => api.put(`/admin/bank-accounts/${id}`, data).then(res => res.data);
export const deleteBankAccount = (id) => api.delete(`/admin/bank-accounts/${id}`).then(res => res.data);
export const toggleBankAccountStatus = (id) => api.put(`/admin/bank-accounts/${id}/toggle-status`).then(res => res.data);

export const getUsers = (params) => api.get('/admin/users', { params }).then(res => res.data);
export const getUser = (id) => api.get(`/admin/users/${id}`).then(res => res.data);
export const createUser = (data) => api.post('/admin/users', data).then(res => res.data);
export const updateUser = (id, data) => api.put(`/admin/users/${id}`, data).then(res => res.data);
export const deleteUser = (id) => api.delete(`/admin/users/${id}`).then(res => res.data);
export const assignRole = (id, role) => api.put(`/admin/users/${id}/role`, { role }).then(res => res.data);
export const uploadUserAvatar = (id, formData) => api.post(`/admin/users/${id}/avatar`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
}).then(res => res.data);
export const bulkDeleteUsers = (ids) => api.post('/admin/users/bulk/delete', { ids }).then(res => res.data);
export const bulkToggleUserStatus = (ids, is_active) => api.post('/admin/users/bulk/toggle-status', { ids, is_active }).then(res => res.data);
export const getActivityLogs = (params) => api.get('/admin/users/activity-logs', { params }).then(res => res.data);
export const exportUsersCsv = (params) => api.get('/admin/users/export/csv', { params, responseType: 'blob' }).then(res => res.data);

export const getLicenseStatus = () => api.get('/license/status').then(res => res.data);
export const verifyLicense = (data) => api.post('/license/verify', data).then(res => res.data);
export const activateLicense = (data) => api.post('/license/activate', data).then(res => res.data);
export const deactivateLicense = (data) => api.post('/license/deactivate', data).then(res => res.data);
