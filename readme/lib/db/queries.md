# lib/db/queries.ts

**Path:** `lib/db/queries.ts`
**Type:** Database Query Layer
**Last Analyzed:** 2025-11-11
**File Size:** 773 lines
**Functions:** 28 query functions

---

## What It Does

**Central database query module** containing all prepared SQL queries for the application. Provides a clean API for database access with:
- Type-safe query functions
- Parameterized SQL (SQL injection prevention)
- Complex joins and aggregations
- Educational context queries
- Risk assessment queries
- Data confidence calculations
- Performance comparison queries

**Architecture:** This is the **single source of truth** for database queries. No SQL should be written outside this file (except in scripts/).

---

## Database Interactions

### Tables Accessed (Read Operations)

| Table | Operations | Functions Using It |
|-------|-----------|-------------------|
| **test_configurations** | SELECT, COUNT, JOIN | getAllConfigs, getConfigById, getConfigsByMarkerId, getConfigsByManufacturerId, getPoorPerformers, getQualityDistribution, getCVDistribution, getOverallStats, compareConfigs, getHighRiskPathogenConfigs, getConfigsWithConfidence, getConfidenceStatistics, compareConfigsWithContext |
| **cv_measurements** | SELECT, AVG, JOIN | getAllConfigs (via view), getConfigById (via view), getPoorPerformers, getOverallStats, getConfigsWithConfidence, getConfidenceStatistics |
| **markers** | SELECT, JOIN | getAllMarkers, getMarkersByCategory, getMarkerById, searchMarkers, getMarkerWithContext |
| **manufacturers** | SELECT, JOIN | getAllManufacturers (via view), getManufacturerById (via view), getManufacturerByName, getAssayWithTechSpecs |
| **assays** | SELECT, JOIN | getAllAssays, getAssaysByManufacturerId, getAssayById, getAssayWithTechSpecs |
| **categories** | SELECT, JOIN | getMarkersByCategory, getMarkerWithContext |
| **pathogens** | SELECT, JOIN | getMarkerWithContext |
| **qc_samples** | SELECT, JOIN | getAssayWithTechSpecs |

### Views Accessed

| View | Purpose | Used By |
|------|---------|---------|
| **vw_test_config_details** | Denormalized config details | getAllConfigs, getConfigById, getConfigsByMarkerId, getConfigsByManufacturerId, getPoorPerformers, compareConfigs, getConfigWithRiskAssessment, getHighRiskPathogenConfigs, getConfigsWithConfidence, compareConfigsWithContext |
| **vw_manufacturer_performance** | Aggregated manufacturer stats | getAllManufacturers, getManufacturerById |

**Why Views?** Pre-joined views improve performance by avoiding complex JOIN queries every time. Views are maintained by the database.

---

## Function Catalog

### Test Configurations (7 functions)

**`getAllConfigs(filters?, limit, offset): Promise<{data, total}>`**
- Get paginated list of test configurations
- **Filters:** markerId, manufacturerId, assayId, qualityRating, testType, minCVLt10Pct, maxCVGt20Pct
- **Tables:** vw_test_config_details
- **Used by:** app/api/configs/route.ts, app/(dashboard)/assays/page.tsx

**`getConfigById(configId): Promise<TestConfigDetails | null>`**
- Get single configuration with full details
- **Tables:** vw_test_config_details
- **Used by:** app/api/configs/[id]/route.ts, app/(dashboard)/compare/page.tsx

**`getConfigsByMarkerId(markerId): Promise<TestConfigDetails[]>`**
- Get all configs testing a specific marker
- **Tables:** vw_test_config_details
- **Used by:** app/api/markers/[id]/route.ts, app/(dashboard)/markers/[id]/page.tsx

**`getConfigsByManufacturerId(manufacturerId): Promise<TestConfigDetails[]>`**
- Get all configs using a manufacturer's assays
- **Tables:** vw_test_config_details
- **Used by:** app/api/manufacturers/[id]/route.ts, app/(dashboard)/manufacturers/[id]/page.tsx

**`getPoorPerformers(threshold): Promise<TestConfigDetails[]>`**
- Get poorly performing configurations (CV >20% or quality = 'poor')
- **Tables:** vw_test_config_details
- **Used by:** app/(dashboard)/dashboard/page.tsx, components/dashboard/QualityAlerts.tsx

