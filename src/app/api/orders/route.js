import { NextResponse } from 'next/server';
import { getDbClient, initDatabase, getOrderItemsAggregationSQL } from '@/lib/db';

// Initialize database on first request
let dbInitialized = false;

async function ensureDbInitialized() {
  if (!dbInitialized) {
    await initDatabase();
    dbInitialized = true;
  }
}

// POST /api/orders - Create a new order
export async function POST(request) {
  try {
    await ensureDbInitialized();

    const body = await request.json();
    const { tableNumber, items } = body;

    // Validate request
    if (!tableNumber || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Table number and items are required' },
        { status: 400 }
      );
    }

    const db = getDbClient();

    // Create order
    const orderResult = await db.execute({
      sql: 'INSERT INTO orders (table_number, status) VALUES (?, ?) RETURNING id',
      args: [tableNumber, 'pending'],
    });
    const orderId = orderResult.rows[0].id;

    // Insert order items
    for (const item of items) {
      await db.execute({
        sql: `INSERT INTO order_items
              (order_id, item_name, item_slug, options_json, price, quantity, notes)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          orderId,
          item.name,
          item.slug,
          item.options ? JSON.stringify(item.options) : null,
          item.price || null,
          item.quantity || 1,
          item.notes || null,
        ],
      });
    }

    // Fetch the complete order with items
    const itemsAggregation = getOrderItemsAggregationSQL();
    const order = await db.execute({
      sql: `SELECT
              o.id,
              o.table_number,
              o.status,
              o.created_at,
              ${itemsAggregation} as items
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE o.id = ?
            GROUP BY o.id, o.table_number, o.status, o.created_at`,
      args: [orderId],
    });

    const orderData = order.rows[0];
    const result = {
      id: orderData.id,
      tableNumber: orderData.table_number,
      status: orderData.status,
      createdAt: orderData.created_at,
      items: JSON.parse(orderData.items),
    };

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order', details: error.message },
      { status: 500 }
    );
  }
}

// GET /api/orders - List all orders
export async function GET(request) {
  try {
    await ensureDbInitialized();

    const { searchParams } = new URL(request.url);
    const tableNumber = searchParams.get('tableNumber');
    const status = searchParams.get('status');

    const db = getDbClient();
    const itemsAggregation = getOrderItemsAggregationSQL();

    let sql = `SELECT
                o.id,
                o.table_number,
                o.status,
                o.created_at,
                o.updated_at,
                ${itemsAggregation} as items
              FROM orders o
              LEFT JOIN order_items oi ON o.id = oi.order_id`;

    const conditions = [];
    const args = [];

    if (tableNumber) {
      conditions.push('o.table_number = ?');
      args.push(tableNumber);
    }

    if (status) {
      conditions.push('o.status = ?');
      args.push(status);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' GROUP BY o.id, o.table_number, o.status, o.created_at, o.updated_at ORDER BY o.created_at DESC';

    const result = await db.execute({ sql, args });

    const orders = result.rows.map((row) => ({
      id: row.id,
      tableNumber: row.table_number,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      items: JSON.parse(row.items),
    }));

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders', details: error.message },
      { status: 500 }
    );
  }
}
