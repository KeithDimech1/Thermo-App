-- Populate pathogens table with disease data and abbreviations
-- Based on: Schema_Enhancement_Plan_Assay_Disease_Relationships.md
-- Created: 2025-11-12

BEGIN;

-- Insert pathogens with abbreviations
INSERT INTO pathogens (id, name, abbreviation, scientific_name, transmission_route, clinical_significance) VALUES
  (1, 'Cytomegalovirus', 'CMV', 'Cytomegalovirus', 'Blood, bodily fluids', 'Serious infections in immunocompromised, congenital infections'),
  (2, 'Chlamydia trachomatis', 'CT', 'Chlamydia trachomatis', 'Sexual contact', 'Sexually transmitted infection, can cause infertility'),
  (3, 'Epstein-Barr Virus', 'EBV', 'Epstein-Barr Virus', 'Saliva', 'Infectious mononucleosis, associated with certain cancers'),
  (4, 'Hepatitis A Virus', 'HAV', 'Hepatitis A Virus', 'Fecal-oral', 'Acute liver infection, vaccine-preventable'),
  (5, 'Hepatitis B Virus', 'HBV', 'Hepatitis B Virus', 'Blood, bodily fluids', 'Chronic liver disease, cirrhosis, liver cancer'),
  (6, 'Hepatitis C Virus', 'HCV', 'Hepatitis C Virus', 'Blood', 'Chronic liver disease, leading cause of liver transplants'),
  (7, 'Human Immunodeficiency Virus', 'HIV', 'Human Immunodeficiency Virus', 'Blood, bodily fluids, sexual contact', 'Causes AIDS, weakens immune system'),
  (8, 'Human Papillomavirus', 'HPV', 'Human Papillomavirus', 'Sexual contact, skin contact', 'Genital warts, cervical and other cancers'),
  (9, 'Herpes Simplex Virus', 'HSV', 'Herpes Simplex Virus', 'Direct contact, sexual contact', 'Oral and genital herpes infections'),
  (10, 'Human T-Cell Lymphotropic Virus', 'HTLV', 'Human T-Cell Lymphotropic Virus', 'Blood, sexual contact, breastfeeding', 'Adult T-cell leukemia/lymphoma, neurological disease'),
  (11, 'Measles Virus', 'Measles', 'Measles Virus (Rubeola)', 'Airborne', 'Highly contagious viral infection, vaccine-preventable'),
  (12, 'Mumps Virus', 'Mumps', 'Mumps Virus', 'Airborne, saliva', 'Parotid gland swelling, vaccine-preventable'),
  (13, 'Neisseria gonorrhoeae', 'NG', 'Neisseria gonorrhoeae', 'Sexual contact', 'Gonorrhea, sexually transmitted infection'),
  (14, 'Parvovirus B19', 'Parvo B19', 'Parvovirus B19', 'Respiratory droplets', 'Fifth disease in children, complications in pregnancy'),
  (15, 'Rubella Virus', 'Rubella', 'Rubella Virus', 'Airborne', 'German measles, congenital rubella syndrome'),
  (16, 'SARS-CoV-2', 'SARS-CoV-2', 'Severe Acute Respiratory Syndrome Coronavirus 2', 'Airborne, respiratory droplets', 'COVID-19 pandemic respiratory illness'),
  (17, 'Treponema pallidum', 'Syphilis', 'Treponema pallidum', 'Sexual contact', 'Syphilis, multi-stage sexually transmitted infection'),
  (18, 'Toxoplasma gondii', 'Toxoplasma', 'Toxoplasma gondii', 'Cat feces, undercooked meat', 'Toxoplasmosis, serious in immunocompromised and pregnancy'),
  (19, 'Varicella-Zoster Virus', 'VZV', 'Varicella-Zoster Virus', 'Airborne, direct contact', 'Chickenpox and shingles')
ON CONFLICT (name) DO UPDATE SET
  abbreviation = EXCLUDED.abbreviation,
  scientific_name = EXCLUDED.scientific_name,
  transmission_route = EXCLUDED.transmission_route,
  clinical_significance = EXCLUDED.clinical_significance;

-- Verify the inserts
SELECT
  id,
  abbreviation,
  name,
  scientific_name
FROM pathogens
ORDER BY abbreviation;

COMMIT;
