# App → Database Complete Mapping

**Generated:** 2025-11-11
**Purpose:** Comprehensive cross-reference of how every app file interacts with the database
**Source Files Analyzed:** 22 TypeScript/TSX files in `app/`

---

## 📊 Quick Summary

- **Total App Files:** 22
- **API Routes:** 10 files
- **Dashboard Pages:** 9 files
- **Layout/Root Files:** 3 files
- **Database Tables Accessed:** 8 tables
- **Database Views Used:** 2 views
- **Query Functions Used:** 28+ functions

---

## 🗄️ Database Tables Access Matrix

### Test Configurations (Primary Table)

**Table:** `test_configurations`

| App File | Access Type | Columns Used | Via Query Function |
|----------|-------------|--------------|-------------------|
| `app/api/configs/route.ts` | Read (Filtered) | All via view | `getAllConfigs()` |
| `app/api/configs/[id]/route.ts` | Read (Single) | All via view | `getConfigById()` |
| `app/api/dashboard-stats/route.ts` | Read (Aggregated) | `quality_rating`, `include_in_analysis` | Direct SQL |
| `app/(dashboard)/assays/page.tsx` | Display | All via API | Via `/api/configs` |
| `app/(dashboard)/configs/[id]/page.tsx` | Display (Detail) | All fields | Via `/api/configs/[id]` |
| `app/api/compare/route.ts` | Read (Multiple) | All via view | `compareConfigsWithContext()` |
| `app/(dashboard)/analytics/page.tsx` | Aggregated | `quality_rating`, `include_in_analysis` | `getQualityDistribution()`, `getOverallStats()` |

**Columns Used:**
- ✅ `id` - Primary key (used everywhere)
- ✅ `marker_id` - Foreign key (filtering, joins)
- ✅ `assay_id` - Foreign key (filtering, joins)
- ✅ `qc_sample_id` - Foreign key (joins for display)
- ✅ `test_type` - Filter and display
- ✅ `events_examined` - Display, confidence calculation
- ✅ `quality_rating` - Primary filter, aggregation, display
- ✅ `include_in_analysis` - Dataset filtering (curated vs all)
- ⚠️ `notes` - Schema column NOT displayed in UI (potential feature)
- ⚠️ `created_at`, `updated_at` - NOT displayed (timestamps available but unused)

---

### CV Measurements (Performance Data)

**Table:** `cv_measurements`

| App File | Access Type | Columns Used | Via Query Function |
|----------|-------------|--------------|-------------------|
| `app/api/configs/route.ts` | Read (Joined) | All CV columns | Via `vw_test_config_details` |
| `app/api/dashboard-stats/route.ts` | Read (Aggregated) | `cv_lt_10_percentage`, `cv_gt_20_percentage` | Direct SQL joins |
| `app/(dashboard)/markers/[id]/page.tsx` | Display | All CV columns | Via `/api/markers/[id]` |
| `app/(dashboard)/manufacturers/[id]/page.tsx` | Display | All CV columns | Via `/api/manufacturers/[id]` |
| `app/(dashboard)/configs/[id]/page.tsx` | Display (Detailed) | All CV columns, counts | Via `/api/configs/[id]` |
| `app/(dashboard)/compare/page.tsx` | Comparison | All CV columns | Via `/api/compare` |
| `app/(dashboard)/analytics/page.tsx` | Visualization | All CV columns | `getHeatmapData()`, `getCVDistributionByManufacturer()` |

**Columns Used:**
- ✅ `test_config_id` - Foreign key (all joins)
- ✅ `cv_lt_10_count` - Display, distribution bars
- ✅ `cv_lt_10_percentage` - **PRIMARY METRIC** (everywhere)
- ✅ `cv_10_15_count` - Display, distribution
- ✅ `cv_10_15_percentage` - Display, quality assessment
- ✅ `cv_15_20_count` - Display, distribution
- ✅ `cv_15_20_percentage` - Display, acceptable range
- ✅ `cv_gt_20_count` - Display, poor performance indicator
- ✅ `cv_gt_20_percentage` - Filter, poor performer detection
- ✅ `mean_cv` - Statistical display
- ⚠️ `median_cv` - Schema column NOT used in UI
- ⚠️ `std_dev_cv` - Schema column NOT used in UI
- ⚠️ `measurement_date` - NOT displayed (available but unused)

---

### Markers (Test Markers)

**Table:** `markers`

