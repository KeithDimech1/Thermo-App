# Database Connection Fix - Summary

## ✅ FIXED: Environment Variable Issue

### The Problem
When running `psql "$DIRECT_URL"`, the `$DIRECT_URL` variable was **empty** because:
- `.env.local` files are only loaded by Node.js (via dotenv)
- Shell commands don't automatically see these variables
- This caused psql to connect to a **default/wrong database** (`keithdimech`)

### The Solution
Created safe wrapper scripts that **always read from `.env.local`**:

## 🛡️ New Safe Commands

### For Shell/psql Commands:
```bash
# ✅ Direct connection (migrations, imports, schema changes)
npm run db:psql
./scripts/db/psql-direct.sh

# ✅ Pooled connection (queries, reads)
npm run db:psql-pooled  
./scripts/db/psql-pooled.sh

# ✅ Verify connection
npm run db:verify-connection
```

### For TypeScript/Node.js:
```typescript
// ✅ This still works (dotenv auto-loads .env.local)
import { query, queryOne } from '@/lib/db/connection';
```

## 📁 Files Created

1. **`scripts/db/psql-direct.sh`** - Safe psql wrapper (DIRECT_URL)
2. **`scripts/db/psql-pooled.sh`** - Safe psql wrapper (DATABASE_URL)
3. **`scripts/db/README.md`** - Full documentation
4. **`scripts/db/FIX-SUMMARY.md`** - This file
5. **Updated `.claude/CLAUDE.md`** - Added critical warning
6. **Updated `package.json`** - Added npm scripts

## ⚠️ What NOT To Do

```bash
# ❌ NEVER DO THIS - $DIRECT_URL is empty!
psql "$DIRECT_URL"

# ❌ NEVER DO THIS - Shell vars aren't auto-loaded
psql $DATABASE_URL
```

## ✅ What TO Do

```bash
# ✅ Use wrapper scripts
./scripts/db/psql-direct.sh

# ✅ Or npm shortcuts
npm run db:psql

# ✅ For SQL files
./scripts/db/psql-direct.sh -f my-migration.sql

# ✅ For inline commands
./scripts/db/psql-direct.sh -c "SELECT * FROM datasets;"
```

## 🔍 Verification

Run this to confirm you're connecting to the correct database:
```bash
npm run db:verify-connection
```

Should output your Supabase database name and user:
```
current_database | current_user
------------------+--------------
postgres         | postgres.<project>
```

## 📚 More Info

See `scripts/db/README.md` for:
- Detailed usage examples
- When to use direct vs pooled
- Troubleshooting guide
- Security considerations

---

**Last Updated:** 2025-11-18  
**Issue:** Fixed in response to wrong database connection (`keithdimech` instead of `neondb`)  
**Solution:** Safe wrapper scripts that always load from `.env.local`
