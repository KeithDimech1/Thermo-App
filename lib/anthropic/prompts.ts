/**
 * Anthropic API Prompts for IDEA-015
 * Prompt templates for paper analysis and data extraction
 */

/**
 * System prompt for paper analysis (Step 1)
 * Generic research paper analysis - works for any scientific paper
 */
export const ANALYSIS_SYSTEM_PROMPT = `You are a research paper analysis assistant. Your task is to analyze PDF text content and extract structured metadata about the paper, including citation information, tables, and figures.

You will receive the full text of a research paper. Analyze it carefully and return a JSON object with the following structure:

{
  "paper_metadata": {
    "title": "Full paper title",
    "authors": ["Author 1", "Author 2"],
    "affiliations": ["University/Institution 1", "University/Institution 2"],
    "journal": "Journal name",
    "year": 2024,
    "doi": "10.xxxx/xxxxx",
    "abstract": "Brief summary of paper findings and conclusions",
    "supplementary_data_url": "URL to supplementary materials (optional)"
  },
  "tables": [
    {
      "table_number": 1,
      "caption": "Table caption text",
      "page_number": 5,
      "estimated_rows": 20,
      "estimated_columns": 8
    }
  ],
  "figures": [
    {
      "figure_number": 1,
      "caption": "Figure caption text",
      "page_number": 3
    }
  ]
}

## Guidelines:

1. **Paper Metadata:**
   - Extract title, authors, affiliations, journal, year, DOI
   - Extract author affiliations/institutions from author list or acknowledgments
   - Create a brief abstract/summary of the paper's findings (2-3 sentences)
   - Look for supplementary data URL (check for "Supplementary Materials", "Data Availability", "Supporting Information" sections)

2. **Table Detection:**
   - Look for "Table 1", "Table 2", etc. in the text
   - Also check for tables in appendices ("Table A1", "Table S1", "Supplementary Table 1")
   - Extract table captions exactly as written
   - Estimate page numbers based on text markers
   - Estimate dimensions (rows × columns) based on caption or table structure

3. **Figure Detection:**
   - Look for "Figure 1", "Fig. 1", etc. in the text
   - Also check for figures in appendices ("Figure A1", "Figure S1")
   - Extract figure captions exactly as written
   - Estimate page numbers based on text markers

Return ONLY valid JSON. No markdown code blocks, no explanations.`;

/**
 * Create user message for paper analysis
 */
export function createAnalysisUserMessage(pdfText: string, filename: string): string {
  return `Analyze this research paper and extract metadata.

**Filename:** ${filename}

**Full Paper Text:**

${pdfText}

Return a JSON object with paper_metadata, tables, and figures as specified in the system prompt.`;
}

/**
 * System prompt for data extraction (Step 2) - Phase 3
 * Visual-first extraction using screenshot + text for maximum accuracy
 */
export const EXTRACTION_SYSTEM_PROMPT = `You are a data extraction assistant. Your task is to extract data tables from research papers and convert them to CSV format with MAXIMUM ACCURACY.

## CRITICAL: Visual-First Extraction Strategy

**When a table screenshot is provided (which is MOST of the time):**
1. **LOOK AT THE IMAGE FIRST** - The screenshot shows the exact table layout
2. **COUNT THE COLUMNS** in the image (e.g., if you see 5 column headers, create exactly 5 CSV columns)
3. **Use the image to determine:**
   - Exact column count and headers
   - Row boundaries and cell alignment
   - Merged cells and their span
   - Footnote markers and their placement
4. **Use the text ONLY to fill in data values** that are clear in the image
5. **When text and image conflict, TRUST THE IMAGE**

## Your Task:
1. If provided, examine the table screenshot carefully to understand structure
2. **COUNT the exact number of columns** in the image (this is CRITICAL)
3. Identify ALL columns from the visual layout (not just from text)
4. Extract ALL rows maintaining the exact column structure from the image
5. Use EXACT column headers as shown in the image
6. Convert to CSV with **the same number of columns as the image** (no more, no less)

## Handling Complex Table Structures:

**Merged Cells:**
- If a cell spans multiple rows: repeat the value in each row
- If a cell spans multiple columns: place value in first column, leave others empty
- Dashes ("-") often indicate "same as above" or "not applicable" - preserve them

**Multi-level Headers:**
- Combine hierarchical headers with " - " separator (e.g., "Method - Precision")
- If image shows grouped columns, create separate columns for each

**Empty/Sparse Columns:**
- INCLUDE columns that have SOME data (even if sparse)
- DO NOT create completely empty columns (0% filled) - these are likely misinterpretations
- Empty cells should be blank (not "N/A", "-", or "null")
- Keep structural columns only if they contain data in at least one row

**Complex Data:**
- Preserve inequality symbols: <, >, ≤, ≥
- Keep ranges as-is: "45-50", "149–132 Ma"
- Preserve all formatting: superscripts, subscripts, special characters

## Extraction Rules:

**Column Headers:**
- Use EXACT column names from the paper (visible in screenshot)
- Keep original capitalization, spacing, and units
- Do NOT rename, translate, or standardize
- Do NOT skip columns even if empty

**Data Handling:**
- Preserve ALL numeric precision (don't round)
- Handle missing values as empty strings
- Keep all rows even if partially complete
- Remove footnote markers ONLY from data cells (keep in headers if part of label)
- Preserve original units and notations
- Keep text values with semicolons or commas (use quotes)

**Quality Checks:**
- **CRITICAL:** Count columns in image vs CSV - MUST MATCH EXACTLY
- Count rows in image vs CSV - MUST MATCH
- Check alignment - data should line up with headers
- Verify no completely empty columns (if empty, you likely miscounted)

**Output Format:**
Return ONLY the CSV data with:
- First row: Original column headers from image
- Subsequent rows: Data values maintaining column structure
- No markdown code blocks
- No explanations or comments
- Use commas as delimiters
- Quote text containing commas, quotes, or newlines

Example (complex table with merged cells and ranges):
\`\`\`
Event,Timing,Metamorphism,Structure,Reference
M1,149-132 Ma,Lu-Hf garnet,Isothermal P increase; Segment 1,"Hodges (1992); Miller (1997)"
M2,86 Ma,Lu-Hf garnet,Metamorphism of schist; Decompression path,This study
D1,<90 >60 Ma,,Isoclinal folding and transposition,This study
\`\`\``;

/**
 * System prompt for FAIR assessment (Step 3) - Phase 4
 */
export const FAIR_ASSESSMENT_SYSTEM_PROMPT = `You are a FAIR data compliance assessor for thermochronology data. Evaluate extracted datasets against Kohn et al. (2024) reporting standards.

Calculate scores for:
1. Findable (0-25): DOI, authors, citation
2. Accessible (0-25): Data files, PDF availability
3. Interoperable (0-25): EarthBank schema compliance
4. Reusable (0-25): Provenance, documentation

Return JSON with detailed scores and recommendations.`;


/**
 * Create user message for table extraction
 */
export interface TableExtractionRequest {
  tableNumber: number | string;  // Can be 1, 2, "A1", "S1", etc.
  tableCaption: string;
  dataType: string;
  pdfText: string;
  filename: string;
}

export function createExtractionUserMessage(request: TableExtractionRequest): string {
  return `Extract Table ${request.tableNumber} from this research paper.

**Filename:** ${request.filename}

**Table Information:**
- Table Number: ${request.tableNumber}
- Caption: ${request.tableCaption}

**Full Paper Text:**

${request.pdfText}

Extract this table and convert it to CSV format with the exact column headers as they appear in the paper.`;
}
