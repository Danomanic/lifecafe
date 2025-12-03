'use client';

import Navbar from "@/app/navbar";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tableNumber, setTableNumber] = useState(null);
  const [deletingOrderId, setDeletingOrderId] = useState(null);

  // Load table number from localStorage
  useEffect(() => {
    const storedTableNumber = localStorage.getItem('tableNumber');
    setTableNumber(storedTableNumber);

    if (!storedTableNumber) {
      setError('Please select a table number first');
      setLoading(false);
      return;
    }

    fetchOrders(storedTableNumber);

    // Listen for table number changes
    const handleTableChange = () => {
      const newTableNumber = localStorage.getItem('tableNumber');
      console.log('Table number changed, refetching orders for table:', newTableNumber);
      setTableNumber(newTableNumber);
      if (newTableNumber) {
        fetchOrders(newTableNumber);
      }
    };

    window.addEventListener('tableNumberChanged', handleTableChange);

    return () => {
      window.removeEventListener('tableNumberChanged', handleTableChange);
    };
  }, []);

  // Fetch orders for the current table
  const fetchOrders = async (tableNum) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders?tableNumber=${tableNum}`);

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      // Sort by created date, newest first
      const sortedOrders = data.sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      setOrders(sortedOrders);
      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete an order
  const handleDeleteOrder = async (orderId) => {
    if (!confirm('Are you sure you want to delete this order?')) {
      return;
    }

    try {
      setDeletingOrderId(orderId);

      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete order');
      }

      // Remove deleted order from the list
      setOrders(orders.filter(order => order.id !== orderId));
    } catch (err) {
      console.error('Error deleting order:', err);
      alert('Failed to delete order: ' + err.message);
    } finally {
      setDeletingOrderId(null);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-200 text-yellow-900',
      completed: 'bg-green-200 text-green-900',
      cancelled: 'bg-red-200 text-red-900',
    };

    return (
      <span className={`inline-block px-1.5 py-0.5 rounded-full text-xs font-bold ${styles[status] || 'bg-gray-200 text-gray-900'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Get dynamic options from item (exclude standard fields)
  const getItemOptions = (item) => {
    const excludeKeys = ['id', 'name', 'itemSlug', 'quantity', 'notes', 'orderId', 'createdAt'];
    const options = [];

    for (const [key, value] of Object.entries(item)) {
      if (!excludeKeys.includes(key) && value !== null && value !== undefined && value !== '') {
        // Format the key nicely (camelCase to Title Case)
        const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        options.push({ key: formattedKey, value });
      }
    }

    return options;
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="mx-4 mt-4">
          <h1 className="text-2xl font-bold mb-4">Orders</h1>
          <div className="text-center py-8">
            <p className="text-gray-600 text-base">Loading orders...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!tableNumber) {
    return (
      <div>
        <Navbar />
        <div className="mx-4 mt-4">
          <h1 className="text-2xl font-bold mb-4">Orders</h1>
          <div className="bg-yellow-100 border border-yellow-500 text-yellow-900 px-4 py-2 rounded-lg mb-4 text-base font-semibold">
            Please select a table number first
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />

      <div className="mx-4 mt-3">
        <h1 className="text-xl font-bold mb-3">Orders for Table {tableNumber}</h1>

        {error && (
          <div className="bg-red-100 border border-red-500 text-red-900 px-4 py-2 rounded-lg mb-4 text-base font-semibold">
            {error}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl mb-2">📋</div>
            <h2 className="text-lg font-semibold mb-1">No Orders Yet</h2>
            <p className="text-gray-600 mb-3 text-sm">You haven&apos;t placed any orders for this table.</p>
            <button
              onClick={() => router.push('/')}
              className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-bold"
            >
              Place an Order
            </button>
          </div>
        ) : (
          <div className="space-y-2 mb-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
                <div className="p-2.5">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-xs text-gray-600 font-semibold">
                        Order #{order.id}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      {getStatusBadge(order.status)}
                    </div>
                  </div>

                  <div className="space-y-1.5 mb-2">
                    {order.items.map((item) => {
                      const options = getItemOptions(item);
                      return (
                        <div key={item.id} className="flex justify-between items-start bg-gray-50 p-2 rounded">
                          <div className="flex-1">
                            <p className="font-bold text-sm text-gray-900">{item.name}</p>
                            {options.length > 0 && (
                              <div className="text-xs text-gray-700 mt-0.5 flex flex-wrap gap-1">
                                {options.map((option, idx) => (
                                  <span key={idx} className="inline-block bg-gray-200 rounded px-1.5 py-0.5 font-semibold">
                                    {option.value}
                                  </span>
                                ))}
                              </div>
                            )}
                            {item.notes && (
                              <p className="text-xs text-gray-600 mt-0.5 font-medium">Note: {item.notes}</p>
                            )}
                          </div>
                          {item.quantity > 1 && (
                            <div className="text-sm font-bold text-gray-900 ml-2">
                              x{item.quantity}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {order.status === 'pending' && (
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleDeleteOrder(order.id)}
                        disabled={deletingOrderId === order.id}
                        className="bg-red-600 text-white font-bold px-2 py-1 rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-xs"
                      >
                        {deletingOrderId === order.id ? 'Deleting...' : 'Cancel'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
