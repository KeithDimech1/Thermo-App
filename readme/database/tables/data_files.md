# Table: `data_files`

**Last Schema Update:** 2025-11-24 08:08:00
**Schema Version:** Supporting table (snake_case - legacy schema)
**Row Count:** Variable (tracks all dataset supplementary files)

## Purpose

Tracks all supplementary files associated with datasets including source PDFs, extracted CSVs, table images, and analysis reports. This table manages the file storage system for the thermochronology extraction workflow, linking files to their parent datasets.

**Key Features:**
- Complete file metadata (name, path, size, MIME type)
- File categorization (primary_paper, extracted_csv, table_image, etc.)
- Upload status tracking (available, uploading, failed)
- Links to dataset records
- Source URL tracking for web-uploaded files

## Schema (Bones)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | integer | PK, NOT NULL, AUTO-INCREMENT | Internal primary key |
| `dataset_id` | integer | FK | References datasets table |
| `file_type` | varchar(50) | NOT NULL | File type (pdf, csv, png, md) |
| `file_path` | text | NOT NULL | Full path to file in storage |
| `file_name` | text | NOT NULL | Original filename |
| `file_size_bytes` | bigint | | File size in bytes |
| `mime_type` | varchar(100) | | MIME type (application/pdf, text/csv) |
| `description` | text | | Human-readable file description |
| `created_at` | timestamp | DEFAULT CURRENT_TIMESTAMP | File upload timestamp |
| `category` | varchar(100) | | File category (see below) |
| `upload_status` | varchar(50) | DEFAULT 'available' | Status (available, uploading, failed) |
| `display_name` | text | | User-friendly display name |
| `is_folder` | boolean | DEFAULT false | True if represents folder |
| `source_url` | text | | Original URL if web-uploaded |
| `upload_notes` | text | | Additional upload metadata |
| `row_count` | integer | | Number of rows (for CSV files) |
| `updated_at` | timestamp | DEFAULT CURRENT_TIMESTAMP | Last modification timestamp |

**Indexes:**
- Primary key on `id`
- B-tree indexes on: `dataset_id`, `file_type`, `category`, `upload_status`

## Relationships

### Foreign Keys
- `dataset_id` → `datasets.id` (ON DELETE CASCADE)

### Referenced By
None (this is a supporting table)

**Note:** Deleting a dataset cascades to all associated files

## File Categories

**Primary Paper:**
- `primary_paper` - Original research paper PDF

**Extracted Data:**
- `extracted_csv` - CSV files from table extraction
- `table_image` - PNG screenshots of tables
- `extraction_report` - Markdown analysis reports

**Templates:**
- `earthbank_template` - EarthBank Excel templates
- `fair_template` - FAIR-formatted CSV templates

**Supplementary:**
- `supplementary_file` - Additional supporting files
- `analysis_output` - Generated analysis results

## Used By (Code Files)

**Write Operations (INSERT/UPDATE):**
- `scripts/db/load-dataset-from-paper.ts` - Creates file records during extraction
- `scripts/db/backfill-csvs-for-datasets.ts` - Backfills CSV file records
- `scripts/db/populate-malawi-files.ts` - Populates file metadata
- `lib/db/extraction-queries.ts` - File creation during extraction workflow

**Read Operations (SELECT):**
- `app/datasets/[id]/data/page.tsx` - Lists dataset files in UI
- `app/api/datasets/[id]/supplementary-files/route.ts` - API for file listing
- `app/api/datasets/files/[id]/route.ts` - Individual file access
- `app/api/datasets/[id]/download-all/route.ts` - Bulk file download
- `lib/db/queries.ts` - Core query functions

**Cleanup Operations (DELETE):**
- `scripts/storage/cleanup-orphaned-buckets.ts` - Removes orphaned files
- `scripts/storage/cleanup-old-extractions.ts` - Cleans old extraction files
- `scripts/storage/cleanup-all-old-buckets.ts` - Full cleanup utility

## Business Rules

**File Storage:**
- Files stored in Vercel Blob storage or local filesystem
- `file_path` contains full storage path
- `source_url` tracks original web location (if uploaded via URL)

**Upload Status Flow:**
- `uploading` → File transfer in progress
- `available` → File ready for access
- `failed` → Upload or processing error

**Cascading Deletes:**
- Deleting dataset removes all associated file records
- Physical file cleanup handled separately by storage scripts

**File Types:**
- `pdf` - Original papers, reports
- `csv` - Extracted data tables
- `png`, `jpg` - Table screenshots
- `md` - Markdown analysis reports
- `xlsx` - EarthBank templates

## Critical SQL Syntax

```sql
-- Get all files for a dataset
SELECT file_name, file_type, category, file_size_bytes
FROM data_files
WHERE dataset_id = 123
ORDER BY category, file_name;

-- Find CSV files with row counts
SELECT file_name, row_count, file_size_bytes
FROM data_files
WHERE file_type = 'csv' AND row_count IS NOT NULL
ORDER BY row_count DESC;

-- Get total storage used by dataset
SELECT
  dataset_id,
  SUM(file_size_bytes) as total_bytes,
  COUNT(*) as file_count
FROM data_files
GROUP BY dataset_id;

-- Find failed uploads
SELECT dataset_id, file_name, upload_notes, created_at
FROM data_files
WHERE upload_status = 'failed'
ORDER BY created_at DESC;
```

## Recent Changes

**2025-11-21 (Supabase Migration):** Table migrated to Supabase
- Maintained snake_case naming (legacy schema)
- Added indexes for performance
- CASCADE deletes configured

## Related Tables

→ [datasets](datasets.md) - Parent dataset metadata
→ [extraction_sessions](extraction_sessions.md) - Extraction workflow tracking

## Storage Integration

**Vercel Blob Storage:**
- Production files stored in Vercel Blob
- `file_path` contains blob URL
- Automatic CDN distribution

**Local Development:**
- Files in `public/data/datasets/[dataset_id]/`
- `file_path` contains relative path

**Cleanup Strategy:**
- Orphaned files detected by comparing DB records to storage
- Old extraction sessions cleaned after 30 days
- Manual cleanup scripts available in `scripts/storage/`

## File Categories Explained

**primary_paper:**
- The original published research paper
- Usually PDF format
- Source for data extraction

**extracted_csv:**
- Tables extracted from paper
- CSV format for database import
- One file per table

**table_image:**
- PNG screenshots of tables from PDF
- Used for visual verification
- Stored alongside CSV files

**extraction_report:**
- Markdown report with extraction metadata
- Includes paper analysis, table counts, FAIR assessment
- Generated by `/thermoextract` command

**earthbank_template:**
- Excel templates matching EarthBank specification
- Ready for manual editing or import
- Version-tracked by filename

## API Endpoints

**List files:**
- `GET /api/datasets/[id]/supplementary-files`

**Download single file:**
- `GET /api/datasets/files/[id]`

**Download all files (ZIP):**
- `GET /api/datasets/[id]/download-all`

## Common Queries

**Find large files (>10 MB):**
```sql
SELECT file_name, file_size_bytes / 1024 / 1024 as size_mb
FROM data_files
WHERE file_size_bytes > 10485760
ORDER BY file_size_bytes DESC;
```

**Count files by category:**
```sql
SELECT category, COUNT(*) as count
FROM data_files
GROUP BY category
ORDER BY count DESC;
```

**Recent uploads:**
```sql
SELECT file_name, category, created_at
FROM data_files
ORDER BY created_at DESC
LIMIT 20;
```
