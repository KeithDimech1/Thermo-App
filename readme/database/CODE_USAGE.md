# Database Code Usage Map

**Purpose:** Cross-reference showing which code files access which database tables
**Last Updated:** 2025-11-11

---

## Overview

This document maps the relationship between code files and database tables, making it easy to understand which parts of the codebase interact with specific database entities.

---

## Tables → Code Files

### test_configurations (Core Table)

**Accessed By:**
- `lib/db/queries.ts` - 13 functions (getAllConfigs, getConfigById, getConfigsByMarkerId, getConfigsByManufacturerId, getPoorPerformers, getQualityDistribution, getCVDistribution, getOverallStats, compareConfigs, getHighRiskPathogenConfigs, getConfigsWithConfidence, getConfidenceStatistics, compareConfigsWithContext)
- `app/api/configs/route.ts` - GET endpoint (via getAllConfigs)
- `app/api/configs/[id]/route.ts` - GET endpoint (via getConfigById)
- `app/api/manufacturers/[id]/route.ts` - GET endpoint (via getConfigsByManufacturerId)
- `app/api/markers/[id]/route.ts` - GET endpoint (via getConfigsByMarkerId)
- `app/api/analytics/dashboard-stats/route.ts` - Statistics (via getOverallStats)
- `app/(dashboard)/dashboard/page.tsx` - Dashboard display
- `app/(dashboard)/assays/page.tsx` - Assays list with configs
- `app/(dashboard)/manufacturers/[id]/page.tsx` - Manufacturer detail
- `app/(dashboard)/markers/[id]/page.tsx` - Marker detail
- `app/(dashboard)/compare/page.tsx` - Config comparison

---

### cv_measurements (Performance Metrics)

**Accessed By:**
- `lib/db/queries.ts` - Via vw_test_config_details (all config queries include CV data)
- `app/api/configs/route.ts` - Performance filtering (min_cv_lt_10)
- `app/api/analytics/dashboard-stats/route.ts` - CV distribution stats
- `components/dashboard/MetricsCards.tsx` - Displays avg CV <10%
- `components/dashboard/QualityAlerts.tsx` - Shows poor performers
- `components/dashboard/TopPerformers.tsx` - Shows best CV performers

---

### markers (Biomarkers)

**Accessed By:**
- `lib/db/queries.ts` - 4 functions (getAllMarkers, getMarkersByCategory, getMarkerById, searchMarkers, getMarkerWithContext)
- `app/api/markers/route.ts` - GET all markers
- `app/api/markers/[id]/route.ts` - GET single marker
- `app/api/search/route.ts` - Search markers by name
- `app/(dashboard)/markers/page.tsx` - Markers list
- `app/(dashboard)/markers/[id]/page.tsx` - Marker detail
- `components/filters/FilterPanel.tsx` - Marker filter dropdown
- `components/education/MarkerInfoPanel.tsx` - Marker educational info
- `components/search/SearchBar.tsx` - Search results

---

### manufacturers (Companies)

**Accessed By:**
- `lib/db/queries.ts` - 3 functions (getAllManufacturers, getManufacturerById, getManufacturerByName)
- `app/api/manufacturers/route.ts` - GET all manufacturers
- `app/api/manufacturers/[id]/route.ts` - GET single manufacturer
- `app/api/search/route.ts` - Search manufacturers
- `app/(dashboard)/manufacturers/page.tsx` - Manufacturers list
- `app/(dashboard)/manufacturers/[id]/page.tsx` - Manufacturer detail
- `components/filters/FilterPanel.tsx` - Manufacturer filter
- `components/dashboard/TopPerformers.tsx` - Top manufacturers

---

### assays (Test Platforms)