| App File | Access Type | Columns Used | Via Query Function |
|----------|-------------|--------------|-------------------|
| `app/api/markers/route.ts` | Read (All/Search) | All marker columns | `getAllMarkers()`, `searchMarkers()`, `getMarkersByCategory()` |
| `app/api/markers/[id]/route.ts` | Read (Single) | All marker columns | `getMarkerById()` |
| `app/api/search/route.ts` | Search | `name`, `antibody_type` + pathogen join | Direct SQL |
| `app/(dashboard)/markers/page.tsx` | Display (List) | `id`, `name`, `antibody_type`, `marker_type`, `category_id` | Via `/api/markers?grouped=true` |
| `app/(dashboard)/markers/[id]/page.tsx` | Display (Detail) | All marker fields | Via `/api/markers/[id]` |
| `app/(dashboard)/configs/[id]/page.tsx` | Display (Context) | `name`, `antibody_type`, `category_name`, `pathogen_name` | Via view join |

**Columns Used:**
- ✅ `id` - Primary key
- ✅ `name` - **PRIMARY DISPLAY** (everywhere)
- ✅ `pathogen_id` - Foreign key (joins for context)
- ✅ `category_id` - Foreign key (grouping, badges)
- ✅ `antibody_type` - Badge display (IgG, IgM, etc.)
- ✅ `marker_type` - Secondary display (Antibody/Antigen/NAT)
- ✅ `clinical_use` - Educational panel (detail page)
- ✅ `interpretation_positive` - Educational content
- ✅ `interpretation_negative` - Educational content
- ⚠️ `created_at` - NOT displayed

---

### Manufacturers (Test Kit Vendors)

**Table:** `manufacturers`

| App File | Access Type | Columns Used | Via Query Function |
|----------|-------------|--------------|-------------------|
| `app/api/manufacturers/route.ts` | Read (Aggregated) | All + performance calc | `getAllManufacturers()` |
| `app/api/manufacturers/[id]/route.ts` | Read (Single) | All manufacturer fields | `getManufacturerById()` |
| `app/api/search/route.ts` | Search | `id`, `name`, `country` | Direct SQL |
| `app/api/dashboard-stats/route.ts` | Aggregated | `name` + performance join | Direct SQL |
| `app/(dashboard)/manufacturers/page.tsx` | Display (List) | `id`, `name`, performance aggregates | Via `/api/manufacturers` |
| `app/(dashboard)/manufacturers/[id]/page.tsx` | Display (Detail) | All fields including `website`, `country` | Via `/api/manufacturers/[id]` |

**Columns Used:**
- ✅ `id` - Primary key
- ✅ `name` - **PRIMARY DISPLAY** (everywhere)
- ✅ `country` - Badge display (detail pages, search results)
- ✅ `website` - Link display (detail page only)
- ⚠️ `total_assays` - Schema column but calculated dynamically (not directly used)
- ⚠️ `created_at` - NOT displayed

**Calculated Fields (from joins):**
- ✅ `total_configs` - COUNT of test_configurations
- ✅ `avg_cv_lt_10_pct` - AVG(cv_lt_10_percentage)
- ✅ `excellent_count` - COUNT WHERE quality_rating = 'excellent'
- ✅ `good_count` - COUNT WHERE quality_rating = 'good'
- ✅ `acceptable_count` - COUNT WHERE quality_rating = 'acceptable'
- ✅ `poor_count` - COUNT WHERE quality_rating = 'poor'

---

### Assays (Test Platforms)

**Table:** `assays`

| App File | Access Type | Columns Used | Via Query Function |
|----------|-------------|--------------|-------------------|
| `app/api/manufacturers/[id]/route.ts` | Read (By Mfr) | All assay fields | `getAssaysByManufacturerId()` |
| `app/api/search/route.ts` | Search | `name`, `platform`, `methodology` + mfr join | Direct SQL |
| All config displays | Display (Joined) | `name`, `platform`, `methodology` | Via view joins |

**Columns Used:**
- ✅ `id` - Primary key
- ✅ `name` - **PRIMARY DISPLAY** (everywhere)
- ✅ `manufacturer_id` - Foreign key (all joins)
- ✅ `platform` - Secondary display (e.g., "ARCHITECT i2000SR")
- ✅ `methodology` - Badge/tooltip display (CMIA, ELISA, etc.)
- ⚠️ `automation_level` - Schema column NOT displayed in current UI
- ⚠️ `throughput` - Schema column NOT displayed
- ⚠️ `created_at` - NOT displayed

---

### QC Samples (Quality Control Materials)

