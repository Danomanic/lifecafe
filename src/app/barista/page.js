'use client';

import { useEffect, useState } from 'react';

export default function BaristaPage() {
  const [orders, setOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completingOrderId, setCompletingOrderId] = useState(null);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [reorderingOrderId, setReorderingOrderId] = useState(null);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Fetch pending orders
  const fetchOrders = async (isInitial = false) => {
    try {
      const response = await fetch('/api/orders?status=pending');

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      setOrders(data);
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

  // Fetch completed and cancelled orders
  const fetchCompletedOrders = async () => {
    try {
      // Fetch both completed and cancelled orders
      const [completedRes, cancelledRes] = await Promise.all([
        fetch('/api/orders?status=completed'),
        fetch('/api/orders?status=cancelled')
      ]);

      if (!completedRes.ok || !cancelledRes.ok) {
        throw new Error('Failed to fetch orders');
      }

      const completed = await completedRes.json();
      const cancelled = await cancelledRes.json();
      const allOrders = [...completed, ...cancelled];

      // Sort by most recently updated first
      const sortedData = allOrders.sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      setCompletedOrders(sortedData.slice(0, 50)); // Keep last 50
    } catch (err) {
      console.error('Error fetching completed orders:', err);
    }
  };

  // Initial load
  useEffect(() => {
    fetchOrders(true);
    fetchCompletedOrders();

    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      fetchOrders(false);
      fetchCompletedOrders();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Update current time every minute for elapsed time calculation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Calculate elapsed time since order was created
  const getElapsedTime = (createdAt) => {
    const elapsed = currentTime - new Date(createdAt).getTime();
    const minutes = Math.floor(elapsed / 60000);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return 'Just now';
    }
  };

  // Mark order as complete
  const handleCompleteOrder = async (orderId) => {
    try {
      setCompletingOrderId(orderId);

      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'completed' }),
      });

      if (!response.ok) {
        throw new Error('Failed to complete order');
      }

      // Remove completed order from the list
      setOrders(orders.filter(order => order.id !== orderId));
      // Refresh completed orders
      fetchCompletedOrders();
    } catch (err) {
      console.error('Error completing order:', err);
      alert('Failed to complete order: ' + err.message);
    } finally {
      setCompletingOrderId(null);
    }
  };

  // Cancel order
  const handleCancelOrder = async (orderId) => {
    if (!confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      setCancellingOrderId(orderId);

      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'cancelled' }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel order');
      }

      // Remove cancelled order from the list
      setOrders(orders.filter(order => order.id !== orderId));
      // Refresh completed orders (includes cancelled)
      fetchCompletedOrders();
    } catch (err) {
      console.error('Error cancelling order:', err);
      alert('Failed to cancel order: ' + err.message);
    } finally {
      setCancellingOrderId(null);
    }
  };

  // Reorder - create a new order with same items
  const handleReorder = async (order) => {
    try {
      setReorderingOrderId(order.id);

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tableNumber: order.tableNumber,
          items: order.items.map(item => {
            // Get options - they're stored as objects in MongoDB
            let options = null;
            if (item.options) {
              // If it's already an object, use it directly
              if (typeof item.options === 'object') {
                options = item.options;
              } else {
                // If it's a string, parse it (backwards compatibility)
                try {
                  options = JSON.parse(item.options);
                } catch (e) {
                  console.error('Error parsing options:', e);
                }
              }
            }

            return {
              name: item.name,
              slug: item.slug,
              options: options,
              price: item.price,
              quantity: item.quantity,
              notes: item.notes,
            };
          }),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reorder');
      }

      // Refresh orders
      fetchOrders();
    } catch (err) {
      console.error('Error reordering:', err);
      alert('Failed to reorder: ' + err.message);
    } finally {
      setReorderingOrderId(null);
    }
  };

  // Group orders by table number and sort by oldest first
  const ordersByTable = orders.reduce((acc, order) => {
    const tableNum = order.tableNumber;
    if (!acc[tableNum]) {
      acc[tableNum] = [];
    }
    acc[tableNum].push(order);
    return acc;
  }, {});

  // Sort orders within each table by created time (oldest first)
  Object.keys(ordersByTable).forEach(tableNum => {
    ordersByTable[tableNum].sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  });

  // Sort tables by the oldest order in each table (oldest first)
  const sortedTableNumbers = Object.keys(ordersByTable).sort((a, b) => {
    const oldestInA = ordersByTable[a][0]; // First order is oldest due to sorting above
    const oldestInB = ordersByTable[b][0];
    return new Date(oldestInA.createdAt).getTime() - new Date(oldestInB.createdAt).getTime();
  });

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-500">Loading orders...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-2">
      <div className="max-w-6xl mx-auto">
        {error && (
          <div className="bg-red-900 border border-red-600 text-red-200 px-3 py-2 rounded mb-2 text-sm">
            {error}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="bg-gray-900 rounded-lg p-6 text-center border border-gray-800">
            <div className="text-4xl mb-2">☕</div>
            <h2 className="text-lg font-semibold mb-1 text-gray-300">No Active Orders</h2>
            <p className="text-gray-500 text-xs">All caught up! New orders will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {sortedTableNumbers.map((tableNum) => {
              // Calculate total price for all orders at this table
              const tableTotal = ordersByTable[tableNum].reduce((total, order) => {
                const orderTotal = order.items.reduce((sum, item) => {
                  return sum + (item.price || 0) * (item.quantity || 1);
                }, 0);
                return total + orderTotal;
              }, 0);

              return (
              <div key={tableNum} className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
                <div className="bg-indigo-700 text-white px-2 py-1 flex justify-between items-center">
                  <h2 className="text-base font-bold">Table {tableNum}</h2>
                  <span className="text-base font-bold">£{tableTotal.toFixed(2)}</span>
                </div>

                <div className="divide-y divide-gray-800">
                  {ordersByTable[tableNum].map((order) => (
                    <div key={order.id} className="p-2">
                      <div className="space-y-1">
                        {order.items.map((item, index) => {
                          // Get options - they're stored as objects in MongoDB
                          let options = null;
                          if (item.options) {
                            // If it's already an object, use it directly
                            if (typeof item.options === 'object') {
                              options = item.options;
                            } else {
                              // If it's a string, parse it (backwards compatibility)
                              try {
                                options = JSON.parse(item.options);
                              } catch (e) {
                                console.error('Error parsing options:', e);
                              }
                            }
                          }

                          return (
                            <div key={item.id}>
                              <div className="flex justify-between items-baseline">
                                <p className="font-bold text-base text-gray-100">{item.name}</p>
                                <div className="flex items-baseline gap-2">
                                  {item.quantity > 1 && (
                                    <span className="text-base font-bold text-gray-300">x{item.quantity}</span>
                                  )}
                                  {index === 0 && (
                                    <span className="text-base font-bold text-orange-400">{getElapsedTime(order.createdAt)}</span>
                                  )}
                                </div>
                              </div>
                              {options && (
                                <ul className="text-sm mt-1 ml-4 list-disc">
                                  {Object.entries(options).map(([key, value], index) => (
                                    <li key={key} className="text-gray-400">
                                      <span className="font-normal">{key}: </span>
                                      <span className="font-bold text-gray-100">{value}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                              {item.price && (
                                <p className="text-xs text-green-400 mt-0.5 text-right">£{item.price.toFixed(2)}</p>
                              )}
                              {item.notes && (
                                <p className="text-xs text-gray-400 mt-0.5 italic">&quot;{item.notes}&quot;</p>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex gap-1 mt-1.5">
                        <button
                          onClick={() => handleCompleteOrder(order.id)}
                          disabled={completingOrderId === order.id || cancellingOrderId === order.id}
                          className="flex-1 bg-green-700 text-white font-bold px-2 py-1 rounded hover:bg-green-600 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors text-xs"
                        >
                          {completingOrderId === order.id ? 'Completing...' : 'Complete'}
                        </button>
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          disabled={completingOrderId === order.id || cancellingOrderId === order.id}
                          className="bg-red-700 text-white font-bold px-1 py-1 rounded hover:bg-red-600 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors text-xs w-8"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              );
            })}
          </div>
        )}

        {/* Orders Log */}
        {completedOrders.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-bold mb-2 text-gray-300 text-center">Orders Log</h3>
            <div className="bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-xs overflow-x-auto">
              {completedOrders.map((order) => (
                <div key={order.id} className="mb-3 pb-3 border-b border-gray-700 last:border-b-0 last:mb-0 last:pb-0">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <span className="text-gray-500">[{order.updatedAt ? new Date(order.updatedAt).toLocaleString() : new Date(order.createdAt).toLocaleString()}]</span>
                      {' '}
                      <span className="text-yellow-400">Order #{order.id}</span>
                      {' '}
                      <span className="text-blue-400">Table {order.tableNumber}</span>
                      {' '}
                      {order.status === 'completed' ? (
                        <span className="text-green-500">✓ COMPLETED</span>
                      ) : (
                        <span className="text-red-500">✕ CANCELLED</span>
                      )}
                      <div className="ml-4 mt-1">
                        {order.items.map((item, idx) => {
                          // Get options - they're stored as objects in MongoDB
                          let options = null;
                          if (item.options) {
                            // If it's already an object, use it directly
                            if (typeof item.options === 'object') {
                              options = item.options;
                            } else {
                              // If it's a string, parse it (backwards compatibility)
                              try {
                                options = JSON.parse(item.options);
                              } catch (e) {
                                console.error('Error parsing options:', e);
                              }
                            }
                          }

                          return (
                            <div key={item.id}>
                              • {item.name}
                              {options && Object.entries(options).map(([key, value]) => ` [${key}: ${value}]`).join('')}
                              {item.price && ` £${item.price.toFixed(2)}`}
                              {item.quantity > 1 && ` x${item.quantity}`}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <button
                      onClick={() => handleReorder(order)}
                      disabled={reorderingOrderId === order.id}
                      className="ml-4 bg-yellow-600 text-white px-3 py-1 rounded text-xs hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {reorderingOrderId === order.id ? 'Reordering...' : 'Reorder'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
