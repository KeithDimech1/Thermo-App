# Historic Errors Log

**Purpose:** This document preserves the complete history of all errors that have been fixed and resolved.

**How It Works:**
- When errors are fixed and removed from `build-data/errors/live-errors.md`, they are archived here
- All errors are preserved in sequential order (ERROR-001, ERROR-002, etc.)
- Never delete entries - this is the permanent record
- Git history provides timeline of when errors were fixed
- Individual error files moved to `readme/historic-errors/archived-errors/`

**Quick Stats:**
- Total errors resolved: 
- Last updated: 2025-11-17

---

## Archive Table of Contents

| ID | Error | Fix Date | Solution Applied |
|----|-------|----------|------------------|
| [ERROR-011](#error-011-error-title-not-found) | [Error title not found] | 2025-11-17 | Fixed API route with schema v2 migration |
---

<!-- Archived errors are added below this line in sequential order -->

## ERROR-011: [Error title not found]

**Date Reported:** 
**Date Fixed:** 2025-11-17
**Status:** ✅ Fixed
**Fix Applied:** Fixed API route with schema v2 migration



---
**Fixed on:** 2025-11-17 12:46:24
**Archived from:** build-data/errors/live-errors.md

---


## ERROR-009: Security - xlsx library vulnerabilities (Prototype Pollution + ReDoS)

**Date Reported:** 
**Date Fixed:** 2025-11-17
**Status:** ✅ Fixed
**Fix Applied:** Migrated to ExcelJS (replaced xlsx with exceljs@4.4.0)


**Date Reported:** 2025-11-17 (Found by `/bigtidycheck`)
**Status:** 🔴 Critical - Security Risk
**Priority:** P0 (Critical)
**Impact:** High-severity security vulnerabilities in Excel processing library

### Vulnerabilities Found

**1. Prototype Pollution (GHSA-4r6h-8v6p-xvw6)**
- CVSS Score: 7.8 (HIGH)
- CWE-1321: Improperly Controlled Modification of Object Prototype Attributes
- Affects: xlsx <0.19.3
- Attack Vector: Local (malicious Excel file)

**2. Regular Expression Denial of Service (GHSA-5pgg-2g8v-p4x9)**
- CVSS Score: 7.5 (HIGH)
- CWE-1333: Inefficient Regular Expression Complexity
- Affects: xlsx <0.20.2
- Attack Vector: Network (malicious Excel file via network)

### Files Affected

1. `scripts/db/import-earthbank-templates.ts` - Main import pipeline
2. `scripts/db/examine-earthbank-templates.ts` - Template analysis utility

### Impact

Security vulnerability when processing EarthBank Excel templates. Could allow malicious Excel files to modify JavaScript object prototypes or cause denial of service.

### Solution Options

**Option 1: Upgrade xlsx library** ✅ RECOMMENDED
```bash
npm install xlsx@latest
npm audit
```

**See:** [`readme/code-quality/dependencies.md`](../../readme/code-quality/dependencies.md)

---

---
**Fixed on:** 2025-11-17 12:50:14
**Archived from:** build-data/errors/live-errors.md

---

