/**
 * Database Connection Pool
 *
 * Singleton connection pool for PostgreSQL (Supabase)
 * Optimized for serverless environment
 *
 * @module lib/db/connection
 */

import { Pool, PoolClient, QueryResult, QueryResultRow, types } from 'pg';
import { config } from 'dotenv';
import { resolve } from 'path';
import { logger } from '@/lib/utils/logger';

// Load environment variables from .env.local if not already loaded
// This is needed when running scripts directly (not through Next.js)
if (!process.env.DATABASE_URL && !process.env.DIRECT_URL) {
  const envPath = resolve(process.cwd(), '.env.local');
  config({ path: envPath });
}

// Configure PostgreSQL type parsing
// Parse DECIMAL/NUMERIC (OID 1700) as JavaScript number instead of string
// This prevents ".toFixed() is not a function" errors throughout the app
types.setTypeParser(1700, (val: string) => parseFloat(val));

// Parse TEXT[] (OID 1009) as JavaScript array
types.setTypeParser(1009 as any, (val: string) => {
  if (!val) return null;
  // Parse PostgreSQL array format: {elem1,elem2,"elem with spaces"}
  return val
    .slice(1, -1) // Remove { and }
    .split(',')
    .map((item: string) => {
      // Remove quotes if present
      if (item.startsWith('"') && item.endsWith('"')) {
        return item.slice(1, -1);
      }
      return item;
    });
});

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
        'Please create a .env.local file with DATABASE_URL=<your-supabase-connection-string>'
      );
    }

    pool = new Pool({
      connectionString,

      // SSL configuration (Supabase)
      ssl: connectionString.includes('supabase')
        ? { rejectUnauthorized: false }
        : undefined,

      // Connection pool settings (optimized for serverless + Supabase Transaction mode)
      max: 1,                       // Only 1 connection per function (serverless best practice)
      idleTimeoutMillis: 10000,     // Close idle clients after 10s (fast cleanup)
      connectionTimeoutMillis: 30000, // 30s timeout for serverless cold starts

      // Serverless optimization
      allowExitOnIdle: true,        // Allow pool to close when idle (good for serverless)
    });

    // Error handler
    pool.on('error', (err) => {
      logger.error({ err }, 'Unexpected database pool error');
    });

    // Log pool creation (development only)
    if (process.env.NODE_ENV === 'development') {
      logger.info('Database connection pool created');
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
      logger.warn({ query: text.substring(0, 100), duration }, `Slow query (${duration}ms)`);
    }

    return result.rows;
  } catch (error) {
    logger.error({ err: error, query: text, params }, 'Database query error');
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
 * @future-use Utility function for multi-step database operations
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
    logger.error({ err: error }, 'Transaction error (rolled back)');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Test database connection
 * Useful for health checks and debugging
 *
 * @utility-function Used by scripts/db/test-connection.ts
 * @returns true if connection successful
 */
export async function testConnection(): Promise<boolean> {
  try {
    const result = await query<{ now: Date }>('SELECT NOW() as now');
    logger.info({ serverTime: result[0]?.now }, 'Database connection successful');
    return true;
  } catch (error) {
    logger.error({ err: error }, 'Database connection failed');
    return false;
  }
}

/**
 * Close all database connections
 * Should be called when shutting down the application
 *
 * @utility-function Cleanup for graceful shutdown
 * @note Not typically needed in serverless environments
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('Database connection pool closed');
  }
}

/**
 * Get connection pool statistics
 * Useful for monitoring and debugging
 *
 * @utility-function Monitoring and observability
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
