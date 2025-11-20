# /thermoanalysis - Deep Paper Analysis with Indexed Navigation

**Status:** ✅ Ready for use | 🚀 Optimized for ANY PDF size | 🌐 Works on ANY research paper

**Purpose:** Create comprehensive, indexed analysis of research papers with automatic metadata extraction, table tracking, and multi-format documentation

**Usage:** Provide PDF path (folder name auto-generated from paper metadata)

**Key Rule:** ❌ NEVER read the PDF directly - ✅ Extract text first, read text file only

**Recent Updates (2025-11-20):**
- 📚 **APPENDIX TABLE FIX** - Now extracts ALL tables including appendices (Table A1, A2, etc.) automatically
- 🔍 **SMART TABLE DETECTION** - Intelligently selects actual table locations vs. references in text
- 🌐 **UNIVERSAL PAPER SUPPORT** - Works on ANY research paper type, not just thermochronology
- 🎯 **METADATA-FIRST WORKFLOW** - Extract text → Parse metadata → Create accurately named folder
- 📍 **LINE NUMBER TRACKING** - Tracks exact text location of each table for precise extraction
- 📄 **MULTI-FORMAT TABLE EXTRACTION** - Screenshots (PNG) + PDF sections + text line ranges
- 🔗 **TABLE INDEX** - Links all 3 formats by table name for validation in /thermoextract
- 🌐 **SUPPLEMENTARY NOTE-ONLY** - Detects OSF/Zenodo URLs, notes in report (no download)
- 🧠 **THOUGHTFUL EXECUTION** - Validation checkpoints between phases prevent errors
- ✅ **TEXT-ONLY ANALYSIS** - All metadata from plain-text.txt (80-90% token savings)

---

## ⚠️ CRITICAL WORKFLOW RULES

**📌 NEVER READ THE PDF DIRECTLY - ALWAYS USE EXTRACTED TEXT**

The workflow is designed to be token-efficient by:
1. ✅ **Extract text ONCE** using PyMuPDF (Python script) → saves to `text/plain-text.txt`
2. ✅ **Read ONLY the text file** using Read tool (NOT the PDF)
3. ✅ **Analyze from text** - all metadata extraction, table discovery, etc.
4. ❌ **NEVER use Read tool on the PDF** - wastes tokens, breaks on large files

**Why this matters:**
- 📄 **PDF = images** - High token cost, requires OCR/rendering
- 📝 **Text file = plain text** - Low token cost, fast processing
- 🚀 **80-90% token savings** on large papers
- ✅ **No file size limits** for text extraction (PyMuPDF has no limits)

---

**BEFORE starting analysis, the workflow will:**

1. ✅ **Check dependencies** - PyMuPDF (fitz) must be installed
   - Auto-detects if PyMuPDF is installed
   - If missing, installs in project's virtual environment (`.venv/`)
   - **Never attempts system-wide install** (avoids macOS externally-managed-environment errors)

2. ✅ **Extract text using PyMuPDF** - Saves to `text/plain-text.txt`
   - Works on ANY PDF size (no 32MB limit)
   - Extracts all pages at once
   - Reusable for future analysis

3. ✅ **Read extracted text file** - NOT the PDF
   - Use: `Read(file_path='text/plain-text.txt')`
   - NOT: `Read(file_path='paper.pdf')` ❌

4. ✅ **Proceed with analysis** - All metadata from text file

---

## ℹ️ SCHEMA COMPATIBILITY (EarthBank v2.1)

**Status:** ✅ Compatible with EarthBank camelCase schema

**Core Functions (Schema-Agnostic):**
- ✅ Text extraction (STEP 1-4) - No database interaction
- ✅ Image extraction (STEP 5) - No database interaction
- ✅ OSF downloads (STEP 6) - No database interaction
- ✅ Metadata generation (STEP 7-8) - Creates markdown files only

**Optional Database Integration (STEP 11):**
- Uses EarthBank camelCase field names: `sampleID`, `centralAgeMa`, `pooledAgeMa`
- Compatible with `earthbank_*` tables
- See `thermoanalysis-database-update.md` for database population instructions

**Schema Version:** v2.1 (EarthBank camelCase Native)
**See:** `.claude/CLAUDE.md` for schema details

---

**What it does:**
1. **Extracts text to TEMP location** using PyMuPDF (minimal token usage)
2. **Parses metadata from text** (author, year, title, journal)
3. **Creates accurately named folder** using parsed metadata: `AUTHOR(YEAR)-TITLE-JOURNAL`
4. **Discovers tables dynamically** from extracted text (works on any paper type)
5. **Tracks table locations in 3 formats**:
   - Line numbers in plain-text.txt (start/end ranges)
   - Screenshots with bbox coordinates (PNG)
   - PDF sections (individual table pages as PDFs)
6. **Creates table index** linking all 3 formats by table name
7. **Detects exact page numbers** (including multi-page tables)
8. **Extracts images** with figure captions from PDF
9. **Reviews image relevance** (filters data vs context figures)
10. **Detects supplementary file URLs** (OSF/Zenodo) - notes in report, NO download
11. **Generates comprehensive documentation**:
    - `paper-index.md` (quick reference with exact table locations)
    - `paper-analysis.md` (full indexed analysis)
    - `tables.md` (visual table reference + line numbers)
    - `figures.md` (figure catalog)
    - `table-index.json` (structured linking of all 3 formats)
12. **Validation checkpoints** after each phase ensure accuracy
13. **Calculates token usage & estimated API cost**

**Output:**
```
build-data/learning/papers/AUTHOR(YEAR)-TITLE-JOURNAL/
├── [PDF_NAME].pdf
├── paper-index.md              # ⭐ Quick reference (includes supplementary URLs)
├── paper-analysis.md           # 📚 Full analysis
├── figures.md                  # 📋 Human-readable figure descriptions
├── tables.md                   # 📊 Visual table reference + line numbers
├── table-index.json            # 🔗 Links all 3 table formats (NEW)
├── images/                     # 📸 Extracted figures & table screenshots
│   ├── page_1_img_0.png        # Figure 1
│   ├── page_3_img_1.png        # Figure 2
│   ├── tables/                 # 📊 Table screenshots
│   │   ├── table_1_page_9.png
│   │   ├── table_2_page_10.png
│   │   └── table_2_page_11.png
│   └── image-metadata.json     # Image catalog
├── text/                       # 📄 Plain text extraction
│   ├── plain-text.txt          # Reusable text extraction
│   ├── layout-data.json        # Spatial metadata (bbox, columns)
│   ├── table-pages.json        # Exact table page numbers
│   └── text-index.md           # Table discovery results
└── extracted/                  # 📄 Table PDFs (individual pages) (NEW)
    ├── table-1-page-9.pdf      # Table 1 (single page)
    ├── table-2-page-10-11.pdf  # Table 2 (multi-page)
    └── [other tables]
```

**Note:** Supplementary files (OSF/Zenodo) are **detected and noted** in documentation, but NOT downloaded. Manual download instructions included in paper-index.md if needed.

**Next steps after completion:**
- Review the generated analysis for accuracy
- Run `/thermoextract` to extract data tables (will use the multi-format index)
- Use table-index.json to validate extraction across all 3 formats

---

## 🎯 Your Task

You are analyzing a research paper to create **indexed, navigable documentation** that will:
- Help Claude quickly find information without re-reading the entire paper
- Provide multi-format table tracking for precise data extraction in `/thermoextract`
- Document the paper's methods, results, and key findings
- Work on ANY paper type (geology, chemistry, biology, physics, etc.)

**Automatic Workflow:**
1. User provides PDF path
2. Extract text to TEMP location
3. Parse metadata from text (author, year, title, journal)
4. Create folder: `build-data/learning/papers/AUTHOR(YEAR)-TITLE-JOURNAL/`
5. Move PDF + text into accurately named folder
6. Continue with table discovery and documentation generation

---

## 📋 Systematic Workflow

**CRITICAL CHANGE:** Workflow now extracts text FIRST → parses metadata → creates accurately named folder. This ensures folder names are always correct and avoids manual corrections.

---

### STEP 0: Extract Text to Temporary Location (Metadata-First Approach)

**Purpose:** Extract text BEFORE folder creation so we can parse accurate metadata for folder naming.

**IMPORTANT:** This workflow is optimized to minimize context drain. We extract text FIRST using Python (cheap), then analyze the text. **We NEVER read the PDF directly using the Read tool.**

**Workflow:**
1. ✅ Extract text to TEMP location using PyMuPDF
2. ✅ Read the TEXT FILE (not PDF) → Parse metadata (author, year, title, journal)
3. ✅ Use metadata to create accurately named folder
4. ✅ Move PDF + text into folder
5. ❌ NEVER use `Read(file_path='paper.pdf')`

**Actions:**

1. Get PDF path from user (NO folder name needed - auto-generated from metadata)

2. **Start time tracking:**
   ```python
   import time
   from datetime import datetime

   # Record start time
   start_time = time.time()
   start_datetime = datetime.now()

   print()
   print('━' * 60)
   print('STARTING /THERMOANALYSIS WORKFLOW')
   print('━' * 60)
   print(f'📅 Started: {start_datetime.strftime("%Y-%m-%d %H:%M:%S")}')
   print()
   ```

3. **Check and install dependencies (PyMuPDF in virtual environment):**
   ```python
   import subprocess
   import sys

   print('━' * 60)
   print('CHECKING DEPENDENCIES')
   print('━' * 60)
   print()

   # Check if PyMuPDF is installed
   try:
       import fitz  # PyMuPDF
       print('✅ PyMuPDF (fitz) is already installed')
       print()
   except ImportError:
       print('⚠️  PyMuPDF (fitz) not found')
       print('📦 Installing PyMuPDF in virtual environment...')
       print()

       # Use project's virtual environment or create one
       venv_path = Path('/Users/keithdimech/Pathway/Dev/Clair/Thermo-App/.venv')

       if venv_path.exists():
           # Use existing venv
           pip_path = venv_path / 'bin' / 'pip'
           python_path = venv_path / 'bin' / 'python'
           print(f'   Using existing virtual environment: {venv_path}')
       else:
           # Create new venv
           print(f'   Creating virtual environment: {venv_path}')
           subprocess.run([sys.executable, '-m', 'venv', str(venv_path)], check=True)
           pip_path = venv_path / 'bin' / 'pip'
           python_path = venv_path / 'bin' / 'python'

       # Install PyMuPDF in venv
       result = subprocess.run(
           [str(pip_path), 'install', 'pymupdf', '--quiet'],
           capture_output=True,
           text=True
       )

       if result.returncode != 0:
           print(f'❌ Failed to install PyMuPDF: {result.stderr}')
           raise RuntimeError('Could not install PyMuPDF')

       print('✅ PyMuPDF installed successfully')
       print()

       # Import after installation
       import fitz

   print('✅ All dependencies ready')
   print()
   ```

