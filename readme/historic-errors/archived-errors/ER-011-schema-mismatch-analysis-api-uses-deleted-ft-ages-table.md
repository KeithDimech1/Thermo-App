# ERROR-011: Schema Mismatch - Analysis API uses deleted ft_ages table

**Error ID:** ERROR-011
**Date Reported:** 2025-11-17 (Found by `/bigtidycheck`)
**Status:** 🔴 Critical - API BROKEN
**Priority:** P0 (Critical)
**Impact:** `/api/analysis/ages` endpoint returns 500 error

---

## Error Details

### Error Message
```
PostgreSQL Error: relation "ft_ages" does not exist
```

### Root Cause
`app/api/analysis/ages/route.ts:28` queries `ft_ages` table which was **DROPPED** during schema v2 migration.

### When It Appears
- When accessing `/api/analysis/ages` endpoint
- API returns 500 Internal Server Error
- Console shows PostgreSQL error about missing relation

### Files Affected
- `app/api/analysis/ages/route.ts:28` - Uses deleted `ft_ages` table in JOIN

---

## 🐛 Debug Session 1 - Investigation & Fix

**Date:** 2025-11-17
**Goal:** Replace ft_ages table references with ft_datapoints
**Debugger:** Claude Code

---

### Files Examined

1. **`app/api/analysis/ages/route.ts`** (lines 1-57)
   - **Finding:** Line 28 queries deleted `ft_ages` table
   - **Query:** `JOIN ft_ages fa ON s.sample_id = fa.sample_id`
   - **Columns used:** central_age_ma, central_age_error_ma, pooled_age_ma, pooled_age_error_ma, dispersion_pct, p_chi2, n_grains
   - **Hypothesis:** Need to replace `ft_ages` with `ft_datapoints` and update column references

2. **`scripts/db/schema-earthbank-v2.sql`** (ft_datapoints table)
   - **Finding:** ft_datapoints table has all required columns
   - **Column mapping:**
     - `central_age_ma` → EXISTS in ft_datapoints
     - `central_age_error_ma` → EXISTS in ft_datapoints
     - `pooled_age_ma` → EXISTS in ft_datapoints
     - `pooled_age_error_ma` → EXISTS in ft_datapoints
     - `dispersion_pct` → EXISTS in ft_datapoints
     - `p_chi2` → Column is `P_chi2_pct` in ft_datapoints (different name!)
     - `n_grains` → EXISTS in ft_datapoints

### Schema Comparison

**Old schema (v1) - ft_ages table:**
- Columns: sample_id, central_age_ma, central_age_error_ma, pooled_age_ma, pooled_age_error_ma, dispersion_pct, p_chi2, n_grains
- Relationship: 1 sample → 1 ft_ages record

**New schema (v2) - ft_datapoints table:**
- Columns: sample_id, central_age_ma, central_age_error_ma, pooled_age_ma, pooled_age_error_ma, dispersion_pct, P_chi2_pct, n_grains
- Relationship: 1 sample → many ft_datapoints (multiple analytical sessions)
- **KEY DIFFERENCE:** P_chi2_pct (capital P) vs p_chi2 (lowercase p)

### Critical Issue Found

**Multiple Datapoints Per Sample:**
The new schema supports multiple analyses of the same sample. The API endpoint needs to decide:
1. Return ALL datapoints (multiple rows per sample)
2. Return LATEST datapoint per sample
3. Return AVERAGE across datapoints
4. Return PREFERRED datapoint (some selection criteria)

**Current code assumption:** 1 sample = 1 age → This is now INVALID

---

### Fix Strategy

**Option 1: Return ALL datapoints** ✅ RECOMMENDED
- Most complete data
- Users can filter/aggregate as needed
- Aligns with schema v2 architecture
- Add datapoint_id to SELECT

**Option 2: Return latest datapoint per sample**
- Requires window function or subquery
- More complex query
- Hides data variability

**Decision:** Use Option 1 - return all datapoints

---

## Session 1 - Implementation

**Date:** 2025-11-17
**Goal:** Update query to use ft_datapoints table

### Changes Made

#### Change #1: Replace ft_ages with ft_datapoints

**File:** `app/api/analysis/ages/route.ts`
**Lines:** 14-40
**Type:** Fix - Update table name and column names

**Before:**
```typescript
let sql = `
  SELECT
    s.sample_id,
    s.latitude,
    s.longitude,
    s.elevation_m,
    fa.central_age_ma,
    fa.central_age_error_ma,
    fa.pooled_age_ma,
    fa.pooled_age_error_ma,
    fa.dispersion_pct,
    fa.p_chi2,
    fa.n_grains
  FROM samples s
  JOIN ft_ages fa ON s.sample_id = fa.sample_id
  WHERE fa.central_age_ma IS NOT NULL
`;
```

**After:**
```typescript
let sql = `
  SELECT
    s.sample_id,
    fd.id as datapoint_id,
    fd.datapoint_key,
    s.latitude,
    s.longitude,
    s.elevation_m,
    fd.central_age_ma,
    fd.central_age_error_ma,
    fd.pooled_age_ma,
    fd.pooled_age_error_ma,
    fd.dispersion_pct,
    fd.P_chi2_pct as p_chi2,
    fd.n_grains,
    fd.laboratory,
    fd.analysis_date
  FROM samples s
  JOIN ft_datapoints fd ON s.sample_id = fd.sample_id
  WHERE fd.central_age_ma IS NOT NULL
`;
```

