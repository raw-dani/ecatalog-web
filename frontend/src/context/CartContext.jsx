import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [sessionId, setSessionId] = useState(() => {
    let sid = localStorage.getItem('session_id');
    if (!sid) {
      sid = 'sess_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('session_id', sid);
    }
    return sid;
  });

  const fetchCart = useCallback(async () => {
    try {
      const response = await api.get('/cart');
      const data = response.data || response;
      setItems(Array.isArray(data) ? data : (data.data || []));
    } catch (error) {
      console.error('Failed to fetch cart', error);
      setItems([]);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (productId, quantity, notes) => {
    try {
      await api.post('/cart/items', { product_id: productId, quantity, notes, session_id: sessionId });
      await fetchCart();
      return true;
    } catch (error) {
      console.error('Failed to add to cart', error);
      return false;
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    try {
      await api.put(`/cart/items/${itemId}`, { quantity });
      await fetchCart();
    } catch (error) {
      console.error('Failed to update cart', error);
    }
  };

  const removeItem = async (itemId) => {
    try {
      await api.delete(`/cart/items/${itemId}`);
      await fetchCart();
    } catch (error) {
      console.error('Failed to remove item', error);
    }
  };

  const clearCart = async () => {
    try {
      await api.delete('/cart');
      setItems([]);
    } catch (error) {
      console.error('Failed to clear cart', error);
    }
  };

  const subtotal = (Array.isArray(items) ? items : []).reduce((sum, item) => {
    const price = item.product ? (item.product.discount_price ?? item.product.price) : 0;
    return sum + (price * item.quantity);
  }, 0);
  const totalItems = (Array.isArray(items) ? items : []).reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, sessionId, addToCart, updateQuantity, removeItem, clearCart, subtotal, totalItems }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
