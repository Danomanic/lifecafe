import { MongoClient, ObjectId } from 'mongodb';

// MongoDB connection singleton
let client = null;
let db = null;

// Get MongoDB connection string
function getConnectionString() {
  return process.env.MONGODB_URI || 'mongodb://localhost:27017/lifecafe';
}

// Connect to MongoDB
async function connectToDatabase() {
  if (db) {
    return db;
  }

  try {
    const uri = getConnectionString();
    client = new MongoClient(uri);
    await client.connect();

    // Extract database name from connection string or use default
    const dbName = uri.split('/').pop().split('?')[0] || 'lifecafe';
    db = client.db(dbName);

    console.log('MongoDB connection initialized');
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

// Get database instance
export async function getDb() {
  if (!db) {
    await connectToDatabase();
  }
  return db;
}

// Get collections
export async function getCollections() {
  const database = await getDb();
  return {
    orders: database.collection('orders'),
    orderItems: database.collection('order_items'),
  };
}

// Initialize database (create indexes)
export async function initDatabase() {
  try {
    const { orders, orderItems } = await getCollections();

    // Create indexes for orders collection
    await orders.createIndex({ tableNumber: 1 });
    await orders.createIndex({ status: 1 });
    await orders.createIndex({ createdAt: -1 });

    // Create indexes for order_items collection
    await orderItems.createIndex({ orderId: 1 });

    console.log('Database initialized successfully (MongoDB)');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

// Helper to convert MongoDB ObjectId to string
export function objectIdToString(id) {
  return id ? id.toString() : null;
}

// Helper to create ObjectId from string
export function stringToObjectId(id) {
  return id ? new ObjectId(id) : null;
}
