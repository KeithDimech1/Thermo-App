#!/bin/bash
# Safe pg_dump wrapper that always uses DIRECT_URL from .env.local
# Usage: ./scripts/db/pg_dump-direct.sh [pg_dump arguments]

set -e

# Get the project root (where .env.local is)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Load DIRECT_URL from .env.local
if [ ! -f "$PROJECT_ROOT/.env.local" ]; then
    echo "❌ Error: .env.local not found at $PROJECT_ROOT/.env.local"
    exit 1
fi

# Extract DIRECT_URL from .env.local
DIRECT_URL=$(grep "^DIRECT_URL=" "$PROJECT_ROOT/.env.local" | cut -d '=' -f2- | tr -d '"' | tr -d "'")

if [ -z "$DIRECT_URL" ]; then
    echo "❌ Error: DIRECT_URL not found in .env.local"
    exit 1
fi

# Run pg_dump with DIRECT_URL and any additional arguments
pg_dump "$DIRECT_URL" "$@"