4. **Create temporary directory for initial extraction:**
   ```python
   import tempfile
   import shutil
   from pathlib import Path

   # Create temp directory for extraction
   temp_dir = Path(tempfile.mkdtemp(prefix='paper-analysis-'))
   temp_text_dir = temp_dir / 'text'
   temp_text_dir.mkdir(exist_ok=True)

   print(f'📁 Created temporary extraction directory: {temp_dir}')
   print()
   ```

5. **Extract text using PyMuPDF (NOT Read tool) to TEMP location:**

   ```python
   import fitz  # PyMuPDF
   import json
   from pathlib import Path

   print('━' * 60)
   print('EXTRACTING TEXT FROM PDF TO TEMP (PyMuPDF)')
   print('━' * 60)
   print(f'📄 PDF: {pdf_path.name}')
   print('📍 Temp location: Allows metadata parsing before folder creation')
   print('💡 Strategy: Extract text ONCE, read text file many times')
   print('❌ We will NEVER use Read tool on the PDF')
   print()

   doc = fitz.open(pdf_path)
   page_count = len(doc)

   print(f'📊 Pages: {page_count}')
   print(f'🚀 Extracting text + layout metadata...')
   print()

   # Format 1: Plain text (existing format - keep unchanged for backward compatibility)
   plain_text = []
   for page_num, page in enumerate(doc, start=1):
       text = page.get_text("text")
       plain_text.append(f"--- PAGE {page_num} ---\n{text}\n")

   text_file = temp_text_dir / 'plain-text.txt'
   with open(text_file, 'w', encoding='utf-8') as f:
       f.write('\n'.join(plain_text))

   print(f'✅ Extracted plain text from {len(doc)} pages')
   print(f'✅ Saved to temp: {text_file}')

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
   layout_file = temp_text_dir / 'layout-data.json'
   with open(layout_file, 'w', encoding='utf-8') as f:
       json.dump(layout_data, f, indent=2)

   print(f'✅ Extracted layout metadata from {len(doc)} pages')
   print(f'✅ Detected {sum(len(p["table_regions"]) for p in layout_data["pages"])} table regions')
   print(f'✅ Saved to temp: {layout_file}')
   print()

   doc.close()
   ```

6. **Table region detection helper (add this function before step 5 usage):**
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

7. **Parse metadata from extracted text (CRITICAL - determines folder name):**

   Now that we have the text extracted to `text/plain-text.txt`, we can parse metadata **without ever touching the PDF**.

   ```python
   import re

   print('━' * 60)
   print('PARSING METADATA FROM EXTRACTED TEXT')
   print('━' * 60)
   print(f'📝 Reading: {text_file}')
   print('✅ This is a TEXT file, not a PDF (fast & efficient)')
   print()

   # ✅ CORRECT: Read the text file
   with open(text_file, 'r', encoding='utf-8') as f:
       full_text = f.read()

   # ❌ WRONG: Never do this
   # Read(file_path=pdf_path)  # DON'T READ THE PDF!

   print('🔍 Extracting metadata for folder naming...')
   print()

   # Parse first 3 pages for citation metadata (most papers have it there)
   first_pages = '\n'.join(full_text.split('--- PAGE')[1:4])

   # Extract AUTHOR (last name of first author)
   # Common patterns: "Smith et al.", "Smith, J., Jones, K.", "John Smith"
   author_patterns = [
       r'([A-Z][a-z]+)\s+et\s+al\.',  # "Smith et al."
       r'([A-Z][a-z]+),\s+[A-Z]\.',   # "Smith, J."
       r'by\s+([A-Z][a-z]+)',         # "by Smith"
   ]

   author = None
   for pattern in author_patterns:
       match = re.search(pattern, first_pages)
       if match:
           author = match.group(1)
           break

   if not author:
       author = "Unknown"
       print('⚠️  Could not detect author from text')
   else:
       print(f'✅ Author detected: {author}')

   # Extract YEAR
   # Look for 4-digit year (2000-2099) near common keywords
   year_pattern = r'\b(20[0-2][0-9])\b'
   year_matches = re.findall(year_pattern, first_pages)

   year = None
   if year_matches:
       # Use most common year (likely publication year)
       year = max(set(year_matches), key=year_matches.count)
       print(f'✅ Year detected: {year}')
   else:
       year = "YEAR"
       print('⚠️  Could not detect year from text')

   # Extract TITLE
   # Look for title in first page (usually larger font or capitalized)
   # Heuristic: Find longest capitalized sentence in first page
   first_page_only = full_text.split('--- PAGE')[1].split('--- PAGE')[0] if '--- PAGE' in full_text else full_text[:2000]

   lines = [line.strip() for line in first_page_only.split('\n') if line.strip()]
   title_candidates = []

   for line in lines:
       # Skip very short lines or lines with common headers
       if len(line) < 20 or len(line) > 200:
           continue
       if any(kw in line.lower() for kw in ['abstract', 'introduction', 'keywords', 'doi:', 'email', 'university']):
           continue
       # Look for title-like lines (mostly capitalized or title case)
       if line[0].isupper() and sum(c.isupper() for c in line) > len(line) * 0.3:
           title_candidates.append(line)

   title = None
   if title_candidates:
       # Use longest candidate (titles tend to be longer)
       title = max(title_candidates, key=len)
       # Trim to reasonable length and clean
       title = re.sub(r'[^\w\s-]', '', title)[:50]  # Remove special chars, max 50 chars
       title = '-'.join(title.split())  # Replace spaces with hyphens
       print(f'✅ Title detected: {title}')
   else:
       title = "Paper-Title"
       print('⚠️  Could not detect title from text')

   # Extract JOURNAL
   # Look for common journal indicators
   journal_patterns = [
       r'(?:Published in|Journal of|Geology|Science|Nature|PNAS|Chemical Geology)\s+([A-Z][^\n]+)',
       r'([A-Z][a-z]+\s+[A-Z][a-z]+)\s+(?:Vol\.|Volume)',
   ]

   journal = None
   for pattern in journal_patterns:
       match = re.search(pattern, first_pages, re.IGNORECASE)
       if match:
           journal = match.group(1).strip()
           journal = re.sub(r'[^\w\s]', '', journal)[:30]  # Clean and limit length
           journal = '-'.join(journal.split())
           break

   if not journal:
       journal = "Journal"
       print('⚠️  Could not detect journal from text')
   else:
       print(f'✅ Journal detected: {journal}')

   print()
   print('━' * 60)
   print('METADATA PARSING COMPLETE')
   print('━' * 60)
   print(f'Author: {author}')
   print(f'Year: {year}')
   print(f'Title: {title}')
   print(f'Journal: {journal}')
   print()

   # Generate folder name
   folder_name = f"{author}({year})-{title}-{journal}"
   print(f'📁 Generated folder name: {folder_name}')
   print()
   ```

**VALIDATION CHECKPOINT:**
```python
print('━' * 60)
print('VALIDATION CHECKPOINT: Metadata Parsing')
print('━' * 60)
print()
print('🔍 Review the generated folder name above.')
print('⚠️  If metadata looks incorrect, you can manually adjust before proceeding.')
print()
print('Press ENTER to continue with folder creation, or type new folder name:')
# In actual implementation, you might want to add user confirmation here
# For automated workflow, just proceed
print()
```

**Output:**
- `temp/text/plain-text.txt` - Full text extraction (will be moved to final folder)
- `temp/text/layout-data.json` - Spatial metadata (will be moved to final folder)
- Parsed metadata: author, year, title, journal
- Generated folder name: `AUTHOR(YEAR)-TITLE-JOURNAL`

---

### STEP 1: Create Folder and Move Files

**Purpose:** Create accurately named folder using parsed metadata, then move PDF and extracted text into it.

**Actions:**

1. **Create final folder structure:**
   ```python
   from pathlib import Path
   import shutil

   print('━' * 60)
   print('CREATING FINAL FOLDER STRUCTURE')
   print('━' * 60)
   print()

   # Create paper directory with parsed metadata
   base_dir = Path('/Users/keithdimech/Pathway/Dev/Clair/Thermo-App/build-data/learning/papers')
   base_dir.mkdir(parents=True, exist_ok=True)

   paper_dir = base_dir / folder_name

   if paper_dir.exists():
       print(f'⚠️  Folder already exists: {paper_dir}')
       print('   Appending timestamp to avoid overwrite...')
       from datetime import datetime
       timestamp = datetime.now().strftime('%Y%m%d-%H%M%S')
       folder_name = f"{folder_name}-{timestamp}"
       paper_dir = base_dir / folder_name

   paper_dir.mkdir(exist_ok=True)
   print(f'✅ Created folder: {paper_dir}')
   print()

   # Create subdirectories
   (paper_dir / 'images').mkdir(exist_ok=True)
   (paper_dir / 'images' / 'tables').mkdir(exist_ok=True)
   (paper_dir / 'extracted').mkdir(exist_ok=True)

   print('✅ Created subdirectories: images/, images/tables/, extracted/')
   print()
   ```

2. **Move PDF to final location:**
   ```python
   import shutil

   final_pdf_path = paper_dir / pdf_path.name
   shutil.copy2(pdf_path, final_pdf_path)

   print(f'✅ Copied PDF to: {final_pdf_path}')
   print()
   ```

