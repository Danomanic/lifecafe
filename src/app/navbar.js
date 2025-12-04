'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Modal from './modal';
import { getCartItemCount } from '@/lib/cart';

export default function Navbar() {
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    // Load initial cart count
    updateCartCount();

    // Listen for cart updates
    const handleCartUpdate = () => {
      updateCartCount();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  const updateCartCount = () => {
    const count = getCartItemCount();
    setCartCount(count);
  };

  return (
    <nav className="bg-red-100">
      <div>
        <div className="grid grid-cols-2">
          {cartCount === 0 ? (
            <Modal />
          ) : (
            <Link className="px-4 py-3 block w-full text-center text-white bg-purple-900 active:text-violet-500 hover:bg-purple-800 focus:outline-none focus:ring text-xl font-bold relative"
              href="/cart">
              Cart
              <span className="absolute top-1 right-1 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {cartCount}
              </span>
            </Link>
          )}
          <Link className="px-4 py-3 block w-full text-center text-white bg-blue-900 active:text-violet-500 hover:bg-blue-800 focus:outline-none focus:ring text-xl font-bold"
            href="/">
            Menu
          </Link>
        </div>
      </div>
    </nav>
  );
}
