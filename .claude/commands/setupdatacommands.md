# /setupdatacommands - Setup Generic PDF Data Processing Commands

**Purpose:** Interactive setup to generate project-specific data processing commands from generic templates

**What this does:**
1. Asks questions about your project domain and data types
2. Discovers your database schema (if exists)
3. Generates customized versions of:
   - `/[projectname]analysis` - PDF analysis and table extraction
   - `/[projectname]extract` - Data extraction with validation
   - `/[projectname]load` - Database import with FAIR assessment
4. Stores configuration for future use

**Usage:** Run this command ONCE per project to set up the data processing workflow

---

## Prerequisites

- Project initialized with `/setupproject` (optional, but recommended)
- Database connection in `.env.local` (optional, can be configured later)
- TypeScript/Node.js environment (for template engine)

---

## Workflow

### Phase 1: Project Domain Questions

**Ask the user:**

1. **Project Name**
   - What short name for this project? (e.g., "thermo", "clinical", "chemistry")
   - Used as command prefix: `/[name]analysis`, `/[name]extract`, `/[name]load`

2. **Domain Type**
   - What field/domain? (geology, medicine, chemistry, biology, physics, etc.)
   - What type of documents? (research papers, technical reports, clinical studies, etc.)

3. **Data Entity Naming**
   - What do you call individual items? (samples, patients, sites, specimens, cells, etc.)
   - Do items have sub-entities? (Yes/No)
   - If yes: What are they called? (analyses, visits, measurements, etc.)

4. **ID Patterns**
   - Example ID for main entity? (e.g., `MU19-05`, `PATIENT-001`, `SITE-A1`)
   - Regex pattern? (auto-suggest based on example, user confirms)

5. **Measurement Types**
   - What data do you collect? (ages, concentrations, counts, sequences, images, etc.)
   - What units? (Ma, ppm, μm, mg/L, base pairs, pixels, etc.)

6. **Analytical Methods**
   - What techniques/methods? (mass spec, microscopy, PCR, chromatography, sequencing, etc.)

7. **Table Types**
   - What types of tables appear in documents? (summary tables, raw data, QC data, etc.)
   - Priority for each type? (HIGH, MEDIUM, LOW)

8. **Validation Ranges**
   - For each measurement type, what are typical ranges?
   - Min/max values? (used for validation during extraction)

9. **Metadata Fields**
   - What additional metadata to track? (location, lab, date, method, analyst, etc.)
   - Which are required vs. optional?

10. **Data Standards**
    - Are there published reporting standards in your field? (CONSORT, STROBE, MIAME, etc.)
    - Reference publication? (e.g., "Kohn et al. 2024" for thermochronology)

---

### Phase 2: Database Schema Discovery

**Auto-detect database connection:**
```python
from pathlib import Path
from dotenv import load_dotenv
import os

# Try to load database connection
env_file = Path('.env.local')
if env_file.exists():
    load_dotenv(env_file)
    db_url = os.getenv('DATABASE_URL')
    direct_url = os.getenv('DIRECT_URL')

    if db_url:
        print('✅ Found database connection')
        has_database = True
    else:
        print('⚠️  No DATABASE_URL in .env.local')
        has_database = False
else:
    print('⚠️  No .env.local file found')
    has_database = False
```

**If database exists, introspect schema:**
```python
import psycopg2
from psycopg2 import sql

if has_database:
    print('🔍 Discovering database schema...')

    conn = psycopg2.connect(direct_url)
    cursor = cursor()

    # Get all tables
    cursor.execute('''
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name
    ''')
    tables = [row[0] for row in cursor.fetchall()]

    print(f'✅ Found {len(tables)} table(s):')
    for table in tables:
        print(f'   - {table}')

    # Get columns for each table
    schema_info = {}
    for table in tables:
        cursor.execute('''
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = %s
            ORDER BY ordinal_position
        ''', (table,))

        columns = [
            {
                'name': row[0],
                'type': row[1],
                'nullable': row[2] == 'YES'
            }
            for row in cursor.fetchall()
        ]

        schema_info[table] = columns

        print(f'   {table}: {len(columns)} columns')

    # Get foreign key relationships
    cursor.execute('''
        SELECT
            tc.table_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
    ''')

    foreign_keys = [
        {
            'table': row[0],
            'column': row[1],
            'references_table': row[2],
            'references_column': row[3]
        }
        for row in cursor.fetchall()
    ]

    print(f'✅ Found {len(foreign_keys)} foreign key relationship(s)')

    cursor.close()
    conn.close()
```

