#!/usr/bin/env python3
"""
Upload remaining figures to Supabase using supabase-py
"""

import fitz  # PyMuPDF
import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("❌ Missing Supabase credentials in .env.local")
    sys.exit(1)

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# PDF URL for dataset 3
PDF_URL = "https://ggkrikijxollyolifdqs.supabase.co/storage/v1/object/public/datasets/3/Tectonics%20-%202012%20-%20Wells%20-%20Geodynamics%20of%20synconvergent%20extension%20and%20tectonic%20mode%20switching%20Constraints%20from%20the%20_1_.pdf"

print("📥 Downloading PDF...")
import urllib.request
urllib.request.urlretrieve(PDF_URL, '/tmp/paper.pdf')

print("🖼️  Extracting images from PDF...")
doc = fitz.open('/tmp/paper.pdf')

figures = []
for page_num in range(len(doc)):
    page = doc[page_num]
    images = page.get_images(full=True)

    for img_index, img in enumerate(images):
        xref = img[0]
        base_image = doc.extract_image(xref)
        image_bytes = base_image["image"]
        image_ext = base_image["ext"]

        # Filter out small images (likely icons/logos, not figures)
        if len(image_bytes) > 50000:
            figures.append(image_bytes)
            print(f"Extracted figure-{len(figures)}.{image_ext} ({len(image_bytes)} bytes)")

print(f"\n✅ Extracted {len(figures)} figures")

# Upload figure-2 and figure-3
for i, figure_bytes in enumerate(figures[1:], start=2):  # Skip figure-1 (already uploaded)
    filename = f"figure-{i}.jpeg"
    storage_path = f"3/figures/{filename}"

    print(f"\n☁️  Uploading {filename} to Supabase...")

    try:
        response = supabase.storage.from_('datasets').upload(
            path=storage_path,
            file=figure_bytes,
            file_options={"content-type": "image/jpeg", "upsert": "true"}
        )

        public_url = f"{SUPABASE_URL}/storage/v1/object/public/datasets/{storage_path}"
        print(f"✅ Uploaded {filename}")
        print(f"   URL: {public_url}")

    except Exception as e:
        print(f"❌ Upload failed: {str(e)}")

doc.close()
os.remove('/tmp/paper.pdf')

print("\n✅ All figures uploaded!")
