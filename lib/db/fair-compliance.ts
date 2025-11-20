/**
 * FAIR Compliance JSON Loader
 *
 * Loads and parses fair-compliance.json files from the thermo-papers directory
 */

import fs from 'fs';
import path from 'path';
import { logger } from '@/lib/utils/logger';

const PAPERS_DIR = path.join(process.cwd(), 'build-data', 'learning', 'thermo-papers');

export interface FairComplianceField {
  present: boolean;
  location: string | null;
  mapped_to: string | null;
  notes?: string;
}

export interface TableCompliance {
  applicable: boolean;
  score: number;
  max_score: number;
  percentage: number | null;
  required_fields: Record<string, FairComplianceField>;
  recommended_fields?: Record<string, FairComplianceField>;
}

export interface FairComplianceData {
  paper: {
    citation: string;
    doi: string | null;
    year: number | null;
    authors: string[];
    journal: string | null;
    title: string | null;
    folder_name: string;
  };
  analysis_date: string;
  kohn_2024_compliance: {
    table_4_samples: TableCompliance;
    table_5_ft_counts: TableCompliance;
    table_6_track_lengths: TableCompliance;
    table_7_la_icp_ms: TableCompliance;
    table_8_epma: TableCompliance;
    table_9_kinetic_params: TableCompliance;
    table_10_ft_ages: TableCompliance;
    table_11_thermal_models: TableCompliance;
  };
  summary: {
    total_score: number;
    total_possible: number;
    percentage: number;
    grade: string;
    method: string;
    mineral: string;
    sample_count: number;
    data_availability: string;
  };
  strengths: string[];
  gaps: string[];
  notes: string;
}

/**
 * Load FAIR compliance JSON for a dataset
 *
 * @param datasetName - Name of the dataset (folder name)
 * @returns FairComplianceData or null if not found
 */
export async function loadFairCompliance(datasetName: string): Promise<FairComplianceData | null> {
  try {
    // Try exact match first
    const exactPath = path.join(PAPERS_DIR, datasetName, 'fair-compliance.json');

    if (fs.existsSync(exactPath)) {
      const content = fs.readFileSync(exactPath, 'utf-8');
      return JSON.parse(content) as FairComplianceData;
    }

    // Try to find by partial match (in case dataset name differs slightly)
    const folders = fs.readdirSync(PAPERS_DIR, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const folder of folders) {
      if (folder.toLowerCase().includes(datasetName.toLowerCase()) ||
          datasetName.toLowerCase().includes(folder.toLowerCase())) {
        const jsonPath = path.join(PAPERS_DIR, folder, 'fair-compliance.json');

        if (fs.existsSync(jsonPath)) {
          const content = fs.readFileSync(jsonPath, 'utf-8');
          return JSON.parse(content) as FairComplianceData;
        }
      }
    }

    return null;
  } catch (error) {
    logger.error({ err: error, datasetName }, 'Error loading FAIR compliance');
    return null;
  }
}

/**
 * Get all available FAIR compliance files
 *
 * @returns Array of dataset names with FAIR compliance data
 */
export async function listFairCompliances(): Promise<string[]> {
  try {
    const folders = fs.readdirSync(PAPERS_DIR, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    const withCompliance: string[] = [];

    for (const folder of folders) {
      const jsonPath = path.join(PAPERS_DIR, folder, 'fair-compliance.json');
      if (fs.existsSync(jsonPath)) {
        withCompliance.push(folder);
      }
    }

    return withCompliance;
  } catch (error) {
    logger.error({ err: error }, 'Error listing FAIR compliances');
    return [];
  }
}

/**
 * Kohn et al. (2024) Table Descriptions
 */
export const KOHN_TABLE_DESCRIPTIONS = {
  table_4_samples: {
    name: 'Table 4: Sample Metadata (Geosample)',
    description: 'Core sample information including IGSN, location coordinates, elevation, mineral type, lithology, and sample collection metadata. Essential for making data findable and contextualizing results.',
    key_fields: ['sample_id', 'IGSN', 'latitude', 'longitude', 'elevation_m', 'mineral_type', 'lithology']
  },
  table_5_ft_counts: {
    name: 'Table 5: Fission-Track Count Data',
    description: 'Grain-by-grain spontaneous track counts (Ns), induced track counts (Ni), track densities, and uranium content. Required for age recalculation and quality assessment.',
    key_fields: ['Ns', 'Ni', 'rho_s_cm2', 'rho_i_cm2', 'Dpar_um', 'analyst', 'laboratory']
  },
  table_6_track_lengths: {
    name: 'Table 6: Track Length Measurements',
    description: 'Individual confined track lengths with c-axis angles, etching conditions, and measurement protocols. Critical for thermal history modeling and annealing kinetics.',
    key_fields: ['track_length_um', 'c_axis_angle_deg', 'mean_length_um', 'etching_conditions']
  },
  table_7_la_icp_ms: {
    name: 'Table 7: LA-ICP-MS Data',
    description: 'Laser ablation ICP-MS uranium measurements including spot-by-spot U238 content, laser parameters, ablation conditions, and reference material calibrations.',
    key_fields: ['U238_ppm', 'laser_system', 'spot_diameter_um', 'fluence_J_cm2', 'primary_reference']
  },
  table_8_epma: {
    name: 'Table 8: EPMA Compositional Data',
    description: 'Electron microprobe analysis of mineral chemistry including oxide weight percentages, calibration standards, and beam conditions. Used for kinetic parameter calculations.',
    key_fields: ['oxide_wt_pct', 'Cl_wt_pct', 'calibration_standards', 'beam_current_na']
  },
  table_9_kinetic_params: {
    name: 'Table 9: Kinetic Parameters',
    description: 'Annealing kinetic indicators including rmr0 (reduced track length), Dpar (etch pit diameter), chlorine content, and calculated kinetic factors. Essential for thermal modeling.',
    key_fields: ['rmr0', 'Dpar_um', 'eCl_apfu', 'kappa']
  },
  table_10_ft_ages: {
    name: 'Table 10: Fission-Track Ages',
    description: 'Calculated ages with uncertainties, age equations, calibration factors (zeta), dispersion statistics, and decay constants. Primary age results with full provenance.',
    key_fields: ['central_age_ma', 'pooled_age_ma', 'dispersion', 'P_chi2', 'zeta', 'lambda_D', 'lambda_f']
  },
  table_11_thermal_models: {
    name: 'Table 11: Thermal History Models',
    description: 'Thermal modeling results including time-temperature paths, modeling software used, annealing models applied, constraints, and goodness-of-fit statistics.',
    key_fields: ['modeling_code', 'ft_annealing_model', 'time_temp_constraints', 'thermal_history_paths']
  }
} as const;

/**
 * Get color class for FAIR score
 */
export function getFairScoreColor(score: number): string {
  if (score >= 90) return 'text-green-700 bg-green-100 border-green-300';
  if (score >= 80) return 'text-blue-700 bg-blue-100 border-blue-300';
  if (score >= 70) return 'text-yellow-700 bg-yellow-100 border-yellow-300';
  if (score >= 60) return 'text-orange-700 bg-orange-100 border-orange-300';
  return 'text-red-700 bg-red-100 border-red-300';
}

/**
 * Get grade badge color
 */
export function getGradeBadgeColor(grade: string): string {
  if (grade === 'A+' || grade === 'A') return 'bg-green-600 text-white';
  if (grade === 'B') return 'bg-blue-600 text-white';
  if (grade === 'C') return 'bg-yellow-600 text-white';
  if (grade === 'D') return 'bg-orange-600 text-white';
  return 'bg-red-600 text-white';
}