**Accessed By:**
- `lib/db/queries.ts` - 3 functions (getAllAssays, getAssaysByManufacturerId, getAssayById, getAssayWithTechSpecs)
- `app/api/search/route.ts` - Search assays
- `app/(dashboard)/manufacturers/[id]/page.tsx` - Show manufacturer's assays
- `app/(dashboard)/markers/[id]/page.tsx` - Show assays for marker
- `components/filters/FilterPanel.tsx` - Assay filtering
- `components/education/MethodologyTooltip.tsx` - Methodology info

---

### categories (Disease Categories)

**Accessed By:**
- `lib/db/queries.ts` - 2 functions (getMarkersByCategory, getMarkerWithContext)
- `app/api/search/route.ts` - Category context for markers
- `app/(dashboard)/markers/page.tsx` - Group markers by category
- `components/filters/FilterPanel.tsx` - Category filter

---

### pathogens (Infectious Agents)

**Accessed By:**
- `lib/db/queries.ts` - 1 function (getMarkerWithContext)
- `app/api/search/route.ts` - Pathogen context for markers
- `components/education/MarkerInfoPanel.tsx` - Pathogen information

---

### qc_samples (QC Materials)

**Accessed By:**
- `lib/db/queries.ts` - 1 function (getAssayWithTechSpecs)
- Displayed alongside test configurations (via JOINs)

---

## Views → Code Files

### vw_test_config_details (Denormalized Configs)

**Accessed By:**
- `lib/db/queries.ts` - 11 functions (primary view for all config queries)
- All API routes that fetch test configurations
- All dashboard pages displaying configs
- **Why:** Pre-joins test_configurations with markers, assays, manufacturers, cv_measurements

---

### vw_manufacturer_performance (Aggregated Stats)

**Accessed By:**
- `lib/db/queries.ts` - 2 functions (getAllManufacturers, getManufacturerById)
- `app/api/manufacturers/route.ts` - Manufacturer listing
- `app/api/manufacturers/[id]/route.ts` - Manufacturer detail
- `app/(dashboard)/manufacturers/page.tsx` - Performance metrics
- **Why:** Pre-aggregates counts, averages, quality ratings by manufacturer

---

## Code Files → Tables (Reverse Mapping)

### Database Layer
- **lib/db/connection.ts** - No tables (provides connection pool)
- **lib/db/queries.ts** - ALL tables (8 tables + 2 views)

### API Routes
- **app/api/configs/route.ts** - test_configurations, cv_measurements (via queries)
- **app/api/configs/[id]/route.ts** - test_configurations, cv_measurements (via queries)
- **app/api/manufacturers/route.ts** - manufacturers, assays, test_configurations (via queries)
- **app/api/manufacturers/[id]/route.ts** - manufacturers, assays, test_configurations (via queries)
- **app/api/markers/route.ts** - markers (via queries)
- **app/api/markers/[id]/route.ts** - markers, test_configurations (via queries)
- **app/api/analytics/route.ts** - test_configurations, cv_measurements (via queries)
- **app/api/analytics/dashboard-stats/route.ts** - test_configurations, markers, manufacturers, assays, cv_measurements (via queries)
- **app/api/search/route.ts** - markers, manufacturers, assays, pathogens, categories (direct SQL)

### Server Components (Pages)
- **app/(dashboard)/dashboard/page.tsx** - test_configurations, cv_measurements (via queries)
- **app/(dashboard)/assays/page.tsx** - test_configurations, assays, manufacturers (via queries)
- **app/(dashboard)/manufacturers/page.tsx** - manufacturers (via queries)
- **app/(dashboard)/manufacturers/[id]/page.tsx** - manufacturers, assays, test_configurations (via queries)
- **app/(dashboard)/markers/page.tsx** - markers, categories (via queries)
- **app/(dashboard)/markers/[id]/page.tsx** - markers, test_configurations, assays (via queries)
- **app/(dashboard)/compare/page.tsx** - test_configurations (via queries)

