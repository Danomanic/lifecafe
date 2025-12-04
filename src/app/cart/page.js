'use client';

import Navbar from "@/app/navbar";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getCart, removeFromCart, updateCartItemQuantity, clearCart, getCartTotal } from '@/lib/cart';

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState({ tableNumber: null, items: [] });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Load cart on mount
  useEffect(() => {
    loadCart();

    // Listen for cart updates
    const handleCartUpdate = () => {
      loadCart();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  const loadCart = () => {
    const currentCart = getCart();
    setCart(currentCart);
  };

  const handleRemoveItem = (cartId) => {
    removeFromCart(cartId);
    window.dispatchEvent(new Event('cartUpdated'));
    loadCart();
  };

  const handleUpdateQuantity = (cartId, newQuantity) => {
    if (newQuantity < 1) return;
    updateCartItemQuantity(cartId, newQuantity);
    loadCart();
  };

  const handleClearCart = () => {
    if (!confirm('Are you sure you want to clear all items from your order?')) {
      return;
    }
    clearCart();
    window.dispatchEvent(new Event('cartUpdated'));
    loadCart();
  };

  const handleSendToKitchen = async () => {
    if (cart.items.length === 0) {
      setSubmitError('Your order is empty');
      return;
    }

    if (!cart.tableNumber) {
      setSubmitError('Please select a table number first');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const orderData = {
      tableNumber: parseInt(cart.tableNumber),
      items: cart.items.map(item => ({
        name: item.name,
        slug: item.slug,
        options: item.options,
        price: item.price,
        quantity: item.quantity,
        notes: item.notes || null,
      })),
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

      // Clear cart
      clearCart();
      window.dispatchEvent(new Event('cartUpdated'));

      // Redirect to success page
      router.push('/drinks?success=true');
    } catch (error) {
      console.error('Error submitting order:', error);
      setSubmitError(error.message);
      setIsSubmitting(false);
    }
  };

  const totalPrice = getCartTotal();

  return (
    <div>
      <Navbar />

      <div className="mx-4 mt-3">
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-xl font-bold">Review Order</h1>
          {cart.tableNumber && (
            <span className="text-base font-semibold text-gray-700">Table {cart.tableNumber}</span>
          )}
        </div>

        {!cart.tableNumber && (
          <div className="bg-yellow-100 border border-yellow-500 text-yellow-900 px-4 py-2 rounded-lg mb-4 text-base font-semibold">
            Please select a table number first
          </div>
        )}

        {submitError && (
          <div className="bg-red-100 border border-red-500 text-red-900 px-4 py-2 rounded-lg mb-4 text-base font-semibold">
            {submitError}
          </div>
        )}

        {cart.items.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl mb-2">🛒</div>
            <h2 className="text-lg font-semibold mb-1">Your Order is Empty</h2>
            <p className="text-gray-600 mb-3 text-sm">Add items to your order to get started.</p>
            <button
              onClick={() => router.push('/')}
              className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-bold"
            >
              Browse Menu
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-2 mb-4">
              {cart.items.map((item) => (
                <div key={item.cartId} className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
                  <div className="p-2.5">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="font-bold text-sm text-gray-900">{item.name}</p>
                        {item.options && Object.keys(item.options).length > 0 && (
                          <ul className="text-xs mt-1 ml-4 list-disc">
                            {Object.entries(item.options).map(([key, value]) => (
                              <li key={key} className="text-gray-600">
                                <span className="font-normal">{key}: </span>
                                <span className="font-bold text-gray-900">{value}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        {item.price && (
                          <p className="text-xs text-gray-600 mt-1 font-semibold">£{item.price.toFixed(2)} each</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveItem(item.cartId)}
                        className="text-red-600 hover:text-red-800 font-bold text-lg ml-2"
                        title="Remove item"
                      >
                        ×
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-xs font-semibold text-gray-700">Qty:</label>
                      <button
                        onClick={() => handleUpdateQuantity(item.cartId, item.quantity - 1)}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold px-2 py-0.5 rounded text-sm"
                      >
                        −
                      </button>
                      <span className="text-sm font-bold text-gray-900 min-w-[2rem] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(item.cartId, item.quantity + 1)}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold px-2 py-0.5 rounded text-sm"
                      >
                        +
                      </button>
                      {item.price && (
                        <span className="ml-auto text-sm font-bold text-gray-900">
                          £{(item.price * item.quantity).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gray-100 rounded-lg p-3 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-lg font-bold text-gray-900">£{totalPrice.toFixed(2)}</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">{cart.items.length} item{cart.items.length !== 1 ? 's' : ''}</p>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleSendToKitchen}
                disabled={isSubmitting || !cart.tableNumber}
                className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-lg"
              >
                {isSubmitting ? 'Sending to Kitchen...' : 'Send to Kitchen'}
              </button>

              <button
                onClick={handleClearCart}
                disabled={isSubmitting}
                className="w-full bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-base"
              >
                Clear All Items
              </button>

              <button
                onClick={() => router.push('/')}
                className="w-full bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors text-base"
              >
                Add More Items
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
