#!/usr/bin/env tsx
/**
 * Template Engine: Generate Project-Specific Data Processing Commands
 *
 * Reads configuration from .claude/project-config.json and .claude/field-mappings.json
 * Substitutes variables in template files
 * Generates customized commands in .claude/commands/
 */

import * as fs from 'fs';
import * as path from 'path';

// Type definitions
interface ProjectConfig {
  version: string;
  generated: string;
  project: {
    name: string;
    domain: string;
    document_type: string;
  };
  entities: {
    main: {
      name: string;
      name_plural: string;
      id_field: string;
      id_pattern: string;
      id_example: string;
    };
    sub?: {
      name: string;
      enabled: boolean;
    };
  };
  measurements: {
    types: Array<{ name: string; unit: string; description: string }>;
    methods: string[];
  };
  tables: {
    types: Array<{ name: string; description: string; priority: string }>;
    extraction_strategy: string;
  };
  validation: {
    ranges: Record<string, { min: number; max: number; unit: string }>;
    required_fields: string[];
    optional_fields: string[];
  };
  metadata: {
    required: string[];
    optional: string[];
    custom: string[];
  };
  standards: {
    name: string;
    reference: string;
    enabled: boolean;
  };
  database: {
    enabled: boolean;
    tables?: Record<string, any>;
    naming_convention: string;
    primary_key_strategy: string;
    foreign_key_strategy: string;
  };
  output: {
    formats: string[];
    directory: string;
    naming_pattern: string;
  };
  templates: {
    analysis_template: string;
    extract_template: string;
    load_template: string;
  };
}

interface FieldMappings {
  version: string;
  generated: string;
  tables: Record<string, any>;
  generic_mappings: {
    entity_table: string;
    entity_id_column: string;
    measurement_table?: string;
    files_table?: string;
    datasets_table?: string;
  };
}

// Load configuration files
function loadConfig(): { config: ProjectConfig; mappings: FieldMappings } {
  const configPath = path.join(process.cwd(), '.claude', 'project-config.json');
  const mappingsPath = path.join(process.cwd(), '.claude', 'field-mappings.json');

  if (!fs.existsSync(configPath)) {
    throw new Error(
      `Configuration file not found: ${configPath}\nRun /setupdatacommands first!`
    );
  }

  if (!fs.existsSync(mappingsPath)) {
    throw new Error(
      `Field mappings file not found: ${mappingsPath}\nRun /setupdatacommands first!`
    );
  }

  const config: ProjectConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  const mappings: FieldMappings = JSON.parse(fs.readFileSync(mappingsPath, 'utf-8'));

  return { config, mappings };
}