3. **Move text extraction to final location:**
   ```python
   final_text_dir = paper_dir / 'text'
   shutil.move(str(temp_text_dir), str(final_text_dir))

   print(f'✅ Moved text extraction to: {final_text_dir}')
   print()

   # Cleanup temp directory
   shutil.rmtree(temp_dir)
   print(f'🗑️  Cleaned up temporary directory')
   print()
   ```

**VALIDATION CHECKPOINT:**
```python
print('━' * 60)
print('VALIDATION CHECKPOINT: Folder Creation')
print('━' * 60)
print()
print(f'✅ Folder created: {paper_dir}')
print(f'✅ PDF location: {final_pdf_path}')
print(f'✅ Text location: {final_text_dir}')
print()
print('Files ready for table discovery and analysis.')
print()
```

**Output:**
- Folder created: `build-data/learning/papers/AUTHOR(YEAR)-TITLE-JOURNAL/`
- PDF copied to folder
- Text extraction moved to folder
- Subdirectories created: `images/`, `images/tables/`, `extracted/`
- Temp directory cleaned up

**Why This Matters:**
- **Extract ONCE, read text file MANY times** - 80-90% token reduction vs reading PDF
- **NEVER read the PDF** - All metadata comes from the text file
- **No file size limits** - PyMuPDF handles any PDF size (100+ pages, 100+ MB)
- **Reusable** - Text file can be read multiple times with zero token cost
- **Backward compatible** - Plain text format unchanged, existing workflows still work
- **Spatial awareness** - Layout metadata enables 90%+ column detection accuracy
- **Table detection** - Auto-identify table regions via density clustering
- **Feeds existing code** - `table_extractors.py` can use real coordinates instead of heuristics

**Token Cost Comparison:**
- 📄 **Reading PDF directly:** ~50,000+ tokens for 50-page paper
- 📝 **Reading extracted text:** ~10,000 tokens (80% savings)
- 🎯 **Extract once, read many times:** First extraction + unlimited text reads

---

### STEP 2: Discover Tables Dynamically + Line Number Tracking (CRITICAL FOR EXTRACTION)

**Purpose:** Discover all tables in the paper and track their locations in 3 formats: line numbers (text file), page numbers (PDF), and bbox coordinates (layout data).

**NEW:** Line number tracking enables precise extraction from plain-text.txt for validation against PDF/image extraction.

**Actions:**

1. **Column detection helper (add before STEP 2 usage):**
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

2. **Discover tables using pattern matching + spatial metadata + LINE NUMBER TRACKING:**
   ```python
   import re
   import json

   print('━' * 60)
   print('DISCOVERING TABLES + LINE NUMBER TRACKING')
   print('━' * 60)
   print()

   # Read plain text content (entire file)
   with open(final_text_dir / 'plain-text.txt', 'r', encoding='utf-8') as f:
       text_content = f.read()

   # ALSO read as lines for line number tracking
   with open(final_text_dir / 'plain-text.txt', 'r', encoding='utf-8') as f:
       text_lines = f.readlines()

   # Build character position to line number map
   char_to_line = []
   char_pos = 0
   for line_num, line in enumerate(text_lines, start=1):
       for char in line:
           char_to_line.append(line_num)
           char_pos += 1

   print(f'✅ Loaded text file: {len(text_content)} characters, {len(text_lines)} lines')
   print()

   # Load layout data for spatial metadata
   with open(final_text_dir / 'layout-data.json', 'r', encoding='utf-8') as f:
       layout_data = json.load(f)

   discovered_tables = []

   # Pattern 1: "Table X" references (flexible numbering)
   table_pattern = r'(?:Table|TABLE)\s+([A-Z]?\d+[A-Za-z]?)'
   matches = re.finditer(table_pattern, text_content)

   # Collect ALL occurrences of each table (don't skip duplicates!)
   # This is critical for finding actual table locations vs. references
   table_occurrences = {}

   for match in matches:
       table_ref = match.group(0)
       table_num = match.group(1)

       if table_num not in table_occurrences:
           table_occurrences[table_num] = []

       # Store ALL occurrences with metadata
       table_occurrences[table_num].append({
           'match': match,
           'table_ref': table_ref,
           'start_char': match.start(),
           'page_estimate': text_content[:match.start()].count('--- PAGE'),
           'context': text_content[match.start():match.end()+300]
       })

   # Now process each table, selecting the ACTUAL table location (not just first reference)
   for table_num, occurrences in table_occurrences.items():
       # Use heuristics to find the actual table header:
       # 1. Prefer occurrences in later pages (appendix tables)
       # 2. Prefer occurrences on their own line (standalone table header)
       # 3. Prefer occurrences followed by table-like keywords

       best_occurrence = max(occurrences, key=lambda occ: (
           occ['page_estimate'] > 15,  # Appendix tables are usually after page 15
           '\n' in text_content[max(0, occ['start_char']-10):occ['start_char']],  # Standalone line
           any(kw in occ['context'].lower() for kw in ['sample', 'results', 'measurement', 'summary', 'data'])
       ))

       # Use the best occurrence
       match = best_occurrence['match']
       table_ref = best_occurrence['table_ref']
       table_num = table_num

       # Calculate LINE NUMBERS (NEW - CRITICAL FOR EXTRACTION)
       start_char = match.start()
       end_char = match.end() + 1000  # Look ahead ~1000 chars for table end

       start_line = char_to_line[start_char] if start_char < len(char_to_line) else len(text_lines)

       # Estimate end line by looking for next section header or next table
       end_line_estimate = start_line + 50  # Default: assume ~50 lines per table
       next_section_patterns = [r'\n## ', r'\nTable \d+', r'\nFigure \d+', r'\n\d+\.\s+[A-Z]']

       search_text = text_content[match.end():match.end()+2000]
       for pattern in next_section_patterns:
           next_match = re.search(pattern, search_text)
           if next_match:
               next_char = match.end() + next_match.start()
               if next_char < len(char_to_line):
                   end_line_estimate = char_to_line[next_char]
                   break

       # Get surrounding context (200 chars after reference)
       context = text_content[match.start():match.end()+200]

       # Detect table type from context (GENERIC - works for ANY paper type)
       table_type = 'Data'  # Default type
       context_lower = context.lower()

       # Generic table type detection (NOT thermochronology-specific)
       if any(kw in context_lower for kw in ['sample', 'specimen', 'location', 'coordinate', 'site']):
           table_type = 'Metadata'
       elif any(kw in context_lower for kw in ['result', 'measurement', 'data', 'analysis']):
           table_type = 'Results'
       elif any(kw in context_lower for kw in ['chemistry', 'composition', 'element', 'concentration', 'wt%']):
           table_type = 'Chemistry'
       elif any(kw in context_lower for kw in ['supplementary', 'supporting', 'additional']):
           table_type = 'Supplementary'

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
           'start_line': start_line,  # NEW: Line number in plain-text.txt (start)
           'end_line': end_line_estimate,  # NEW: Line number in plain-text.txt (end, estimated)
           'bbox': bbox,  # Bounding box from layout data
           'column_positions': column_positions,  # Detected column X-coordinates
           'context': context[:150]
       })

   print(f'✅ Discovered {len(discovered_tables)} tables:')
   for table in discovered_tables:
       cols_info = f', {len(table["column_positions"])} columns' if table["column_positions"] else ''
       lines_info = f'Lines {table["start_line"]}-{table["end_line"]}'
       print(f'   - {table["name"]} (Type: {table["type"]}, Page: ~{table["page_estimate"]}, {lines_info}{cols_info})')
   print()
   ```

**VALIDATION CHECKPOINT:**
```python
print('━' * 60)
print('VALIDATION CHECKPOINT: Table Discovery')
print('━' * 60)
print()
print(f'✅ Discovered {len(discovered_tables)} tables')
print('✅ Line numbers tracked for precise text extraction')
print('✅ Bbox coordinates tracked for PDF extraction')
print('✅ Column positions tracked for structured parsing')
print()
print('Review table locations above. All 3 formats (text lines, PDF pages, bbox) are tracked.')
print()
```

**Why This Matters:**
- **Works for ANY paper type** (geology, chemistry, biology, physics, etc.)
- Discovers table types automatically using GENERIC keywords (NOT thermochronology-specific)
- **NEW: Tracks LINE NUMBERS** in plain-text.txt (enables precise text extraction)
- **NEW: Tracks START and END lines** for each table (enables extraction validation)
- Detects bbox from layout-data.json (enables targeted PDF extraction)
- Detects column positions via X-coordinate clustering (90%+ accuracy)
- **Enables 3-way validation** in /thermoextract: text extraction vs PDF extraction vs image extraction

---

### STEP 3: Generate Text Index with Line Numbers + Spatial Metadata

**Purpose:** Create comprehensive table index tracking all 3 location formats (line numbers, page numbers, bbox).

**Actions:**

