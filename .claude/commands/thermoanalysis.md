# /thermoanalysis - Deep Paper Analysis with Indexed Navigation

**Status:** ✅ Ready for use | ⏳ Production deployment after ERROR-005 schema migration

**Purpose:** Create comprehensive, indexed analysis of thermochronology papers that integrates with /thermoextract

**Usage:** Provide PDF path and optional folder name

**Note:** This command is fully functional now but is recommended for production use **after ERROR-005 (EarthBank schema migration)** is complete. Database mapping templates will need minor updates when the new schema is deployed. See ERROR-008 for details.

**What it does:**
1. Reads the PDF thoroughly
2. Creates organized paper folder structure
3. Extracts all images with figure captions from PDF text
4. Generates `paper-index.md` (quick reference with metadata)
5. Generates `paper-analysis.md` (full indexed analysis with anchors)
6. Generates `figures.md` (human-readable figure descriptions)
7. Generates `image-metadata.json` (structured data for database import)
8. Copies PDF to folder
9. Validates completeness for /thermoextract integration

**Output:**
```
build-data/learning/thermo-papers/AUTHOR(YEAR)-TITLE/
├── [PDF_NAME].pdf
├── paper-index.md         # ⭐ Quick reference
├── paper-analysis.md      # 📚 Full analysis
├── figures.md             # 📋 Human-readable figure descriptions
└── images/                # 📸 Extracted figures
    ├── page_1_img_0.png   # Figure 1
    ├── page_3_img_1.png   # Figure 2
    ├── page_5_img_0.png   # Figure 3
    └── image-metadata.json # Image catalog (JSON for DB import)
```

**Next steps after completion:**
- Review the generated analysis for accuracy
- Run `/thermoextract` to extract data tables (will use the index)
- Deploy to Vercel when ready

---

## 🎯 Your Task

You are analyzing a thermochronology research paper to create **indexed, navigable documentation** that will:
- Help Claude quickly find information without re-reading the entire paper
- Provide metadata for `/thermoextract` to speed up data extraction
- Document the paper's methods, results, and database relevance

**Ask the user for:**
1. **PDF path** - Full path to the PDF file
2. **Paper folder name** (optional) - Format: `AUTHOR(YEAR)-TITLE` (e.g., `McMillan(2024)-Malawi-Rift-Flank`)
   - If not provided, derive from PDF filename

---

## 📋 Systematic Workflow

### STEP 1: Setup and PDF Reading

**Actions:**
1. Get PDF path and folder name from user
2. Create folder: `build-data/learning/thermo-papers/[FOLDER_NAME]/`
3. Copy PDF to folder
4. Read the PDF thoroughly using Read tool
5. Extract key metadata while reading:
   - Full citation
   - Authors (lead + co-authors)
   - Year, journal, DOI
   - Study location/region
   - Mineral type (apatite, zircon, etc)
   - Analysis method (EDM, LA-ICP-MS, both)
   - Sample count
   - Age range (min-max Ma)

**Output:** Print summary of metadata extracted

---

### STEP 1.5: Extract Images from PDF (IDEA-008)

**Actions:**

1. **Create images directory:**
   ```python
   images_dir = paper_dir / 'images'
   images_dir.mkdir(exist_ok=True)
   ```

