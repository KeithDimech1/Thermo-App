# Supabase Storage Setup

**ERROR-021 Migration:** Supabase Storage buckets for file uploads

## Connection Configuration

✅ **Using Supabase Connection Pooler:**
- Host: `aws-1-ap-southeast-1.pooler.supabase.com`
- Port: `5432` (standard PostgreSQL)
- Benefits: IPv4 compatible, works on Vercel, handles connection limits

Both `DATABASE_URL` and `DIRECT_URL` use the pooler (direct connection is IPv6 only).

## Quick Setup

### 1. Create Storage Buckets

Run this SQL script in Supabase SQL Editor:
```bash
https://app.supabase.com/project/[your-project-id]/sql
```

Copy and execute: `scripts/supabase/create-storage-buckets.sql`

### 2. Verify Buckets Created

Check in Supabase Dashboard → Storage:
- ✅ `extractions` bucket (public)
- ✅ `datasets` bucket (public)

### 3. Test Upload (Optional)

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Test upload to extractions bucket
supabase storage upload extractions test.txt test-file-content

# Verify in dashboard
```

## Bucket Details

### `extractions` Bucket
- **Purpose:** Temporary workspace during PDF analysis/extraction
- **Structure:** `extractions/{sessionId}/{files}`
- **Lifecycle:** Temporary (can be cleaned up after load)
- **Public:** Yes (read-only, authenticated write)

**Example paths:**
```
extractions/extract-ABC123/original.pdf
extractions/extract-ABC123/text/plain-text.txt
extractions/extract-ABC123/table-index.json
extractions/extract-ABC123/extracted/table_1.csv
extractions/extract-ABC123/images/tables/table_1.png
```

### `datasets` Bucket
- **Purpose:** Final published datasets (permanent storage)
- **Structure:** `datasets/{datasetId}/{files}`
- **Lifecycle:** Permanent (linked to datasets table)
- **Public:** Yes (read-only, authenticated write)

**Example paths:**
```
datasets/14/McMillan-2024-Malawi-Rift.pdf
datasets/14/csv/table_1.csv
datasets/14/tables/table_1.png
datasets/14/fair-compliance.json
datasets/14/extraction-report.md
```

## Storage Policies

Both buckets have the following access policies:

- **Public Read:** Anyone can download files (required for serving PDFs/images)
- **Authenticated Write:** Only authenticated users can upload/update/delete
- **CORS:** Enabled for cross-origin requests

## Troubleshooting

### "Bucket already exists" error
If you see this error, the buckets are already created. Verify in dashboard.

### "Permission denied" error
Check that:
1. `SUPABASE_ANON_KEY` is set in `.env.local`
2. Storage policies are created (run SQL script again)

### Files not appearing in dashboard
1. Check bucket name matches exactly (`extractions`, `datasets`)
2. Verify file path doesn't start with `/` (use `sessionId/file.pdf`, not `/sessionId/file.pdf`)

## Migration Notes

**ERROR-021:** This setup replaces Vercel's ephemeral filesystem with persistent Supabase Storage. All uploaded files (PDFs, CSVs, images) now persist across deployments.

**Before migration:** Files stored in `public/uploads/` (ephemeral on Vercel)
**After migration:** Files stored in Supabase Storage (persistent URLs)
