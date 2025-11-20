
---

## 🔍 Code Quality Issues

**Last Check:** 2025-11-18 17:31:44
**Found by:** `/bigtidycheck`

### 🔴 Critical Issues

1. **TypeScript: Doubled Type Name** → **Needs Fix**
   - **File:** `app/samples/[id]/page.tsx:261`
   - **Issue:** `EarthBankEarthBankHeDatapoint` should be `EarthBankHeDatapoint`
   - **Impact:** TypeScript compilation error
   - **Suggested Fix:**
     ```typescript
     // Line 261, change:
     {heDatapoints.map((datapoint: EarthBankEarthBankHeDatapoint, idx: number) => {
     // To:
     {heDatapoints.map((datapoint: EarthBankHeDatapoint, idx: number) => {
     ```
   - **Status:** 🔴 Open
   - **Priority:** P0 (Blocks build)

### 🟡 Medium Issues

2. **Unused Import: EarthBankHeDatapoint**
   - **File:** `app/samples/[id]/page.tsx:4`
   - **Issue:** Imported but never used (after fixing issue #1 above, this will be used)
   - **Impact:** Minor - will resolve when #1 is fixed
   - **Status:** 🟡 Will resolve with #1

---

**Migration Context:** This file is part of IDEA-014 migration (Phase 5.4 - completed).
Other TypeScript errors about missing fields (`nAFTGrains`, `nAHeGrains`) are known and documented in Phase 6.2.

**To resolve:** Fix issue #1, then run `/bigtidycheck` again to verify.
