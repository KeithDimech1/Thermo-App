#!/bin/bash

# Pre-Deployment Check Script
# Run this before pushing to verify everything will build correctly

echo "🔍 Starting pre-deployment checks..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track overall success
ALL_PASSED=true

# 1. TypeScript Check
echo "1️⃣  Checking TypeScript..."
if npx tsc --noEmit; then
    echo -e "${GREEN}✓ TypeScript check passed${NC}"
else
    echo -e "${RED}✗ TypeScript check failed${NC}"
    ALL_PASSED=false
fi
echo ""

# 2. Linting
echo "2️⃣  Running linter..."
if npm run lint; then
    echo -e "${GREEN}✓ Linting passed${NC}"
else
    echo -e "${YELLOW}⚠ Linting warnings (non-blocking)${NC}"
fi
echo ""

# 3. Build Test
echo "3️⃣  Testing production build..."
if npm run build; then
    echo -e "${GREEN}✓ Build successful${NC}"
else
    echo -e "${RED}✗ Build failed${NC}"
    ALL_PASSED=false
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ "$ALL_PASSED" = true ]; then
    echo -e "${GREEN}✅ All checks passed! Safe to deploy.${NC}"
    exit 0
else
    echo -e "${RED}❌ Some checks failed. Fix errors before deploying.${NC}"
    exit 1
fi
