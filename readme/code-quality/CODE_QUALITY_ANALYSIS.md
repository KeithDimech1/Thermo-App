# Code Quality Analysis

**Last Check:** 2025-11-18 17:31:44
**Found by:** `/bigtidycheck`
**Context:** IDEA-014 Migration (Phase 6 - Testing)

---

## 📊 Summary

| Severity | Count | Status |
|----------|-------|--------|
| 🔴 Critical | 2 | 1 fixed ✅, 1 deferred 🟡 |
| 🟡 Medium | 4 | Fix in Phase 6.4 or Phase 8 |
| 🔵 Small | ~15 | Track, fix opportunistically |

**Phase 6.3 Update (2025-11-18):**
- ✅ Fixed TypeScript doubled type name error (`EarthBankEarthBankHeDatapoint`)
- ✅ Fixed field name mismatches (19 errors → 3 errors):
  - Added `nAFTGrains`, `nAHeGrains` to EarthBankSample type
  - Fixed `centralAgeUncertaintyMa` → `centralAgeUncertainty`
  - Fixed `pooledAgeUncertaintyMa` → `pooledAgeUncertainty`
  - Fixed `mtlStdDev` → `mtlUncertainty`
  - Fixed `meanCorrectedAgeUncertaintyMa` → `meanCorrectedAgeUncertainty`
  - Removed non-existent `analysisMethod` field references
  - Cleaned up unused imports
- 🟡 3 remaining errors in transitional pages (data/fair/datasets) - will fix in Phase 8
- 🟡 Deferred glob vulnerability to Phase 8 (requires breaking ESLint upgrade)

**Migration Context:** IDEA-014 schema migration (snake_case → camelCase) is in progress.
Some issues are expected and documented in the migration plan.

---

## 🔴 Critical Issues

### 1. **Security: HIGH Severity Dependency Vulnerability** → **Deferred to Phase 8**

- **Package:** `glob` (via @next/eslint-plugin-next → eslint-config-next chain)
- **CVE:** GHSA-5j98-mcp5-4vw2
- **Severity:** HIGH (CVSS 7.5)
- **Issue:** Command injection via -c/--cmd executes matches with shell:true
- **Affected Versions:** glob >=10.3.7 <=11.0.3
- **Impact:** Dev dependencies only (not production runtime)
- **Fix Attempted:** 2025-11-18
  - `npm audit fix` failed to resolve automatically
  - Manual fix requires eslint v8 → v9 upgrade (breaking change)
  - Blocked by peer dependency conflicts during migration
- **Decision:** **Accepted risk, deferred to Phase 8**
  - Low practical risk: dev-only, CLI-specific vulnerability
  - Attack surface limited to -c/--cmd flag usage
  - Not exploitable in production runtime
  - Will address post-migration with full ESLint upgrade
- **Status:** 🟡 Deferred
- **Priority:** P2 (Medium - will fix post-migration)

---

### 2. **TypeScript: Doubled Type Name (Build Error)** → **✅ FIXED**

- **File:** `app/samples/[id]/page.tsx:261`
- **Issue:** `EarthBankEarthBankHeDatapoint` → should be `EarthBankHeDatapoint`
- **Root Cause:** Sed replacement doubled the prefix during migration
- **Impact:** TypeScript error, will cause runtime error if code path executed
- **Fix Applied:** 2025-11-18
  ```typescript
  // Line 261, changed:
  {heDatapoints.map((datapoint: EarthBankEarthBankHeDatapoint, idx: number) => {
  // To:
  {heDatapoints.map((datapoint: EarthBankHeDatapoint, idx: number) => {
  ```
- **Status:** ✅ Fixed
- **Priority:** P0 (Critical - TypeScript compilation error)

---

## 🟡 Medium Issues

### 3. **Production Code: Console.log Statements**

- **Files Affected:** 12 files (all API routes + 2 lib files)
  - `app/api/tables/[name]/route.ts`
  - `app/api/analysis/ages/route.ts`
  - `app/api/datasets/files/[id]/route.ts`
  - `app/api/datasets/[id]/supplementary-files/route.ts`
  - `app/api/datasets/[id]/table-counts/route.ts`
  - `app/api/datasets/[id]/download-all/route.ts`
  - `app/api/samples/route.ts`
  - `app/api/samples/[id]/route.ts`
  - `app/api/stats/route.ts`
  - `lib/db/fair-compliance.ts`
  - `lib/db/connection.ts`
  - `components/datasets/TablesView.tsx`
- **Issue:** Debug console.log/console.error statements in production code
- **Impact:**
  - Performance overhead
  - Log pollution in production
  - Potential information leakage
- **Suggested Fix:** Replace with proper logger or remove
  ```typescript
  // Replace:
  console.log('Data:', result);
  // With:
  // logger.debug('Data:', result);  // If debugging needed
  // Or remove entirely for production
  ```
- **Status:** 🟡 Open
- **Priority:** P2 (Medium - cleanup)

---

### 4. **Unused TypeScript Imports**