// Build substitution map
function buildSubstitutionMap(config: ProjectConfig, mappings: FieldMappings): Record<string, string> {
  const map: Record<string, string> = {};

  // Project basics
  map['PROJECT_NAME'] = config.project.name;
  map['DOMAIN_TYPE'] = config.project.domain;
  map['DOCUMENT_TYPE'] = config.project.document_type;
  map['DATA_TYPE'] = config.measurements.types.map(t => t.name).join(', ');

  // Entity naming
  map['ENTITY_NAME'] = config.entities.main.name;
  map['ENTITY_NAME_PLURAL'] = config.entities.main.name_plural;
  map['ENTITY_ID'] = config.entities.main.id_field;
  map['ENTITY_ID_FIELD'] = config.entities.main.id_field;
  map['ID_PATTERN'] = config.entities.main.id_pattern;
  map['ID_REGEX'] = config.entities.main.id_pattern;
  map['ID_EXAMPLE'] = config.entities.main.id_example;

  // File naming
  map['INDEX_FILENAME'] = 'paper-index.md';
  map['ANALYSIS_FILENAME'] = 'paper-analysis.md';
  map['PAPERS_DIR'] = `${config.project.name}-papers`;
  map['TABLE_NAMING_PATTERN'] = `{table_name}_page_{page}`;

  // Database
  map['NAMING_CONVENTION'] = config.database.naming_convention;
  map['PK_STRATEGY'] = config.database.primary_key_strategy;
  map['FK_STRATEGY'] = config.database.foreign_key_strategy;

  // Standards
  map['STANDARDS_NAME'] = config.standards.name || 'domain standards';

  // Output
  map['OUTPUT_FORMAT'] = config.output.formats.join(' + ').toUpperCase();

  // Examples (for documentation)
  map['EXAMPLE_FIELDS'] = config.entities.main.id_field;
  map['TABLE_ID_EXAMPLES'] = config.tables.types.slice(0, 3).map(t => t.name).join(', ');
  map['DATA_TYPE_EXAMPLES'] = config.measurements.types.slice(0, 3).map(t => t.name).join(', ');
  map['DATA_TYPE_EXAMPLE_VALUES'] = config.measurements.types.slice(0, 3).map(t => `${t.name} (${t.unit})`).join(', ');

  // Metadata
  map['CUSTOM_FIELDS'] = config.metadata.custom.join(', ');
  map['METADATA_FIELDS'] = config.metadata.required.concat(config.metadata.optional).join(', ');

  // Image/figure criteria
  map['IMAGE_CRITERIA'] = 'data figures vs. conceptual diagrams';
  map['IMAGE_CATEGORIES'] = 'data, context, diagram';

  // Supplementary sources
  map['SUPPLEMENTARY_SOURCES'] = 'OSF, Zenodo, GitHub, Figshare';
  map['SUPPLEMENTARY_FORMATS'] = 'xlsx, csv, zip, tar.gz';
  map['SUPPLEMENTARY_IMPORTANCE_EXPLANATION'] = 'Supplementary tables often contain 50-70% of detailed data';

  // Content descriptions
  map['CONTENT_DESCRIPTION_EXAMPLES'] = config.tables.types.slice(0, 2).map(t => t.description).join(', ');

  // Database tables (if available)
  if (config.database.enabled && config.database.tables) {
    const tableNames = Object.keys(config.database.tables);
    map['DB_TABLES'] = tableNames.join(', ');
    map['DATASETS_TABLE'] = mappings.generic_mappings.datasets_table || 'datasets';
    map['FILES_TABLE'] = mappings.generic_mappings.files_table || 'data_files';
  } else {
    map['DB_TABLES'] = 'not configured';
    map['DATASETS_TABLE'] = 'datasets';
    map['FILES_TABLE'] = 'data_files';
  }

  // Validation ranges
  map['EXPECTED_COLUMN_COUNT'] = '24'; // Placeholder, will be determined at runtime
  map['EXAMPLE_TABLE_NAME'] = config.tables.types[0]?.name || 'Table 1';
  map['EXAMPLE_COLUMN_COUNT'] = '24'; // Placeholder

  // FAIR assessment
  map['MAX_FAIR_SCORE'] = '100';
  map['FINDABLE_DESCRIPTION'] = 'Dataset has unique identifiers and is indexed';
  map['ACCESSIBLE_DESCRIPTION'] = 'Dataset is openly accessible with clear licensing';
  map['INTEROPERABLE_DESCRIPTION'] = 'Data uses standard formats and vocabularies';
  map['REUSABLE_DESCRIPTION'] = 'Data has rich metadata and clear usage license';

  // Citation and publication
  map['CITATION_FIELD'] = 'citation';
  map['PUBLICATION_TYPE'] = 'journal';
  map['METADATA_FIELD_1'] = config.metadata.custom[0] || 'custom_field_1';
  map['METADATA_FIELD_2'] = config.metadata.custom[1] || 'custom_field_2';
  map['CUSTOM_FIELD_1'] = config.metadata.custom[0] || 'custom_field_1';
  map['CUSTOM_FIELD_2'] = config.metadata.custom[1] || 'custom_field_2';

  // Examples
  map['EXAMPLE_TITLE'] = 'Example Study Title';
  map['EXAMPLE_AUTHORS'] = 'Smith et al.';
  map['EXAMPLE_YEAR'] = '2024';
  map['EXAMPLE_VALUE_1'] = 'example_value_1';
  map['EXAMPLE_VALUE_2'] = 'example_value_2';
  map['EXAMPLE_ID_PATTERN'] = config.entities.main.id_pattern;

  // Special cases
  map['TABLE_MAPPING_LOGIC'] = 'Determine based on filename pattern';

  return map;
}

