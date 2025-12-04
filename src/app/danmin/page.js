'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function DanminPage() {
  const [allOrders, setAllOrders] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all orders (pending, completed, cancelled)
  const fetchAllOrders = async (isInitial = false) => {
    try {
      // Fetch all order types
      const [pendingRes, completedRes, cancelledRes] = await Promise.all([
        fetch('/api/orders?status=pending'),
        fetch('/api/orders?status=completed'),
        fetch('/api/orders?status=cancelled')
      ]);

      if (!pendingRes.ok || !completedRes.ok || !cancelledRes.ok) {
        throw new Error('Failed to fetch orders');
      }

      const pending = await pendingRes.json();
      const completed = await completedRes.json();
      const cancelled = await cancelledRes.json();
      const orders = [...pending, ...completed, ...cancelled];

      // Sort by most recently updated first
      const sortedData = orders.sort((a, b) =>
        new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
      );
      setAllOrders(sortedData);
      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.message);
    } finally {
      if (isInitial) {
        setInitialLoading(false);
      }
    }
  };

  // Initial load
  useEffect(() => {
    fetchAllOrders(true);

    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      fetchAllOrders(false);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-950 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-400">Loading admin panel...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-green-400 font-mono">DANMIN // Admin Panel</h1>
          <Link
            href="/"
            className="bg-gray-800 text-gray-300 px-4 py-2 rounded hover:bg-gray-700 transition-colors text-sm font-mono"
          >
            ← Back to App
          </Link>
        </div>

        {error && (
          <div className="bg-red-900 border border-red-600 text-red-200 px-3 py-2 rounded mb-4 text-sm font-mono">
            ERROR: {error}
          </div>
        )}

        {/* Orders Log */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-bold text-gray-300 font-mono">
              ORDERS LOG [{allOrders.length} total]
            </h2>
            <button
              onClick={() => fetchAllOrders(false)}
              className="bg-gray-800 text-gray-300 px-3 py-1 rounded hover:bg-gray-700 transition-colors text-xs font-mono"
            >
              ↻ Refresh
            </button>
          </div>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs overflow-x-auto border border-gray-700 max-h-[600px] overflow-y-auto">
            {allOrders.length === 0 ? (
              <div className="text-gray-500">No orders found.</div>
            ) : (
              allOrders.map((order) => {
                // Get options - they're stored as objects in MongoDB
                const renderOptions = (item) => {
                  let options = null;
                  if (item.options) {
                    if (typeof item.options === 'object') {
                      options = item.options;
                    } else {
                      try {
                        options = JSON.parse(item.options);
                      } catch (e) {
                        console.error('Error parsing options:', e);
                      }
                    }
                  }
                  return options ? Object.entries(options).map(([key, value]) => ` [${key}: ${value}]`).join('') : '';
                };

                return (
                  <div key={order.id} className="mb-4 pb-4 border-b border-gray-700 last:border-b-0 last:mb-0 last:pb-0">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <span className="text-gray-500">[{order.updatedAt ? new Date(order.updatedAt).toLocaleString() : new Date(order.createdAt).toLocaleString()}]</span>
                        {' '}
                        <span className="text-yellow-400">Order #{order.id}</span>
                        {' '}
                        <span className="text-blue-400">Table {order.tableNumber}</span>
                        {' '}
                        {order.status === 'pending' && <span className="text-orange-400">⧗ PENDING</span>}
                        {order.status === 'completed' && <span className="text-green-500">✓ COMPLETED</span>}
                        {order.status === 'cancelled' && <span className="text-red-500">✕ CANCELLED</span>}
                        <div className="ml-4 mt-1">
                          {order.items.map((item) => (
                            <div key={item.id}>
                              • {item.name}
                              {renderOptions(item)}
                              {item.price && ` £${item.price.toFixed(2)}`}
                              {item.quantity > 1 && ` x${item.quantity}`}
                              {item.notes && ` NOTE: "${item.notes}"`}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Admin Tools Section - Placeholder for future tools */}
        <div className="mt-6">
          <h2 className="text-lg font-bold text-gray-300 font-mono mb-2">ADMIN TOOLS</h2>
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
            <p className="text-gray-500 text-sm font-mono">Additional admin tools will appear here.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
