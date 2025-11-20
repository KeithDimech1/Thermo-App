# Generic PDF Data Processing Template System

**Purpose:** Reusable templates for creating domain-specific PDF data processing commands

**Last Updated:** 2025-11-21

---

## Overview

This template system allows you to generate customized data processing commands for ANY domain (geology, medicine, chemistry, etc.) through an interactive setup process.

### What It Does

1. **Interactive Setup** (`/setupdatacommands`)
   - Asks questions about your project
   - Discovers your database schema
   - Stores configuration

2. **Template Engine** (`scripts/generate-data-commands.ts`)
   - Reads configuration
   - Substitutes variables in templates
   - Generates customized commands

3. **Generated Commands**
   - `/[projectname]analysis` - PDF analysis and table extraction
   - `/[projectname]extract` - Data extraction with validation
   - `/[projectname]load` - Database import with FAIR assessment

---

## Quick Start

### Step 1: Run Setup (One Time)

```bash
/setupdatacommands
```

**Answers interactive questions about:**
- Project domain and type
- Entity naming (samples/patients/sites)
- ID patterns and validation rules
- Database schema (auto-detected)
- Data types and measurements
- FAIR standards for your field

### Step 2: Review Configuration

**Files created:**
- `.claude/project-config.json` - All your answers
- `.claude/field-mappings.json` - Database schema mappings

### Step 3: Generated Commands Appear

**In `.claude/commands/`:**
- `{projectname}analysis.md`
- `{projectname}extract.md`
- `{projectname}load.md`

### Step 4: Use Your Commands

```bash
/{projectname}analysis /path/to/document.pdf
/{projectname}extract
/{projectname}load
```

---

## Template Files

### Location

```
.claude/commands/templates/
├── dataanalysis.template.md      # Generic PDF analysis
├── dataextract.template.md       # Generic data extraction
├── dataload.template.md          # Generic database loading
└── setup/
    └── README.md                 # This file
```

### Variable Syntax

**Simple substitution:**
```markdown
# /{{PROJECT_NAME}}analysis

Extract {{DATA_TYPE}} data from {{DOCUMENT_TYPE}}
```

**Array substitution (loops):**
```markdown
{{#VALIDATION_RANGES}}
- {{FIELD_NAME}}: {{MIN_VALUE}}-{{MAX_VALUE}} {{UNIT}}
{{/VALIDATION_RANGES}}
```

---

## Configuration Files

### `.claude/project-config.json`

**Contains:**
- Project name and domain
- Entity definitions (samples/patients/etc.)
- Measurement types and units
- Table types to extract
- Validation ranges
- Metadata fields
- FAIR standards
- Database settings
- Output formats

**Example:**
```json
{
  "version": "1.0",
  "project": {
    "name": "clinical",
    "domain": "medicine",
    "document_type": "clinical studies"
  },
  "entities": {
    "main": {
      "name": "patient",
      "name_plural": "patients",
      "id_field": "patientID",
      "id_pattern": "^P\\d{6}$",
      "id_example": "P000123"
    }
  },
  "measurements": {
    "types": [
      {
        "name": "blood_pressure",
        "unit": "mmHg",
        "description": "Systolic/diastolic blood pressure"
      }
    ]
  },
  "validation": {
    "ranges": {
      "blood_pressure": { "min": 80, "max": 200, "unit": "mmHg" }
    }
  }
}
```

### `.claude/field-mappings.json`

**Contains:**
- Database table definitions
- Column names and types
- Foreign key relationships
- Generic concept mappings

**Example:**
```json
{
  "version": "1.0",
  "tables": {
    "patients": {
      "purpose": "main entity",
      "columns": {
        "patientID": { "type": "varchar", "nullable": false },
        "age": { "type": "integer", "nullable": true }
      }
    }
  },
  "generic_mappings": {
    "entity_table": "patients",
    "entity_id_column": "patientID"
  }
}
```

---

## Template Variables Reference

### Project & Domain

| Variable | Description | Example |
|----------|-------------|---------|
| `PROJECT_NAME` | Short project identifier | `thermo`, `clinical` |
| `DOMAIN_TYPE` | Field/discipline | `geology`, `medicine` |
| `DOCUMENT_TYPE` | Type of documents | `research papers`, `clinical studies` |
| `DATA_TYPE` | What's being measured | `ages`, `concentrations`, `blood pressure` |

### Entity Naming

