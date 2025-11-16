# qc-data-loader.ts

**Path:** `lib/utils/qc-data-loader.ts`
**Type:** Utility Functions
**Last Analyzed:** 2025-11-11
**File Size:** 434 lines

## What It Does

Provides comprehensive helper functions to load, query, filter, and analyze QC (Quality Control) performance data from the JSON file. Acts as a data access layer before the database is set up, and can be used for client-side filtering once data is loaded.

## Key Exports

### Data Loading
- `loadQCData()` - Loads QC data from JSON file asynchronously

### Data Transformation
- `getTestConfigDetails()` - Joins all related data (marker, assay, manufacturer, pathogen, category, QC sample, CV performance) into flat structure matching database view

### Filtering and Querying
- `filterTestConfigs()` - Filters configurations by multiple criteria (manufacturer, marker, quality rating, category, etc.)
- `getConfigsByMarker()` - Returns all configurations for a specific marker name
- `getConfigsByManufacturer()` - Returns all configurations for a manufacturer
- `getConfigsByQuality()` - Returns configurations matching a quality rating
- `searchConfigs()` - Full-text search across marker names, assay names, manufacturers

### Analysis and Aggregation
- `getManufacturerPerformance()` - Calculates performance metrics by manufacturer (avg CV%, excellent count, poor count)
- `getStatisticsSummary()` - Overall statistics (total configs, quality breakdown, avg performance)
- `compareAssays()` - Compares two assays for the same marker side-by-side
- `getTopPerformers()` - Returns top N configurations by CV <10% percentage
- `getPoorPerformers()` - Returns configurations with CV >20% above threshold

### Grouping
- `groupByCategory()` - Groups test configs by disease category (TORCH, Hepatitis, etc.)
- `groupByPathogen()` - Groups test configs by pathogen (CMV, HIV, HCV, etc.)

### Metadata Helpers
- `getAllMarkers()` - Returns list of all unique markers
- `getAllManufacturers()` - Returns list of all unique manufacturers
- `getAllCategories()` - Returns list of all disease categories

### Example Usage Functions
- `exampleGetCMVConfigs()` - Example: Get all CMV-related test configurations
- `exampleCompareManufacturers()` - Example: Compare Abbott vs Roche for a specific marker
- `exampleFindPoorPerformers()` - Example: Find poorly performing configurations

## Dependencies

**External packages:** None (uses built-in Next.js import for JSON)

**Internal imports:**
- `lib/types/qc-data.ts` - All type definitions

**Data file:**
- `build-data/assets/qc-data.json` - 140KB JSON file with 132 test configurations

## Used By

**Currently:** Not imported anywhere (ready for future use)

**Will be used by** (when created):
- `app/api/configs/route.ts` - API endpoint to serve filtered configs
- `app/api/manufacturers/route.ts` - Manufacturer performance API
- `app/page.tsx` - Dashboard showing statistics summary
- `components/ConfigTable.tsx` - Client-side filtering of test configs
- `components/PerformanceChart.tsx` - Manufacturer performance visualization

## Usage Examples

### Loading Data
```typescript
import { loadQCData, getTestConfigDetails } from '@/lib/utils/qc-data-loader';

const data = await loadQCData();
const details = getTestConfigDetails(data);
// Returns 132 test configs with all related data joined
```

### Filtering
```typescript
import { filterTestConfigs } from '@/lib/utils/qc-data-loader';

const filtered = filterTestConfigs(details, {
  manufacturer: 'Abbott',
  qualityRating: 'excellent',
  category: 'TORCH'
});
// Returns only Abbott's excellent-rated TORCH tests
```

### Analysis
```typescript
import { getManufacturerPerformance } from '@/lib/utils/qc-data-loader';

const performance = getManufacturerPerformance(data);
// Returns array with avg CV%, excellent count, poor count per manufacturer
// Sorted by best performance first
```

### Search
```typescript
import { searchConfigs } from '@/lib/utils/qc-data-loader';

const results = searchConfigs(data, 'CMV IgG');
// Full-text search across marker names, assay names, manufacturers
```

## Notes

### Design Pattern
This file follows the **data access layer** pattern:
1. Loads raw JSON data
2. Transforms into usable formats
3. Provides query/filter methods
4. Calculates derived metrics

### Performance Considerations
- `loadQCData()` loads entire JSON file (~140KB) - acceptable for this dataset
- All filter/query functions operate in-memory - fast for 132 configs
- For larger datasets (>1000 records), consider database queries instead

### Relationship to Database
This utility layer provides the **same functionality** that database views and queries will provide:
- `getTestConfigDetails()` → matches `vw_test_config_details` database view
- `getManufacturerPerformance()` → matches `vw_manufacturer_performance` database view

Use this for:
- **Client-side filtering** (after initial page load)
- **Development/testing** (before database is set up)
- **Static site generation** (build-time data loading)

Use database queries for:
- **Server-side rendering** (better performance for large datasets)
- **Real-time data** (if QC data gets updated frequently)
- **Complex joins** (beyond what JSON structure supports)

### Example Use Case
```typescript
// app/page.tsx - Dashboard
import { loadQCData, getStatisticsSummary } from '@/lib/utils/qc-data-loader';

export default async function Dashboard() {
  const data = await loadQCData();
  const stats = getStatisticsSummary(data);

  return (
    <div>
      <h1>QC Results Dashboard</h1>
      <p>Total Configurations: {stats.totalConfigurations}</p>
      <p>Excellent: {stats.qualityCounts.excellent}</p>
      <p>Poor: {stats.qualityCounts.poor}</p>
      <p>Average CV: {stats.overallAverageCVLT10}%</p>
    </div>
  );
}
```

## Related Files
- `lib/types/qc-data.ts` - Type definitions used throughout
- `build-data/assets/qc-data.json` - Source data file
- `scripts/db/import-data.ts` - Imports same data into database
- `scripts/db/schema.sql` - Database schema matching these data structures
