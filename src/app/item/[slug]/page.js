'use client';

import Navbar from "@/app/navbar";
import { addToCart } from '@/lib/cart';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import menuData from '../../../menu.json';

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
  const [quantity, setQuantity] = useState(1);

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

    let foundItem = null;

    // Search through drinks
    const drinks = menuData.drinks;
    Object.keys(drinks).forEach((categoryKey) => {
      if (categoryKey !== 'title' && drinks[categoryKey].items) {
        const found = drinks[categoryKey].items.find(i => i.slug === slug);
        if (found) {
          foundItem = found;
        }
      }
    });

    // If not found in drinks, search through cakes
    if (!foundItem) {
      // Search cakesAndSnacks
      if (menuData.cakesAndSnacks && menuData.cakesAndSnacks.items) {
        const found = menuData.cakesAndSnacks.items.find(i => i.slug === slug);
        if (found) {
          foundItem = found;
        }
      }

      // Search glutenFreeCakes
      if (!foundItem && menuData.glutenFreeCakes && menuData.glutenFreeCakes.items) {
        const found = menuData.glutenFreeCakes.items.find(i => i.slug === slug);
        if (found) {
          foundItem = found;
        }
      }
    }

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

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
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
      quantity: quantity,
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
      }, 400);
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
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">{item.name}</h1>
          {price && (
            <p className="text-2xl font-bold text-black">£{price.toFixed(2)}</p>
          )}
        </div>

        {!tableNumber && (
          <div className="bg-brand-yellow border-2 border-black text-black px-4 py-2 rounded-lg mb-4 text-base font-semibold">
            Please select a table number first
          </div>
        )}

        {submitError && (
          <div className="bg-brand-pink border-2 border-black text-white px-4 py-2 rounded-lg mb-4 text-base font-semibold">
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
                <p className="font-bold mb-2 text-xl text-black">{capitalizedLabel}</p>
                {options.map((option, index) => {
                  const optionValue = typeof option === 'object' ? option.value : option;
                  const optionLabel = typeof option === 'object'
                    ? option.value.charAt(0).toUpperCase() + option.value.slice(1)
                    : option.charAt(0).toUpperCase() + option.slice(1);
                  const optionPrice = typeof option === 'object' && option.price && option.price > 0 ? option.price : null;

                  return (
                    <label key={optionValue} className="flex items-center justify-between bg-white rounded-lg px-3 py-3 my-2 hover:bg-brand-yellow cursor-pointer border-2 border-black">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name={optionKey}
                          value={optionValue}
                          checked={selectedOptions[optionKey] === optionValue}
                          onChange={(e) => handleOptionChange(optionKey, e.target.value)}
                          className="w-5 h-5"
                        />
                        <p className="pl-3 text-base font-semibold text-black">{optionLabel}</p>
                      </div>
                      {optionPrice && (
                        <p className="text-sm font-semibold text-black">£{optionPrice.toFixed(2)}</p>
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
                        className="w-full flex items-center justify-between bg-white rounded-lg px-4 py-3 border-2 border-black hover:bg-brand-yellow transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-base text-black">{capitalizedLabel}:</span>
                          <span className="font-bold text-lg text-black">{currentLabel}</span>
                        </div>
                        <span className="text-2xl text-black">{isExpanded ? '−' : '+'}</span>
                      </button>

                      {isExpanded && (
                        <div className="mt-2 border-2 border-black rounded-lg p-3 bg-white">
                          {options.map((option, index) => {
                            const optionValue = typeof option === 'object' ? option.value : option;
                            const optionLabel = typeof option === 'object'
                              ? option.value.charAt(0).toUpperCase() + option.value.slice(1)
                              : option.charAt(0).toUpperCase() + option.slice(1);
                            const optionPrice = typeof option === 'object' && option.price ? option.price : null;

                            return (
                              <label key={optionValue} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 my-1.5 hover:bg-brand-yellow cursor-pointer border border-black">
                                <div className="flex items-center">
                                  <input
                                    type="radio"
                                    name={optionKey}
                                    value={optionValue}
                                    checked={selectedOptions[optionKey] === optionValue}
                                    onChange={(e) => handleOptionChange(optionKey, e.target.value)}
                                    className="w-5 h-5"
                                  />
                                  <p className="pl-3 text-base font-semibold text-black">{optionLabel}</p>
                                </div>
                                {optionPrice && optionPrice > 0 && (
                                  <p className="text-sm font-semibold text-black">+£{optionPrice.toFixed(2)}</p>
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

          <div className="mb-4 bg-white border-2 border-black rounded-lg p-4">
            <div className="flex items-center justify-between">
              <label className="text-base font-bold text-black">Quantity:</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleQuantityChange(quantity - 1)}
                  className="bg-white border-2 border-black hover:bg-brand-yellow text-black font-bold px-3 py-1 rounded text-lg"
                >
                  −
                </button>
                <span className="text-xl font-bold text-black min-w-[3rem] text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => handleQuantityChange(quantity + 1)}
                  className="bg-white border-2 border-black hover:bg-brand-yellow text-black font-bold px-3 py-1 rounded text-lg"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !tableNumber || addedToCart}
            className={`w-full font-bold py-3 px-4 rounded-lg transition-colors text-xl ${
              addedToCart
                ? 'bg-brand-pink text-white'
                : 'bg-brand-teal text-white hover:opacity-90 disabled:bg-gray-400 disabled:cursor-not-allowed'
            }`}
          >
            {addedToCart ? '✓ Added!' : isSubmitting ? 'Adding to Order...' : 'Add to Order'}
          </button>
        </form>
      </div>
    </div>
  );
}
