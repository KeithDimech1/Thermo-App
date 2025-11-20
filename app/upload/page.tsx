'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
        setError(null);
      } else {
        setError('Please upload a PDF file');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Please upload a PDF file');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('pdf', file);

      const response = await fetch('/api/extraction/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      const data = await response.json();

      // Redirect to analysis page
      router.push(`/extraction/${data.sessionId}/analyze`);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">
          Upload Research Paper
        </h1>
        <p className="text-lg text-slate-600">
          Extract thermochronology data from published PDFs in three easy steps
        </p>
      </div>

      {/* Workflow Steps */}
      <div className="mb-12 grid grid-cols-3 gap-4">
        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600 mb-1">Step 1</div>
          <div className="text-sm font-semibold text-slate-900">Analyze</div>
          <div className="text-xs text-slate-600 mt-1">
            Identify tables and metadata
          </div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-slate-400 mb-1">Step 2</div>
          <div className="text-sm font-semibold text-slate-700">Extract</div>
          <div className="text-xs text-slate-600 mt-1">
            Convert tables to CSV
          </div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-slate-400 mb-1">Step 3</div>
          <div className="text-sm font-semibold text-slate-700">Load</div>
          <div className="text-xs text-slate-600 mt-1">
            Import to database
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-slate-300 bg-slate-50 hover:border-slate-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="text-6xl mb-4">📄</div>

        {!file ? (
          <>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Drop PDF here or click to browse
            </h3>
            <p className="text-slate-600 mb-4">
              Maximum file size: 50 MB
            </p>
            <label htmlFor="file-input" className="cursor-pointer">
              <span className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition">
                Choose File
              </span>
            </label>
            <input
              id="file-input"
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </>
        ) : (
          <>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              {file.name}
            </h3>
            <p className="text-slate-600 mb-4">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setFile(null)}
                disabled={uploading}
                className="px-6 py-3 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Remove
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </>
                ) : (
                  'Analyze Paper'
                )}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 font-medium">⚠️ {error}</p>
        </div>
      )}

      {/* Info Section */}
      <div className="mt-12 bg-slate-50 border border-slate-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-3">
          What happens next?
        </h3>
        <ul className="space-y-2 text-slate-700">
          <li className="flex items-start">
            <span className="mr-2 font-bold text-blue-600">1.</span>
            <span>
              <strong>Analysis (Step 1):</strong> AI identifies tables, figures, and metadata from your PDF
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2 font-bold text-slate-400">2.</span>
            <span>
              <strong>Extraction (Step 2):</strong> Tables are converted to CSV format with validation
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2 font-bold text-slate-400">3.</span>
            <span>
              <strong>Load (Step 3):</strong> Data is imported to the database with FAIR compliance scoring
            </span>
          </li>
        </ul>
      </div>

      {/* Supported Data Types */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          Supported Data Types
        </h3>
        <div className="grid grid-cols-2 gap-3 text-sm text-blue-800">
          <div>✓ Fission-track (AFT) ages</div>
          <div>✓ (U-Th)/He (AHe) ages</div>
          <div>✓ Track length distributions</div>
          <div>✓ Single-grain age data</div>
          <div>✓ Sample metadata (location, lithology)</div>
          <div>✓ QC standards and batches</div>
        </div>
      </div>
    </div>
  );
}
