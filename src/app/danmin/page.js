'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';

// Simple Pie Chart Component
function PieChart({ data }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
        No data to display
      </div>
    );
  }

  let currentAngle = -90; // Start from top
  const slices = data.map((item) => {
    const percentage = (item.value / total) * 100;
    const angle = (item.value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    // Calculate path for pie slice
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const x1 = 50 + 45 * Math.cos(startRad);
    const y1 = 50 + 45 * Math.sin(startRad);
    const x2 = 50 + 45 * Math.cos(endRad);
    const y2 = 50 + 45 * Math.sin(endRad);
    const largeArc = angle > 180 ? 1 : 0;

    return {
      ...item,
      path: `M 50 50 L ${x1} ${y1} A 45 45 0 ${largeArc} 1 ${x2} ${y2} Z`,
      percentage: percentage.toFixed(1)
    };
  });

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 100 100" className="w-48 h-48">
        {slices.map((slice, index) => (
          <g key={index}>
            <path
              d={slice.path}
              fill={slice.color}
              stroke="#1f2937"
              strokeWidth="0.5"
            />
          </g>
        ))}
      </svg>
      <div className="mt-4 space-y-1">
        {slices.map((slice, index) => (
          <div key={index} className="flex items-center gap-2 text-xs font-mono">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: slice.color }}></div>
            <span className="text-gray-300">
              {slice.label}: {slice.value} ({slice.percentage}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

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

  // Calculate statistics
  const statistics = useMemo(() => {
    const pendingCount = allOrders.filter(o => o.status === 'pending').length;
    const completedCount = allOrders.filter(o => o.status === 'completed').length;
    const cancelledCount = allOrders.filter(o => o.status === 'cancelled').length;

    // Calculate total value
    const totalValue = allOrders.reduce((sum, order) => {
      const orderTotal = order.items.reduce((itemSum, item) => {
        return itemSum + (item.price || 0) * (item.quantity || 1);
      }, 0);
      return sum + orderTotal;
    }, 0);

    return {
      totalOrders: allOrders.length,
      pendingCount,
      completedCount,
      cancelledCount,
      totalValue,
      chartData: [
        { label: 'Pending', value: pendingCount, color: '#fb923c' },
        { label: 'Completed', value: completedCount, color: '#22c55e' },
        { label: 'Cancelled', value: cancelledCount, color: '#ef4444' }
      ]
    };
  }, [allOrders]);

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

        {/* Statistics Section */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-300 font-mono mb-3">STATISTICS</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Total Orders Card */}
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
              <div className="text-gray-400 text-xs font-mono mb-1">TOTAL ORDERS</div>
              <div className="text-3xl font-bold text-green-400 font-mono">
                {statistics.totalOrders}
              </div>
              <div className="text-gray-500 text-xs font-mono mt-2">
                <span className="text-orange-400">{statistics.pendingCount} pending</span>
                {' • '}
                <span className="text-green-500">{statistics.completedCount} completed</span>
                {' • '}
                <span className="text-red-500">{statistics.cancelledCount} cancelled</span>
              </div>
            </div>

            {/* Total Value Card */}
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
              <div className="text-gray-400 text-xs font-mono mb-1">TOTAL VALUE</div>
              <div className="text-3xl font-bold text-green-400 font-mono">
                £{statistics.totalValue.toFixed(2)}
              </div>
              <div className="text-gray-500 text-xs font-mono mt-2">
                All orders combined
              </div>
            </div>

            {/* Average Order Value Card */}
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
              <div className="text-gray-400 text-xs font-mono mb-1">AVG ORDER VALUE</div>
              <div className="text-3xl font-bold text-green-400 font-mono">
                £{statistics.totalOrders > 0 ? (statistics.totalValue / statistics.totalOrders).toFixed(2) : '0.00'}
              </div>
              <div className="text-gray-500 text-xs font-mono mt-2">
                Per order
              </div>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <h3 className="text-md font-bold text-gray-300 font-mono mb-4">ORDER STATUS BREAKDOWN</h3>
            <PieChart data={statistics.chartData} />
          </div>
        </div>

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
