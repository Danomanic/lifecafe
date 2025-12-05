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

  // Filter orders to only show today's orders
  const todaysOrders = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return allOrders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= today && orderDate < tomorrow;
    });
  }, [allOrders]);

  // Calculate statistics for today's orders only
  const statistics = useMemo(() => {
    const pendingCount = todaysOrders.filter(o => o.status === 'pending').length;
    const completedCount = todaysOrders.filter(o => o.status === 'completed').length;
    const cancelledCount = todaysOrders.filter(o => o.status === 'cancelled').length;

    // Calculate total value and total items count
    let totalValue = 0;
    let totalItemsCount = 0;
    const itemsMap = new Map();

    todaysOrders.forEach(order => {
      order.items.forEach(item => {
        const quantity = item.quantity || 1;
        totalItemsCount += quantity;
        totalValue += (item.price || 0) * quantity;

        // Count items by name
        const itemName = item.name || 'Unknown';
        const currentCount = itemsMap.get(itemName) || 0;
        itemsMap.set(itemName, currentCount + quantity);
      });
    });

    // Create item chart data - sort by count and take top 10
    const itemsArray = Array.from(itemsMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Generate colors for items (using a variety of colors)
    const itemColors = [
      '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
      '#06b6d4', '#6366f1', '#f97316', '#14b8a6', '#a855f7',
      '#ef4444', '#22c55e', '#eab308', '#6b7280', '#84cc16'
    ];

    const topItems = itemsArray.slice(0, 10);
    const othersCount = itemsArray.slice(10).reduce((sum, item) => sum + item.count, 0);

    const itemChartData = topItems.map((item, index) => ({
      label: item.name,
      value: item.count,
      color: itemColors[index % itemColors.length]
    }));

    if (othersCount > 0) {
      itemChartData.push({
        label: 'Others',
        value: othersCount,
        color: '#6b7280'
      });
    }

    return {
      totalOrders: todaysOrders.length,
      totalItemsCount,
      pendingCount,
      completedCount,
      cancelledCount,
      totalValue,
      chartData: [
        { label: 'Pending', value: pendingCount, color: '#fb923c' },
        { label: 'Completed', value: completedCount, color: '#22c55e' },
        { label: 'Cancelled', value: cancelledCount, color: '#ef4444' }
      ],
      itemChartData
    };
  }, [todaysOrders]);

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
          <h2 className="text-lg font-bold text-gray-300 font-mono mb-3">TODAY'S STATISTICS</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Total Orders Card */}
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
              <div className="text-gray-400 text-xs font-mono mb-1">TOTAL ORDERS (TODAY)</div>
              <div className="text-3xl font-bold text-green-400 font-mono">
                {statistics.totalOrders}
              </div>
              <div className="text-gray-400 text-sm font-mono mt-1">
                {statistics.totalItemsCount} items sold
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
              <div className="text-gray-400 text-xs font-mono mb-1">TOTAL VALUE (TODAY)</div>
              <div className="text-3xl font-bold text-green-400 font-mono">
                £{statistics.totalValue.toFixed(2)}
              </div>
              <div className="text-gray-500 text-xs font-mono mt-2">
                Today's orders combined
              </div>
            </div>

            {/* Average Order Value Card */}
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
              <div className="text-gray-400 text-xs font-mono mb-1">AVG ORDER VALUE (TODAY)</div>
              <div className="text-3xl font-bold text-green-400 font-mono">
                £{statistics.totalOrders > 0 ? (statistics.totalValue / statistics.totalOrders).toFixed(2) : '0.00'}
              </div>
              <div className="text-gray-500 text-xs font-mono mt-2">
                Per order today
              </div>
            </div>
          </div>

          {/* Pie Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
              <h3 className="text-md font-bold text-gray-300 font-mono mb-4">TODAY'S ORDER STATUS BREAKDOWN</h3>
              <PieChart data={statistics.chartData} />
            </div>

            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
              <h3 className="text-md font-bold text-gray-300 font-mono mb-4">TOP ITEMS SOLD TODAY</h3>
              <PieChart data={statistics.itemChartData} />
            </div>
          </div>
        </div>

        {/* Orders Log */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-bold text-gray-300 font-mono">
              TODAY'S ORDERS [{todaysOrders.length} total]
            </h2>
            <button
              onClick={() => fetchAllOrders(false)}
              className="bg-gray-800 text-gray-300 px-3 py-1 rounded hover:bg-gray-700 transition-colors text-xs font-mono"
            >
              ↻ Refresh
            </button>
          </div>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs overflow-x-auto border border-gray-700 max-h-[600px] overflow-y-auto">
            {todaysOrders.length === 0 ? (
              <div className="text-gray-500">No orders found for today.</div>
            ) : (
              todaysOrders.map((order) => {
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
