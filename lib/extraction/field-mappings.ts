/**
 * Field Mapping Configurations for EarthBank Schema
 * Maps extracted table data to EarthBank-compliant camelCase field names
 */

export interface FieldMapping {
  earthbankField: string;
  description: string;
  dataType: 'string' | 'number' | 'integer' | 'boolean';
  required: boolean;
  aliases: string[]; // Common column names in papers
  unit?: string;
  validationRules?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface TableMapping {
  tableName: string;
  description: string;
  fields: FieldMapping[];
}

/**
 * Sample Metadata Mapping
 * Maps to: earthbank_samples table
 */
export const SAMPLE_MAPPING: TableMapping = {
  tableName: 'earthbank_samples',
  description: 'Sample metadata (location, lithology, elevation)',
  fields: [
    {
      earthbankField: 'sampleID',
      description: 'Unique sample identifier',
      dataType: 'string',
      required: true,
      aliases: ['Sample', 'Sample ID', 'Sample Name', 'ID', 'Sample No.'],
    },
    {
      earthbankField: 'latitude',
      description: 'Latitude in decimal degrees',
      dataType: 'number',
      required: false,
      aliases: ['Lat', 'Latitude', 'Lat.', 'Lat (DD)', 'Latitude (°N)'],
      unit: 'degrees',
      validationRules: { min: -90, max: 90 },
    },
    {
      earthbankField: 'longitude',
      description: 'Longitude in decimal degrees',
      dataType: 'number',
      required: false,
      aliases: ['Lon', 'Long', 'Longitude', 'Long.', 'Lon (DD)', 'Longitude (°E)'],
      unit: 'degrees',
      validationRules: { min: -180, max: 180 },
    },
    {
      earthbankField: 'elevation',
      description: 'Elevation in meters',
      dataType: 'number',
      required: false,
      aliases: ['Elev', 'Elevation', 'Elev.', 'Alt', 'Altitude', 'Elev (m)', 'Elevation (m)'],
      unit: 'm',
    },
    {
      earthbankField: 'lithology',
      description: 'Rock type/lithology',
      dataType: 'string',
      required: false,
      aliases: ['Lithology', 'Rock Type', 'Lith', 'Rock'],
    },
    {
      earthbankField: 'mineral',
      description: 'Mineral analyzed (Apatite, Zircon)',
      dataType: 'string',
      required: false,
      aliases: ['Mineral', 'Min', 'Phase'],
    },
  ],
};

/**
 * FT Datapoint Mapping (Fission-Track Ages)
 * Maps to: earthbank_ftDatapoints table
 */
export const FT_DATAPOINT_MAPPING: TableMapping = {
  tableName: 'earthbank_ftDatapoints',
  description: 'Fission-track analytical session data',
  fields: [
    {
      earthbankField: 'datapointName',
      description: 'Unique datapoint identifier',
      dataType: 'string',
      required: true,
      aliases: ['Datapoint', 'Analysis', 'Session', 'ID'],
    },
    {
      earthbankField: 'sampleID',
      description: 'Associated sample ID',
      dataType: 'string',
      required: true,
      aliases: ['Sample', 'Sample ID', 'Sample Name'],
    },
    {
      earthbankField: 'centralAgeMa',
      description: 'Central age in Ma',
      dataType: 'number',
      required: false,
      aliases: ['Central Age', 'Central Age (Ma)', 'Age', 'Age (Ma)', 'FT Age'],
      unit: 'Ma',
      validationRules: { min: 0, max: 4500 },
    },
    {
      earthbankField: 'centralAgeErr',
      description: 'Central age error (1σ)',
      dataType: 'number',
      required: false,
      aliases: ['±', '± (Ma)', 'Error', '1σ', 'Uncertainty'],
      unit: 'Ma',
    },
    {
      earthbankField: 'pooledAgeMa',
      description: 'Pooled age in Ma',
      dataType: 'number',
      required: false,
      aliases: ['Pooled Age', 'Pooled Age (Ma)', 'Pool Age'],
      unit: 'Ma',
      validationRules: { min: 0, max: 4500 },
    },
    {
      earthbankField: 'pooledAgeErr',
      description: 'Pooled age error (1σ)',
      dataType: 'number',
      required: false,
      aliases: ['Pooled ±', 'Pool ±', 'Pooled Error'],
      unit: 'Ma',
    },
    {
      earthbankField: 'numGrains',
      description: 'Number of grains analyzed',
      dataType: 'integer',
      required: false,
      aliases: ['N', 'n', 'No. Grains', 'Grains', '# Grains', 'N grains'],
      validationRules: { min: 1, max: 1000 },
    },
    {
      earthbankField: 'meanTrackLength',
      description: 'Mean track length in µm',
      dataType: 'number',
      required: false,
      aliases: ['MTL', 'Mean Length', 'Track Length', 'MTL (µm)', 'Mean TL'],
      unit: 'µm',
      validationRules: { min: 5, max: 20 },
    },
    {
      earthbankField: 'stdDevTrackLength',
      description: 'Standard deviation of track length',
      dataType: 'number',
      required: false,
      aliases: ['SD', 'Std Dev', 'σ', 'St. Dev', 'SD (µm)'],
      unit: 'µm',
    },
    {
      earthbankField: 'numTracksLength',
      description: 'Number of tracks measured for length',
      dataType: 'integer',
      required: false,
      aliases: ['N TL', 'N tracks', 'No. Tracks', '# Tracks'],
      validationRules: { min: 1, max: 1000 },
    },
    {
      earthbankField: 'dpar',
      description: 'Dpar (etch pit diameter) in µm',
      dataType: 'number',
      required: false,
      aliases: ['Dpar', 'Dpar (µm)', 'Etch Pit', 'D-par'],
      unit: 'µm',
      validationRules: { min: 1, max: 5 },
    },
  ],
};

/**
 * He Datapoint Mapping ((U-Th)/He Ages)
 * Maps to: earthbank_heDatapoints table
 */
export const HE_DATAPOINT_MAPPING: TableMapping = {
  tableName: 'earthbank_heDatapoints',
  description: '(U-Th)/He analytical session data',
  fields: [
    {
      earthbankField: 'datapointName',
      description: 'Unique datapoint identifier',
      dataType: 'string',
      required: true,
      aliases: ['Datapoint', 'Analysis', 'Session', 'ID'],
    },
    {
      earthbankField: 'sampleID',
      description: 'Associated sample ID',
      dataType: 'string',
      required: true,
      aliases: ['Sample', 'Sample ID', 'Sample Name'],
    },
    {
      earthbankField: 'meanAgeMa',
      description: 'Mean (U-Th)/He age in Ma',
      dataType: 'number',
      required: false,
      aliases: ['Mean Age', 'Age', 'He Age', 'Mean Age (Ma)', 'Age (Ma)'],
      unit: 'Ma',
      validationRules: { min: 0, max: 4500 },
    },
    {
      earthbankField: 'meanAgeErr',
      description: 'Mean age error (1σ)',
      dataType: 'number',
      required: false,
      aliases: ['±', '± (Ma)', 'Error', '1σ', 'Uncertainty'],
      unit: 'Ma',
    },
    {
      earthbankField: 'numAliquots',
      description: 'Number of aliquots/grains analyzed',
      dataType: 'integer',
      required: false,
      aliases: ['N', 'n', 'No. Aliquots', 'Aliquots', '# Grains', 'N grains'],
      validationRules: { min: 1, max: 100 },
    },
  ],
};

/**
 * FT Track Length Mapping
 * Maps to: earthbank_ftTrackLengthData table
 */
export const FT_TRACK_LENGTH_MAPPING: TableMapping = {
  tableName: 'earthbank_ftTrackLengthData',
  description: 'Individual fission-track length measurements',
  fields: [
    {
      earthbankField: 'datapointName',
      description: 'Associated datapoint identifier',
      dataType: 'string',
      required: true,
      aliases: ['Datapoint', 'Sample', 'Analysis'],
    },
    {
      earthbankField: 'trackLengthMicrons',
      description: 'Track length in µm',
      dataType: 'number',
      required: true,
      aliases: ['Length', 'Track Length', 'TL', 'Length (µm)', 'TL (µm)'],
      unit: 'µm',
      validationRules: { min: 5, max: 20 },
    },
    {
      earthbankField: 'angleToC',
      description: 'Angle to c-axis in degrees',
      dataType: 'number',
      required: false,
      aliases: ['Angle', 'Angle (°)', 'θ', 'C-axis angle'],
      unit: 'degrees',
      validationRules: { min: 0, max: 90 },
    },
  ],
};

/**
 * He Whole Grain Mapping
 * Maps to: earthbank_heWholeGrainData table
 */
export const HE_WHOLE_GRAIN_MAPPING: TableMapping = {
  tableName: 'earthbank_heWholeGrainData',
  description: 'Individual (U-Th)/He grain data with chemistry',
  fields: [
    {
      earthbankField: 'datapointName',
      description: 'Associated datapoint identifier',
      dataType: 'string',
      required: true,
      aliases: ['Datapoint', 'Sample', 'Analysis'],
    },
    {
      earthbankField: 'aliquotName',
      description: 'Grain/aliquot identifier',
      dataType: 'string',
      required: true,
      aliases: ['Grain', 'Aliquot', 'Grain ID', 'ID'],
    },
    {
      earthbankField: 'rawAgeMa',
      description: 'Raw (uncorrected) age in Ma',
      dataType: 'number',
      required: false,
      aliases: ['Raw Age', 'Uncorrected Age', 'Raw Age (Ma)'],
      unit: 'Ma',
      validationRules: { min: 0, max: 4500 },
    },
    {
      earthbankField: 'correctedAgeMa',
      description: 'Corrected age (Ft-corrected) in Ma',
      dataType: 'number',
      required: false,
      aliases: ['Corrected Age', 'Age', 'He Age', 'Corr. Age (Ma)', 'Age (Ma)'],
      unit: 'Ma',
      validationRules: { min: 0, max: 4500 },
    },
    {
      earthbankField: 'correctedAgeErr',
      description: 'Corrected age error (1σ)',
      dataType: 'number',
      required: false,
      aliases: ['±', '± (Ma)', 'Error', '1σ'],
      unit: 'Ma',
    },
    {
      earthbankField: 'ft',
      description: 'Alpha ejection correction factor',
      dataType: 'number',
      required: false,
      aliases: ['Ft', 'F_T', 'Alpha Correction', 'Ejection'],
      validationRules: { min: 0, max: 1 },
    },
    {
      earthbankField: 'uPpm',
      description: 'Uranium concentration in ppm',
      dataType: 'number',
      required: false,
      aliases: ['U', '[U]', 'U (ppm)', 'U ppm'],
      unit: 'ppm',
      validationRules: { min: 0 },
    },
    {
      earthbankField: 'thPpm',
      description: 'Thorium concentration in ppm',
      dataType: 'number',
      required: false,
      aliases: ['Th', '[Th]', 'Th (ppm)', 'Th ppm'],
      unit: 'ppm',
      validationRules: { min: 0 },
    },
    {
      earthbankField: 'smPpm',
      description: 'Samarium concentration in ppm',
      dataType: 'number',
      required: false,
      aliases: ['Sm', '[Sm]', 'Sm (ppm)', 'Sm ppm'],
      unit: 'ppm',
      validationRules: { min: 0 },
    },
    {
      earthbankField: 'eU',
      description: 'Effective uranium in ppm',
      dataType: 'number',
      required: false,
      aliases: ['eU', '[eU]', 'eU (ppm)', 'Effective U'],
      unit: 'ppm',
      validationRules: { min: 0 },
    },
  ],
};

/**
 * Get field mapping by table type
 */
export function getFieldMapping(dataType: string): TableMapping | null {
  const mappings: Record<string, TableMapping> = {
    'Sample metadata': SAMPLE_MAPPING,
    'AFT ages': FT_DATAPOINT_MAPPING,
    'FT ages': FT_DATAPOINT_MAPPING,
    'Fission-track ages': FT_DATAPOINT_MAPPING,
    'He ages': HE_DATAPOINT_MAPPING,
    '(U-Th)/He ages': HE_DATAPOINT_MAPPING,
    'Track lengths': FT_TRACK_LENGTH_MAPPING,
    'He chemistry': HE_WHOLE_GRAIN_MAPPING,
    'He grain data': HE_WHOLE_GRAIN_MAPPING,
  };

  return mappings[dataType] || null;
}

/**
 * Find EarthBank field name from common alias
 */
export function findFieldByAlias(
  mapping: TableMapping,
  columnName: string
): FieldMapping | null {
  const normalized = columnName.toLowerCase().trim();

  for (const field of mapping.fields) {
    // Check exact match with earthbankField
    if (field.earthbankField.toLowerCase() === normalized) {
      return field;
    }

    // Check aliases
    for (const alias of field.aliases) {
      if (alias.toLowerCase() === normalized) {
        return field;
      }
    }
  }

  return null;
}

/**
 * Validate field value against rules
 */
export function validateFieldValue(
  field: FieldMapping,
  value: any
): { valid: boolean; error?: string } {
  if (value === null || value === undefined || value === '') {
    if (field.required) {
      return { valid: false, error: `${field.earthbankField} is required` };
    }
    return { valid: true };
  }

  // Type validation
  if (field.dataType === 'number' || field.dataType === 'integer') {
    const num = Number(value);
    if (isNaN(num)) {
      return { valid: false, error: `${field.earthbankField} must be a number` };
    }

    if (field.dataType === 'integer' && !Number.isInteger(num)) {
      return { valid: false, error: `${field.earthbankField} must be an integer` };
    }

    // Range validation
    if (field.validationRules) {
      if (field.validationRules.min !== undefined && num < field.validationRules.min) {
        return {
          valid: false,
          error: `${field.earthbankField} must be >= ${field.validationRules.min}`,
        };
      }
      if (field.validationRules.max !== undefined && num > field.validationRules.max) {
        return {
          valid: false,
          error: `${field.earthbankField} must be <= ${field.validationRules.max}`,
        };
      }
    }
  }

  // Pattern validation
  if (field.validationRules?.pattern) {
    const pattern = new RegExp(field.validationRules.pattern);
    if (!pattern.test(String(value))) {
      return { valid: false, error: `${field.earthbankField} format is invalid` };
    }
  }

  return { valid: true };
}