**Table:** `qc_samples`

| App File | Access Type | Columns Used | Via Query Function |
|----------|-------------|--------------|-------------------|
| All config displays | Display (Joined) | `name` only | Via view joins |
| `app/(dashboard)/configs/[id]/page.tsx` | Display | `name` | Via view |

**Columns Used:**
- ✅ `id` - Primary key (joins only)
- ✅ `name` - Display in config detail
- ⚠️ `manufacturer` - Schema column NOT displayed
- ⚠️ `product_code` - Schema column NOT displayed
- ⚠️ `matrix_type` - Schema column NOT displayed
- ⚠️ `lot_number` - NOT displayed
- ⚠️ `expiration_date` - NOT displayed
- ⚠️ `target_markers` - NOT displayed
- ⚠️ `concentration_level` - NOT displayed
- ⚠️ `certifications` - NOT displayed

**💡 Opportunity:** QC Sample detail page could display all this rich metadata

---

### Pathogens (Infectious Organisms)

**Table:** `pathogens`

| App File | Access Type | Columns Used | Via Query Function |
|----------|-------------|--------------|-------------------|
| `app/api/search/route.ts` | Search (Joined) | `name` via markers join | Direct SQL |
| All marker displays | Display (Joined) | `name` | Via view/joins |
| `app/(dashboard)/compare/page.tsx` | Display (Risk tier) | `name` for risk classification | Client-side logic |

**Columns Used:**
- ✅ `id` - Primary key
- ✅ `name` - Badge display, risk tier calculation
- ✅ `category_id` - Foreign key (grouping)
- ⚠️ `scientific_name` - Schema column available via `getMarkerWithContext()` but NOT displayed
- ⚠️ `transmission_route` - Available but NOT displayed
- ⚠️ `clinical_significance` - Available but NOT displayed
- ⚠️ `created_at` - NOT displayed

**💡 Opportunity:** Pathogen detail pages with educational content

---

### Categories (Disease Categories)

**Table:** `categories`

| App File | Access Type | Columns Used | Via Query Function |
|----------|-------------|--------------|-------------------|
| `app/api/markers/route.ts` | Grouping | `id`, `name` | `getMarkersByCategory()` |
| `app/(dashboard)/markers/page.tsx` | Display (Grouping) | `id`, `name` | Via API |
| All marker displays | Display (Badge) | `name` | Via joins |

**Columns Used:**
- ✅ `id` - Primary key
- ✅ `name` - **PRIMARY GROUPING** (TORCH, Hepatitis, Retrovirus)
- ⚠️ `description` - Schema column available but NOT displayed
- ⚠️ `created_at` - NOT displayed

**💡 Opportunity:** Category description tooltips/popovers

---

## 🔍 Database Views Usage

### vw_test_config_details (Primary View)

**Used By:**
- `app/api/configs/route.ts` - `getAllConfigs()`
- `app/api/configs/[id]/route.ts` - `getConfigById()`
- `app/api/markers/[id]/route.ts` - `getConfigsByMarkerId()`
- `app/api/manufacturers/[id]/route.ts` - `getConfigsByManufacturerId()`
- `app/api/compare/route.ts` - `compareConfigsWithContext()`

**Purpose:** Pre-joined view combining:
- test_configurations
- markers (with pathogen and category)
- assays (with manufacturer)
- qc_samples
- cv_measurements

**All Columns Used:** ✅ All fields displayed in UI

---

### vw_manufacturer_performance (Aggregated View)

**Used By:**
- `app/api/manufacturers/[id]/route.ts` - `getManufacturerById()`

**Purpose:** Aggregated manufacturer performance metrics

**Columns Used:** All performance aggregate fields

---

## 📁 API Route → Query Function Mapping

### Analytics Routes

**`app/api/analytics/route.ts`**
- `getOverallStats()` → Counts from all tables
- `getCVDistribution()` → test_configurations aggregation
- `getQualityDistribution()` → test_configurations aggregation

**`app/api/analytics/dashboard-stats/route.ts`**
- Direct SQL on `test_configurations` → Quality stats
- Direct SQL joining manufacturers + CV → Top performers
- Direct SQL joining markers + assays → Poor performers

### Config Routes

**`app/api/configs/route.ts`**
- `getAllConfigs(filters, limit, offset)` → vw_test_config_details with filters

**`app/api/configs/[id]/route.ts`**
- `getConfigById(id)` → vw_test_config_details single row

### Marker Routes