// Build array substitutions (for loops)
function buildArraySubstitutions(config: ProjectConfig): Record<string, any[]> {
  const arrays: Record<string, any[]> = {};

  // Validation ranges
  arrays['VALIDATION_RANGES'] = Object.entries(config.validation.ranges).map(([fieldName, range]) => ({
    FIELD_NAME: fieldName,
    MIN_VALUE: range.min,
    MAX_VALUE: range.max,
    FIELD_DESCRIPTION: `${fieldName} in ${range.unit}`,
  }));

  // Table types
  arrays['TABLE_TYPES'] = config.tables.types.map(table => ({
    TABLE_TYPE: table.name,
    TABLE_DESCRIPTION: table.description,
  }));

  // Database fields (sample)
  arrays['DB_FIELDS'] = config.validation.required_fields.map(field => ({
    FIELD_NAME: field,
  }));

  // Database tables (if available)
  if (config.database.enabled && config.database.tables) {
    arrays['DB_TABLES'] = Object.keys(config.database.tables).map(tableName => ({
      TABLE_NAME: tableName,
    }));
  }

  // FAIR criteria (placeholders - would be customized per domain)
  arrays['FINDABLE_CRITERIA'] = [
    { CRITERION: 'Unique identifier', DESCRIPTION: 'Dataset has DOI or similar' },
    { CRITERION: 'Rich metadata', DESCRIPTION: 'Comprehensive descriptive metadata' },
  ];

  arrays['ACCESSIBLE_CRITERIA'] = [
    { CRITERION: 'Open access', DESCRIPTION: 'Data freely available' },
    { CRITERION: 'Clear license', DESCRIPTION: 'Usage terms specified' },
  ];

  arrays['INTEROPERABLE_CRITERIA'] = [
    { CRITERION: 'Standard format', DESCRIPTION: 'Uses community-accepted formats' },
    { CRITERION: 'Controlled vocabulary', DESCRIPTION: 'Uses standard terminology' },
  ];

  arrays['REUSABLE_CRITERIA'] = [
    { CRITERION: 'Detailed provenance', DESCRIPTION: 'Clear data lineage' },
    { CRITERION: 'Community standards', DESCRIPTION: 'Follows domain standards' },
  ];

  // Scoring rules (placeholder)
  arrays['SCORING_RULES'] = [
    {
      CONDITION: 'dataset has DOI',
      CATEGORY: 'findable',
      POINTS: '10',
      EXPLANATION: 'Unique persistent identifier',
    },
  ];

  // Supplementary sources
  arrays['SUPPLEMENTARY_SOURCES'] = [
    { SOURCE_NAME: 'OSF', SOURCE_URL_PATTERN: 'osf.io' },
    { SOURCE_NAME: 'Zenodo', SOURCE_URL_PATTERN: 'zenodo.org' },
    { SOURCE_NAME: 'GitHub', SOURCE_URL_PATTERN: 'github.com' },
  ];

  return arrays;
}

// Substitute variables in template
function substituteTemplate(template: string, map: Record<string, string>, arrays: Record<string, any[]>): string {
  let result = template;

  // Simple variable substitution
  for (const [key, value] of Object.entries(map)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value);
  }

  // Array/loop substitution (Mustache-style)
  for (const [arrayName, arrayData] of Object.entries(arrays)) {
    // Find loop blocks: {{#ARRAY_NAME}}...{{/ARRAY_NAME}}
    const loopRegex = new RegExp(`{{#${arrayName}}}([\\s\\S]*?){{/${arrayName}}}`, 'g');

    result = result.replace(loopRegex, (match, template) => {
      return arrayData
        .map(item => {
          let itemResult = template;
          for (const [key, value] of Object.entries(item)) {
            const itemRegex = new RegExp(`{{${key}}}`, 'g');
            itemResult = itemResult.replace(itemRegex, String(value));
          }
          return itemResult;
        })
        .join('');
    });
  }

  return result;
}

