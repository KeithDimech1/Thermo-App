# Code Quality: Code Style & TypeScript

**Last Check:** 2025-11-24 09:30:00
**Found by:** `/bigtidycheck`

---

## 🔍 Code Quality Issues

### 🟡 Medium Issues

1. **TypeScript: Excessive use of `any` type (30+ instances)**
   - **Primary File:** `app/api/datasets/[id]/fair/analyze/route.ts`
   - **Count:** 30+ occurrences
   - **Examples:**
     - Line 61: `const dataset = await queryOne<any>(...)`
     - Line 74: `const dataFiles = await query<any>(...)`
     - Line 84: `const csvFiles = dataFiles.filter((f: any) => ...)`
     - Line 108: `let paperMetadata: any = {};`
     - Line 304: `} catch (error: any) {`
     - Line 381-382: `function(...metadata: any, files: any[]) {`
   - **Impact:**
     - Loss of type safety (defeats purpose of TypeScript)
     - Potential runtime errors from accessing non-existent properties
     - Harder to refactor code
     - No IDE autocomplete support
   - **Suggested Fix:**
     - Define proper interfaces in `lib/types/thermo-data.ts`
     - Example:
       ```typescript
       interface DataFile {
         id: string;
         file_name: string;
         file_type: string;
         file_path: string;
       }
       
       interface PaperMetadata {
         title: string;
         authors: string[];
         doi?: string;
         year?: number;
       }
       
       const dataFiles = await query<DataFile>(...)
       const paperMetadata: PaperMetadata = {};
       ```
   - **Other Affected Files:**
     - `app/datasets/[id]/page.tsx:27` - `parsePostgresArray(val: any)`
     - `app/api/tables/[name]/route.ts:104` - `queryParams: any[]`
     - `app/api/analysis/ages/route.ts:39,56` - Various `any` types
   - **Status:** 🟡 Open

2. **Dead Code: Old route file should be removed**
   - **File:** `app/api/extraction/[sessionId]/extract/route.OLD.ts`
   - **Size:** ~450 lines of obsolete extraction logic
   - **Impact:**
     - Code bloat and confusion
     - Risk of accidentally using old code
     - Wastes developer time when searching codebase
   - **Suggested Fix:**
     - Verify `route.ts` (new version) is working correctly
     - Move to git history: `git rm app/api/extraction/[sessionId]/extract/route.OLD.ts`
     - If needed for reference, it exists in git history
   - **Status:** 🟡 Open

3. **Console Statements: 16 files contain console.log in production code**
   - **Files:**
     - `app/api/datasets/[datasetId]/crop-image/route.ts`
     - `app/api/datasets/[id]/route.ts`
     - `app/api/datasets/[id]/fair/analyze/route.ts`
     - `app/api/datasets/[id]/download-all/route.ts`
     - `app/api/extraction/[sessionId]/pdf/route.ts`
     - `app/api/extraction/[sessionId]/load/route.ts`
     - `app/api/extraction/[sessionId]/route.ts`
     - `app/api/extraction/[sessionId]/analyze/route.ts`
     - `app/api/extraction/[sessionId]/extract/route.OLD.ts`
     - `app/api/extraction/[sessionId]/extract/route.ts`
     - `app/api/extraction/[sessionId]/upload-screenshot/route.ts`
     - `app/api/extraction/upload/route.ts`
     - `app/extraction/[sessionId]/analyze/page.tsx`
     - `app/extraction/[sessionId]/extract/page.tsx`
     - `lib/utils/file-upload.ts`
     - `lib/utils/logger.ts` (intentional - logger implementation)
   - **Impact:**
     - Debug output visible in production
     - Performance overhead (minimal but unnecessary)
     - Unprofessional in production logs
   - **Suggested Fix:**
     - Use structured logging from `lib/utils/logger.ts`:
       ```typescript
       // OLD:
       console.log('Processing dataset:', datasetId);
       console.error('Failed to process:', error);

       // NEW:
       import { logInfo, logError } from '@/lib/utils/logger';
       logInfo('Processing dataset', { datasetId });
       logError('Failed to process', error, { datasetId });
       ```
     - Benefits: Structured logs, severity levels, context, production-ready
   - **Status:** 🟡 Open

4. **Dead Code: 3 backup files can be removed**
   - **Files:**
     - `build-data/archive/PROJECT_INDEX.backup.json` (likely obsolete)
     - `build-data/learning/papers/McMillan(2024)-.../images/image-metadata.backup.json`
   - **Impact:** Clutter, wasted disk space, confusion
   - **Suggested Fix:**
     - Verify not actively used
     - Remove: `git rm <files>`
     - Git history preserves them if needed
   - **Status:** 🟡 Open

### 🔵 Small Issues

1. **TypeScript Suppressions: Some uses of @ts-ignore**
   - **Count:** Minimal usage detected
   - **Impact:** Hides potential type errors
   - **Suggested Fix:** Address root cause instead of suppressing
   - **Status:** 🔵 Tracked

---

**To resolve an issue:**
1. Fix the code
2. Run `/bigtidycheck` again to verify
3. Update status to ✅ Fixed