1. **Create text-index.md with LINE NUMBERS + spatial metadata:**
   ```python
   text_index_path = final_text_dir / 'text-index.md'

   with open(text_index_path, 'w') as f:
       f.write("# Plain Text Index + Line Number Tracking + Spatial Metadata\n\n")
       f.write("**Source:** Extracted from PDF using PyMuPDF\n")
       f.write(f"**Total Pages:** {page_count}\n")
       f.write(f"**Tables Discovered:** {len(discovered_tables)}\n")
       f.write(f"**Tracking:** Line numbers (text), page numbers (PDF), bbox coordinates (layout)\n\n")
       f.write("---\n\n")

       f.write("## Discovered Tables (Multi-Format Tracking)\n\n")
       f.write("| Table | Type | Page | Lines (Start-End) | Columns | Bbox | Context Preview |\n")
       f.write("|-------|------|------|-------------------|---------|------|------------------|\n")
       for table in discovered_tables:
           context_preview = table['context'][:30].replace('\n', ' ') + '...'
           num_cols = len(table['column_positions']) if table['column_positions'] else 0
           bbox_str = f"[{int(table['bbox'][0])},{int(table['bbox'][1])}..." if table['bbox'] else 'N/A'
           lines_str = f"{table['start_line']}-{table['end_line']}"
           f.write(f"| {table['name']} | {table['type']} | {table['page_estimate']} | {lines_str} | {num_cols} | {bbox_str} | {context_preview} |\n")

       # Add detailed spatial metadata section
       f.write("\n---\n\n")
       f.write("## Detailed Location Data (for /thermoextract)\n\n")
       for table in discovered_tables:
           f.write(f"### {table['name']} ({table['type']})\n\n")
           f.write(f"- **Page:** {table['page_estimate']}\n")
           f.write(f"- **Lines:** {table['start_line']}-{table['end_line']} (plain-text.txt)\n")
           if table['bbox']:
               f.write(f"- **Bbox:** `[{', '.join(f'{x:.1f}' for x in table['bbox'])}]`\n")
           if table['column_positions']:
               f.write(f"- **Columns Detected:** {len(table['column_positions'])}\n")
               f.write(f"- **Column X-Positions:** `{table['column_positions']}`\n")
           f.write("\n")
           f.write("```python\n")
           f.write(f"# Extraction from plain-text.txt:\n")
           f.write(f"with open('plain-text.txt') as f:\n")
           f.write(f"    lines = f.readlines()\n")
           f.write(f"    table_text = ''.join(lines[{table['start_line']}-1:{table['end_line']}])\n\n")
           if table['bbox']:
               f.write(f"# Extraction from PDF:\n")
               f.write(f"bbox = {table['bbox']}\n")
           if table['column_positions']:
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

### STEP 4: Detect Exact Table Page Numbers (Multi-Page Detection)

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

### STEP 5: Extract Table PDF Sections (NEW - Multi-Format Table Tracking)

**Purpose:** Extract individual table pages as separate PDF files. This provides the 3rd format for table tracking (text lines + screenshots + PDF sections).

**Why:** Enables `/thermoextract` to use PDF extraction tools on isolated tables, reducing extraction errors and enabling format validation.

**Actions:**

1. **Create extracted directory:**
   ```python
   extracted_dir = paper_dir / 'extracted'
   extracted_dir.mkdir(exist_ok=True)

   print('━' * 60)
   print('EXTRACTING TABLE PDF SECTIONS')
   print('━' * 60)
   print()
   ```

2. **Extract each table as a separate PDF:**
   ```python
   import fitz  # PyMuPDF
   from pathlib import Path

   # Re-open PDF for extraction
   pdf_doc = fitz.open(final_pdf_path)

   extracted_tables = []

   for table in discovered_tables:
       table_name = table['name']
       table_num = table['number']

       # Get page range from table_page_info (from STEP 4)
       page_info = table_page_info.get(table_name, {})
       pages = page_info.get('pages', [table['page_estimate']])

       if not pages:
           print(f'⚠️  Skipping {table_name}: No pages detected')
           continue

       # Create output filename
       if len(pages) == 1:
           output_filename = f"table-{table_num}-page-{pages[0]}.pdf"
       else:
           output_filename = f"table-{table_num}-page-{pages[0]}-{pages[-1]}.pdf"

       output_path = extracted_dir / output_filename

       # Create new PDF with only the table pages
       table_pdf = fitz.open()  # New empty PDF

       for page_num in pages:
           # PyMuPDF uses 0-based indexing
           if 0 <= (page_num - 1) < len(pdf_doc):
               table_pdf.insert_pdf(pdf_doc, from_page=page_num-1, to_page=page_num-1)

       # Save table PDF
       table_pdf.save(str(output_path))
       table_pdf.close()

       extracted_tables.append({
           'table_name': table_name,
           'table_num': table_num,
           'pages': pages,
           'pdf_file': output_filename,
           'pdf_path': str(output_path.relative_to(paper_dir))
       })

       print(f'✅ Extracted {table_name}: {output_filename} ({len(pages)} page(s))')

   pdf_doc.close()
   print()
   print(f'✅ Extracted {len(extracted_tables)} tables as separate PDFs')
   print()
   ```

**VALIDATION CHECKPOINT:**
```python
print('━' * 60)
print('VALIDATION CHECKPOINT: Table PDF Extraction')
print('━' * 60)
print()
print(f'✅ Extracted {len(extracted_tables)} table PDFs to: {extracted_dir}')
print(f'✅ Format 1: Text lines tracked in plain-text.txt')
print(f'✅ Format 2: Screenshots in images/tables/')
print(f'✅ Format 3: PDF sections in extracted/')
print()
print('All 3 formats ready for validation in /thermoextract')
print()
```

**Output:**
- `extracted/table-{N}-page-{P}.pdf` - Individual table PDFs (single page)
- `extracted/table-{N}-page-{P1}-{P2}.pdf` - Multi-page table PDFs
- Tracking data for linking to other formats

---

### STEP 6: Create Table Index Linking All 3 Formats (NEW - CRITICAL FOR VALIDATION)

**Purpose:** Create `table-index.json` that links all 3 table formats (text lines, PDF pages, PDF sections) by table name. This enables 3-way validation in `/thermoextract`.

**Actions:**

1. **Generate comprehensive table index:**
   ```python
   import json
   from pathlib import Path

   print('━' * 60)
   print('CREATING TABLE INDEX (3-FORMAT LINKING)')
   print('━' * 60)
   print()

   table_index = {
       "metadata": {
           "pdf_name": pdf_path.name,
           "folder_name": folder_name,
           "total_tables": len(discovered_tables),
           "extraction_date": datetime.now().isoformat()
       },
       "tables": []
   }

   for table in discovered_tables:
       table_name = table['name']

       # Find corresponding PDF file from extracted_tables
       pdf_file = next(
           (t['pdf_file'] for t in extracted_tables if t['table_name'] == table_name),
           None
       )

       # Find table PDF page file (from Step 3.6)
       table_pdf_files = list((paper_dir / 'images' / 'tables').glob(f"*table*{table['number']}*.pdf"))

       # Get table PDF info from metadata
       table_pdf_info = next(
           (t for t in table_pdfs if t['table_name'] == table_name),
           None
       )

       table_entry = {
           "name": table_name,
           "number": table['number'],
           "type": table['type'],
           "locations": {
               "text_file": {
                   "file": "text/plain-text.txt",
                   "start_line": table['start_line'],
                   "end_line": table['end_line']
               },
               "pdf_section": {
                   "file": f"extracted/{pdf_file}" if pdf_file else None,
                   "pages": table_page_info.get(table_name, {}).get('pages', [table['page_estimate']])
               },
               "pdf_pages": {
                   "file": str(table_pdf_files[0].relative_to(paper_dir)) if table_pdf_files else None,
                   "pages": table_pdf_info['pages'] if table_pdf_info else table_page_info.get(table_name, {}).get('pages', [table['page_estimate']]),
                   "bbox": table['bbox']
               }
           },
           "metadata": {
               "column_positions": table['column_positions'],
               "context_preview": table['context'][:100]
           }
       }

       table_index["tables"].append(table_entry)

   # Save table index
   table_index_path = paper_dir / 'table-index.json'
   with open(table_index_path, 'w', encoding='utf-8') as f:
       json.dump(table_index, f, indent=2, ensure_ascii=False)

   print(f'✅ Created table index: {table_index_path}')
   print(f'✅ Linked {len(table_index["tables"])} tables across 3 formats')
   print()

   # Print summary
   print('Table Index Summary:')
   for entry in table_index["tables"]:
       formats_available = []
       if entry["locations"]["text_file"]["start_line"]:
           formats_available.append("Text")
       if entry["locations"]["pdf_section"]["file"]:
           formats_available.append("PDF-Section")
       if entry["locations"]["pdf_pages"]["file"]:
           pages_count = len(entry['locations']['pdf_pages']['pages'])
           formats_available.append(f"PDF-Pages({pages_count})")

       formats_str = ", ".join(formats_available)
       print(f'   - {entry["name"]}: {formats_str}')

   print()
   ```

**VALIDATION CHECKPOINT:**
```python
print('━' * 60)
print('VALIDATION CHECKPOINT: Table Index Created')
print('━' * 60)
print()
print(f'✅ table-index.json created with {len(table_index["tables"])} tables')
print('✅ Each table links to: text lines, PDF section, PDF pages')
print('✅ Ready for 3-way validation in /thermoextract')
print()
print('Example usage in /thermoextract:')
print('  1. Extract from text lines (fast, simple)')
print('  2. Extract from PDF section (structured, accurate)')
print('  3. Extract from PDF pages (direct PDF extraction, best quality)')
print('  4. Compare all 3 methods → validate data quality')
print()
```

**Output:**
- `table-index.json` - Comprehensive index linking all 3 table formats
- JSON structure enabling programmatic access to table locations
- Validation metadata for quality assurance

**Why This Matters:**
- **3-way validation:** Compare extraction results from text, PDF sections, and PDF pages
- **Quality assurance:** Detect extraction errors by comparing formats
- **Flexibility:** Choose best extraction method per table type
- **Automation-ready:** JSON format enables scripted extraction workflows

---

### STEP 7: Extract Images from PDF (Figures Only)

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