| Variable | Description | Example |
|----------|-------------|---------|
| `ENTITY_NAME` | Singular entity name | `sample`, `patient`, `site` |
| `ENTITY_NAME_PLURAL` | Plural entity name | `samples`, `patients`, `sites` |
| `ENTITY_ID` | ID field name | `sampleID`, `patientID` |
| `ID_PATTERN` | Regex for IDs | `^MU\\d{2}-\\d{2}$` |
| `ID_EXAMPLE` | Example ID | `MU19-05`, `P000123` |

### Database

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_TABLES` | Comma-separated table names | `samples, ft_datapoints` |
| `NAMING_CONVENTION` | Database naming style | `camelCase`, `snake_case` |
| `PK_STRATEGY` | Primary key type | `uuid`, `serial` |
| `FK_STRATEGY` | Foreign key type | `string`, `int` |

### Files & Paths

| Variable | Description | Example |
|----------|-------------|---------|
| `INDEX_FILENAME` | Index file name | `paper-index.md` |
| `ANALYSIS_FILENAME` | Analysis file name | `paper-analysis.md` |
| `PAPERS_DIR` | Papers directory name | `thermo-papers` |

### Standards & Scoring

| Variable | Description | Example |
|----------|-------------|---------|
| `STANDARDS_NAME` | Domain standards | `Kohn et al. 2024`, `CONSORT` |
| `MAX_FAIR_SCORE` | Maximum FAIR score | `100` |

### Output

| Variable | Description | Example |
|----------|-------------|---------|
| `OUTPUT_FORMAT` | Output formats | `CSV + JSON + SQL` |

---

## Array Variables Reference

### Validation Ranges

**Loop:** `{{#VALIDATION_RANGES}}...{{/VALIDATION_RANGES}}`

**Variables:**
- `{{FIELD_NAME}}` - Field to validate
- `{{MIN_VALUE}}` - Minimum allowed value
- `{{MAX_VALUE}}` - Maximum allowed value
- `{{UNIT}}` - Unit of measurement
- `{{FIELD_DESCRIPTION}}` - Human-readable description

**Example:**
```markdown
{{#VALIDATION_RANGES}}
- {{FIELD_NAME}}: {{MIN_VALUE}}-{{MAX_VALUE}} {{UNIT}}
{{/VALIDATION_RANGES}}
```

**Generates:**
```markdown
- centralAgeMa: 0-500 Ma
- uPpm: 0-500 ppm
- dPar: 0-5 μm
```

### Table Types

**Loop:** `{{#TABLE_TYPES}}...{{/TABLE_TYPES}}`

**Variables:**
- `{{TABLE_TYPE}}` - Table category name
- `{{TABLE_DESCRIPTION}}` - Description

**Example:**
```markdown
{{#TABLE_TYPES}}
- **{{TABLE_TYPE}}:** {{TABLE_DESCRIPTION}}
{{/TABLE_TYPES}}
```

### Database Tables

**Loop:** `{{#DB_TABLES}}...{{/DB_TABLES}}`

**Variables:**
- `{{TABLE_NAME}}` - Table name

**Example:**
```markdown
{{#DB_TABLES}}
- `{{TABLE_NAME}}`
{{/DB_TABLES}}
```

### FAIR Criteria

**Loops:**
- `{{#FINDABLE_CRITERIA}}...{{/FINDABLE_CRITERIA}}`
- `{{#ACCESSIBLE_CRITERIA}}...{{/ACCESSIBLE_CRITERIA}}`
- `{{#INTEROPERABLE_CRITERIA}}...{{/INTEROPERABLE_CRITERIA}}`
- `{{#REUSABLE_CRITERIA}}...{{/REUSABLE_CRITERIA}}`

**Variables:**
- `{{CRITERION}}` - Criterion name
- `{{DESCRIPTION}}` - Description

---

## Customizing Templates

### Adding New Variables

1. **Update `buildSubstitutionMap()` in `scripts/generate-data-commands.ts`:**
   ```typescript
   map['NEW_VARIABLE'] = config.some.field;
   ```

2. **Use in template:**
   ```markdown
   {{NEW_VARIABLE}}
   ```

3. **Regenerate:**
   ```bash
   npx tsx scripts/generate-data-commands.ts
   ```

### Adding New Arrays

1. **Update `buildArraySubstitutions()` in `scripts/generate-data-commands.ts`:**
   ```typescript
   arrays['NEW_ARRAY'] = config.some.array.map(item => ({
     ITEM_FIELD: item.field,
   }));
   ```

2. **Use in template:**
   ```markdown
   {{#NEW_ARRAY}}
   - {{ITEM_FIELD}}
   {{/NEW_ARRAY}}
   ```

### Adding New Configuration Fields

1. **Update `.claude/project-config.json`:**
   ```json
   {
     "new_section": {
       "new_field": "value"
     }
   }
   ```

2. **Update TypeScript interface in `scripts/generate-data-commands.ts`:**
   ```typescript
   interface ProjectConfig {
     new_section: {
       new_field: string;
     };
   }
   ```

3. **Use in substitution map or arrays**

---

## Example: Thermochronology Project

**Setup answers:**
- Project name: `thermo`
- Domain: `geology`
- Entity: `samples` (ID: `sampleID`, pattern: `^[A-Z]{2}\\d{2}-\\d{2}$`)
- Measurements: `ages (Ma)`, `uranium (ppm)`, `track lengths (μm)`
- Standards: `Kohn et al. 2024`

**Generated commands:**
- `/thermoanalysis` - Analyzes geological papers for thermochronology tables
- `/thermoextract` - Extracts AFT/AHe data with age validation
- `/thermoload` - Imports to EarthBank schema with FAIR scoring

---

## Example: Clinical Study Project

**Setup answers:**
- Project name: `clinical`
- Domain: `medicine`
- Entity: `patients` (ID: `patientID`, pattern: `^P\\d{6}$`)
- Measurements: `blood pressure (mmHg)`, `heart rate (bpm)`
- Standards: `CONSORT guidelines`

**Generated commands:**
- `/clinicalanalysis` - Analyzes clinical study protocols
- `/clinicalextract` - Extracts patient data with medical value validation
- `/clinicalload` - Imports to clinical database with CONSORT compliance

---

## Troubleshooting

### Unsubstituted Placeholders

**Problem:**
```markdown
Extract {{UNKNOWN_VARIABLE}} data
```

**Solution:**
1. Check if variable is defined in `buildSubstitutionMap()`
2. Add to configuration if missing
3. Regenerate commands

### Database Not Detected

**Problem:**
```
⚠️  No DATABASE_URL in .env.local
```

**Solution:**
1. Add database connection to `.env.local`
2. Re-run `/setupdatacommands`
3. Or edit `.claude/project-config.json` manually

### Commands Not Generated

**Problem:**
```
❌ Configuration file not found
```

**Solution:**
1. Run `/setupdatacommands` first
2. Ensure `.claude/project-config.json` exists
3. Check file permissions

---

## Advanced Usage

### Re-generating Commands

**After editing configuration:**
```bash
npx tsx scripts/generate-data-commands.ts
```

**This will:**
- Read updated config
- Regenerate all three commands
- Preserve manual edits in templates (not in generated files!)

### Updating Individual Commands

**Edit template:**
```bash
.claude/commands/templates/dataanalysis.template.md
```

**Regenerate:**
```bash
npx tsx scripts/generate-data-commands.ts
```

**Result:**
- All projects using templates get updated
- Configuration-specific parts remain customized

### Multiple Projects

**Same repository, different domains:**
1. Copy `.claude/project-config.json` to `.claude/project-config-{name}.json`
2. Edit each config
3. Run generator with specific config:
   ```bash
   npx tsx scripts/generate-data-commands.ts --config .claude/project-config-clinical.json
   ```

---

## Template Syntax Summary

### Simple Variables
```markdown
{{VARIABLE_NAME}}
```

### Loops
```markdown
{{#ARRAY_NAME}}
Content with {{ITEM_VARIABLE}}
{{/ARRAY_NAME}}
```

### Nested Loops
```markdown
{{#OUTER_ARRAY}}
  {{#INNER_ARRAY}}
    {{ITEM_VARIABLE}}
  {{/INNER_ARRAY}}
{{/OUTER_ARRAY}}
```

### Comments (Not Processed)
```markdown
<!-- This is a comment, not a placeholder -->
```

---

## Support & Contribution

**Need help?**
- Check this README
- Review example configurations in `build-data/examples/`
- Ask questions via `/help`

**Want to contribute?**
- Add new templates to `.claude/commands/templates/`
- Extend variable maps in `scripts/generate-data-commands.ts`
- Document new variables in this README

---

**End of documentation** | For questions, see `/help` or contact repository maintainer
