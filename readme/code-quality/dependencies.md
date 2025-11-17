# Dependencies - Code Quality Issues

**Last Check:** 2025-11-17
**Found by:** `/bigtidycheck`

---

## 🔴 Critical Issues

### 1. **Security: xlsx library vulnerabilities** → **ERROR-009**
- **Package:** `xlsx`
- **Status:** 🔴 Open → Logged
- **Severity:** HIGH (CVSS 7.8, 7.5)

**Vulnerabilities:**
1. **Prototype Pollution** (GHSA-4r6h-8v6p-xvw6)
   - CVSS Score: 7.8
   - Affects: xlsx <0.19.3
   - CWE-1321: Improperly Controlled Modification of Object Prototype Attributes

2. **Regular Expression Denial of Service** (GHSA-5pgg-2g8v-p4x9)
   - CVSS Score: 7.5
   - Affects: xlsx <0.20.2
   - CWE-1333: Inefficient Regular Expression Complexity

**Files Affected:**
- `scripts/db/import-earthbank-templates.ts` - Excel template import
- `scripts/db/examine-earthbank-templates.ts` - Template analysis

**Impact:**
- Security vulnerability when processing Excel files
- Could allow malicious Excel files to execute code or cause DoS

**Suggested Fixes:**
1. **Upgrade to xlsx@0.20.2 or later:**
   ```bash
   npm install xlsx@latest
   ```

2. **Alternative: Switch to safer library:**
   - Consider `exceljs` (more actively maintained)
   - Or `xlsx-populate` (simpler API)

3. **Mitigation (if upgrade not possible):**
   - Validate Excel files before processing
   - Limit file size and complexity
   - Run import scripts in sandboxed environment

**Debug Log:** `build-data/errors/debug/ER-009-security-xlsx-library-vulnerabilities.md`
**Track:** Use `/debug-mode` to fix, `/resolve ERROR-009` when done

---

## 🔵 Small Issues

### 1. **Unused Dev Dependencies (5)**
- **Status:** 🔵 Tracked

**Packages flagged by depcheck:**
- `@types/react-dom` - Likely false positive (Next.js uses this)
- `autoprefixer` - Likely false positive (PostCSS uses this)
- `eslint` - Likely false positive (Next.js uses this)
- `eslint-config-next` - Likely false positive (Next.js config)
- `postcss` - Likely false positive (Tailwind CSS uses this)

**Issue:** depcheck reports these as unused, but they are dependencies of Next.js/Tailwind

**Impact:** Minimal - these are dev dependencies

**Suggested Fix:**
- No action needed - these are indirect dependencies
- depcheck has known false positives for Next.js projects

---

**To resolve an issue:**
1. Fix the code or upgrade the package
2. Run `/bigtidycheck` again to verify
3. Update status to ✅ Fixed
4. If logged as ERROR-XXX, run `/resolve ERROR-XXX`
