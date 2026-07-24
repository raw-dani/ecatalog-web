import api from './api';

export const adminLogin = (credentials) => api.post('/admin/login', credentials).then(res => res.data);
export const getAdminMe = () => api.get('/admin/me').then(res => res.data);
export const adminLogout = () => api.post('/admin/logout').then(res => res.data);
export const forgotPassword = (email) => api.post('/admin/forgot-password', { email }).then(res => res.data);
export const resetPassword = (data) => api.post('/admin/reset-password', data).then(res => res.data);

export const getDashboardStats = () => api.get('/admin/dashboard').then(res => res.data);

export const getProducts = (params) => api.get('/admin/products', { params }).then(res => res.data);
export const getProduct = (id) => api.get(`/admin/products/${id}`).then(res => res.data);
export const createProduct = (data) => api.post('/admin/products', data).then(res => res.data);
export const updateProduct = (id, data) => api.put(`/admin/products/${id}`, data).then(res => res.data);
export const deleteProduct = (id) => api.delete(`/admin/products/${id}`).then(res => res.data);
export const uploadProductImages = (id, formData) => api.post(`/admin/products/${id}/images`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
}).then(res => res.data);
export const deleteProductImage = (id, image) => api.delete(`/admin/products/${id}/images`, { data: { image } }).then(res => res.data);

export const getCategories = (params) => api.get('/admin/categories', { params }).then(res => res.data);
export const getCategory = (id) => api.get(`/admin/categories/${id}`).then(res => res.data);
export const createCategory = (data) => api.post('/admin/categories', data).then(res => res.data);
export const updateCategory = (id, data) => api.put(`/admin/categories/${id}`, data).then(res => res.data);
export const deleteCategory = (id) => api.delete(`/admin/categories/${id}`).then(res => res.data);
export const uploadCategoryImage = (id, formData) => api.post(`/admin/categories/${id}/image`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
}).then(res => res.data);

export const getOrders = (params) => api.get('/admin/orders', { params }).then(res => res.data);
export const getOrder = (id) => api.get(`/admin/orders/${id}`).then(res => res.data);
export const updateOrderStatus = (id, status) => api.put(`/admin/orders/${id}/status`, { status }).then(res => res.data);

export const getSettings = () => api.get('/admin/settings').then(res => res.data);
export const updateSettings = (settings) => api.put('/admin/settings', { settings }).then(res => res.data);
export const uploadLogo = (formData) => api.post('/admin/settings/logo', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
}).then(res => res.data);

export const getBankAccounts = () => api.get('/admin/bank-accounts').then(res => res.data);
export const createBankAccount = (data) => api.post('/admin/bank-accounts', data).then(res => res.data);
export const updateBankAccount = (id, data) => api.put(`/admin/bank-accounts/${id}`, data).then(res => res.data);
export const deleteBankAccount = (id) => api.delete(`/admin/bank-accounts/${id}`).then(res => res.data);