**`app/api/markers/route.ts`**
- `getAllMarkers()` → markers table ORDER BY name
- `getMarkersByCategory()` → markers grouped by categories
- `searchMarkers(term)` → markers WHERE name ILIKE '%term%'

**`app/api/markers/[id]/route.ts`**
- `getMarkerById(id)` → markers single row
- `getConfigsByMarkerId(id)` → vw_test_config_details WHERE marker_id

### Manufacturer Routes

**`app/api/manufacturers/route.ts`**
- `getAllManufacturers(dataset)` → manufacturers with performance aggregates

**`app/api/manufacturers/[id]/route.ts`**
- `getManufacturerById(id)` → vw_manufacturer_performance
- `getAssaysByManufacturerId(id)` → assays WHERE manufacturer_id
- `getConfigsByManufacturerId(id)` → vw_test_config_details WHERE manufacturer_id

### Search Route

**`app/api/search/route.ts`**
- Direct SQL across markers, manufacturers, assays with ILIKE search

### Compare Route

**`app/api/compare/route.ts`**
- `compareConfigsWithContext(ids[])` → vw_test_config_details + methodology warnings

---

## 🎨 Dashboard Page → Data Display Mapping

### /dashboard

**Page:** `app/(dashboard)/dashboard/page.tsx`

**Data Source:** `/api/analytics/dashboard-stats`

**Displays:**
- `qualityStats.total` → Total configs count
- `qualityStats.excellent/good/acceptable/poor` → Quality breakdown
- `avgCVLt10` → Average CV <10% metric
- `topPerformers[]` → Top 5 manufacturers
- `poorPerformers[]` → Bottom 10 configs

**Tables Accessed:** test_configurations, cv_measurements, manufacturers, markers, assays

---

### /markers

**Page:** `app/(dashboard)/markers/page.tsx`

**Data Source:** `/api/markers?grouped=true`

**Displays:**
- `category_id`, `category_name` → Grouping cards
- `markers[].id`, `name`, `antibody_type`, `marker_type` → Marker cards

**Tables Accessed:** markers, categories

**Mock Data:** Yes (if no DATABASE_URL)

---

### /markers/[id]

**Page:** `app/(dashboard)/markers/[id]/page.tsx`

**Data Source:** `/api/markers/[id]`

**Displays:**
- **Marker Info:** `name`, `antibody_type`, `category_name`, `pathogen_name`, `clinical_use`, `interpretation_positive/negative`
- **Performance Summary:** Aggregated `cv_lt_10_percentage`, quality counts
- **Configs List:** All test configurations for marker with full CV breakdown

**Tables Accessed:** markers, pathogens, categories, test_configurations (via configs array), cv_measurements, assays, manufacturers

**Mock Data:** Yes (comprehensive mock)

---

### /manufacturers

**Page:** `app/(dashboard)/manufacturers/page.tsx`

**Data Source:** `/api/manufacturers?dataset={dataset}`

**Displays:**
- `id`, `name` → Manufacturer name
- `total_configs` → Config count
- `avg_cv_lt_10_pct` → Average performance
- `excellent_count/good_count/acceptable_count/poor_count` → Quality distribution
- Progress bar visualization

**Tables Accessed:** manufacturers (with aggregated performance from test_configurations)

**Dataset Filter:** ✅ Supports curated/all toggle

---

### /manufacturers/[id]

**Page:** `app/(dashboard)/manufacturers/[id]/page.tsx`

**Data Source:** `/api/manufacturers/[id]`

**Displays:**
- **Manufacturer Info:** `name`, `country`, `website`
- **Performance Summary:** Aggregated metrics across all configs
- **Platform Breakdown:** Performance grouped by platform (if multiple)
- **Assays:** `assays[]` with assay details
- **Configs List:** All configurations with full details

**Tables Accessed:** manufacturers, assays, test_configurations (configs array), markers, cv_measurements

---

### /configs/[id]

**Page:** `app/(dashboard)/configs/[id]/page.tsx`

**Data Source:** `/api/configs/[id]`

**Displays:**
- **Header:** `marker_name`, `manufacturer_name`, `antibody_type`, `category_name`, `quality_rating`
- **Config Summary:** `assay_name`, `platform`, `methodology`, `qc_sample_name`, `test_type`
- **CV Breakdown:** All CV counts and percentages with distribution bars
- **Statistics:** `events_examined`, `mean_cv`
- **Educational:** Marker info panel, CV explainer

**Tables Accessed:** vw_test_config_details (all fields)

---

### /assays