2. **Extract images and figure captions using PyMuPDF:**
   ```python
   import fitz  # PyMuPDF
   import re

   print('━' * 60)
   print('EXTRACTING IMAGES FROM PDF')
   print('━' * 60)
   print()

   doc = fitz.open(pdf_path)
   extracted_images = []

   # First pass: Extract all figure captions from text
   figure_captions = {}
   for page_num in range(len(doc)):
       page = doc[page_num]
       text = page.get_text()

       # Find figure captions (common patterns)
       # Pattern 1: "Figure X. Caption text" or "Fig. X. Caption text"
       # Pattern 2: Multi-line captions
       fig_matches = re.finditer(
           r'(?:Figure|Fig\.?)\s+(\d+[A-Za-z]?)[\.:]\s*([^\n]+(?:\n(?![A-Z][a-z]+\s+\d+)[^\n]+)*)',
           text,
           re.IGNORECASE | re.MULTILINE
       )

       for match in fig_matches:
           fig_num = match.group(1)
           caption = match.group(2).strip()
           # Clean up caption (remove extra whitespace)
           caption = re.sub(r'\s+', ' ', caption)
           # DO NOT truncate - keep full description for database import
           # Store with page number for context
           figure_captions[f"Figure {fig_num}"] = {
               "page": page_num + 1,
               "caption": caption
           }

   # Second pass: Extract images
   for page_num in range(len(doc)):
       page = doc[page_num]
       image_list = page.get_images()

       for img_index, img in enumerate(image_list):
           xref = img[0]
           base_image = doc.extract_image(xref)
           image_bytes = base_image["image"]
           image_ext = base_image["ext"]

           # Save image
           image_filename = f"page_{page_num + 1}_img_{img_index}.{image_ext}"
           image_path = images_dir / image_filename

           with open(image_path, "wb") as img_file:
               img_file.write(image_bytes)

           # Try to match image to figure caption based on page
           matched_figure = None
           description = None

           for fig_name, fig_data in figure_captions.items():
               # Match if figure is on same page or adjacent pages
               if abs(fig_data["page"] - (page_num + 1)) <= 1:
                   if matched_figure is None:
                       matched_figure = fig_name
                       description = fig_data["caption"]
                   # If multiple figures on same page, use heuristics
                   # (could be improved with layout analysis)

           # Record metadata
           image_metadata = {
               "filename": image_filename,
               "page": page_num + 1,
               "index": img_index,
               "format": image_ext,
               "width": base_image["width"],
               "height": base_image["height"]
           }

           # Add figure information if matched
           if matched_figure and description:
               image_metadata["figure_number"] = matched_figure
               image_metadata["description"] = description

           extracted_images.append(image_metadata)

   doc.close()

   print(f'✅ Extracted {len(extracted_images)} images from {len(doc)} pages')
   print(f'✅ Found {len(figure_captions)} figure captions')
   print()
   ```

3. **Generate enhanced image metadata file (JSON for database import):**
   ```python
   import json

   # Create summary of identified figures
   figures_summary = {}
   for img in extracted_images:
       if "figure_number" in img:
           fig_num = img["figure_number"]
           if fig_num not in figures_summary:
               figures_summary[fig_num] = {
                   "description": img["description"],
                   "images": []
               }
           figures_summary[fig_num]["images"].append({
               "filename": img["filename"],
               "page": img["page"]
           })

   metadata = {
       "paper": dataset_name,
       "pdf": Path(pdf_path).name,
       "total_images": len(extracted_images),
       "total_pages": len(doc),
       "total_figures_identified": len(figures_summary),
       "extracted_date": pd.Timestamp.now().isoformat(),
       "figures_summary": figures_summary,
       "images": extracted_images
   }

   metadata_path = images_dir / 'image-metadata.json'
   with open(metadata_path, 'w') as f:
       json.dump(metadata, f, indent=2)

   print(f'✅ Image metadata saved: image-metadata.json')
   print(f'   - {len(figures_summary)} figures identified with descriptions')
   print(f'   - {len(extracted_images) - sum(1 for img in extracted_images if "figure_number" in img)} images without captions')
   print()
   ```

3.5. **Generate human-readable figures markdown file:**
   ```python
   # Create figures.md for human-readable descriptions
   figures_md_path = paper_dir / 'figures.md'

   with open(figures_md_path, 'w') as f:
       f.write("# Extracted Figures and Descriptions\n\n")
       f.write("**Source:** Extracted directly from PDF text\n\n")
       f.write("---\n\n")

       for fig_name in sorted(figures_summary.keys(), key=lambda x: int(re.search(r'\d+', x).group())):
           fig_data = figures_summary[fig_name]
           f.write(f"## {fig_name}\n\n")
           f.write(f"**Page:** {fig_data['images'][0]['page']}\n\n")
           f.write(f"**Description:**\n{fig_data['description']}\n\n")
           f.write(f"**Image Files:**\n")
           for img in fig_data['images']:
               f.write(f"- [images/{img['filename']}](./images/{img['filename']}) (page {img['page']})\n")
           f.write(f"\n**Preview:**\n")
           # Add embedded image preview (first image only to keep file size reasonable)
           f.write(f"![{fig_name}](./images/{fig_data['images'][0]['filename']})\n")
           f.write("\n---\n\n")

   print(f'✅ Created figures.md for human-readable descriptions')
   print()
   ```

