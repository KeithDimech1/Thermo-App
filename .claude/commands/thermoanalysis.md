# Slash Command: /thermoanalysis

**Path:** `.claude/commands/thermoanalysis.md`
**Type:** Custom Slash Command
**Last Analyzed:** 2025-11-18

## What It Does

Creates comprehensive, indexed analysis of thermochronology research papers with AI-powered metadata extraction and integration with the `/thermoextract` data extraction workflow.

**Key Innovation:** Optimized for large PDFs (80-90% token savings) by extracting text first using Python, then analyzing the text instead of loading all PDF pages as images.

## Purpose

1. **Extract metadata** from research papers (authors, publication info, study location, methods)
2. **Extract geographic information** from papers (coordinates, elevations, location maps)
3. **Discover tables dynamically** from text (no hardcoded assumptions)
4. **Extract figures** with captions from PDF, identifying location maps
5. **Download supplemental material** from OSF/Zenodo repositories
6. **Generate indexed documentation** (paper-index.md, paper-analysis.md, figures.md)
7. **Enable fast navigation** for Claude to find information without re-reading entire paper
8. **Feed /thermoextract** with table locations and metadata for automated data extraction

## Usage

```bash
/thermoanalysis
```

**User provides:**
- PDF file path
- Optional: Custom folder name (defaults to AUTHOR(YEAR)-TITLE-JOURNAL format)

**Prerequisites:**
- PDF must be readable (not corrupted or image-only scans)
- Python environment with PyMuPDF (fitz), pandas, requests

## Workflow Steps (11 Steps)

### Step 1: Setup and Text Extraction
- Creates folder structure in `build-data/learning/thermo-papers/[PAPER_NAME]/`
- Checks document size (page count)
- **Extracts text FIRST** using PyMuPDF (minimal token usage)
- Generates `text/plain-text.txt` (full text extraction)
- Generates `text/layout-data.json` (spatial metadata: bboxes, columns, table regions)
- Extracts metadata from plain text (no PDF viewing needed)

### Step 2: Discover Tables Dynamically
- Scans plain text for table references (e.g., "Table 1", "Table A2")
- Uses regex patterns to detect table types (AFT, He, Metadata, Chemistry)
- Estimates page numbers from text positions
- Loads `layout-data.json` to find table bounding boxes
- **Detects column positions** via X-coordinate clustering (90%+ accuracy)
- Creates table metadata list with bbox coordinates and column info

### Step 3: Generate Text Index
- Creates `text/text-index.md` with:
  - Discovered tables summary
  - Column counts and positions for each table
  - Spatial metadata (bbox, column X-coordinates)
- Saves reusable metadata for `/thermoextract` workflow

### Step 4: Detect Exact Table Page Numbers
- Scans `plain-text.txt` to find exact table locations
- **Detects multi-page tables** (e.g., "Table 2 (continued)")
- Generates `text/table-pages.json` with:
  - Single-page tables: `{"pages": [9], "page_range": "9"}`
  - Multi-page tables: `{"pages": [10, 11], "page_range": "10-11", "is_multipage": true}`
- Identifies missing tables (referenced but not present)

### Step 5: Extract Images from PDF
- Creates `images/` directory
- **First pass:** Extracts figure captions from PDF text using regex
  - Pattern: `Figure X. Caption text` or `Fig. X. Caption text`
  - Keeps **full descriptions** (no truncation) for database import
  - **Detects location maps** by scanning captions for keywords: "map", "location", "site", "study area", "shaded relief", "topographic", "satellite", "coordinates", "sample locations"
- **Second pass:** Extracts images and matches to captions by page proximity
- Generates `images/image-metadata.json` (structured JSON for database)
  - **Flags location maps:** Adds `is_location_map: true` and `location_info` field
  - **Extracts coordinate references** from captions
- Generates `figures.md` (human-readable markdown with figure descriptions and previews)

### Step 6: Download OSF Supplemental Material
- Scans text for OSF/Zenodo/Figshare repository links
- Uses OSF API to list all files in repository
- **Downloads recursively** (root files + subfolders)
- Creates `supplemental/` directory with all files
- Inspects Excel files (shows sheet names, row/column counts)
- Generates `supplemental/README.md` documenting downloads

### Step 7: Create Paper Index (paper-index.md)
Generates quick-reference guide with:
- **Publication metadata:** Citation, authors, year, journal, DOI
- **Study details:** Location, mineral, method, lab, sample count, age range
- **Geographic information:**
  - Coordinates (lat/long, UTM, easting/northing)
  - Elevation ranges
  - Regional location descriptions
  - References to location map figures