**Page:** `app/(dashboard)/assays/page.tsx`

**Data Source:** `/api/configs?limit=50&dataset={dataset}`

**Displays:**
- Table with: `marker_name`, `assay_name`, `manufacturer_name`, `platform`, `quality_rating`, `cv_lt_10_percentage`, `events_examined`
- Optional dataset badge if viewing "all" data

**Tables Accessed:** vw_test_config_details (via API)

**Dataset Filter:** ✅ Supports curated/all toggle

---

### /compare

**Page:** `app/(dashboard)/compare/page.tsx` (Client Component)

**Data Source:** `/api/compare` (POST)

**Displays:**
- Side-by-side comparison table
- Risk tier badges (calculated client-side from pathogen_name)
- Data confidence badges (from events_examined)
- Methodology comparison (if 2 configs)
- Statistical summary (best, average, total events)
- CSV export functionality

**Tables Accessed:** vw_test_config_details (via compareConfigsWithContext)

**Client-Side Logic:**
- Risk tier classification (high/medium/low based on pathogen name)
- Confidence levels (high ≥50, medium ≥30, limited ≥15, insufficient <15)

---

### /analytics

**Page:** `app/(dashboard)/analytics/page.tsx`

**Data Sources:**
- `getHeatmapData(dataset)` → Marker × Manufacturer matrix
- `getCVDistributionByManufacturer(dataset)` → Distribution chart
- `getQualityDistribution()` → Quality breakdown
- `getOverallStats()` → Summary statistics

**Displays:**
- Summary cards (total configs, excellent %, good+, avg CV)
- CV Performance Heatmap (marker × manufacturer)
- CV Distribution Chart (stacked bar by manufacturer)
- Quality Distribution Cards (excellent/good/acceptable/poor)

**Tables Accessed:** All tables (comprehensive analytics)

**Dataset Filter:** ✅ Supports curated/all toggle

---

## ⚠️ Schema vs Code Alignment Issues

### 1. Unused Schema Columns

**QC Samples Table - Rich Metadata Not Displayed:**
- `manufacturer` - Could show who makes the QC material
- `product_code` - Useful for ordering/reference
- `matrix_type` - Important for understanding sample composition
- `lot_number` - Critical for QC traceability
- `expiration_date` - Important for validity
- `concentration_level` - Shows sample strength
- `certifications` - Could indicate quality standards

**Recommendation:** Create QC Sample detail pages

**Pathogens Table - Educational Content Available:**
- `scientific_name` - Available via getMarkerWithContext() but not displayed
- `transmission_route` - Educational value
- `clinical_significance` - Important clinical context

**Recommendation:** Add pathogen info panels to marker detail pages

**Categories Table:**
- `description` - Could provide educational tooltips

**CV Measurements Table:**
- `median_cv`, `std_dev_cv` - Statistical measures available but not shown
- `measurement_date` - Could track when data was collected

**Test Configurations Table:**
- `notes` - Free text field available for annotations
- `created_at`, `updated_at` - Audit trail available

**Assays Table:**
- `automation_level` - Could help labs assess workflow
- `throughput` - Important for high-volume labs

---

### 2. Mock Data vs Schema Alignment

**✅ GOOD:** Mock data in dashboard pages generally matches schema types

**✅ GOOD:** TypeScript types in `lib/types/qc-data.ts` match schema exactly

**⚠️ MINOR:** Some mock data uses simplified structures (e.g., omits nullable fields)

---

### 3. Missing Indexes (Performance Opportunities)

Based on query patterns, these indexes would improve performance:

**test_configurations table:**
```sql
CREATE INDEX IF NOT EXISTS idx_test_config_marker ON test_configurations(marker_id);
CREATE INDEX IF NOT EXISTS idx_test_config_assay ON test_configurations(assay_id);
CREATE INDEX IF NOT EXISTS idx_test_config_quality ON test_configurations(quality_rating);
CREATE INDEX IF NOT EXISTS idx_test_config_inclusion ON test_configurations(include_in_analysis);
```

**cv_measurements table:**
```sql
CREATE INDEX IF NOT EXISTS idx_cv_lt_10_pct ON cv_measurements(cv_lt_10_percentage);
CREATE INDEX IF NOT EXISTS idx_cv_gt_20_pct ON cv_measurements(cv_gt_20_percentage);
```

**markers table:**
```sql
CREATE INDEX IF NOT EXISTS idx_markers_pathogen ON markers(pathogen_id);
CREATE INDEX IF NOT EXISTS idx_markers_category ON markers(category_id);
CREATE INDEX IF NOT EXISTS idx_markers_name_search ON markers USING gin(name gin_trgm_ops);
```