**Reason:**
1. Replace `ft_ages` → `ft_datapoints` (table was dropped in schema v2)
2. Update alias `fa` → `fd` for clarity
3. Fix column name: `p_chi2` → `P_chi2_pct` (schema v2 naming)
4. Add `datapoint_id` and `datapoint_key` to identify specific analyses
5. Add `laboratory` and `analysis_date` for context (which analysis is this?)
6. Alias `P_chi2_pct as p_chi2` for API backward compatibility

**Key Changes:**
- Table: `ft_ages` → `ft_datapoints` ✅
- Alias: `fa` → `fd` ✅
- Column: `fa.p_chi2` → `fd.P_chi2_pct as p_chi2` ✅
- Added columns: `datapoint_id`, `datapoint_key`, `laboratory`, `analysis_date` ✅

---

### Manual Tests Performed

**Test #1: Verify API returns data** ✅ PASSED
- **URL:** `http://localhost:3000/api/analysis/ages`
- **Expected:**
  - HTTP 200 status
  - JSON response with `success: true`
  - Array of age data with sample locations
- **Actual:**
  ```json
  {"success":true,"data":[],"count":0}
  ```
- **Result:** ✅ PASS - API returns 200, no PostgreSQL error, empty array (no data in DB yet)

**Test #2: TypeScript Compilation** ✅ PASSED
- **Command:** `npx tsc --noEmit`
- **Expected:** No TypeScript errors
- **Actual:** No errors found in analysis/ages route
- **Result:** ✅ PASS - Clean TypeScript compilation

**Test #3: Dev Server Compilation** ✅ PASSED
- **Command:** `npm run dev`
- **Expected:** Successful compilation, no runtime errors
- **Actual:**
  ```
  GET /api/analysis/ages 200 in 3.1s (compile: 731ms, render: 2.4s)
  ```
- **Result:** ✅ PASS - Clean Next.js compilation and runtime execution

**Test #4: Check for other ft_ages references** ✅ PASSED
- **Search:** Grepped entire codebase for SQL queries using `ft_ages`
- **Expected:** No SQL queries using deleted table
- **Actual:**
  - Found `app/samples/[id]/page.tsx` - Uses `ft_ages` as variable name (ERROR-010, already tracked)
  - Found `app/api/tables/[name]/route.ts` - Only comment mentioning old table name
  - No other SQL queries found
- **Result:** ✅ PASS - No other broken queries found

---

## Session Status

**Current Status:** ✅ RESOLVED

**Code Changes:**
- ✅ Updated query to use `ft_datapoints` table
- ✅ Fixed column name (`P_chi2_pct` → aliased as `p_chi2`)
- ✅ Added new columns for datapoint context (datapoint_id, datapoint_key, laboratory, analysis_date)
- ✅ Updated ORDER BY clause to use new alias
- ✅ All tests passed

**Verification:**
- ✅ API endpoint returns HTTP 200 (not 500)
- ✅ TypeScript compilation clean
- ✅ Next.js dev server compiles and runs successfully
- ✅ No other broken SQL queries found in codebase

**Next Steps:**
1. Update live-errors.md to mark ERROR-011 as resolved
2. Test with real data once database is populated

---

## Final Summary

### The Root Cause
The `/api/analysis/ages` endpoint was querying the `ft_ages` table which was **dropped during schema v2 migration**. Schema v2 replaced the old 1:1 architecture (1 sample → 1 ft_ages record) with a datapoint-based architecture (1 sample → many ft_datapoints records).

### The Solution
Updated the SQL query to use the new `ft_datapoints` table:
1. Changed table: `ft_ages` → `ft_datapoints`
2. Changed alias: `fa` → `fd`
3. Fixed column name: `p_chi2` → `P_chi2_pct as p_chi2`
4. Added context columns: `datapoint_id`, `datapoint_key`, `laboratory`, `analysis_date`
5. Updated ORDER BY clause

### Changes Made (Net)

**Files Created:**
- None

**Files Modified:**
1. `app/api/analysis/ages/route.ts` - Updated SQL query to use ft_datapoints table

**Files Deleted:**
- None

**Lines of Code:**
- Modified: 2 locations (SELECT statement and ORDER BY)
- Added columns: 4 new fields in SELECT
- Net change: +4 data fields returned by API

### Dead Code Review

**Experimental code removed:**
- None (direct fix, no experimentation needed)

**Kept for good reason:**
- All changes are production-ready

### Production Impact
- ✅ API endpoint now works (200 instead of 500 error)
- ✅ No PostgreSQL errors about missing relations
- ✅ Backward compatible API response (p_chi2 alias maintained)
- ✅ Enhanced data (adds datapoint_id, laboratory, analysis_date)
- ✅ Supports schema v2 multi-datapoint architecture

---

**FINAL STATUS:** ✅ RESOLVED

**Issue:** Analysis API uses deleted ft_ages table
**Root Cause:** Schema v2 migration dropped ft_ages table, replaced with ft_datapoints
**Solution:** Updated SQL query to use ft_datapoints with correct column names
**Result:** API endpoint now returns 200 with correct data structure

---

**Last Updated:** 2025-11-17 01:40 UTC
**All Sessions Complete:** Session 1 (Investigation & Fix)
**Code Status:** Clean, production-ready
**Issue Status:** RESOLVED

---

## 🎉 FIXED

**Date Fixed:** 2025-11-17
**Solution Applied:** Fixed API route with schema v2 migration
**Status:** ✅ Resolved and archived

**Archived to:** readme/historic-errors/historic-errors.md
**Timestamp:** 2025-11-17 12:46:24

---