**Interactive schema mapping:**
```python
# Ask user to map generic concepts to actual tables
print()
print('🗺️  Mapping database schema to project entities...')
print()

# Map main entity table
print(f'Which table contains your {entity_name}? (e.g., samples, patients, sites)')
print('Available tables:')
for i, table in enumerate(tables, 1):
    print(f'  {i}. {table}')
print()
# User selects table number

main_entity_table = tables[selected_index]
print(f'✅ Main entity table: {main_entity_table}')

# Map ID column
print(f'Which column in {main_entity_table} is the {entity_name} ID?')
print('Available columns:')
for i, col in enumerate(schema_info[main_entity_table], 1):
    print(f'  {i}. {col["name"]} ({col["type"]})')
print()
# User selects column number

entity_id_column = schema_info[main_entity_table][selected_index]['name']
print(f'✅ ID column: {entity_id_column}')

# Repeat for other key tables (measurements, metadata, files, etc.)
```

**If no database, offer to generate schema:**
```python
if not has_database:
    print()
    print('⚠️  No database detected')
    print()
    print('Options:')
    print('  1. Continue without database (files-only workflow)')
    print('  2. Describe schema manually (I\'ll generate SQL migrations)')
    print('  3. Skip database for now (configure later)')
    print()
    # User selects option
```

---

### Phase 3: Check PROJECT_INDEX.json

**Parse existing project documentation:**
```python
from pathlib import Path
import json

index_file = Path('PROJECT_INDEX.json')
if index_file.exists():
    print('✅ Found PROJECT_INDEX.json')

    with open(index_file, 'r') as f:
        project_index = json.load(f)

    # Extract relevant information
    if 'database' in project_index:
        print(f'   Database type: {project_index["database"].get("type", "unknown")}')
        print(f'   Tables: {len(project_index["database"].get("tables", []))}')

    if 'documentation' in project_index:
        print(f'   Documentation files: {len(project_index["documentation"])}')

else:
    print('ℹ️  No PROJECT_INDEX.json found (run /index to create)')
```

---

### Phase 4: Generate Configuration Files

**Create `.claude/project-config.json`:**
```python
import json
from datetime import datetime

config = {
    "version": "1.0",
    "generated": datetime.now().isoformat(),
    "project": {
        "name": project_name,
        "domain": domain_type,
        "document_type": document_type
    },
    "entities": {
        "main": {
            "name": entity_name,
            "name_plural": entity_name_plural,
            "id_field": entity_id_column,
            "id_pattern": id_regex,
            "id_example": id_example
        },
        "sub": {
            "name": sub_entity_name,
            "enabled": has_sub_entities
        } if has_sub_entities else None
    },
    "measurements": {
        "types": measurement_types,  # List of dicts: {name, unit, description}
        "methods": analytical_methods  # List of methods
    },
    "tables": {
        "types": table_types,  # List of dicts: {name, description, priority}
        "extraction_strategy": extraction_strategy  # "all", "user_select", "ai_suggest"
    },
    "validation": {
        "ranges": validation_ranges,  # Dict: {field_name: {min, max, unit}}
        "required_fields": required_fields,  # List of field names
        "optional_fields": optional_fields  # List of field names
    },
    "metadata": {
        "required": required_metadata,  # List: [title, authors, year, ...]
        "optional": optional_metadata,  # List: [journal, doi, ...]
        "custom": custom_metadata  # List of custom fields
    },
    "standards": {
        "name": standards_name,  # e.g., "Kohn et al. 2024"
        "reference": standards_reference,  # Citation or URL
        "enabled": has_standards
    },
    "database": {
        "enabled": has_database,
        "tables": db_tables_mapping if has_database else None,
        "naming_convention": naming_convention,  # "camelCase", "snake_case", "PascalCase"
        "primary_key_strategy": pk_strategy,  # "uuid", "serial", "string"
        "foreign_key_strategy": fk_strategy  # "string", "int", "uuid"
    },
    "output": {
        "formats": ["csv", "json", "sql"],  # Enabled formats
        "directory": "extracted",  # Output directory name
        "naming_pattern": output_naming_pattern  # e.g., "{table_name}_{date}.csv"
    },
    "templates": {
        "analysis_template": ".claude/commands/templates/dataanalysis.template.md",
        "extract_template": ".claude/commands/templates/dataextract.template.md",
        "load_template": ".claude/commands/templates/dataload.template.md"
    }
}

config_file = Path('.claude/project-config.json')
with open(config_file, 'w') as f:
    json.dump(config, f, indent=2)

print(f'✅ Created: {config_file}')
```

