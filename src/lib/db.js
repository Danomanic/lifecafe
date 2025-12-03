import pkg from 'pg';
const { Pool } = pkg;

// Create singleton PostgreSQL pool
let pgPool = null;

// PostgreSQL Database Client
class PostgresClient {
  constructor(pool) {
    this.pool = pool;
  }

  async execute(query) {
    const { sql, args } = typeof query === 'string' ? { sql: query, args: [] } : query;

    // Convert ? placeholders to $1, $2, etc. for PostgreSQL
    let pgSql = sql;
    let paramIndex = 1;
    pgSql = pgSql.replace(/\?/g, () => `$${paramIndex++}`);

    try {
      const result = await this.pool.query(pgSql, args || []);

      return {
        rows: result.rows,
        rowsAffected: result.rowCount,
        lastInsertRowid: result.rows[0]?.id || null,
      };
    } catch (error) {
      console.error('PostgreSQL query error:', error);
      throw error;
    }
  }
}

// Get database client
export function getDbClient() {
  if (!pgPool) {
    const connectionString = process.env.DATABASE_URL || 'postgresql://lifecafe:lifecafe@localhost:5432/lifecafe';

    pgPool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });

    console.log('PostgreSQL connection initialized');
  }
  return new PostgresClient(pgPool);
}

// Initialize database tables
export async function initDatabase() {
  const db = getDbClient();

  // Create orders table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      table_number INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create order_items table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL,
      item_name TEXT NOT NULL,
      item_slug TEXT NOT NULL,
      options_json TEXT,
      quantity INTEGER DEFAULT 1,
      price NUMERIC(10, 2),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
    )
  `);

  // Create indexes
  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_orders_table_number ON orders(table_number)
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id)
  `);

  console.log('Database initialized successfully (PostgreSQL)');
}

// Helper function to get SQL for aggregating order items
export function getOrderItemsAggregationSQL() {
  return `json_agg(
    json_build_object(
      'id', oi.id,
      'name', oi.item_name,
      'slug', oi.item_slug,
      'options', oi.options_json,
      'price', oi.price,
      'quantity', oi.quantity,
      'notes', oi.notes
    )
  )`;
}

// Helper function to get current timestamp SQL
export function getCurrentTimestampSQL() {
  return 'CURRENT_TIMESTAMP';
}
