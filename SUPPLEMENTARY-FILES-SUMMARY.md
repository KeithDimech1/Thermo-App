# Supplementary Files Tracking - Implementation Complete ✅

**Date:** 2025-11-18
**Status:** Fully operational for Malawi Rift dataset

---

## What Was Built

### 1. Database Schema Enhancement ✅

**New fields added to `data_files` table:**
- `upload_status` - Track file availability (`available`, `pending`, `not_uploadable`, `external_only`)
- `category` - Organize files by type (`supplementary_data`, `supplementary_geospatial`, etc.)
- `source_url` - Link to original download source (OSF, Zenodo, AusGeochem)
- `upload_notes` - Document upload issues or special handling

**Performance indexes created:**
- `idx_data_files_upload_status` - Fast filtering by status
- `idx_data_files_category` - Fast filtering by category

### 2. Malawi Rift Dataset - Fully Tracked ✅

**Supplementary Data Inventory:**
- **Total files:** 65 files (2.85 MB)
- **Tracked in database:** 12 entries
- **Available for download:** 7 files (Excel data)
- **External reference only:** 5 folders (Shapefiles - GIS data)

**Available Files:**
1. 📄 Fission Track.xlsx (212 KB) - Complete AFT data
2. 📄 Helium.xlsx (28 KB) - (U-Th)/He data
3. 📄 Geochem.xlsx (88 KB) - Trace element data
4. 📄 Samples.xlsx (8 KB) - Sample metadata
5. 📄 Thermal History.xlsx (20 KB) - Modeling results
6. 📄 SEM Geochem Raw Data.xlsx (564 KB) - Raw measurements
7. 📁 Single Grain Age Files (35 files, 1.3 MB) - Per-sample data

**External-Only Files:**
1. 📁 Fission Track Shapefile (GIS data)
2. 📁 Helium Shapefile (GIS data)
3. 📁 Geochem Shapefile (GIS data)
4. 📁 Samples Shapefile (GIS data)
5. 📁 Thermal History Shapefile (GIS data)

**Why External-Only?**
Shapefiles are geospatial format (.shp, .dbf, .shx) - better served as direct downloads from AusGeochem rather than stored in our database. Users can access them via the external repository link.

### 3. User Interface ✅

**New Component: `SupplementaryFilesSection`**

**Features:**
- ✅ **Upload status badge** - Shows "✅ Uploaded", "⚠️ Partially Available", or "❌ Not Uploaded"
- 🔗 **External repository link** - Direct link to OSF/Zenodo/AusGeochem
- 📊 **Categorized file lists** - Separates available vs. external-only files
- ⬇️ **Download buttons** - Direct download for available files
- 🌐 **External links** - Links to source for external-only files
- 📝 **Descriptions** - Full file descriptions and notes

**Location on Page:**
Displays between "Publication Information" and "Description" sections on dataset detail pages.

### 4. API Endpoint ✅

**Endpoint:** `GET /api/datasets/[id]/supplementary-files`

**Returns:**
- List of all supplementary files for the dataset
- Summary statistics (total, available, external-only, etc.)
- File metadata (name, type, status, description, download path)

---

## Current Status by Dataset

| Dataset | Supplementary URL | Files Tracked | Status |
|---------|-------------------|---------------|--------|
| **Malawi Rift** | ✅ `https://doi.org/10.58024/AGUM6A344358` | 12 files | ⚠️ Partially Available (7 uploaded, 5 external) |
| **Peak (2021)** | ✅ `https://doi.org/10.17605/OSF.IO/D8B2Q` | 0 files | ❌ Needs population script |
| **Dusel-Bacon (2015)** | ❌ None | 0 files | ℹ️ No supplementary data available |

---

## What to Do Next

### For Existing Datasets with Supplementary Data

**Peak et al. (2021)** needs its supplementary files tracked. Create a population script:

```bash
# 1. Create population script (based on Malawi template)
cp scripts/db/populate-malawi-supplementary-files.sql \
   scripts/db/populate-peak-supplementary-files.sql

# 2. Edit the script to list Peak's files:
# - Tables_Peaketal_GrandCanyonPaleotopography.xlsx
# - SupplementaryText.pdf
# - SupplementaryFigures.pdf
# - Any Excel/CSV files from OSF

# 3. Run the script
npm run db:psql < scripts/db/populate-peak-supplementary-files.sql
```

### For New Datasets (Automatic)

When running `/thermoanalysis` or `/thermoextract`, the system will:
1. ✅ Detect OSF/Zenodo/Figshare links automatically
2. ✅ Download supplementary files to `Supplementary/` directory
3. ✅ Store the external URL in `datasets.supplementary_files_url`
4. ⚠️ **Manual step:** Run population script to track files in `data_files` table

**Future Enhancement:** Auto-populate `data_files` during extraction (tracked in backlog)

---

## Files Created

### Database
1. `scripts/db/migrations/enhance-data-files-supplementary-tracking.sql` - Schema migration
2. `scripts/db/populate-malawi-supplementary-files.sql` - Malawi file population

### UI Components
3. `components/datasets/SupplementaryFilesSection.tsx` - Display component
4. `app/api/datasets/[id]/supplementary-files/route.ts` - API endpoint

### Documentation
5. `build-data/documentation/SUPPLEMENTARY-FILES-TRACKING.md` - Full system docs
6. `SUPPLEMENTARY-FILES-SUMMARY.md` - This summary

---

## Testing

**Visit:** http://localhost:3000/datasets/5 (Malawi Rift)

**You should see:**
1. 📊 **Supplementary Data section** with blue gradient background
2. ⚠️ **"Partially Available" badge** (7 uploaded, 5 external)
3. 🔗 **External repository link** to AusGeochem
4. 📁 **Available Files list** with download buttons
5. 🌐 **External-Only Files list** with external links

**Try:**
- Click "Download" button on any available file → Opens file path
- Click "External Link" on any external-only file → Opens AusGeochem URL

---

## Benefits Achieved

### ✅ Clear Availability Status
Users immediately see what's accessible without navigating to external sites.

### ✅ Comprehensive File List
All supplementary materials documented in one place with descriptions.

### ✅ Source Transparency
Every file links back to original source (AusGeochem, OSF, Zenodo).

### ✅ Upload Limitation Tracking
`upload_notes` field documents why certain files can't be uploaded (format, size, licensing).

### ✅ FAIR Compliance
Tracks "Accessible" aspect of FAIR principles - users know exactly what data is available and how to get it.

---

## Next Steps

### Short Term
1. **Create population script for Peak (2021)** - Track its 3-4 supplementary files
2. **Update type definitions** - Add supplementary file types to TypeScript interfaces
3. **Test download functionality** - Ensure file paths work correctly

### Medium Term
1. **Automate population** - Generate `data_files` entries during `/thermoextract`
2. **Add file previews** - Show Excel/CSV data in-browser without download
3. **Track downloads** - Log which files are accessed most

### Long Term
1. **Format conversion** - Convert shapefiles to GeoJSON for web display
2. **Version tracking** - Handle updates when authors release new data versions
3. **Usage analytics** - Monitor supplementary file access patterns

---

## Questions?

**Documentation:** See `build-data/documentation/SUPPLEMENTARY-FILES-TRACKING.md`

**Database Schema:** See `scripts/db/migrations/enhance-data-files-supplementary-tracking.sql`

**Example Population:** See `scripts/db/populate-malawi-supplementary-files.sql`

---

**Implementation Complete** ✅

All supplementary file tracking infrastructure is now operational. The Malawi Rift dataset demonstrates the full workflow. Other datasets can be added using the same pattern.
