#!/usr/bin/env python3
"""
PDF to PNG converter using PyMuPDF (fitz)
Renders specific pages of a PDF as PNG images
"""

import sys
import json
import fitz  # PyMuPDF

def render_page_to_png(pdf_path: str, page_number: int, output_path: str, zoom: float = 2.0) -> dict:
    """
    Render a PDF page to PNG

    Args:
        pdf_path: Path to PDF file
        page_number: Page number (1-indexed)
        output_path: Output PNG file path
        zoom: Zoom factor for resolution (default 2.0 = 144 DPI)

    Returns:
        dict with status and metadata
    """
    try:
        # Open PDF
        doc = fitz.open(pdf_path)

        # Validate page number (convert from 1-indexed to 0-indexed)
        page_index = page_number - 1
        if page_index < 0 or page_index >= len(doc):
            return {
                "success": False,
                "error": f"Invalid page number: {page_number} (PDF has {len(doc)} pages)"
            }

        # Get page
        page = doc[page_index]

        # Create transformation matrix for zoom
        mat = fitz.Matrix(zoom, zoom)

        # Render page to pixmap (PNG)
        pix = page.get_pixmap(matrix=mat, alpha=False)

        # Save as PNG
        pix.save(output_path)

        # Close document
        doc.close()

        return {
            "success": True,
            "output_path": output_path,
            "width": pix.width,
            "height": pix.height,
            "file_size": len(pix.tobytes())
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def main():
    """CLI entry point"""
    if len(sys.argv) < 4:
        print(json.dumps({
            "success": False,
            "error": "Usage: pdf-to-png.py <pdf_path> <page_number> <output_path> [zoom]"
        }))
        sys.exit(1)

    pdf_path = sys.argv[1]
    page_number = int(sys.argv[2])
    output_path = sys.argv[3]
    zoom = float(sys.argv[4]) if len(sys.argv) > 4 else 2.0

    result = render_page_to_png(pdf_path, page_number, output_path, zoom)
    print(json.dumps(result))

    sys.exit(0 if result["success"] else 1)

if __name__ == "__main__":
    main()
