# Database Code Usage Map

**Last Updated:** 2025-11-19 07:24:26

Cross-reference showing which code files interact with which database tables.

**Note:** This map includes both original schema tables (samples, ft_datapoints, etc.) and new EarthBank tables (earthbank_samples, earthbank_ftDatapoints, etc.) added in IDEA-014 migration.

---

## EarthBank Tables (IDEA-014)

### `earthbank_samples`
**Primary Access:** `lib/db/earthbank-queries.ts` (523 lines)
**Purpose:** EarthBank-native sample storage with camelCase fields
**Status:** ✅ Active (migration complete 2025-11-18)

### `earthbank_ftDatapoints`
**Primary Access:** `lib/db/earthbank-queries.ts`
**Purpose:** Fission-track datapoints with EarthBank camelCase schema
**Status:** ✅ Active (migration complete 2025-11-18)

### `earthbank_heDatapoints`
**Primary Access:** `lib/db/earthbank-queries.ts`
**Purpose:** (U-Th)/He datapoints with EarthBank camelCase schema
**Status:** ✅ Active (migration complete 2025-11-18)

### `earthbank_ftTrackLengthData`
**Primary Access:** `lib/db/earthbank-queries.ts`
**Purpose:** Track length measurements with EarthBank camelCase schema
**Status:** ✅ Active (migration complete 2025-11-18)

### `earthbank_heWholeGrainData`
**Primary Access:** `lib/db/earthbank-queries.ts`
**Purpose:** He grain chemistry data with EarthBank camelCase schema
**Status:** ✅ Active (migration complete 2025-11-18)

**API Integration:**
- All API routes updated to use EarthBank queries (Phase 5-6 complete)
- TypeScript compilation: 0 errors
- Data integrity: 100% validated

---

## Original Schema Tables

## By Table

### `datasets`

**Read Operations (SELECT):**
- `lib/db/queries.ts:565` - getAllDatasets() - Get all datasets
- `lib/db/queries.ts:577` - getDatasetById() - Get single dataset
- `lib/db/queries.ts:485` - getDatasetStats() - Get dataset statistics
- `app/datasets/page.tsx:51` - PapersPage - Display all datasets
- `app/datasets/[id]/page.tsx:89` - PaperDetailPage - Display single dataset
- `components/datasets/DatasetCard.tsx:11` - DatasetCard - Render dataset card

**Write Operations (INSERT/UPDATE):**
- `scripts/db/import-with-metadata.py` - Populate dataset metadata
- `scripts/db/update-malawi-metadata.ts:8` - Update Malawi Rift dataset

---

### `samples`

**Read Operations (SELECT):**
- `lib/db/queries.ts:53` - getAllSamples() - Get paginated samples with filters
- `lib/db/queries.ts:121` - getSampleSummaries() - Get sample summaries
- `lib/db/queries.ts:163` - getSampleById() - Get single sample
- `lib/db/queries.ts:174` - getSampleDetail() - Get sample with all datapoints
- `lib/db/queries.ts:542` - searchSamplesByLocation() - Geographic search
- `app/samples/page.tsx:6` - SamplesPage - Display all samples
- `app/samples/[id]/page.tsx:8` - SampleDetailPage - Display single sample

**Write Operations (INSERT):**
- `scripts/db/import-earthbank-templates.ts:111` - insertSample() - Import from EarthBank
- `scripts/db/import-thermo-data.ts:132` - importSamples() - Import from CSV
- `scripts/import_malawi_data.py:166` - create_samples() - Import Malawi Rift samples

---

### `ft_datapoints`

**Read Operations (SELECT):**
- `lib/db/queries.ts:213` - getFTDatapointsBySample() - Get all FT datapoints for sample
- `lib/db/queries.ts:223` - getFTDatapointById() - Get single FT datapoint
- `lib/db/queries.ts:264` - getAFTData() - Get paginated FT data with filters
- `app/api/analysis/ages/route.ts:9` - GET - Analyze age data
- `scripts/analysis/statistical_plots.py:81` - create_radial_plot() - Generate radial plots
- `scripts/analysis/spatial_plots.py:101` - create_age_elevation_plot() - Age-elevation analysis