**`compareConfigs(configIds): Promise<TestConfigDetails[]>`**
- Compare multiple configurations side-by-side
- **Tables:** vw_test_config_details
- **Used by:** app/(dashboard)/compare/page.tsx

**`compareConfigsWithContext(configIds): Promise<TestConfigDetails[]>`**
- Compare configs with methodology warnings and notes
- **Tables:** vw_test_config_details
- **Used by:** Advanced comparison features

---

### Manufacturers (3 functions)

**`getAllManufacturers(): Promise<ManufacturerPerformance[]>`**
- Get all manufacturers with performance stats
- **Tables:** vw_manufacturer_performance (aggregates test_configurations, assays, cv_measurements)
- **Used by:** app/api/manufacturers/route.ts, app/(dashboard)/manufacturers/page.tsx, components/filters/FilterPanel.tsx

**`getManufacturerById(manufacturerId): Promise<ManufacturerPerformance | null>`**
- Get single manufacturer with performance data
- **Tables:** vw_manufacturer_performance
- **Used by:** app/api/manufacturers/[id]/route.ts, app/(dashboard)/manufacturers/[id]/page.tsx

**`getManufacturerByName(name): Promise<Manufacturer | null>`**
- Simple name lookup (no performance data)
- **Tables:** manufacturers
- **Used by:** Import scripts, search functionality

---

### Markers (4 functions)

**`getAllMarkers(): Promise<Marker[]>`**
- Get all markers ordered by name
- **Tables:** markers
- **Used by:** app/api/markers/route.ts, app/(dashboard)/markers/page.tsx, components/filters/FilterPanel.tsx

**`getMarkersByCategory(): Promise<Array<{category, markers[]}>>`**
- Group markers by disease category (uses JSON aggregation)
- **Tables:** categories, markers (JOIN)
- **Used by:** Category-based filtering and display

**`getMarkerById(markerId): Promise<Marker | null>`**
- Get single marker
- **Tables:** markers
- **Used by:** app/api/markers/[id]/route.ts

**`searchMarkers(searchTerm): Promise<Marker[]>`**
- Full-text search on marker names (case-insensitive)
- **Tables:** markers
- **Used by:** app/api/search/route.ts, components/search/SearchBar.tsx

---

### Assays (3 functions)

**`getAllAssays(): Promise<Assay[]>`**
- Get all assays ordered by name
- **Tables:** assays
- **Used by:** Assay listing, filtering

**`getAssaysByManufacturerId(manufacturerId): Promise<Assay[]>`**
- Get all assays from a manufacturer
- **Tables:** assays
- **Used by:** app/(dashboard)/manufacturers/[id]/page.tsx

**`getAssayById(assayId): Promise<Assay | null>`**
- Get single assay
- **Tables:** assays
- **Used by:** Assay detail views

---

### Analytics & Statistics (4 functions)

**`getQualityDistribution(): Promise<{quality_rating, count, percentage}[]>`**
- Get quality rating distribution with percentages
- **Tables:** test_configurations
- **Used by:** Dashboard charts, analytics

**`getCVDistribution(): Promise<{excellent, good, acceptable, poor}>`**
- Get count of configs in each quality tier
- **Tables:** test_configurations
- **Used by:** Dashboard metrics

**`getOverallStats(): Promise<{totalConfigs, totalMarkers, ...}>`**
- Get aggregate statistics across all tables
- **Tables:** test_configurations, markers, manufacturers, assays, cv_measurements
- **Used by:** app/api/analytics/dashboard-stats/route.ts, app/(dashboard)/dashboard/page.tsx

**`getConfidenceStatistics(): Promise<{high_confidence, medium_confidence, ...}>`**
- Get distribution of data confidence levels
- **Tables:** test_configurations
- **Used by:** Data quality reporting

---

### Educational Context (2 functions)

**`getMarkerWithContext(markerId): Promise<{...marker, pathogen_name, category, ...}>`**
- Get marker with full educational context (pathogen, category, clinical info)
- **Tables:** markers, pathogens, categories (3-way JOIN)
- **Used by:** components/education/MarkerInfoPanel.tsx, educational tooltips

