import { NextResponse } from 'next/server';
import { getCollections, initDatabase, objectIdToString } from '@/lib/db';

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

    const { orders, orderItems } = await getCollections();

    // Create order document
    const orderDoc = {
      tableNumber: parseInt(tableNumber),
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const orderResult = await orders.insertOne(orderDoc);
    const orderId = orderResult.insertedId;

    // Insert order items
    const itemDocs = items.map(item => ({
      orderId: orderId,
      itemName: item.name,
      itemSlug: item.slug,
      options: item.options || null,
      price: item.price || null,
      quantity: item.quantity || 1,
      notes: item.notes || null,
      createdAt: new Date(),
    }));

    await orderItems.insertMany(itemDocs);

    // Fetch the complete order with items
    const orderWithItems = await orders.findOne({ _id: orderId });
    const items_list = await orderItems.find({ orderId: orderId }).toArray();

    const result = {
      id: objectIdToString(orderWithItems._id),
      tableNumber: orderWithItems.tableNumber,
      status: orderWithItems.status,
      createdAt: orderWithItems.createdAt,
      items: items_list.map(item => ({
        id: objectIdToString(item._id),
        name: item.itemName,
        slug: item.itemSlug,
        options: item.options,
        price: item.price,
        quantity: item.quantity,
        notes: item.notes,
      })),
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

    const { orders, orderItems } = await getCollections();

    // Build query filter
    const filter = {};
    if (tableNumber) {
      filter.tableNumber = parseInt(tableNumber);
    }
    if (status) {
      filter.status = status;
    }

    // Fetch orders
    const ordersList = await orders
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    // Fetch items for all orders
    const ordersWithItems = await Promise.all(
      ordersList.map(async (order) => {
        const items = await orderItems
          .find({ orderId: order._id })
          .toArray();

        return {
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
      })
    );

    return NextResponse.json(ordersWithItems);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders', details: error.message },
      { status: 500 }
    );
  }
}
