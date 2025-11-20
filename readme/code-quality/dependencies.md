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
# Dependencies Code Quality

**Last Check:** 2025-11-18 17:31:44
**Found by:** `/bigtidycheck`

---

## 🔴 Critical Issues

### 1. **Security: HIGH Severity glob Vulnerability**

- **Package:** `glob` (via dependency chain)
- **CVE:** GHSA-5j98-mcp5-4vw2
- **Severity:** HIGH (CVSS 7.5)
- **Vulnerability:** Command injection via -c/--cmd
- **Affected:** glob versions >=10.3.7 <=11.0.3
- **Via Chain:** @next/eslint-plugin-next → eslint-config-next → glob
- **Impact:** Dev dependencies only (not production runtime)
- **Risk:** Development environment command injection (CLI usage only)
- **Fix Attempted:** 2025-11-18
  - `npm audit fix` and `npm audit fix --force` both failed to resolve
  - Updating eslint-config-next@16 requires eslint@9 (breaking change from v8)
  - Would require major ESLint upgrade during critical migration phase
- **Decision:**
  - **Accepted Risk** - Defer fix to Phase 8 (post-migration)
  - Low practical risk: dev-only, CLI-specific vulnerability
  - Attack surface limited to -c/--cmd flag usage
  - Not exploitable in production runtime
- **Status:** 🟡 Deferred to Phase 8
- **Priority:** P2 (Medium - will fix post-migration)

---

## 🟡 Medium Issues

### 2. **Unused Dev Dependencies**

**Flagged by depcheck:**
- `eslint`
- `eslint-config-next`
- `autoprefixer`
- `postcss`
- `@types/react-dom`

**Analysis:**
- **eslint, eslint-config-next:** May be unused if not running eslint
- **autoprefixer, postcss:** Likely used by Tailwind CSS (keep)
- **@types/react-dom:** Likely needed for TypeScript (keep)

**Suggested Fix:**
```bash
# Only remove if truly unused:
npm uninstall eslint eslint-config-next

# Keep the others (used indirectly):
# - autoprefixer (Tailwind)
# - postcss (Tailwind)
# - @types/react-dom (TypeScript)
```

**Status:** 🟡 Open
**Priority:** P3 (Low - minor cleanup)

---

## Recommendations

1. **Immediate:** Run `npm audit fix` to update glob vulnerability
2. **Phase 6.4:** Audit eslint usage, remove if not configured
3. **Phase 8:** Review all dependencies after migration complete

---

**Last npm audit:** 2025-11-18
**Next check:** After dependency updates or before production deploy
