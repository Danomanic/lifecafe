'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import TableSelectorModal from './components/TableSelectorModal';
import { getCartItemCount } from '@/lib/cart';

export default function Navbar() {
  const [cartCount, setCartCount] = useState(0);
  const [showTableModal, setShowTableModal] = useState(false);
  const [tableNumber, setTableNumber] = useState(null);

  useEffect(() => {
    // Load initial cart count
    updateCartCount();

    // Load table number
    const storedTableNumber = localStorage.getItem('tableNumber');
    setTableNumber(storedTableNumber);

    // Listen for cart updates
    const handleCartUpdate = () => {
      updateCartCount();
    };

    // Listen for table number changes
    const handleTableChange = () => {
      const newTableNumber = localStorage.getItem('tableNumber');
      setTableNumber(newTableNumber);
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    window.addEventListener('tableNumberChanged', handleTableChange);

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
      window.removeEventListener('tableNumberChanged', handleTableChange);
    };
  }, []);

  const updateCartCount = () => {
    const count = getCartItemCount();
    setCartCount(count);
  };

  const handleSelectTable = (selectedTableNumber) => {
    console.log('Setting table number to:', selectedTableNumber);
    localStorage.setItem('tableNumber', selectedTableNumber);
    setTableNumber(selectedTableNumber);

    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('tableNumberChanged', { detail: selectedTableNumber }));

    setShowTableModal(false);
  };

  return (
    <nav className="bg-white">
      <div>
        <div className="grid grid-cols-2">
          {cartCount === 0 ? (
            <button
              type='button'
              className='px-4 py-3 block w-full text-center text-white bg-brand-navy hover:opacity-90 focus:outline-none focus:ring text-xl font-bold'
              onClick={() => setShowTableModal(true)}
            >
              {tableNumber ? `Table ${tableNumber}` : 'Set Table'}
            </button>
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

      <TableSelectorModal
        isOpen={showTableModal}
        onSelect={handleSelectTable}
        title="Select Table"
      />
    </nav>
  );
}
