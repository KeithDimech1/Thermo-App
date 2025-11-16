# lib/db/connection.ts

**Path:** `lib/db/connection.ts`
**Type:** Database Utility
**Last Analyzed:** 2025-11-11
**File Size:** 208 lines

---

## What It Does

Provides a **PostgreSQL connection pool** with singleton pattern optimized for serverless environments (Next.js + Neon). This is the foundation for all database access in the application.

**Key Features:**
- Singleton pool instance (reuses connections across requests)
- SSL support for Neon database
- Automatic error handling and logging
- Connection pooling with configurable limits
- Transaction support with automatic rollback
- Helper functions for common query patterns
- Performance monitoring (slow query detection)

---

## Database Interactions

### No Direct Table Access
This module doesn't query specific tables - it provides the connection infrastructure that all other database code uses.

**Connection Details:**
- Database: Neon PostgreSQL (from `DATABASE_URL` env var)
- SSL: Enabled for `neon.tech` hosts
- Pool Size: Max 20 connections
- Idle Timeout: 30 seconds
- Connection Timeout: 2 seconds
- Serverless Optimized: `allowExitOnIdle: true`

---

## Key Exports

### Functions

**`getPool(): Pool`**
- Get or create the singleton connection pool
- Throws error if DATABASE_URL not set
- Configures SSL for Neon automatically
- Returns: node-postgres Pool instance

**`query<T>(text: string, params?: any[]): Promise<T[]>`**
- Execute a query with automatic client management
- Parameterized queries prevent SQL injection
- Logs slow queries (>1s) in development
- Returns: Array of rows typed as `T`

**`queryOne<T>(text: string, params?: any[]): Promise<T | null>`**
- Execute a query and return single row
- Returns null if no rows found
- Useful for primary key lookups

**`transaction<T>(callback: (client) => Promise<T>): Promise<T>`**
- Execute multiple queries in a transaction
- Automatic BEGIN/COMMIT/ROLLBACK
- Rolls back on error
- Returns result from callback

**`testConnection(): Promise<boolean>`**
- Health check query (SELECT NOW())
- Logs success/failure
- Returns true if connection succeeds

**`closePool(): Promise<void>`**
- Close all connections in pool
- Not typically needed in serverless
- Useful for graceful shutdown

**`getPoolStats(): object | null`**
- Get connection pool statistics
- Returns: { totalCount, idleCount, waitingCount }
- Useful for debugging/monitoring

---

## Dependencies

**External packages:**
- `pg` (v8.x) - PostgreSQL client library
  - `Pool` - Connection pool
  - `PoolClient` - Single connection
  - `QueryResult` - Query result type

**Environment variables:**
- `DATABASE_URL` (required) - PostgreSQL connection string
- `NODE_ENV` - Enables dev logging if 'development'

---

## Used By

This module is used by virtually every database-related file:

### Direct Consumers (import from this file)
- **`lib/db/queries.ts`** - All query functions use `query()` and `queryOne()`
- **`app/api/search/route.ts`** - Direct database access for search
- **`app/api/analytics/dashboard-stats/route.ts`** - Direct raw SQL queries
- **`scripts/db/import-data.ts`** - Transaction support for imports
- **`scripts/db/test-connection.ts`** - Connection health check
- **`scripts/db/verify-import.ts`** - Data validation queries

### Indirect Consumers (via lib/db/queries.ts)
- All API routes that call query functions
- All server components that fetch data

---

## Design Patterns

### Singleton Pattern
```typescript
let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    // Create pool once
    pool = new Pool({...});
  }
  return pool;
}
```

**Why:** Reuse connections across Next.js API route invocations. Creating a new pool for each request would be inefficient.

### Client Auto-Release
```typescript
const client = await pool.connect();
try {
  // Do work
} finally {
  client.release(); // Always release back to pool
}
```

**Why:** Prevents connection leaks that would exhaust the pool.

### Parameterized Queries
```typescript
await query('SELECT * FROM markers WHERE id = $1', [markerId]);
```

**Why:** Prevents SQL injection attacks. Never concatenate user input into SQL strings.

---

## Configuration Breakdown

