# /{{PROJECT_NAME}}analysis - Deep Paper Analysis with Indexed Navigation

**Status:** ✅ Ready for use | 🚀 Optimized for ANY PDF size | 🌐 Works on ANY {{DOCUMENT_TYPE}}

**Purpose:** Create comprehensive, indexed analysis of {{DOCUMENT_TYPE}} with automatic metadata extraction, table tracking, and multi-format documentation

**Usage:** Provide PDF path (folder name auto-generated from paper metadata)

**Key Rule:** ❌ NEVER read the PDF directly - ✅ Extract text first, read text file only

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
- 🚀 **80-90% token savings** on large {{DOCUMENT_TYPE}}
- ✅ **No file size limits** for text extraction (PyMuPDF has no limits)

---

## ℹ️ SCHEMA COMPATIBILITY

**Status:** ✅ Compatible with {{PROJECT_NAME}} database schema

**Core Functions (Schema-Agnostic):**
- ✅ Text extraction (STEP 1-4) - No database interaction
- ✅ Image extraction (STEP 5) - No database interaction
- ✅ Supplementary downloads (STEP 6) - No database interaction
- ✅ Metadata generation (STEP 7-8) - Creates markdown files only

**Optional Database Integration (STEP 11):**
- Uses {{PROJECT_NAME}} field names: {{#DB_FIELDS}}{{FIELD_NAME}}, {{/DB_FIELDS}}
- Compatible with project tables: {{#DB_TABLES}}{{TABLE_NAME}}{{/DB_TABLES}}

---

**What it does:**
1. **Extracts text to TEMP location** using PyMuPDF (minimal token usage)
2. **Parses metadata from text** (author, year, title, {{METADATA_FIELDS}})
3. **Creates accurately named folder** using parsed metadata: `AUTHOR(YEAR)-TITLE-{{PUBLICATION_TYPE}}`
4. **Discovers tables dynamically** from extracted text (works on any {{DOCUMENT_TYPE}} type)
5. **Tracks table locations in 3 formats**:
   - Line numbers in plain-text.txt (start/end ranges)
   - PDF page extractions (multi-page tables combined)
   - PDF sections (individual table pages as PDFs)
6. **Creates table index** linking all 3 formats by table name
7. **Detects exact page numbers** (including multi-page tables)
8. **Extracts images** with captions from PDF
9. **Reviews image relevance** (filters {{IMAGE_CRITERIA}})
10. **Detects supplementary file URLs** ({{SUPPLEMENTARY_SOURCES}}) - notes in report
11. **Generates comprehensive documentation**:
    - `{{INDEX_FILENAME}}` (quick reference with exact table locations)
    - `{{ANALYSIS_FILENAME}}` (full indexed analysis)
    - `tables.md` (visual table reference + page numbers)
    - `table-index.json` (programmatic access to all 3 formats)

---

## 📊 EXPECTED OUTPUTS

After completing this command, you'll have a structured directory:

```
build-data/learning/{{PAPERS_DIR}}/AUTHOR(YEAR)-TITLE-{{PUBLICATION_TYPE}}/
├── {{MAIN_PDF_FILENAME}}                    # Original PDF
├── {{INDEX_FILENAME}}                       # Quick reference (table locations, metadata)
├── {{ANALYSIS_FILENAME}}                    # Full analysis with navigation index
├── tables.md                                # Visual table reference
├── table-index.json                         # Links all 3 table formats (text, PDF, screenshots)
├── text/
│   ├── plain-text.txt                       # Extracted text (low token cost!)
│   ├── text-index.md                        # Text structure analysis
│   └── table-pages.json                     # Detected table page numbers
├── images/
│   ├── tables/
│   │   ├── {{TABLE_NAMING_PATTERN}}.pdf    # Table PDF pages (multi-page combined)
│   │   └── ...
│   ├── image-001.png                        # Extracted figures
│   ├── image-002.png
│   └── image-metadata.json                  # Figure captions + relevance ratings
└── supplementary/                           # Downloaded files (if any)
    ├── README.md                            # Download log
    └── *.{{SUPPLEMENTARY_FORMATS}}          # Data files
```

---

## WORKFLOW PHASES

### PHASE 1: Setup & Text Extraction

**STEP 1: Check dependencies**
```python
# Check if PyMuPDF is installed
try:
    import fitz  # PyMuPDF
    print('✅ PyMuPDF is installed')
except ImportError:
    print('📦 Installing PyMuPDF...')
    # Install in project's .venv (NEVER system-wide)
    import subprocess
    subprocess.run(['.venv/bin/pip', 'install', 'PyMuPDF'])
```

**STEP 2: Extract text to TEMP location**
```python
import fitz
from pathlib import Path
import tempfile

pdf_path = Path(USER_PROVIDED_PATH)
temp_dir = Path(tempfile.mkdtemp(prefix='{{PROJECT_NAME}}_analysis_'))
text_dir = temp_dir / 'text'
text_dir.mkdir()

# Extract all text from PDF
doc = fitz.open(pdf_path)
full_text = ''
for page_num, page in enumerate(doc, start=1):
    full_text += f'\\n--- PAGE {page_num} ---\\n'
    full_text += page.get_text()

text_file = text_dir / 'plain-text.txt'
text_file.write_text(full_text, encoding='utf-8')

print(f'✅ Text extracted to: {text_file}')
print(f'   Pages: {len(doc)}')
print(f'   Characters: {len(full_text):,}')
```

**STEP 3: Parse metadata from text**
```python
# Read first 20 pages for metadata
with open(text_file, 'r', encoding='utf-8') as f:
    first_pages = []
    for line in f:
        if '--- PAGE' in line:
            page_num = int(line.split('PAGE')[1].split('---')[0].strip())
            if page_num > 20:
                break
        first_pages.append(line)

    metadata_text = ''.join(first_pages)

# AI prompt to extract metadata
# {{METADATA_EXTRACTION_PROMPT}}
```

**Expected metadata fields:**
- **title:** {{TITLE_DESCRIPTION}}
- **authors:** {{AUTHORS_DESCRIPTION}}
- **year:** {{YEAR_DESCRIPTION}}
- **{{CUSTOM_FIELD_1}}:** {{CUSTOM_FIELD_1_DESCRIPTION}}
- **{{CUSTOM_FIELD_2}}:** {{CUSTOM_FIELD_2_DESCRIPTION}}

**STEP 4: Create permanently named folder**
```python
# Move from TEMP to permanent location
papers_dir = Path('build-data/learning/{{PAPERS_DIR}}')
folder_name = f'{author}({year})-{title_slug}-{{publication_type}}'
paper_dir = papers_dir / folder_name

# Move everything from temp to permanent
import shutil
shutil.move(str(temp_dir), str(paper_dir))

print(f'✅ Created: {paper_dir.name}')
```

---

### PHASE 2: Table Detection & Extraction

**STEP 1: Discover tables from text**
```python
# AI prompt for table detection
# {{TABLE_DETECTION_PROMPT}}
```

**Expected table types for {{PROJECT_NAME}}:**
{{#TABLE_TYPES}}
- **{{TABLE_TYPE}}:** {{TABLE_DESCRIPTION}}
{{/TABLE_TYPES}}

**STEP 2: Detect table page numbers**
- Analyze text to find exact pages
- Detect multi-page tables
- Store in `table-pages.json`

**STEP 3: Extract table PDFs**
```python
import fitz

source_doc = fitz.open(pdf_path)
tables_dir = paper_dir / 'images' / 'tables'
tables_dir.mkdir(parents=True)

for table in discovered_tables:
    table_pdf = fitz.open()  # New empty PDF

    # Extract pages
    for page_num in table['pages']:
        table_pdf.insert_pdf(source_doc, from_page=page_num-1, to_page=page_num-1)

    # Save (multi-page tables combined)
    if len(table['pages']) == 1:
        filename = f"{{TABLE_NAMING_PATTERN}}_page_{table['pages'][0]}.pdf"
    else:
        filename = f"{{TABLE_NAMING_PATTERN}}_page_{table['pages'][0]}-{table['pages'][-1]}.pdf"

    table_pdf.save(str(tables_dir / filename))
    table_pdf.close()
```

**STEP 4: Create table-index.json**
Links all 3 formats (text line numbers, PDF pages, PDF sections) by table name.

---

### PHASE 3: Image Extraction & Analysis

**STEP 1: Extract images from PDF**
```python
for page_num in range(len(doc)):
    page = doc[page_num]
    image_list = page.get_images()

    for img_index, img in enumerate(image_list):
        # Extract and save
        # Filter by size/relevance criteria
```

**STEP 2: Extract figure captions**
- Search for "Figure", "Fig.", patterns in text
- Match captions to images by proximity

**STEP 3: Rate image relevance**
- AI analyzes captions to determine relevance
- Categories: {{#IMAGE_CATEGORIES}}{{CATEGORY}}{{/IMAGE_CATEGORIES}}

---

### PHASE 4: Supplementary Data Detection

**Detect URLs for:**
{{#SUPPLEMENTARY_SOURCES}}
- {{SOURCE_NAME}}: {{SOURCE_URL_PATTERN}}
{{/SUPPLEMENTARY_SOURCES}}

**NOTE:** This step DETECTS and NOTES URLs in the report but does NOT download files automatically.

---

### PHASE 5: Documentation Generation

**Generate:**
1. **{{INDEX_FILENAME}}** - Quick reference
2. **{{ANALYSIS_FILENAME}}** - Full analysis
3. **tables.md** - Table reference with PDF links
4. **table-index.json** - Programmatic access

---

## 🎯 SUCCESS CRITERIA

✅ Text extracted (plain-text.txt)
✅ Metadata parsed (author, year, title, {{CUSTOM_FIELDS}})
✅ Folder created with accurate name
✅ All tables discovered (including appendices)
✅ Table locations tracked in 3 formats
✅ table-index.json created
✅ Images extracted with captions
✅ Supplementary URLs detected
✅ Documentation generated

---

## 🔧 CUSTOMIZATION POINTS

**To adapt this command for {{PROJECT_NAME}}:**

1. **Metadata fields** (line 153): Define what to extract from {{DOCUMENT_TYPE}}
2. **Table types** (line 187): List expected table categories
3. **Table naming** (line 230): Define filename pattern for extracted tables
4. **Image criteria** (line 248): Define what makes an image relevant
5. **Supplementary sources** (line 256): List repositories to check for data
6. **Database fields** (line 42): List key database columns
7. **Validation ranges** (used in /{{PROJECT_NAME}}extract): Define expected data ranges

---

**End of template** | Generated from: `dataanalysis.template.md` | Project: {{PROJECT_NAME}}
