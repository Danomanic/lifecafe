import { NextResponse } from 'next/server';
import { getCollections, initDatabase, objectIdToString, stringToObjectId } from '@/lib/db';

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
    const validStatuses = ['pending', 'ready', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const { orders, orderItems } = await getCollections();
    const objectId = stringToObjectId(id);

    if (!objectId) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    // Check if order exists
    const existingOrder = await orders.findOne({ _id: objectId });

    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Update order status
    await orders.updateOne(
      { _id: objectId },
      { $set: { status: status, updatedAt: new Date() } }
    );

    // Fetch updated order with items
    const updatedOrder = await orders.findOne({ _id: objectId });
    const items = await orderItems.find({ orderId: objectId }).toArray();

    const result = {
      id: objectIdToString(updatedOrder._id),
      tableNumber: updatedOrder.tableNumber,
      status: updatedOrder.status,
      createdAt: updatedOrder.createdAt,
      updatedAt: updatedOrder.updatedAt,
      items: items.map(item => ({
        id: objectIdToString(item._id),
        name: item.itemName,
        slug: item.itemSlug,
        options: item.options,
        price: item.price,
        quantity: item.quantity,
        notes: item.notes,
      })),
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
    const { orders, orderItems } = await getCollections();
    const objectId = stringToObjectId(id);

    if (!objectId) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    const order = await orders.findOne({ _id: objectId });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const items = await orderItems.find({ orderId: objectId }).toArray();

    const result = {
      id: objectIdToString(order._id),
      tableNumber: order.tableNumber,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: items.map(item => ({
        id: objectIdToString(item._id),
        name: item.itemName,
        slug: item.itemSlug,
        options: item.options,
        price: item.price,
        quantity: item.quantity,
        notes: item.notes,
      })),
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
    const { orders, orderItems } = await getCollections();
    const objectId = stringToObjectId(id);

    if (!objectId) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    // Check if order exists
    const existingOrder = await orders.findOne({ _id: objectId });

    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Delete order items first
    await orderItems.deleteMany({ orderId: objectId });

    // Delete order
    await orders.deleteOne({ _id: objectId });

    return NextResponse.json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json(
      { error: 'Failed to delete order', details: error.message },
      { status: 500 }
    );
  }
}
