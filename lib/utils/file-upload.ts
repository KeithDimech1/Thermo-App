/**
 * File upload utility for IDEA-015
 * Handles PDF uploads, validation, and storage
 *
 * ERROR-021: Migrated to Supabase Storage (was local filesystem)
 */

import { nanoid } from 'nanoid';
import { uploadFile, deleteDirectory, fileExists } from '@/lib/storage/supabase';

/**
 * Uploaded file metadata
 */
export interface UploadedFile {
  filename: string;
  path: string;          // Supabase Storage public URL
  relativePath: string;  // Supabase Storage public URL (same as path)
  size: number;
  mimetype: string;
}

/**
 * Upload configuration
 */
const MAX_FILE_SIZE = parseInt(process.env.UPLOAD_MAX_SIZE_MB || '50') * 1024 * 1024;
const ALLOWED_MIMETYPES = [
  'application/pdf',
  'application/x-pdf'
];

/**
 * Generate unique session ID
 * Format: extract-{10 random chars}
 */
export function generateSessionId(): string {
  return `extract-${nanoid(10)}`;
}

/**
 * Validate PDF file
 */
export function validatePDF(file: File): { valid: boolean; error?: string } {
  // Check mimetype
  if (!ALLOWED_MIMETYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Must be a PDF. Got: ${file.type}`
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    const maxSizeMB = MAX_FILE_SIZE / 1024 / 1024;
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
    return {
      valid: false,
      error: `File too large. Maximum size: ${maxSizeMB}MB. Your file: ${fileSizeMB}MB`
    };
  }

  // Check file size is not zero
  if (file.size === 0) {
    return {
      valid: false,
      error: 'File is empty'
    };
  }

  return { valid: true };
}

/**
 * Save uploaded PDF to Supabase Storage
 * Uploads to: extractions/{sessionId}/original.pdf
 *
 * ERROR-021: Migrated from local filesystem to Supabase Storage
 */
export async function saveUploadedPDF(
  file: File,
  sessionId: string
): Promise<UploadedFile> {
  // Convert File to Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Upload to Supabase Storage (extractions bucket)
  const filename = 'original.pdf';
  const storagePath = `${sessionId}/${filename}`;
  const publicUrl = await uploadFile('extractions', storagePath, buffer, file.type);

  // Return file metadata
  return {
    filename: file.name, // Original filename
    path: publicUrl,
    relativePath: publicUrl,
    size: file.size,
    mimetype: file.type
  };
}

/**
 * Delete session files from Supabase Storage
 *
 * ERROR-021: Migrated from local filesystem to Supabase Storage
 */
export async function deleteSessionFiles(sessionId: string): Promise<void> {
  try {
    await deleteDirectory('extractions', sessionId);
  } catch (error) {
    // Ignore if directory doesn't exist
    console.warn(`Failed to delete session files for ${sessionId}:`, error);
  }
}

/**
 * Check if session files exist in Supabase Storage
 *
 * ERROR-021: Migrated from local filesystem to Supabase Storage
 */
export async function sessionFilesExist(sessionId: string): Promise<boolean> {
  try {
    return await fileExists('extractions', `${sessionId}/original.pdf`);
  } catch {
    return false;
  }
}

/**
 * Get session file storage path (for Supabase Storage)
 *
 * ERROR-021: Returns Supabase Storage path, not filesystem path
 */
export function getSessionFilePath(sessionId: string, filename: string = 'original.pdf'): string {
  return `${sessionId}/${filename}`;
}

/**
 * Get session directory storage path (for Supabase Storage)
 *
 * ERROR-021: Returns Supabase Storage path, not filesystem path
 */
export function getSessionDirectory(sessionId: string): string {
  return sessionId;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Parse uploaded file from FormData
 * Works with Next.js App Router Request
 */
export async function parseUploadedFile(formData: FormData): Promise<File | null> {
  const file = formData.get('pdf');

  if (!file || !(file instanceof File)) {
    return null;
  }

  return file;
}
