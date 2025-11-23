/**
 * Supabase Storage Utilities
 *
 * Provides file upload/download functions for Supabase Storage.
 * Used to replace local filesystem operations (which are ephemeral on Vercel).
 *
 * BUCKETS:
 * - extractions: Temporary extraction workspace (PDFs, CSVs, images during analysis)
 * - datasets: Final published datasets (persistent storage)
 *
 * ERROR-021: Supabase migration to fix Vercel ephemeral filesystem
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Initialize Supabase client (singleton pattern)
let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials. Check SUPABASE_URL and SUPABASE_ANON_KEY in .env.local');
    }

    supabaseClient = createClient(supabaseUrl, supabaseKey);
  }

  return supabaseClient;
}

/**
 * Upload a file to Supabase Storage
 *
 * @param bucket - Bucket name ('extractions' or 'datasets')
 * @param path - File path within bucket (e.g., 'session123/original.pdf')
 * @param file - File content as Buffer or Uint8Array
 * @param contentType - Optional MIME type (auto-detected if not provided)
 * @returns Public URL of uploaded file
 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: Buffer | Uint8Array,
  contentType?: string
): Promise<string> {
  const supabase = getSupabaseClient();

  // Upload with upsert (overwrites if exists)
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      upsert: true,
      contentType: contentType,
    });

  if (error) {
    throw new Error(`Supabase Storage upload failed: ${error.message}`);
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return publicUrl;
}

/**
 * Download a file from Supabase Storage
 *
 * @param bucket - Bucket name ('extractions' or 'datasets')
 * @param path - File path within bucket
 * @returns File content as Buffer
 */
export async function downloadFile(
  bucket: string,
  path: string
): Promise<Buffer> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.storage
    .from(bucket)
    .download(path);

  if (error) {
    throw new Error(`Supabase Storage download failed: ${error.message}`);
  }

  return Buffer.from(await data.arrayBuffer());
}

/**
 * Check if a file exists in Supabase Storage
 *
 * @param bucket - Bucket name
 * @param path - File path within bucket
 * @returns true if file exists, false otherwise
 */
export async function fileExists(
  bucket: string,
  path: string
): Promise<boolean> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.storage
    .from(bucket)
    .list(path.split('/').slice(0, -1).join('/'), {
      search: path.split('/').pop(),
    });

  if (error) {
    return false;
  }

  return data.length > 0;
}

/**
 * Delete a file from Supabase Storage
 *
 * @param bucket - Bucket name
 * @param path - File path within bucket
 */
export async function deleteFile(
  bucket: string,
  path: string
): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (error) {
    throw new Error(`Supabase Storage delete failed: ${error.message}`);
  }
}

/**
 * List files in a directory
 *
 * @param bucket - Bucket name
 * @param path - Directory path within bucket
 * @returns Array of file objects
 */
export async function listFiles(
  bucket: string,
  path: string
): Promise<Array<{ name: string; id: string; updated_at: string; created_at: string; last_accessed_at: string; metadata: any }>> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.storage
    .from(bucket)
    .list(path);

  if (error) {
    throw new Error(`Supabase Storage list failed: ${error.message}`);
  }

  return data;
}

/**
 * Delete an entire directory (recursively)
 *
 * @param bucket - Bucket name
 * @param path - Directory path within bucket
 */
export async function deleteDirectory(
  bucket: string,
  path: string
): Promise<void> {
  const supabase = getSupabaseClient();

  // List all files in directory
  const files = await listFiles(bucket, path);

  if (files.length === 0) {
    return; // Nothing to delete
  }

  // Build array of file paths to delete
  const filePaths = files.map(file => `${path}/${file.name}`);

  const { error } = await supabase.storage
    .from(bucket)
    .remove(filePaths);

  if (error) {
    throw new Error(`Supabase Storage delete directory failed: ${error.message}`);
  }
}
