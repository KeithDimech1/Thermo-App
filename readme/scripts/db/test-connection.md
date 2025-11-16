# test-connection.ts

**Path:** `scripts/db/test-connection.ts`
**Type:** Database Diagnostic Script
**Last Analyzed:** 2025-11-11
**File Size:** 155 lines

## What It Does

Diagnostic script that tests database connectivity and displays configuration details. First script to run when setting up database. Provides helpful troubleshooting information if connection fails.

## Database Interactions

### Tables Read
None directly - only diagnostic queries:

### Operations Performed
- **SELECT NOW(), version()** - Server time and PostgreSQL version
- **SELECT COUNT(*) FROM information_schema.tables** - Check if schema exists
- **SELECT COUNT(*) FROM test_configurations** (if tables exist) - Check if data exists

## Key Features

### Connection Testing
```
🔌 Attempting connection...
✅ Connection successful!

PostgreSQL Details:
  Server Time: 2025-11-11 16:30:45
  Version:     PostgreSQL 14.5
```

### Configuration Display
Shows connection details with password masked:
```
Connection Details:
  Host:     localhost
  Port:     5432
  Database: qc_results
  User:     username
  SSL:      auto-detected

  Full URL: postgresql://username:****@localhost:5432/qc_results
```

### Schema Detection
```
Schema Status:
  Tables:      8
  Status:      ✅ Schema created
  Data:        ✅ 132 test configurations
```

Or if schema doesn't exist:
```
Schema Status:
  Tables:      0
  Status:      ⚠️  No tables found. Run schema creation:
                   npm run db:schema
```

### SSL Auto-Detection
Automatically detects cloud databases:
- Neon → SSL required
- Supabase → SSL required
- Local → No SSL

## Key Exports

### Main Function
- `testConnection()` - Tests database connection and displays diagnostics

## Dependencies

**External packages:**
- `pg` - PostgreSQL client

**Environment:**
- `.env.local` with `DATABASE_URL` or `POSTGRES_URL`

## Used By

**NPM Scripts:**
- `npm run db:test` - Run connection test
- `npm run db:setup` - Runs this before schema creation

## How It's Used

### Initial Setup
First command to run when setting up database:
```bash
# Create .env.local first
cp .env.local.example .env.local
# Edit .env.local with your DATABASE_URL

# Test connection
npm run db:test
```

### Expected Output (Success)
```
📊 Database Connection Test
========================================

Connection Details:
  Host:     localhost
  Port:     5432
  Database: qc_results
  User:     myuser
  SSL:      auto-detected

  Full URL: postgresql://myuser:****@localhost:5432/qc_results

🔌 Attempting connection...

✅ Connection successful!

PostgreSQL Details:
  Server Time: 2025-11-11 16:30:45.123
  Version:     PostgreSQL 14.5 on x86_64-apple-darwin

Schema Status:
  Tables:      8
  Status:      ✅ Schema created
  Data:        ✅ 132 test configurations

========================================
✅ Database is ready to use!
========================================
```

### Expected Output (No Schema)
```
...
Schema Status:
  Tables:      0

⚠️  No tables found. Run schema creation:
    npm run db:schema
```

### Expected Output (Schema But No Data)
```
...
Schema Status:
  Tables:      8
  Status:      ✅ Schema created

⚠️  Schema exists but no data. Run import:
    npm run db:import
```

## Error Handling

### No DATABASE_URL
```
❌ Error: DATABASE_URL environment variable not set

Please create a .env.local file with your database connection string.
See .env.local.example for examples.
```

### Connection Refused
```
❌ Connection failed!

========================================
Error Details:
========================================
connect ECONNREFUSED 127.0.0.1:5432

Troubleshooting:
  1. Is PostgreSQL running?
  2. Check host and port in DATABASE_URL
  3. For local: brew services start postgresql@14
```

### Authentication Failed
```
❌ Connection failed!

========================================
Error Details:
========================================
password authentication failed for user "postgres"

Troubleshooting:
  1. Check username and password in DATABASE_URL
  2. Verify user exists in PostgreSQL
```

### Database Does Not Exist
```
❌ Connection failed!

========================================
Error Details:
========================================
database "qc_results" does not exist

Troubleshooting:
  1. Create the database first
  2. For local: createdb qc_results
  3. For Neon: database is auto-created
```

### SSL Error (Neon/Supabase)
```
❌ Connection failed!

========================================
Error Details:
========================================
no pg_hba.conf entry for host

Troubleshooting:
  1. Add ?sslmode=require to your DATABASE_URL
  2. Scripts auto-detect Neon/Supabase and enable SSL
```

## Troubleshooting Guide

### Common Issues

**Issue 1: PostgreSQL Not Running**
```bash
# macOS
brew services start postgresql@14

# Check if running
pg_isready
```

**Issue 2: Wrong Port**
PostgreSQL default is 5432, check with:
```bash
ps aux | grep postgres
# or
lsof -i :5432
```

**Issue 3: Password Issues**
For local development, try passwordless:
```env
DATABASE_URL=postgresql://localhost/qc_results
```

**Issue 4: Database Missing**
```bash
# Create database
createdb qc_results

# Or in psql
psql -U postgres
CREATE DATABASE qc_results;
\q
```

## Use Cases

### Pre-Setup Validation
Before running schema creation:
```bash
npm run db:test
# Verify connection works before proceeding
npm run db:schema
```

### Environment Validation
In CI/CD pipeline:
```yaml
# .github/workflows/test.yml
- name: Test Database Connection
  run: npm run db:test
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### Production Health Check
Verify production database is accessible:
```bash
# With production DATABASE_URL in .env.local
npm run db:test
```

### Multi-Environment Setup
Test different database connections:
```bash
# Local
DATABASE_URL=postgresql://localhost/qc_results npm run db:test

# Neon staging
DATABASE_URL=$NEON_STAGING_URL npm run db:test

# Neon production
DATABASE_URL=$NEON_PROD_URL npm run db:test
```

## Notes

### Read-Only
This script only reads metadata:
- Safe to run in production
- No schema changes
- No data modifications

### Fast Execution
Completes in <1 second:
- Single query to test connection
- Simple metadata queries
- No heavy operations

### Security
Passwords are masked in output:
```
postgresql://user:****@host/database
```
Safe to share terminal output.

### Exit Codes
Returns appropriate exit codes:
- `0` - Connection successful
- `1` - Connection failed

### Always Run First
This should be the first script you run:
1. ✅ `npm run db:test` - Verify connection
2. ✅ `npm run db:schema` - Create tables
3. ✅ `npm run db:import` - Import data
4. ✅ `npm run db:verify` - Validate

## Related Files
- `.env.local.example` - Database configuration template
- `scripts/db/schema.sql` - Next script to run after connection succeeds
- `scripts/db/README.md` - Complete setup guide with troubleshooting
- `build-data/documentation/DATABASE-SETUP.md` - Quick start guide