4. **Review and refine figure matches:**
   - Check `figures_summary` in metadata for matched figures
   - Verify descriptions are accurate and complete
   - Note any figures that weren't automatically matched
   - For unmatched images, manually add descriptions if critical

**Output:**
- Images saved to `images/` directory
- Enhanced metadata file with figure captions created
- Summary of figures identified with descriptions
- Count of extracted images and matched figures reported

**Metadata JSON Structure (for database import):**
```json
{
  "paper": "Author(Year)-Title",
  "pdf": "filename.pdf",
  "total_images": 57,
  "total_pages": 78,
  "total_figures_identified": 15,
  "extracted_date": "2025-11-17T...",
  "figures_summary": {
    "Figure 1": {
      "description": "Full caption text from paper (not truncated)",
      "images": [
        {"filename": "page_3_img_0.jpeg", "page": 3}
      ]
    }
  },
  "images": [
    {
      "filename": "page_3_img_0.jpeg",
      "page": 3,
      "index": 0,
      "format": "jpeg",
      "width": 2154,
      "height": 2524,
      "figure_number": "Figure 1",
      "description": "Full caption text from paper (not truncated)"
    }
  ]
}
```

**Figures Markdown Structure (for human readability):**
```markdown
# Extracted Figures and Descriptions

**Source:** Extracted directly from PDF text

---

## Figure 1

**Page:** 3

**Description:**
Full caption text from paper...

**Image Files:**
- [images/page_3_img_0.jpeg](./images/page_3_img_0.jpeg) (page 3)

**Preview:**
![Figure 1](./images/page_3_img_0.jpeg)

---
```

**Note:** This extracts embedded images and automatically matches them to figure captions from the PDF text. Descriptions are taken directly from the paper (not inferred). The JSON is optimized for database import, while the markdown provides human-readable documentation. For scanned PDFs or complex layouts, some manual review may be needed.

---

### STEP 2: Create Paper Index (paper-index.md)

**File:** `build-data/learning/thermo-papers/[FOLDER_NAME]/paper-index.md`

**Template location:** `build-data/documentation/THERMO_PAPER_ANALYSIS_INSTRUCTIONS.md` (Section: "Template for paper-index.md")

**Critical sections to complete:**

#### 📄 Paper Metadata
- Full citation, authors, year, journal, pages, DOI
- PDF filename
- Study area, mineral type, analysis method
- Sample count, age range

#### 🗂️ Document Structure
- Navigation table linking to analysis sections
- Use format: `[#anchor-name](./paper-analysis.md#anchor-name)`

#### 📊 Data Tables in Paper
**This is CRITICAL for /thermoextract integration!**

For each table in the paper:
| Table # | Page | Description | Data Type | Extractable? |
|---------|------|-------------|-----------|--------------|
| Table 1 | p. X | AFT ages and track data | Ages/counts/lengths | ✅ Yes |
| Table 2 | p. Y | Sample locations | Sample metadata | ✅ Yes |
| Table A1 | p. Z | Supplementary chemistry | Chemistry | ⚠️ Complex |

**Identify the primary data table** - Which table has the main dataset?

#### 🎯 Quick Facts (For /thermoextract Automation)
**CRITICAL - Fill these out carefully:**

- **Study Location:** [Full location name, Country]
- **Coordinates:** [Lat/Lon range if provided in paper]
- **Mineral Analyzed:** [apatite/zircon/titanite/etc - lowercase]
- **Method:** [EDM/LA-ICP-MS/Both]
- **Sample ID Pattern:** `^[REGEX_PATTERN]$`
  - **IMPORTANT:** This must be a valid regex pattern
  - Examples:
    - `^MU\d{2}-\d{2}$` (matches MU19-05, MU20-12)
    - `^[A-Z]{2,4}\d{2}-\d{2,3}$` (matches XX19-05, XXXX20-123)
    - Analyze the sample IDs in Table 1 to determine the pattern