3.6. **Extract table PDFs (using discovered tables from STEP 2):**
   ```python
   import fitz  # PyMuPDF
   import json

   print('━' * 60)
   print('EXTRACTING TABLE PDFs')
   print('━' * 60)
   print()

   # Create tables subdirectory
   tables_dir = images_dir / 'tables'
   tables_dir.mkdir(exist_ok=True)

   # Load discovered tables from STEP 2
   # (discovered_tables list from STEP 2 should be available)
   # If not, load from text/text-index.md or re-discover

   # Load table page info from STEP 4
   table_pages_file = text_dir / 'table-pages.json'
   with open(table_pages_file, 'r') as f:
       table_page_info = json.load(f)

   source_doc = fitz.open(pdf_path)
   table_pdfs = []

   for table in discovered_tables:
       table_name = table['name']
       table_type = table['type']

       # Get page info
       page_info = table_page_info.get(table_name, {})
       pages = page_info.get('pages', [table['page_estimate']])
       is_multipage = page_info.get('is_multipage', False)

       # Skip invalid pages
       valid_pages = [p for p in pages if 1 <= p <= len(source_doc)]
       if not valid_pages:
           print(f'   ⚠️ Skipping {table_name}: no valid pages found')
           continue

       # Create new PDF for this table
       table_pdf = fitz.open()  # Empty PDF

       # Extract pages from source document
       for page_num in valid_pages:
           # insert_pdf() uses 0-based indexing
           table_pdf.insert_pdf(source_doc, from_page=page_num-1, to_page=page_num-1)

       # Generate filename based on page range
       table_filename = table_name.lower().replace(' ', '_').replace('.', '')

       if len(valid_pages) == 1:
           # Single page table
           pdf_filename = f"{table_filename}_page_{valid_pages[0]}.pdf"
       else:
           # Multi-page table (combine into single PDF)
           pdf_filename = f"{table_filename}_page_{valid_pages[0]}-{valid_pages[-1]}.pdf"

       pdf_path_out = tables_dir / pdf_filename
       table_pdf.save(str(pdf_path_out))
       table_pdf.close()

       # Get bbox from discovered table metadata (kept for reference only)
       bbox = table.get('bbox')

       # Record metadata
       table_pdf_info = {
           "table_name": table_name,
           "table_type": table_type,
           "pages": valid_pages,
           "filename": f"tables/{pdf_filename}",
           "is_multipage": is_multipage or len(valid_pages) > 1,
           "bbox": bbox if bbox else None,
           "page_count": len(valid_pages)
       }

       table_pdfs.append(table_pdf_info)

       if len(valid_pages) == 1:
           print(f'   ✅ Extracted {table_name} (page {valid_pages[0]}) → {pdf_filename}')
       else:
           print(f'   ✅ Extracted {table_name} (pages {valid_pages[0]}-{valid_pages[-1]}) → {pdf_filename}')

   source_doc.close()

   print()
   print(f'✅ Extracted {len(table_pdfs)} table PDF(s) from {len(discovered_tables)} table(s)')
   print()

   # Add table PDFs to main metadata
   metadata['table_pdfs'] = table_pdfs
   with open(metadata_path, 'w') as f:
       json.dump(metadata, f, indent=2)

   print(f'✅ Table PDFs added to image-metadata.json')
   print()
   ```

3.7. **Generate tables.md (reference for all tables):**
   ```python
   # Create tables.md for quick reference
   tables_md_path = paper_dir / 'tables.md'

   with open(tables_md_path, 'w') as f:
       f.write("# Extracted Tables\n\n")
       f.write("**Source:** PDF pages extracted directly from source document\n\n")
       f.write("---\n\n")

       # List each table PDF
       for table_pdf in table_pdfs:
           table_name = table_pdf['table_name']
           table_type = table_pdf['table_type']
           pages = table_pdf['pages']
           filename = table_pdf['filename']
           is_multipage = table_pdf['is_multipage']

           f.write(f"## {table_name}\n\n")
           f.write(f"**Type:** {table_type}\n")

           if is_multipage:
               f.write(f"**Pages:** {pages[0]}-{pages[-1]} ({len(pages)} pages)\n\n")
           else:
               f.write(f"**Page:** {pages[0]}\n\n")

           # Link to PDF (download link, not embedded)
           pdf_filename = filename.split('/')[-1]  # Get just the filename
           f.write(f"[Download {table_name} PDF](./images/{filename})\n\n")

           f.write("---\n\n")

   print(f'✅ Created tables.md for table reference')
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

### STEP 5.5: Review Extracted Images for Value

**Actions:**

1. **Load and analyze image-metadata.json:**
   ```python
   import json

   print('━' * 60)
   print('REVIEWING EXTRACTED IMAGES FOR RELEVANCE')
   print('━' * 60)
   print()

   # Load image metadata
   metadata_path = images_dir / 'image-metadata.json'
   with open(metadata_path, 'r') as f:
       image_data = json.load(f)

   print(f"📊 Total images extracted: {image_data['total_images']}")
   print(f"📊 Figures identified: {image_data['total_figures_identified']}")
   print()

   # Analyze each figure's relevance
   relevant_figures = []
   irrelevant_figures = []

   for fig_name, fig_info in image_data['figures_summary'].items():
       description = fig_info['description'].lower()

       # Check for relevant keywords in description
       relevant_keywords = [
           'measurement', 'sample', 'location', 'map', 'plot', 'distribution',
           'histogram', 'probability', 'correlation', 'comparison',
           'time series', 'elevation', 'profile', 'trend',
           'concentration', 'composition', 'spectrum', 'data points'
       ]

       # Check for irrelevant indicators
       irrelevant_keywords = [
           'schematic', 'conceptual model', 'tectonic setting',
           'regional geology', 'stratigraphic column', 'cross-section'
       ]

       has_relevant = any(kw in description for kw in relevant_keywords)
       has_irrelevant = any(kw in description for kw in irrelevant_keywords)

       if has_relevant and not has_irrelevant:
           relevant_figures.append({
               'name': fig_name,
               'description': fig_info['description'][:100] + '...',
               'value': 'HIGH - Contains data/results'
           })
       elif has_irrelevant:
           irrelevant_figures.append({
               'name': fig_name,
               'description': fig_info['description'][:100] + '...',
               'value': 'LOW - Conceptual/regional context'
           })
       else:
           relevant_figures.append({
               'name': fig_name,
               'description': fig_info['description'][:100] + '...',
               'value': 'MEDIUM - Review manually'
           })

   # Report findings
   print('✅ HIGH VALUE FIGURES (data/results):')
   for fig in relevant_figures:
       if fig['value'].startswith('HIGH'):
           print(f"   - {fig['name']}: {fig['description']}")
   print()

   print('⚠️  MEDIUM VALUE FIGURES (needs review):')
   for fig in relevant_figures:
       if fig['value'].startswith('MEDIUM'):
           print(f"   - {fig['name']}: {fig['description']}")
   print()

   if irrelevant_figures:
       print('❌ LOW VALUE FIGURES (conceptual/context):')
       for fig in irrelevant_figures:
           print(f"   - {fig['name']}: {fig['description']}")
       print()

   # Save analysis to metadata
   image_data['image_analysis'] = {
       'high_value': [f for f in relevant_figures if f['value'].startswith('HIGH')],
       'medium_value': [f for f in relevant_figures if f['value'].startswith('MEDIUM')],
       'low_value': irrelevant_figures
   }

   with open(metadata_path, 'w') as f:
       json.dump(image_data, f, indent=2)

   print(f"✅ Image analysis saved to image-metadata.json")
   print()
   ```

**Output:**
- Updated `image-metadata.json` with `image_analysis` section
- Console report of high/medium/low value figures
- Helps prioritize which figures to reference in documentation

**Why This Matters:**
- **Filters noise** - Not all figures are relevant for data extraction
- **Prioritizes data figures** - Focus on plots, distributions, maps with actual data
- **Identifies context figures** - Tectonic/geological context may not need detailed analysis
- **Informs documentation** - Helps decide which figures to emphasize in paper-analysis.md

---

### STEP 7.7: Filter Images by Caption Match + Rename + Extract Table Metadata

**Purpose:**
1. Filter extracted images to only keep those with proper figure captions
2. Rename image files to use figure names (e.g., `figure_1.jpeg` instead of `page_4_img_0.jpeg`)
3. Extract table captions and create `table-metadata.json`

**Why This Matters:**
- PDFs often contain many small images (journal logos, icons, decorative elements)
- Caption matching ensures we only keep scientifically relevant figures
- Figure-based filenames make it easier to find specific figures
- Table metadata provides searchable caption text for all tables

**Actions:**

1. **Run the TypeScript caption extraction script:**
   ```bash
   npx tsx scripts/extract-figure-captions.ts \
     text/plain-text.txt \
     images/image-metadata.json
   ```

2. **What the script does for FIGURES:**
   - Reads plain-text.txt to extract figure captions (e.g., "Fig. 1. Description...")
   - Matches captions to images based on page proximity
   - Filters out small images (< 500px width/height) - likely logos
   - **RENAMES image files:** `page_4_img_0.jpeg` → `figure_1.jpeg`
   - Updates image-metadata.json with:
     - `figure_number` field (e.g., "1", "2A")
     - `caption` field (full text from paper)
     - `filename` field (updated to new name)
   - Only keeps images that have captions
   - Creates backup: `image-metadata.backup.json`

3. **What the script does for TABLES:**
   - Extracts table captions from plain-text.txt (e.g., "Table 1. Description...")
   - Matches captions to existing table screenshots (from `table_images` array)
   - Creates new file: `images/table-metadata.json` with:
     - Table number, page, caption text
     - Screenshot filename and extracted PDF path
   - Enables searchable table descriptions

3. **Review filtered results:**
   ```python
   import json

   print('━' * 60)
   print('REVIEWING CAPTION-FILTERED IMAGES')
   print('━' * 60)
   print()

   # Load updated metadata
   metadata_path = images_dir / 'image-metadata.json'
   with open(metadata_path, 'r') as f:
       filtered_data = json.load(f)

   print(f"✅ Kept {filtered_data['total_images']} images with captions")
   print(f"📊 Figures: {', '.join(sorted(set(img.get('figure_number', '?') for img in filtered_data['images'])))}")
   print()

   # Show what was filtered
   backup_path = images_dir / 'image-metadata.backup.json'
   if backup_path.exists():
       with open(backup_path, 'r') as f:
           original_data = json.load(f)
       removed = original_data['total_images'] - filtered_data['total_images']
       print(f"❌ Filtered out {removed} images without captions")
       print()
   ```

4. **Optional: Delete filtered image files to save space:**
   ```python
   import os

   # Get list of kept filenames
   kept_files = {img['filename'] for img in filtered_data['images']}

   # Load original list
   with open(backup_path, 'r') as f:
       original_data = json.load(f)

   removed_count = 0
   for img in original_data['images']:
       if img['filename'] not in kept_files:
           img_path = images_dir / img['filename']
           if img_path.exists():
               os.remove(img_path)
               removed_count += 1
               print(f"   🗑️  Deleted {img['filename']} (page {img['page']}, {img['width']}x{img['height']})")

   if removed_count > 0:
       print(f"\n✅ Cleaned up {removed_count} useless image file(s)")
   print()
   ```

**Example Output:**
```
📖 Reading files...

