# QC Results Database Setup Guide

Complete guide for setting up the QC Results PostgreSQL database locally or on Neon.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.local.example .env.local
# Edit .env.local with your database URL

# 3. Test connection
npm run db:test

# 4. Create schema
npm run db:schema

# 5. Import data
npm run db:import

# 6. Verify import
npm run db:verify
```

Done! Your database is ready to use.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Setup (PostgreSQL)](#local-setup-postgresql)
3. [Neon Setup (Cloud)](#neon-setup-cloud)
4. [Import Process](#import-process)
5. [Available Scripts](#available-scripts)
6. [Troubleshooting](#troubleshooting)
7. [Database Schema](#database-schema)

---

## Prerequisites

### Required Software

- **Node.js** 18+ (for running TypeScript scripts)
- **npm** or **yarn**

### For Local Development

- **PostgreSQL** 14+ installed locally
  - macOS: `brew install postgresql@14`
  - Ubuntu: `sudo apt install postgresql-14`
  - Windows: Download from [postgresql.org](https://www.postgresql.org/download/windows/)

### For Cloud (Neon)

- **Neon account**: Free at [neon.tech](https://neon.tech)
- No local PostgreSQL needed!

---

## Local Setup (PostgreSQL)

### 1. Install PostgreSQL

**macOS (Homebrew):**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql-14
sudo systemctl start postgresql
```

**Verify installation:**
```bash
psql --version
# Should output: psql (PostgreSQL) 14.x
```

### 2. Create Database

```bash
# Create database
createdb qc_results

# Or using psql
psql -U postgres
CREATE DATABASE qc_results;
\q
```

### 3. Configure Connection

Create `.env.local`:
```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
# Local PostgreSQL
DATABASE_URL=postgresql://localhost/qc_results

# Or with custom user/password
DATABASE_URL=postgresql://username:password@localhost:5432/qc_results
```

### 4. Test Connection

```bash
npm run db:test
```

Should output:
```
✅ Connection successful!
PostgreSQL Details:
  Server Time: 2025-11-11 ...
  Version:     PostgreSQL 14.x
```

---

## Neon Setup (Cloud)

### 1. Create Neon Project

