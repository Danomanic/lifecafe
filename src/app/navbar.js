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
    <nav className="bg-white">
      <div>
        <div className="grid grid-cols-2">
          {cartCount === 0 ? (
            <Modal />
          ) : (
            <Link className="px-4 py-3 block w-full text-center text-white bg-brand-teal hover:opacity-90 focus:outline-none focus:ring text-xl font-bold relative animate-pulse"
              href="/cart">
              Cart
              <span className="absolute top-2 right-2 bg-brand-pink text-white text-lg font-bold rounded-full h-8 w-8 flex items-center justify-center">
                {cartCount}
              </span>
            </Link>
          )}
          <Link className="px-4 py-3 block w-full text-center text-white bg-brand-navy hover:opacity-90 focus:outline-none focus:ring text-xl font-bold"
            href="/">
            Menu
          </Link>
        </div>
      </div>
    </nav>
  );
}
