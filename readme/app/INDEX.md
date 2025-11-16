# App Directory Documentation Index

**Generated:** 2025-11-11
**Purpose:** Navigation hub for all app/ directory documentation
**Total Files Documented:** 22 files

---

## 📁 Directory Structure

```
app/
├── layout.tsx                          # Root layout with metadata
├── page.tsx                            # Landing page
├── globals.css                         # Global styles
│
├── (dashboard)/                        # Dashboard route group
│   ├── layout.tsx                      # Dashboard layout with Header & DatasetToggle
│   ├── dashboard/page.tsx              # Main dashboard with metrics
│   ├── markers/
│   │   ├── page.tsx                    # Markers list (grouped by category)
│   │   └── [id]/page.tsx               # Marker detail + configs
│   ├── manufacturers/
│   │   ├── page.tsx                    # Manufacturers list with performance
│   │   └── [id]/page.tsx               # Manufacturer detail + assays + configs
│   ├── configs/
│   │   └── [id]/page.tsx               # Test configuration detail
│   ├── assays/page.tsx                 # Assays table view
│   ├── compare/page.tsx                # Side-by-side comparison tool (client)
│   └── analytics/page.tsx              # Advanced visualizations
│
└── api/                                # API Routes
    ├── analytics/
    │   ├── route.ts                    # Overall stats + distributions
    │   └── dashboard-stats/route.ts    # Dashboard metrics
    ├── markers/
    │   ├── route.ts                    # GET all markers (with grouping/search)
    │   └── [id]/route.ts               # GET marker + configs
    ├── manufacturers/
    │   ├── route.ts                    # GET all manufacturers with performance
    │   └── [id]/route.ts               # GET manufacturer + assays + configs
    ├── configs/
    │   ├── route.ts                    # GET all configs (filtered, paginated)
    │   └── [id]/route.ts               # GET single config
    ├── compare/route.ts                # POST compare configs
    └── search/route.ts                 # GET global search
```

---

## 🎯 Quick Links by Function

### Root & Layouts

