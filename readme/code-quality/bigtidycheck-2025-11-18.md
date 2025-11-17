# Code Quality Analysis Report

**Analysis Date:** 2025-11-18 07:00:00
**Command:** `/bigtidycheck`
**Project:** AusGeochem Thermochronology Database

---

## 📊 Executive Summary

**Total Issues Found:** 75

| Severity | Count | Action |
|----------|-------|--------|
| 🔴 **Critical** | 5 | Fix immediately (security vulnerabilities) |
| 🟡 **Medium** | 6 | Fix this sprint (unused code, config issues) |
| 🔵 **Small** | 64 | Track and clean up (unused exports) |

---

## 🔴 Critical Issues (5)

### Security Vulnerabilities

All critical issues are **HIGH severity npm package vulnerabilities**:

#### 1. **glob: Command injection vulnerability (GHSA-5j98-mcp5-4vw2)** → **ERROR-007**
- **Severity:** HIGH (CVSS 7.5)
- **Package:** `glob@10.3.7-11.0.3`
- **Vulnerability:** CLI command injection via `-c/--cmd` executes matches with `shell:true`
- **Impact:** Potential command execution if glob CLI is used with untrusted input
- **Affected packages:**
  - `glob` (transitive dependency)
  - `@next/eslint-plugin-next` (via glob)
  - `eslint-config-next` (via @next/eslint-plugin-next)
  - `sucrase` (via glob)
  - `tailwindcss` (via sucrase)
- **Fix:** Run `npm audit fix`
- **Status:** 🔴 Logged → ERROR-007
- **Debug Log:** `build-data/errors/debug/ER-007-security-glob-command-injection-vulnerability-npm-audit.md`

#### 2. **eslint-config-next: Vulnerability via glob dependency**
- **Severity:** HIGH
- **Package:** `eslint-config-next@14.0.5-canary.0 - 15.0.0-rc.1`
- **Vulnerability:** Inherited from glob package
- **Impact:** Dev dependency - lower risk but should be patched
- **Fix:** Run `npm audit fix`
- **Status:** 🔴 Open

#### 3. **tailwindcss: Vulnerability via sucrase/glob chain**
- **Severity:** HIGH
- **Package:** `tailwindcss@3.4.15 - 3.4.18`
- **Vulnerability:** Inherited from glob via sucrase
- **Impact:** Dev dependency - lower risk but should be patched
- **Fix:** Run `npm audit fix`
- **Status:** 🔴 Open

#### 4. **@next/eslint-plugin-next: Vulnerability via glob**
- **Severity:** HIGH
- **Package:** `@next/eslint-plugin-next@14.0.5-canary.0 - 15.0.0-rc.1`
- **Vulnerability:** Inherited from glob package
- **Impact:** Dev dependency - lower risk
- **Fix:** Run `npm audit fix`
- **Status:** 🔴 Open

#### 5. **sucrase: Vulnerability via glob dependency**
- **Severity:** HIGH
- **Package:** `sucrase@>=3.35.0`
- **Vulnerability:** Inherited from glob package
- **Impact:** Dev dependency used by tailwindcss
- **Fix:** Run `npm audit fix`
- **Status:** 🔴 Open

**Quick Fix:**
```bash
npm audit fix
```

**Verification:**
```bash
npm audit
```

---

## 🟡 Medium Issues (6)

### 1. **Unused Dev Dependencies** → **ERROR-008**

**5 packages total:** `@types/react-dom`, `autoprefixer`, `eslint`, `eslint-config-next`, `postcss`

**Package:** `@types/react-dom`
- **Location:** `package.json` devDependencies
- **Issue:** Declared but not used in codebase
- **Impact:** Unnecessary package, increases install time
- **Fix:** Remove from package.json
```bash
npm uninstall @types/react-dom autoprefixer eslint eslint-config-next postcss
```
- **Status:** 🟡 Logged → ERROR-008
- **Debug Log:** `build-data/errors/debug/ER-008-code-quality-unused-devdependencies-bloat-5-packages.md`

**Package:** `autoprefixer`
- **Location:** `package.json` devDependencies
- **Issue:** Declared but not used (Next.js includes this internally)
- **Impact:** Redundant dependency
- **Fix:** Remove from package.json
```bash
npm uninstall autoprefixer
```
- **Status:** 🟡 Open

