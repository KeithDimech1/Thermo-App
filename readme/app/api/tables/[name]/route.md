# API Route: /api/tables/[name]

**Path:** `app/api/tables/[name]/route.ts`
**Type:** API Route
**Last Analyzed:** 2025-11-16
**File Size:** 134 lines

## What It Does

Provides a paginated REST API for fetching thermochronology table data with sorting and pagination support. Acts as a generic table data endpoint that can serve data from any of the 5 main database tables (samples, ft_ages, ft_counts, ft_track_lengths, ahe_grain_data).

## Database Interactions

### Tables Used
- **`samples`** (read: select)
  - Fields: `sample_id`, `igsn`, `latitude`, `longitude`, `elevation_m`, `lithology`, `mineral_type`
  - Operations: Paginated SELECT with COUNT for pagination metadata
  - Lines: 24-26, 93-98

- **`ft_ages`** (read: select)
  - Fields: `sample_id`, `pooled_age_ma`, `pooled_age_error_ma`, `central_age_ma`, `central_age_error_ma`, `n_grains`, `p_chi2`, `dispersion_pct`
  - Operations: Paginated SELECT with COUNT for pagination metadata
  - Lines: 29-32, 93-98

- **`ft_counts`** (read: select)
  - Fields: `sample_id`, `grain_id`, `ns`, `ni`, `nd`, `rho_s_cm2`, `rho_i_cm2`, `rho_d_cm2`
  - Operations: Paginated SELECT with COUNT for pagination metadata
  - Lines: 34-37, 93-98

- **`ft_track_lengths`** (read: select)
  - Fields: `sample_id`, `grain_id`, `mean_track_length_um`, `mean_track_length_sd_um`, `dpar_um`, `angle_to_c_axis_deg`
  - Operations: Paginated SELECT with COUNT for pagination metadata
  - Lines: 39-42, 93-98

- **`ahe_grain_data`** (read: select)
  - Fields: `sample_id`, `lab_no`, `uncorr_age_ma`, `corr_age_ma`, `corr_age_1sigma_ma`, `ft`, `u_ppm`, `th_ppm`
  - Operations: Paginated SELECT with COUNT for pagination metadata
  - Lines: 44-47, 93-98

### Key Queries
```sql
-- Get total row count for pagination (line 93)
SELECT COUNT(*) as total FROM {table_name}

-- Get paginated data with sorting (lines 94-98)
SELECT {columns}
FROM {table_name}
ORDER BY {sortBy} {sortOrder}
LIMIT $1 OFFSET $2
```

### Database Documentation
→ See [samples table docs](../../../database/tables/samples.md)
→ See [ft_ages table docs](../../../database/tables/ft_ages.md)
→ See [ft_counts table docs](../../../database/tables/ft_counts.md)
→ See [ft_track_lengths table docs](../../../database/tables/ft_track_lengths.md)
→ See [ahe_grain_data table docs](../../../database/tables/ahe_grain_data.md)

## Key Exports
- `GET(request, params)` - Handles GET requests for table data with pagination and sorting

## API Parameters

**Path Parameters:**
- `name` - Table identifier (samples, ft-ages, ft-counts, track-lengths, ahe-grains)

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Rows per page (default: 50)
- `sortBy` - Column to sort by (default: table's defaultSort)
- `sortOrder` - 'asc' or 'desc' (default: 'asc')

**Response Format:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1000,
    "totalPages": 20,
    "hasNext": true,
    "hasPrev": false
  },
  "sort": {
    "column": "sample_id",
    "order": "asc"
  }
}
```

## Dependencies

**External packages:**
- next/server (Next.js server utilities)

**Internal imports:**
- `@/lib/db/connection` - Database query function

## Used By
- `components/tables/InteractiveTable.tsx:50` - Client component that fetches data from this API

## Notes
- **Security:** Column names are validated against allowlist to prevent SQL injection
- **Performance:** Uses parallel queries (COUNT + SELECT) for efficiency
- **Table mapping:** URL-friendly names (ft-ages) map to actual table names (ft_ages)
- **Pagination:** Server-side pagination to handle large datasets efficiently
- **Validation:** Validates sort column, sort order, and table name parameters

## Related Files
- `components/tables/InteractiveTable.tsx` - Client component that consumes this API
- `lib/db/connection.ts` - Database connection and query utilities