1. Go to [console.neon.tech](https://console.neon.tech)
2. Sign up (free tier available)
3. Create new project: "QC-Results"
4. Select region (closest to you)
5. Database auto-created

### 2. Get Connection String

1. In Neon console, click "Connection Details"
2. Copy the connection string
3. Should look like:
   ```
   postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/qc_results?sslmode=require
   ```

### 3. Configure Connection

Create `.env.local`:
```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
# Neon (paste your connection string)
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/qc_results?sslmode=require
```

### 4. Test Connection

```bash
npm run db:test
```

Should connect to Neon successfully.

---

## Import Process

### Full Import (Recommended)

Run all steps in order:

```bash
# 1. Test connection
npm run db:test

# 2. Create schema (tables, views, indexes)
npm run db:schema

# 3. Import data from JSON
npm run db:import

# 4. Verify everything worked
npm run db:verify
```

### What Gets Imported

- **8 tables** with 461 rows total:
  - 8 categories
  - 16 pathogens
  - 28 markers
  - 9 manufacturers
  - 132 assays
  - 16 QC samples
  - 132 test configurations
  - 132 CV measurements

### Import Output

```
📊 Importing 8 categories...
  Categories: [████████████████████] 8/8 (100.0%)
✅ Imported successfully

📊 Importing 16 pathogens...
  Pathogens: [████████████████████] 16/16 (100.0%)
✅ Imported successfully

... (continues for all tables)

✅ Transaction committed successfully!
========================================
✅ Import completed successfully!
========================================
Duration: 2.34s
Categories: 8
Pathogens: 16
Markers: 28
...
```

### Verification Output

```
📋 Testing table row counts...
✅ categories                 8 rows
✅ pathogens                  16 rows
✅ markers                    28 rows
...

🔗 Testing foreign key relationships...
✅ Markers → Pathogens       All references valid
✅ Markers → Categories      All references valid
...

✅ All tests passed! ✨
Database is ready to use!
```

---

## Available Scripts

All scripts are in `package.json` under `"scripts"`.

### Connection Management

```bash
# Test database connection
npm run db:test

# Shows: host, port, database, version, schema status
```

### Schema Management

```bash
# Create/update schema (safe - uses ON CONFLICT)
npm run db:schema

# Reset database (WARNING: deletes all data!)
npm run db:reset
```

### Data Management

```bash
# Import data from JSON
npm run db:import

# Verify data integrity
npm run db:verify

# Complete setup (schema + import + verify)
npm run db:setup
```

### Development

```bash
# Run psql console (local only)
npm run db:console

# Backup database (local only)
npm run db:backup

# Restore from backup (local only)
npm run db:restore
```

---

## Troubleshooting

### Connection Refused

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solutions:**
1. Start PostgreSQL: `brew services start postgresql@14`
2. Check if running: `pg_isready`
3. Verify port: PostgreSQL usually uses 5432

### Authentication Failed

```
Error: password authentication failed for user "postgres"
```

**Solutions:**
1. Check DATABASE_URL has correct password
2. For local, try: `DATABASE_URL=postgresql://localhost/qc_results` (no password)
3. Reset password: `ALTER USER postgres PASSWORD 'newpassword';`

### Database Does Not Exist

```
Error: database "qc_results" does not exist
```

**Solutions:**
1. Create it: `createdb qc_results`
2. Or in psql: `CREATE DATABASE qc_results;`
3. For Neon: database is auto-created, check name in console

### SSL Required (Neon/Supabase)

```
Error: no pg_hba.conf entry for host
```

**Solutions:**
1. Add `?sslmode=require` to DATABASE_URL
2. Scripts auto-detect Neon/Supabase and enable SSL
3. Example: `postgresql://user:pass@host/db?sslmode=require`

### Import Fails Midway

```
Error: duplicate key value violates unique constraint
```

**Solutions:**
1. Reset database: `npm run db:reset`
2. Re-import: `npm run db:import`
3. Scripts use ON CONFLICT for idempotency

### Permission Denied

```
Error: permission denied for table
```

**Solutions:**
1. Check database user has correct permissions
2. For local: use superuser or database owner
3. For Neon: default user has full permissions

---

## Database Schema

### Tables (8)

1. **categories** - Disease categories (TORCH, Hepatitis, etc.)
2. **pathogens** - Infectious organisms (CMV, HIV, etc.)
3. **markers** - Test markers (anti-CMV IgG, HBsAg, etc.)
4. **manufacturers** - Equipment manufacturers (Abbott, Roche, etc.)
5. **assays** - Assay platforms (ARCHITECT, Elecsys, etc.)
6. **qc_samples** - QC control materials (Optitrol series)
7. **test_configurations** - Unique marker+assay+QC combinations
8. **cv_measurements** - CV performance data

### Views (2)

1. **vw_test_config_details** - Complete config details (all joins)
2. **vw_manufacturer_performance** - Performance summary by manufacturer

### Relationships

```
categories → pathogens → markers
                            ↓
manufacturers → assays → test_configurations → cv_measurements
                            ↑
                     qc_samples
```

### Sample Queries

**Get all CMV tests:**
```sql
SELECT * FROM vw_test_config_details
WHERE marker_name LIKE '%CMV%'
ORDER BY cv_lt_10_percentage DESC;
```

**Compare manufacturers:**
```sql
SELECT * FROM vw_manufacturer_performance
ORDER BY avg_cv_lt_10_pct DESC;
```

**Find poor performers:**
```sql
SELECT marker_name, assay_name, cv_gt_20_percentage
FROM vw_test_config_details
WHERE cv_gt_20_percentage > 20
ORDER BY cv_gt_20_percentage DESC;
```

---

## Next Steps

After successful import:

### For Development

1. **Connect from Next.js:**
   ```typescript
   import { Pool } from 'pg';
   const pool = new Pool({ connectionString: process.env.DATABASE_URL });
   ```

2. **Create API routes:**
   ```typescript
   // app/api/configs/route.ts
   export async function GET() {
     const result = await pool.query('SELECT * FROM vw_test_config_details');
     return Response.json(result.rows);
   }
   ```

### For Production

1. **Use connection pooling:**
   - Neon: Built-in pooling (no setup needed)
   - Supabase: Connection pooling available
   - Self-hosted: Use pgBouncer

2. **Enable backups:**
   - Neon: Automatic backups included
   - Self-hosted: Use `pg_dump` scheduled backups

3. **Monitor performance:**
   - Use database indexes (already created)
   - Monitor slow queries
   - Use EXPLAIN ANALYZE for optimization

---

## File Structure

```
scripts/db/
├── README.md                  # This file
├── schema.sql                 # Database schema (DDL)
├── import-data.ts             # Data import script
├── verify-import.ts           # Verification tests
├── test-connection.ts         # Connection test
└── reset-database.ts          # Reset script (dangerous!)

.env.local.example             # Environment template
.env.local                     # Your config (gitignored)

build-data/assets/
└── qc-data.json               # Source data
```

---

## Support

### Documentation

- **Schema Details:** `build-data/documentation/DATABASE-SCHEMA.md`
- **Data Analysis:** `build-data/learning/QC-Excel-Analysis.md`
- **TypeScript Types:** `lib/types/qc-data.ts`

### Resources

- **PostgreSQL Docs:** https://www.postgresql.org/docs/
- **Neon Docs:** https://neon.tech/docs
- **node-postgres:** https://node-postgres.com/

### Common Issues

Check [Troubleshooting](#troubleshooting) section above.

---

**Ready to import?** Run:
```bash
npm run db:setup
```

This runs schema creation, data import, and verification automatically! 🚀
