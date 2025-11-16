# Table: `pathogens`

**Purpose:** Infectious agents (viruses, bacteria, parasites) being tested
**Last Schema Update:** 2025-11-11
**Estimated Row Count:** ~20-30 pathogens
**Growth Rate:** Slow (established pathogens)

---

## Purpose

Stores information about **specific pathogens** - the infectious agents that cause diseases. Each pathogen belongs to a disease category and can have multiple associated markers.

---

## Schema (Bones)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | integer | PK, AUTO | Unique identifier |
| `name` | varchar(100) | NOT NULL, UNIQUE(name, category_id) | Pathogen name |
| `category_id` | integer | FK → categories.id, NULL | Disease category |
| `scientific_name` | varchar(200) | NULL | Latin/scientific name |
| `description` | text | NULL | Information about pathogen |
| `transmission` | varchar(200) | NULL | How it spreads |
| `created_at` | timestamp | DEFAULT now() | When record was created |

---

## Relationships

### Foreign Keys (Parents)
- **`category_id`** → `categories.id`

### Referenced By (Children)
- **`markers.pathogen_id`** → `pathogens.id`

---

## Example Data

### Hepatitis Viruses
- HBV (Hepatitis B Virus)
- HCV (Hepatitis C Virus)
- HAV (Hepatitis A Virus)
- HDV (Hepatitis D Virus)
- HEV (Hepatitis E Virus)

### Retroviruses
- HIV-1 (Human Immunodeficiency Virus Type 1)
- HIV-2 (Human Immunodeficiency Virus Type 2)
- HTLV-I (Human T-cell Lymphotropic Virus Type I)
- HTLV-II (Human T-cell Lymphotropic Virus Type II)

### TORCH Panel Pathogens
- Toxoplasma gondii
- Rubella virus
- Cytomegalovirus (CMV)
- Herpes simplex virus (HSV-1, HSV-2)

### Herpesviruses
- CMV (Cytomegalovirus)
- EBV (Epstein-Barr Virus)
- HSV-1 (Herpes Simplex Virus Type 1)
- HSV-2 (Herpes Simplex Virus Type 2)
- VZV (Varicella-Zoster Virus)

---

## Common Query Patterns

### Get pathogens by category
```sql
SELECT p.*, c.name as category_name
FROM pathogens p
JOIN categories c ON p.category_id = c.id
WHERE p.category_id = $1
ORDER BY p.name;
```

### Get pathogen with markers
```sql
SELECT
  p.*,
  COUNT(m.id) as marker_count
FROM pathogens p
LEFT JOIN markers m ON p.id = m.pathogen_id
WHERE p.id = $1
GROUP BY p.id;
```

---

## Related Tables

- **[categories](categories.md)** - Parent table
- **[markers](markers.md)** - Child table

---

**Generated:** 2025-11-11
**Schema Version:** 1.0.0