- **Files:**
  - `app/samples/[id]/page.tsx:4` - `EarthBankHeDatapoint` imported but unused
  - `components/datasets/DatasetTabs.tsx:19` - `pathname` declared but unused
  - `lib/db/earthbank-queries.ts:19` - `EarthBankFTCountData` imported but unused
- **Issue:** Imported but never referenced
- **Impact:** Code bloat, confusion
- **Suggested Fix:** Remove unused imports
- **Status:** 🟡 Open
- **Priority:** P3 (Low - cleanup)

---

### 5. **Unused Dev Dependencies**

- **Packages:** 5 devDependencies flagged
  - `eslint`
  - `eslint-config-next`
  - `autoprefixer`
  - `postcss`
  - `@types/react-dom`
- **Issue:** Installed but not actively used
- **Impact:** Larger node_modules, slower installs
- **Note:** Some may be peer dependencies or used indirectly
- **Suggested Fix:** Audit and remove if truly unused:
  ```bash
  npm uninstall eslint eslint-config-next  # If not using eslint
  # Keep autoprefixer, postcss if used by Tailwind
  ```
- **Status:** 🟡 Open
- **Priority:** P3 (Low - cleanup)

---

### 6. **Dead Code: Old Query Functions (lib/db/queries.ts)**

- **File:** `lib/db/queries.ts`
- **Issue:** Many functions marked as unused by ts-prune
- **Context:** IDEA-014 migration - being replaced by `earthbank-queries.ts`
- **Functions Being Phased Out:**
  - `getAllSamples` → replaced by earthbank version
  - `getSampleDetail` → replaced by earthbank version
  - `getFTDatapointsBySample` → replaced by earthbank version
  - `getAFTData`, `getAHeData` → replaced by earthbank versions
  - ~20 more functions
- **Impact:** Code maintenance burden, confusion about which to use
- **Suggested Fix:** Phase 8 (Cutover & Cleanup)
  1. Mark all old functions as `@deprecated`
  2. Add JSDoc pointing to new earthbank equivalents
  3. After Phase 8 cutover, remove entirely
- **Status:** 🟡 Tracked (Migration work - Phase 8)
- **Priority:** P2 (Medium - part of migration plan)

---

## 🔵 Small Issues

### 7. **Utility Functions Marked as Unused**

- **Functions:**
  - `lib/db/connection.ts`: `transaction`, `testConnection`, `closePool`, `getPoolStats`
  - `lib/utils/cn.ts`: `ClassValue` type
  - Various type exports
- **Issue:** ts-prune flags as unused
- **Reality:** Used in scripts, tests, or as public API
- **Impact:** None (false positives)
- **Suggested Fix:** Add ts-prune ignore comments or accept as-is
- **Status:** 🔵 Accepted (false positives)
- **Priority:** P4 (Informational only)

---

### 8. **Exported Types Not Directly Referenced**

- **Types:**
  - `EarthBankFTSingleGrainAge`
  - `EarthBankFTBinnedLengthData`
  - `DatapointType`, `FTMethod`, `TrackType`
  - Various interface exports
- **Issue:** Exported but not imported elsewhere (yet)
- **Reality:** Part of public API for future use or external consumers
- **Impact:** None
- **Status:** 🔵 Accepted (designed for future use)
- **Priority:** P4 (Informational only)

---

## Migration-Related Issues (Excluded)

**The following issues are KNOWN and DOCUMENTED in IDEA-014 migration:**

❌ Not flagged as issues (expected during migration):
- `EarthBankSample` missing `nAFTGrains`, `nAHeGrains`, `analysisMethod` fields
- Field name mismatches: `centralAgeUncertaintyMa` vs `centralAgeUncertainty`
- `app/datasets/[id]/data/page.tsx` using old queries (transitional)
- `app/datasets/[id]/fair/page.tsx` using old queries (transitional)
- Dataset type compatibility issues (transitional)

**See:** `build-data/ideas/debug/IDEA-014-*.md` for migration plan and known issues

---

## Recommendations

### Completed (Phase 6.3):
1. ✅ **DONE** - Fixed typo: `EarthBankEarthBankHeDatapoint` → `EarthBankHeDatapoint`
2. 🟡 **DEFERRED** - glob vulnerability (requires ESLint v8→v9 breaking change, deferred to Phase 8)

### Phase 6.4 or Phase 8:
3. Remove console.log statements from API routes
4. Clean up unused imports
5. Mark old query functions as `@deprecated`

### Phase 8 (Post-Migration Cleanup):
6. **ESLint v9 upgrade** - Update eslint + eslint-config-next to fix glob vulnerability
7. Remove `lib/db/queries.ts` entirely (after full cutover)
8. Audit and remove unused dependencies
9. Final ts-prune cleanup

---

## Re-Check Instructions

After fixing issues:

```bash
# Run full check again
/bigtidycheck

# Or check specific items:
npx tsc --noEmit  # TypeScript errors
npm audit         # Security
npx ts-prune      # Dead code
```

---

**Next Check:** After Phase 6.3 fixes or before Phase 8 cleanup