📊 Found 12 figure captions
📊 Found 15 total images

🔍 Matching captions to images...

✅ Matched 12 images with captions
❌ Filtered out 3 images without captions

🔄 Renaming image files...
  ✓ page_4_img_0.jpeg → figure_1.jpeg
  ✓ page_3_img_0.jpeg → figure_2.jpeg
  ✓ page_5_img_0.jpeg → figure_3.jpeg
  ✓ page_7_img_0.jpeg → figure_4.jpeg
  ✓ page_7_img_1.jpeg → figure_5.jpeg
  ✓ page_12_img_0.jpeg → figure_6.jpeg
  ✓ page_13_img_0.jpeg → figure_7.jpeg
  ✓ page_14_img_0.jpeg → figure_8.jpeg
  ✓ page_15_img_0.jpeg → figure_9.jpeg
  ✓ page_16_img_0.jpeg → figure_10.jpeg
  ✓ page_17_img_0.jpeg → figure_11.jpeg
  ✓ page_19_img_0.jpeg → figure_12.jpeg

💾 Backed up original metadata to: images/image-metadata.backup.json
💾 Updated metadata saved to: images/image-metadata.json

📊 Extracting table captions...
✅ Found 3 table captions
💾 Table metadata saved to: images/table-metadata.json

📋 Tables with Captions:
  Table 1 (page 9) - images/tables/table_1_page_9.png
    Caption: Table 1. Sample locations and thermochronology results...
  Table 2 (page 10) - images/tables/table_2_page_10.png
    Caption: Table 2. Fission track analytical data...
  Table A2 (page 22) - images/tables/table_A2_page_22.png
    Caption: Table A2. Single grain apatite (U-Th)/He data...

📋 Matched Figures (Renamed):
  Fig. 1 (page 4) - figure_1.jpeg
    Caption: Fig. 1. Schematic of normal fault system evolution...
  Fig. 2 (page 3) - figure_2.jpeg
    Caption: Fig. 2. Tectonic overview map...
  [...]
```

**Output Files Created:**
- `images/image-metadata.json` - Updated with renamed filenames and captions
- `images/image-metadata.backup.json` - Backup of original
- `images/table-metadata.json` - NEW: Table captions and metadata
- `images/figure_*.{jpeg|png}` - Renamed image files

**Benefits:**
- Reduces clutter (only scientifically relevant figures saved)
- Improves caption accuracy (extracted from paper text, not inferred)
- Saves disk space (no logos, watermarks, page decorations)
- Better organization (figure names match paper references)
- Searchable table metadata (full caption text for all tables)
- Easier file management (no more guessing which page_X_img_Y is which figure)

**When to Skip:**
- If paper has no figures (text-only)
- If you need to review ALL images manually before filtering

---

### STEP 8: Detect Supplemental Material URLs (Note Only - NO Download)

**Purpose:** Detect and NOTE supplementary file URLs (OSF, Zenodo, etc.) in the paper WITHOUT downloading. Manual download instructions included in documentation.

**CRITICAL:** This step ONLY detects URLs - it does NOT download files. This saves time, tokens, and disk space.

**Actions:**

1. **Search for data availability context (multilingual, keyword-based):**
   ```python
   import re
   import subprocess

   print('━' * 60)
   print('SEARCHING FOR SUPPLEMENTAL DATA (CONTEXT-AWARE)')
   print('━' * 60)
   print()

   # Read plain text to find data availability statements
   with open(text_file, 'r', encoding='utf-8') as f:
       text_content = f.read()

   # Multilingual keywords for data availability
   keywords = [
       # English
       'data availability', 'supplementary', 'supplemental', 'supporting information',
       'repository', 'archived', 'deposited', 'available at', 'accessible',
       'online resource', 'raw data', 'source data', 'code and data',
       'data archive', 'open science', 'figshare', 'dryad', 'mendeley',
       # Common phrases
       'upon request', 'available from', 'see supplementary', 'see SI',
       'accompanying data', 'electronic supplement'
   ]

   # Extract contexts around keywords (500 chars before/after)
   data_sections = []
   seen_positions = set()

   for keyword in keywords:
       matches = re.finditer(keyword, text_content, re.IGNORECASE)
       for match in matches:
           # Avoid duplicate contexts (if keywords overlap)
           if match.start() in seen_positions:
               continue
           seen_positions.add(match.start())

           # Extract context
           start = max(0, match.start() - 500)
           end = min(len(text_content), match.end() + 500)
           context = text_content[start:end]

           data_sections.append({
               'keyword': keyword,
               'context': context,
               'position': match.start()
           })

   print(f"🔍 Found {len(data_sections)} data availability context(s)")
   print()

   # Search for repository URLs in data sections AND full text (fallback)
   repositories = []
   repository_contexts = []

   # Repository URL patterns
   repo_patterns = {
       'OSF_DOI': r'(?:https?://)?(?:doi\.org/)?10\.17605/OSF\.IO/([A-Z0-9]{5})',
       'OSF_direct': r'(?:https?://)?osf\.io/([a-z0-9]{5})',
       'Zenodo_DOI': r'(?:https?://)?(?:doi\.org/)?10\.5281/zenodo\.(\d+)',
       'Zenodo_direct': r'(?:https?://)?zenodo\.org/records?/(\d+)',
       'Figshare': r'(?:https?://)?figshare\.com/articles/[^/]+/(\d+)',
       'Dryad': r'(?:https?://)?datadryad\.org/stash/dataset/doi:([^\s]+)',
       'GitHub': r'(?:https?://)?github\.com/([\w\-]+/[\w\-]+)',
       'Mendeley': r'(?:https?://)?data\.mendeley\.com/datasets/([^/\s]+)',
       'Generic_DOI': r'(?:https?://)?(?:doi\.org/)?(10\.\d{4,}/[^\s\)]+)'
   }

   # Search in data availability contexts first (prioritize)
   for section in data_sections:
       for repo_type, pattern in repo_patterns.items():
           matches = re.finditer(pattern, section['context'], re.IGNORECASE)
           for match in matches:
               url = match.group(0)
               repo_id = match.group(1)

               # Build repository info
               if 'OSF' in repo_type:
                   repo_info = {
                       'type': 'OSF',
                       'id': repo_id.lower(),
                       'url': f'https://osf.io/{repo_id.lower()}/',
                       'api_url': f'https://api.osf.io/v2/nodes/{repo_id.lower()}/files/osfstorage/',
                       'context': section['context'][:200]
                   }
               elif 'Zenodo' in repo_type:
                   repo_info = {
                       'type': 'Zenodo',
                       'id': repo_id,
                       'url': f'https://zenodo.org/records/{repo_id}',
                       'api_url': f'https://zenodo.org/api/records/{repo_id}',
                       'context': section['context'][:200]
                   }
               elif 'Figshare' in repo_type:
                   repo_info = {
                       'type': 'Figshare',
                       'id': repo_id,
                       'url': url if url.startswith('http') else f'https://{url}',
                       'api_url': None,  # Figshare API not implemented yet
                       'context': section['context'][:200]
                   }
               elif 'Dryad' in repo_type:
                   repo_info = {
                       'type': 'Dryad',
                       'id': repo_id,
                       'url': f'https://datadryad.org/stash/dataset/doi:{repo_id}',
                       'api_url': None,  # Dryad API not implemented yet
                       'context': section['context'][:200]
                   }
               elif 'GitHub' in repo_type:
                   repo_info = {
                       'type': 'GitHub',
                       'id': repo_id,
                       'url': url if url.startswith('http') else f'https://{url}',
                       'api_url': None,
                       'context': section['context'][:200]
                   }
               elif 'Mendeley' in repo_type:
                   repo_info = {
                       'type': 'Mendeley',
                       'id': repo_id,
                       'url': url if url.startswith('http') else f'https://{url}',
                       'api_url': None,
                       'context': section['context'][:200]
                   }
               elif 'Generic_DOI' in repo_type:
                   # Generic DOI - could be any repository
                   doi_url = url if url.startswith('http') else f'https://doi.org/{repo_id}'
                   repo_info = {
                       'type': 'DOI',
                       'id': repo_id,
                       'url': doi_url,
                       'api_url': None,
                       'context': section['context'][:200]
                   }

               # Avoid duplicates
               if not any(r['id'] == repo_info['id'] for r in repositories):
                   repositories.append(repo_info)

   # Fallback: Search entire text if no repos found in data sections
   if not repositories:
       print("⚠️  No repositories in data availability sections, scanning full text...")
       for repo_type, pattern in repo_patterns.items():
           if 'OSF' in repo_type or 'Zenodo' in repo_type or 'Generic_DOI' in repo_type:  # Scan for major repos + DOIs
               matches = re.finditer(pattern, text_content, re.IGNORECASE)
               for match in matches:
                   url = match.group(0)
                   repo_id = match.group(1)

                   if 'OSF' in repo_type:
                       repo_info = {
                           'type': 'OSF',
                           'id': repo_id.lower(),
                           'url': f'https://osf.io/{repo_id.lower()}/',
                           'api_url': f'https://api.osf.io/v2/nodes/{repo_id.lower()}/files/osfstorage/',
                           'context': 'Found in full text scan'
                       }
                   elif 'Zenodo' in repo_type:
                       repo_info = {
                           'type': 'Zenodo',
                           'id': repo_id,
                           'url': f'https://zenodo.org/records/{repo_id}',
                           'api_url': f'https://zenodo.org/api/records/{repo_id}',
                           'context': 'Found in full text scan'
                       }
                   elif 'Generic_DOI' in repo_type:
                       doi_url = url if url.startswith('http') else f'https://doi.org/{repo_id}'
                       repo_info = {
                           'type': 'DOI',
                           'id': repo_id,
                           'url': doi_url,
                           'api_url': None,
                           'context': 'Found in full text scan'
                       }

                   if not any(r['id'] == repo_info['id'] for r in repositories):
                       repositories.append(repo_info)

   # Report findings
   if repositories:
       print(f'✅ Found {len(repositories)} data repository link(s):')
       for repo in repositories:
           print(f'   - {repo["type"]}: {repo["url"]}')
           if repo.get('context') and repo['context'] != 'Found in full text scan':
               context_preview = repo['context'].replace('\n', ' ')[:150] + '...'
               print(f'     Context: "{context_preview}"')
   else:
       print('⚠️  No data repositories found')

       # Report if supplementary materials are MENTIONED in text
       if data_sections:
           print(f'📝 Found {len(data_sections)} mention(s) of supplementary materials in text:')
           # Show unique keywords found
           unique_keywords = sorted(set(s['keyword'] for s in data_sections))
           for kw in unique_keywords[:5]:  # Show first 5
               count = sum(1 for s in data_sections if s['keyword'] == kw)
               print(f'   - "{kw}" ({count} occurrence(s))')
           print()
           print('   Supplementary data may be:')
           print('   - In PDF appendices or tables (not as separate download)')
           print('   - Available upon request from authors')
           print('   - Referenced by DOI without public files')
       else:
           print('   Data may be:')
           print('   - Available upon request from authors')
           print('   - Included in PDF supplementary files')
           print('   - Already extracted (check extracted/ directory)')
           print('   - Not publicly available')

   print()

   # Check for existing data directories
   if (paper_dir / 'supplemental').exists():
       print('✅ Found supplemental/ directory (OSF/Zenodo downloads)')
   elif (paper_dir / 'extracted').exists():
       extracted_files = list((paper_dir / 'extracted').glob('*'))
       print(f'✅ Found extracted/ directory with {len(extracted_files)} files')
       print('   (PDF table extractions available)')

   print()
   ```

2. **Save detected URLs (NO download - just note in JSON):**
   ```python
   import json
   from pathlib import Path

   # Save repository URLs (NO download)
   supplemental_urls_file = paper_dir / 'supplementary-files-urls.json'

   if repositories:
       supplemental_data = {
           "detected_date": datetime.now().isoformat(),
           "total_repositories": len(repositories),
           "repositories": repositories
       }

       with open(supplemental_urls_file, 'w', encoding='utf-8') as f:
           json.dump(supplemental_data, f, indent=2, ensure_ascii=False)

       print(f'✅ Detected {len(repositories)} supplementary file repositories')
       print(f'✅ Saved URLs to: {supplemental_urls_file}')
       print()

       print('Supplementary Files Summary:')
       for repo in repositories:
           print(f'   - {repo["type"]}: {repo["url"]}')
       print()
       print('📝 Manual download instructions included in paper-index.md')
   else:
       print('ℹ️  No supplementary file repositories detected')

   print()
   ```

**VALIDATION CHECKPOINT:**
```python
print('━' * 60)
print('VALIDATION CHECKPOINT: Supplementary Files Detection')
print('━' * 60)
print()
if repositories:
   print(f'✅ Detected {len(repositories)} repositories')
   print(f'✅ URLs saved to: supplementary-files-urls.json')
   print('✅ Manual download instructions will be included in documentation')
