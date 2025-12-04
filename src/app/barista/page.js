'use client';

import { useEffect, useState } from 'react';

export default function BaristaPage() {
  const [orders, setOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completingOrderId, setCompletingOrderId] = useState(null);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [sendingOrderId, setSendingOrderId] = useState(null);
  const [reorderingOrderId, setReorderingOrderId] = useState(null);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Check if a date is today
  const isToday = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  // Fetch pending and ready orders
  const fetchOrders = async (isInitial = false) => {
    try {
      // Fetch both pending and ready orders
      const [pendingRes, readyRes] = await Promise.all([
        fetch('/api/orders?status=pending'),
        fetch('/api/orders?status=ready')
      ]);

      if (!pendingRes.ok || !readyRes.ok) {
        throw new Error('Failed to fetch orders');
      }

      const pending = await pendingRes.json();
      const ready = await readyRes.json();
      const allOrders = [...pending, ...ready];

      // Filter to only today's orders
      const todaysOrders = allOrders.filter(order => isToday(order.createdAt));
      setOrders(todaysOrders);
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

      // Filter to only today's orders
      const todaysOrders = allOrders.filter(order => isToday(order.updatedAt || order.createdAt));

      // Sort by most recently updated first
      const sortedData = todaysOrders.sort((a, b) =>
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

  // Get color class for elapsed time based on age
  const getElapsedTimeClass = (createdAt) => {
    const elapsed = currentTime - new Date(createdAt).getTime();
    const minutes = Math.floor(elapsed / 60000);

    if (minutes >= 10) {
      return 'text-red-500 font-bold animate-pulse'; // Flash red
    } else if (minutes >= 5) {
      return 'text-amber-500 font-bold'; // Solid amber
    } else {
      return 'text-green-500 font-bold'; // Green
    }
  };

  // Mark order as ready
  const handleCompleteOrder = async (orderId) => {
    try {
      setCompletingOrderId(orderId);

      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'ready' }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark order as ready');
      }

      // Refresh orders to show updated status
      await fetchOrders();
    } catch (err) {
      console.error('Error marking order as ready:', err);
      alert('Failed to mark order as ready: ' + err.message);
    } finally {
      setCompletingOrderId(null);
    }
  };

  // Send order to table (mark as completed)
  const handleSendToTable = async (orderId) => {
    try {
      setSendingOrderId(orderId);

      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'completed' }),
      });

      if (!response.ok) {
        throw new Error('Failed to send order to table');
      }

      // Remove from active orders list
      setOrders(orders.filter(order => order.id !== orderId));
      // Refresh completed orders
      fetchCompletedOrders();
    } catch (err) {
      console.error('Error sending order to table:', err);
      alert('Failed to send order to table: ' + err.message);
    } finally {
      setSendingOrderId(null);
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

      // Refresh orders immediately to show the new order
      await fetchOrders();
      await fetchCompletedOrders();
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
    <div className="bg-gray-950 overflow-y-auto">
      {error && (
        <div className="bg-red-900 border border-red-600 text-red-200 px-3 py-2 mx-2 mt-2 rounded text-sm">
          {error}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="h-screen flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-lg p-6 text-center border border-gray-800">
            <div className="text-4xl mb-2">☕</div>
            <h2 className="text-lg font-semibold mb-1 text-gray-300">No Active Orders</h2>
            <p className="text-gray-500 text-xs">All caught up! New orders will appear here.</p>
          </div>
        </div>
      ) : (
        <div className="h-screen overflow-x-auto overflow-y-hidden p-2">
          <div className="flex gap-2 h-full">
            {sortedTableNumbers.map((tableNum) => {
                // Calculate total price for all orders at this table
                const tableTotal = ordersByTable[tableNum].reduce((total, order) => {
                  const orderTotal = order.items.reduce((sum, item) => {
                    return sum + (item.price || 0) * (item.quantity || 1);
                  }, 0);
                  return total + orderTotal;
                }, 0);

                return (
                <div key={tableNum} className="flex-shrink-0 w-80 bg-gray-900 rounded-lg overflow-hidden border border-gray-800 flex flex-col h-full">
                  <div className="bg-indigo-700 text-white px-2 py-1 flex justify-between items-center flex-shrink-0">
                    <h2 className="text-base font-bold">Table {tableNum}</h2>
                    <span className="text-base font-bold">£{tableTotal.toFixed(2)}</span>
                  </div>

                  <div className="divide-y divide-gray-800 overflow-y-auto flex-1">
                    {ordersByTable[tableNum].map((order) => (
                      <div key={order.id} className={`p-2 ${order.status === 'ready' ? 'opacity-50' : ''}`}>
                        <div className="space-y-2">
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
                              <div key={item.id} className={`pb-2 ${index < order.items.length - 1 ? 'border-b border-gray-700' : ''}`}>
                                <div className="flex justify-between items-baseline">
                                  <p className="font-bold text-base text-gray-100">{item.name}</p>
                                  <div className="flex items-baseline gap-2">
                                    {item.quantity > 1 && (
                                      <span className="text-base font-bold text-gray-300">x{item.quantity}</span>
                                    )}
                                    {index === 0 && (
                                      <span className={`text-base ${getElapsedTimeClass(order.createdAt)}`}>{getElapsedTime(order.createdAt)}</span>
                                    )}
                                  </div>
                                </div>
                                {options && (
                                  <ul className="text-sm mt-1 ml-4 list-disc">
                                    {Object.entries(options)
                                      .filter(([key, value]) => value && value.toLowerCase() !== 'none')
                                      .map(([key, value], index) => (
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
                          {order.status === 'ready' ? (
                            <button
                              onClick={() => handleSendToTable(order.id)}
                              disabled={sendingOrderId === order.id}
                              className="flex-1 bg-blue-700 text-white font-bold px-2 py-1 rounded hover:bg-blue-600 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors text-xs"
                            >
                              {sendingOrderId === order.id ? 'Sending...' : 'Sent to Table'}
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => handleCompleteOrder(order.id)}
                                disabled={completingOrderId === order.id || cancellingOrderId === order.id}
                                className="flex-1 bg-green-700 text-white font-bold px-2 py-1 rounded hover:bg-green-600 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors text-xs"
                              >
                                {completingOrderId === order.id ? 'Marking...' : 'Mark as Ready'}
                              </button>
                              <button
                                onClick={() => handleCancelOrder(order.id)}
                                disabled={completingOrderId === order.id || cancellingOrderId === order.id}
                                className="bg-red-700 text-white font-bold px-1 py-1 rounded hover:bg-red-600 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors text-xs w-8"
                              >
                                ✕
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                );
              })}
            </div>
          </div>
      )}

      {/* Orders Log */}
      {completedOrders.length > 0 && (
        <div className="p-4">
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
                              {options && Object.entries(options).filter(([key, value]) => value && value.toLowerCase() !== 'none').map(([key, value]) => ` [${key}: ${value}]`).join('')}
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
  );
}
