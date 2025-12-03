import { NextResponse } from 'next/server';
import { getDbClient, initDatabase } from '@/lib/db';

// Initialize database on first request
let dbInitialized = false;

async function ensureDbInitialized() {
  if (!dbInitialized) {
    await initDatabase();
    dbInitialized = true;
  }
}

// PATCH /api/orders/[id] - Update order status
export async function PATCH(request, { params }) {
  try {
    await ensureDbInitialized();

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    // Validate status
    const validStatuses = ['pending', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const db = getDbClient();

    // Check if order exists
    const existingOrder = await db.execute({
      sql: 'SELECT id FROM orders WHERE id = ?',
      args: [id],
    });

    if (existingOrder.rows.length === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Update order status
    await db.execute({
      sql: `UPDATE orders
            SET status = ?, updated_at = datetime('now')
            WHERE id = ?`,
      args: [status, id],
    });

    // Fetch updated order with items
    const order = await db.execute({
      sql: `SELECT
              o.id,
              o.table_number,
              o.status,
              o.created_at,
              o.updated_at,
              json_group_array(
                json_object(
                  'id', oi.id,
                  'name', oi.item_name,
                  'slug', oi.item_slug,
                  'options', oi.options_json,
                  'price', oi.price,
                  'quantity', oi.quantity,
                  'notes', oi.notes
                )
              ) as items
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE o.id = ?
            GROUP BY o.id`,
      args: [id],
    });

    const orderData = order.rows[0];
    const result = {
      id: orderData.id,
      tableNumber: orderData.table_number,
      status: orderData.status,
      createdAt: orderData.created_at,
      updatedAt: orderData.updated_at,
      items: JSON.parse(orderData.items),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order', details: error.message },
      { status: 500 }
    );
  }
}

// GET /api/orders/[id] - Get single order
export async function GET(request, { params }) {
  try {
    await ensureDbInitialized();

    const { id } = await params;
    const db = getDbClient();

    const order = await db.execute({
      sql: `SELECT
              o.id,
              o.table_number,
              o.status,
              o.created_at,
              o.updated_at,
              json_group_array(
                json_object(
                  'id', oi.id,
                  'name', oi.item_name,
                  'slug', oi.item_slug,
                  'options', oi.options_json,
                  'price', oi.price,
                  'quantity', oi.quantity,
                  'notes', oi.notes
                )
              ) as items
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE o.id = ?
            GROUP BY o.id`,
      args: [id],
    });

    if (order.rows.length === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const orderData = order.rows[0];
    const result = {
      id: orderData.id,
      tableNumber: orderData.table_number,
      status: orderData.status,
      createdAt: orderData.created_at,
      updatedAt: orderData.updated_at,
      items: JSON.parse(orderData.items),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/orders/[id] - Delete an order
export async function DELETE(request, { params }) {
  try {
    await ensureDbInitialized();

    const { id } = await params;
    const db = getDbClient();

    // Check if order exists
    const existingOrder = await db.execute({
      sql: 'SELECT id FROM orders WHERE id = ?',
      args: [id],
    });

    if (existingOrder.rows.length === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Delete order items first (due to foreign key constraint)
    await db.execute({
      sql: 'DELETE FROM order_items WHERE order_id = ?',
      args: [id],
    });

    // Delete order
    await db.execute({
      sql: 'DELETE FROM orders WHERE id = ?',
      args: [id],
    });

    return NextResponse.json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json(
      { error: 'Failed to delete order', details: error.message },
      { status: 500 }
    );
  }
}