**`getAssayWithTechSpecs(assayId): Promise<{...assay, manufacturer, qc_samples[]}>`**
- Get assay with technical specifications and QC samples
- **Tables:** assays, manufacturers, test_configurations, qc_samples (4-way JOIN with JSON aggregation)
- **Used by:** Technical comparison views, methodology tooltips

---

### Risk Assessment (2 functions)

**`getConfigWithRiskAssessment(configId): Promise<TestConfigDetails & {risk_tier, clinical_suitability}>`**
- Calculate risk tier based on pathogen (high-risk: HIV, HBV, HCV)
- Add clinical suitability recommendations
- **Tables:** vw_test_config_details (with CASE statements)
- **Used by:** Clinical decision support, regulatory compliance views

**`getHighRiskPathogenConfigs(): Promise<TestConfigDetails[]>`**
- Filter configs for HIV, Hepatitis B, Hepatitis C only
- **Tables:** vw_test_config_details
- **Used by:** High-stakes screening dashboards

---

### Data Confidence (2 functions)

**`getConfigsWithConfidence(filters, limit, offset): Promise<TestConfigDetails & {confidence_level, confidence_label}[]>`**
- Add confidence classification based on events_examined
- **Levels:** high (≥50 events), medium (30-49), limited (15-29), insufficient (<15)
- **Tables:** vw_test_config_details
- **Used by:** Data quality views, scientific reporting

**`getConfidenceStatistics(): Promise<{high_confidence, medium_confidence, ...}>`**
- Aggregate confidence distribution
- **Tables:** test_configurations
- **Used by:** Data quality dashboard

---

## Dependencies

**Internal:**
- `./connection` - query, queryOne functions
- `@/lib/types/qc-data` - TypeScript interfaces (TestConfigDetails, Marker, etc.)

**External:**
- None (uses built-in node-postgres via connection module)

---

## Used By

### API Routes (Primary Consumers)
- **app/api/configs/route.ts** - getAllConfigs, filters
- **app/api/configs/[id]/route.ts** - getConfigById
- **app/api/manufacturers/route.ts** - getAllManufacturers
- **app/api/manufacturers/[id]/route.ts** - getManufacturerById, getConfigsByManufacturerId
- **app/api/markers/route.ts** - getAllMarkers
- **app/api/markers/[id]/route.ts** - getMarkerById, getConfigsByMarkerId
- **app/api/analytics/route.ts** - getQualityDistribution, getCVDistribution
- **app/api/analytics/dashboard-stats/route.ts** - getOverallStats

### Server Components (Direct Database Access)
- **app/(dashboard)/dashboard/page.tsx** - getDashboardStats (uses getOverallStats, getPoorPerformers)
- **app/(dashboard)/assays/page.tsx** - getConfigs (uses getAllConfigs)
- **app/(dashboard)/manufacturers/page.tsx** - getManufacturers (uses getAllManufacturers)
- **app/(dashboard)/manufacturers/[id]/page.tsx** - getManufacturerDetail (uses getManufacturerById, getAssaysByManufacturerId)
- **app/(dashboard)/markers/page.tsx** - getMarkers (uses getAllMarkers)
- **app/(dashboard)/markers/[id]/page.tsx** - getMarkerDetail (uses getMarkerById, getConfigsByMarkerId)

---

## Query Patterns & Best Practices

### Parameterized Queries (SQL Injection Prevention)
```typescript
// ✅ GOOD - Parameterized
const sql = 'SELECT * FROM markers WHERE id = $1';
await query(sql, [markerId]);

// ❌ BAD - Concatenation (SQL injection risk)
const sql = `SELECT * FROM markers WHERE id = ${markerId}`;
await query(sql);
```

### Using Views for Performance
```typescript
// ✅ GOOD - Use pre-joined view
SELECT * FROM vw_test_config_details WHERE config_id = $1

// ❌ SLOWER - Manual JOINs every time
SELECT tc.*, m.name as marker_name, a.name as assay_name, ...
FROM test_configurations tc
JOIN markers m ON tc.marker_id = m.id
JOIN assays a ON tc.assay_id = a.id
...
```

**Why?** Views are optimized by PostgreSQL query planner and cached.

### Dynamic Filter Building
```typescript
let sql = 'SELECT * FROM table WHERE 1=1';
const params: any[] = [];
let paramCount = 1;

if (filters?.markerId) {
  sql += ` AND marker_id = $${paramCount++}`;
  params.push(filters.markerId);
}

await query(sql, params);
```

