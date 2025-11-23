# Database Connection Scripts

## Problem This Solves

**Issue:** `.env.local` files are NOT automatically loaded into shell environment variables. When you run:
```bash
psql "$DIRECT_URL"
```

The `$DIRECT_URL` variable is **empty** unless you explicitly export it, causing `psql` to connect to:
- A default database (often based on your username)
- A cached connection from `~/.pgpass`
- **THE WRONG DATABASE** ❌

## The Fix

Use these wrapper scripts that **always** read from `.env.local`:

### 1. Direct Connection (for migrations, imports, DDL)
```bash
# Via npm script (recommended)
npm run db:psql

# Or directly
./scripts/db/psql-direct.sh

# With SQL file
./scripts/db/psql-direct.sh -f my-script.sql

# With inline command
./scripts/db/psql-direct.sh -c "SELECT * FROM datasets;"
```

### 2. Pooled Connection (for queries, DML)
```bash
# Via npm script
npm run db:psql-pooled

# Or directly
./scripts/db/psql-pooled.sh
```

### 3. Verify Connection
```bash
npm run db:verify-connection
```

## Usage Examples

```bash
# ✅ CORRECT - Always connects to correct database
./scripts/db/psql-direct.sh -c "SELECT current_database();"

# ❌ WRONG - May connect to wrong database
psql "$DIRECT_URL" -c "SELECT current_database();"

# ✅ CORRECT - Run SQL file
./scripts/db/psql-direct.sh -f scripts/db/migrations/001_add_fair_scores.sql

# ✅ CORRECT - Interactive session
./scripts/db/psql-direct.sh
```

## How It Works

1. Script finds `.env.local` in project root
2. Extracts `DIRECT_URL` or `DATABASE_URL` 
3. Passes the **actual connection string** to `psql`
4. Hides password in console output for security

## When to Use Which

| Task | Use | Reason |
|------|-----|--------|
| Migrations | `psql-direct.sh` | Direct connection required by Prisma |
| Schema changes | `psql-direct.sh` | DDL operations need direct connection |
| Data imports | `psql-direct.sh` | Large transactions work better direct |
| Quick queries | `psql-pooled.sh` | Faster for read operations |
| App connections | TypeScript with `@/lib/db/connection` | Uses connection pool |

## Preventing the Issue

### ❌ DON'T DO THIS:
```bash
# This will fail if DIRECT_URL isn't exported
psql "$DIRECT_URL"

# This requires manual export every session
export DIRECT_URL=$(grep DIRECT_URL .env.local | cut -d= -f2)
psql "$DIRECT_URL"
```

### ✅ DO THIS INSTEAD:
```bash
# Always use the wrapper scripts
./scripts/db/psql-direct.sh

# Or via npm
npm run db:psql
```

## Files in This Directory

- `psql-direct.sh` - Connects using DIRECT_URL (non-pooled)
- `psql-pooled.sh` - Connects using DATABASE_URL (pooled)
- `README.md` - This file

## See Also

- `/readme/database/` - Database schema documentation
- `/.env.local` - Database connection strings (never commit!)
- `/lib/db/connection.ts` - TypeScript database connection helper
