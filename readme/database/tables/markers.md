# Table: `markers`

**Purpose:** Specific biomarkers (antibodies, antigens, nucleic acids) being measured in diagnostic tests
**Last Schema Update:** 2025-11-11
**Estimated Row Count:** ~40-60 markers
**Growth Rate:** Moderate (new markers added as testing expands)

---

## Purpose

Stores the specific **biomarkers** that diagnostic tests measure. Each marker represents a detectable substance that indicates infection status:
- **Antibodies** (IgG, IgM, Total) - Immune response markers
- **Antigens** - Pathogen proteins/components
- **Nucleic Acids** (DNA/RNA) - Genetic material detected by PCR

Examples: "HIV-1/2 Ab", "HCV IgG", "CMV DNA", "Toxoplasma IgM"

---

## Schema (Bones)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | integer | PK, AUTO | Unique identifier |
| `name` | varchar(200) | NOT NULL, UNIQUE(name, pathogen_id) | Marker name (e.g., "HIV-1/2 Antibody") |
| `pathogen_id` | integer | FK → pathogens.id, NULL | Associated pathogen |
| `category_id` | integer | FK → categories.id, NULL | Disease category |
| `antibody_type` | varchar(50) | CHECK, NULL | IgG, IgM, Antigen, Antibody (Total), Other |
| `marker_type` | varchar(50) | CHECK, NULL | Antibody, Antigen, Nucleic Acid |
| `clinical_use` | text | NULL | Clinical significance and use cases |
| `interpretation_positive` | text | NULL | What a positive result means |
| `interpretation_negative` | text | NULL | What a negative result means |
| `created_at` | timestamp | DEFAULT now() | When record was created |

---

## Marker Types Explained

### antibody_type (for serology markers)
- **IgG:** Long-term immunity marker (past or chronic infection)
- **IgM:** Early infection marker (acute phase)
- **Antigen:** Pathogen component (active infection)
- **Antibody (Total):** Combined IgG + IgM detection
- **Other:** Special cases

### marker_type (general classification)
- **Antibody:** Immune response markers (serology)
- **Antigen:** Pathogen protein/component markers (serology)
- **Nucleic Acid:** DNA/RNA detection (NAT/PCR)

---

## Relationships

### Foreign Keys (Parents)
- **`pathogen_id`** → `pathogens.id`
  Links marker to specific pathogen (e.g., HIV, HCV)

- **`category_id`** → `categories.id`
  Links marker to disease category (e.g., Retroviruses, Hepatitis)

### Referenced By (Children)
- **`test_configurations.marker_id`** → `markers.id`
  Each configuration tests a specific marker

---

## Unique Constraints

**Unique Index:** (name, pathogen_id)

Ensures marker names are unique within a pathogen. You can have "Antibody" for different pathogens, but not two "HIV-1/2 Ab" markers for the same HIV pathogen.

---

## Check Constraints

### antibody_type
Must be one of: `'IgG'`, `'IgM'`, `'Antigen'`, `'Antibody (Total)'`, `'Other'`, NULL

### marker_type
Must be one of: `'Antibody'`, `'Antigen'`, `'Nucleic Acid'`, NULL

---

## Used By (Code Files)

### API Routes
- `app/api/markers/route.ts` - GET all markers with filters
- `app/api/markers/[id]/route.ts` - GET single marker with test configs
- `app/api/configs/route.ts` - Filter configs by marker_id
- `app/api/search/route.ts` - Search markers by name

### Server Components
- `app/(dashboard)/markers/page.tsx` - List all markers with categories
- `app/(dashboard)/markers/[id]/page.tsx` - Marker detail page
- `app/(dashboard)/compare/page.tsx` - Compare markers side-by-side

### UI Components
- `components/filters/FilterPanel.tsx` - Marker filter dropdown
- `components/education/MarkerInfoPanel.tsx` - Display marker details
- `components/search/SearchBar.tsx` - Marker search results