// Generate command file from template
function generateCommand(
  templatePath: string,
  outputPath: string,
  map: Record<string, string>,
  arrays: Record<string, any[]>
): void {
  console.log(`\n📄 Generating: ${path.basename(outputPath)}`);

  // Read template
  const template = fs.readFileSync(templatePath, 'utf-8');

  // Substitute variables
  const result = substituteTemplate(template, map, arrays);

  // Check for unsubstituted placeholders
  const unsubstituted = [];
  const placeholderRegex = /{{([^}]+)}}/g;
  let match;
  while ((match = placeholderRegex.exec(result)) !== null) {
    unsubstituted.push(match[1]);
  }

  if (unsubstituted.length > 0) {
    console.warn(`⚠️  Warning: ${unsubstituted.length} unsubstituted placeholder(s):`);
    unsubstituted.slice(0, 5).forEach(placeholder => {
      console.warn(`   - {{${placeholder}}}`);
    });
    if (unsubstituted.length > 5) {
      console.warn(`   ... and ${unsubstituted.length - 5} more`);
    }
  }

  // Write output
  fs.writeFileSync(outputPath, result, 'utf-8');
  console.log(`✅ Created: ${outputPath}`);
}

// Main execution
function main() {
  console.log('');
  console.log('=' .repeat(80));
  console.log('GENERATING PROJECT-SPECIFIC DATA PROCESSING COMMANDS');
  console.log('='.repeat(80));
  console.log('');

  try {
    // Load configuration
    console.log('📋 Loading configuration...');
    const { config, mappings } = loadConfig();
    console.log(`✅ Project: ${config.project.name}`);
    console.log(`✅ Domain: ${config.project.domain}`);
    console.log(`✅ Entity: ${config.entities.main.name}`);

    // Build substitution maps
    console.log('\n🔧 Building substitution maps...');
    const map = buildSubstitutionMap(config, mappings);
    const arrays = buildArraySubstitutions(config);
    console.log(`✅ ${Object.keys(map).length} simple substitutions`);
    console.log(`✅ ${Object.keys(arrays).length} array substitutions`);

    // Ensure output directory exists
    const commandsDir = path.join(process.cwd(), '.claude', 'commands');
    if (!fs.existsSync(commandsDir)) {
      fs.mkdirSync(commandsDir, { recursive: true });
    }

    // Generate commands
    console.log('\n📝 Generating commands...');

    const templates = [
      {
        name: 'analysis',
        template: config.templates.analysis_template,
        output: path.join(commandsDir, `${config.project.name}analysis.md`),
      },
      {
        name: 'extract',
        template: config.templates.extract_template,
        output: path.join(commandsDir, `${config.project.name}extract.md`),
      },
      {
        name: 'load',
        template: config.templates.load_template,
        output: path.join(commandsDir, `${config.project.name}load.md`),
      },
    ];

    for (const { name, template, output } of templates) {
      const templatePath = path.join(process.cwd(), template);
      generateCommand(templatePath, output, map, arrays);
    }

    // Summary
    console.log('');
    console.log('='.repeat(80));
    console.log('✅ GENERATION COMPLETE');
    console.log('='.repeat(80));
    console.log('');
    console.log('🎯 Commands generated:');
    console.log(`   ✅ /${config.project.name}analysis`);
    console.log(`   ✅ /${config.project.name}extract`);
    console.log(`   ✅ /${config.project.name}load`);
    console.log('');
    console.log('🚀 Next steps:');
    console.log(`   1. Review commands in .claude/commands/`);
    console.log(`   2. Test: /${config.project.name}analysis <path/to/document.pdf>`);
    console.log(`   3. Customize: Edit .claude/project-config.json if needed`);
    console.log('');
  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { buildSubstitutionMap, buildArraySubstitutions, substituteTemplate };
