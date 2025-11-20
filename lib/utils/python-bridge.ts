/**
 * Python Bridge for IDEA-015
 * Execute Python scripts from Node.js (text extraction, table detection, etc.)
 */

import { spawn } from 'child_process';
import path from 'path';

interface PythonResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

/**
 * Execute a Python script and return result
 */
export async function executePythonScript(
  scriptPath: string,
  args: string[] = [],
  options?: {
    cwd?: string;
    timeout?: number; // milliseconds
  }
): Promise<PythonResult> {
  return new Promise((resolve, reject) => {
    const python = spawn('python3', [scriptPath, ...args], {
      cwd: options?.cwd || process.cwd(),
    });

    let stdout = '';
    let stderr = '';

    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    python.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    // Set timeout if specified
    let timeoutId: NodeJS.Timeout | null = null;
    if (options?.timeout) {
      timeoutId = setTimeout(() => {
        python.kill('SIGTERM');
        reject(new Error(`Python script timed out after ${options.timeout}ms`));
      }, options.timeout);
    }

    python.on('close', (code) => {
      if (timeoutId) clearTimeout(timeoutId);

      resolve({
        stdout,
        stderr,
        exitCode: code || 0,
      });
    });

    python.on('error', (error) => {
      if (timeoutId) clearTimeout(timeoutId);
      reject(error);
    });
  });
}

/**
 * Extract plain text from PDF using PyMuPDF
 * Creates a simple Python script inline to extract text
 */
export async function extractPDFText(
  pdfPath: string
): Promise<string> {
  // Create inline Python script for text extraction
  const pythonScript = `
import sys
import fitz  # PyMuPDF

def extract_text(pdf_path):
    doc = fitz.open(pdf_path)
    text = ""
    for page_num, page in enumerate(doc, start=1):
        text += f"\\n--- Page {page_num} ---\\n"
        text += page.get_text("text")
    doc.close()
    return text

if __name__ == "__main__":
    pdf_path = sys.argv[1]
    text = extract_text(pdf_path)
    print(text)
`;

  // Write script to temp file
  const fs = require('fs').promises;
  const os = require('os');
  const tempDir = os.tmpdir();
  const scriptPath = path.join(tempDir, `extract_text_${Date.now()}.py`);

  try {
    await fs.writeFile(scriptPath, pythonScript);

    const result = await executePythonScript(scriptPath, [pdfPath], {
      timeout: 120000, // 2 minute timeout
    });

    if (result.exitCode !== 0) {
      throw new Error(`PDF text extraction failed: ${result.stderr}`);
    }

    return result.stdout;
  } finally {
    // Cleanup temp script
    try {
      await fs.unlink(scriptPath);
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Extract PDF metadata using PyMuPDF
 */
export async function extractPDFMetadata(
  pdfPath: string
): Promise<{
  pageCount: number;
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  creationDate?: string;
}> {
  const pythonScript = `
import sys
import json
import fitz  # PyMuPDF

def extract_metadata(pdf_path):
    doc = fitz.open(pdf_path)
    metadata = {
        "pageCount": doc.page_count,
        "title": doc.metadata.get("title", ""),
        "author": doc.metadata.get("author", ""),
        "subject": doc.metadata.get("subject", ""),
        "creator": doc.metadata.get("creator", ""),
        "producer": doc.metadata.get("producer", ""),
        "creationDate": doc.metadata.get("creationDate", ""),
    }
    doc.close()
    return metadata

if __name__ == "__main__":
    pdf_path = sys.argv[1]
    metadata = extract_metadata(pdf_path)
    print(json.dumps(metadata))
`;

  const fs = require('fs').promises;
  const os = require('os');
  const tempDir = os.tmpdir();
  const scriptPath = path.join(tempDir, `extract_metadata_${Date.now()}.py`);

  try {
    await fs.writeFile(scriptPath, pythonScript);

    const result = await executePythonScript(scriptPath, [pdfPath], {
      timeout: 60000, // 1 minute timeout
    });

    if (result.exitCode !== 0) {
      throw new Error(`PDF metadata extraction failed: ${result.stderr}`);
    }

    return JSON.parse(result.stdout);
  } finally {
    try {
      await fs.unlink(scriptPath);
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Check if PyMuPDF (fitz) is installed
 */
export async function checkPyMuPDFInstalled(): Promise<boolean> {
  const pythonScript = `
try:
    import fitz
    print("installed")
except ImportError:
    print("not_installed")
`;

  const fs = require('fs').promises;
  const os = require('os');
  const tempDir = os.tmpdir();
  const scriptPath = path.join(tempDir, `check_pymupdf_${Date.now()}.py`);

  try {
    await fs.writeFile(scriptPath, pythonScript);

    const result = await executePythonScript(scriptPath, [], {
      timeout: 10000, // 10 second timeout
    });

    return result.stdout.trim() === 'installed';
  } catch {
    return false;
  } finally {
    try {
      await fs.unlink(scriptPath);
    } catch {
      // Ignore cleanup errors
    }
  }
}