- **Document structure:** Navigation table with anchor links
- **Data tables:** Table list with **exact page numbers** from `table-pages.json`
  - Format: `Table 1: Page 9`, `Table 2: Pages 10-11 (multi-page)`
  - Notes on missing tables (referenced but not found)
- **Quick facts:** Sample ID regex, column naming, age type, chemistry data
- **Key findings:** 5 key results from paper
- **Database relevance:** Schema alignment rating, field mappings

### Step 8: Create Full Analysis (paper-analysis.md)
Generates comprehensive analysis with 12 sections:
1. **Executive Summary** - 2-3 paragraphs
2. **Key Problem Addressed** - Gap filled, specific problems
3. **Methods/Study Design** - Analytical methods, equations, statistical methods
4. **Results** - Age determinations, track lengths, interpretations
5. **Data Tables in Paper** - Column descriptions, extraction notes, **exact page numbers**
6. **EDM vs LA-ICP-MS Comparison** (if applicable)
7. **Relevance to Database** - Schema mappings (samples, ft_datapoints, ft_count_data, etc.)
8. **Visualization Opportunities** - Radial plots, age-elevation profiles
9. **Statistical/Analytical Implementation** - Code examples (JS, SQL)
10. **Feature Ideas for Data Platform** - Prioritized feature list
11. **Key Quotes** - Important quotes with page numbers
12. **Action Items** - Immediate, short-term, long-term tasks

**All sections have `<a id="..."></a>` anchor tags for navigation**

### Step 9: Quality Check
Validates completeness:
- **paper-index.md:** All metadata, sample ID regex valid, tables listed, **page numbers accurate**
- **paper-analysis.md:** All 12 sections, anchor tags, database mappings, code examples
- **images/:** Images extracted, metadata JSON created, figure captions verified
- **text/:** plain-text.txt, layout-data.json, **table-pages.json** created
- **Integration readiness:** Sample ID regex, mineral type lowercase, method format

### Step 10: Summary Report
Reports what was created:
- Folder structure
- File counts and sizes
- Metadata extracted
- Tables identified (**with multi-page detection**)
- Images extracted
- Supplemental downloads
- Ready for /thermoextract status

### Step 11: Populate Database (Optional)
- Generates SQL scripts to populate `datasets` table
- Includes full citation, authors, publication details
- Includes study location, mineral, sample count, age range
- Includes FAIR score breakdown (if `extraction-report.md` exists)
- Tracks data files (RAW CSVs, FAIR templates, PDF, images)

## Output Structure

```
build-data/learning/thermo-papers/AUTHOR(YEAR)-TITLE-JOURNAL/
├── [PDF_NAME].pdf              # Original paper
├── paper-index.md              # Quick reference guide
├── paper-analysis.md           # Full 12-section analysis
├── figures.md                  # Human-readable figure descriptions
├── images/                     # Extracted figures
│   ├── page_1_img_0.png
│   ├── page_3_img_1.png
│   └── image-metadata.json     # JSON for database import
├── text/                       # Plain text extraction
│   ├── plain-text.txt          # Reusable full text
│   ├── layout-data.json        # Spatial metadata (bbox, columns)
│   ├── table-pages.json        # Exact table page numbers (NEW)
│   └── text-index.md           # Table discovery results
├── supplemental/               # OSF/Zenodo downloads (if available)
│   ├── README.md
│   ├── Tables_*.xlsx
│   └── [other files]
└── update-database-metadata.sql # Optional: Database population script
```

## Key Features

### Optimization for Large PDFs (ERROR-013 Resolution)
- **Before:** 78-page PDF = ~78 images loaded = 50,000 tokens
- **After:** Text extraction first = 5,000-10,000 tokens (80-90% savings)
- **Strategy:** Extract ONCE, reuse MANY times (text is cheap, images are expensive)

### Dynamic Table Discovery (IDEA-012)
- No hardcoded table assumptions
- Works for papers with 1 table or 20+ tables
- Detects table types automatically (AFT, He, Chemistry, Metadata)
- Provides bbox coordinates for targeted extraction

### Multi-Page Table Detection
- Automatically identifies tables spanning multiple pages
- Detects "Table X (continued)" patterns
- Documents page ranges (e.g., "10-11", "22-36")
- Flags missing tables (referenced but not found)

### Column Position Detection (IDEA-013)
- X-coordinate clustering (DBSCAN-like approach)
- 90%+ accuracy for multi-column tables
- Feeds real coordinates to `/thermoextract` (no heuristics needed)

### OSF/Zenodo Integration (IDEA-008)
- Automatic repository link detection
- API-based file downloads (no manual download needed)
- Recursive folder traversal
- Excel file inspection

### Figure Extraction with Captions
- Matches images to figure captions from PDF text
- **Full descriptions** preserved (not truncated)
- JSON format for database import
- Markdown format for human readability

