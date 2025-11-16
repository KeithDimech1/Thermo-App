# qc-data.ts

**Path:** `lib/types/qc-data.ts`
**Type:** Type Definitions
**Last Analyzed:** 2025-11-11
**File Size:** 400+ lines

## What It Does

Defines comprehensive TypeScript interfaces and types for Quality Control (QC) performance data in infectious disease testing. Maps data structures for both JSON format and PostgreSQL database schema.

## Database Mapping

This file defines TypeScript interfaces that **directly map to database tables**:

### Database Tables Represented
- **`categories`** → `Category` interface (disease categories: TORCH, Hepatitis, etc.)
- **`pathogens`** → `Pathogen` interface (infectious organisms: CMV, HIV, HCV, etc.)
- **`markers`** → `Marker` interface (test markers: anti-CMV IgG, HBsAg, etc.)
- **`manufacturers`** → `Manufacturer` interface (Abbott, Roche, Siemens, etc.)
- **`assays`** → `Assay` interface (testing platforms: ARCHITECT, Elecsys, etc.)
- **`qc_samples`** → `QCSample` interface (QC control materials: Optitrol series)
- **`test_configurations`** → `TestConfiguration` interface (unique marker+assay+QC combinations)
- **`cv_measurements`** → `CVMeasurement` interface (Coefficient of Variation performance data)

### Database Schema Documentation
→ See [DATABASE-SCHEMA.md](../../../build-data/documentation/DATABASE-SCHEMA.md) for complete schema reference

## Key Exports

### Enums and Type Literals
- `AntibodyType` - 'IgG' | 'IgM' | 'Antigen' | 'Antibody (Total)' | 'Other'
- `MarkerType` - 'Antibody' | 'Antigen' | 'Nucleic Acid'
- `TestType` - 'serology' | 'nat' | 'both'
- `QualityRating` - 'excellent' | 'good' | 'acceptable' | 'poor' | 'unknown'
- `Methodology` - 'CLIA' | 'ELISA' | 'PCR' | 'ECLIA' | 'CMIA'
- `AutomationLevel` - 'Fully Automated' | 'Semi-Automated' | 'Manual'
- `MatrixType` - 'human plasma' | 'human serum' | 'synthetic'
- `DiseaseCategory` - TORCH, Hepatitis, Retrovirus, COVID-19, EBV, etc.

### Database Entity Interfaces
- `Category` - Disease category grouping
- `Pathogen` - Infectious organism details
- `Marker` - Test marker with clinical interpretation
- `Manufacturer` - Equipment manufacturer information
- `Assay` - Testing platform/assay details
- `QCSample` - Quality control sample materials
- `TestConfiguration` - Links marker + assay + QC sample
- `CVMeasurement` - Coefficient of Variation performance metrics

### JSON Structure Interfaces
- `QCDataJSON` - Complete JSON file structure (matches build-data/assets/qc-data.json)
- `TestConfigJSON` - Denormalized test configuration with nested data
- `PathogenJSON`, `MarkerJSON`, `AssayJSON`, etc. - JSON representations

### View Interfaces (Database Views)
- `TestConfigDetails` - Complete test config with all joins (matches vw_test_config_details)
- `ManufacturerPerformance` - Performance summary by manufacturer

### Utility Interfaces
- `CVPerformanceData` - CV thresholds breakdown (<10%, 10-15%, 15-20%, >20%)
- `TestConfigFilters` - Filter criteria for querying configurations
- `ChartDataPoint` - Data point for visualization

### Type Guards and Helpers
- `isQualityRating()` - Type guard for QualityRating validation
- `isTestType()` - Type guard for TestType validation
- `isDiseaseCategory()` - Type guard for DiseaseCategory validation
- `calculateQualityRating()` - Derives quality rating from CV performance
- `getQualityRatingColor()` - Maps rating to color code (excellent=green, poor=red)
- `getCVThresholdLabel()` - User-friendly labels for CV thresholds

## Dependencies

**External packages:** None (pure TypeScript types)

**Internal imports:** None (base type definitions)

## Used By

**Database scripts:**
- `scripts/db/import-data.ts:1` - Imports all interfaces for type-safe database import
- `lib/utils/qc-data-loader.ts:1` - Imports types for data loading and querying

**Future API routes** (when created):
- `app/api/configs/route.ts` - Will use for API responses
- `app/api/manufacturers/route.ts` - Will use for manufacturer data

**Future components** (when created):
- React components will import for props typing
- Chart components will use ChartDataPoint interface

## Notes

### Quality Rating Logic
Quality ratings are calculated from CV (Coefficient of Variation) performance:
- **Excellent:** >70% of measurements have CV <10%
- **Good:** >50% have CV <10%
- **Acceptable:** >30% have CV <10% AND <30% have CV >20%
- **Poor:** ≥30% have CV >20%
- **Unknown:** Insufficient data

### CV Thresholds in Laboratory Testing
- **CV <10%:** Excellent precision (gold standard)
- **CV 10-15%:** Good precision (acceptable for routine use)
- **CV 15-20%:** Acceptable precision (marginal)
- **CV >20%:** Poor precision (may need investigation)

### Database Design
This file ensures **type safety** between:
1. JSON source data (`build-data/assets/qc-data.json`)
2. Database schema (`scripts/db/schema.sql`)
3. API responses (when built)
4. React components (when built)

All interfaces match database column names exactly (snake_case) for direct mapping.

## Related Files
- `lib/utils/qc-data-loader.ts` - Utility functions using these types
- `build-data/assets/qc-data.json` - Source data matching QCDataJSON interface
- `scripts/db/schema.sql` - Database schema matching entity interfaces
- `scripts/db/import-data.ts` - Imports data using these type definitions
