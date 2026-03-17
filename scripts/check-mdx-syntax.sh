#!/usr/bin/env bash
# ============================================================
# check-mdx-syntax.sh — Block HTML comments in MDX files
#
# MDX uses JSX syntax. HTML comments (<!-- -->) cause:
#   [next-mdx-remote] Unexpected character '!' (U+0021)
#
# Use JSX comments instead: {/* comment */}
#
# Usage:
#   bash scripts/check-mdx-syntax.sh          # check only
#   bash scripts/check-mdx-syntax.sh --fix    # auto-remove
# ============================================================

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FIX=false
[ "${1:-}" = "--fix" ] && FIX=true

VIOLATIONS=0
FILES_WITH_ISSUES=()

while IFS= read -r file; do
  if grep -qn '<!--' "$file"; then
    VIOLATIONS=$((VIOLATIONS + 1))
    rel="${file#$ROOT/}"
    FILES_WITH_ISSUES+=("$rel")

    if [ "$FIX" = "true" ]; then
      # Remove single-line HTML comments
      sed -i '' '/^<!--.*-->$/d' "$file"
      # Remove multi-line HTML comments
      sed -i '' '/^<!--$/,/^-->$/d' "$file"
      echo "  FIXED: $rel"
    else
      echo "  FAIL: $rel"
      grep -n '<!--' "$file" | head -3 | while IFS= read -r line; do
        echo "         $line"
      done
    fi
  fi
done < <(find "$ROOT/content" -name "*.mdx" -not -path "*/_templates/*" -not -path "*/node_modules/*")

if [ "$VIOLATIONS" -gt 0 ]; then
  if [ "$FIX" = "true" ]; then
    echo ""
    echo "✅ Fixed $VIOLATIONS file(s). HTML comments removed."
    exit 0
  else
    echo ""
    echo "❌ $VIOLATIONS file(s) contain HTML comments (<!-- -->)."
    echo "   MDX requires JSX comments: {/* comment */}"
    echo "   Run: bash scripts/check-mdx-syntax.sh --fix"
    exit 1
  fi
else
  echo "✅ No HTML comments found in MDX files."
  exit 0
fi