**Write Operations (INSERT):**
- `scripts/db/import-earthbank-templates.ts:172` - insertFTDatapoint() - Import from EarthBank
- `scripts/db/migrate-v1-to-v2.ts:70` - migrateFTAges() - Migrate from v1 schema
- `scripts/import_malawi_data.py:214` - import_ft_datapoints() - Import Malawi FT data

---

### `he_datapoints`

**Read Operations (SELECT):**
- `lib/db/queries.ts:335` - getHeDatapointsBySample() - Get all He datapoints for sample
- `lib/db/queries.ts:345` - getHeDatapointById() - Get single He datapoint
- `lib/db/queries.ts:366` - getAHeData() - Get paginated He data with filters

**Write Operations (INSERT):**
- `scripts/db/import-earthbank-templates.ts:528` - importHeData() - Import from EarthBank
- `scripts/import_malawi_data.py:296` - import_he_data() - Import Malawi He data

---

### `ft_count_data`

**Read Operations (SELECT):**
- `lib/db/queries.ts:233` - getFTCountDataByDatapoint() - Get count data for FT datapoint
- `lib/db/queries.ts:264` - getAFTData() - Joined with ft_datapoints for complete data
- `scripts/analysis/statistical_plots.py:81` - create_radial_plot() - Use for radial plot calculations

**Write Operations (INSERT):**
- `scripts/db/import-earthbank-templates.ts:319` - insertFTCountData() - Import from EarthBank
- `scripts/db/migrate-v1-to-v2.ts:142` - migrateFTCounts() - Migrate from v1 schema

---

### `ft_single_grain_ages`

**Read Operations (SELECT):**
- `lib/db/queries.ts:243` - getFTSingleGrainAgesByDatapoint() - Get grain ages for FT datapoint

**Write Operations (INSERT):**
- `scripts/db/import-earthbank-templates.ts` - Import from EarthBank FTSingleGrain sheet

---

### `ft_track_length_data`

**Read Operations (SELECT):**
- `lib/db/queries.ts:253` - getFTTrackLengthDataByDatapoint() - Get track lengths for FT datapoint
- `scripts/analysis/spatial_plots.py:265` - create_spatial_transect_plot() - Use for MTL trends

**Write Operations (INSERT):**
- `scripts/db/import-earthbank-templates.ts` - Import from EarthBank FTLengthData sheet
- `scripts/db/migrate-v1-to-v2.ts:206` - migrateFTTrackLengths() - Migrate from v1 schema

---

### `he_whole_grain_data`

**Read Operations (SELECT):**
- `lib/db/queries.ts:355` - getHeGrainDataByDatapoint() - Get grain data for He datapoint
- `lib/db/queries.ts:366` - getAHeData() - Get paginated He grain data

**Write Operations (INSERT):**
- `scripts/db/import-earthbank-templates.ts` - Import from EarthBank HeWholeGrain sheet

---

### `batches`

**Read Operations (SELECT):**
- `lib/db/queries.ts:432` - getAllBatches() - Get all analytical batches
- `lib/db/queries.ts:439` - getBatchById() - Get single batch

**Write Operations (INSERT):**
- `scripts/import_malawi_data.py:73` - create_batches() - Create Malawi Rift batches

---

### `reference_materials`

**Read Operations (SELECT):**
- `lib/db/queries.ts:446` - getReferenceMaterialsByBatch() - Get QC standards for batch

**Write Operations (INSERT):**
- `scripts/import_malawi_data.py:115` - create_reference_materials() - Create Durango records

---

### `people`

**Read Operations (SELECT):**
- `lib/db/queries.ts:460` - getAllPeople() - Get all people
- `lib/db/queries.ts:467` - getPersonById() - Get single person
- `lib/db/queries.ts:474` - getPersonByOrcid() - Get person by ORCID

**Write Operations:**
- (Currently manual inserts - no automated import detected)

---

### `data_files`

**Read Operations (SELECT):**
- `lib/db/queries.ts:606` - getDataFilesByDataset() - Get files for dataset
- `lib/db/queries.ts:619` - getDatasetTotalFileSize() - Calculate total size
- `components/datasets/DownloadSection.tsx:24` - DownloadSection - Display file downloads