else:
   print('ℹ️  No supplementary files detected')
print()
```

**Why This Matters:**
- **Many papers (30-40%) host data externally** on OSF, Zenodo, Figshare, or institutional repositories
- **Note-only approach saves time and disk space** - no automatic downloads
- **URLs preserved for manual download** when needed for `/thermoextract`
- **Avoids download failures** from private/restricted repositories
- **User controls what to download** based on actual extraction needs

**Output:**
- `supplementary-files-urls.json` - Detected repository URLs with metadata
- Manual download instructions in `paper-index.md`
- Console output showing detected repositories

**Benefits of Note-Only:**
- ✅ Faster analysis (no waiting for downloads)
- ✅ Less disk space used
- ✅ No API rate limits or timeout issues
- ✅ User decides what's actually needed
- ✅ Works with private/restricted repositories (user handles authentication)

---

### STEP 7: Create Paper Index (paper-index.md)

**File:** `build-data/learning/thermo-papers/[FOLDER_NAME]/paper-index.md`

**Critical sections to complete:**

#### 📄 Paper Metadata
**CRITICAL: Extract ALL of these fields for database population:**

**Publication Information:**
- Full citation
- Authors (list all with affiliations if provided)
- Year
- Journal name
- Volume/Pages
- DOI

**File Information:**
- PDF filename
- PDF URL (if external link exists)
- Supplementary files URL (auto-extract from `supplemental/README.md` if exists; see code below)

**Auto-extract supplementary URL and detect data directories:**
```python
import re
from pathlib import Path

# Check for supplemental directory (OSF/Zenodo downloads)
supplemental_readme = paper_dir / 'supplemental' / 'README.md'
supplementary_url = None
data_directory = None

if supplemental_readme.exists():
    data_directory = 'supplemental/'
    with open(supplemental_readme, 'r') as f:
        readme_content = f.read()

    # Extract repository URL from README
    url_match = re.search(r'\*\*Repository URL:\*\*\s*(https?://[^\s]+)', readme_content)
    if url_match:
        supplementary_url = url_match.group(1)
        print(f'✅ Extracted supplementary URL: {supplementary_url}')
    else:
        # Fallback: try "Downloaded from:" line
        url_match = re.search(r'\*\*Downloaded from:\*\*\s*(https?://[^\s]+)', readme_content)
        if url_match:
            supplementary_url = url_match.group(1)
            print(f'✅ Extracted supplementary URL: {supplementary_url}')

# Check for extracted directory (PDF table extractions)
elif (paper_dir / 'extracted').exists():
    data_directory = 'extracted/'
    # Count extracted files
    extracted_files = list((paper_dir / 'extracted').glob('*'))
    print(f'✅ Found extracted/ directory with {len(extracted_files)} files')
```

**Example paper-index.md template:**
```markdown
# [AUTHOR(YEAR)] - [TITLE]

**Citation:** [Full citation]
**Authors:** [Author list]
**Journal:** [Journal name], [Volume(Issue)], [Pages]
**Year:** [YYYY]
**DOI:** [DOI]

**File Information:**
- **PDF Filename:** [paper.pdf]
- **PDF URL:** [URL if available]
- **Supplementary Files URL:** {supplementary_url or "None"}  # Auto-populated from supplemental/README.md
- **Data Directory:** {data_directory or "None"}  # 'supplemental/' or 'extracted/' if available