- **Column Naming:** [Numbered (0,1,2...) / Named (sample_id, age...) / Mixed]
- **Age Type:** [Pooled / Central / Both]
- **Has Track Lengths:** [Yes/No]
- **Has Chemistry Data:** [Yes/No - list what: Dpar, Cl, rmr0, etc]

#### 🔑 Key Findings (1-Line Each)
- List 5 key findings with specific numbers/results

#### 💾 Database Relevance
- Schema alignment rating: ⭐⭐⭐⭐⭐ (out of 5)
- Map to tables: samples, ft_ages, ft_counts, ft_track_lengths
- List any new fields needed

#### 🚀 Implementation Priority
- **HIGH:** [1-2 critical features]
- **MEDIUM:** [2-3 important features]
- **LOW:** [1-2 nice-to-have features]

**Validation before moving to next step:**
- [ ] All metadata fields filled
- [ ] Sample ID pattern is valid regex
- [ ] Primary data table identified
- [ ] All Quick Facts completed
- [ ] At least 5 key findings documented

---

### STEP 3: Create Full Analysis (paper-analysis.md)

**File:** `build-data/learning/thermo-papers/[FOLDER_NAME]/paper-analysis.md`

**Template location:** `build-data/documentation/THERMO_PAPER_ANALYSIS_INSTRUCTIONS.md` (Section: "Template structure with anchors")

**Required sections with anchor tags:**

#### Header
```markdown
# AUTHOR(YEAR) - TITLE

**Full Analysis with Navigable Sections**

[Link back to index](./paper-index.md)

---
```

#### 1. Executive Summary
```markdown
## <a id="executive-summary"></a>1. Executive Summary

[2-3 comprehensive paragraphs covering scope, methods, key findings, significance]

**Key takeaways:**
- [Takeaway 1]
- [Takeaway 2]
- [Takeaway 3]
```

#### 2. Key Problem Addressed
```markdown
## <a id="problem-addressed"></a>2. Key Problem Addressed

**Gap Filled:** [What specific problem?]

**Specific Problems:**
1. [Problem 1 with context]
2. [Problem 2 with context]
3. [Problem 3 with context]

**Historical Context:** [Evolution of the field]
```

#### 3. Methods/Study Design
```markdown
## <a id="methods"></a>3. Methods/Study Design

### 3.1 Analytical Methods
[EDM, LA-ICP-MS, or other methods]

**Age equations used:**
```
[Mathematical formulas or pseudocode]
```

### 3.2 Statistical Methods
[Uncertainty propagation, mixture modeling, etc]

### 3.3 Study Area & Samples
**Location:** [Geographic details]
**Samples:** [N] samples from [context]
**Sample IDs:** [Pattern description]
```

#### 4. Results
```markdown
## <a id="results"></a>4. Results

### 4.1 Age Determinations
[Specific ages with uncertainties - use tables]

### 4.2 Track Length Data
[If applicable - distributions, annealing patterns]

### 4.3 Geological Interpretations
[Thermal history, exhumation, tectonics]
```

#### 5. Data Tables in Paper
```markdown
## <a id="data-tables"></a>5. Data Tables in Paper

### Table 1: [Title] (Page X)

**Columns:**
- Column 1: [Description]
- Column 2: [Description]
- ...

**Sample IDs:** [Pattern with examples]
**Row count:** [N] valid data rows

**Extraction notes for /thermoextract:**
- Primary table: Table [N]
- Sample ID regex: `^[PATTERN]$`
- Invalid row indicators: [footer text, headers to skip]
- Column mapping notes: [Numbered vs named columns]
```

#### 6. EDM vs LA-ICP-MS Comparison (if applicable)
```markdown
## <a id="method-comparison"></a>6. EDM vs LA-ICP-MS Comparison

[Detailed comparison if paper discusses both methods]

| Aspect | EDM | LA-ICP-MS |
|--------|-----|-----------|
| [Aspect 1] | [Detail] | [Detail] |
```

