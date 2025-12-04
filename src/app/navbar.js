'use client';

import Link from 'next/link';
import { useState } from 'react';
import TableSelectorModal from './components/TableSelectorModal';
import { useCart } from '@/hooks/useCart';
import { useTableNumber } from '@/hooks/useTableNumber';

export default function Navbar() {
  const [showTableModal, setShowTableModal] = useState(false);
  const { cartCount } = useCart();
  const { tableNumber, updateTableNumber } = useTableNumber();

  const handleSelectTable = (selectedTableNumber) => {
    updateTableNumber(selectedTableNumber);
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