| File | Type | Purpose |
|------|------|---------|
| [layout.tsx](#root-layouttsx) | Root Layout | App metadata, font config, global structure |
| [page.tsx](#root-pagetsx) | Landing Page | Marketing homepage with feature cards |
| [(dashboard)/layout.tsx](#dashboard-layouttsx) | Dashboard Layout | Header, dataset toggle, container |

### Dashboard Pages (UI)

| Page | Route | Purpose | Data Source |
|------|-------|---------|-------------|
| [dashboard/page.tsx](#dashboardpagetsx) | `/dashboard` | Metrics overview | `/api/analytics/dashboard-stats` |
| [markers/page.tsx](#markerspagetsx) | `/markers` | Browse markers by category | `/api/markers?grouped=true` |
| [markers/[id]/page.tsx](#markersidpagetsx) | `/markers/[id]` | Marker detail + performance | `/api/markers/[id]` |
| [manufacturers/page.tsx](#manufacturerspagetsx) | `/manufacturers` | Browse manufacturers | `/api/manufacturers` |
| [manufacturers/[id]/page.tsx](#manufacturersidpagetsx) | `/manufacturers/[id]` | Manufacturer detail | `/api/manufacturers/[id]` |
| [configs/[id]/page.tsx](#configsidpagetsx) | `/configs/[id]` | Config detail + CV breakdown | `/api/configs/[id]` |
| [assays/page.tsx](#assayspagetsx) | `/assays` | Assays table | `/api/configs` |
| [compare/page.tsx](#comparepagetsx) | `/compare` | Side-by-side comparison | `/api/compare` |
| [analytics/page.tsx](#analyticspagetsx) | `/analytics` | Visualizations | Multiple query functions |

### API Routes (Data)

| Endpoint | Methods | Purpose | Database Access |
|----------|---------|---------|-----------------|
| [/api/analytics](#apianalyticsroutets) | GET | Overall stats | `getOverallStats()`, `getCVDistribution()`, `getQualityDistribution()` |
| [/api/analytics/dashboard-stats](#apianalyticsdashboard-statsroutets) | GET | Dashboard metrics | Direct SQL on test_configurations, cv_measurements, manufacturers |
| [/api/markers](#apimarkersroutets) | GET | List/search markers | `getAllMarkers()`, `getMarkersByCategory()`, `searchMarkers()` |
| [/api/markers/[id]](#apimarkersidroutets) | GET | Single marker + configs | `getMarkerById()`, `getConfigsByMarkerId()` |
| [/api/manufacturers](#apimanufacturersroutets) | GET | List manufacturers | `getAllManufacturers(dataset)` |
| [/api/manufacturers/[id]](#apimanufacturersidroutets) | GET | Manufacturer + assays | `getManufacturerById()`, `getAssaysByManufacturerId()`, `getConfigsByManufacturerId()` |
| [/api/configs](#apiconfigsroutets) | GET | List configs (filtered) | `getAllConfigs(filters, limit, offset)` |
| [/api/configs/[id]](#apiconfigsidroutets) | GET | Single config | `getConfigById(id)` |
| [/api/compare](#apicompareroutets) | POST | Compare configs | `compareConfigsWithContext(ids[])` |
| [/api/search](#apisearchroutets) | GET | Global search | Direct SQL across markers, manufacturers, assays |

---

## 🗄️ Database Interactions Summary

### By Table

| Table | Read By | Write By |
|-------|---------|----------|
| **test_configurations** | 10 endpoints | None (read-only app) |
| **cv_measurements** | 8 endpoints (via joins) | None |
| **markers** | 4 endpoints | None |
| **manufacturers** | 4 endpoints | None |
| **assays** | 2 endpoints | None |
| **qc_samples** | Via view joins | None |
| **pathogens** | Via view joins | None |
| **categories** | 2 endpoints | None |

### By View

| View | Used By |
|------|---------|
| **vw_test_config_details** | `/api/configs`, `/api/configs/[id]`, `/api/markers/[id]`, `/api/manufacturers/[id]`, `/api/compare` |
| **vw_manufacturer_performance** | `/api/manufacturers/[id]` |

**→ Full details:** [DATABASE_MAPPING.md](DATABASE_MAPPING.md)

---

## 📄 File Details

### Root Layout.tsx

**Path:** `app/layout.tsx`
**Type:** Root Layout Component
**Purpose:** Global app structure, metadata, font configuration

**What It Does:**
- Sets up Next.js metadata (title, description, OG tags, icons)
- Configures Inter font with CSS variable
- Provides HTML structure for all pages

**Database Interactions:** None

**Key Features:**
- SEO-optimized metadata
- Responsive font loading
- Favicon configuration

---

### Root Page.tsx

**Path:** `app/page.tsx`
**Type:** Landing Page
**Purpose:** Marketing homepage with app overview

**What It Does:**
- Displays stats cards (hardcoded: 132 configs, 48 excellent, etc.)
- Feature cards linking to /markers, /manufacturers, /assays
- CTA buttons to /dashboard and /compare

**Database Interactions:** None (static hardcoded stats)

**⚠️ Note:** Stats are hardcoded (not pulled from database). Consider making dynamic.

---

### Dashboard Layout.tsx

**Path:** `app/(dashboard)/layout.tsx`
**Type:** Layout Component
**Purpose:** Shared layout for all dashboard pages

**What It Does:**
- Renders Header component (navigation)
- Renders DatasetToggle component (curated/all)
- Wraps dashboard pages in container

**Database Interactions:** None (layout only)

**Components Used:**
- `Header` - Site navigation
- `DatasetToggle` - Dataset filter UI

---

### Dashboard/Page.tsx

**Path:** `app/(dashboard)/dashboard/page.tsx`
**Type:** Server Component (Dashboard Page)
**Route:** `/dashboard`

**What It Does:**
- Fetches dashboard statistics from API
- Displays quality metrics (total, excellent, good, acceptable, poor)
- Shows average CV <10% across all configs
- Displays top performers (manufacturers)
- Shows poor performers (configs needing review)
- Quick links to markers, manufacturers, assays

**Database Interactions (via API):**

**API Endpoint:** `/api/analytics/dashboard-stats?dataset={dataset}`

**Tables Accessed:**
- **test_configurations** - Quality rating counts, filtering by include_in_analysis
- **cv_measurements** - Average CV calculations, poor performer identification
- **manufacturers** - Top performer aggregation
- **markers** - Poor performer display
- **assays** - Poor performer display

**UI → Database Mapping:**

| UI Element | Database Source | Fields |
|------------|-----------------|--------|
| Total Configs | COUNT(*) FROM test_configurations | - |
| Excellent Count | COUNT WHERE quality_rating = 'excellent' | quality_rating |
| Good Count | COUNT WHERE quality_rating = 'good' | quality_rating |
| Poor Count | COUNT WHERE quality_rating = 'poor' | quality_rating |
| Avg CV <10% | AVG(cv_lt_10_percentage) | cv_measurements.cv_lt_10_percentage |
| Top Performers | AVG(cv_lt_10_percentage) GROUP BY manufacturer | manufacturers.name, cv_lt_10_percentage |
| Poor Performers | WHERE quality_rating = 'poor' ORDER BY cv_gt_20_percentage DESC | All config fields |

**Mock Data:** Yes (if DATABASE_URL not set)

**Dataset Filter:** ✅ Respects dataset query param

---

### Markers/Page.tsx

**Path:** `app/(dashboard)/markers/page.tsx`
**Type:** Server Component (List Page)
**Route:** `/markers`

**What It Does:**
- Fetches markers grouped by category
- Displays category cards (TORCH, Hepatitis, Retrovirus, etc.)
- Shows marker cards within each category
- Links to individual marker detail pages

**Database Interactions (via API):**

**API Endpoint:** `/api/markers?grouped=true`

**Tables Accessed:**
- **markers** - All marker data
- **categories** - Grouping and display

**Query Function:** `getMarkersByCategory()`

**UI → Database Mapping:**

| UI Element | Database Field | Table |
|------------|----------------|-------|
| Category Card Title | name | categories |
| Marker Count Badge | COUNT(markers) | markers |
| Marker Name | name | markers |
| Antibody Type Badge | antibody_type | markers |
| Marker Type Label | marker_type | markers |

**Schema Alignment:**
- ✅ All displayed fields exist in schema
- ⚠️ `clinical_use`, `interpretation_positive/negative` available but not shown (shown on detail page)

**Mock Data:** Yes (3 categories with sample markers)

---

### Markers/[id]/Page.tsx

**Path:** `app/(dashboard)/markers/[id]/page.tsx`
**Type:** Server Component (Detail Page)
**Route:** `/markers/[id]`

**What It Does:**
- Displays marker details with clinical context
- Shows performance summary (avg CV, quality counts)
- Lists all test configurations for this marker
- Each config shows manufacturer, assay, platform, CV breakdown

**Database Interactions (via API):**

**API Endpoint:** `/api/markers/[id]`

**Tables Accessed:**
- **markers** - Marker details
- **pathogens** - Pathogen context
- **categories** - Category badge
- **test_configurations** - Via configs array
- **cv_measurements** - Performance metrics
- **assays** - Assay names, platforms, methodologies
- **manufacturers** - Manufacturer names

**Query Functions:**
- `getMarkerById(id)`
- `getConfigsByMarkerId(id)`

**UI → Database Mapping:**

| UI Element | Database Field | Table |
|------------|----------------|-------|
| **Header Section** |
| Marker Name (H1) | name | markers |
| Antibody Type Badge | antibody_type | markers |
| Category Badge | categories.name | categories (via join) |
| Pathogen Name | pathogens.name | pathogens (via join) |
| **Clinical Context Card** |
| Clinical Use Text | clinical_use | markers |
| Positive Interpretation | interpretation_positive | markers |
| Negative Interpretation | interpretation_negative | markers |
| **Performance Summary** |
| Total Assays | COUNT(configs) | - (calculated) |
| Avg CV <10% | AVG(cv_lt_10_percentage) | cv_measurements |
| Excellent Count | COUNT WHERE quality_rating = 'excellent' | test_configurations |
| Good Count | COUNT WHERE quality_rating = 'good' | test_configurations |
| Poor Count | COUNT WHERE quality_rating = 'poor' | test_configurations |
| **Config Cards** |
| Assay Name | assays.name | assays |
| Manufacturer Name | manufacturers.name | manufacturers |
| Platform | assays.platform | assays |
| Methodology Badge | assays.methodology | assays |
| Quality Rating Badge | test_configurations.quality_rating | test_configurations |
| CV <10% | cv_lt_10_percentage | cv_measurements |
| CV 10-15% | cv_10_15_percentage | cv_measurements |
| CV 15-20% | cv_15_20_percentage | cv_measurements |
| Events Examined | test_configurations.events_examined | test_configurations |

**Schema Alignment:** ✅ All displayed fields exist in schema

**Mock Data:** Comprehensive mock with 3 configs

---

### Manufacturers/Page.tsx

**Path:** `app/(dashboard)/manufacturers/page.tsx`
**Type:** Server Component (List Page)
**Route:** `/manufacturers`

**What It Does:**
- Lists all manufacturers with performance metrics
- Shows avg CV <10% for each manufacturer
- Displays quality distribution (excellent/good/acceptable/poor counts)
- Progress bar visualization of quality breakdown
- Links to manufacturer detail pages

**Database Interactions (via API):**

**API Endpoint:** `/api/manufacturers?dataset={dataset}`

**Tables Accessed:**
- **manufacturers** - Manufacturer data
- **assays** - Via join for configs
- **test_configurations** - Config counts, quality ratings
- **cv_measurements** - CV performance metrics

**Query Function:** `getAllManufacturers(dataset)`

**UI → Database Mapping:**

| UI Element | Database Field | Calculation |
|------------|----------------|-------------|
| Manufacturer Name | manufacturers.name | Direct |
| Total Configs | COUNT(test_configurations.id) | Aggregated |
| Avg CV <10% | AVG(cv_measurements.cv_lt_10_percentage) | Aggregated |
| Excellent Count | COUNT WHERE quality_rating = 'excellent' | FILTER aggregate |
| Good Count | COUNT WHERE quality_rating = 'good' | FILTER aggregate |
| Acceptable Count | COUNT WHERE quality_rating = 'acceptable' | FILTER aggregate |
| Poor Count | COUNT WHERE quality_rating = 'poor' | FILTER aggregate |

**Schema Alignment:** ✅ All fields match schema (aggregates calculated correctly)

**Dataset Filter:** ✅ Respects dataset query param

**Mock Data:** Yes (4 manufacturers with stats)

---

### Manufacturers/[id]/Page.tsx

**Path:** `app/(dashboard)/manufacturers/[id]/page.tsx`
**Type:** Server Component (Detail Page)
**Route:** `/manufacturers/[id]`

**What It Does:**
- Displays manufacturer details (name, country, website)
- Shows overall performance summary
- Platform breakdown (if multiple platforms)
- Lists all assays by this manufacturer
- Lists all test configurations with full details

**Database Interactions (via API):**

**API Endpoint:** `/api/manufacturers/[id]`

**Tables Accessed:**
- **manufacturers** - Manufacturer info
- **assays** - All assays by manufacturer
- **test_configurations** - All configs
- **markers** - Marker names
- **cv_measurements** - Performance data

**Query Functions:**
- `getManufacturerById(id)`
- `getAssaysByManufacturerId(id)`
- `getConfigsByManufacturerId(id)`

**UI → Database Mapping:**

| UI Element | Database Field | Table |
|------------|----------------|-------|
| **Header** |
| Manufacturer Name | name | manufacturers |
| Country Badge | country | manufacturers |
| Website Link | website | manufacturers |
| Total Configs Badge | COUNT(configs) | calculated |
| **Performance Summary** |
| Total Configs | COUNT(configs) | calculated |
| Avg CV <10% | AVG(cv_lt_10_percentage) | cv_measurements |
| Quality Counts | COUNT by quality_rating | test_configurations |
| **Platform Breakdown** |
| Platform Name | assays.platform | assays (grouped) |
| Platform Avg CV | AVG(cv_lt_10_percentage) | per platform |
| **Config Cards** |
| Marker Name (link) | markers.name | markers |
| Assay Name | assays.name | assays |
| Platform | assays.platform | assays |
| Methodology | assays.methodology | assays |
| Quality Rating | quality_rating | test_configurations |
| CV Breakdown | All CV fields | cv_measurements |
| Events | events_examined | test_configurations |

**Schema Alignment:** ✅ All fields exist in schema

**Mock Data:** Yes (3 configs for Abbott)

---

### Configs/[id]/Page.tsx

**Path:** `app/(dashboard)/configs/[id]/page.tsx`
**Type:** Server Component (Detail Page)
**Route:** `/configs/[id]`

**What It Does:**
- Displays complete test configuration details
- Shows marker context with clinical interpretation
- Full CV performance breakdown with distribution bars
- Test configuration summary (assay, methodology, QC sample)
- Educational components (marker info, CV explainer)
- Quality assessment with confidence level

**Database Interactions (via API):**

**API Endpoint:** `/api/configs/[id]`

**Tables Accessed:** All fields from **vw_test_config_details** view

**Query Function:** `getConfigById(id)`

**UI → Database Mapping:**

| UI Element | Database Field | Table (via view) |
|------------|----------------|------------------|
| **Header** |
| Marker Name (H1) | markers.name | markers |
| Marker Link | markers.id | markers |
| Manufacturer Link | manufacturers.id, manufacturers.name | manufacturers |
| Antibody Type Badge | markers.antibody_type | markers |
| Category Badge | categories.name | categories |
| Quality Rating Badge | test_configurations.quality_rating | test_configurations |
| **Config Summary** |
| Assay Name | assays.name | assays |
| Platform | assays.platform | assays |
| Methodology | assays.methodology | assays |
| QC Sample | qc_samples.name | qc_samples |
| Test Type | test_configurations.test_type | test_configurations |
| **CV Performance** |
| Events Examined | test_configurations.events_examined | test_configurations |
| Mean CV | cv_measurements.mean_cv | cv_measurements |
| CV <10% % | cv_measurements.cv_lt_10_percentage | cv_measurements |
| CV <10% Count | cv_measurements.cv_lt_10_count | cv_measurements |
| CV 10-15% % | cv_measurements.cv_10_15_percentage | cv_measurements |
| CV 10-15% Count | cv_measurements.cv_10_15_count | cv_measurements |
| CV 15-20% % | cv_measurements.cv_15_20_percentage | cv_measurements |
| CV 15-20% Count | cv_measurements.cv_15_20_count | cv_measurements |
| CV >20% % | cv_measurements.cv_gt_20_percentage | cv_measurements |
| CV >20% Count | cv_measurements.cv_gt_20_count | cv_measurements |
| **Educational Panels** |
| Marker Info | markers.* + pathogens.* | markers, pathogens |
| **Quality Assessment** |
| Confidence Level | Calculated from events_examined | - |

**Confidence Calculation:**
- High: events_examined ≥ 50
- Medium: events_examined ≥ 30 && < 50
- Limited: events_examined ≥ 15 && < 30
- Insufficient: events_examined < 15

**Schema Alignment:** ✅ All fields exist in schema

---

### Assays/Page.tsx

**Path:** `app/(dashboard)/assays/page.tsx`
**Type:** Server Component (Table Page)
**Route:** `/assays`

**What It Does:**
- Displays table of all test configurations
- Filterable by quality rating
- Searchable (UI only, not functional)
- Shows marker, assay, manufacturer, platform, CV%, events, quality
- Optional dataset badge (if viewing "all" data)

**Database Interactions (via API):**

**API Endpoint:** `/api/configs?limit=50&dataset={dataset}`

**Tables Accessed:** All via **vw_test_config_details** view

**Query Function:** `getAllConfigs(filters, limit=50, offset=0)`

**UI → Database Mapping:**

| Table Column | Database Field | Table (via view) |
|--------------|----------------|------------------|
| Marker (link) | markers.name, markers.id | markers |
| Assay (link) | assays.name, test_configurations.id | assays, test_configurations |
| Manufacturer (link) | manufacturers.name, manufacturers.id | manufacturers |
| Platform | assays.platform | assays |
| Dataset Badge | test_configurations.inclusion_group | test_configurations |
| CV <10% | cv_measurements.cv_lt_10_percentage | cv_measurements |
| Events | test_configurations.events_examined | test_configurations |
| Quality | test_configurations.quality_rating | test_configurations |

**Schema Alignment:** ✅ All fields exist

**Dataset Filter:** ✅ Respects dataset query param

**Mock Data:** Yes (5 configs)

---

### Compare/Page.tsx

**Path:** `app/(dashboard)/compare/page.tsx`
**Type:** Client Component
**Route:** `/compare`

**What It Does:**
- Interactive side-by-side comparison tool
- User selects 2-4 test configurations
- Displays comparison table with all CV metrics
- Shows risk tier badges (high/medium/low based on pathogen)
- Shows data confidence badges (based on events_examined)
- Methodology comparison (if 2 configs selected)
- Statistical summary (best performer, average, total events)
- CSV export functionality

**Database Interactions (via API):**

**API Endpoints:**
- `/api/configs?limit=50` - Load available configs for selection
- `/api/compare` (POST) - Fetch comparison data

**Tables Accessed:** All via **vw_test_config_details** view

**Query Function:** `compareConfigsWithContext(configIds[])`

**UI → Database Mapping:**

| UI Element | Database Field | Calculation |
|------------|----------------|-------------|
| **Selection List** |
| Manufacturer + Assay | manufacturers.name + assays.name | Direct |
| Marker + Pathogen | markers.name + pathogens.name | Direct |
| Methodology Badge | assays.methodology | Direct |
| CV <10% Preview | cv_lt_10_percentage | Direct |
| **Comparison Table** |
| Manufacturer | manufacturers.name | Direct |
| Assay | assays.name | Direct |
| Marker | markers.name | Direct |
| Methodology | assays.methodology | Direct |
| Risk Tier Badge | Calculated from pathogens.name | Client-side logic |
| Confidence Badge | Calculated from events_examined | Client-side logic |
| All CV Metrics | All cv_measurements fields | Direct |
| Mean CV | cv_measurements.mean_cv | Direct |

**Client-Side Calculations:**

**Risk Tier:**
```typescript
- High: pathogen name includes HIV, Hepatitis B, Hepatitis C, HBV, HCV
- Medium: pathogen name includes CMV, Toxo, Rubella, SARS-CoV-2
- Low: all others
```

**Data Confidence:**
```typescript
- High: events_examined ≥ 50
- Medium: 30 ≤ events_examined < 50
- Limited: 15 ≤ events_examined < 30
- Insufficient: events_examined < 15
```

**Schema Alignment:** ✅ All fields exist

**Special Features:**
- Validates 2-4 configs selected
- Exports to CSV
- Shows methodology warnings

---

### Analytics/Page.tsx

**Path:** `app/(dashboard)/analytics/page.tsx`
**Type:** Server Component (Visualization Page)
**Route:** `/analytics`

**What It Does:**
- Advanced data visualizations
- Summary statistics cards
- CV Performance Heatmap (marker × manufacturer matrix)
- CV Distribution Chart (by manufacturer)
- Quality distribution breakdown
- Educational components (CV explainer)
- Research reference (Dimech 2021)

**Database Interactions (Direct):**

**Query Functions:**
- `getHeatmapData(dataset)` - Marker × Manufacturer CV matrix
- `getCVDistributionByManufacturer(dataset)` - Distribution data
- `getQualityDistribution()` - Quality rating counts
- `getOverallStats()` - Summary statistics

**Tables Accessed:**
- **test_configurations** - Quality ratings, filtering
- **cv_measurements** - All CV data
- **markers** - Marker names
- **manufacturers** - Manufacturer names
- **assays** - Joins for data
- **pathogens** - Via joins

**UI → Database Mapping:**

| Visualization | Database Fields | Calculation |
|---------------|----------------|-------------|
| **Summary Cards** |
| Total Configs | COUNT(test_configurations) | `getOverallStats()` |
| Excellent % | (COUNT excellent / total) * 100 | Calculated |
| Good or Better % | ((excellent + good) / total) * 100 | Calculated |
| Avg CV <10% | AVG(cv_lt_10_percentage) | `getOverallStats()` |
| **Heatmap** |
| Cell Value | cv_lt_10_percentage | `getHeatmapData()` |
| Cell Color | Based on cv_lt_10_percentage | Client-side |
| Marker Labels | markers.name | Direct |
| Manufacturer Labels | manufacturers.name | Direct |
| **Distribution Chart** |
| Manufacturer Bars | manufacturers.name | `getCVDistributionByManufacturer()` |
| CV Buckets | Calculated from cv_lt_10_percentage | SQL aggregation |
| **Quality Cards** |
| Excellent Count | COUNT WHERE quality_rating = 'excellent' | `getQualityDistribution()` |
| Good Count | COUNT WHERE quality_rating = 'good' | Direct |
| Acceptable Count | COUNT WHERE quality_rating = 'acceptable' | Direct |
| Poor Count | COUNT WHERE quality_rating = 'poor' | Direct |

**Dataset Filter:** ✅ Respects dataset query param

**Schema Alignment:** ✅ All fields exist

---

## 🔌 API Route Details

### /api/analytics/route.ts

**HTTP Methods:** GET
**Purpose:** Overall statistics and quality distribution

**Database Interactions:**
- `getOverallStats()` → Counts from all tables
- `getCVDistribution()` → test_configurations aggregation
- `getQualityDistribution()` → test_configurations aggregation

**Response Format:**
```json
{
  "data": {
    "overall": {
      "totalConfigs": 132,
      "totalMarkers": 28,
      "totalManufacturers": 9,
      "totalAssays": 45,
      "avgCVLt10Pct": 82.5
    },
    "cvDistribution": {
      "excellent": 48,
      "good": 29,
      "acceptable": 27,
      "poor": 28
    },
    "qualityDistribution": [
      { "quality_rating": "excellent", "count": 48, "percentage": 36.4 },
      ...
    ]
  }
}
```

**Used By:** Various analytics displays

---

### /api/analytics/dashboard-stats/route.ts

**HTTP Methods:** GET
**Purpose:** Dashboard-specific aggregated metrics

**Query Parameters:**
- `dataset` - 'curated' (default) | 'all'

**Database Interactions:**

**Direct SQL Queries:**

1. **Quality Stats:**
```sql
SELECT COUNT(*) as total,
  SUM(CASE WHEN quality_rating = 'excellent' THEN 1 ELSE 0 END) as excellent,
  SUM(CASE WHEN quality_rating = 'good' THEN 1 ELSE 0 END) as good,
  SUM(CASE WHEN quality_rating = 'acceptable' THEN 1 ELSE 0 END) as acceptable,
  SUM(CASE WHEN quality_rating = 'poor' THEN 1 ELSE 0 END) as poor
FROM test_configurations
WHERE include_in_analysis = TRUE (if dataset = 'curated')
```

2. **Top Performers:**
```sql
SELECT m.name as manufacturer_name,
  AVG(cv.cv_lt_10_percentage) as avg_cv_lt_10,
  COUNT(*) as config_count
FROM test_configurations tc
JOIN cv_measurements cv ON tc.id = cv.test_config_id
JOIN assays a ON tc.assay_id = a.id
JOIN manufacturers m ON a.manufacturer_id = m.id
WHERE [dataset filter] AND cv.cv_lt_10_percentage IS NOT NULL
GROUP BY m.id, m.name
HAVING COUNT(*) >= 3
ORDER BY avg_cv_lt_10 DESC
LIMIT 5
```

3. **Poor Performers:**
```sql
SELECT tc.id as config_id,
  mk.name as marker_name,
  mfr.name as manufacturer_name,
  a.name as assay_name,
  cv.cv_gt_20_percentage,
  tc.quality_rating
FROM test_configurations tc
JOIN cv_measurements cv ON tc.id = cv.test_config_id
JOIN markers mk ON tc.marker_id = mk.id
JOIN assays a ON tc.assay_id = a.id
JOIN manufacturers mfr ON a.manufacturer_id = mfr.id
WHERE [dataset filter] AND tc.quality_rating = 'poor' AND cv.cv_gt_20_percentage > 0
ORDER BY cv.cv_gt_20_percentage DESC
LIMIT 10
```

4. **Average CV:**
```sql
SELECT AVG(cv.cv_lt_10_percentage) as avg_cv_lt_10
FROM cv_measurements cv
JOIN test_configurations tc ON cv.test_config_id = tc.id
WHERE [dataset filter] AND cv.cv_lt_10_percentage IS NOT NULL
```

**Response Format:**
```json
{
  "qualityStats": {
    "total": 132,
    "excellent": 48,
    "good": 29,
    "acceptable": 27,
    "poor": 28
  },
  "topPerformers": [
    { "manufacturer_name": "Abbott", "avg_cv_lt_10": 87.3, "config_count": 28 }
  ],
  "poorPerformers": [
    {
      "config_id": 15,
      "marker_name": "anti-HCV",
      "manufacturer_name": "DiaSorin",
      "assay_name": "LIAISON XL",
      "cv_gt_20_percentage": 25.3,
      "quality_rating": "poor"
    }
  ],
  "avgCVLt10": 82.5
}
```

**Used By:** `/dashboard` page

**Schema Alignment:** ✅ All fields exist

---

### /api/markers/route.ts

**HTTP Methods:** GET
**Purpose:** List all markers, grouped by category, or search

**Query Parameters:**
- `grouped` - 'true' | 'false' (default: false)
- `search` - Search term

**Database Interactions:**

**Query Functions:**
- `getAllMarkers()` → SELECT * FROM markers ORDER BY name
- `getMarkersByCategory()` → SELECT with json_agg grouping by category
- `searchMarkers(term)` → SELECT WHERE name ILIKE '%term%'

**Response Formats:**

**Flat List** (`grouped=false`):
```json
{
  "data": [
    { "id": 1, "name": "anti-CMV IgG", "antibody_type": "IgG", "..." }
  ],
  "total": 28
}
```

**Grouped** (`grouped=true`):
```json
{
  "data": [
    {
      "category_id": 1,
      "category_name": "TORCH",
      "markers": [
        { "id": 1, "name": "anti-CMV IgG", "..." }
      ]
    }
  ]
}
```

**Used By:** `/markers` page

---

### /api/markers/[id]/route.ts

**HTTP Methods:** GET
**Purpose:** Get single marker with all test configurations

**Database Interactions:**

**Query Functions:**
- `getMarkerById(id)` → SELECT * FROM markers WHERE id = $1
- `getConfigsByMarkerId(id)` → SELECT * FROM vw_test_config_details WHERE marker_id = $1

**Response Format:**
```json
{
  "data": {
    "marker": {
      "id": 1,
      "name": "anti-CMV IgG",
      "pathogen_id": 1,
      "category_id": 1,
      "antibody_type": "IgG",
      "..."
    },
    "configs": [
      { "config_id": 1, "assay_name": "...", "..." }
    ],
    "totalConfigs": 12
  }
}
```

**Used By:** `/markers/[id]` page

**Error Handling:**
- 400: Invalid marker ID (not a number)
- 404: Marker not found

---

### /api/manufacturers/route.ts

**HTTP Methods:** GET
**Purpose:** List all manufacturers with performance data

**Query Parameters:**
- `dataset` - 'curated' (default) | 'all'

**Database Interactions:**

**Query Function:** `getAllManufacturers(dataset)`

**SQL (internal to function):**
```sql
SELECT m.id, m.name,
  COUNT(tc.id) as total_configs,
  ROUND(AVG(cv.cv_lt_10_percentage), 1) as avg_cv_lt_10_pct,
  COUNT(*) FILTER (WHERE tc.quality_rating = 'excellent') as excellent_count,
  COUNT(*) FILTER (WHERE tc.quality_rating = 'good') as good_count,
  COUNT(*) FILTER (WHERE tc.quality_rating = 'acceptable') as acceptable_count,
  COUNT(*) FILTER (WHERE tc.quality_rating = 'poor') as poor_count
FROM manufacturers m
LEFT JOIN assays a ON m.id = a.manufacturer_id
LEFT JOIN test_configurations tc ON a.id = tc.assay_id
LEFT JOIN cv_measurements cv ON tc.id = cv.test_config_id
WHERE [dataset filter]
GROUP BY m.id, m.name
HAVING COUNT(tc.id) > 0
ORDER BY avg_cv_lt_10_pct DESC NULLS LAST
```

**Response Format:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Abbott",
      "total_configs": 28,
      "avg_cv_lt_10_pct": 87.3,
      "excellent_count": 12,
      "good_count": 8,
      "acceptable_count": 5,
      "poor_count": 3
    }
  ],
  "total": 9
}
```

**Used By:** `/manufacturers` page

**Dataset Filter:** ✅ Applied

---

### /api/manufacturers/[id]/route.ts

**HTTP Methods:** GET
**Purpose:** Get manufacturer with assays and test configurations

**Database Interactions:**

**Query Functions:**
- `getManufacturerById(id)` → SELECT * FROM vw_manufacturer_performance WHERE id = $1
- `getAssaysByManufacturerId(id)` → SELECT * FROM assays WHERE manufacturer_id = $1
- `getConfigsByManufacturerId(id)` → SELECT * FROM vw_test_config_details WHERE manufacturer_id = $1

**Response Format:**
```json
{
  "data": {
    "manufacturer": {
      "id": 1,
      "name": "Abbott",
      "country": "United States",
      "website": "https://www.abbott.com",
      "..."
    },
    "assays": [
      { "id": 1, "name": "ARCHITECT CMV IgG", "..." }
    ],
    "configs": [
      { "config_id": 1, "marker_name": "...", "..." }
    ]
  }
}
```

**Used By:** `/manufacturers/[id]` page

**Error Handling:**
- 400: Invalid manufacturer ID
- 404: Manufacturer not found

---

### /api/configs/route.ts

**HTTP Methods:** GET, OPTIONS
**Purpose:** List test configurations with filtering and pagination

**Query Parameters:**
- `marker_id` - Filter by marker
- `manufacturer_id` - Filter by manufacturer
- `assay_id` - Filter by assay
- `quality_rating` - Filter by quality (excellent|good|acceptable|poor)
- `test_type` - Filter by type (serology|nat)
- `dataset` - 'curated' (default) | 'all'
- `min_cv_lt_10` - Minimum CV <10% percentage
- `limit` - Page size (1-100, default: 50)
- `offset` - Pagination offset (default: 0)

**Database Interactions:**

**Query Function:** `getAllConfigs(filters, limit, offset)`

**SQL (internal):**
```sql
SELECT * FROM vw_test_config_details
WHERE 1=1
  AND marker_id = $1 (if provided)
  AND manufacturer_id = $2 (if provided)
  AND assay_id = $3 (if provided)
  AND quality_rating = $4 (if provided)
  AND test_type = $5 (if provided)
  AND include_in_analysis = TRUE (if dataset = 'curated')
  AND cv_lt_10_percentage >= $6 (if provided)
ORDER BY cv_lt_10_percentage DESC NULLS LAST
LIMIT $7 OFFSET $8
```

**Response Format:**
```json
{
  "data": [
    { "config_id": 1, "marker_name": "...", "..." }
  ],
  "total": 132,
  "page": 1,
  "pageSize": 50,
  "totalPages": 3,
  "filters": { "dataset": "curated" }
}
```

**Used By:** `/assays` page, various filtered lists

**Validation:**
- Limit: 1-100
- Offset: ≥ 0

**CORS:** ✅ OPTIONS method for CORS preflight

---

### /api/configs/[id]/route.ts

**HTTP Methods:** GET
**Purpose:** Get single test configuration with full details

**Database Interactions:**

**Query Function:** `getConfigById(id)`

**SQL:**
```sql
SELECT * FROM vw_test_config_details WHERE config_id = $1
```

**Response Format:**
```json
{
  "data": {
    "config_id": 1,
    "marker_name": "anti-CMV IgG",
    "manufacturer_name": "Abbott",
    "assay_name": "ARCHITECT CMV IgG",
    "platform": "ARCHITECT i2000SR",
    "methodology": "CMIA",
    "quality_rating": "excellent",
    "cv_lt_10_percentage": 92.9,
    "..."
  }
}
```

**Used By:** `/configs/[id]` page

**Error Handling:**
- 400: Invalid configuration ID
- 404: Configuration not found

---

### /api/compare/route.ts

**HTTP Methods:** POST
**Purpose:** Compare 2-4 test configurations

**Request Body:**
```json
{
  "configIds": [1, 5, 12]
}
```

**Validation:**
- Must be array
- 2-4 config IDs required

**Database Interactions:**

**Query Function:** `compareConfigsWithContext(configIds[])`

**SQL (internal):**
```sql
SELECT vw.*,
  CASE
    WHEN COUNT(DISTINCT vw.methodology) OVER() > 1
      THEN 'Different methodologies...'
    ELSE 'Same methodology...'
  END as methodology_warning,
  'CV% measures reproducibility...' as comparison_notes
FROM vw_test_config_details vw
WHERE vw.config_id = ANY($1)
ORDER BY vw.cv_lt_10_percentage DESC
```

**Response Format:**
```json
{
  "configs": [
    {
      "config_id": 1,
      "...",
      "methodology_warning": "Different methodologies used...",
      "comparison_notes": "CV% measures reproducibility..."
    }
  ],
  "count": 3,
  "methodology_warning": "...",
  "comparison_notes": "..."
}
```

**Used By:** `/compare` page

**Error Handling:**
- 400: < 2 or > 4 config IDs
- 404: No configs found

---

### /api/search/route.ts

**HTTP Methods:** GET
**Purpose:** Global search across markers, manufacturers, assays

**Query Parameters:**
- `q` - Search query (min 2 characters)

**Database Interactions:**

**Direct SQL Queries:**

1. **Search Markers:**
```sql
SELECT m.id, m.name, m.antibody_type,
  p.name as pathogen_name,
  c.name as category_name,
  m.clinical_use
FROM markers m
LEFT JOIN pathogens p ON m.pathogen_id = p.id
LEFT JOIN categories c ON m.category_id = c.id
WHERE LOWER(m.name) LIKE $1
   OR LOWER(m.antibody_type) LIKE $1
   OR LOWER(p.name) LIKE $1
LIMIT 10
```

2. **Search Manufacturers:**
```sql
SELECT id, name, country
FROM manufacturers
WHERE LOWER(name) LIKE $1
LIMIT 10
```

3. **Search Assays:**
```sql
SELECT a.id, a.name, a.platform, a.methodology,
  m.name as manufacturer_name
FROM assays a
LEFT JOIN manufacturers m ON a.manufacturer_id = m.id
WHERE LOWER(a.name) LIKE $1
   OR LOWER(a.platform) LIKE $1
   OR LOWER(a.methodology) LIKE $1
LIMIT 10
```

**Response Format:**
```json
{
  "results": [
    {
      "type": "marker",
      "id": 1,
      "name": "anti-CMV IgG",
      "description": "Cytomegalovirus",
      "metadata": { "antibody_type": "IgG", "..." }
    },
    {
      "type": "manufacturer",
      "id": 1,
      "name": "Abbott",
      "description": "United States",
      "metadata": { "country": "United States" }
    },
    {
      "type": "assay",
      "id": 1,
      "name": "ARCHITECT CMV IgG",
      "description": "Abbott ARCHITECT",
      "metadata": { "platform": "ARCHITECT", "..." }
    }
  ],
  "total": 15,
  "query": "cmv"
}
```

**Used By:** Global search component (if implemented)

**Validation:**
- Query must be ≥ 2 characters

---

## 🎯 Summary

### Files Documented
- ✅ 22 files analyzed
- ✅ All API routes documented
- ✅ All dashboard pages documented
- ✅ Database interactions mapped

### Key Findings
1. ✅ **Excellent type safety** - All TypeScript types match schema
2. ✅ **Comprehensive views** - Pre-joined data simplifies queries
3. ✅ **Good separation** - API routes → Query functions → Database
4. ✅ **Dataset filtering** - Curated vs all data toggle works consistently
5. ⚠️ **Unused columns** - Many schema fields available but not displayed (opportunities for enhancement)

### Complete Reference
**→ Full database mapping:** [DATABASE_MAPPING.md](DATABASE_MAPPING.md)

---

**Last Updated:** 2025-11-11
