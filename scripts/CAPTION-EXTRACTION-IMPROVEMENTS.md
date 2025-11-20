# Caption Extraction Improvements

**Date:** 2025-11-20
**Status:** ✅ Complete

---

## Summary

Enhanced the `/thermoanalysis` workflow with intelligent caption extraction, image renaming, and table metadata generation.

## What Changed

### 1. Script: `scripts/extract-figure-captions.ts`

**NEW Features:**
- ✅ Extract figure captions from `plain-text.txt`
- ✅ Match captions to images (filters small images < 500px)
- ✅ **RENAME image files** to use figure names
- ✅ Extract table captions from `plain-text.txt`
- ✅ **CREATE `table-metadata.json`** with full caption text

### 2. Command: `.claude/commands/thermoanalysis.md`

**Added:** STEP 7.7 - "Filter Images by Caption Match + Rename + Extract Table Metadata"

**Integration:** Runs after STEP 7 (image extraction from PDF)

---

## Key Improvements

### Before
```
images/
├── page_1_img_0.jpeg          ← Logo/header (118x117px)
├── page_1_img_1.jpeg          ← Icon (236x298px)
├── page_4_img_0.jpeg          ← Which figure is this? 🤔
├── page_7_img_1.jpeg          ← Which figure is this? 🤔
└── page_12_img_0.jpeg         ← Which figure is this? 🤔
```

### After
```
images/
├── figure_1.jpeg              ← Clear identification! ✅
├── figure_2.jpeg              ← Clear identification! ✅
├── figure_3.jpeg              ← Clear identification! ✅
├── image-metadata.json        ← Updated with captions + renamed files
├── image-metadata.backup.json ← Backup of original
└── table-metadata.json        ← NEW: Table captions + metadata
```

**Filtered out:** `page_1_img_0.jpeg`, `page_1_img_1.jpeg` (logos/small graphics)

---

## File Renaming Logic

| Original Filename | Figure Number | New Filename | Caption |
|-------------------|---------------|--------------|---------|
| `page_4_img_0.jpeg` | 1 | `figure_1.jpeg` | Fig. 1. Schematic of normal fault system evolution... |
| `page_3_img_0.jpeg` | 2 | `figure_2.jpeg` | Fig. 2. Tectonic overview map... |
| `page_5_img_0.jpeg` | 3 | `figure_3.jpeg` | Fig. 3. Map of northern Lake Malawi... |
| `page_7_img_0.jpeg` | 4 | `figure_4.jpeg` | Fig. 4. Simplified 4-stage evolution model... |

**Naming Convention:**
- Figure numbers normalized: `1`, `2A`, `3` → `figure_1`, `figure_2a`, `figure_3`
- Extensions preserved: `.jpeg`, `.png`, etc.
- Collision handling: Adds suffix `_0`, `_1` if needed

---

## Table Metadata

**NEW File:** `images/table-metadata.json`

**Structure:**
```json
{
  "paper": "McMillan(2024)-4D-fault-evolution-footwall-exhumation-Malawi-rift",
  "pdf": "4D fault evolution revealed by footwall exhumation modelling.pdf",
  "total_tables": 3,
  "extracted_date": "2025-11-20T21:22:46.811857",
  "tables": [
    {
      "table_name": "Table 1",
      "table_num": "1",
      "page": 9,
      "screenshot": "images/tables/table_1_page_9.png",
      "pdf": "extracted/table-1-page-9.pdf",
      "caption": "Table 1. Sample locations and thermochronology results..."
    },
    {
      "table_name": "Table 2",
      "table_num": "2",
      "page": 10,
      "screenshot": "images/tables/table_2_page_10.png",
      "pdf": "extracted/table-2-page-10.pdf",
      "caption": "Table 2. Fission track analytical data..."
    }
  ]
}
```

**Benefits:**
- Searchable table captions (full text from paper)
- Links to both screenshot and extracted PDF
- Page numbers for quick reference
- Enables programmatic table discovery

---

## Usage

### Command Line

```bash
# Run in paper directory (after STEP 7 of /thermoanalysis)
npx tsx scripts/extract-figure-captions.ts \
  text/plain-text.txt \
  images/image-metadata.json
```

### In /thermoanalysis Workflow

**Location:** STEP 7.7 (between image extraction and supplemental URL detection)

**Automatic in future runs:** When `/thermoanalysis` is executed, this step will be included

---

## Testing

**Tested on:** McMillan(2024) paper

**Results:**
- ✅ Found 12 figure captions
- ✅ Matched 12 images with captions
- ❌ Filtered out 3 small images (logos/graphics)
- ✅ Renamed 12 image files to figure names
- ✅ Extracted 3 table captions
- ✅ Created `table-metadata.json` with full descriptions

**Data Integrity:**
- ✅ All figure captions matched correctly (Fig. 1-12)
- ✅ No data loss (backup created)
- ✅ All table captions matched to screenshots

---

## Benefits

| Feature | Before | After |
|---------|--------|-------|
| **Image Identification** | `page_X_img_Y` (unclear) | `figure_N` (clear) |
| **Caption Source** | Inferred/missing | Extracted from paper text |
| **Small Images** | Included (clutter) | Filtered out (< 500px) |
| **Table Captions** | Not available | Full text in JSON |
| **File Organization** | Page-based | Figure-based |
| **Searchability** | Poor (filename only) | Excellent (caption text) |

---

## Implementation Details

### Caption Extraction Algorithm

1. **Parse plain-text.txt** line by line
2. **Match patterns:** `Fig. \d+\.` or `Table \d+\.`
3. **Extract multi-line captions** (until empty line)
4. **Detect page numbers** from `--- PAGE X ---` markers
5. **Match to images** based on page proximity

### Image Filtering Heuristics

- **Minimum size:** 500px (width OR height)
- **Logic:** Small images are likely logos, icons, headers
- **Result:** Only scientifically relevant figures kept

### File Renaming Safety

- **Backup created:** `image-metadata.backup.json`
- **Collision handling:** Adds suffix if filename exists
- **Extension preserved:** `.jpeg`, `.png`, etc.
- **Atomic operation:** Rename only if file exists

---

## Files Modified

1. **scripts/extract-figure-captions.ts** - Enhanced with renaming + table metadata
2. **.claude/commands/thermoanalysis.md** - Added STEP 7.7 documentation
3. **scripts/test-caption-extraction.sh** - Demo script (NEW)
4. **scripts/CAPTION-EXTRACTION-IMPROVEMENTS.md** - This file (NEW)

---

## Future Enhancements

**Potential improvements:**
- [ ] Handle multi-part figures (e.g., Fig. 1A, 1B → separate files)
- [ ] Extract supplementary figure captions (Fig. S1, S2)
- [ ] Rename table screenshots to use table names
- [ ] OCR fallback for scanned PDFs
- [ ] Support for inline figures (no separate page)

---

**Status:** ✅ Production ready
**Next Step:** Use in real paper extraction workflows via `/thermoanalysis`
