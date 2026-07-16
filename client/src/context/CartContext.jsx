import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);
const emptyCart = { items: [], total: 0, count: 0 };

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState(emptyCart);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setCart(emptyCart);
      return;
    }
    setLoading(true);
    try {
      const data = await api.getCart();
      setCart(data.cart);
    } catch {
      setCart(emptyCart);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function add(productId, qty = 1) {
    const data = await api.addToCart(productId, qty);
    setCart(data.cart);
  }

  async function update(productId, qty) {
    const data = await api.updateCartItem(productId, qty);
    setCart(data.cart);
  }

  async function remove(productId) {
    const data = await api.removeCartItem(productId);
    setCart(data.cart);
  }

  return (
    <CartContext.Provider value={{ cart, loading, add, update, remove, refresh }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
