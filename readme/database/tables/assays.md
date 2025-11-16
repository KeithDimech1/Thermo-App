# Table: `assays`

**Purpose:** Diagnostic test platforms and systems used to measure biomarkers
**Last Schema Update:** 2025-11-11
**Estimated Row Count:** ~50-80 assays
**Growth Rate:** Moderate (new assays added as technology evolves)

---

## Purpose

Stores information about **diagnostic test systems** - the specific platforms and methodologies used to measure biomarkers. Each assay represents a commercial test product from a manufacturer.

Examples:
- "ARCHITECT HIV Ag/Ab Combo" (Abbott, CMIA)
- "cobas HCV" (Roche, ECLIA)
- "LIAISON Toxo IgG" (DiaSorin, CLIA)

---

## Schema (Bones)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | integer | PK, AUTO | Unique identifier |
| `name` | varchar(300) | NOT NULL, UNIQUE(name, manufacturer_id) | Assay product name |
| `manufacturer_id` | integer | FK → manufacturers.id, NULL | Company that makes the assay |
| `platform` | varchar(100) | NULL | Instrument/system name |
| `methodology` | varchar(50) | CHECK, NULL | CLIA, ELISA, PCR, ECLIA, CMIA |
| `automation_level` | varchar(50) | CHECK, NULL | Fully Automated, Semi-Automated, Manual |
| `throughput` | varchar(50) | NULL | Processing capacity (e.g., "100 tests/hour") |
| `created_at` | timestamp | DEFAULT now() | When record was created |

---

## Methodologies Explained

### CLIA (Chemiluminescence Immunoassay)
- Light emission-based detection
- High sensitivity, wide dynamic range
- Example: LIAISON systems (DiaSorin)

### ELISA (Enzyme-Linked Immunosorbent Assay)
- Enzyme-based colorimetric detection
- Well-established, widely used
- Example: Many manual/semi-automated systems

### PCR (Polymerase Chain Reaction)
- Nucleic acid amplification
- Detects DNA/RNA with high sensitivity
- Example: cobas, RealTime PCR systems

### ECLIA (Electrochemiluminescence Immunoassay)
- Electric field-triggered light emission
- Very high sensitivity
- Example: cobas systems (Roche)

### CMIA (Chemiluminescent Microparticle Immunoassay)
- Microparticle-based detection
- High throughput, automation-friendly
- Example: ARCHITECT systems (Abbott)

---

## Automation Levels

### Fully Automated
- Minimal human intervention
- High throughput (100-200+ tests/hour)
- Random access capability
- Examples: ARCHITECT, cobas, LIAISON

### Semi-Automated
- Some manual steps required
- Moderate throughput (20-50 tests/hour)
- Batch processing
- Examples: Some ELISA readers, older platforms

### Manual
- Hands-on processing throughout
- Low throughput (<20 tests/hour)
- Labor-intensive
- Examples: Traditional ELISA kits

---

## Relationships

### Foreign Keys (Parents)
- **`manufacturer_id`** → `manufacturers.id`
  Links assay to manufacturer (e.g., Abbott, Roche)

### Referenced By (Children)
- **`test_configurations.assay_id`** → `assays.id`
  Each configuration uses a specific assay

---

## Unique Constraints

**Unique Index:** (name, manufacturer_id)

Ensures assay names are unique within a manufacturer. Different manufacturers can have similar names, but each manufacturer's assay names must be unique.

---

## Check Constraints

### methodology
Must be one of: `'CLIA'`, `'ELISA'`, `'PCR'`, `'ECLIA'`, `'CMIA'`, NULL

### automation_level
Must be one of: `'Fully Automated'`, `'Semi-Automated'`, `'Manual'`, NULL

---

## Used By (Code Files)

### API Routes
- `app/api/assays/route.ts` - GET all assays (implied, not in current index)
- `app/api/configs/route.ts` - Filter configs by assay_id
- `app/api/manufacturers/[id]/route.ts` - Get manufacturer's assays
- `app/api/markers/[id]/route.ts` - Get assays that test a specific marker

### Server Components
- `app/(dashboard)/assays/page.tsx` - List all assays with configs
- `app/(dashboard)/manufacturers/[id]/page.tsx` - Show manufacturer's assays
- `app/(dashboard)/markers/[id]/page.tsx` - Show assays for a marker
- `app/(dashboard)/compare/page.tsx` - Compare assays side-by-side

### UI Components
- `components/filters/FilterPanel.tsx` - Filter by assay/methodology
- `components/education/MethodologyTooltip.tsx` - Explain methodology types

