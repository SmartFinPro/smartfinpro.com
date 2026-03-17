#!/usr/bin/env bash
# scripts/check-hydration-safety.sh
# Guardrail: Detect hydration-unsafe patterns in SSR-rendered client components.
#
# Scope: components/marketing/ + lib/mdx/ (public SSR pages)
# Exempt: components/dashboard/ (client-only behind auth), components/tools/ (calculators),
#         lib/hooks/ (run inside useEffect), components/ui/ (generic primitives)
#
# Forbidden in client component RENDER scope:
#   - new Date()          → SSR/client clock mismatch
#   - Date.now()          → SSR/client clock mismatch
#   - Math.random()       → non-deterministic
#   - .toLocaleString()   → locale mismatch without explicit locale arg
#
# Safe alternatives:
#   - Time/random: compute server-side, pass as prop
#   - Locale: always pass explicit locale, e.g. toLocaleString('en-US')
#   - Client-only: wrap in useEffect, event handler, or useState initializer
#
# Usage: bash scripts/check-hydration-safety.sh          (marketing scope)
#        bash scripts/check-hydration-safety.sh --all     (full codebase)
#        npm run check:hydration

set -euo pipefail

SCOPE="marketing"
if [ "${1:-}" = "--all" ]; then
  SCOPE="all"
fi

VIOLATIONS=0
CHECKED=0

# Find candidate files
if [ "$SCOPE" = "all" ]; then
  SEARCH_DIRS="app components lib"
else
  SEARCH_DIRS="components/marketing lib/mdx"
fi

while IFS= read -r file; do
  # Skip node_modules, .next, test files, scripts
  case "$file" in
    */node_modules/*|*/.next/*|*/__tests__/*|*/e2e/*|*/scripts/*) continue ;;
  esac

  # Skip exempt directories in marketing scope
  if [ "$SCOPE" = "marketing" ]; then
    case "$file" in
      */components/dashboard/*|*/components/tools/*|*/components/ui/*|*/components/providers/*|*/lib/hooks/*) continue ;;
    esac
  fi

  # Must contain 'use client' directive
  head -5 "$file" | grep -q "'use client'" || continue

  CHECKED=$((CHECKED + 1))
  FILE_HAS_VIOLATION=0

  # ── Check 1: toLocaleString() without explicit locale ──────────
  if grep -nP '\.toLocaleString\(\s*\)' "$file" >/dev/null 2>&1; then
    echo "  [!!] $file"
    grep -nP '\.toLocaleString\(\s*\)' "$file" | while read -r line; do
      echo "       $line"
    done
    echo "       → Fix: add explicit locale, e.g. .toLocaleString('en-US')"
    FILE_HAS_VIOLATION=1
  fi

  # ── Check 2: new Date() / Date.now() in render scope ───────────
  # Exclude: useEffect, useCallback, useMemo, event handlers, comments,
  #          ?? fallback (server prop with client fallback), try blocks,
  #          useState initializers, .then() callbacks, setTimeout/setInterval
  UNSAFE_DATE=$(grep -nE '(new Date\(\)|Date\.now\(\))' "$file" 2>/dev/null \
    | grep -vE '^\s*//' \
    | grep -vE 'useEffect|useCallback|useMemo|useRef|useState|setTimeout|setInterval|addEventListener|\.then\(|\.catch\(|// safe|// server|// client-only' \
    | grep -vE '\?\?' \
    | grep -vE 'localStorage|sessionStorage' \
    || true)

  if [ -n "$UNSAFE_DATE" ]; then
    if [ "$FILE_HAS_VIOLATION" -eq 0 ]; then
      echo "  [!!] $file"
    fi
    echo "$UNSAFE_DATE" | while read -r line; do
      echo "       $line"
    done
    echo "       → Fix: compute server-side, pass as prop, or move into useEffect"
    FILE_HAS_VIOLATION=1
  fi

  # ── Check 3: Math.random() in render scope ─────────────────────
  UNSAFE_RANDOM=$(grep -nE 'Math\.random\(\)' "$file" 2>/dev/null \
    | grep -vE '^\s*//' \
    | grep -vE 'useEffect|useCallback|useState|useRef|localStorage|sessionStorage|addEventListener|\.then\(|\.catch\(|// safe|// client-only' \
    || true)

  if [ -n "$UNSAFE_RANDOM" ]; then
    if [ "$FILE_HAS_VIOLATION" -eq 0 ]; then
      echo "  [!!] $file"
    fi
    echo "$UNSAFE_RANDOM" | while read -r line; do
      echo "       $line"
    done
    echo "       → Fix: use server-side seed or move into useEffect/event handler"
    FILE_HAS_VIOLATION=1
  fi

  if [ "$FILE_HAS_VIOLATION" -eq 1 ]; then
    VIOLATIONS=$((VIOLATIONS + 1))
  fi

done < <(find $SEARCH_DIRS -name '*.tsx' -o -name '*.ts' 2>/dev/null | sort)

echo ""
echo "Hydration Safety Check (scope: $SCOPE)"
echo "─────────────────────────────────────────────────────────"
echo "  Scanned: $CHECKED client components"
echo "  Violations: $VIOLATIONS"
echo "─────────────────────────────────────────────────────────"

if [ "$VIOLATIONS" -gt 0 ]; then
  echo ""
  echo "HYDRATION RISK: $VIOLATIONS file(s) have render-scope patterns that cause SSR/client mismatch."
  echo ""
  echo "Safe patterns:"
  echo "  ✓ Server component computes value, passes as prop"
  echo "  ✓ useEffect(() => { setState(new Date()) }, [])"
  echo "  ✓ .toLocaleString('en-US')  (explicit locale)"
  echo "  ✓ const year = reviewYear ?? new Date().getUTCFullYear()  (server prop ?? fallback)"
  exit 1
else
  echo ""
  echo "All client components are hydration-safe."
  exit 0
fi
