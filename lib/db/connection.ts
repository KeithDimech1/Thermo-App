/**
 * Database Connection Pool
 *
 * Singleton connection pool for PostgreSQL (Neon)
 * Optimized for serverless environment
 *
 * @module lib/db/connection
 */

import { Pool, PoolClient, QueryResult, QueryResultRow, types } from 'pg';

// Configure PostgreSQL type parsing
// Parse DECIMAL/NUMERIC (OID 1700) as JavaScript number instead of string
// This prevents ".toFixed() is not a function" errors throughout the app
types.setTypeParser(1700, (val: string) => parseFloat(val));

// Global pool instance (singleton pattern for serverless)
let pool: Pool | null = null;

/**
 * Get or create database connection pool
 * Uses singleton pattern to reuse connections across requests
 */
export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error(
        'DATABASE_URL environment variable is not set. ' +
        'Please create a .env.local file with DATABASE_URL=<your-neon-connection-string>'
      );
    }

    pool = new Pool({
      connectionString,

      // SSL configuration for Neon
      ssl: connectionString.includes('neon.tech')
        ? { rejectUnauthorized: false }
        : undefined,

      // Connection pool settings
      max: 20,                      // Maximum number of clients in pool
      idleTimeoutMillis: 30000,     // Close idle clients after 30s
      connectionTimeoutMillis: 10000, // Timeout connecting to database (10s for Neon)

      // Serverless optimization
      allowExitOnIdle: true,        // Allow pool to close when idle (good for serverless)
    });

    // Error handler
    pool.on('error', (err) => {
      console.error('Unexpected database pool error:', err);
    });

    // Log pool creation (development only)
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Database connection pool created');
    }
  }

  return pool;
}

/**
 * Execute a database query
 * Automatically manages client acquisition and release
 *
 * @param text - SQL query string (use $1, $2 for parameters)
 * @param params - Query parameters (optional)
 * @returns Query result rows
 *
 * @example
 * ```ts
 * const configs = await query<TestConfigDetails>(
 *   'SELECT * FROM vw_test_config_details WHERE marker_id = $1',
 *   [42]
 * );
 * ```
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<T[]> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    const start = Date.now();
    const result: QueryResult<T> = await client.query(text, params);
    const duration = Date.now() - start;

    // Log slow queries (development only)
    if (process.env.NODE_ENV === 'development' && duration > 1000) {
      console.warn(`⚠️  Slow query (${duration}ms):`, text.substring(0, 100));
    }

    return result.rows;
  } catch (error) {
    console.error('Database query error:', error);
    console.error('Query:', text);
    console.error('Params:', params);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Execute a query and return a single row
 * Throws error if no rows found
 *
 * @param text - SQL query string
 * @param params - Query parameters (optional)
 * @returns Single row or null
 */
export async function queryOne<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows.length > 0 ? (rows[0] ?? null) : null;
}

/**
 * Execute a transaction
 * Automatically handles BEGIN, COMMIT, and ROLLBACK
 *
 * @param callback - Function to execute within transaction
 * @returns Result from callback
 *
 * @example
 * ```ts
 * const result = await transaction(async (client) => {
 *   await client.query('INSERT INTO table1 ...');
 *   await client.query('INSERT INTO table2 ...');
 *   return { success: true };
 * });
 * ```
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Transaction error (rolled back):', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Test database connection
 * Useful for health checks and debugging
 *
 * @returns true if connection successful
 */
export async function testConnection(): Promise<boolean> {
  try {
    const result = await query<{ now: Date }>('SELECT NOW() as now');
    console.log('✅ Database connection successful');
    if (result[0]) {
      console.log('   Server time:', result[0].now);
    }
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

/**
 * Close all database connections
 * Should be called when shutting down the application
 * Not typically needed in serverless environments
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('Database connection pool closed');
  }
}

/**
 * Get connection pool statistics
 * Useful for monitoring and debugging
 */
export function getPoolStats() {
  if (!pool) {
    return null;
  }

  return {
    totalCount: pool.totalCount,     // Total clients created
    idleCount: pool.idleCount,       // Idle clients in pool
    waitingCount: pool.waitingCount, // Clients waiting for connection
  };
}

// Export pool for advanced use cases
export { pool };
