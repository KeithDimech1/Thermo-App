# AusGeochem Thermochronology Database

**A Next.js application for geological sample dating data**

[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black)](https://nextjs.org/)
[![Code Quality](https://img.shields.io/badge/Code%20Quality-Excellent-brightgreen)](readme/code-quality/bigtidycheck-2025-11-16-2.md)
[![Type Safety](https://img.shields.io/badge/Type%20Safety-100%25-success)](readme/code-quality/bigtidycheck-2025-11-16-2.md)

A comprehensive database and visualization platform for fission-track and (U-Th)/He thermochronology data, following FAIR data principles (Kohn et al. 2024, GSA Bulletin).

**Live Demo:** [https://thermo-app.vercel.app](https://thermo-app.vercel.app)

---

## 🎯 What is Thermochronology?

**Thermochronology** = Dating geological samples using radioactive decay and thermal history

This application manages and visualizes two key dating methods:
- **Fission-Track (AFT)** - Tracks from uranium-238 fission in minerals (apatite, zircon)
- **(U-Th)/He** - Helium retention in minerals, revealing when rocks cooled below ~110°C

**Use Cases:**
- Mountain building and erosion studies
- Landscape evolution research
- Oil and gas thermal maturity
- Orogenic belt analysis

---

## ✨ Features

### 📊 Data Management
- **8 Database Tables** - Datasets, samples, ages, counts, track lengths, grain data
- **FAIR Compliance** - Following Kohn et al. (2024) geoscience data standards
- **2 Pre-Aggregated Views** - Optimized queries for common data patterns
- **IGSN Support** - International Geo Sample Numbers for global sample tracking

### 🔬 Analysis Tools
- **Sample Browser** - Filter by location, mineral type, age range
- **Dataset Explorer** - Browse by publication, author, study area
- **Interactive Tables** - Sort, filter, export data to CSV/JSON/Excel
- **Data Visualization** - Age plots, histograms, statistical summaries

### 📄 PDF Extraction Engine
- **Universal Table Extractor** - Multi-method extraction (text, camelot, pdfplumber)
- **Smart Classification** - Auto-detects AFT, AHe, counts, length tables
- **FAIR Transformation** - Converts publication tables to database schema
- **90%+ Success Rate** - Bulletproof text-based extraction with progressive fallback
- **Cache System** - 20-30x speedup on re-runs

### 🛠️ Database Tools
- **Schema Management** - Export, backup, restore utilities
- **Import Scripts** - Load data from CSV, PDF, Excel
- **Quality Validation** - Domain-specific validators for each data type
- **Clear Database** - Safe database clearing (preserves schema)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (LTS recommended)
- PostgreSQL database (we use [Neon](https://neon.tech) serverless)
- Python 3.9+ (for PDF extraction features)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd Thermo-App

# Install Node.js dependencies
npm install

# Install Python dependencies (for PDF extraction)
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Configure environment
cp .env.local.example .env.local
# Edit .env.local with your database connection strings
```

### Database Setup

```bash
# Create database schema
npm run db:schema

# Import sample data (optional)
npm run db:import

# Verify connection
npm run db:test
```

### Development

```bash
# Start development server
npm run dev

# Open http://localhost:3000
```

### Build & Deploy

```bash
# Production build
npm run build

# Deploy to Vercel
vercel --prod
```

---

## 📁 Project Structure

```
Thermo-App/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes (samples, datasets, tables)
│   ├── datasets/                 # Dataset pages
│   ├── samples/                  # Sample detail pages
│   └── tables/                   # Interactive table viewer
├── components/                   # React components
│   ├── datasets/                 # Dataset cards, download sections
│   ├── tables/                   # Interactive tables, export buttons
│   └── ui/                       # Reusable UI components
├── lib/                          # Business logic
│   ├── db/                       # Database layer (connection, queries)
│   └── types/                    # TypeScript type definitions
├── scripts/                      # Utilities and data processing
│   ├── db/                       # Database management scripts
│   └── pdf/                      # PDF extraction engine
├── readme/                       # Living documentation
│   ├── database/                 # Schema docs, table docs
│   └── code-quality/             # Quality reports
├── output/                       # Data exports and extraction reports
└── build-data/                   # Development artifacts
    ├── errors/                   # Error tracking
    └── ideas/                    # Feature ideas and implementation logs
```

---

## 🗄️ Database Schema

### Core Tables (6)
- `datasets` - Data packages with privacy controls, DOI, FAIR scores
- `samples` - Geological samples with IGSN, location, lithology
- `ft_ages` - Pooled/central age determinations
- `ft_counts` - Grain-by-grain spontaneous/induced track counts
- `ft_track_lengths` - Individual confined track length measurements
- `ahe_grain_data` - Single grain (U-Th)/He ages with chemistry

### Pre-Aggregated Views (2)
- `vw_aft_complete` - Complete AFT data (samples + ages + counts + lengths)
- `vw_sample_summary` - Sample-level statistics and grain counts

**Full Schema Documentation:** See [readme/database/](readme/database/)

---

## 🔧 Technology Stack

**Frontend:**
- [Next.js 14](https://nextjs.org/) - React framework with App Router
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [TanStack Table](https://tanstack.com/table) - Powerful table component

**Backend:**
- [PostgreSQL](https://www.postgresql.org/) - Relational database
- [Neon](https://neon.tech) - Serverless PostgreSQL hosting
- [Node.js](https://nodejs.org/) - JavaScript runtime

**Data Processing:**
- [Python 3.9+](https://www.python.org/) - PDF extraction and data processing
- [pdfplumber](https://github.com/jsvine/pdfplumber) - PDF table extraction
- [Camelot](https://camelot-py.readthedocs.io/) - Advanced table detection
- [pandas](https://pandas.pydata.org/) - Data manipulation

**Deployment:**
- [Vercel](https://vercel.com/) - Production hosting
- [GitHub](https://github.com/) - Version control

---

## 📊 Code Quality

**Last Check:** 2025-11-16 23:25

| Metric | Status |
|--------|--------|
| TypeScript Compilation | ✅ 100% Clean |
| Type Safety | ✅ 100% |
| Security Vulnerabilities | ✅ 0 Found |
| Build Status | ✅ Passing |
| Code Coverage | ⭐⭐⭐⭐⭐ Excellent |

**Recent Improvements (2025-11-16):**
- ✅ Fixed all TypeScript null safety issues (45 errors → 0)
- ✅ Added explicit type annotations
- ✅ Verified production build
- ✅ Updated code quality documentation

**Full Quality Report:** [readme/code-quality/bigtidycheck-2025-11-16-2.md](readme/code-quality/bigtidycheck-2025-11-16-2.md)

---

## 📖 Documentation

**Start Here:** [readme/INDEX.md](readme/INDEX.md)

**Key Documentation:**
- [Database Schema](readme/database/) - Complete schema documentation
- [API Routes](readme/app/api/) - API endpoint documentation
- [Code Quality](readme/code-quality/) - Quality reports and analysis
- [Change Log](readme/CHANGES.md) - Documentation updates
- [Project Index](PROJECT_INDEX.json) - Architectural snapshot

---

## 🛠️ Available Scripts

### Development
```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server
```

### Database
```bash
npm run db:test      # Test database connection
npm run db:schema    # Create database schema
npm run db:import    # Import sample data
```

### Code Quality
```bash
npx tsc --noEmit     # TypeScript type checking
npm run lint         # ESLint (if configured)
```

### Utilities
```bash
# Export current schema
npx tsx scripts/db/export-schema.ts

# Clear database (preserves schema)
npx tsx scripts/db/clear-database.ts

# Backup database
./scripts/db/backup-database.sh

# Restore from backup
./scripts/db/restore-database.sh <backup-file>
```

---

## 🤝 Contributing

This is a research project for thermochronology data management. Contributions welcome!

**Before contributing:**
1. Read [.claude/CLAUDE.md](.claude/CLAUDE.md) - Project architecture
2. Check [readme/INDEX.md](readme/INDEX.md) - Living documentation
3. Run code quality check: `/bigtidycheck`
4. Ensure TypeScript compiles: `npx tsc --noEmit`

---

## 📚 References

**FAIR Data Principles:**
- Kohn et al. (2024) "Best practices for data reporting in thermochronology" - GSA Bulletin v.136, p.3891-3920
- [Full ERD Specification](build-data/assets/schemas/AusGeochem_ERD.md)

**Thermochronology Background:**
- Fission-Track Dating Methodology
- (U-Th)/He Thermochronometry
- Thermal History Modeling

---

## 📄 License

See LICENSE file for details.

---

## 🙏 Acknowledgments

- **FAIR Data Standards:** Kohn et al. (2024)
- **Claude Code:** AI-assisted development and documentation
- **Open Source Community:** Next.js, PostgreSQL, Python ecosystem

---

## 📞 Support

- **Documentation:** [readme/INDEX.md](readme/INDEX.md)
- **Issues:** GitHub Issues
- **Live Demo:** [https://thermo-app.vercel.app](https://thermo-app.vercel.app)

---

**Built with ❤️ for the geoscience community**

*Last Updated: 2025-11-16*
