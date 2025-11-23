# Code Quality Analysis - Post-Supabase Migration

**Last Check:** 2025-11-21 19:45:00
**Found by:** `/bigtidycheck`
**Focus:** Lingering Neon references after Supabase migration
**Branch:** `idea-014-earthbank-schema-migration`

---

## 📊 Summary

**Total Issues Found:** 18

| Severity | Count | Action |
|----------|-------|--------|
| 🔴 Critical | 2 | Auto-log to error system |
| 🟡 Medium | 12 | User selection for logging |
| 🔵 Small | 4 | Track in readme only |

---

## 🔴 CRITICAL ISSUES (2)

### 1. **Security: xlsx Library Vulnerabilities** → **WILL CREATE ERROR-XXX**

**Package:** `xlsx`
**Severity:** HIGH (CVSS 7.5-7.8)
**Vulnerabilities:** 2 high-severity issues

**CVE Details:**
- **GHSA-4r6h-8v6p-xvw6** - Prototype Pollution in sheetJS
  - CVSS Score: 7.8
  - CWE: CWE-1321
  - Range: <0.19.3

- **GHSA-5pgg-2g8v-p4x9** - Regular Expression Denial of Service (ReDoS)
  - CVSS Score: 7.5
  - CWE: CWE-1333
  - Range: <0.20.2

**Current Version:** Unknown (needs check)
**Fix Available:** No automatic fix available
**npm audit output:** "fixAvailable": false

**Files Affected:**
- `lib/utils/file-upload.ts` - File processing
- `app/api/extraction/*/route.ts` - PDF extraction workflow
- Import scripts using Excel templates

**Impact:**
- Security risk when processing user-uploaded Excel files
- Potential for prototype pollution attacks
- Potential for ReDoS attacks on malformed Excel files

**Suggested Fix:**
1. Check for alternative Excel libraries (e.g., `exceljs`, `node-xlsx`)
2. If xlsx must be used, implement strict file validation before processing
3. Consider sandboxing Excel file processing
4. Update to latest xlsx version if available
5. Monitor for security updates

**Status:** 🔴 Open → Will auto-log as ERROR-XXX

---

### 2. **TypeScript: Unused Imports** → **WILL CREATE ERROR-XXX**

**Count:** 3 unused imports
**Impact:** Code cleanliness, potential confusion
**Severity:** Medium-High (compilation warnings)

**Files:**

**a) `app/api/extraction/[sessionId]/load/route.ts:23`**
- **Issue:** `'path' is declared but its value is never read`
- **Impact:** Unused import clutters code
- **Fix:** Remove `import path from 'path'` or use it

**b) `lib/storage/supabase.ts:52`**
- **Issue:** `'data' is declared but its value is never read`
- **Impact:** Unused variable after API call
- **Fix:** Remove declaration or use the data

**c) `lib/utils/file-upload.ts:9`**
- **Issue:** `'downloadFile' is declared but its value is never read`
- **Impact:** Exported but unused function
- **Fix:** Remove export or implement download functionality

**Suggested Fix:**
```bash
# Remove unused imports
# In each file, either use the import or remove it
```

**Status:** 🔴 Open → Will auto-log as ERROR-XXX

---

## 🟡 MEDIUM ISSUES - NEON CODE REFERENCES (12)

**These are lingering Neon references in code after Supabase migration.**

### 3. **lib/db/connection.ts** - Neon References (3 locations)

**Line 1:** Comment still mentions Neon
```typescript
/**
 * Singleton connection pool for PostgreSQL (Neon)
```
**Fix:** Change to "Supabase" or remove provider reference

**Line 33:** Error message mentions Neon
```typescript
'Please create a .env.local file with DATABASE_URL=<your-neon-connection-string>'
```
**Fix:** Change to "your-supabase-connection-string"

**Line 65:** SSL detection includes 'neon.tech'
```typescript
ssl: connectionString.includes('neon.tech')
```
**Fix:** Keep as fallback OR change to:
```typescript
ssl: connectionString.includes('neon.tech') || connectionString.includes('supabase')
```
**Note:** Current code already has supabase fallback in some files

**Impact:** Low - code works, but comments are misleading
**Status:** 🟡 Open

---

### 4. **scripts/db/import-thermo-data.ts** - Neon References

**Line 1:** Comment "PostgreSQL/Neon database"
**Line 65:** SSL detection `DATABASE_URL.includes('neon.tech')`

**Current Code:**
```typescript
ssl: DATABASE_URL.includes('neon.tech') || DATABASE_URL.includes('supabase')
```

**Fix:** Update comment to "PostgreSQL (Supabase)"
**Impact:** Low - SSL detection works correctly
**Status:** 🟡 Open

---

### 5. **scripts/db/reset-database.ts** - Neon SSL Detection

**Line 33:** SSL detection includes 'neon.tech'
```typescript
ssl: DATABASE_URL.includes('neon.tech') || DATABASE_URL.includes('supabase')
```

**Fix:** Update comment or keep as-is (works for both)
**Impact:** Low - works correctly
**Status:** 🟡 Open

---

### 6. **scripts/db/test-connection.ts** - Neon in Help Text

**Line 58:** SSL detection
**Line 65:** Help text mentions Neon
```typescript
console.log('  3. For Neon: database is auto-created');
```

**Fix:** Change to "For Supabase: database is auto-created"
**Impact:** Low - help text outdated
**Status:** 🟡 Open

---

### 7. **scripts/db/run-migration.ts** - Neon SSL Detection