#### 7. Relevance to Database
```markdown
## <a id="database"></a>7. Relevance to Database

**Schema Alignment:** ⭐⭐⭐⭐⭐ (X/5)

### Mapping to Current Schema

**`samples` table:**
- `sample_id`: Maps to [column in paper]
- `latitude`: Maps to [column/value]
- `longitude`: Maps to [column/value]
- `mineral_type`: [value from paper]
- `analysis_method`: [EDM/LA-ICP-MS]

**`ft_ages` table:**
- `central_age_ma`: Maps to [column]
- `central_age_error_ma`: Maps to [column]
- `dispersion_pct`: Maps to [column]

**`ft_counts` table:**
- `ns`: Maps to [column]
- `rho_s_cm2`: Maps to [column]

**`ft_track_lengths` table:**
- `mean_track_length_um`: Maps to [column]

### New Fields Required
[List any fields not in current schema]
```

#### 8. Visualization Opportunities
```markdown
## <a id="visualizations"></a>8. Visualization Opportunities

### 8.1 Radial Plots
**Purpose:** [What geological question?]
**Data:** From `ft_ages` + `ft_counts` tables
**Implementation:** D3.js/Plotly
**Priority:** HIGH/MEDIUM/LOW

### 8.2 Age-Elevation Profiles
**Purpose:** [Exhumation rates]
**Data:** `samples.elevation_m`, `ft_ages.central_age_ma`

### 8.3 [Other Visualizations]
```

#### 9. Statistical/Analytical Implementation
```markdown
## <a id="implementation"></a>9. Statistical/Analytical Implementation

### 9.1 Age Calculations

```javascript
// Example: Central age calculation
function calculateCentralAge(grainAges, errors) {
  // Implementation based on paper
}
```

### 9.2 Uncertainty Propagation

```sql
-- Example: Query with error propagation
SELECT
  sample_id,
  central_age_ma,
  SQRT(POWER(central_age_error_ma, 2) + POWER(systematic_error, 2)) as total_error
FROM ft_ages;
```
```

#### 10. Feature Ideas for Data Platform
```markdown
## 10. Feature Ideas for Data Platform

### HIGH PRIORITY (MUST HAVE)

1. **[Feature 1]**
   - **What:** [Description]
   - **Why:** [Justification from paper]
   - **Effort:** [Small/Medium/Large]

### MEDIUM PRIORITY
[2-3 features]

### LOW PRIORITY
[1-2 features]
```

#### 11. Key Quotes
```markdown
## 11. Key Quotes

> "[Important quote 1]" (p. X)

> "[Important quote 2]" (p. Y)
```

#### 12. Action Items
```markdown
## 12. Action Items

**Immediate:**
- [ ] [Action 1]
- [ ] [Action 2]

**Short-term:**
- [ ] [Action 3]

**Long-term:**
- [ ] [Action 4]
```

#### Footer
```markdown
---

## References Cited in This Paper

[Key references that might warrant further reading]

---

**Created:** [YYYY-MM-DD]
**Last Updated:** [YYYY-MM-DD]

[Back to index](./paper-index.md)
```

---

### STEP 4: Quality Check

**Validate completeness:**

**paper-index.md:**
- [ ] All metadata fields populated
- [ ] Sample ID pattern is valid regex
- [ ] All tables listed with extractability status
- [ ] Primary data table identified
- [ ] **Extracted figures section completed**
- [ ] All Quick Facts completed
- [ ] At least 5 key findings
- [ ] Database relevance rating provided
- [ ] Implementation priorities categorized

**paper-analysis.md:**
- [ ] All 12 sections present
- [ ] All sections have proper `<a id="..."></a>` anchor tags
- [ ] Links back to index at top and bottom
- [ ] Database field mappings are specific
- [ ] At least one code example provided
- [ ] Key quotes with page numbers
- [ ] **Extracted figures referenced in visualizations section**
- [ ] Created/updated dates filled in

**images/ directory:**
- [ ] Images extracted successfully
- [ ] image-metadata.json created with figure captions
- [ ] figures_summary section populated with descriptions from paper
- [ ] Key figures identified and descriptions verified
- [ ] Figure descriptions taken directly from paper text (not inferred)

