# Database Connection Module

**Path:** `lib/db/connection.ts`
**Type:** Core Database Utility
**Last Analyzed:** 2025-11-17

---

## What It Does

Provides singleton PostgreSQL connection pool for Neon serverless database. Manages connection lifecycle, query execution, transactions, and type parsing. Auto-loads `.env.local` when environment variables missing (fixes TypeScript script execution).

**Key Feature:** Singleton pattern reuses connections across serverless function invocations.

---

## Database Interactions

### Connection Configuration

**Database:** Neon PostgreSQL (serverless)
**Connection String:** `process.env.DATABASE_URL`
**SSL:** Auto-enabled for `*.neon.tech` domains

**Pool Settings:**
- Max connections: 20
- Idle timeout: 30 seconds
- Connection timeout: 10 seconds
- Allow exit on idle: true (serverless optimization)

### Type Parsing

**Automatic type conversions:**
- `DECIMAL/NUMERIC` (OID 1700) → JavaScript `number` (not string)
- `TEXT[]` (OID 1009) → JavaScript `array`
- PostgreSQL arrays → Parsed from `{elem1,elem2}` format

**Why?** Prevents `.toFixed() is not a function` errors throughout application.

---

## Key Exports

### `getPool()`

Get or create database connection pool (singleton pattern).

**Returns:** `Pool` - PostgreSQL connection pool
**Throws:** Error if `DATABASE_URL` not set

**Usage:**
```typescript
const pool = getPool();
const client = await pool.connect();
// ... use client ...
client.release();
```

---

### `query<T>(text, params?)`

Execute parameterized SQL query with automatic connection management.

**Parameters:**
- `text: string` - SQL query (use $1, $2 for parameters)
- `params?: any[]` - Query parameters (prevents SQL injection)

**Returns:** `Promise<T[]>` - Array of result rows

**Features:**
- Automatically acquires and releases client
- Logs slow queries (>1000ms) in development
- Full error logging with query/params

**Usage:**
```typescript
const samples = await query<Sample>(
  'SELECT * FROM samples WHERE dataset_id = $1',
  [42]
);
```

---

### `queryOne<T>(text, params?)`

Execute query and return single row (or null).

**Returns:** `Promise<T | null>`

**Usage:**
```typescript
const sample = await queryOne<Sample>(
  'SELECT * FROM samples WHERE sample_id = $1',
  ['SAMPLE-001']
);
```

---

### `transaction<T>(callback)`

Execute multiple queries in a transaction with automatic BEGIN/COMMIT/ROLLBACK.

**Parameters:**
- `callback: (client: PoolClient) => Promise<T>` - Function to run in transaction

**Returns:** `Promise<T>` - Result from callback
**Rollback:** Automatically rolls back on error

**Usage:**
```typescript
const result = await transaction(async (client) => {
  await client.query('INSERT INTO samples ...');
  await client.query('INSERT INTO ft_datapoints ...');
  return { success: true };
});
```

---

### `testConnection()`

Test database connection (health check).

**Returns:** `Promise<boolean>` - true if connected

**Usage:**
```typescript
const isConnected = await testConnection();
// Console output:
// ✅ Database connection successful
//    Server time: 2025-11-17 23:30:15
```

---

### `closePool()`

Close all database connections. Should be called on app shutdown. Not typically needed in serverless environments.

**Usage:**
```typescript
await closePool();
```

---

### `getPoolStats()`

Get connection pool statistics for monitoring.

**Returns:**
```typescript
{
  totalCount: number;  // Total clients created
  idleCount: number;   // Idle clients in pool
  waitingCount: number; // Clients waiting for connection
}
```

---

## Environment Variables

**Required:**
- `DATABASE_URL` - PostgreSQL connection string (pooled)

**Auto-Loading:**
If `DATABASE_URL` not set, automatically loads from `.env.local`:
```typescript
if (!process.env.DATABASE_URL && !process.env.DIRECT_URL) {
  const envPath = resolve(process.cwd(), '.env.local');
  config({ path: envPath });
}
```

**Why?** TypeScript scripts run with `npx tsx` bypass Next.js env loading. This fixes that.

---

## Dependencies

**External:**
- `pg` - PostgreSQL client
- `dotenv` - Environment variable loading
- `path` - Path resolution

**Internal:**
- None (this is the base layer)

---

## Used By

**Direct Usage:**
- `lib/db/queries.ts` (ALL query functions)
- `app/api/tables/[name]/route.ts` (direct pool access)
- `scripts/db/*.ts` (all database scripts)

**Indirect Usage:**
- All API routes (via queries.ts)
- All pages with database access (via queries.ts)

---

## Performance Notes

### Slow Query Detection

Queries >1000ms are logged in development:
```
⚠️  Slow query (1523ms): SELECT * FROM vw_aft_complete WHERE...
```

### Connection Pooling

- Reuses connections across requests (serverless optimization)
- Automatically closes idle connections after 30s
- Max 20 concurrent connections to database

### Error Handling

All errors logged with:
- Error message
- Full SQL query
- Query parameters (for debugging)

---

## Common Patterns

### Basic Query
```typescript
import { query } from '@/lib/db/connection';

const samples = await query<Sample>(
  'SELECT * FROM samples WHERE dataset_id = $1',
  [1]
);
```

### Transaction
```typescript
import { transaction } from '@/lib/db/connection';

await transaction(async (client) => {
  const sampleResult = await client.query(
    'INSERT INTO samples (sample_id) VALUES ($1) RETURNING id',
    ['SAMPLE-001']
  );

  await client.query(
    'INSERT INTO ft_datapoints (sample_id, datapoint_key) VALUES ($1, $2)',
    ['SAMPLE-001', 'DP-001']
  );
});
```

### Health Check
```typescript
import { testConnection } from '@/lib/db/connection';

export async function GET() {
  const isHealthy = await testConnection();
  return Response.json({ healthy: isHealthy });
}
```

---

## Schema Version Compatibility

This module works with **both v1 and v2 schemas**:
- Type parsing handles legacy and new field types
- Connection parameters unchanged between versions
- Transaction support for both architectures

---

## Notes

- Connection pool created once, reused across requests
- SSL automatically enabled for Neon connections
- Development logging helps identify slow queries
- Environment auto-loading fixes script execution issues
