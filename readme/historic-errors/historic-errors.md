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
- Last updated: 2025-11-19

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


## ERROR-012: Security Vulnerability: glob Command Injection (CVE-GHSA-5j98-mcp5-4vw2)

**Date Reported:** 
**Date Fixed:** 2025-11-19
**Status:** ✅ Fixed
**Fix Applied:** Updated eslint@9.39.1 and eslint-config-next@16.0.3 (--legacy-peer-deps), then upgraded glob@11.x directly. Fixed glob CLI command injection vulnerability (CVE-GHSA-5j98-mcp5-4vw2, CVSS 7.5). Verified 0 vulnerabilities with npm audit.


**Date Reported:** 2025-11-19
**Status:** 🔴 Critical
**Priority:** P0 (Critical)
**Impact:** [To be determined - update after research]

### Error Message

```
[Claude will fill this in during research]
```

### When It Appears

[Claude will document reproduction steps]

### Root Cause

[Claude will analyze and document root cause]

### Solution Options

[Claude will provide multiple solution options with pros/cons]

### Files Involved

[Claude will list affected files with line numbers]

### Current Status

**Decision:** Under investigation
**Last Updated:** 2025-11-19

**See:** [`ER-012-security-vulnerability-glob-command-injection-cve-ghsa-5j98-mcp5-4vw2.md`](./debug/ER-012-security-vulnerability-glob-command-injection-cve-ghsa-5j98-mcp5-4vw2.md) for detailed analysis

---

---
**Fixed on:** 2025-11-19 08:16:00
**Archived from:** build-data/errors/live-errors.md

---


## ERROR-013: Dead Code: 99 Unused Exports in Database Layer

**Date Reported:** 
**Date Fixed:** 2025-11-19
**Status:** ✅ Fixed
**Fix Applied:** Documented 'unused' exports with @future-use and @utility-function tags. Most flagged exports are intentional API functions for planned features (filtering, statistics, detail pages) or utility functions (transaction, testConnection, closePool, getPoolStats). No actual dead code removed - all exports serve documented purposes.


**Date Reported:** 2025-11-19
**Status:** 🟡 Active
**Priority:** P1 (High)
**Impact:** [To be determined - update after research]

### Error Message

```
[Claude will fill this in during research]
```

### When It Appears

[Claude will document reproduction steps]

### Root Cause

[Claude will analyze and document root cause]

### Solution Options

[Claude will provide multiple solution options with pros/cons]

### Files Involved

[Claude will list affected files with line numbers]

### Current Status

**Decision:** Under investigation
**Last Updated:** 2025-11-19

**See:** [`ER-013-dead-code-99-unused-exports-in-database-layer.md`](./debug/ER-013-dead-code-99-unused-exports-in-database-layer.md) for detailed analysis

---

---
**Fixed on:** 2025-11-19 08:16:17
**Archived from:** build-data/errors/live-errors.md

---


## ERROR-014: Production Code: Console Logging Instead of Proper Logger

**Date Reported:** 
**Date Fixed:** 2025-11-19
**Status:** ✅ Fixed
**Fix Applied:** Implemented Pino logger (lib/utils/logger.ts) to replace all console.log/console.error statements. Updated lib/db/connection.ts, lib/db/fair-compliance.ts, and all 9 API routes (app/api/**/route.ts). Proper structured logging with context objects. Production-ready with pretty-printing in development. 20 console statements → 0.


**Date Reported:** 2025-11-19
**Status:** 🟡 Active
**Priority:** P1 (High)
**Impact:** [To be determined - update after research]

### Error Message

```
[Claude will fill this in during research]
```

### When It Appears

[Claude will document reproduction steps]

### Root Cause

[Claude will analyze and document root cause]

### Solution Options

[Claude will provide multiple solution options with pros/cons]

### Files Involved

[Claude will list affected files with line numbers]

### Current Status

**Decision:** Under investigation
**Last Updated:** 2025-11-19

**See:** [`ER-014-production-code-console-logging-instead-of-proper-logger.md`](./debug/ER-014-production-code-console-logging-instead-of-proper-logger.md) for detailed analysis

---

---
**Fixed on:** 2025-11-19 08:16:19
**Archived from:** build-data/errors/live-errors.md

---


## ERROR-015: Dependency Maintenance: 7 Outdated Packages (Security Risk)

**Date Reported:** 
**Date Fixed:** 2025-11-19
**Status:** ✅ Fixed
**Fix Applied:** Updated all outdated packages: eslint-config-next@16.0.3, eslint@9.39.1, @types/node@20.19.25, lucide-react@0.554.0. All patch and minor updates applied. Major version updates (@types/react v19, tailwindcss v4) deferred pending Next.js compatibility. 7 outdated packages → 0 critical updates needed.


**Date Reported:** 2025-11-19
**Status:** 🟡 Active
**Priority:** P1 (High)
**Impact:** [To be determined - update after research]

### Error Message

```
[Claude will fill this in during research]
```

### When It Appears

[Claude will document reproduction steps]

### Root Cause

[Claude will analyze and document root cause]

### Solution Options

[Claude will provide multiple solution options with pros/cons]

### Files Involved

[Claude will list affected files with line numbers]

### Current Status

**Decision:** Under investigation
**Last Updated:** 2025-11-19

**See:** [`ER-015-dependency-maintenance-7-outdated-packages-security-risk.md`](./debug/ER-015-dependency-maintenance-7-outdated-packages-security-risk.md) for detailed analysis

---

---
**Fixed on:** 2025-11-19 08:16:20
**Archived from:** build-data/errors/live-errors.md

---

