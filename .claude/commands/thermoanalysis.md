# /thermoanalysis - Deep Paper Analysis with Indexed Navigation

**Status:** ✅ Ready for use | ⏳ Production deployment after ERROR-005 schema migration

**Purpose:** Create comprehensive, indexed analysis of thermochronology papers that integrates with /thermoextract

**Usage:** Provide PDF path and optional folder name

**Note:** This command is fully functional now but is recommended for production use **after ERROR-005 (EarthBank schema migration)** is complete. Database mapping templates will need minor updates when the new schema is deployed. See ERROR-008 for details.

**What it does:**
1. Reads the PDF thoroughly
2. Creates organized paper folder structure
3. Extracts plain text and layout metadata (for table detection)
4. Discovers tables dynamically (no hardcoded assumptions)
5. **Detects exact table page numbers (including multi-page tables)** ⭐ NEW
6. Extracts all images with figure captions from PDF text
7. **Downloads OSF/Zenodo supplemental material (if available)** ⭐ NEW
8. Inspects Excel files for data structure
9. Generates `paper-index.md` (quick reference with metadata and exact table pages)
10. Generates `paper-analysis.md` (full indexed analysis with anchors)
11. Generates `figures.md` (human-readable figure descriptions)
12. Generates `image-metadata.json` (structured data for database import)
13. Copies PDF to folder
14. Validates completeness for /thermoextract integration

