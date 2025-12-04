'use client';

import Navbar from "@/app/navbar";
import { addToCart } from '@/lib/cart';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import menuData from '../../../menu.json';
import { useTableNumber } from '@/hooks/useTableNumber';
import { calculateItemPrice } from '@/lib/priceCalculator';
import { findItemBySlug, getDefaultOptions } from '@/lib/menuUtils';
import { DEFAULT_ITEM_QUANTITY } from '@/lib/constants';
import OptionRadioGroup from '@/app/components/OptionRadioGroup';
import CollapsibleOption from '@/app/components/CollapsibleOption';
import QuantitySelector from '@/app/components/QuantitySelector';

export default function ItemPage({ params }) {
  const router = useRouter();
  const [slug, setSlug] = useState(null);
  const { tableNumber } = useTableNumber();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [addedToCart, setAddedToCart] = useState(false);
  const [item, setItem] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [returnUrl, setReturnUrl] = useState('/drinks');
  const [expandedOptions, setExpandedOptions] = useState({});
  const [quantity, setQuantity] = useState(DEFAULT_ITEM_QUANTITY);

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

    const foundItem = findItemBySlug(menuData, slug);
    setItem(foundItem);

    // Set default selected options
    if (foundItem) {
      setSelectedOptions(getDefaultOptions(foundItem));
    }
  }, [slug]);

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
    if (newQuantity >= DEFAULT_ITEM_QUANTITY) {
      setQuantity(newQuantity);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setAddedToCart(false);

    // Check if table number is set
    if (!tableNumber) {
      setSubmitError('Please select a table number first');
      setIsSubmitting(false);
      return;
    }

    const cartItem = {
      name: item.name,
      slug: slug,
      options: selectedOptions,
      price: calculateItemPrice(item, selectedOptions),
      quantity: quantity,
    };

    console.log('Item being added to cart:', cartItem);

    try {
      // Add to cart
      addToCart(cartItem, tableNumber);

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

  const price = calculateItemPrice(item, selectedOptions);

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

            return (
              <OptionRadioGroup
                key={optionKey}
                optionKey={optionKey}
                options={item.options[optionKey]}
                selectedValue={selectedOptions[optionKey]}
                onChange={handleOptionChange}
              />
            );
          })}

          {/* Render collapsible options and extras */}
          {((item.collapsibleOptions && Object.keys(item.collapsibleOptions).length > 0) ||
            (item.extras && item.extras.length > 0)) && (
            <div className="mb-6 space-y-3">
              {(() => {
                // Combine collapsible options and extras into a single set
                const collapsibleKeys = new Set();

                if (item.collapsibleOptions) {
                  Object.keys(item.collapsibleOptions).forEach(key => collapsibleKeys.add(key));
                }

                if (item.extras) {
                  item.extras.forEach(key => collapsibleKeys.add(key));
                }

                return Array.from(collapsibleKeys).map((optionKey) => {
                  const options = item.options[optionKey];
                  if (!options) return null;

                  return (
                    <CollapsibleOption
                      key={optionKey}
                      optionKey={optionKey}
                      options={options}
                      selectedValue={selectedOptions[optionKey]}
                      isExpanded={expandedOptions[optionKey]}
                      onToggle={() => toggleOptionExpanded(optionKey)}
                      onChange={handleOptionChange}
                    />
                  );
                });
              })()}
            </div>
          )}

          <QuantitySelector
            quantity={quantity}
            onQuantityChange={handleQuantityChange}
          />

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