**Why?** Builds SQL dynamically while keeping params separate (safe).

### Type Safety
```typescript
const markers = await query<Marker>(sql, params);
// markers is Marker[] - TypeScript knows the shape
```

**Benefits:** Compile-time type checking, autocomplete, refactoring safety.

---

## Performance Considerations

### Pagination
```typescript
getAllConfigs(filters, limit=50, offset=0)
```

**Always paginate** large result sets. Don't fetch all configs at once (could be 500+ rows).

### Index Usage
These queries rely on database indexes:
- `config_id` (primary key)
- `marker_id`, `assay_id`, `manufacturer_id` (foreign keys)
- `quality_rating` (for filtering)
- `cv_lt_10_percentage` (for sorting)

**Note:** If queries are slow, run `EXPLAIN ANALYZE` to check index usage.

### View Performance
Views like `vw_test_config_details` pre-compute JOINs:
- **First call:** Slower (materializes view)
- **Subsequent calls:** Fast (cached by PostgreSQL)

### Aggregation Caching
Functions like `getOverallStats()` count across multiple tables. Consider caching results for 5-10 minutes in production (not implemented yet).

---

## Educational & UX Features

### Risk-Based Quality
```typescript
getConfigWithRiskAssessment(configId)
```

Adds `risk_tier` (high/medium/low) based on pathogen:
- **High Risk:** HIV, HBV, HCV (blood-borne pathogens)
- **Medium Risk:** CMV, Toxoplasma, Rubella (TORCH panel)
- **Low Risk:** Others

**Use Case:** Help labs prioritize quality for high-stakes tests.

### Data Confidence
```typescript
getConfigsWithConfidence(filters)
```

Adds `confidence_level` based on sample size:
- **High:** ≥50 events (statistically robust)
- **Medium:** 30-49 events (adequate)
- **Limited:** 15-29 events (minimum acceptable)
- **Insufficient:** <15 events (caution needed)

**Use Case:** Flag low-confidence data for scientific audiences.

### Comparison Warnings
```typescript
compareConfigsWithContext(configIds)
```

Adds `methodology_warning` when comparing assays with different methodologies:
> "Different methodologies used - CV% is valid comparison, absolute values are not"

**Why Important:** Users might try to compare absolute test results (e.g., 100 U/mL vs 500 U/mL) across manufacturers, which is invalid due to different calibration standards. CV% (reproducibility) is the ONLY valid cross-manufacturer comparison.

---

## Future Enhancements

### Caching Layer
Consider adding Redis/memory cache for:
- `getAllManufacturers()` (rarely changes)
- `getAllMarkers()` (rarely changes)
- `getOverallStats()` (expensive aggregation)

### Search Optimization
Current `searchMarkers()` uses ILIKE (slow for large datasets). Consider:
- Full-text search (tsvector/tsquery)
- Elasticsearch integration
- Pre-computed search index

### Query Result Pagination Metadata
Add to responses:
```typescript
{
  data: [...],
  total: 500,
  page: 1,
  pageSize: 50,
  totalPages: 10
}
```

---

## Troubleshooting

### "Invalid parameterized query"
**Cause:** Mismatch between `$1, $2` placeholders and params array.

**Fix:** Ensure `paramCount` matches number of items in `params` array.

### "Slow query performance"
**Cause:** Missing indexes or inefficient JOIN.

**Fix:**
1. Run `EXPLAIN ANALYZE` on the SQL
2. Check if indexes exist on filter/sort columns
3. Consider using views instead of manual JOINs

### "Type error in query result"
**Cause:** Database returns different shape than TypeScript type.

**Fix:** Check that type definition matches actual table schema.

---

## Related Files

- **[lib/db/connection.md](connection.md)** - Connection pool used by all queries
- **[lib/types/qc-data.ts](../types/qc-data.md)** - TypeScript interfaces
- **Database Tables** - See [readme/database/](../../database/) for schema docs
- **API Routes** - See [app/api/](../../app/api/) for usage examples

---

**Generated:** 2025-11-11
**Last Verified:** 2025-11-11
**Total Functions:** 28
**Total Database Tables Accessed:** 8 tables + 2 views
