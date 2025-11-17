/**
 * Update Malawi Rift dataset with paper analysis metadata
 * Populates paper_summary, key_findings, fair_score from paper-analysis.md
 */

import { query } from '../../lib/db/connection';

async function main() {
  console.log('📝 Updating Malawi Rift dataset metadata...\n');

  const paperSummary = `This landmark 2024 study by McMillan, Boone, and colleagues provides the first successful validation of footwall exhumation modeling as a proxy for normal fault array evolution in extensional basins. Using the Miocene Central Basin of the Malawi Rift as a natural laboratory, the authors demonstrate that along-strike patterns in footwall denudational cooling—constrained by apatite fission-track (AFT) and (U-Th)/He (AHe) thermochronology—closely mirror 4D hangingwall subsidence trends previously documented from seismic reflection and well data.

The study analyzes 35 samples collected along ~E-W vertical transects spaced 5-10 km apart across the 120 km-long Usisya fault system. Joint AFT-AHe thermal history modeling using QTQt reveals a diachronous footwall exhumation history that directly reflects the spatiotemporal evolution of the fault array.`;

  const keyFindings = [
    'Footwall thermochronology successfully reconstructs fault evolution previously known only from expensive seismic surveys',
    'Usisya fault evolved via segment growth and linkage model, not constant-length model',
    'Spatial variations in footwall exhumation reveal strain distribution between border faults and intrabasinal structures',
    'This approach can now be applied to rift basins worldwide lacking subsurface data',
    'Dataset is publicly available via AusGeochem (DOI: 10.58024/AGUM6A344358) following EarthBank FAIR standards'
  ];

  const fairReasoning = `This dataset achieves a high FAIR score through: (1) Findable - assigned persistent DOI (10.58024/AGUM6A344358) and IGSN identifiers for samples, (2) Accessible - publicly available via AusGeochem/EarthBank platform with no access restrictions, (3) Interoperable - follows EarthBank standardized templates for thermochronology data with controlled vocabularies, and (4) Reusable - complete analytical metadata including QC standards (Durango apatite), kinetic parameters (Dpar, rmr₀, Cl content), and grain-by-grain data enabling independent age recalculation and thermal history remodeling.`;

  const publicationReference = 'McMillan, M.E., Boone, S.C., et al., 2024. 4D Fault Evolution in Malawi Rift: Validation of footwall exhumation modeling. Tectonics (in press).';

  const authors = [
    'McMillan, M.E.',
    'Boone, S.C.',
    'Gleadow, A.J.W.',
    'Kohn, B.P.'
  ];

  const updateSql = `
    UPDATE datasets
    SET
      paper_summary = $1,
      key_findings = $2,
      fair_score = $3,
      fair_reasoning = $4,
      publication_reference = $5,
      authors = $6,
      study_area = $7,
      laboratory = $8
    WHERE id = 1
    RETURNING *
  `;

  const result = await query(updateSql, [
    paperSummary,
    keyFindings,
    95, // FAIR score (excellent compliance)
    fairReasoning,
    publicationReference,
    authors,
    'Usisya Border Fault, Malawi Rift Central Basin',
    'University of Melbourne'
  ]);

  if (result.length > 0) {
    console.log('✅ Successfully updated Malawi Rift dataset');
    console.log(`   Paper Summary: ${paperSummary.substring(0, 100)}...`);
    console.log(`   Key Findings: ${keyFindings.length} items`);
    console.log(`   FAIR Score: 95/100`);
  } else {
    console.log('❌ Update failed - dataset not found');
  }

  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
