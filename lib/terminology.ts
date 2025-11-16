/**
 * Terminology Lookup
 *
 * Provides tooltip content for manufacturers, platforms, and assays
 * Source: /build-data/learning/terminology-indexed/qc-data-terminology-reference/
 */

export interface ManufacturerInfo {
  name: string;
  platforms: string[];
  methodology: string;
  marketPosition: string;
}

export interface PlatformInfo {
  name: string;
  manufacturer: string;
  methodology: string;
  throughput: string;
  automation: string;
}

// Manufacturer definitions
export const manufacturers: Record<string, ManufacturerInfo> = {
  'Abbott': {
    name: 'Abbott',
    platforms: ['Alinity i', 'Alinity s', 'ARCHITECT'],
    methodology: 'Primarily CLIA (Chemiluminescent Immunoassay)',
    marketPosition: 'Largest presence in dataset, broad test menu'
  },
  'DiaSorin': {
    name: 'DiaSorin',
    platforms: ['LIAISON', 'LIAISON XL', 'Murex'],
    methodology: 'Primarily ELISA, some CLIA',
    marketPosition: 'Strong in TORCH testing, infectious disease screening'
  },
  'Roche': {
    name: 'Roche',
    platforms: ['Elecsys'],
    methodology: 'CLIA (Electrochemiluminescence)',
    marketPosition: 'Premium platform, highly automated'
  },
  'Siemens': {
    name: 'Siemens',
    platforms: ['ADVIA Centaur', 'ATELLICA', 'Enzygnost', 'Novagnost'],
    methodology: 'CLIA for automated platforms',
    marketPosition: 'Comprehensive menu, hospital labs'
  },
  'bioMerieux': {
    name: 'bioMerieux',
    platforms: ['VIDAS'],
    methodology: 'ELISA',
    marketPosition: 'Compact analyzers, moderate throughput'
  },
  'Bio-Rad': {
    name: 'Bio-Rad',
    platforms: ['Access', 'Genscreen', 'Monolisa'],
    methodology: 'ELISA',
    marketPosition: 'Blood bank, transfusion medicine'
  },
  'Ortho Clinical Diagnostics': {
    name: 'Ortho Clinical Diagnostics',
    platforms: ['VITROS'],
    methodology: 'ELISA, Enhanced Chemiluminescence',
    marketPosition: 'Hospital central labs'
  },
  'Virclia': {
    name: 'Virclia',
    platforms: ['Virclia'],
    methodology: 'ELISA',
    marketPosition: 'Specialized infectious disease testing'
  },
  'Virion': {
    name: 'Virion',
    platforms: ['Serion'],
    methodology: 'ELISA',
    marketPosition: 'European manufacturer, niche markets'
  }
};

// Platform definitions
export const platforms: Record<string, PlatformInfo> = {
  'Alinity i': {
    name: 'Alinity i',
    manufacturer: 'Abbott',
    methodology: 'CLIA',
    throughput: 'High (~100-200 tests/hr)',
    automation: 'Fully automated'
  },
  'Alinity s': {
    name: 'Alinity s',
    manufacturer: 'Abbott',
    methodology: 'CLIA',
    throughput: 'Very High (>500 tests/hr)',
    automation: 'Fully automated'
  },
  'ARCHITECT': {
    name: 'ARCHITECT',
    manufacturer: 'Abbott',
    methodology: 'CLIA',
    throughput: 'High (~200 tests/hr)',
    automation: 'Fully automated'
  },
  'LIAISON': {
    name: 'LIAISON',
    manufacturer: 'DiaSorin',
    methodology: 'ELISA',
    throughput: 'Medium (~80-120 tests/hr)',
    automation: 'Automated'
  },
  'LIAISON XL': {
    name: 'LIAISON XL',
    manufacturer: 'DiaSorin',
    methodology: 'ELISA',
    throughput: 'High (~120-180 tests/hr)',
    automation: 'Automated'
  },
  'Elecsys': {
    name: 'Elecsys',
    manufacturer: 'Roche',
    methodology: 'CLIA (ECL)',
    throughput: 'High (~170 tests/hr)',
    automation: 'Fully automated'
  },
  'ADVIA Centaur': {
    name: 'ADVIA Centaur',
    manufacturer: 'Siemens',
    methodology: 'CLIA',
    throughput: 'High (~240 tests/hr)',
    automation: 'Fully automated'
  },
  'ATELLICA': {
    name: 'ATELLICA',
    manufacturer: 'Siemens',
    methodology: 'CLIA',
    throughput: 'Very High (>400 tests/hr)',
    automation: 'Fully automated'
  },
  'VIDAS': {
    name: 'VIDAS',
    manufacturer: 'bioMerieux',
    methodology: 'ELISA (ELFA)',
    throughput: 'Low-Medium (~30-60 tests/hr)',
    automation: 'Semi-automated'
  },
  'VITROS': {
    name: 'VITROS',
    manufacturer: 'Ortho Clinical Diagnostics',
    methodology: 'ELISA/ECL',
    throughput: 'Medium-High (~100+ tests/hr)',
    automation: 'Automated'
  }
};

// Helper functions
export function getManufacturerTooltip(manufacturerName: string): string {
  const info = manufacturers[manufacturerName];
  if (!info) return manufacturerName;

  return `${info.name}
Platforms: ${info.platforms.join(', ')}
Methodology: ${info.methodology}
${info.marketPosition}`;
}

export function getPlatformTooltip(platformName: string): string {
  const info = platforms[platformName];
  if (!info) return platformName;

  return `${info.name} (${info.manufacturer})
Methodology: ${info.methodology}
Throughput: ${info.throughput}
Automation: ${info.automation}`;
}
