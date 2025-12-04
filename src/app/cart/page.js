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
          <div className="bg-brand-yellow border-2 border-black text-black px-4 py-2 rounded-lg mb-4 text-base font-semibold">
            Please select a table number first
          </div>
        )}

        {submitError && (
          <div className="bg-brand-pink border-2 border-black text-white px-4 py-2 rounded-lg mb-4 text-base font-semibold">
            {submitError}
          </div>
        )}

        {cart.items.length === 0 ? (
          <div className="bg-white rounded-lg border-2 border-black p-6 text-center">
            <div className="text-3xl mb-2">🛒</div>
            <h2 className="text-lg font-semibold mb-1">Your Order is Empty</h2>
            <p className="text-black mb-3 text-sm">Add items to your order to get started.</p>
            <button
              onClick={() => router.push('/')}
              className="bg-brand-teal text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition-colors text-sm font-bold"
            >
              Browse Menu
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-2 mb-4">
              {cart.items.map((item) => (
                <div key={item.cartId} className="bg-white rounded-lg overflow-hidden border-2 border-black">
                  <div className="p-2.5">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="font-bold text-sm text-black">{item.name}</p>
                        {item.options && Object.keys(item.options).length > 0 && (
                          <ul className="text-xs mt-1 ml-4 list-disc">
                            {Object.entries(item.options).map(([key, value]) => (
                              <li key={key} className="text-black">
                                <span className="font-normal">{key}: </span>
                                <span className="font-bold text-black">{value}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        {item.price && (
                          <p className="text-xs text-black mt-1 font-semibold">£{item.price.toFixed(2)} each</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveItem(item.cartId)}
                        className="text-brand-pink hover:opacity-80 font-bold text-lg ml-2"
                        title="Remove item"
                      >
                        ×
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-xs font-semibold text-black">Qty:</label>
                      <button
                        onClick={() => handleUpdateQuantity(item.cartId, item.quantity - 1)}
                        className="bg-white border border-black hover:bg-brand-yellow text-black font-bold px-2 py-0.5 rounded text-sm"
                      >
                        −
                      </button>
                      <span className="text-sm font-bold text-black min-w-[2rem] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(item.cartId, item.quantity + 1)}
                        className="bg-white border border-black hover:bg-brand-yellow text-black font-bold px-2 py-0.5 rounded text-sm"
                      >
                        +
                      </button>
                      {item.price && (
                        <span className="ml-auto text-sm font-bold text-black">
                          £{(item.price * item.quantity).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-brand-yellow rounded-lg p-3 mb-4 border-2 border-black">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-black">Total</span>
                <span className="text-lg font-bold text-black">£{totalPrice.toFixed(2)}</span>
              </div>
              <p className="text-xs text-black mt-1">{cart.items.length} item{cart.items.length !== 1 ? 's' : ''}</p>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleSendToKitchen}
                disabled={isSubmitting || !cart.tableNumber}
                className="w-full bg-brand-teal text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-lg"
              >
                {isSubmitting ? 'Sending to Kitchen...' : 'Send to Kitchen'}
              </button>

              <button
                onClick={handleClearCart}
                disabled={isSubmitting}
                className="w-full bg-brand-pink text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-base"
              >
                Clear All Items
              </button>

              <button
                onClick={() => router.push('/')}
                className="w-full bg-white border-2 border-black text-black font-bold py-2 px-4 rounded-lg hover:bg-brand-yellow transition-colors text-base"
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
