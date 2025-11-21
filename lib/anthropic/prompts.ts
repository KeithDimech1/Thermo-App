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
 * Simple extraction - just get the raw table data as-is
 */
export const EXTRACTION_SYSTEM_PROMPT = `You are a data extraction assistant. Your task is to extract data tables from research papers and convert them to CSV format.

## Your Task:
1. Locate the specified table in the provided text
2. Extract ALL rows and columns EXACTLY as they appear in the paper
3. Use the EXACT column headers from the paper (do not rename or translate)
4. Convert the table to CSV format

## Extraction Rules:

**Column Headers:**
- Use the EXACT column names from the paper
- Keep original capitalization, spacing, and units (e.g., "Age (Ma)", "±1σ", "Sample ID")
- Do NOT rename, translate, or standardize column names
- Do NOT convert to camelCase or any other format

**Data Handling:**
- Preserve all numeric precision (don't round)
- Handle missing values as empty strings (not "N/A" or "-")
- Keep all rows even if partially complete
- Remove table footnotes and superscript markers (e.g., "a", "b", "*", "†")
- Keep all measurements in their original units

**Output Format:**
Return ONLY the CSV data with:
- First row: Original column headers from the paper
- Subsequent rows: Data values exactly as shown
- No markdown code blocks
- No explanations or comments
- Use commas as delimiters
- Quote text values containing commas

Example output:
\`\`\`
Sample,Age (Ma),±1σ,n,MTL (μm),Dpar
01-001,45.2,3.1,25,14.1,2.3
01-002,52.8,4.2,18,13.9,2.4
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
