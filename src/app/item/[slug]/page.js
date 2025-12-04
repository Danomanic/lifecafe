'use client';

import Navbar from "@/app/navbar";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import menuData from '../../../menu.json';
import { addToCart } from '@/lib/cart';

export default function ItemPage({ params }) {
  const router = useRouter();
  const [slug, setSlug] = useState(null);
  const [tableNumber, setTableNumber] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [addedToCart, setAddedToCart] = useState(false);
  const [item, setItem] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [returnUrl, setReturnUrl] = useState('/drinks');
  const [expandedOptions, setExpandedOptions] = useState({});

  // Unwrap params on client side and get return URL
  useEffect(() => {
    params.then((resolvedParams) => {
      setSlug(resolvedParams.slug);
    });

    // Get the return URL from query params or referrer
    const urlParams = new URLSearchParams(window.location.search);
    const from = urlParams.get('from');
    if (from) {
      setReturnUrl(from);
    } else {
      // Default to drinks if no referrer specified
      setReturnUrl('/drinks');
    }
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
          // Check if this option has a default in collapsibleOptions
          if (foundItem.collapsibleOptions && foundItem.collapsibleOptions[optionKey]) {
            defaults[optionKey] = foundItem.collapsibleOptions[optionKey];
          } else {
            // Otherwise use first option as default
            defaults[optionKey] = typeof options[0] === 'object' ? options[0].value : options[0];
          }
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

    // Collapse the option after selection
    setExpandedOptions(prev => ({
      ...prev,
      [optionKey]: false
    }));
  };

  const toggleOptionExpanded = (optionKey) => {
    setExpandedOptions(prev => ({
      ...prev,
      [optionKey]: !prev[optionKey]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setAddedToCart(false);

    // Get the current table number from localStorage (in case it changed)
    const currentTableNumber = localStorage.getItem('tableNumber');
    console.log('Adding to cart for table:', currentTableNumber);

    // Check if table number is set
    if (!currentTableNumber) {
      setSubmitError('Please select a table number first');
      setIsSubmitting(false);
      return;
    }

    const cartItem = {
      name: item.name,
      slug: slug,
      options: selectedOptions,
      price: calculatePrice(),
      quantity: 1,
    };

    console.log('Item being added to cart:', cartItem);

    try {
      // Add to cart
      addToCart(cartItem, currentTableNumber);

      // Dispatch custom event to notify navbar
      window.dispatchEvent(new Event('cartUpdated'));

      // Show success message
      setAddedToCart(true);
      setIsSubmitting(false);

      // Redirect back to category page after showing feedback
      setTimeout(() => {
        router.push(returnUrl);
      }, 800);
    } catch (error) {
      console.error('Error adding to cart:', error);
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
          {/* Render regular options */}
          {item.options && Object.keys(item.options).map((optionKey) => {
            // Skip extras - they'll be rendered separately
            if (item.extras && item.extras.includes(optionKey)) {
              return null;
            }

            // Skip collapsible options - they'll be rendered separately
            if (item.collapsibleOptions && item.collapsibleOptions[optionKey]) {
              return null;
            }

            const options = item.options[optionKey];
            const capitalizedLabel = optionKey.charAt(0).toUpperCase() + optionKey.slice(1).replace(/-/g, ' ');

            return (
              <fieldset key={optionKey} id={optionKey} className="mb-6">
                <p className="font-bold mb-2 text-xl text-gray-900">{capitalizedLabel}</p>
                {options.map((option, index) => {
                  const optionValue = typeof option === 'object' ? option.value : option;
                  const optionLabel = typeof option === 'object'
                    ? option.value.charAt(0).toUpperCase() + option.value.slice(1)
                    : option.charAt(0).toUpperCase() + option.slice(1);
                  const optionPrice = typeof option === 'object' && option.price && option.price > 0 ? option.price : null;

                  return (
                    <label key={optionValue} className="flex items-center justify-between bg-gray-100 rounded-lg px-3 py-3 my-2 hover:bg-indigo-200 cursor-pointer border border-gray-300">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name={optionKey}
                          value={optionValue}
                          checked={selectedOptions[optionKey] === optionValue}
                          onChange={(e) => handleOptionChange(optionKey, e.target.value)}
                          className="w-5 h-5"
                        />
                        <p className="pl-3 text-base font-semibold text-gray-900">{optionLabel}</p>
                      </div>
                      {optionPrice && (
                        <p className="text-sm font-semibold text-gray-600">£{optionPrice.toFixed(2)}</p>
                      )}
                    </label>
                  );
                })}
              </fieldset>
            );
          })}

          {/* Render collapsible options and extras - each option gets its own collapsible section */}
          {((item.collapsibleOptions && Object.keys(item.collapsibleOptions).length > 0) ||
            (item.extras && item.extras.length > 0)) && (
            <div className="mb-6 space-y-3">
              {(() => {
                // Combine collapsible options and extras into a single set
                const collapsibleKeys = new Set();

                // Add keys from collapsibleOptions
                if (item.collapsibleOptions) {
                  Object.keys(item.collapsibleOptions).forEach(key => collapsibleKeys.add(key));
                }

                // Add keys from extras
                if (item.extras) {
                  item.extras.forEach(key => collapsibleKeys.add(key));
                }

                // Render all collapsible options
                return Array.from(collapsibleKeys).map((optionKey) => {
                  const options = item.options[optionKey];
                  if (!options) return null;

                  const capitalizedLabel = optionKey.charAt(0).toUpperCase() + optionKey.slice(1).replace(/-/g, ' ');
                  const isExpanded = expandedOptions[optionKey];
                  const currentValue = selectedOptions[optionKey];
                  const currentLabel = typeof currentValue === 'string'
                    ? currentValue.charAt(0).toUpperCase() + currentValue.slice(1)
                    : '';

                  return (
                    <div key={optionKey}>
                      <button
                        type="button"
                        onClick={() => toggleOptionExpanded(optionKey)}
                        className="w-full flex items-center justify-between bg-blue-100 rounded-lg px-4 py-3 border border-blue-300 hover:bg-blue-200 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-base text-gray-600">{capitalizedLabel}:</span>
                          <span className="font-bold text-lg text-gray-900">{currentLabel}</span>
                        </div>
                        <span className="text-2xl text-gray-700">{isExpanded ? '−' : '+'}</span>
                      </button>

                      {isExpanded && (
                        <div className="mt-2 border border-gray-300 rounded-lg p-3 bg-gray-50">
                          {options.map((option, index) => {
                            const optionValue = typeof option === 'object' ? option.value : option;
                            const optionLabel = typeof option === 'object'
                              ? option.value.charAt(0).toUpperCase() + option.value.slice(1)
                              : option.charAt(0).toUpperCase() + option.slice(1);
                            const optionPrice = typeof option === 'object' && option.price ? option.price : null;

                            return (
                              <label key={optionValue} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 my-1.5 hover:bg-indigo-100 cursor-pointer border border-gray-200">
                                <div className="flex items-center">
                                  <input
                                    type="radio"
                                    name={optionKey}
                                    value={optionValue}
                                    checked={selectedOptions[optionKey] === optionValue}
                                    onChange={(e) => handleOptionChange(optionKey, e.target.value)}
                                    className="w-5 h-5"
                                  />
                                  <p className="pl-3 text-base font-semibold text-gray-900">{optionLabel}</p>
                                </div>
                                {optionPrice && optionPrice > 0 && (
                                  <p className="text-sm font-semibold text-gray-600">+£{optionPrice.toFixed(2)}</p>
                                )}
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !tableNumber || addedToCart}
            className={`w-full font-bold py-3 px-4 rounded-lg transition-colors text-xl ${
              addedToCart
                ? 'bg-green-600 text-white'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed'
            }`}
          >
            {addedToCart ? '✓ Added!' : isSubmitting ? 'Adding to Order...' : 'Add to Order'}
          </button>

          {price && (
            <p className="text-center text-gray-600 mt-2 text-base font-semibold">£{price.toFixed(2)}</p>
          )}
        </form>
      </div>
    </div>
  );
}
