# Database ERD - Available Formats

**Multiple professional diagram formats for the AusGeochem Thermochronology Database.**

---

## ✅ Recommended: Mermaid Diagrams (Best Quality)

**Generated with:** Mermaid CLI (professional diagramming tool)

### Files
- 🖼️ **PNG:** `database-erd-mermaid.png` (2384×1528 px, 446 KB)
- 📐 **SVG:** `database-erd-mermaid.svg` (scalable vector, 471 KB)
- 📝 **Source:** `database-erd.mmd` (Mermaid markup)

**Advantages:**
- ✅ Clean, professional appearance
- ✅ Proper entity relationship diagram format
- ✅ All 16 tables with complete fields
- ✅ Clear relationship lines
- ✅ Color-coded by category
- ✅ Readable labels and cardinality

**Use these for:**
- Documentation
- Presentations
- Technical references
- Sharing with team

**Preview:** Open `database-erd-mermaid.png` or `database-erd-mermaid.svg`

---

## 📊 Alternative Format: DBML (dbdiagram.io)

**Generated with:** DBML (Database Markup Language)

### Files
- 📝 **Source:** `schema.dbml` (complete database definition)

**How to use:**
1. Visit https://dbdiagram.io/
2. Click "Go to App"
3. Paste contents of `schema.dbml`
4. Export as PNG, SVG, or PDF

**Advantages:**
- ✅ Interactive web-based diagram
- ✅ Zoom and pan
- ✅ Export in multiple formats
- ✅ Share live link with collaborators
- ✅ Automatically layouts relationships

**Use this for:**
- Interactive exploration
- Collaboration (share link)
- Custom styling and layout

---

## 🎨 Alternative Format: PlantUML

**Generated with:** PlantUML syntax

### Files
- 📝 **Source:** `schema.puml` (PlantUML class diagram)

**How to use:**
1. Visit https://www.plantuml.com/plantuml/uml/
2. Paste contents of `schema.puml`
3. View diagram online
4. Export as PNG or SVG

**Or use local PlantUML:**
```bash
# If you have PlantUML installed
plantuml schema.puml
# Generates schema.png
```

**Advantages:**
- ✅ Package/namespace organization
- ✅ Detailed field annotations
- ✅ Notes and legends
- ✅ Color-coded packages

**Use this for:**
- Detailed technical documentation
- UML-style diagrams
- Software architecture docs

---

## 📋 Format Comparison

| Format | Tool | File Size | Best For |
|--------|------|-----------|----------|
| **Mermaid PNG** ✅ | Mermaid CLI | 446 KB | Documentation, presentations |
| **Mermaid SVG** ✅ | Mermaid CLI | 471 KB | Web, infinite zoom |
| **DBML** | dbdiagram.io | 16 KB | Interactive, collaboration |
| **PlantUML** | PlantUML | 13 KB | UML diagrams, software docs |

---

## 📁 All Available Files

```
readme/database/
├── database-erd-mermaid.png    ✅ RECOMMENDED (446 KB)
├── database-erd-mermaid.svg    ✅ RECOMMENDED (471 KB)
├── database-erd.mmd            (Source: Mermaid)
├── schema.dbml                 (Source: DBML)
├── schema.puml                 (Source: PlantUML)
├── DATABASE_ERD.md             (Markdown with embedded Mermaid)
├── ERD_SIMPLE.md               (Quick reference guide)
├── VISUAL_GUIDE.md             (Visual explanations)
└── README.md                   (Index)
```

---

## 🎯 Which Format Should I Use?

### For Quick Viewing
**Use:** `database-erd-mermaid.png`
- Just open and view
- No special tools needed
- High quality

### For Web/Documentation
**Use:** `database-erd-mermaid.svg`
- Scales infinitely without blur
- Smaller file size than PNG
- Perfect for GitHub/web

### For Interactive Exploration
**Use:** `schema.dbml` on dbdiagram.io
- Pan and zoom
- Click to highlight relationships
- Share live link with team

### For Custom Layouts
**Use:** `schema.puml` on PlantUML
- Customize colors and styles
- Add custom notes
- Generate UML-style diagrams

---

## 🔧 Regenerating Diagrams

### Mermaid (Recommended)

```bash
cd /Users/keithdimech/Pathway/Dev/Clair/Thermo-App/readme/database

# PNG (high resolution)
mmdc -i database-erd.mmd -o database-erd-mermaid.png -w 2400 -H 3000 -b transparent

# SVG (scalable)
mmdc -i database-erd.mmd -o database-erd-mermaid.svg -b transparent

# PDF (for printing)
mmdc -i database-erd.mmd -o database-erd-mermaid.pdf -b transparent
```

### DBML

No regeneration needed - just paste into https://dbdiagram.io/

### PlantUML

```bash
# Online: https://www.plantuml.com/plantuml/uml/

# Or locally (if installed):
plantuml schema.puml
```

---

## 📝 Diagram Source Files

### database-erd.mmd (Mermaid)
- 254 lines
- All 16 tables defined
- Complete field listings
- Relationship arrows
- Can be embedded in markdown:
  ```markdown
  ```mermaid
  erDiagram
    ...
  ```
  ```

### schema.dbml (DBML)
- Clean, readable syntax
- Table groups defined
- Indexes and constraints
- Comments and notes
- Purpose-built for database ERDs

### schema.puml (PlantUML)
- UML class diagram syntax
- Package organization
- Detailed annotations
- Legends and notes

---

## 🎨 Color Coding (All Formats)

All diagrams use consistent color coding:

| Color | Category | Tables |
|-------|----------|--------|
| 🔵 **Blue** | Core | datasets, samples |
| 🔴 **Red** | Fission-Track | ft_datapoints, ft_count_data, ft_track_length_data, ft_single_grain_ages, ft_binned_length_data |
| 🟢 **Green** | (U-Th)/He | he_datapoints, he_whole_grain_data |
| 🟡 **Yellow** | People/Roles | people, sample_people_roles, datapoint_people_roles |
| 🟣 **Purple** | QC/Batches | batches, reference_materials |
| 🟦 **Teal** | Physical | mounts, grains |

---

## 💡 Tips

### Viewing Large Diagrams
- **PNG:** Use image viewer, zoom in/out
- **SVG:** Open in browser, infinitely zoomable
- **Web tools:** Use zoom and pan features

### Sharing with Team
1. **Quick share:** Send PNG via email/Slack
2. **Collaborative:** Share dbdiagram.io link
3. **Documentation:** Embed SVG in docs
4. **Print:** Use PDF (if generated)

### Customization
- **Mermaid:** Edit `.mmd` file, regenerate
- **DBML:** Edit `.dbml`, re-paste to dbdiagram.io
- **PlantUML:** Edit `.puml`, regenerate

---

## 🔗 External Resources

- **Mermaid:** https://mermaid.js.org/
- **dbdiagram.io:** https://dbdiagram.io/
- **PlantUML:** https://plantuml.com/
- **DBML Docs:** https://dbml.dbdiagram.io/docs/

---

**Last Updated:** 2025-11-18
**Schema Version:** 2.0.0 (EarthBank-compatible)
**Total Formats:** 3 (Mermaid, DBML, PlantUML)
