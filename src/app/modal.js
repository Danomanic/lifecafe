"use client"

import { useEffect, useState } from 'react';

export default function Modal() {
  const [openModal, setModal] = useState(false);
  const [tableNumber, setTableNumber] = useState(null);
  const handleModal = () => {
    // Store table number in local storage on model close based on button clicked
    if (openModal) {
      const tableNumber = event.target.innerText;
      console.log('Setting table number to:', tableNumber);
      localStorage.setItem('tableNumber', tableNumber);
      setTableNumber(tableNumber);

      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('tableNumberChanged', { detail: tableNumber }));
    }

    setModal(!openModal);
  }

  useEffect(() => {
    // Check if table number is already set in local storage
    const tableNumber = localStorage.getItem('tableNumber');
    setTableNumber(tableNumber);
  }, []);

  return (
    <div>
      <button
        type='button'
        className='px-4 py-3 block w-full text-center text-white bg-gray-900 active:text-violet-500 hover:bg-gray-800 focus:outline-none focus:ring text-xl font-bold'
        onClick={handleModal}
      >
        {tableNumber ? `Table ${tableNumber}` : 'Set Table'}
      </button>
      {openModal &&
        <div className='fixed top-0 left-0 w-full h-full bg-gray-900 bg-opacity-75 flex justify-center items-center p-4'>
          <div className='w-full max-w-md bg-white shadow-lg py-2 rounded-lg'>
            <div className='border-b border-gray-300 p-3'>
              <h2 className='text-xl font-bold text-center text-gray-900'>Select Table</h2>
            </div>
            <div className='grid grid-cols-3 gap-2 p-3'>
              {[...Array(14)].map((_, i) => (
                <button
                  key={i}
                  className='bg-slate-900 text-white py-5 px-4 rounded-lg hover:bg-blue-700 font-bold text-xl'
                  onClick={handleModal}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      }

    </div>
  );
};