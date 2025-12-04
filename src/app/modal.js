"use client"

import { useEffect, useState } from 'react';
import TableSelectorModal from './components/TableSelectorModal';

export default function Modal() {
  const [openModal, setModal] = useState(false);
  const [tableNumber, setTableNumber] = useState(null);

  const handleSelectTable = (selectedTableNumber) => {
    console.log('Setting table number to:', selectedTableNumber);
    localStorage.setItem('tableNumber', selectedTableNumber);
    setTableNumber(selectedTableNumber);

    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('tableNumberChanged', { detail: selectedTableNumber }));

    setModal(false);
  };

  useEffect(() => {
    // Check if table number is already set in local storage
    const tableNumber = localStorage.getItem('tableNumber');
    setTableNumber(tableNumber);
  }, []);

  return (
    <div>
      <button
        type='button'
        className='px-4 py-3 block w-full text-center text-white bg-brand-navy hover:opacity-90 focus:outline-none focus:ring text-xl font-bold'
        onClick={() => setModal(true)}
      >
        {tableNumber ? `Table ${tableNumber}` : 'Set Table'}
      </button>

      <TableSelectorModal
        isOpen={openModal}
        onSelect={handleSelectTable}
        title="Select Table"
      />
    </div>
  );
};