**Create `.claude/field-mappings.json`:**
```python
# Store database schema mappings
mappings = {
    "version": "1.0",
    "generated": datetime.now().isoformat(),
    "tables": {
        table_name: {
            "purpose": table_purpose,  # e.g., "main entity", "measurements", "metadata"
            "columns": {
                col_name: {
                    "type": col_type,
                    "nullable": col_nullable,
                    "description": col_description  # User-provided or AI-inferred
                }
                for col_name, col_type, col_nullable in table_columns
            },
            "foreign_keys": [
                {
                    "column": fk_column,
                    "references": f"{ref_table}.{ref_column}"
                }
                for fk in table_foreign_keys
            ]
        }
        for table_name in db_tables
    } if has_database else {},
    "generic_mappings": {
        "entity_table": main_entity_table,
        "entity_id_column": entity_id_column,
        "measurement_table": measurement_table if has_database else None,
        "files_table": files_table if has_database else None,
        "datasets_table": datasets_table if has_database else None
    }
}

mappings_file = Path('.claude/field-mappings.json')
with open(mappings_file, 'w') as f:
    json.dump(mappings, f, indent=2)

print(f'✅ Created: {mappings_file}')
```

---

### Phase 5: Generate Commands from Templates

**Run the template engine:**
```bash
npx tsx scripts/generate-data-commands.ts
```

**Template engine reads:**
1. `.claude/project-config.json`
2. `.claude/field-mappings.json`
3. Template files

**Template engine generates:**
1. `.claude/commands/{projectname}analysis.md`
2. `.claude/commands/{projectname}extract.md`
3. `.claude/commands/{projectname}load.md`

**Example output:**
```
✅ Generated: .claude/commands/thermoanalysis.md
✅ Generated: .claude/commands/thermoextract.md
✅ Generated: .claude/commands/thermoload.md
```

---

### Phase 6: Validation & Summary

**Test generated commands:**
```python
# Validate generated commands can be parsed
for cmd_file in [f'{project_name}analysis.md', f'{project_name}extract.md', f'{project_name}load.md']:
    cmd_path = Path(f'.claude/commands/{cmd_file}')

    if cmd_path.exists():
        content = cmd_path.read_text()

        # Check for unsubstituted placeholders
        unsubstituted = []
        import re
        for match in re.finditer(r'{{([^}]+)}}', content):
            unsubstituted.append(match.group(1))

        if unsubstituted:
            print(f'⚠️  {cmd_file} has unsubstituted placeholders:')
            for placeholder in unsubstituted[:5]:  # Show first 5
                print(f'   - {{{{  {placeholder} }}}}')
        else:
            print(f'✅ {cmd_file} validated')
    else:
        print(f'❌ {cmd_file} not found!')
```

**Print summary:**
```python
print()
print('=' * 80)
print('✅ SETUP COMPLETE')
print('=' * 80)
print()

print(f'📋 Project: {project_name}')
print(f'📋 Domain: {domain_type}')
print(f'📋 Entity: {entity_name} (ID: {entity_id_column})')
print()

print('📁 Configuration Files Created:')
print('   ✅ .claude/project-config.json')
print('   ✅ .claude/field-mappings.json')
print()

print('🎯 Commands Generated:')
print(f'   ✅ /{project_name}analysis - PDF analysis and table extraction')
print(f'   ✅ /{project_name}extract - Data extraction with validation')
print(f'   ✅ /{project_name}load - Database import with FAIR assessment')
print()

if has_database:
    print('💾 Database Schema:')
    print(f'   ✅ {len(db_tables)} table(s) mapped')
    print(f'   ✅ {len(foreign_keys)} foreign key(s) detected')
    print()

print('🚀 Next Steps:')
print(f'   1. Review generated commands in .claude/commands/')
print(f'   2. Test workflow: /{project_name}analysis <path/to/paper.pdf>')
print(f'   3. Customize validation ranges in .claude/project-config.json if needed')
print(f'   4. Run /index to update PROJECT_INDEX.json')
print()

print('📚 Documentation:')
print('   - Template system: .claude/commands/templates/setup/README.md')
print('   - Configuration reference: .claude/project-config.json')
print('   - Database mappings: .claude/field-mappings.json')
print()
```

---

## 🔧 Re-Running Setup

**If you need to regenerate commands:**

1. Delete generated commands (keep templates):
   ```bash
   rm .claude/commands/{projectname}*.md
   ```

2. Edit configuration files:
   - `.claude/project-config.json` - Change settings
   - `.claude/field-mappings.json` - Update schema mappings

3. Re-run template engine:
   ```bash
   npx tsx scripts/generate-data-commands.ts
   ```

**Or re-run the full setup:**
```bash
/setupdatacommands
```
- Will detect existing config
- Ask if you want to overwrite or update
- Preserve customizations if desired

---

## Error Handling

**If database connection fails:**
- Continues with files-only workflow
- Can add database later by editing `.claude/project-config.json`

**If template generation fails:**
- Shows which placeholder couldn't be substituted
- Suggests manual fix in config files

**If commands already exist:**
- Asks whether to overwrite or skip
- Creates backup with `.bak` extension

---

**End of setup command** | Generated commands will appear in `.claude/commands/` with your project name prefix
