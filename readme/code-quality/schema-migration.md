# Schema Migration - Code Quality Issues

**Last Check:** 2025-11-17
**Found by:** `/bigtidycheck`
**Context:** Schema v1 → Schema v2 (EarthBank FAIR migration)

---

## 🔴 Critical Issues

### 1. **Schema Mismatch: Analysis API uses deleted ft_ages table** → **ERROR-011**
- **File:** `app/api/analysis/ages/route.ts:28`
- **Status:** 🔴 Open → Logged
- **Severity:** CRITICAL - API BROKEN

**Issue:**
SQL query directly references `ft_ages` table:
```typescript
// Line 28
JOIN ft_ages fa ON s.sample_id = fa.sample_id
```

**Problem:**
- `ft_ages` table was DROPPED during schema v2 migration
- API endpoint will throw PostgreSQL error: `relation "ft_ages" does not exist`
- All analysis endpoints are BROKEN

**Impact:**
- `/api/analysis/ages` endpoint returns 500 error
- Analysis page cannot load age data
- Application partially broken

**Suggested Fix:**
Update query to use schema v2 tables:
```typescript
// Replace ft_ages with ft_datapoints
JOIN ft_datapoints fd ON s.sample_id = fd.sample_id

// Update column references:
// - fa.central_age_ma → fd.central_age_ma
// - fa.pooled_age_ma → fd.pooled_age_ma
// - fa.n_grains → fd.n_grains
```

**Migration Steps:**
1. Read `app/api/analysis/ages/route.ts`
2. Replace all `ft_ages` references with `ft_datapoints`
3. Update column aliases (`fa` → `fd`)
4. Test endpoint: `curl http://localhost:3000/api/analysis/ages`
5. Verify response structure matches expected format

**Debug Log:** `build-data/errors/debug/ER-011-schema-mismatch-analysis-api-uses-deleted-ft-ages-table.md`
**Track:** Use `/debug-mode` to fix, `/resolve ERROR-011` when done

---

### 2. **Schema Migration Incomplete: Sample detail page uses backward compat** → **ERROR-010**
- **File:** `app/samples/[id]/page.tsx`
- **Status:** ⚠️ Works but needs migration
- **Severity:** HIGH - Technical debt

**Issue:**
Page uses `getSampleDetailV1()` backward compatibility function:
```typescript
// Line 2
import { getSampleDetailV1 } from '@/lib/db/queries';

// Line 16
const sampleDetail = await getSampleDetailV1(params.id);

// Line 22 - Destructures old schema structure
const { sample, ft_ages, ft_track_lengths, ft_counts, ahe_grains } = sampleDetail;
```

**Problem:**
- Uses old schema v1 response format (single ft_ages record)
- Should use new schema v2 format (arrays of datapoints)
- Backward compat functions will be removed eventually
- Missing out on schema v2 features (multiple analyses per sample)

**Impact:**
- ⚠️ Currently WORKS (backward compat functions exist)
- Cannot display multiple datapoints per sample
- Technical debt - should be migrated to schema v2
- Will break when backward compat functions are removed

**Suggested Fix:**
Rewrite page to use schema v2:
```typescript
// Use getSampleDetail() instead
import { getSampleDetail } from '@/lib/db/queries';

const sampleDetail = await getSampleDetail(params.id);

// Destructure datapoint arrays
const { sample, ft_datapoints, he_datapoints, ft_count_data, he_whole_grain_data } = sampleDetail;

// Update UI to loop through ft_datapoints array
{ft_datapoints.map((datapoint, idx) => (
  <div key={datapoint.id}>
    <h3>Analysis #{idx + 1} - {datapoint.laboratory}</h3>
    <p>Central Age: {datapoint.central_age_ma} ± {datapoint.central_age_error_ma} Ma</p>
    ...
  </div>
))}
```

**Migration Steps:**
1. Read current page implementation
2. Change import to `getSampleDetail`
3. Update destructuring for datapoint arrays
4. Rewrite UI sections to loop through datapoints
5. Add "multiple analyses" support (show all datapoints)
6. Test with sample that has multiple datapoints
7. Remove TODO comment about migration

**Debug Log:** `build-data/errors/debug/ER-010-schema-migration-incomplete-sample-detail-page-uses-backward-compat.md`
**Track:** Use `/debug-mode` to fix, `/resolve ERROR-010` when done

---

## 🟡 Medium Issues

### 3. **Dead Code: 60+ unused exports (many are schema v2 functions)**
- **Status:** 🟡 Tracked - Expected during migration
- **Severity:** MEDIUM - Code bloat

**Issue:**
ts-prune reports 60+ unused exports, including:
- Many new schema v2 query functions (`getFTDatapointsBySample`, `getHeDatapointsBySample`, etc.)
- Many new schema v2 types (`FTDatapoint`, `HeDatapoint`, `Batch`, `Person`, etc.)
- Some utility functions (`transaction`, `testConnection`)

**Examples:**
```
lib/db/queries.ts:211 - getFTDatapointsBySample (not yet used)
lib/db/queries.ts:333 - getHeDatapointsBySample (not yet used)
lib/db/queries.ts:430 - getAllBatches (not yet used)
lib/db/queries.ts:458 - getAllPeople (not yet used)
lib/types/thermo-data.ts:155 - SamplePersonRole (not yet used)
lib/types/thermo-data.ts:201 - Mount (not yet used)
```

**Problem:**
- Most of these are INTENTIONALLY exported for schema v2 migration
- Will be used once all pages are migrated from v1 to v2
- Some may be truly dead code (legacy functions)

**Impact:**
- Code bloat (larger bundle size)
- Confusion about what's actually used
- But EXPECTED during schema migration

**Suggested Fix:**
1. **Keep schema v2 functions** - They'll be used during migration
2. **Review utility functions:**
   - `transaction` - Keep (needed for complex operations)
   - `testConnection` - Keep (useful for debugging)
   - `closePool` - Keep (needed for graceful shutdown)
3. **Delete truly dead code:**
   - Any old schema v1 functions not marked @deprecated
   - Any experimental code from old features

**Action:** No immediate action - revisit after schema v2 migration complete

---

**To resolve an issue:**
1. Fix the code
2. Run `/bigtidycheck` again to verify
3. Update status to ✅ Fixed
4. If logged as ERROR-XXX, run `/resolve ERROR-XXX`
