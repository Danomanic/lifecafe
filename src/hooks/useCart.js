'use client';

import { useEffect, useState } from 'react';
import { getCart, getCartItemCount, getCartTotal } from '@/lib/cart';

export function useCart() {
  const [cart, setCart] = useState({ tableNumber: null, items: [] });
  const [cartCount, setCartCount] = useState(0);

  const loadCart = () => {
    const currentCart = getCart();
    setCart(currentCart);
    setCartCount(getCartItemCount());
  };

  useEffect(() => {
    // Load initial cart
    loadCart();

    // Listen for cart updates
    const handleCartUpdate = () => {
      loadCart();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  const total = getCartTotal();

  return { cart, cartCount, total, reloadCart: loadCart };
}