**Line 44:**
```typescript
ssl: DATABASE_URL.includes('neon.tech') || DATABASE_URL.includes('supabase')
```

**Fix:** Keep as-is (works for both) or update comment
**Impact:** Low - works correctly
**Status:** 🟡 Open

---

### 8. **scripts/query-mcmillan-data.js** - Neon in Comments

**Line 1:** "Query McMillan 2024 Malawi Rift data from Neon database (LEGACY)"
**Line 42:** Success message "Data successfully retrieved from Neon database"

**Fix:** Update comments to mention Supabase
**Impact:** Low - legacy script, may not be used
**Status:** 🟡 Open

---

### 9. **scripts/db/check-neon-data.ts** - FILE NEEDS RENAMING ⚠️

**CRITICAL FINDING:** Entire file is named after Neon

**Current Filename:** `scripts/db/check-neon-data.ts`
**Should Be:** `scripts/db/check-supabase-data.ts` OR `scripts/db/check-database-data.ts`

**Line 4:** Console message "Checking Neon database contents"

**Fix:**
```bash
mv scripts/db/check-neon-data.ts scripts/db/check-supabase-data.ts
# Then update console.log message
```

**Impact:** Medium - misleading filename
**Status:** 🟡 Open

---

### 10. **scripts/db/export-schema-snapshot.ts** - Neon in Header

**Line 7:** Comment "Database: neondb"

**Fix:** Change to "Database: postgres" (Supabase default db name)
**Impact:** Low - comment only
**Status:** 🟡 Open

---

### 11. **scripts/db/transform-and-import-malawi.ts** - Neon in Comment

**Comment:** "imports to Neon database"

**Fix:** Update to "imports to Supabase database"
**Impact:** Low - comment only
**Status:** 🟡 Open

---

### 12. **scripts/generate-schema-snapshot.ts** - Neon in Output

**Console output:** Mentions "Neon PostgreSQL"

**Fix:** Update output message to "Supabase PostgreSQL"
**Impact:** Low - console message only
**Status:** 🟡 Open

---

## 🔵 SMALL ISSUES (4)

### Unused Dependencies

**13-16. Unused npm packages** (from depcheck)

**Dependencies (potentially unused):**
- `@types/formidable` - Type definitions for formidable (file uploads)
- `formidable` - File upload handling library
- `glob` - File pattern matching
- `pino-pretty` - Logging formatter

**Impact:** Bloat in node_modules, slower npm install
**Note:** These may be used indirectly or in scripts not analyzed

**Suggested Action:**
1. Verify each package is truly unused
2. Check if used in scripts/ directory
3. If confirmed unused, remove from package.json
4. Run `npm prune` to clean up

**Status:** 🔵 Tracked

---

## 📋 Recommended Actions

### Immediate (Critical)

1. **Address xlsx vulnerabilities:**
   - Research alternative Excel libraries
   - Or implement strict file validation
   - Update security documentation

2. **Remove unused TypeScript imports:**
   - Clean up 3 files with unused imports
   - Run `tsc --noEmit` to verify

### Short-term (Neon Cleanup)

**Systematic Neon → Supabase Refactor:**

```bash
# 1. Rename check-neon-data.ts
mv scripts/db/check-neon-data.ts scripts/db/check-database-data.ts

# 2. Update all Neon references in code
find scripts/ lib/ app/ -name "*.ts" -o -name "*.js" | xargs sed -i '' 's/Neon database/Supabase database/g'
find scripts/ lib/ app/ -name "*.ts" -o -name "*.js" | xargs sed -i '' 's/neon-connection-string/supabase-connection-string/g'

# 3. Update comments
# lib/db/connection.ts:1 - Change "PostgreSQL (Neon)" → "PostgreSQL (Supabase)"
# All script files - Update database provider mentions

# 4. Verify changes
npm run type-check
```

### Optional (Cleanup)

**Remove unused dependencies:**
```bash
npm uninstall @types/formidable formidable glob pino-pretty
npm install  # Verify build still works
```

---

## 📊 Files Requiring Updates

**Code Files (15):**
- `lib/db/connection.ts` (3 updates)
- `lib/storage/supabase.ts` (1 update)
- `lib/utils/file-upload.ts` (1 update)
- `app/api/extraction/[sessionId]/load/route.ts` (1 update)
- `scripts/db/check-neon-data.ts` (rename + 1 update)
- `scripts/db/import-thermo-data.ts` (1 update)
- `scripts/db/reset-database.ts` (comment update)
- `scripts/db/test-connection.ts` (1 update)
- `scripts/db/run-migration.ts` (comment update)
- `scripts/db/export-schema-snapshot.ts` (1 update)
- `scripts/db/transform-and-import-malawi.ts` (1 update)
- `scripts/generate-schema-snapshot.ts` (1 update)
- `scripts/query-mcmillan-data.js` (2 updates)

**Dependencies:**
- `package.json` - Consider removing 4 unused packages

---

## ✅ Next Steps

1. **Review this report**
2. **Select which medium issues to log** (see user selection below)
3. **Critical issues will be auto-logged** as ERROR-XXX
4. **Start fixing systematically** using `/debug-mode`
5. **Re-run `/bigtidycheck`** after fixes to verify

---

**Report Generated:** 2025-11-21 19:45:00
**Tool:** `/bigtidycheck` - Comprehensive Code Quality Analysis
**Migration Context:** Post Neon → Supabase migration (ERROR-021)
