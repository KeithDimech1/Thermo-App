# Schema Usage Analysis - Old vs New (EarthBank)

**Generated:** 2025-11-18 (by /bigtidy)
**Context:** IDEA-014 schema migration in progress (snake_case → camelCase EarthBank)

---

## Executive Summary

🚨 **Migration Status: INCOMPLETE** - Code is split between old and new schemas

- **Old Schema Files:** 12 files still use deprecated `ft_ages`, `ft_datapoints`, `he_datapoints`
- **New Schema Files:** 12 files use new `earthbank_*` tables (camelCase)
- **Critical Issue:** `lib/db/queries.ts` (main query layer) uses **100% old schema** (11+ queries)

---

## Schema Comparison

### Old Schema (Deprecated)
```sql
-- Snake_case table names
ft_datapoints
he_datapoints
ft_count_data
ft_single_grain_ages
ft_track_length_data
samples (old structure)
```

### New Schema (EarthBank FAIR)
```sql
-- CamelCase table names (exact EarthBank match)
earthbank_ftDatapoints
earthbank_heDatapoints
earthbank_ftCountData
earthbank_ftSingleGrain
earthbank_ftLengthData
earthbank_samples (new structure with IGSN)
```

---

## Files Using OLD Schema (12 files)

### 🔴 Critical - Main Query Layer
**lib/db/queries.ts** (11 SQL queries using old schema)
- Lines 179, 180, 182: `ft_datapoints`, `he_datapoints`, `ft_count_data`
- Lines 215, 225, 235: `ft_datapoints` queries
- Lines 337, 347: `he_datapoints` queries
- Lines 669, 711, 748: `ft_datapoints` queries
- **Impact:** ALL API routes that import from `lib/db/queries.ts` use old schema

### 🔴 Critical - API Routes
**app/api/datasets/[id]/table-counts/route.ts**
- Lines 26, 31, 56: Counts from `ft_datapoints`, `ft_count_data`, `he_datapoints`
- **Impact:** Dataset statistics page shows old data

### 🟡 Migration Scripts (Expected)
**scripts/db/migrate-v1-to-v2.ts**
- Lines 274, 276, 292, 326: Migration queries (reads old, writes new)
- **Status:** This is correct - migration script needs both

**scripts/db/transform-and-import-malawi.ts**
- Lines 329, 331: Count queries on old schema
- **Status:** Legacy import script, may need updating

### 🟡 Other Old Schema References
- scripts/db/import-thermo-data.ts
- scripts/db/check-neon-data.ts
- scripts/pdf/extraction_engine.py
- scripts/pdf/extract_malawi_rift.py
- scripts/pdf/fair_transformer.py
- scripts/db/validate-import.py
- scripts/db/import-malawi-2024.py
- scripts/query-mcmillan-data.js

---

## Files Using NEW Schema (12 files)

### ✅ Modern - API Routes
**app/api/tables/[name]/route.ts**
- Lines 122, 127-128, 134-135: Uses `earthbank_samples`, `earthbank_ftDatapoints`, `earthbank_heDatapoints`
- **Status:** ✅ Fully migrated to new schema

### ✅ Modern - Pages
**app/datasets/page.tsx**
- Line 28: `FROM earthbank_samples`
- **Status:** ✅ Fully migrated

**app/datasets/[id]/page.tsx**
- Line 45: `FROM earthbank_samples`
- **Status:** ✅ Fully migrated

### ✅ Modern - Query Layer (New)
**lib/db/earthbank-queries.ts**
- **Status:** ✅ New query file for EarthBank schema
- **Problem:** Not yet used by most of the app

### 🟢 Other New Schema Files
- app/samples/page.tsx
- app/samples/[id]/page.tsx
- lib/types/earthbank-types.ts
- scripts/db/import-earthbank-templates.ts
- scripts/db/clean-he-csv-data-v2.ts
- scripts/db/transform-fair-csv-headers.ts
- scripts/import_earthbank_templates.py
- scripts/transform_peak_2021_earthbank.py

---

## Migration Roadmap

### Phase 1: Core Query Layer ⚠️ CRITICAL
**File:** `lib/db/queries.ts`

**Required Changes:**
1. Replace all `ft_datapoints` → `earthbank_ftDatapoints`
2. Replace all `he_datapoints` → `earthbank_heDatapoints`
3. Replace all `ft_count_data` → `earthbank_ftCountData`
4. Update all column names from snake_case → camelCase
5. Add double-quotes around camelCase field names in SQL

**Example:**
```typescript
// OLD
SELECT * FROM ft_datapoints WHERE sample_id = $1

// NEW
SELECT * FROM earthbank_ftDatapoints WHERE "sampleID" = $1
```

**Impact:** This will fix ALL API routes that depend on `lib/db/queries.ts`

### Phase 2: API Routes
**Files to Update:**
- `app/api/datasets/[id]/table-counts/route.ts`
- `app/api/stats/route.ts`
- `app/api/analysis/ages/route.ts`

**Changes:** Update SQL queries to use `earthbank_*` tables

### Phase 3: Legacy Scripts
**Files to Review:**
- scripts/db/import-thermo-data.ts (use new import script instead?)
- scripts/db/check-neon-data.ts
- scripts/query-mcmillan-data.js

**Decision:** Update or deprecate?

### Phase 4: Python Scripts
**Files:**
- scripts/pdf/extraction_engine.py
- scripts/pdf/fair_transformer.py
- scripts/analysis/utils/data_loaders.py

**Changes:** Update table names in SQL strings

---

## Type Definitions Status

### Old Types (Still in Use)
**lib/types/thermo-data.ts**
- Used by `lib/db/queries.ts`
- Snake_case field names

### New Types (Ready)
**lib/types/earthbank-types.ts**
- CamelCase field names
- Matches EarthBank schema exactly
- **Problem:** Not yet used by main query layer

---

## Recommendations

### Immediate (High Priority)
1. ✅ **Create `lib/db/earthbank-queries.ts`** (already exists!)
2. ⚠️ **Migrate `lib/db/queries.ts` to use new schema** → ERROR-012
3. ⚠️ **Update `app/api/datasets/[id]/table-counts/route.ts`** → Use earthbank tables

### Short Term
4. Update or deprecate legacy import scripts
5. Update Python analysis scripts to use new schema
6. Add integration tests to prevent schema drift

### Long Term
7. Remove old schema tables once migration complete
8. Archive `lib/db/queries.ts` as reference
9. Rename `lib/db/earthbank-queries.ts` → `lib/db/queries.ts` (replace old)

---

## Breaking Changes Checklist

When migrating queries, remember:

- ✅ Table names: `ft_datapoints` → `earthbank_ftDatapoints`
- ✅ Field names: `sample_id` → `"sampleID"` (camelCase + quotes)
- ✅ Field names: `central_age_ma` → `"centralAgeMa"`
- ✅ Field names: `pooled_age_ma` → `"pooledAgeMa"`
- ✅ UUIDs: Old schema used integers for IDs, new uses UUIDs for samples
- ✅ Foreign keys: `sample_id` → `"sampleID"` (references UUID now)

---

## Next Steps

See: **ERROR-012** (Schema Migration Incomplete) for detailed fix plan

**Related Files:**
- build-data/ideas/debug/IDEA-014-migrate-to-earthbank-native-schema-camelcase-1-1-template-mapping.md
- readme/database/SCHEMA_CHANGES.md