### Database Queries
- `lib/db/queries.ts`:
  - `getAllAssays()` - List all assays
  - `getAssayById()` - Single assay details
  - `getAssaysByManufacturerId()` - Assays by manufacturer
  - `getAssayWithTechSpecs()` - Assay with technical specifications
  - `getConfigsByManufacturerId()` - Uses assays to find configs

---

## Business Rules

### Naming Conventions
Typical patterns:
- "{Platform} {Marker}" - e.g., "ARCHITECT HIV Ag/Ab Combo"
- "{Brand} {Technology}" - e.g., "cobas 6800/8800"
- "{Manufacturer} {Test}" - e.g., "Bio-Rad HIV Combo"

### Methodology and Test Type
- **CLIA, ELISA, ECLIA, CMIA** → Typically serology tests (antibodies/antigens)
- **PCR** → Typically NAT tests (nucleic acids)

### Throughput Considerations
- **High throughput** (>100/hr): Large labs, hospital systems
- **Medium throughput** (20-100/hr): Mid-size labs
- **Low throughput** (<20/hr): Small labs, point-of-care

---

## Common Query Patterns

### Get all assays by manufacturer
```sql
SELECT a.*, m.name as manufacturer_name
FROM assays a
JOIN manufacturers m ON a.manufacturer_id = m.id
WHERE a.manufacturer_id = $1
ORDER BY a.name;
```

### Get assays by methodology
```sql
SELECT *
FROM assays
WHERE methodology = $1
ORDER BY name;
```

### Get assays testing a specific marker
```sql
SELECT DISTINCT a.*, m.name as manufacturer_name
FROM assays a
JOIN manufacturers m ON a.manufacturer_id = m.id
JOIN test_configurations tc ON a.id = tc.assay_id
WHERE tc.marker_id = $1
ORDER BY a.name;
```

### Get assay performance summary
```sql
SELECT
  a.name,
  a.methodology,
  COUNT(tc.id) as total_configs,
  AVG(cv.cv_lt_10_percentage) as avg_cv_performance
FROM assays a
JOIN test_configurations tc ON a.id = tc.assay_id
JOIN cv_measurements cv ON tc.id = cv.test_config_id
WHERE a.id = $1
GROUP BY a.id, a.name, a.methodology;
```

---

## Example Data

### CLIA Assays
- LIAISON CMV IgG (DiaSorin)
- LIAISON Toxo IgG (DiaSorin)
- LIAISON Rubella IgG (DiaSorin)

### ELISA Assays
- Bio-Rad HIV-1/2 ELISA
- Traditional manual ELISA kits

### PCR Assays
- cobas HCV (Roche)
- cobas HIV-1 (Roche)
- RealTime HIV-1 (Abbott)

### ECLIA Assays
- cobas e411 HIV Combi PT (Roche)
- cobas e601 HCV (Roche)

### CMIA Assays
- ARCHITECT HIV Ag/Ab Combo (Abbott)
- ARCHITECT HCV (Abbott)
- ARCHITECT Toxo IgG (Abbott)

---

## Recent Changes

**2025-11-11:** Initial schema documented
- No recent modifications detected
- Schema is stable

---

## Related Tables

- **[manufacturers](manufacturers.md)** - Parent table (assays belong to manufacturers)
- **[test_configurations](test_configurations.md)** - Child table (configs use assays)
- **[markers](markers.md)** - Via test_configurations (which assays test which markers)
- **[cv_measurements](cv_measurements.md)** - Via test_configurations (assay performance)

---

## Performance Notes

### Indexes
- Primary key index on `id` (automatic)
- Foreign key index on `manufacturer_id` (automatic)
- Unique index on (name, manufacturer_id)
- **Recommended:** Index on `methodology` for filtering
- **Recommended:** Index on `automation_level` for filtering

### Query Optimization
- Always join with `manufacturers` for display
- Use `methodology` for test type inference
- Cache assay list for filter dropdowns (changes infrequently)

---

## Data Quality Checks

```sql
-- Assays without manufacturers
SELECT * FROM assays WHERE manufacturer_id IS NULL;

-- Assays without methodology
SELECT * FROM assays WHERE methodology IS NULL;

-- Orphaned assays (no test configurations)
SELECT a.*
FROM assays a
LEFT JOIN test_configurations tc ON a.id = tc.assay_id
WHERE tc.id IS NULL;

-- Duplicate assay names (should be prevented by unique constraint)
SELECT name, manufacturer_id, COUNT(*)
FROM assays
GROUP BY name, manufacturer_id
HAVING COUNT(*) > 1;
```

---

**Generated:** 2025-11-11
**Last Verified:** 2025-11-11
**Schema Version:** 1.0.0
