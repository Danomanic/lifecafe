'use client';

import { useEffect, useState } from 'react';

export function useTableNumber() {
  const [tableNumber, setTableNumber] = useState(null);

  useEffect(() => {
    // Load initial table number
    const storedTableNumber = localStorage.getItem('tableNumber');
    setTableNumber(storedTableNumber);

    // Listen for table number changes
    const handleTableChange = () => {
      const newTableNumber = localStorage.getItem('tableNumber');
      setTableNumber(newTableNumber);
    };

    window.addEventListener('tableNumberChanged', handleTableChange);
    window.addEventListener('storage', (e) => {
      if (e.key === 'tableNumber') {
        setTableNumber(e.newValue);
      }
    });

    return () => {
      window.removeEventListener('tableNumberChanged', handleTableChange);
    };
  }, []);

  const updateTableNumber = (newTableNumber) => {
    localStorage.setItem('tableNumber', newTableNumber);
    setTableNumber(newTableNumber);
    window.dispatchEvent(new CustomEvent('tableNumberChanged', { detail: newTableNumber }));
  };

  return { tableNumber, updateTableNumber };
}