**Study Details:**
- **Study Area:** [Location, Country]
- **Material/Sample Type:** [specify if applicable]
- **Method:** [EDM/LA-ICP-MS/Both]
- **Laboratory:** [Institution name]
- **Sample Count:** [N]
- **Age Range:** [Min-Max Ma]
```

**Study Details:**
- Study area/location
- Material/sample type analyzed (if applicable)
- Analysis method (EDM, LA-ICP-MS, etc.)
- Laboratory where analysis was conducted (check methods section, acknowledgments, or author affiliations)
- Sample count
- Age range (min-max Ma)

#### 🗂️ Document Structure
- Navigation table linking to analysis sections
- Use format: `[#anchor-name](./paper-analysis.md#anchor-name)`
- Include link to new "Data Availability" section: `[Data Availability](./paper-analysis.md#data-availability)`

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
- **Data Type** - Type of data (Results, Measurements, Chemistry, etc.)
- **Extractable?** - ✅ Yes / ⚠️ Complex / ❌ No
- **Priority?** - All tables must be extracted regardless of their relevance.


Example table:
| Table # | Page(s) | Description | Data Type | Extractable? | Priority
|---------|---------|-------------|-----------|--------------|----------------|
| **Table 1** | **9** | **Primary results summary** (35 samples) | Results, measurements | ✅ **PRIMARY** | % Relevant |
| **Table 2** | **10-11** | **Detailed measurements** (spans 2 pages) | Individual sample data | ✅ Yes | % Relevant |
| Table A1 | ❌ Not found | Composition data (referenced but not present) | Chemistry | ❌ No | % Relevant |
| Table A2 | 22-36 | Detailed composition (spans 15 pages!) | Elemental data | ⚠️ Complex | % Relevant |

**Add notes section below the table:**
```markdown
**Notes on Table Locations:**
- **Table 1** is a single-page table on page 9 (complete results summary)
- **Table 2** spans pages 10-11 (labeled "Table 2 (1/2)" on p.10, "continued" on p.11)
- **Table A1** is referenced in text (p.13) but does not appear as a standalone table
- **Table A2** is extensive, spanning pages 22-36 with multiple "continued" sections
```

**Identify the primary data table** - Which table has the main dataset?

#### 🎯 Quick Facts (For /thermoextract Automation)
**CRITICAL - Fill these out carefully:**

- **Study Location:** [Full location name, Country]
- **Coordinates:** [Lat/Lon range if provided in paper]
- **Material/Sample Type:** [specify if applicable - lowercase]
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

### STEP 8: Create Full Analysis (paper-analysis.md)

**File:** `build-data/learning/thermo-papers/[FOLDER_NAME]/paper-analysis.md`

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

#### 13. Data Availability
```markdown
## <a id="data-availability"></a>13. Data Availability

**Repository Type:** [OSF / Zenodo / Figshare / Institutional / None]
**Repository URL:** {supplementary_url or "Not available"}
**Access:** [Public / Restricted / Upon request]

**Downloaded/Extracted Files:**
{if supplemental/ exists, list files from supplemental/README.md}
{if extracted/ exists, list files from extracted/ directory}
- [File 1] ([size])
- [File 2] ([size])
- ...

**Database Integration:**
- ✅ Data files in `{data_directory}` directory
- ✅ supplemental/ files prioritized (OSF/Zenodo downloads - higher accuracy)
- ✅ extracted/ files from PDF (table extractions - fallback method)
- ⏭️ PDF extraction used if no supplemental/ or extracted/ directories exist

**Data Quality:**
- **Source:** [Supplementary Excel / Supplementary CSV / PDF tables]
- **Completeness:** [Complete / Partial / Minimal]
- **Grain-level data:** [Yes / No]
- **Track length data:** [Yes / No]

**Notes:**
[Any special considerations about data format, missing fields, or quality issues]
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

### Optional: Visual Verification Using PyMuPDF (Rarely Needed)

**When to use:** Only if you need visual verification of details that aren't clear from the text extraction.

**🚨 CRITICAL RULE: NEVER USE READ TOOL ON PDFs**

```python
# ❌ WRONG - NEVER DO THIS:
# Read(file_path=pdf_path)  # DON'T READ THE PDF WITH READ TOOL!

# ❌ WRONG - NEVER DO THIS EITHER:
# Read(file_path=pdf_path, offset=9, limit=3)  # DON'T READ PDF PAGES!

# ✅ CORRECT - If visual verification needed, use PyMuPDF:
import fitz

# Example: Render page 12 as image to verify Table 2 structure
doc = fitz.open(pdf_path)
page = doc[11]  # 0-indexed (page 12)
pix = page.get_pixmap()
pix.save("temp_page_12.png")
# Then optionally view the PNG (not the PDF)
doc.close()
```

**Why PyMuPDF only?**
- ✅ **PyMuPDF** - Renders PDF to PNG, saves to disk, no token cost
- ❌ **Read tool on PDF** - Sends PDF pages as images, massive token cost
- 📊 **Token comparison:** PyMuPDF (free) vs Read PDF page (1000s of tokens)

**Use cases (rare):**
- Verify table structure when text extraction is ambiguous
- Check figure quality for image-heavy papers
- Inspect complex equations that may not parse well as text

**Important:**
- ✅ Render ONE page at a time as PNG using PyMuPDF
- ❌ NEVER use Read tool on the PDF (any size, any page count)
- 💡 Most papers don't need this step - text extraction is usually sufficient
- 🎯 **Default workflow: Extract text → Read text file → Done**

---

### STEP 9: Quality Check

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
- [ ] Material/sample type is lowercase (if applicable)
- [ ] Analysis method matches expected format (EDM/LA-ICP-MS/Both)
- [ ] **Table page numbers verified** (single-page vs multi-page)
- [ ] Table locations documented for extraction

**If any checks fail, fix before proceeding.**

---

### STEP 10: Final Verification & Summary Report

**🚨 CRITICAL: Final DOI & Supplementary Materials Check**

Before generating the summary report, **read the text file one last time** to verify:

```python
# Re-read the plain text file for final verification
text_file = paper_dir / "text" / "plain-text.txt"
full_text = open(text_file, 'r', encoding='utf-8').read()
```

**Check for missed information:**

1. **DOI Verification:**
   - Search for "doi:", "DOI:", "https://doi.org/", "http://dx.doi.org/"
   - Look in: Abstract, first page, references, footer/header
   - If found but not in paper-index.md → ADD IT NOW

2. **Supplementary Materials Verification:**
   - Search for: "supplementary", "supplemental", "data availability", "code availability", "repository"
   - Look for: OSF links (osf.io), Zenodo (zenodo.org), Figshare (figshare.com), GitHub, institutional repos
   - Search for: "S1", "S2", "Table S", "Figure S" (indicates supplementary files exist)
   - Check references section for data citations
   - If found but not downloaded → NOTE IT in paper-index.md "Supplementary Materials" section

3. **Data Repository Links:**
   - Re-scan for any URLs containing: "osf.io", "zenodo.org", "figshare.com", "github.com", "datadryad.org"
   - Even if mentioned in passing, document them
   - Check if any were missed in STEP 5

**Update paper-index.md if anything was missed:**
```markdown
## Supplementary Materials
**Status:** [Available / Referenced but not accessible / None mentioned]
**Location:** [URL or "PDF only" or "None"]
**Files:**
- [List files or "See supplemental/ directory"]

**⚠️ FINAL CHECK NOTES:**
- [Document anything found in this final verification]
- [Note if DOI was added after final check]
- [Note if repository links were found that weren't previously downloaded]
```

**Why this final check matters:**
- Papers often mention repositories in unexpected places (acknowledgments, data availability statements)
- DOIs sometimes appear only in headers/footers (not main text)
- Supplementary file references (S1, S2) indicate external data exists
- Missing a repository URL means missing critical data for /thermoextract

**Only proceed to summary report after this verification is complete.**

---

**Report what was created:**

```
✅ PAPER ANALYSIS COMPLETE

📂 Folder: build-data/learning/thermo-papers/[FOLDER_NAME]/
📄 Files created:
   - [PDF_NAME].pdf (copied)
   - paper-index.md ([X] KB)
   - paper-analysis.md ([Y] KB)
   - figures.md ([Z] KB) - Human-readable figure descriptions
   - tables.md ([W] KB) - Visual table reference ⭐ NEW
   - images/ directory with [N] figures + [T] table screenshots
   - images/tables/ directory with table images ⭐ NEW
   - images/image-metadata.json - JSON for database import (includes tables)
   - text/plain-text.txt - Full text extraction
   - text/layout-data.json - Spatial metadata
   - text/table-pages.json - Exact table page numbers
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
   - High-value figures: [H] (data/results)
   - Table screenshots: [T] extracted from [D] tables
   - Catalog: images/image-metadata.json (includes figures + tables)

📥 Supplemental/Extracted material:
   - OSF/Zenodo repositories found: [Yes/No]
   - Data directory: [supplemental/ or extracted/ or None]
   - Files available: [N] files ([X] MB total)
   - Location: {supplemental/ directory OR extracted/ directory}
   - README: [supplemental/README.md if OSF/Zenodo OR N/A for extracted/]
   - Excel files: [List names if present]
   - PDF extractions: [List table-*.pdf files if in extracted/]

✅ Ready for /thermoextract: Yes/No
   [If No, explain what's missing]

⏱️  Time Elapsed:
   - Started: [YYYY-MM-DD HH:MM:SS]
   - Completed: [YYYY-MM-DD HH:MM:SS]
   - Duration: [HH:MM:SS] ([X] minutes)

💰 Token Usage & Cost Estimate:
   - Total input tokens: [X,XXX]
   - Total output tokens: [Y,YYY]
   - Total tokens: [Z,ZZZ]

   **Estimated API Cost (if using Anthropic API):**
   - Model: Claude Sonnet 4.5
   - Input cost: $[X.XX] ($3.00 per 1M tokens)
   - Output cost: $[Y.YY] ($15.00 per 1M tokens)
   - Total estimated cost: $[Z.ZZ]

   Note: Claude Code includes API access. This is just for reference.

🚀 Next steps:
   1. Review the analysis for accuracy
   2. Review figures.md for full figure descriptions
   3. Review tables.md for visual table reference ⭐ NEW
   4. Review extracted images (images/ directory)
   5. Review table screenshots (images/tables/ directory) ⭐ NEW
   6. Review data directory (supplemental/ for OSF downloads OR extracted/ for PDF table extractions)
   7. Inspect Excel files for data structure (if present in supplemental/)
   8. Run /thermoextract with the PDF path (or import from Excel if available in supplemental/)
   9. Extraction will automatically use metadata from paper-index.md
```

**Token Calculation & Time Tracking Code:**
```python
# Add at end of STEP 10 to calculate time elapsed and token usage
import anthropic
import time
from datetime import datetime, timedelta

# Calculate elapsed time (start_time from STEP 1)
end_time = time.time()
end_datetime = datetime.now()
elapsed_seconds = end_time - start_time
elapsed_td = timedelta(seconds=elapsed_seconds)

# Format duration
hours, remainder = divmod(int(elapsed_seconds), 3600)
minutes, seconds = divmod(remainder, 60)
duration_str = f"{hours:02d}:{minutes:02d}:{seconds:02d}"

print('━' * 60)
print('TIME ELAPSED')
print('━' * 60)
print(f'⏱️  Started:   {start_datetime.strftime("%Y-%m-%d %H:%M:%S")}')
print(f'⏱️  Completed: {end_datetime.strftime("%Y-%m-%d %H:%M:%S")}')
print(f'⏱️  Duration:  {duration_str} ({minutes + (hours * 60)} minutes)')
print()

# Note: In actual implementation, track tokens throughout workflow
# This is a simplified estimation approach

# Rough token estimates (1 token ≈ 4 characters for English text)
def estimate_tokens(text):
    return len(text) // 4

# Calculate input tokens (text extraction + all read operations)
input_tokens = 0
input_tokens += estimate_tokens(open(text_file).read())  # Plain text
input_tokens += estimate_tokens(open(paper_index_path).read())  # paper-index.md (prompts)
input_tokens += 1000  # System prompts, instructions

# Calculate output tokens (all generated content)
output_tokens = 0
output_tokens += estimate_tokens(open(paper_index_path).read())  # Generated paper-index.md
output_tokens += estimate_tokens(open(paper_analysis_path).read())  # Generated paper-analysis.md
output_tokens += estimate_tokens(open(figures_md_path).read())  # Generated figures.md
if (supplemental_dir / 'README.md').exists():
    output_tokens += estimate_tokens(open(supplemental_dir / 'README.md').read())

total_tokens = input_tokens + output_tokens

# Calculate cost (Anthropic API pricing as of 2025)
# Claude Sonnet 4.5: $3/1M input tokens, $15/1M output tokens
input_cost = (input_tokens / 1_000_000) * 3.00
output_cost = (output_tokens / 1_000_000) * 15.00
total_cost = input_cost + output_cost

print('━' * 60)
print('TOKEN USAGE & COST ESTIMATE')
print('━' * 60)
print(f'📊 Input tokens: {input_tokens:,}')
print(f'📊 Output tokens: {output_tokens:,}')
print(f'📊 Total tokens: {total_tokens:,}')
print()
print('💰 Estimated API Cost (Claude Sonnet 4.5):')
print(f'   Input:  ${input_cost:.2f} ($3.00 per 1M tokens)')
print(f'   Output: ${output_cost:.2f} ($15.00 per 1M tokens)')
print(f'   Total:  ${total_cost:.2f}')
print()
print('Note: Claude Code includes API access. This is just for reference.')
print()
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

---

**Note:** Database population is handled by `/thermoextract`, not `/thermoanalysis`. This command only creates analysis documentation and prepares metadata for extraction.

