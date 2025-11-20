#!/bin/bash

# ENFORCING HOOK: Remind Claude to check PROJECT_INDEX.json and readme/INDEX.md
# This runs BEFORE every user prompt is processed

cat << 'EOF'

================================================================================
⚠️  MANDATORY PRE-WORK CHECKLIST (ENFORCED)
================================================================================

BEFORE using Grep/Glob/search tools OR making code changes:

1. ✅ Read readme/INDEX.md FIRST (architectural overview)
2. ✅ Check PROJECT_INDEX.json (current state snapshot)
3. ✅ Navigate to specific referenced docs
4. ⚠️  ONLY THEN use code search tools

WHY: Living documentation explains "why" and relationships.
     Direct code search wastes tokens and misses critical context.

Current schema status: EarthBank camelCase migration (IDEA-014)
- Use earthbank_* tables with "camelCase" quoted fields
- See PROJECT_INDEX.json for complete current state

================================================================================

EOF
