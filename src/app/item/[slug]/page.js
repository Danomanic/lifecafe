'use client';

import Navbar from "@/app/navbar";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import menuData from '../../../menu.json';

export default function ItemPage({ params }) {
  const router = useRouter();
  const [slug, setSlug] = useState(null);
  const [tableNumber, setTableNumber] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [item, setItem] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState({});

  // Unwrap params on client side
  useEffect(() => {
    params.then((resolvedParams) => {
      setSlug(resolvedParams.slug);
    });
  }, [params]);

  // Find item in menu data when slug is available
  useEffect(() => {
    if (!slug) return;

    // Search through all drinks to find the item with matching slug
    const drinks = menuData.drinks;
    let foundItem = null;

    Object.keys(drinks).forEach((categoryKey) => {
      if (categoryKey !== 'title' && drinks[categoryKey].items) {
        const found = drinks[categoryKey].items.find(i => i.slug === slug);
        if (found) {
          foundItem = found;
        }
      }
    });

    setItem(foundItem);

    // Set default selected options
    if (foundItem && foundItem.options) {
      const defaults = {};
      Object.keys(foundItem.options).forEach((optionKey) => {
        const options = foundItem.options[optionKey];
        if (Array.isArray(options) && options.length > 0) {
          // If option has value/price structure, use the value
          defaults[optionKey] = typeof options[0] === 'object' ? options[0].value : options[0];
        }
      });
      setSelectedOptions(defaults);
    }
  }, [slug]);

  // Load table number from localStorage
  useEffect(() => {
    const storedTableNumber = localStorage.getItem('tableNumber');
    setTableNumber(storedTableNumber);

    // Listen for storage changes (when table number is updated)
    const handleStorageChange = (e) => {
      if (e.key === 'tableNumber') {
        setTableNumber(e.newValue);
      }
    };

    // Listen for custom event (for same-window changes)
    const handleTableChange = () => {
      const newTableNumber = localStorage.getItem('tableNumber');
      console.log('Table number changed event received, new table:', newTableNumber);
      setTableNumber(newTableNumber);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('tableNumberChanged', handleTableChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('tableNumberChanged', handleTableChange);
    };
  }, []);

  const handleOptionChange = (optionKey, value) => {
    setSelectedOptions(prev => ({
      ...prev,
      [optionKey]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    // Get the current table number from localStorage (in case it changed)
    const currentTableNumber = localStorage.getItem('tableNumber');
    console.log('Submitting order for table:', currentTableNumber);

    // Check if table number is set
    if (!currentTableNumber) {
      setSubmitError('Please select a table number first');
      setIsSubmitting(false);
      return;
    }

    const orderData = {
      tableNumber: parseInt(currentTableNumber),
      items: [
        {
          name: item.name,
          slug: slug,
          options: selectedOptions,
          price: calculatePrice(),
          quantity: 1,
        },
      ],
    };

    console.log('Order data being sent:', orderData);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit order');
      }

      const order = await response.json();
      console.log('Order created:', order);

      // Redirect back to drinks page or show success message
      router.push('/drinks?success=true');
    } catch (error) {
      console.error('Error submitting order:', error);
      setSubmitError(error.message);
      setIsSubmitting(false);
    }
  };

  if (!slug || !item) {
    return <div>Loading...</div>;
  }

  // Calculate price based on selected options
  const calculatePrice = () => {
    // If item has a base price and no options, use base price
    if (item.price && !item.options) {
      return item.price;
    }

    // If item has options, sum up all option prices
    if (item.options) {
      let totalPrice = 0;
      let hasAnyPrice = false;

      for (const optionKey in item.options) {
        const options = item.options[optionKey];
        if (Array.isArray(options) && typeof options[0] === 'object') {
          const selected = options.find(opt => opt.value === selectedOptions[optionKey]);
          if (selected && selected.price) {
            totalPrice += selected.price;
            hasAnyPrice = true;
          }
        }
      }

      // If we found any prices in options, return the total
      if (hasAnyPrice) {
        return totalPrice;
      }

      // Otherwise, if item has base price, use that
      if (item.price) {
        return item.price;
      }
    }

    return null;
  };

  const price = calculatePrice();

  return (
    <div>
      <Navbar />

      <div className="mx-4 mt-4">
        <h1 className="text-2xl font-bold mb-4">{item.name}</h1>

        {item.description && (
          <p className="text-gray-700 mb-4 text-base">{item.description}</p>
        )}

        {!tableNumber && (
          <div className="bg-yellow-100 border border-yellow-500 text-yellow-900 px-4 py-2 rounded-lg mb-4 text-base font-semibold">
            Please select a table number first
          </div>
        )}

        {submitError && (
          <div className="bg-red-100 border border-red-500 text-red-900 px-4 py-2 rounded-lg mb-4 text-base font-semibold">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Render dynamic options */}
          {item.options && Object.keys(item.options).map((optionKey) => {
            const options = item.options[optionKey];
            const capitalizedLabel = optionKey.charAt(0).toUpperCase() + optionKey.slice(1);

            return (
              <fieldset key={optionKey} id={optionKey} className="mb-6">
                <p className="font-bold mb-2 text-xl text-gray-900">{capitalizedLabel}</p>
                {options.map((option, index) => {
                  const optionValue = typeof option === 'object' ? option.value : option;
                  const optionLabel = typeof option === 'object'
                    ? option.value.charAt(0).toUpperCase() + option.value.slice(1)
                    : option.charAt(0).toUpperCase() + option.slice(1);

                  return (
                    <label key={optionValue} className="flex items-center bg-gray-100 rounded-lg px-3 py-3 my-2 hover:bg-indigo-200 cursor-pointer border border-gray-300">
                      <input
                        type="radio"
                        name={optionKey}
                        value={optionValue}
                        checked={selectedOptions[optionKey] === optionValue}
                        onChange={(e) => handleOptionChange(optionKey, e.target.value)}
                        className="w-5 h-5"
                      />
                      <p className="pl-3 text-base font-semibold text-gray-900">{optionLabel}</p>
                    </label>
                  );
                })}
              </fieldset>
            );
          })}

          <button
            type="submit"
            disabled={isSubmitting || !tableNumber}
            className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-xl"
          >
            {isSubmitting ? 'Submitting Order...' : 'Place Order'}
          </button>
        </form>
      </div>
    </div>
  );
}
