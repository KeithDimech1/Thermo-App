# Table: `categories`

**Purpose:** Top-level disease classification for organizing pathogens
**Last Schema Update:** 2025-11-11
**Estimated Row Count:** ~10-15 categories
**Growth Rate:** Stable (well-established disease categories)

---

## Purpose

Simple lookup table for **disease categories** that group related pathogens. Provides the highest level of organization in the pathogen hierarchy:

```
categories → pathogens → markers
```

---

## Schema (Bones)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | integer | PK, AUTO | Unique identifier |
| `name` | varchar(100) | NOT NULL, UNIQUE | Category name |
| `description` | text | NULL | Detailed description of category |
| `created_at` | timestamp | DEFAULT now() | When record was created |

---

## Relationships

### No Parents
Top-level reference table.

### Referenced By (Children)
- **`pathogens.category_id`** → `categories.id`
- **`markers.category_id`** → `categories.id`

---

## Example Data

| Category Name | Description | Example Pathogens |
|---------------|-------------|-------------------|
| Hepatitis Viruses | Liver-affecting viral infections | HBV, HCV, HDV, HEV |
| Retroviruses | RNA viruses using reverse transcriptase | HIV-1, HIV-2, HTLV |
| TORCH Panel | Congenital infection screening | Toxoplasma, Rubella, CMV, HSV |
| Blood-Borne Pathogens | Infections transmitted through blood | HIV, HBV, HCV |
| Herpesviruses | DNA viruses of Herpesviridae family | CMV, EBV, HSV-1, HSV-2, VZV |
| Parasites | Protozoan and helminth infections | Toxoplasma, Trypanosoma |
| Respiratory Viruses | Airborne viral infections | Influenza, RSV, SARS-CoV-2 |

---

## Used By (Code Files)

### Database Queries
- `lib/db/queries.ts`:
  - `getMarkersByCategory()` - Group markers by disease category

### UI Components
- `components/filters/FilterPanel.tsx` - Category filter dropdown

---

## Common Query Patterns

### Get all categories with marker counts
```sql
SELECT
  c.*,
  COUNT(DISTINCT m.id) as marker_count
FROM categories c
LEFT JOIN markers m ON c.id = m.category_id
GROUP BY c.id
ORDER BY c.name;
```

### Get category with pathogens and markers
```sql
SELECT
  c.name as category,
  p.name as pathogen,
  m.name as marker
FROM categories c
JOIN pathogens p ON c.id = p.category_id
JOIN markers m ON p.id = m.pathogen_id
WHERE c.id = $1
ORDER BY p.name, m.name;
```

---

## Related Tables

- **[pathogens](pathogens.md)** - Child table
- **[markers](markers.md)** - Grandchild table

---

**Generated:** 2025-11-11
**Schema Version:** 1.0.0