**Package:** `eslint`
- **Location:** `package.json` devDependencies
- **Issue:** May be redundant with eslint-config-next
- **Impact:** Check if needed independently
- **Fix:** Verify ESLint usage, remove if not needed
- **Status:** 🟡 Review needed

**Package:** `eslint-config-next`
- **Location:** `package.json` devDependencies
- **Issue:** HIGH security vulnerability (see Critical #2)
- **Impact:** Security + unused code
- **Fix:** `npm audit fix` first, then verify usage
- **Status:** 🟡 Open

**Package:** `postcss`
- **Location:** `package.json` devDependencies
- **Issue:** Likely redundant (Next.js includes internally)
- **Impact:** Unnecessary dependency
- **Fix:** Remove if not explicitly needed
```bash
npm uninstall postcss
```
- **Status:** 🟡 Open

### 2. **Invalid tsconfig.json** → **ERROR-009**

- **File:** `tsconfig.json:3`
- **Issue:** JSON syntax error at position 29 (line 3 column 5)
- **Error:** `Expected property name or '}' in JSON`
- **Impact:** Tools like depcheck cannot parse config
- **Fix:** Check line 3 for JSON syntax error (likely trailing comma)
- **Status:** 🟡 Logged → ERROR-009
- **Debug Log:** `build-data/errors/debug/ER-009-config-invalid-tsconfigjson-syntax-error.md`

---

## 🔵 Small Issues (64)

### Unused TypeScript Exports

**Category:** Dead code - functions/components exported but never imported elsewhere

**Impact:** Code bloat, maintenance burden, confusion for developers

**Recommendation:** Review each export, remove if truly unused, or mark as intentional API

#### Unused Route Handlers (7)
- `app/api/samples/route.ts:26` - `GET` function
- `app/api/stats/route.ts:17` - `GET` function
- `app/api/analysis/ages/route.ts:9` - `GET` function
- `app/api/samples/[id]/route.ts:17` - `GET` function
- `app/api/tables/[name]/route.ts:95` - `GET` function
- `app/api/datasets/[id]/download-all/route.ts:7` - `GET` function
- *(Note: API routes are called by Next.js router, not directly imported - safe to ignore)*

#### Unused Page Components (9)
- `app/layout.tsx:71` - `default` export
- `app/page.tsx:3` - `default` export
- `app/analysis/page.tsx:9` - `default` export
- `app/datasets/page.tsx:51` - `default` export
- `app/samples/page.tsx:6` - `default` export
- `app/tables/page.tsx:155` - `default` export
- `app/datasets/[id]/page.tsx:89` - `default` export
- `app/samples/[id]/page.tsx:8` - `default` export
- *(Note: Page exports are used by Next.js App Router - safe to ignore)*

#### Unused Metadata Exports (3)
- `app/layout.tsx:20` - `metadata`
- `app/analysis/page.tsx:4` - `metadata`
- `app/datasets/page.tsx:6` - `metadata`
- *(Note: Metadata exports used by Next.js - safe to ignore)*

#### Unused Database Query Functions (18)

**High-value cleanup targets:**

- `lib/db/queries.ts:121` - `getSampleSummaries` - Alternative to getAllSamples
- `lib/db/queries.ts:213` - `getFTDatapointsBySample` - Unused FT datapoint query
- `lib/db/queries.ts:223` - `getFTDatapointById` - Unused FT datapoint lookup
- `lib/db/queries.ts:233` - `getFTCountDataByDatapoint` - Unused count data query
- `lib/db/queries.ts:243` - `getFTSingleGrainAgesByDatapoint` - Unused grain ages
- `lib/db/queries.ts:253` - `getFTTrackLengthDataByDatapoint` - Unused track lengths
- `lib/db/queries.ts:264` - `getAFTData` - Unused AFT data query
- `lib/db/queries.ts:335` - `getHeDatapointsBySample` - Unused He datapoints
- `lib/db/queries.ts:345` - `getHeDatapointById` - Unused He datapoint lookup
- `lib/db/queries.ts:355` - `getHeGrainDataByDatapoint` - Unused He grain data
- `lib/db/queries.ts:366` - `getAHeData` - Unused AHe data query
- `lib/db/queries.ts:432` - `getAllBatches` - Unused batches query
- `lib/db/queries.ts:439` - `getBatchById` - Unused batch lookup
- `lib/db/queries.ts:446` - `getReferenceMaterialsByBatch` - Unused QC data
- `lib/db/queries.ts:460` - `getAllPeople` - Unused people query
- `lib/db/queries.ts:467` - `getPersonById` - Unused person lookup
- `lib/db/queries.ts:474` - `getPersonByOrcid` - Unused ORCID lookup
- `lib/db/queries.ts:542` - `searchSamplesByLocation` - Unused spatial search
- `lib/db/queries.ts:817` - `getSampleDetailV1` - Legacy sample detail (replaced by v2)

**Status:** These are likely **future features** - keep for now, mark as planned API

#### Unused Connection Functions (5)
- `lib/db/connection.ts:167` - `transaction` - Transaction wrapper (good to have)
- `lib/db/connection.ts:193` - `testConnection` - Connection test (utility)
- `lib/db/connection.ts:212` - `closePool` - Pool cleanup (utility)
- `lib/db/connection.ts:224` - `getPoolStats` - Pool monitoring (debugging)
- *(Note: Utility functions - keep for debugging/testing)*

#### Unused Type Definitions (12)
- `lib/types/thermo-data.ts:205` - `SamplePersonRole`
- `lib/types/thermo-data.ts:251` - `Mount`
- `lib/types/thermo-data.ts:266` - `Grain`
- `lib/types/thermo-data.ts:480` - `FTBinnedLengthData`
- `lib/types/thermo-data.ts:920` - `DatapointType`
- `lib/types/thermo-data.ts:921` - `FTMethod`
- `lib/types/thermo-data.ts:922` - `TrackType`
- `lib/types/thermo-data.ts:923` - `PrivacyStatus`
- *(Note: Types may be used for future features - keep)*

#### Unused Utility Functions (2)
- `lib/utils/cn.ts:10` - `cn` - Tailwind utility (may be used in future components)
- `lib/utils/cn.ts:8` - `ClassValue` - Type for cn utility

#### Other Unused Exports (8)
- `tailwind.config.ts:74` - `default` export
- `app/datasets/page.tsx:11` - `dynamic` config
- `app/samples/page.tsx:4` - `dynamic` config
- `app/api/samples/route.ts:24` - `dynamic` config
- `app/api/stats/route.ts:15` - `dynamic` config
- `app/datasets/[id]/page.tsx:15` - `dynamic` config
- `app/samples/[id]/page.tsx:6` - `dynamic` config
- `app/api/samples/[id]/route.ts:15` - `dynamic` config

---

## ✅ What's Working Well

1. **No TypeScript errors** - All code type-checks successfully ✓
2. **No hardcoded secrets** - Only safe .env references found ✓
3. **Clean database code** - Schema v2 migration complete ✓
4. **No console.logs** - Production code is clean ✓

---

## 🎯 Recommended Actions

### Immediate (Today)
1. **Fix security vulnerabilities:**
   ```bash
   npm audit fix
   npm audit  # Verify fix
   ```

2. **Fix tsconfig.json syntax:**
   - Check line 3 for trailing comma or syntax error
   - Run `npx tsc --noEmit` to verify

### This Week
3. **Clean up unused devDependencies:**
   ```bash
   npm uninstall @types/react-dom autoprefixer postcss
   ```

4. **Review ESLint config:**
   - Verify if standalone eslint is needed
   - Consider using only eslint-config-next

### This Month
5. **Review unused exports:**
   - Mark future API functions with comments
   - Remove truly dead code
   - Document intentional exports

6. **Implement future features:**
   - Use the 18 unused query functions (FT/He datapoints, batches, people)
   - Build sample detail pages with full data
   - Add QC dashboard (batches, reference materials)

---

## 📁 Files Analyzed

**Scanned:**
- `app/` - 15 files (Next.js routes and pages)
- `lib/` - 3 files (database queries, types, utilities)
- `components/` - 6 files (React components)
- `package.json` - Dependencies
- `tsconfig.json` - TypeScript config

**Total:** 25 code files analyzed

---

## 🔄 Next Steps

1. Run `npm audit fix` to patch security vulnerabilities
2. Fix `tsconfig.json` syntax error
3. Remove unused devDependencies
4. Re-run `/bigtidycheck` to verify fixes
5. Plan implementation of unused query functions (future features)

---

**Generated by:** `/bigtidycheck`
**Next check:** Run `/bigtidycheck` after fixes to verify
