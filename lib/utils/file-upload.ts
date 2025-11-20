/**
 * File upload utility for IDEA-015
 * Handles PDF uploads, validation, and storage
 */

import fs from 'fs/promises';
import path from 'path';
import { nanoid } from 'nanoid';

/**
 * Uploaded file metadata
 */
export interface UploadedFile {
  filename: string;
  path: string;          // Full filesystem path
  relativePath: string;  // Relative path for database (e.g., /uploads/session/file.pdf)
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
 * Save uploaded PDF to uploads directory
 * Creates directory structure: public/uploads/{sessionId}/original.pdf
 */
export async function saveUploadedPDF(
  file: File,
  sessionId: string
): Promise<UploadedFile> {
  // Create uploads directory for this session
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', sessionId);
  await fs.mkdir(uploadDir, { recursive: true });

  // Save as original.pdf
  const filename = 'original.pdf';
  const fullPath = path.join(uploadDir, filename);

  // Convert File to Buffer and write
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  await fs.writeFile(fullPath, buffer);

  // Return file metadata
  return {
    filename: file.name, // Original filename
    path: fullPath,
    relativePath: `/uploads/${sessionId}/${filename}`,
    size: file.size,
    mimetype: file.type
  };
}

/**
 * Delete session upload directory and all files
 */
export async function deleteSessionFiles(sessionId: string): Promise<void> {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', sessionId);

  try {
    await fs.rm(uploadDir, { recursive: true, force: true });
  } catch (error) {
    // Ignore if directory doesn't exist
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
}

/**
 * Check if session upload directory exists
 */
export async function sessionFilesExist(sessionId: string): Promise<boolean> {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', sessionId);

  try {
    await fs.access(uploadDir);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get session file path
 */
export function getSessionFilePath(sessionId: string, filename: string = 'original.pdf'): string {
  return path.join(process.cwd(), 'public', 'uploads', sessionId, filename);
}

/**
 * Get session directory path
 */
export function getSessionDirectory(sessionId: string): string {
  return path.join(process.cwd(), 'public', 'uploads', sessionId);
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