---

### 4. Type Mismatches

**✅ NO ISSUES FOUND**

All TypeScript types match PostgreSQL schema types correctly:
- `number` → `integer` / `bigint`
- `string` → `text` / `varchar`
- `boolean` → `boolean`
- `Date` → `timestamp`
- `null` → NULL

---

## 💡 Feature Opportunities (Unused Data)

### 1. QC Sample Detail Pages
**Available Data:** manufacturer, product_code, matrix_type, lot_number, expiration_date
**Benefit:** Help labs identify and order QC materials

### 2. Pathogen Educational Content
**Available Data:** scientific_name, transmission_route, clinical_significance
**Benefit:** Educational context for users

### 3. Category Descriptions
**Available Data:** category.description
**Benefit:** Tooltip/popover explanations of disease categories

### 4. Advanced Statistics Display
**Available Data:** median_cv, std_dev_cv
**Benefit:** More detailed statistical analysis for researchers

### 5. Audit Trail
**Available Data:** created_at, updated_at on all tables
**Benefit:** Show when data was added/updated

### 6. Assay Technical Specs
**Available Data:** automation_level, throughput
**Benefit:** Lab workflow planning

### 7. Configuration Notes
**Available Data:** test_configurations.notes
**Benefit:** Admin annotations, caveats, special conditions

---

## 📊 Query Performance Analysis

### Most Frequent Queries

1. **vw_test_config_details** - Used by 5+ API endpoints
2. **Quality rating aggregations** - Dashboard stats
3. **Manufacturer performance aggregates** - Used heavily
4. **Marker grouping by category** - Markers page

### Query Complexity Levels

**Simple (< 50ms expected):**
- Single row lookups by ID
- Simple aggregations

**Medium (50-200ms expected):**
- Filtered config lists
- Manufacturer performance calculations

**Complex (200ms+ expected):**
- Heatmap data (marker × manufacturer matrix)
- Distribution charts with multiple aggregations
- Search across multiple tables

### Optimization Status

✅ **GOOD:** Views pre-compute common joins
✅ **GOOD:** Pagination implemented on large result sets
✅ **GOOD:** Dataset filtering reduces query scope
⚠️ **NEEDS:** Indexes on common filter/join columns
⚠️ **NEEDS:** Query result caching for analytics pages

---

## 🔐 Data Validation

### Input Validation

**✅ IMPLEMENTED:**
- Route param validation (parseInt with isNaN check)
- Pagination bounds (limit 1-100, offset ≥0)
- Array length validation (compare: 2-4 configs)
- Dataset enum validation ('curated' | 'all')

**✅ TYPE SAFETY:**
- TypeScript interfaces match schema
- Type guards in `lib/types/qc-data.ts`
- Parameterized queries (SQL injection protection)

---

## 📈 Data Flow Architecture

```
User Request
    ↓
Next.js Server Component (app/(dashboard)/)
    ↓
fetch() → API Route (app/api/)
    ↓
Query Function (lib/db/queries.ts)
    ↓
Database Pool (lib/db/connection.ts)
    ↓
Neon PostgreSQL Database
    ↓
View or Table
    ↓
← Data Response (typed)
    ↓
← JSON Response
    ↓
← Server-Rendered HTML
    ↓
User Browser
```

**Alternative Paths:**
- **Client Components:** Use client-side fetch (e.g., /compare page)
- **Direct SQL:** Some analytics routes bypass query functions for custom aggregations

---

## 🎯 Conclusion

### Strengths
1. ✅ **Excellent type safety** - TypeScript types match schema exactly
2. ✅ **Clean separation** - API routes → Query functions → Database
3. ✅ **Comprehensive views** - Pre-joined data reduces complexity
4. ✅ **Good filtering** - Dataset toggle, quality filters work well
5. ✅ **No SQL injection risk** - All queries use parameterized statements

### Areas for Improvement
1. ⚠️ **Unused rich metadata** - Many schema columns not displayed
2. ⚠️ **Missing indexes** - Performance could be improved
3. ⚠️ **No caching** - Analytics queries could benefit from caching
4. ⚠️ **Limited educational content** - Pathogen/category data underutilized

### Next Steps
1. Add indexes for common query patterns
2. Create QC Sample detail pages
3. Add pathogen educational panels
4. Implement query result caching
5. Display statistical measures (median, std dev)