### Database Queries
- `lib/db/queries.ts`:
  - `getAllMarkers()` - List all markers
  - `getMarkerById()` - Single marker details
  - `getMarkersByCategory()` - Group by category
  - `searchMarkers()` - Full-text search
  - `getMarkerWithContext()` - Marker + related pathogens/categories
  - `getConfigsByMarkerId()` - All test configs for a marker

---

## Business Rules

### Test Type Inference
- If `marker_type = 'Nucleic Acid'` → test_type likely 'nat'
- If `marker_type = 'Antibody' or 'Antigen'` → test_type likely 'serology'

### Clinical Interpretation
- **IgM positive:** Suggests recent/acute infection
- **IgG positive:** Suggests past infection or immunity
- **Antigen positive:** Suggests active infection (pathogen present)
- **NAT positive:** Pathogen genetic material detected (active infection)

### Naming Conventions
Common patterns:
- "{Pathogen} {Antibody Type}" - e.g., "HIV-1/2 Ab", "HCV IgG"
- "{Pathogen} Ag" - e.g., "HBsAg" (Hepatitis B surface antigen)
- "{Pathogen} DNA/RNA" - e.g., "CMV DNA", "HCV RNA"

---

## Common Query Patterns

### Get all markers for a pathogen
```sql
SELECT *
FROM markers
WHERE pathogen_id = $1
ORDER BY name;
```

### Get markers by category
```sql
SELECT m.*, p.name as pathogen_name, c.name as category_name
FROM markers m
LEFT JOIN pathogens p ON m.pathogen_id = p.id
LEFT JOIN categories c ON m.category_id = c.id
WHERE m.category_id = $1
ORDER BY m.name;
```

### Search markers
```sql
SELECT *
FROM markers
WHERE name ILIKE '%' || $1 || '%'
ORDER BY name;
```

### Get marker with test performance
```sql
SELECT
  m.*,
  COUNT(tc.id) as total_configs,
  AVG(cv.cv_lt_10_percentage) as avg_cv_performance
FROM markers m
JOIN test_configurations tc ON m.id = tc.marker_id
JOIN cv_measurements cv ON tc.id = cv.test_config_id
WHERE m.id = $1
GROUP BY m.id;
```

---

## Example Data

### Antibody Markers (IgG)
- HIV-1/2 Antibody
- HCV IgG
- Toxoplasma IgG
- CMV IgG
- Rubella IgG

### Antibody Markers (IgM)
- Toxoplasma IgM
- CMV IgM
- Rubella IgM
- HSV IgM

### Antigen Markers
- HBsAg (Hepatitis B surface antigen)
- HIV p24 Antigen
- HCV Core Antigen

### Nucleic Acid Markers
- HIV-1 RNA
- HCV RNA
- CMV DNA
- HBV DNA
- HSV DNA

---

## Recent Changes

**2025-11-11:** Initial schema documented
- No recent modifications detected
- Schema is stable

---

## Related Tables

- **[pathogens](pathogens.md)** - Parent table linking markers to diseases
- **[categories](categories.md)** - Disease classification
- **[test_configurations](test_configurations.md)** - Child table (test configs use markers)
- **[assays](assays.md)** - Via test_configurations (which assays test which markers)

---

## Performance Notes

### Indexes
- Primary key index on `id` (automatic)
- Foreign key indexes on `pathogen_id`, `category_id` (automatic)
- Unique index on (name, pathogen_id)
- **Recommended:** Index on `marker_type` for filtering
- **Recommended:** Full-text search index on `name` for search performance

### Query Optimization
- Join with `pathogens` and `categories` for display
- Use marker_type for test type filtering
- Cache marker list for filter dropdowns (rarely changes)

---

## Data Quality Checks

```sql
-- Markers without pathogens (should be few)
SELECT * FROM markers WHERE pathogen_id IS NULL;

-- Markers without categories (should be few)
SELECT * FROM markers WHERE category_id IS NULL;

-- Orphaned markers (no test configurations)
SELECT m.*
FROM markers m
LEFT JOIN test_configurations tc ON m.id = tc.marker_id
WHERE tc.id IS NULL;
```

---

**Generated:** 2025-11-11
**Last Verified:** 2025-11-11
**Schema Version:** 1.0.0