**Output:**
```
build-data/learning/thermo-papers/AUTHOR(YEAR)-TITLE-JOURNAL/
├── [PDF_NAME].pdf
├── paper-index.md         # ⭐ Quick reference
├── paper-analysis.md      # 📚 Full analysis
├── figures.md             # 📋 Human-readable figure descriptions
├── images/                # 📸 Extracted figures
│   ├── page_1_img_0.png   # Figure 1
│   ├── page_3_img_1.png   # Figure 2
│   ├── page_5_img_0.png   # Figure 3
│   └── image-metadata.json # Image catalog (JSON for DB import)
├── text/                  # 📄 Plain text extraction
│   ├── plain-text.txt     # Reusable text extraction
│   ├── layout-data.json   # Spatial metadata (bbox, columns)
│   ├── table-pages.json   # Exact table page numbers (NEW)
│   └── text-index.md      # Table discovery results
└── supplemental/          # 📥 OSF/Zenodo downloads (if available)
    ├── README.md          # Download documentation
    ├── Tables_*.xlsx      # Data tables (Excel format)
    ├── SupplementaryText.pdf
    ├── SupplementaryFigures.pdf
    └── [other files]
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
2. **Paper folder name** (optional) - Format: `AUTHOR(YEAR)-TITLE-JOURNAL` (e.g., `Peak(2021)-Grand-Canyon-Great-Unconformity-Geology`)
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

### STEP 1.5: Extract Plain Text + Layout Metadata from PDF (IDEA-012 + IDEA-013)

**Actions:**

1. **Create text directory:**
   ```python
   text_dir = paper_dir / 'text'
   text_dir.mkdir(exist_ok=True)
   ```

2. **Extract dual-format: plain text + layout metadata:**
   ```python
   import fitz  # PyMuPDF
   import json

   print('━' * 60)
   print('EXTRACTING TEXT + LAYOUT METADATA FROM PDF')
   print('━' * 60)
   print()

   doc = fitz.open(pdf_path)

   # Format 1: Plain text (existing format - keep unchanged for backward compatibility)
   plain_text = []
   for page_num, page in enumerate(doc, start=1):
       text = page.get_text("text")
       plain_text.append(f"--- PAGE {page_num} ---\n{text}\n")

   text_file = text_dir / 'plain-text.txt'
   with open(text_file, 'w', encoding='utf-8') as f:
       f.write('\n'.join(plain_text))

   print(f'✅ Extracted plain text from {len(doc)} pages')
   print(f'✅ Saved to: {text_file}')

   # Format 2: Layout data (NEW - spatial metadata for table extraction)
   layout_data = {
       "pdf": pdf_path.name,
       "total_pages": len(doc),
       "pages": []
   }

   for page_num, page in enumerate(doc, start=1):
       # Get text with layout information
       page_dict = page.get_text("dict")
       page_height = page.rect.height
       page_width = page.rect.width

       # Extract text blocks with coordinates
       blocks = []
       for block in page_dict["blocks"]:
           if block["type"] == 0:  # Text block only
               blocks.append({
                   "bbox": block["bbox"],  # [x0, y0, x1, y1]
                   "lines": [
                       {
                           "bbox": line["bbox"],
                           "text": " ".join([span["text"] for span in line["spans"]]),
                           "spans": [
                               {
                                   "text": span["text"],
                                   "bbox": span["bbox"],
                                   "font": span["font"],
                                   "size": span["size"]
                               }
                               for span in line["spans"]
                           ]
                       }
                       for line in block["lines"]
                   ]
               })

       # Detect table regions (clusters of densely-spaced text blocks)
       table_regions = _detect_table_regions(blocks, page_height)

       layout_data["pages"].append({
           "page_number": page_num,
           "height": page_height,
           "width": page_width,
           "blocks": blocks,
           "table_regions": table_regions
       })

   # Save layout data
   layout_file = text_dir / 'layout-data.json'
   with open(layout_file, 'w', encoding='utf-8') as f:
       json.dump(layout_data, f, indent=2)

   print(f'✅ Extracted layout metadata from {len(doc)} pages')
   print(f'✅ Detected {sum(len(p["table_regions"]) for p in layout_data["pages"])} table regions')
   print(f'✅ Saved to: {layout_file}')
   print()

   doc.close()
   ```

3. **Table region detection helper (add before STEP 1.5 usage):**
   ```python
   def _detect_table_regions(blocks, page_height, density_threshold=5):
       """
       Detect rectangular regions containing tables via vertical density clustering

       Args:
           blocks: List of text blocks with bbox coordinates
           page_height: Page height for coordinate normalization
           density_threshold: Min blocks per cluster to qualify as table region

       Returns:
           List of table regions with bbox coordinates
       """
       if not blocks:
           return []

       # Sort blocks by Y-position (top to bottom)
       sorted_blocks = sorted(blocks, key=lambda b: b["bbox"][1])

       # Cluster blocks by vertical proximity (tables have dense vertical spacing)
       clusters = []
       current_cluster = []

       for block in sorted_blocks:
           if not current_cluster:
               current_cluster.append(block)
           else:
               # Check vertical gap between this block and last block
               prev_y1 = current_cluster[-1]["bbox"][3]
               curr_y0 = block["bbox"][1]
               gap = curr_y0 - prev_y1

               if gap < 50:  # Close vertical spacing = likely same table
                   current_cluster.append(block)
               else:
                   # Gap too large, close cluster and start new one
                   if len(current_cluster) >= density_threshold:
                       clusters.append(current_cluster)
                   current_cluster = [block]

       # Add final cluster
       if current_cluster and len(current_cluster) >= density_threshold:
           clusters.append(current_cluster)

       # Calculate bounding box for each cluster
       table_regions = []
       for cluster in clusters:
           x0 = min(b["bbox"][0] for b in cluster)
           y0 = min(b["bbox"][1] for b in cluster)
           x1 = max(b["bbox"][2] for b in cluster)
           y1 = max(b["bbox"][3] for b in cluster)

           table_regions.append({
               "bbox": [x0, y0, x1, y1],
               "block_count": len(cluster)
           })

       return table_regions
   ```

**Why This Matters:**
- **Extract ONCE, reuse MANY times** - Token efficient (~33% reduction)
- **Backward compatible** - Plain text format unchanged, existing workflows still work
- **Spatial awareness** - Layout metadata enables 90%+ column detection accuracy
- **Table detection** - Auto-identify table regions via density clustering
- **Feeds existing code** - `table_extractors.py` can use real coordinates instead of heuristics

---

### STEP 1.6: Discover Tables Dynamically + Column Positions (IDEA-012 + IDEA-013)

**Actions:**

1. **Column detection helper (add before STEP 1.6 usage):**
   ```python
   def _detect_column_positions(table_region_bbox, page_blocks, tolerance=15.0):
       """
       Detect column positions within a table region via X-coordinate clustering

       Args:
           table_region_bbox: [x0, y0, x1, y1] bounding box of table region
           page_blocks: List of text blocks from layout-data.json for this page
           tolerance: Max distance between items in same column (pixels)

       Returns:
           List of column X-positions (sorted left to right)
       """
       if not table_region_bbox or not page_blocks:
           return []

       # Filter blocks within table region
       x0, y0, x1, y1 = table_region_bbox
       table_blocks = [
           block for block in page_blocks
           if (block["bbox"][0] >= x0 - 10 and block["bbox"][2] <= x1 + 10 and
               block["bbox"][1] >= y0 - 10 and block["bbox"][3] <= y1 + 10)
       ]

       # Collect all X-coordinates from text spans
       x_coords = []
       for block in table_blocks:
           for line in block["lines"]:
               for span in line["spans"]:
                   x_coords.append(span["bbox"][0])  # Left edge of each word

       if not x_coords:
           return []

       # Cluster X-coordinates (DBSCAN-like approach)
       x_coords_sorted = sorted(set(x_coords))
       clusters = []
       current_cluster = [x_coords_sorted[0]]

       for x in x_coords_sorted[1:]:
           if x - current_cluster[-1] <= tolerance:
               current_cluster.append(x)
           else:
               # Close cluster, record mean position
               clusters.append(round(sum(current_cluster) / len(current_cluster), 1))
               current_cluster = [x]

       # Add final cluster
       if current_cluster:
           clusters.append(round(sum(current_cluster) / len(current_cluster), 1))

       return clusters
   ```

2. **Discover tables using pattern matching + spatial metadata:**
   ```python
   import re
   import json

   print('━' * 60)
   print('DISCOVERING TABLES + COLUMN POSITIONS')
   print('━' * 60)
   print()

   # Read plain text content
   with open(text_file, 'r', encoding='utf-8') as f:
       text_content = f.read()

   # Load layout data for spatial metadata
   with open(layout_file, 'r', encoding='utf-8') as f:
       layout_data = json.load(f)

   discovered_tables = []

   # Pattern 1: "Table X" references (flexible numbering)
   table_pattern = r'(?:Table|TABLE)\s+([A-Z]?\d+[A-Za-z]?)'
   matches = re.finditer(table_pattern, text_content)

   seen_tables = set()  # Avoid duplicates

   for match in matches:
       table_ref = match.group(0)
       table_num = match.group(1)

       # Skip if already discovered
       if table_num in seen_tables:
           continue
       seen_tables.add(table_num)

       # Get surrounding context (200 chars after reference)
       context = text_content[match.start():match.end()+200]

       # Detect table type from context (adaptive keywords)
       table_type = 'unknown'
       context_lower = context.lower()

       if any(kw in context_lower for kw in ['fission', 'track', 'aft', 'apatite fission']):
           table_type = 'AFT'
       elif any(kw in context_lower for kw in ['u-th', 'he', 'helium', '(u-th)/he', 'ahe']):
           table_type = 'He'
       elif any(kw in context_lower for kw in ['sample', 'location', 'coordinate', 'lithology']):
           table_type = 'Sample_Metadata'
       elif any(kw in context_lower for kw in ['empa', 'chemistry', 'mineral composition', 'wt%', 'apfu']):
           table_type = 'Chemistry'

       # Estimate page number from text position
       page_estimate = text_content[:match.start()].count('--- PAGE')

       # Find matching table region from layout data
       bbox = None
       column_positions = []

       if page_estimate > 0 and page_estimate <= len(layout_data["pages"]):
           page_data = layout_data["pages"][page_estimate - 1]

           # Find table region on this page (use largest region as heuristic)
           if page_data["table_regions"]:
               # Sort by block count (descending) and take first (largest table)
               table_region = sorted(page_data["table_regions"],
                                   key=lambda r: r["block_count"],
                                   reverse=True)[0]
               bbox = table_region["bbox"]

               # Detect column positions for this table region
               column_positions = _detect_column_positions(
                   bbox,
                   page_data["blocks"]
               )

       discovered_tables.append({
           'name': table_ref,
           'number': table_num,
           'type': table_type,
           'page_estimate': page_estimate,
           'bbox': bbox,  # NEW: Bounding box from layout data
           'column_positions': column_positions,  # NEW: Detected column X-coordinates
           'context': context[:150]
       })

   print(f'✅ Discovered {len(discovered_tables)} tables:')
   for table in discovered_tables:
       cols_info = f', {len(table["column_positions"])} columns' if table["column_positions"] else ''
       print(f'   - {table["name"]} (Type: {table["type"]}, Page: ~{table["page_estimate"]}{cols_info})')
   print()
   ```

**Why This Matters:**
- Works for ANY paper (1 table or 20+ tables)
- Discovers table types automatically (AFT/He/Metadata/Chemistry)
- **NEW: Detects bbox from layout-data.json** (enables targeted extraction)
- **NEW: Detects column positions via X-coordinate clustering** (90%+ accuracy)
- Feeds real coordinates to `table_extractors.py` instead of heuristics

---

### STEP 1.7: Generate Text Index with Spatial Metadata (IDEA-012 + IDEA-013)

**Actions:**

1. **Create text-index.md with discovered table metadata + column positions:**
   ```python
   text_index_path = text_dir / 'text-index.md'

   with open(text_index_path, 'w') as f:
       f.write("# Plain Text Index + Spatial Metadata\n\n")
       f.write("**Source:** Extracted from PDF using PyMuPDF\n")
       f.write(f"**Total Pages:** {len(doc)}\n")
       f.write(f"**Tables Discovered:** {len(discovered_tables)}\n")
       f.write(f"**Spatial Metadata:** layout-data.json (bbox, column positions)\n\n")
       f.write("---\n\n")

       f.write("## Discovered Tables\n\n")
       f.write("| Table | Type | Page | Columns | Bbox (x0, y0, x1, y1) | Context Preview |\n")
       f.write("|-------|------|------|---------|------------------------|------------------|\n")
       for table in discovered_tables:
           context_preview = table['context'][:40].replace('\n', ' ') + '...'
           num_cols = len(table['column_positions']) if table['column_positions'] else 0
           bbox_str = f"[{', '.join(f'{x:.0f}' for x in table['bbox'])}]" if table['bbox'] else 'N/A'
           f.write(f"| {table['name']} | {table['type']} | {table['page_estimate']} | {num_cols} | {bbox_str} | {context_preview} |\n")

       # Add detailed spatial metadata section
       f.write("\n---\n\n")
       f.write("## Spatial Metadata (for table_extractors.py)\n\n")
       for table in discovered_tables:
           if table['bbox'] and table['column_positions']:
               f.write(f"### {table['name']} ({table['type']})\n\n")
               f.write(f"- **Page:** {table['page_estimate']}\n")
               f.write(f"- **Bbox:** `[{', '.join(f'{x:.1f}' for x in table['bbox'])}]`\n")
               f.write(f"- **Columns Detected:** {len(table['column_positions'])}\n")
               f.write(f"- **Column X-Positions:** `{table['column_positions']}`\n\n")
               f.write("```python\n")
               f.write(f"# Usage in extraction:\n")
               f.write(f"bbox = {table['bbox']}\n")
               f.write(f"column_x_positions = {table['column_positions']}\n")
               f.write("```\n\n")

       f.write("---\n\n")
       f.write("## File Structure\n\n")
       f.write("- `plain-text.txt` - Full text extraction (reusable)\n")
       f.write("- `layout-data.json` - Spatial metadata (bbox, font, size, table regions)\n")
       f.write("- `text-index.md` - This file (discovered table locations + column positions)\n")
       f.write("\n---\n\n")
       f.write("**Next Steps:**\n")
       f.write("- Run `/thermoextract` to extract tables using multi-method approach\n")
       f.write("- Extraction will use bbox and column_positions for precise table parsing\n")
       f.write("- Column positions enable 90%+ accuracy in multi-column table extraction\n")

   print(f'✅ Created text index with spatial metadata: {text_index_path}')
   print()

   doc.close()
   ```

**Output:**
- `text/plain-text.txt` - Full text extraction (reusable)
- `text/layout-data.json` - Spatial metadata (NEW: bbox, columns)
- `text/text-index.md` - Discovered table locations + column positions (ENHANCED)

---

### STEP 1.75: Detect Exact Table Page Numbers (Multi-Page Detection)

**Actions:**

1. **Scan plain-text.txt to find exact page numbers for each discovered table:**
   ```python
   print('━' * 60)
   print('DETECTING EXACT TABLE PAGE NUMBERS')
   print('━' * 60)
   print()

   # Read the plain text file
   with open(text_file, 'r', encoding='utf-8') as f:
       lines = f.readlines()

   # Build a map of line number -> page number
   line_to_page = {}
   current_page = 0
   for line_num, line in enumerate(lines, start=1):
       if line.startswith('--- PAGE '):
           current_page = int(line.split()[2])
       line_to_page[line_num] = current_page

   # For each discovered table, find its exact page location
   table_page_info = {}

   for table in discovered_tables:
       table_name = table['name']
       table_pages = []

       # Search for the exact table header in plain text
       for line_num, line in enumerate(lines, start=1):
           # Match exact table name (e.g., "Table 1", "Table A2")
           if re.match(rf'^{re.escape(table_name)}$', line.strip()):
               page = line_to_page.get(line_num, table['page_estimate'])
               if page not in table_pages:
                   table_pages.append(page)

           # Also check for "Table X (continued)" or "Table X (1/2)" patterns
           if re.match(rf'^{re.escape(table_name)}\s+\(', line.strip()):
               page = line_to_page.get(line_num, table['page_estimate'])
               if page not in table_pages:
                   table_pages.append(page)

       # Store page information
       if table_pages:
           table_pages.sort()
           table_page_info[table_name] = {
               'pages': table_pages,
               'is_multipage': len(table_pages) > 1,
               'page_range': f"{table_pages[0]}" if len(table_pages) == 1 else f"{table_pages[0]}-{table_pages[-1]}"
           }
       else:
           # Fallback to page estimate
           table_page_info[table_name] = {
               'pages': [table['page_estimate']],
               'is_multipage': False,
               'page_range': str(table['page_estimate'])
           }

   # Print results
   print(f'✅ Detected exact page locations for {len(table_page_info)} tables:\n')
   for table_name, info in table_page_info.items():
       multipage_marker = ' (MULTI-PAGE)' if info['is_multipage'] else ''
       print(f'   - {table_name}: Page(s) {info["page_range"]}{multipage_marker}')
   print()

   # Save table page info for use in documentation generation
   table_pages_file = text_dir / 'table-pages.json'
   with open(table_pages_file, 'w') as f:
       json.dump(table_page_info, f, indent=2)

   print(f'✅ Saved table page information: {table_pages_file}')
   print()
   ```

**Output:**
- `text/table-pages.json` - Exact page numbers for each table (including multi-page detection)
- Console output showing page ranges for all tables

**Why This Matters:**
- **Accurate metadata:** paper-index.md and paper-analysis.md will have exact page numbers
- **Multi-page detection:** Automatically identifies tables that span multiple pages (e.g., "Table 2: Pages 10-11")
- **Extraction guidance:** Helps `/thermoextract` know which pages to process for each table
- **Missing table detection:** Identifies tables referenced in text but not present as standalone tables

---

### STEP 1.8: Extract Images from PDF (IDEA-008)

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

### STEP 1.9: Download OSF Supplemental Material (MANDATORY if available)

**Actions:**

1. **Detect OSF/repository links in extracted text:**
   ```python
   import re
   import subprocess

   print('━' * 60)
   print('DETECTING SUPPLEMENTAL DATA REPOSITORIES')
   print('━' * 60)
   print()

   # Read plain text to find repository links
   with open(text_file, 'r', encoding='utf-8') as f:
       text_content = f.read()

   # Pattern 1: OSF DOI links
   osf_pattern = r'(?:https?://)?(?:doi\.org/)?10\.17605/OSF\.IO/([A-Z0-9]{5})'
   osf_matches = re.finditer(osf_pattern, text_content, re.IGNORECASE)

   # Pattern 2: Direct OSF links
   osf_direct_pattern = r'(?:https?://)?osf\.io/([a-z0-9]{5})'
   osf_direct_matches = re.finditer(osf_direct_pattern, text_content, re.IGNORECASE)

   # Pattern 3: Zenodo, Figshare, Dryad (for future)
   zenodo_pattern = r'(?:https?://)?(?:doi\.org/)?10\.5281/zenodo\.(\d+)'

   repositories = []

   for match in osf_matches:
       osf_id = match.group(1).lower()
       repositories.append({
           'type': 'OSF',
           'id': osf_id,
           'url': f'https://osf.io/{osf_id}/',
           'api_url': f'https://api.osf.io/v2/nodes/{osf_id}/files/osfstorage/'
       })

   for match in osf_direct_matches:
       osf_id = match.group(1).lower()
       # Avoid duplicates
       if not any(r['id'] == osf_id for r in repositories):
           repositories.append({
               'type': 'OSF',
               'id': osf_id,
               'url': f'https://osf.io/{osf_id}/',
               'api_url': f'https://api.osf.io/v2/nodes/{osf_id}/files/osfstorage/'
           })

   if repositories:
       print(f'✅ Found {len(repositories)} data repository links:')
       for repo in repositories:
           print(f'   - {repo["type"]}: {repo["url"]}')
   else:
       print('⚠️  No OSF/Zenodo/Figshare links found in paper')
       print('   Skipping supplemental material download')

   print()
   ```

2. **Download OSF files using API:**
   ```python
   import json
   import requests
   from pathlib import Path

   if repositories:
       # Create supplemental directory
       supplemental_dir = paper_dir / 'supplemental'
       supplemental_dir.mkdir(exist_ok=True)

       for repo in repositories:
           if repo['type'] == 'OSF':
               print(f'📥 Downloading from OSF repository: {repo["id"]}')
               print()

               try:
                   # Fetch file list from OSF API
                   response = requests.get(repo['api_url'], timeout=30)
                   response.raise_for_status()
                   data = response.json()

                   files_downloaded = []
                   folders_found = []

                   for item in data['data']:
                       name = item['attributes']['name']
                       kind = item['attributes']['kind']

                       if kind == 'file':
                           # Download file
                           download_url = item['links']['download']
                           file_path = supplemental_dir / name

                           print(f'   Downloading: {name}')
                           file_response = requests.get(download_url, timeout=300)
                           file_response.raise_for_status()

                           with open(file_path, 'wb') as f:
                               f.write(file_response.content)

                           files_downloaded.append({
                               'name': name,
                               'size': item['attributes'].get('size', 'unknown'),
                               'path': str(file_path)
                           })

                       elif kind == 'folder':
                           # Track folders for recursive download
                           folders_found.append({
                               'name': name,
                               'api_url': item['relationships']['files']['links']['related']['href']
                           })

                   # Download files from subfolders
                   for folder in folders_found:
                       folder_dir = supplemental_dir / folder['name']
                       folder_dir.mkdir(exist_ok=True)

                       print(f'   📁 Entering folder: {folder["name"]}')

                       folder_response = requests.get(folder['api_url'], timeout=30)
                       folder_data = folder_response.json()

                       for item in folder_data['data']:
                           if item['attributes']['kind'] == 'file':
                               name = item['attributes']['name']
                               download_url = item['links']['download']
                               file_path = folder_dir / name

                               print(f'      Downloading: {name}')
                               file_response = requests.get(download_url, timeout=300)

                               with open(file_path, 'wb') as f:
                                   f.write(file_response.content)

                               files_downloaded.append({
                                   'name': f'{folder["name"]}/{name}',
                                   'size': item['attributes'].get('size', 'unknown'),
                                   'path': str(file_path)
                               })

                   print()
                   print(f'✅ Downloaded {len(files_downloaded)} files from OSF')

                   # Create README documenting downloads
                   readme_path = supplemental_dir / 'README.md'
                   with open(readme_path, 'w') as f:
                       f.write(f"# Supplemental Material\n\n")
                       f.write(f"**Downloaded from:** {repo['url']}\n")
                       f.write(f"**Downloaded on:** {datetime.now().strftime('%Y-%m-%d')}\n\n")
                       f.write(f"---\n\n")
                       f.write(f"## Files Downloaded ({len(files_downloaded)} total)\n\n")
                       for file_info in files_downloaded:
                           size_mb = file_info['size'] / (1024*1024) if isinstance(file_info['size'], int) else 'unknown'
                           size_str = f"{size_mb:.1f} MB" if isinstance(size_mb, float) else size_mb
                           f.write(f"- `{file_info['name']}` ({size_str})\n")
                       f.write(f"\n---\n\n")
                       f.write(f"**Repository URL:** {repo['url']}\n")

                   print(f'✅ Created supplemental/README.md')

               except Exception as e:
                   print(f'❌ Error downloading from OSF: {str(e)}')
                   print(f'   Repository may be private or URL may be incorrect')
                   print(f'   Manual download required: {repo["url"]}')

               print()
   ```

3. **Detect Excel data files and inspect structure:**
   ```python
   # If Excel files were downloaded, inspect their structure
   excel_files = list(supplemental_dir.glob('*.xlsx')) if supplemental_dir.exists() else []

   if excel_files:
       print('📊 Inspecting Excel file structure:')
       print()

       for excel_file in excel_files:
           try:
               import openpyxl
               wb = openpyxl.load_workbook(excel_file, read_only=True)

               print(f'   File: {excel_file.name}')
               print(f'   Sheets: {len(wb.sheetnames)}')

               for sheet_name in wb.sheetnames[:5]:  # First 5 sheets
                   ws = wb[sheet_name]
                   print(f'      - {sheet_name} ({ws.max_row} rows × {ws.max_column} cols)')

               if len(wb.sheetnames) > 5:
                   print(f'      ... and {len(wb.sheetnames) - 5} more sheets')

               print()

           except Exception as e:
               print(f'   ⚠️ Could not inspect {excel_file.name}: {str(e)}')
   ```

**Why This Matters:**
- **Many papers (30-40%) host data externally** on OSF, Zenodo, Figshare
- **Manual download is tedious** and error-prone
- **Automated download ensures completeness** for /thermoextract workflow
- **README documentation** tracks what was downloaded and when
- **Excel inspection** helps understand data structure before import

**Output:**
- `supplemental/` directory with all downloaded files
- `supplemental/README.md` documenting downloads
- Console output showing download progress and file structure

**Fallback:**
- If OSF link not found → Skip (print warning)
- If download fails → Print manual download URL
- If private repository → Instruct user to download manually

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

**IMPORTANT: Use exact table page numbers from `text/table-pages.json`**

First, load the table page information:
```python
import json
with open(text_dir / 'table-pages.json', 'r') as f:
    table_page_info = json.load(f)