### UI Components
- **components/dashboard/MetricsCards.tsx** - Receives data (no direct DB access)
- **components/dashboard/QualityAlerts.tsx** - Receives data (no direct DB access)
- **components/dashboard/TopPerformers.tsx** - Receives data (no direct DB access)
- **components/filters/FilterPanel.tsx** - Receives data (no direct DB access)
- **components/education/MarkerInfoPanel.tsx** - Receives data (no direct DB access)
- **components/education/MethodologyTooltip.tsx** - No DB access (static data)
- **components/search/SearchBar.tsx** - Calls API (no direct DB access)

---

## Database Access Patterns

### Pattern 1: API Routes → Query Functions → Database
**Flow:** API Route → lib/db/queries.ts → lib/db/connection.ts → PostgreSQL

**Example:**
```
app/api/markers/route.ts
  ↓ calls
lib/db/queries.ts::getAllMarkers()
  ↓ uses
lib/db/connection.ts::query()
  ↓ executes SQL
SELECT * FROM markers
```

**95% of database access follows this pattern.**

---

### Pattern 2: Direct SQL in API Routes (Rare)
**Flow:** API Route → lib/db/connection.ts → PostgreSQL

**Example:**
```
app/api/search/route.ts
  ↓ uses
lib/db/connection.ts::query()
  ↓ executes custom SQL
SELECT ... FROM markers WHERE LOWER(name) LIKE $1
```

**Why:** Complex search queries that don't fit standard query functions. Only used in `app/api/search/route.ts`.

---

### Pattern 3: Server Components → Query Functions → Database
**Flow:** Server Component → lib/db/queries.ts → lib/db/connection.ts → PostgreSQL

**Example:**
```
app/(dashboard)/dashboard/page.tsx
  ↓ calls
lib/db/queries.ts::getOverallStats()
  ↓ uses
lib/db/connection.ts::query()
  ↓ executes SQL
SELECT COUNT(*) FROM test_configurations ...
```

**Why:** Next.js Server Components can directly query the database (no API route needed).

---

## Most Heavily Used Tables

### By Number of Query Functions
1. **test_configurations** - 13 functions
2. **cv_measurements** - Used in all config queries (via view)
3. **markers** - 5 functions
4. **manufacturers** - 3 functions
5. **assays** - 4 functions

### By Number of API Endpoints
1. **test_configurations** - 5 API routes
2. **markers** - 3 API routes
3. **manufacturers** - 3 API routes
4. **assays** - 2 API routes (indirect via manufacturers/markers)

### By Number of UI Components
1. **test_configurations** - 8+ components display config data
2. **cv_measurements** - 5+ components display CV metrics
3. **markers** - 4+ components
4. **manufacturers** - 4+ components

---

## Table Modification Status

### Read-Only Tables (Never Modified by Application)
- ✅ **All tables are currently READ-ONLY**
- Data is populated by import scripts (`scripts/db/import-data.ts`)
- No UPDATE, INSERT, DELETE operations in application code

### Future Write Operations (Not Yet Implemented)
- User annotations/notes on test configurations
- Favorite/bookmarked configurations
- Custom quality thresholds
- Admin CRUD operations

---

## Performance Hotspots

### Most Queried Tables
1. **vw_test_config_details** (view) - Used on every page displaying configs
2. **test_configurations** - Core table for all operations
3. **cv_measurements** - Always joined with configs

### Optimization Recommendations
- ✅ Views are already optimized (vw_test_config_details, vw_manufacturer_performance)
- ✅ Foreign key indexes exist
- ⚠️ Consider caching manufacturer list (rarely changes)
- ⚠️ Consider caching marker list (rarely changes)
- ⚠️ Consider adding index on `test_configurations.quality_rating` for dashboard filtering

---

## Related Documentation

- **Table Schemas:** See [tables/](tables/) for individual table documentation
- **Query Functions:** See [lib/db/queries.md](../lib/db/queries.md)
- **API Routes:** See [app/api/](../app/api/) for endpoint documentation

---

**Generated:** 2025-11-11
**Last Verified:** 2025-11-11
**Total Tables:** 8
**Total Views:** 2
**Total Code Files Accessing Database:** 30+
