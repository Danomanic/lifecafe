"use client"

import { useEffect, useState } from 'react';

export default function Modal() {
  const [openModal, setModal] = useState(false);
  const [tableNumber, setTableNumber] = useState(null);
  const handleModal = () => {
    // Store table number in local storage on model close based on button clicked
    if (openModal) {
      const tableNumber = event.target.innerText;
      localStorage.setItem('tableNumber', tableNumber);
      setTableNumber(tableNumber);
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
        className='px-6 py-4 block w-full text-center text-white bg-gray-900 active:text-violet-500 hover:bg-transparent hover:text-violet-600 focus:outline-none focus:ring text-xl font-bold'
        onClick={handleModal}
      >
        {tableNumber ? `Table ${tableNumber}` : 'Set Table'}
      </button>
      {openModal &&
        <div className='fixed top-0 left-0 w-full h-full bg-gray-300 flex justify-center items-center'>
          <div className='w-full bg-white shadow-lg py-2 rounded-md'>
            <div className='border-b p-4'>
              <h2 className='text-2xl font-bold text-center'>Select Table</h2>
            </div>
            <div className='grid grid-cols-3 gap-2 p-4'>
              {[...Array(14)].map((_, i) => (
                <button
                  key={i}
                  className='bg-slate-900 text-white py-8 px-4 rounded-md hover:bg-blue-700 font-bold font-xl'
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