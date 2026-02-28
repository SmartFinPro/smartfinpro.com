#!/usr/bin/env bash
# ============================================================
# Regression Check: 'use client' MDX/marketing components must
# NOT import (static or dynamic) from @/lib/actions/*.
#
# WHY: Dynamic imports from 'use client' → 'use server' modules
# cause Turbopack module resolution failures in dev mode.
# The correct pattern is to use fetch('/api/...') instead.
#
# SCOPE: Only checks lib/mdx/ and components/marketing/ and
# components/content/ and components/ui/ — Dashboard components
# use server actions intentionally (rendered inside server
# component pages). Type-only imports are always safe.
#
# KNOWN EXCEPTIONS: none — all server actions must go through
# API routes when called from client components.
#
# Usage: bash scripts/check-client-server-imports.sh
# Exit code 0 = clean, 1 = violations found
# ============================================================

set -euo pipefail

VIOLATIONS=0
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# No exceptions — all server actions must be called via API routes from client code.
KNOWN_SAFE="__NONE__"

# Directories to check — only MDX runtime & marketing components
DIRS=(
  "$ROOT/lib/mdx"
  "$ROOT/components/marketing"
  "$ROOT/components/content"
  "$ROOT/components/ui"
)

for dir in "${DIRS[@]}"; do
  [ -d "$dir" ] || continue

  while IFS= read -r file; do
    # Check if file starts with 'use client' (within first 5 lines)
    if ! head -5 "$file" | grep -q "'use client'" 2>/dev/null; then
      continue
    fi

    # Check for VALUE imports from @/lib/actions/ (skip 'import type' and known-safe)
    MATCHES=$(grep -n "from ['\"]@/lib/actions/" "$file" 2>/dev/null \
      | grep -v "import type " \
      | grep -v "$KNOWN_SAFE" \
      || true)

    if [ -n "$MATCHES" ]; then
      echo "❌ VIOLATION: $(basename "$file")"
      echo "$MATCHES"
      echo "   → Use fetch('/api/...') instead of importing server actions."
      echo ""
      VIOLATIONS=$((VIOLATIONS + 1))
    fi

    # Check for dynamic import() from @/lib/actions/
    DYN_MATCHES=$(grep -n "import(['\"]@/lib/actions/" "$file" 2>/dev/null \
      | grep -v "$KNOWN_SAFE" \
      || true)

    if [ -n "$DYN_MATCHES" ]; then
      echo "❌ VIOLATION: $(basename "$file")"
      echo "$DYN_MATCHES"
      echo "   → Use fetch('/api/...') instead of dynamic import()."
      echo ""
      VIOLATIONS=$((VIOLATIONS + 1))
    fi
  done < <(find "$dir" -type f \( -name "*.ts" -o -name "*.tsx" \) \
    ! -path "*/node_modules/*")
done

if [ "$VIOLATIONS" -gt 0 ]; then
  echo "⚠️  Found $VIOLATIONS violation(s) in MDX/marketing client components."
  echo "   'use client' files in these dirs must NOT import server actions."
  echo "   Use fetch('/api/...') or move logic to an API route."
  exit 1
else
  echo "✅ No client→server-action import violations in MDX/marketing components."
  exit 0
fi