### Pool Settings
```typescript
{
  max: 20,                      // Max 20 concurrent connections
  idleTimeoutMillis: 30000,     // Close idle after 30s (serverless friendly)
  connectionTimeoutMillis: 2000, // Fail fast if can't connect
  allowExitOnIdle: true,        // Pool can close when idle (serverless optimization)
}
```

**Why These Values:**
- `max: 20` - Neon free tier supports 20 connections; balances concurrency vs limits
- `idleTimeoutMillis: 30s` - Serverless functions often idle; close unused connections
- `connectionTimeoutMillis: 2s` - Fail fast so users don't wait long for errors
- `allowExitOnIdle` - Let Node.js exit when pool idle (serverless functions should terminate)

### SSL Configuration
```typescript
ssl: connectionString.includes('neon.tech')
  ? { rejectUnauthorized: false }
  : undefined
```

**Why:** Neon requires SSL. `rejectUnauthorized: false` accepts self-signed certs (common for managed databases).

---

## Error Handling

### Connection Errors
```typescript
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});
```

**When This Fires:**
- Network disconnection
- Database server restart
- Idle client errors

**Action:** Logged to console, connection automatically retried on next request.

### Query Errors
```typescript
try {
  const result = await client.query(text, params);
} catch (error) {
  console.error('Database query error:', error);
  console.error('Query:', text);
  console.error('Params:', params);
  throw error; // Re-throw for caller to handle
}
```

**What's Logged:**
- Error message/stack
- SQL query that failed
- Parameters used

**Best Practice:** Callers should catch and handle these errors appropriately (400/500 responses).

---

## Performance Monitoring

### Slow Query Detection
```typescript
const start = Date.now();
const result = await client.query(text, params);
const duration = Date.now() - start;

if (process.env.NODE_ENV === 'development' && duration > 1000) {
  console.warn(`⚠️  Slow query (${duration}ms):`, text.substring(0, 100));
}
```

**Threshold:** Queries taking >1 second are logged in development.

**Action When Detected:**
1. Check if query needs indexes
2. Consider using database views (like `vw_test_config_details`)
3. Optimize JOIN conditions
4. Add WHERE clause filters

---

## Usage Examples

### Basic Query
```typescript
import { query } from '@/lib/db/connection';

const markers = await query<Marker>(
  'SELECT * FROM markers WHERE category_id = $1',
  [categoryId]
);
```

### Single Row Query
```typescript
import { queryOne } from '@/lib/db/connection';

const marker = await queryOne<Marker>(
  'SELECT * FROM markers WHERE id = $1',
  [markerId]
);

if (!marker) {
  return { error: 'Marker not found' };
}
```

### Transaction
```typescript
import { transaction } from '@/lib/db/connection';

const result = await transaction(async (client) => {
  await client.query('INSERT INTO table1 VALUES ($1)', [value1]);
  await client.query('INSERT INTO table2 VALUES ($1)', [value2]);
  return { success: true };
});
```

---

## Security Considerations

### ✅ SQL Injection Prevention
- Always use parameterized queries (`$1`, `$2`)
- Never concatenate user input into SQL strings
- node-postgres automatically escapes parameters

### ✅ Environment Variable Security
- `DATABASE_URL` stored in `.env.local` (gitignored)
- Never commit connection strings to git
- Use different credentials for dev/staging/prod

### ✅ Connection Security
- SSL enforced for Neon connections
- Connection timeout prevents hanging requests
- Pool limits prevent DOS via connection exhaustion

---

## Troubleshooting

### "DATABASE_URL environment variable is not set"
**Fix:** Create `.env.local` file with:
```
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
```

### "Connection timeout"
**Causes:**
- Database server down
- Firewall blocking connection
- Invalid connection string

**Fix:** Run `scripts/db/test-connection.ts` to diagnose.

### "Too many connections"
**Cause:** Pool exhausted (20 concurrent requests).

**Fix:**
- Check for connection leaks (missing `client.release()`)
- Increase `max` pool size (if database supports it)
- Optimize slow queries to free up connections faster

---

## Related Files

- **[lib/db/queries.ts](queries.md)** - All prepared SQL queries use this module
- **Database Tables** - See [readme/database/](../../database/) for schema docs
- **API Routes** - See [app/api/](../../app/api/) for usage examples

---

**Generated:** 2025-11-11
**Last Verified:** 2025-11-11