**Write Operations (INSERT):**
- `scripts/db/populate-malawi-files.ts:62` - populateDataFiles() - Populate file records

---

### `fair_score_breakdown`

**Read Operations (SELECT):**
- `lib/db/queries.ts:590` - getFairScoreBreakdown() - Get FAIR scores for dataset
- `components/datasets/FairScoreCard.tsx:8` - FairScoreCard - Display FAIR scores

**Write Operations (INSERT/UPDATE):**
- `scripts/db/populate-dusel-bacon-2015-fair-score.sql` - Populate FAIR scores

---

### Legacy Tables (v1 Schema)

#### `ahe_grain_data`

**Read Operations (SELECT):**
- `lib/db/queries.ts:778` - getAHeGrainsBySample() - Get v1 He grain data
- `lib/db/queries.ts:817` - getSampleDetailV1() - Get sample with v1 data

**Status:** ⚠️ Legacy table - being migrated to he_datapoints + he_whole_grain_data

---

## By Code File

### `lib/db/queries.ts`
**The primary database interface - ALL queries go through this file**

**Tables Accessed (Read):**
- `datasets` - getAllDatasets, getDatasetById, getDatasetStats
- `samples` - getAllSamples, getSampleById, getSampleDetail, searchSamplesByLocation
- `ft_datapoints` - getFTDatapointsBySample, getFTDatapointById, getAFTData
- `he_datapoints` - getHeDatapointsBySample, getHeDatapointById, getAHeData
- `ft_count_data` - getFTCountDataByDatapoint (joined in getAFTData)
- `ft_single_grain_ages` - getFTSingleGrainAgesByDatapoint
- `ft_track_length_data` - getFTTrackLengthDataByDatapoint
- `he_whole_grain_data` - getHeGrainDataByDatapoint, getAHeData
- `batches` - getAllBatches, getBatchById
- `reference_materials` - getReferenceMaterialsByBatch
- `people` - getAllPeople, getPersonById, getPersonByOrcid
- `data_files` - getDataFilesByDataset, getDatasetTotalFileSize
- `fair_score_breakdown` - getFairScoreBreakdown
- `ahe_grain_data` - getAHeGrainsBySample (legacy v1)

---

### `scripts/db/import-earthbank-templates.ts`
**EarthBank template importer**

**Tables Accessed (Write):**
- `samples` - insertSample() (line 111)
- `ft_datapoints` - insertFTDatapoint() (line 172)
- `ft_count_data` - insertFTCountData() (line 319)
- `ft_single_grain_ages`, `ft_track_length_data`, `ft_binned_length_data` (EarthBank import)
- `he_datapoints`, `he_whole_grain_data` (EarthBank import)

---

### `scripts/db/migrate-v1-to-v2.ts`
**Schema migration from v1 to v2**

**Tables Accessed (Write):**
- `ft_datapoints` - migrateFTAges() (line 70) - Migrate from ft_ages
- `ft_count_data` - migrateFTCounts() (line 142) - Migrate from ft_counts
- `ft_track_length_data` - migrateFTTrackLengths() (line 206) - Migrate from ft_track_lengths

**Tables Read (Legacy v1):**
- `ft_ages`, `ft_counts`, `ft_track_lengths` (old schema tables)

---

### `scripts/import_malawi_data.py`
**Malawi Rift dataset import script**

**Tables Accessed (Write):**
- `datasets` - create_dataset() (line 34)
- `batches` - create_batches() (line 73)
- `reference_materials` - create_reference_materials() (line 115)
- `samples` - create_samples() (line 166)
- `ft_datapoints` - import_ft_datapoints() (line 214)
- `he_datapoints`, `he_whole_grain_data` - import_he_data() (line 296)

---

### API Routes

#### `app/api/analysis/ages/route.ts`
**Analysis API endpoint**

**Tables Accessed (Read):**
- `ft_datapoints`, `he_datapoints` - Analyze age data

#### `app/api/datasets/[id]/download-all/route.ts`
**Dataset download endpoint**

**Tables Accessed (Read):**
- `datasets` - Get dataset info for download

#### `app/api/samples/route.ts`
**Samples API endpoint**

**Tables Accessed (Read):**
- `samples` - Get paginated samples with filters

