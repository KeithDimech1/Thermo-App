#!/usr/bin/env python3
"""
Refactor PROJECT_INDEX.json to be LEAN and point to readme/INDEX.md

Goals:
1. Keep only machine-readable technical data (functions, deps, stats)
2. Add clear pointers to readme/INDEX.md for context
3. Remove verbose descriptions and embedded documentation
4. Make it significantly smaller while preserving essential data
"""

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, Any

def load_current_index() -> Dict[str, Any]:
    """Load the current PROJECT_INDEX.json"""
    with open('PROJECT_INDEX.json', 'r') as f:
        return json.load(f)

def create_lean_index(current: Dict[str, Any]) -> Dict[str, Any]:
    """Create a lean, focused index that points to README for context"""

    return {
        "meta": {
            "version": "2.1",
            "generated_at": datetime.now().isoformat(),
            "schema": "Lean technical index - see readme/INDEX.md for context",
            "generator": "scripts/refactor-project-index.py"
        },

        "project": {
            "name": "AusGeochem Thermochronology Database",
            "schema_version": "2.1 (EarthBank camelCase)",
            "branch": "idea-014-earthbank-schema-migration",
            "status": "✅ Migration complete (2025-11-18)"
        },

        "documentation": {
            "primary": "readme/INDEX.md",
            "note": "⚠️ READ readme/INDEX.md FIRST - Contains architecture, concepts, and workflows",
            "schema_changes": "readme/database/SCHEMA_CHANGES.md",
            "scripts_index": "readme/scripts/INDEX.md"
        },

        "critical_warnings": [
            "✅ Production tables: earthbank_* (camelCase)",
            "⚠️ SQL requires double-quotes: SELECT \"sampleID\", \"centralAgeMa\"",
            "⚠️ Legacy snake_case tables are DEPRECATED",
            "📖 See readme/INDEX.md for full context"
        ],

        "key_files": {
            "database": {
                "connection": "lib/db/connection.ts",
                "production_queries": "lib/db/earthbank-queries.ts (✅ USE THIS)",
                "legacy_queries": "lib/db/queries.ts (DEPRECATED)"
            },
            "commands": {
                "thermoanalysis": ".claude/commands/thermoanalysis.md",
                "thermoextract": ".claude/commands/thermoextract.md"
            },
            "scripts": {
                "import": "scripts/db/import-earthbank-templates.ts",
                "psql_direct": "scripts/db/psql-direct.sh"
            }
        },

        "stats": {
            "generated": current.get('at'),
            "files": current.get('stats', {}).get('total_files', 0),
            "directories": current.get('stats', {}).get('total_directories', 0),
            "languages": current.get('stats', {}).get('fully_parsed', {}),
            "database_records": 1238,
            "production_tables": 5
        },

        # Keep all the technical data intact
        "tree": current.get('tree', []),
        "functions": current.get('f', {}),
        "globals": current.get('g', {}),
        "dependencies": current.get('deps', {}),
        "dir_purposes": current.get('dir_purposes', {}),
        "staleness": current.get('staleness')
    }

def main():
    """Main execution"""
    print("🔄 Creating LEAN PROJECT_INDEX.json...")

    # Load current index
    current = load_current_index()
    print(f"✅ Loaded current index")

    # Check if we have the backup or original
    if os.path.exists('PROJECT_INDEX.backup.json'):
        print("   Using PROJECT_INDEX.backup.json as source")
        with open('PROJECT_INDEX.backup.json', 'r') as f:
            current = json.load(f)

    # Get original size
    original_size = os.path.getsize('PROJECT_INDEX.json')
    print(f"   Current size: {original_size / 1024:.1f} KB")

    # Create lean version
    lean = create_lean_index(current)
    print("✅ Created lean structure")

    # Write lean version
    with open('PROJECT_INDEX.json', 'w') as f:
        json.dump(lean, f, indent=2, ensure_ascii=False)

    new_size = os.path.getsize('PROJECT_INDEX.json')
    reduction = ((original_size - new_size) / original_size) * 100

    print("✅ Wrote lean PROJECT_INDEX.json")
    print(f"\n📊 Size Comparison:")
    print(f"   Original: {original_size / 1024:.1f} KB")
    print(f"   New:      {new_size / 1024:.1f} KB")
    print(f"   Saved:    {(original_size - new_size) / 1024:.1f} KB ({reduction:.1f}% reduction)")

    print(f"\n✨ Structure:")
    print(f"   • meta - Generation info")
    print(f"   • project - Identity and status")
    print(f"   • documentation - Pointers to readme/INDEX.md ⭐")
    print(f"   • critical_warnings - Quick reference")
    print(f"   • key_files - Essential file paths")
    print(f"   • stats - Codebase statistics")
    print(f"   • tree/functions/globals/dependencies - Technical data")
    print(f"\n💡 All architectural context → readme/INDEX.md")

if __name__ == '__main__':
    main()
