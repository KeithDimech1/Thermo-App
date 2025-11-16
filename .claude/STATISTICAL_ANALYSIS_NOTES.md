# Statistical Analysis Feature - Implementation Notes

**Location:** `/app/(dashboard)/analytics` → Statistical Analysis Tab
**Last Updated:** 2025-11-12

## Overview

Advanced statistical analysis for QC data with intelligent filtering and context-aware educational feedback.

## Key Features

### 1. Context-Aware Educational Text

The system provides **dynamic educational feedback** based on actual statistical values:

#### Upper Control Limit (UCL) Ranges:
- **≤105% (Excellent)**: Very low variability - consistent, predictable performance ✅
- **≤115% (Good)**: Low variability - generally consistent with minor variations 👍
- **≤130% (Fair)**: Moderate variability - investigate lower performers ⚠️
- **>130% (Poor)**: High variability - mixed quality, unpredictable results 🔴

#### Standard Deviation Ranges:
- **≤5% (Excellent)**: Exceptional uniformity
- **≤10% (Good)**: Reliable performance
- **≤20% (Fair)**: Noticeable spread
- **>20% (Poor)**: Extreme variation - filter recommended

**Example:**
- UCL 108% → Shows "Good Control" with blue highlighting
- UCL 168% → Shows "High Variability" with red highlighting and action recommendations

### 2. Pathogen-Dependent Filtering

**Filter Hierarchy:**
1. **Pathogen** (optional) - Filters available assays
2. **Manufacturer** (optional) - Independent filter
3. **Assay** (optional) - Shows only assays for selected pathogen

**Implementation:**
- Database query joins: `assays → markers → pathogens`
- Returns: `{id, name, pathogen_ids: [array]}`
- UI auto-filters assay dropdown when pathogen selected
- Auto-resets assay selection when pathogen changes

### 3. Minimum Data Requirements

**Critical Constraint:** Statistical analysis requires **minimum 3 data points**

**Why 3?**
- Skewness calculation requires ≥3 data points
- Control limits (mean ± 3σ) need meaningful sample size
- Process capability (Cpk) requires distribution analysis

**Validation Layers:**

1. **Pre-calculation check** (Line 74-87):
   ```typescript
   if (cvData.length < MIN_DATA_POINTS) {
     return 422 INSUFFICIENT_DATA with helpful message
   }
   ```

2. **Try-catch around calculations** (Line 92-112):
   ```typescript
   try {
     calculateCVMetrics() // May throw if < 3 points
     calculateDistributionStats() // Requires ≥3 for skewness
   } catch (calcError) {
     return 422 INSUFFICIENT_DATA
   }
   ```

### 4. Intelligent Error Handling

**Error Types & User Messaging:**

| Error Type | HTTP Status | Icon | Message | Suggestion |
|------------|-------------|------|---------|------------|
| `INSUFFICIENT_DATA` | 422 | 📊 | "At least 3 data points required. Found X." | "Try broader filters (manufacturer only, pathogen only)" |
| `NO_DATA` | 404 | 🔍 | "No test configurations found" | "Remove one or more filters" |
| `SERVER_ERROR` | 500 | ⚠️ | Technical error message | Contact support |

**User Experience Flow:**

1. User selects **single assay** → 1 configuration found
2. API validates: `1 < 3 minimum` → Returns 422
3. UI displays friendly message:
   ```
   📊 Not Enough Data for Statistical Analysis

   At least 3 data points are required. Found 1.

   💡 Suggestion: Try selecting broader filters
   (e.g., manufacturer only, or pathogen only)

   Found 1 configuration, need at least 3
   ```

4. User removes assay filter → 132 configurations → Analysis succeeds ✅

## Statistical Calculations

**Performed by:** `/lib/stats/qc-analytics.ts`

1. **Control Limits**: Mean ± 3σ (Shewhart control charts)
2. **Process Capability**: Cpk = min((USL - μ)/3σ, (μ - LSL)/3σ)
3. **Outlier Detection**: IQR, Z-score, Modified Z-score methods
4. **Distribution Stats**: Skewness, percentiles (P5-P95), quartiles

## API Endpoints

### GET `/api/analytics/stats`

**Query Parameters:**
- `dataset`: `'curated' | 'all'` (default: 'curated')
- `manufacturerId`: Optional filter by manufacturer
- `assayId`: Optional filter by assay

**Response:** 200 OK
```typescript
{
  overall: CVMetrics,        // Mean, median, UCL, LCL, stdDev, etc.
  capability: ProcessCapability, // Cpk, USL, LSL, withinSpec
  outliers: OutlierAnalysis,     // Consensus outliers
  distribution: DistributionStats, // Skewness, percentiles
  dataInfo: { totalConfigs, configsWithCV, dateGenerated }
}
```

**Error Responses:**
- `422`: Insufficient data for analysis
- `404`: No data found matching filters
- `500`: Server error

### GET `/api/filters`

Returns filter options including assays with pathogen relationships:

```typescript
{
  pathogens: Array<{ id, name, abbreviation }>,
  manufacturers: Array<{ id, name }>,
  assays: Array<{ id, name, pathogen_ids: number[] }>
}
```

## Best Practices

### For Users:
1. Start with **broad filters** (manufacturer or pathogen only)
2. Narrow down gradually once you confirm enough data
3. Look for **color-coded feedback** in educational cards
4. Compare UCL values: **108% is much better than 168%**

### For Developers:
1. Always validate data count before statistical calculations
2. Provide **actionable suggestions** in error messages
3. Use **context-aware** educational text based on ranges
4. Test with edge cases: 0, 1, 2, 3 data points
5. Remember: Statistical libraries will throw if insufficient data

## Database Schema

**Relevant Tables:**
- `test_configurations` - Main data source
- `assays` - Contains manufacturer_id
- `markers` - Links to pathogens (via pathogen_id)
- `pathogens` - Filter options

**View Used:**
- `vw_test_config_details` - Optimized joins for filtering

## Common Issues & Solutions

### Issue: "Failed to fetch statistics" with single assay
**Cause:** Only 1-2 configurations for that assay
**Solution:** ✅ Now shows friendly message with suggestion

### Issue: Pathogen filter doesn't affect assay dropdown
**Cause:** Missing pathogen_ids in assay data
**Solution:** Use `getUniqueAssaysWithPathogen()` query

### Issue: Educational text always says "high variability"
**Cause:** Generic text not based on actual values
**Solution:** ✅ Implemented range-based interpretation

## Files Modified

1. `app/api/analytics/stats/route.ts` - Data validation & error handling
2. `components/analytics/StatisticalSummary.tsx` - UI filters & error display
3. `lib/db/queries.ts` - Added `getUniqueAssaysWithPathogen()`
4. `app/api/filters/route.ts` - Returns pathogen-linked assays

## Future Enhancements

- [ ] Cache statistical results (5-minute TTL)
- [ ] Show data point count in filter UI (before selecting)
- [ ] Export statistical report as PDF
- [ ] Add time-series analysis for trending
- [ ] Batch comparison mode (multiple manufacturers)

---

**Key Takeaway:** Statistical analysis is **data-hungry**. Always validate minimum requirements before calculations, and provide helpful, actionable feedback when constraints aren't met.