```

For each table in the paper, create a row with:
- **Table #** - Table name (e.g., "Table 1", "Table A2")
- **Page(s)** - Use `table_page_info[table_name]['page_range']` for exact pages
  - Single page: "9"
  - Multi-page: "10-11" or "22-36"
  - Not found: "❌ Not found" (referenced but not present)
- **Description** - Brief description of contents
- **Data Type** - Type of data (AFT ages, AHe data, etc.)
- **Extractable?** - ✅ Yes / ⚠️ Complex / ❌ No
- **Priority** - HIGH / MEDIUM / LOW

Example table:
| Table # | Page(s) | Description | Data Type | Extractable? | Priority |
|---------|---------|-------------|-----------|--------------|----------|
| **Table 1** | **9** | **AFT results summary** (35 samples) | AFT ages, counts, chemistry | ✅ **PRIMARY** | **HIGH** |
| **Table 2** | **10-11** | **(U-Th-Sm)/He results** (spans 2 pages) | AHe single grain ages | ✅ Yes | HIGH |
| Table A1 | ❌ Not found | EPMA composition (referenced but not present) | Chemistry | ❌ No | N/A |
| Table A2 | 22-36 | Detailed composition (spans 15 pages!) | Elemental data | ⚠️ Complex | LOW |

**Add notes section below the table:**
```markdown
**Notes on Table Locations:**
- **Table 1** is a single-page table on page 9 (complete AFT summary)
- **Table 2** spans pages 10-11 (labeled "Table 2 (1/2)" on p.10, "continued" on p.11)
- **Table A1** is referenced in text (p.13) but does not appear as a standalone table
- **Table A2** is extensive, spanning pages 22-36 with multiple "continued" sections
```

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

**NOTE:** Use exact page numbers from `text/table-pages.json` when documenting table locations.
- Single page tables: "### Table 1: Title (Page 9)"
- Multi-page tables: "### Table 2: Title (Pages 10-11)" with note about page span
- Missing tables: "### Table A1: Title (NOT FOUND)" with explanation

### Table 1: [Title] (Page X or Pages X-Y)

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
- [ ] **Table page numbers accurate** (from text/table-pages.json)
- [ ] **Multi-page tables noted** (e.g., "Pages 10-11", "Pages 22-36")
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

**text/ directory:**
- [ ] plain-text.txt created successfully
- [ ] layout-data.json created with spatial metadata
- [ ] **table-pages.json created with exact page numbers**
- [ ] text-index.md created with table discovery results

**Integration readiness:**
- [ ] Sample ID regex pattern can be used by /thermoextract
- [ ] Mineral type is lowercase (apatite/zircon/etc)
- [ ] Analysis method matches expected format (EDM/LA-ICP-MS/Both)
- [ ] **Table page numbers verified** (single-page vs multi-page)
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
   - text/plain-text.txt - Full text extraction
   - text/layout-data.json - Spatial metadata
   - **text/table-pages.json - Exact table page numbers** ⭐ NEW
   - text/text-index.md - Table discovery results

📊 Metadata extracted:
   - Authors: [NAMES]
   - Year: [YYYY]
   - Study location: [LOCATION]
   - Mineral: [TYPE]
   - Method: [EDM/LA-ICP-MS]
   - Samples: [N]
   - Age range: [X.X - Y.Y Ma]

📋 Tables identified:
   - Primary table: Table [N] (page(s) [X] or [X-Y])
   - [M] total tables documented
   - [K] tables marked as extractable
   - Multi-page tables: [List tables that span multiple pages, e.g., "Table 2 (10-11)", "Table A2 (22-36)"]
   - Page information saved: text/table-pages.json

📸 Images extracted:
   - Total images: [N] from [M] pages
   - Figures identified: [K] with descriptions from paper text
   - Unmatched images: [X] (no caption found)
   - Catalog: images/image-metadata.json with figure captions

📥 Supplemental material:
   - OSF/Zenodo repositories found: [Yes/No]
   - Files downloaded: [N] files ([X] MB total)
   - Location: supplemental/ directory
   - README created: supplemental/README.md
   - Excel files: [List names if present]

✅ Ready for /thermoextract: Yes/No
   [If No, explain what's missing]

🚀 Next steps:
   1. Review the analysis for accuracy
   2. Review figures.md for full figure descriptions
   3. Review extracted images (images/ directory)
   4. Review supplemental/ directory (if OSF files downloaded)
   5. Inspect Excel files for data structure (if present)
   6. Run /thermoextract with the PDF path (or import from Excel if data is in supplemental)
   7. Extraction will automatically use metadata from paper-index.md
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
