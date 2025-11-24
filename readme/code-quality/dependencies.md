# Code Quality: Dependencies & Security

**Last Check:** 2025-11-24 09:30:00
**Found by:** `/bigtidycheck`

---

## 🔍 Code Quality Issues

### 🔴 Critical Issues

1. **Security: xlsx dependency has 2 HIGH severity vulnerabilities** → **ERROR-016**
   - **Package:** `xlsx@*` (all versions currently used)
   - **Status:** ⚠️ No fix available
   - **CVEs:**
     - **GHSA-4r6h-8v6p-xvw6** - Prototype Pollution in sheetJS
       - Severity: HIGH (CVSS 7.8)
       - Vector: CVSS:3.1/AV:L/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:H
       - Requires: <0.19.3
     - **GHSA-5pgg-2g8v-p4x9** - Regular Expression Denial of Service (ReDoS)
       - Severity: HIGH (CVSS 7.5)
       - Vector: CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H
       - Requires: <0.20.2
   - **Impact:** Security risks when processing uploaded Excel files
   - **Affected Files:**
     - `scripts/convert-mcmillan-to-earthbank-v2.js` - Data conversion scripts
     - `scripts/convert-mcmillan-to-earthbank.js`
     - `scripts/import-mcmillan-2024-complete.ts` - Import workflows
     - `scripts/inspect-earthbank-mappings.js`
     - `scripts/inspect-mcmillan-supplementary.js`
   - **Suggested Fix:**
     - **Option 1:** Switch to `exceljs` (already installed, secure alternative)
     - **Option 2:** Wait for xlsx maintainers to release patched version
     - **Option 3:** Implement strict input validation before processing xlsx files
   - **Mitigation (current):**
     - Only process trusted files (uploaded by authenticated users)
     - Validate file structure before parsing
     - Run import scripts in controlled environment (not user-facing)
   - **Status:** 🔴 Open → Logged
   - **Debug Log:** `build-data/errors/debug/ER-016-xlsx-security-vulnerabilities.md`
   - **Track:** Use `/debug-mode` to fix, `/resolve ERROR-016` when done

### 🟡 Medium Issues

1. **Unused Dependencies: 5 packages not actively imported**
   - **Packages:**
     - `@types/formidable` - Type definitions (may be phantom import)
     - `formidable` - File upload library (potentially replaced)
     - `glob` - File pattern matching (replaced by built-in features?)
     - `pdf-parse` - PDF text extraction (may be used in scripts)
     - `pino-pretty` - Log formatter (dev-only usage)
   - **Impact:**
     - Bloated node_modules (~50MB+ extra)
     - Slower npm install
     - Increased security surface area
     - Confusing dependency tree
   - **Suggested Fix:**
     1. Verify none are used: `grep -r "require.*formidable\|import.*formidable" app/ lib/ scripts/`
     2. If truly unused: `npm uninstall @types/formidable formidable glob pdf-parse pino-pretty`
     3. Re-test build and imports
   - **Note:** May have been used during development/prototyping
   - **Status:** 🟡 Open

2. **Unused Dev Dependencies: 5 packages flagged**
   - **Packages:**
     - `@types/react-dom` - May be phantom (Next.js provides)
     - `autoprefixer` - Likely used by Tailwind (indirect)
     - `eslint` - Not configured (see below)
     - `eslint-config-next` - Not configured
     - `postcss` - Used by Tailwind (indirect)
   - **Impact:** Similar to above but dev-only
   - **Suggested Fix:**
     - Check if Tailwind requires `autoprefixer` and `postcss` (likely YES, keep them)
     - Configure ESLint or remove if not using
     - Verify `@types/react-dom` usage
   - **Status:** 🟡 Open

### 🔵 Small Issues

1. **ESLint Not Configured**
   - **Error:** `ESLint couldn't find an eslint.config.(js|mjs|cjs) file`
   - **Current:** ESLint v9.39.1 installed but no config
   - **Impact:** No automated code quality checks
   - **Suggested Fix:**
     - **Option 1:** Configure ESLint 9 with new flat config format
     - **Option 2:** Use `.eslintrc.*` with migration guide
     - **Option 3:** Remove ESLint if not using
   - **Status:** 🔵 Tracked

2. **TypeScript Config: Invalid JSON**
   - **File:** `tsconfig.json:29`
   - **Error:** `Expected property name or '}' in JSON at position 29`
   - **Impact:** depcheck cannot parse tsconfig.json
   - **Likely Cause:** JSON comments (not allowed by strict parsers)
   - **Suggested Fix:** Remove comments or use jsonc parser
   - **Status:** 🔵 Tracked

---

## Dependency Summary

**Total Production Dependencies:** 232
**Total Dev Dependencies:** 401
**Total Optional:** 109

**Security Alerts:** 1 package, 2 vulnerabilities (both HIGH)

---

**To resolve an issue:**
1. Fix the dependency/config
2. Run `/bigtidycheck` again to verify
3. Update status to ✅ Fixed
4. If logged as ERROR-XXX, run `/resolve ERROR-XXX`