## Database Interactions

**Tables Used:** None (this command generates documentation; does not write to database)

**Optional Database Population (Step 11):**
- Generates SQL scripts to populate `datasets` table
- Target table: `datasets`
- Fields: full_citation, publication_year, publication_journal, doi, study_location, laboratory, mineral_analyzed, sample_count, age_range_min_ma, age_range_max_ma, paper_summary

**Related Workflows:**
- Feeds metadata to `/thermoextract` for automated data import
- `/thermoextract` populates: `samples`, `ft_datapoints`, `ft_count_data`, `ft_track_length_data`, `he_whole_grain_data`

## Geographic Information Extraction (NEW)

When creating paper-index.md, extract and format geographic information as follows:

**In the Study Details section, add:**

```markdown
## 📍 Geographic Information

**Study Area:** [Regional description]

**Coordinates:**
- Latitude/Longitude: [e.g., 30-34°N, 100-105°E]
- UTM/Easting/Northing: [if provided]
- Elevation range: [e.g., 1,200-4,500m]

**Location Map References:**
- Figure X: [Brief description, e.g., "Regional map showing sample locations"]
- Figure Y: [e.g., "Site map with GPS coordinates"]

**Notes:**
- [Any additional geographic context from the paper]
```

**In image-metadata.json, add these fields for each figure:**

```json
{
  "filename": "page_3_img_0.png",
  "figure_number": "Figure 1",
  "description": "...",
  "is_location_map": true,  // NEW FIELD
  "location_info": {         // NEW FIELD
    "map_type": "regional_map",  // Options: regional_map, site_map, sample_locations, topographic, satellite
    "shows_coordinates": true,
    "shows_sample_locations": true,
    "coordinate_references": ["30-34°N", "100-105°E"],
    "notes": "Shaded relief map with sample site markers"
  }
}
```

**Detection keywords for location maps:**
- "map", "location", "site", "study area"
- "shaded relief", "topographic", "satellite", "DEM"
- "sample locations", "sample sites", "field area"
- "coordinates", "GPS", "lat/long", "easting", "northing"
- "index map", "regional map", "site map"

## Integration with /thermoextract

`/thermoanalysis` prepares metadata that `/thermoextract` uses for automated data extraction:

**Metadata Flow:**
1. `/thermoanalysis` creates `paper-index.md` with table locations and **exact page numbers**
2. `/thermoanalysis` creates `text/table-pages.json` with precise page ranges
3. `/thermoextract` reads `paper-index.md` to identify tables
4. `/thermoextract` uses **table-pages.json** to know which pages to extract
5. `/thermoextract` uses sample ID regex for validation
6. `/thermoextract` uses database field mappings for transformation

**Critical Handoff Points:**
- **Sample ID Pattern:** Regex pattern for filtering valid samples (e.g., `^MU\d{2}-\d{2}$`)
- **Table Page Numbers:** Exact pages from `table-pages.json` (e.g., `{"Table 1": {"pages": [9], "page_range": "9"}}`)
- **Primary Table:** Identified in paper-index.md (which table has main dataset)
- **Column Structure:** Numbered vs Named columns, uncertainty format
- **Database Mappings:** Field-level mappings to schema v2 tables

## Notes

- **Status:** ✅ Production ready (ERROR-013 resolved - optimized for large PDFs)
- **Token Usage:** 80-90% reduction for large PDFs compared to direct PDF viewing
- **Backward Compatible:** Plain text format unchanged, existing workflows still work
- **Post-Migration Note:** Recommended for use after ERROR-006 (EarthBank schema migration) completes, though fully functional now. Database mapping templates will need minor updates when new schema is deployed. See ERROR-010 for details.

## Related Files

**Uses:**
- `.claude/commands/thermoanalysis.md` - This command file (1683 lines)

**Creates:**
- `paper-index.md` - Quick reference guide
- `paper-analysis.md` - Full analysis (12 sections)
- `figures.md` - Figure descriptions
- `text/plain-text.txt` - Reusable text extraction
- `text/layout-data.json` - Spatial metadata
- `text/table-pages.json` - Exact table page numbers
- `text/text-index.md` - Table discovery results
- `images/image-metadata.json` - Figure catalog
- `supplemental/README.md` - Download documentation
- `update-database-metadata.sql` - Optional database population script

**Feeds:**
- `/thermoextract` - Data extraction workflow

**Documentation:**
- `build-data/documentation/foundation/01-Kohn-2024-Reporting-Standards.md` - Field requirements
- `build-data/errors/live-errors.md` - ERROR-013 (resolved), ERROR-010 (blocked)

---

**Created:** 2025-11-18
**Last Updated:** 2025-11-18
