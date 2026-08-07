import api from './api';

const extractData = (response) => {
  const data = response.data || response;
  return data.data ?? data;
};

export const getSettings = () => api.get('/settings').then(extractData);
export const getBankAccounts = () => api.get('/bank-accounts').then(extractData);
export const getCategories = (params) => api.get('/categories', { params }).then(extractData);
export const getCategory = (slug) => api.get(`/categories/${slug}`).then(extractData);
export const getCategoryProducts = (slug, params) => api.get(`/categories/${slug}/products`, { params }).then(extractData);
export const getProducts = (params) => api.get('/products', { params }).then(extractData);
export const getFeaturedProducts = () => api.get('/products/featured').then(extractData);
export const getProduct = (slug) => api.get(`/products/${slug}`).then(extractData);
export const getRelatedProducts = (slug) => api.get(`/products/${slug}/related`).then(extractData);

export const getCart = () => api.get('/cart').then(extractData);
export const addToCart = (data) => api.post('/cart/items', data).then(extractData);
export const updateCartItem = (id, data) => api.put(`/cart/items/${id}`, data).then(extractData);
export const removeCartItem = (id) => api.delete(`/cart/items/${id}`).then(extractData);
export const clearCart = () => api.delete('/cart').then(extractData);

export const createOrder = (data) => api.post('/orders', data).then(res => res.data);
export const getOrder = (orderNumber) => api.get(`/orders/${orderNumber}`).then(extractData);