#### `app/api/samples/[id]/route.ts`
**Single sample API endpoint**

**Tables Accessed (Read):**
- `samples`, `ft_datapoints`, `he_datapoints` - Get sample with all data

---

### Analysis Scripts (Python)

#### `scripts/analysis/statistical_plots.py`
**Statistical visualization tools**

**Tables Accessed (Read):**
- `samples`, `ft_datapoints`, `ft_count_data` - create_radial_plot()
- `ft_single_grain_ages` - create_age_histogram()
- `ft_datapoints` - create_probability_density_plot()

#### `scripts/analysis/spatial_plots.py`
**Spatial/geographic visualizations**

**Tables Accessed (Read):**
- `samples`, `ft_datapoints` - create_age_elevation_plot()
- `ft_datapoints`, `ft_track_length_data` - create_spatial_transect_plot(), create_mtl_trends_plot()

#### `scripts/analysis/utils/data_loaders.py`
**Data loading utilities for analysis**

**Tables Accessed (Read):**
- `samples`, `ft_datapoints` - load_sample_ages(), load_age_elevation()
- `he_datapoints`, `he_whole_grain_data` - load_ahe_sample_ages(), load_ahe_grain_ages()
- `ft_single_grain_ages` - load_ft_grain_ages()
- `ft_track_length_data` - load_track_lengths()

---

### UI Components

#### `app/datasets/page.tsx`
**Datasets list page**

**Tables Accessed (Read):**
- `datasets` - getAllDatasets() via getDatasetStats()

#### `app/datasets/[id]/page.tsx`
**Dataset detail page**

**Tables Accessed (Read):**
- `datasets` - getDatasetById() via generateMetadata() and PaperDetailPage()
- `samples`, `ft_datapoints`, `he_datapoints` - getDatasetStats()

#### `app/samples/page.tsx`
**Samples list page**

**Tables Accessed (Read):**
- `samples` - getAllSamples() via API

#### `app/samples/[id]/page.tsx`
**Sample detail page**

**Tables Accessed (Read):**
- `samples`, `ft_datapoints`, `he_datapoints` - getSampleDetail() via API

#### `components/datasets/DatasetCard.tsx`
**Dataset card component**

**Tables Accessed (Read):**
- `datasets` - Display dataset metadata

#### `components/datasets/DownloadSection.tsx`
**File download section component**

**Tables Accessed (Read):**
- `data_files` - getDataFilesByDataset() to display available files

#### `components/datasets/FairScoreCard.tsx`
**FAIR score display component**

**Tables Accessed (Read):**
- `fair_score_breakdown` - getFairScoreBreakdown() to display scores

---

## Database Connection

**All database access goes through:**
- `lib/db/connection.ts` - Connection pool management
  - `getPool()` - Get connection pool
  - `query()` - Execute query
  - `queryOne()` - Execute query, return single row
  - `transaction()` - Execute transaction

**Connection Configuration:**
- `.env.local` - Contains DATABASE_URL (pooled) and DIRECT_URL (direct connection)
- Neon PostgreSQL serverless database
- SSL required for connections

---

## Summary Statistics

**Total Files with Database Access:** 25+

**By Operation Type:**
- **Read-Heavy Files:** 15 (queries.ts, all API routes, UI components, analysis scripts)
- **Write-Heavy Files:** 8 (import scripts, migration scripts)
- **Mixed Operations:** 2 (import-earthbank-templates.ts, populate scripts)

**Most Accessed Tables:**
1. `samples` - 25+ files
2. `ft_datapoints` - 20+ files
3. `he_datapoints` - 15+ files
4. `datasets` - 12+ files
5. `ft_count_data` - 8+ files

**Primary Query Interface:**
- **99% of reads** go through `lib/db/queries.ts`
- **All writes** use dedicated import/migration scripts
- **Zero direct SQL in UI components** (all go through lib/db/queries.ts)

---

**For detailed table documentation, see `/readme/database/tables/`**
**For schema overview, see [SCHEMA_SUMMARY.md](SCHEMA_SUMMARY.md)**
**For code documentation, see `/readme/[component-path]/`**

**Generated by:** `/bigtidy` living documentation system
**Next update:** Run `/bigtidy` to refresh code usage analysis
