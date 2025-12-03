import { createClient } from '@libsql/client';

// Create a singleton database client
let client = null;

export function getDbClient() {
  if (!client) {
    // For local development, use a local SQLite file
    // For production, use Turso cloud database
    const url = process.env.TURSO_DATABASE_URL || 'file:local.db';
    const authToken = process.env.TURSO_AUTH_TOKEN;

    client = createClient({
      url,
      authToken,
    });
  }

  return client;
}

// Initialize database tables
export async function initDatabase() {
  const db = getDbClient();

  // Create orders table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_number INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Create order_items table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      item_name TEXT NOT NULL,
      item_slug TEXT NOT NULL,
      options_json TEXT,
      quantity INTEGER DEFAULT 1,
      price REAL,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
    )
  `);

  // Create index for faster queries
  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_orders_table_number ON orders(table_number)
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id)
  `);

  console.log('Database initialized successfully');
}
