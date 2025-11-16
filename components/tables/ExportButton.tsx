'use client';

import { Download } from 'lucide-react';

interface ExportButtonProps {
  data: any[];
  filename: string;
  label?: string;
}

export default function ExportButton({ data, filename, label = 'Export CSV' }: ExportButtonProps) {
  const exportToCSV = () => {
    if (!data || data.length === 0) {
      alert('No data to export');
      return;
    }

    // Get headers from first row
    const headers = Object.keys(data[0]);

    // Create CSV content
    const csvContent = [
      // Header row
      headers.join(','),
      // Data rows
      ...data.map(row =>
        headers.map(header => {
          const value = row[header];
          // Handle nulls, numbers, and strings
          if (value === null || value === undefined) return '';
          if (typeof value === 'number') return value;
          // Escape strings with commas or quotes
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(',')
      )
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={exportToCSV}
      className="flex items-center space-x-2 px-4 py-2 bg-thermo-gold text-thermo-forest rounded-md hover:bg-thermo-gold-light transition-colors font-medium text-sm shadow-sm"
    >
      <Download className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
}
