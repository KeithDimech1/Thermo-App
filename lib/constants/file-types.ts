/**
 * File Type Constants
 *
 * Single source of truth for file types used throughout the application.
 * Used by:
 * - /thermoload script (scripts/db/load-dataset-from-paper.ts)
 * - DownloadSection component (components/datasets/DownloadSection.tsx)
 * - Any other file upload/display functionality
 *
 * CRITICAL: Do not modify these values without updating both the database
 * and all UI components that depend on them.
 */

export const FILE_TYPES = {
  PDF: 'pdf',
  CSV: 'csv',
  IMAGE_PNG: 'image/png',
  IMAGE_JPG: 'image/jpeg',
  IMAGE_TIFF: 'image/tiff',
} as const;

export type FileType = typeof FILE_TYPES[keyof typeof FILE_TYPES];

/**
 * File group configurations for UI display
 * Maps file types to their display properties
 */
export const FILE_GROUP_CONFIG = [
  {
    type: FILE_TYPES.PDF,
    title: 'PDF Documents',
    description: 'Research paper and supplementary materials',
    colorClass: 'bg-red-50 border-red-200',
    icon: '📄',
  },
  {
    type: FILE_TYPES.CSV,
    title: 'CSV Data Files',
    description: 'Tabular data extracted from paper tables',
    colorClass: 'bg-green-50 border-green-200',
    icon: '📊',
  },
  {
    type: FILE_TYPES.IMAGE_PNG,
    title: 'Tables & Figures',
    description: 'Table screenshots and figure images from the paper',
    colorClass: 'bg-purple-50 border-purple-200',
    icon: '🖼️',
  },
] as const;

/**
 * Helper function to determine file type from file extension
 */
export function getFileTypeFromExtension(filename: string): FileType {
  const ext = filename.toLowerCase().split('.').pop();

  switch (ext) {
    case 'pdf':
      return FILE_TYPES.PDF;
    case 'csv':
      return FILE_TYPES.CSV;
    case 'png':
      return FILE_TYPES.IMAGE_PNG;
    case 'jpg':
    case 'jpeg':
      return FILE_TYPES.IMAGE_JPG;
    case 'tif':
    case 'tiff':
      return FILE_TYPES.IMAGE_TIFF;
    default:
      throw new Error(`Unsupported file type: ${ext}`);
  }
}