**Integration readiness:**
- [ ] Sample ID regex pattern can be used by /thermoextract
- [ ] Mineral type is lowercase (apatite/zircon/etc)
- [ ] Analysis method matches expected format (EDM/LA-ICP-MS/Both)
- [ ] Table locations documented for extraction

**If any checks fail, fix before proceeding.**

---

### STEP 5: Summary Report

**Report what was created:**

```
✅ PAPER ANALYSIS COMPLETE

📂 Folder: build-data/learning/thermo-papers/[FOLDER_NAME]/
📄 Files created:
   - [PDF_NAME].pdf (copied)
   - paper-index.md ([X] KB)
   - paper-analysis.md ([Y] KB)
   - figures.md ([Z] KB) - Human-readable figure descriptions
   - images/ directory with [N] images
   - images/image-metadata.json - JSON for database import

📊 Metadata extracted:
   - Authors: [NAMES]
   - Year: [YYYY]
   - Study location: [LOCATION]
   - Mineral: [TYPE]
   - Method: [EDM/LA-ICP-MS]
   - Samples: [N]
   - Age range: [X.X - Y.Y Ma]

📋 Tables identified:
   - Primary table: Table [N] (page [X])
   - [M] total tables documented
   - [K] tables marked as extractable

📸 Images extracted:
   - Total images: [N] from [M] pages
   - Figures identified: [K] with descriptions from paper text
   - Unmatched images: [X] (no caption found)
   - Catalog: images/image-metadata.json with figure captions

✅ Ready for /thermoextract: Yes/No
   [If No, explain what's missing]

🚀 Next steps:
   1. Review the analysis for accuracy
   2. Review figures.md for full figure descriptions
   3. Review extracted images (images/ directory)
   4. Run /thermoextract with the PDF path
   5. Extraction will automatically use metadata from paper-index.md
```

---

## ⚠️ Important Notes

### Sample ID Pattern Examples

**Common patterns:**
- `^[A-Z]{2}\d{2}-\d{2}$` - Two letters, 2 digits, dash, 2 digits (MU19-05)
- `^[A-Z]{2,4}\d{2}-\d{2,3}$` - 2-4 letters, 2 digits, dash, 2-3 digits
- `^[A-Z]+\d+-\d+$` - Flexible letter count and digit count
- `^[A-Z]{2}\d{2}-[A-Z]{2}\d{2}$` - Complex pattern (MU19-XX05)

**How to determine:**
1. Look at Table 1 sample IDs
2. Identify the pattern (prefix, numbers, separators)
3. Write regex that matches all valid IDs
4. Test mentally against the samples in the table

### Database Field Mapping

**Be specific!** Instead of:
- ❌ "Age data maps to ft_ages table"

Write:
- ✅ "`central_age_ma` maps to column 10 'Central Age (Ma)' in Table 1"
- ✅ "`dispersion_pct` maps to column 8 'Disp. (%)' in Table 1"

This helps /thermoextract know exactly which columns to extract.

### Anchor Tag Format

**Must use this exact format:**
```markdown
## <a id="section-name"></a>1. Section Title
```

**Not these:**
- ❌ `## 1. Section Title {#section-name}`
- ❌ `<a name="section-name"></a>`
- ❌ `## 1. Section Title <!-- section-name -->`

The `<a id="..."></a>` format works reliably for navigation.

---

## 🎯 Success Criteria

**A successful analysis should:**

1. **Enable fast navigation** - Claude can jump to specific sections without re-reading
2. **Support /thermoextract** - Metadata is accurate and usable for automation
3. **Document methods** - Anyone can understand what was done
4. **Map to database** - Clear field-level mappings
5. **Provide examples** - Code snippets show how to implement
6. **Be maintainable** - Clear structure, easy to update

**The ultimate test:**
- Can someone else use this analysis to understand the paper in 10 minutes?
- Can /thermoextract successfully extract data using the metadata?
- Can developers implement features based on the database mappings?

If yes to all three → Success! ✅

---

**Ready to start!** Ask the user for the PDF path and let's begin the analysis.
