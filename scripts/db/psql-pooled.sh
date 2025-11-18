#!/bin/bash
# Safe PSQL wrapper that always uses DATABASE_URL (pooled) from .env.local
# Usage: ./scripts/db/psql-pooled.sh [psql arguments]

set -e

# Get the project root (where .env.local is)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Load DATABASE_URL from .env.local
if [ ! -f "$PROJECT_ROOT/.env.local" ]; then
    echo "❌ Error: .env.local not found at $PROJECT_ROOT/.env.local"
    exit 1
fi

# Extract DATABASE_URL from .env.local
DATABASE_URL=$(grep "^DATABASE_URL=" "$PROJECT_ROOT/.env.local" | cut -d '=' -f2- | tr -d '"' | tr -d "'")

if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL not found in .env.local"
    exit 1
fi

echo "🔗 Connecting to: $(echo $DATABASE_URL | sed 's/:[^:]*@/:***@/')" # Hide password in output

# Run psql with DATABASE_URL and any additional arguments
psql "$DATABASE_URL" "$@"
