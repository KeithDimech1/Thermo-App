# Database Visual Guide

**Quick visual reference for the thermochronology database.**

---

## Simplified Database Diagram

![Simplified ERD](./database-erd-simple.png)

**Key Concept:** 1 sample → many datapoints (analytical sessions) → many grain-level records

This simplified view shows:
- 📦 **datasets** - Data packages with privacy controls
- 🪨 **samples** - PRIMARY TABLE - Geological samples with IGSN
- 📊 **ft_datapoints** - Fission-track analytical sessions (central_age_ma)
- 📊 **he_datapoints** - (U-Th)/He analytical sessions (mean_corr_age_ma)
- 🔢 **FT Grain Data** - Counts, track lengths, single grain ages
- 💎 **he_whole_grain_data** - U, Th, Sm chemistry and corrected ages
- 👤 **people** - ORCID-linked researchers
- 🧪 **batches** - QC tracking with reference materials

**Color Key:**
- 🔴 Red: Fission-Track data
- 🟢 Green: (U-Th)/He data
- 🔵 Blue: Core infrastructure
- 🟡 Yellow: People/roles
- 🟣 Purple: QC/batches

---

## Complete Database Diagram

![Complete ERD](./database-erd.png)

This detailed view shows:
- **All 16 tables** with complete field listings
- **All relationships** with cardinality (1:N, 1:1, N:M)
- **Primary keys** (PK) and foreign keys (FK)
- **Unique constraints** (UK)
- **Primary age fields** marked with ★

---

## Available Formats

### Simplified Diagram
- **PNG (bitmap):** [database-erd-simple.png](./database-erd-simple.png) - 252 KB, 150 DPI
- **SVG (vector):** [database-erd-simple.svg](./database-erd-simple.svg) - 16 KB, scales infinitely
- **Best for:** Presentations, quick reference, onboarding

### Complete Diagram
- **PNG (bitmap):** [database-erd.png](./database-erd.png) - 574 KB, 150 DPI
- **SVG (vector):** [database-erd.svg](./database-erd.svg) - 41 KB, scales infinitely
- **PDF (print):** [database-erd.pdf](./database-erd.pdf) - 57 KB, print-ready
- **Best for:** Technical documentation, detailed analysis, database design

---

## Key Tables at a Glance

### PRIMARY TABLE: samples
**What it stores:** Geological samples with IGSN, location, lithology, mineral type
**Links to:** ft_datapoints (1:N), he_datapoints (1:N), datasets (N:1)
**Primary key:** sample_id (VARCHAR)

### FT Analysis: ft_datapoints
**What it stores:** Fission-track analytical sessions with central age, dispersion, MTL
**Links to:** samples (N:1), ft_count_data (1:N), ft_track_length_data (1:N)
**Primary age field:** central_age_ma ★

### He Analysis: he_datapoints
**What it stores:** (U-Th)/He analytical sessions with corrected mean ages
**Links to:** samples (N:1), he_whole_grain_data (1:N)
**Primary age field:** mean_corr_age_ma ★

---

## Data Flow Example

```
Sample Collection
      ↓
  samples table
  (MAL001, granite, apatite)
      ↓
      ├─► ft_datapoints
      │   (central_age: 234.5 Ma)
      │        ↓
      │        ├─► ft_count_data (20 grains)
      │        │   (Ns, Ni, Nd, ρs)
      │        │
      │        └─► ft_track_length_data (250 tracks)
      │            (length, c-axis angle)
      │
      └─► he_datapoints
          (mean_corr_age: 187.3 Ma)
               ↓
               └─► he_whole_grain_data (5 grains)
                   (U, Th, eU, FT, ages)
```

---

## Viewing the Diagrams

### In a Web Browser
- Open the PNG files directly in any browser
- SVG files can be zoomed infinitely without quality loss

### In VS Code
- Click on PNG/SVG files to view
- Use zoom controls to see details

### For Printing
- Use the PDF file: `database-erd.pdf`
- Recommended: Print on A3 or tabloid size for best readability

### In Documentation
- Embed PNG files in markdown
- Use SVG for web documentation (smaller file size, scales better)

---

## Schema Statistics

**Tables:** 16 (production) + 3 (legacy v1)
**Relationships:** 20+ foreign key constraints
**Indexes:** 40+ for query optimization
**Views:** 2 (backward compatibility)
**Triggers:** 2 (auto-update timestamps)

**Data Types:**
- Ages: DECIMAL(10, 2) - e.g., 234.56 Ma
- Track lengths: DECIMAL(6, 3) - e.g., 14.567 µm
- Coordinates: DECIMAL(10, 7) - e.g., -34.1234567
- ORCIDs: VARCHAR(50) - e.g., 0000-0002-1825-0097

---

## Color Coding in Diagrams

| Color | Category | Tables |
|-------|----------|--------|
| 🔵 **Blue** | Core Infrastructure | datasets, samples |
| 🔴 **Red** | Fission-Track | ft_datapoints, ft_count_data, ft_track_length_data, ft_single_grain_ages, ft_binned_length_data |
| 🟢 **Green** | (U-Th)/He | he_datapoints, he_whole_grain_data |
| 🟡 **Yellow** | People/Roles | people, sample_people_roles, datapoint_people_roles |
| 🟣 **Purple** | QC/Batches | batches, reference_materials |
| 🟦 **Teal** | Physical Samples | mounts, grains |

---

## Next Steps

1. **Understand the structure:** Review the simplified diagram
2. **Explore details:** Check the complete diagram for field-level details
3. **Read table docs:** See `tables/*.md` for individual table documentation
4. **Try queries:** Use the sample queries in `DATABASE_ERD.md`

---

## Source Files

The diagrams were generated from Graphviz DOT files:
- **Simplified:** [database-erd-simple.dot](./database-erd-simple.dot)
- **Complete:** [database-erd.dot](./database-erd.dot)

To regenerate images:
```bash
# Simplified diagram
dot -Tpng database-erd-simple.dot -o database-erd-simple.png -Gdpi=150
dot -Tsvg database-erd-simple.dot -o database-erd-simple.svg

# Complete diagram
dot -Tpng database-erd.dot -o database-erd.png -Gdpi=150
dot -Tsvg database-erd.dot -o database-erd.svg
dot -Tpdf database-erd.dot -o database-erd.pdf
```

---

**Last Updated:** 2025-11-18
**Schema Version:** 2.0.0 (EarthBank-compatible)
