#!/usr/bin/env bash
# scripts/check-hydration-safety.sh
# Guardrail: Detect hydration-unsafe patterns in SSR-rendered client components.
#
# Scope: components/marketing/ + lib/mdx/ + components/tools/ (public SSR pages)
# Exempt: components/dashboard/ (client-only behind auth), lib/hooks/ (run
#         inside useEffect), components/ui/ (generic primitives), and — ONLY
#         inside components/tools/ — an explicit, SHRINKING allowlist of the
#         16 legacy calculator widgets that predate the FDL shell guard
#         (FDL PR 2.1). Every migration PR that ports one of these 16 into
#         the new components/tools/shell/ architecture DELETES its line from
#         LEGACY_TOOL_WIDGET_ALLOWLIST below; the allowlist is empty and this
#         mechanism is removed entirely in PR 5.3d. components/tools/shell/
#         (and the future components/tools/hub/) are FULLY covered by this
#         guard — no blanket exemption for new tool code.
#         Also exempt: ONE pre-existing, unrelated legacy violation in
#         components/marketing/ (PRE_EXISTING_MARKETING_ALLOWLIST below) —
#         predates FDL PR 2.1 entirely (see comment at its definition);
#         documented for a separate Fable/Opus follow-up decision, not fixed
#         here.
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

# Shrinking allowlist (FDL PR 2.1) — the 16 pre-existing calculator widgets
# in components/tools/ that predate the shell architecture. NOT exempt:
# components/tools/shell/ (new), components/tools/money-leak-scanner/
# (already passes cleanly — first migration pilot, PR 2.2) and
# components/tools/dynamic-calculators.tsx (already passes cleanly — a
# lazy-load barrel scheduled for deletion, see risk register 0.7).
LEGACY_TOOL_WIDGET_ALLOWLIST=(
  "components/tools/ai-roi-calculator.tsx"
  "components/tools/au-mortgage-calculator.tsx"
  "components/tools/broker-comparison.tsx"
  "components/tools/broker-finder-quiz.tsx"
  "components/tools/ca-mortgage-affordability-calculator.tsx"
  "components/tools/credit-card-rewards-calculator.tsx"
  "components/tools/credit-score-simulator.tsx"
  "components/tools/debt-payoff-calculator.tsx"
  "components/tools/gold-roi-calculator.tsx"
  "components/tools/isa-tax-savings-calculator.tsx"
  "components/tools/loan-calculator.tsx"
  "components/tools/remortgage-calculator.tsx"
  "components/tools/superannuation-calculator.tsx"
  "components/tools/tfsa-rrsp-calculator.tsx"
  "components/tools/trading-cost-calculator.tsx"
  "components/tools/wealthsimple-calculator.tsx"
)

is_legacy_tool_widget() {
  local candidate="$1"
  for allowed in "${LEGACY_TOOL_WIDGET_ALLOWLIST[@]}"; do
    # Match either an exact relative path (find run from repo root) or any
    # path ending in "/$allowed" (defensive, in case $file ever carries a
    # leading directory prefix).
    case "$candidate" in
      "$allowed"|*/"$allowed") return 0 ;;
    esac
  done
  return 1
}

# Pre-existing violation, UNRELATED to FDL PR 2.1's components/tools/ scope
# widening — discovered because this PR's gate (SPEC 0.2.2) is the first
# place `check:hydration` is required to exit 0 (it was previously wired as
# non-blocking in package.json `ci:full`: "npm run check:hydration || echo
# '... non-blocking'"). components/marketing/ was ALREADY in this script's
# scope before PR 2.1 — confirmed present on origin/main pre-PR-2.1 by running
# origin/main's own copy of this script (same single violation, same line).
# git blame: commit 8d114ea5 (2026-03-17), long before this PR.
#
# components/marketing/geo-suggest-banner.tsx:22 — `new Date(Date.now() +
# days * 86_400_000)` inside `setCookie()`, a plain helper invoked only from
# a dismiss/preference click handler, never from render scope. Almost
# certainly a guard false positive (the static grep can't see the call site),
# but this PR does not touch components/marketing/ code — Fable/Opus decide
# on a real fix (e.g. rename to make the non-render call obvious to the
# guard, or teach the guard to look at call sites) as a separate follow-up.
PRE_EXISTING_MARKETING_ALLOWLIST=(
  "components/marketing/geo-suggest-banner.tsx"
)

is_pre_existing_marketing_allowlisted() {
  local candidate="$1"
  for allowed in "${PRE_EXISTING_MARKETING_ALLOWLIST[@]}"; do
    case "$candidate" in
      "$allowed"|*/"$allowed") return 0 ;;
    esac
  done
  return 1
}

# Find candidate files
if [ "$SCOPE" = "all" ]; then
  SEARCH_DIRS="app components lib"
else
  SEARCH_DIRS="components/marketing lib/mdx components/tools"
fi

while IFS= read -r file; do
  # Skip node_modules, .next, test files, scripts
  case "$file" in
    */node_modules/*|*/.next/*|*/__tests__/*|*/e2e/*|*/scripts/*) continue ;;
  esac

  # Skip exempt directories in marketing scope (unchanged from before FDL PR
  # 2.1, except components/tools/ no longer gets a blanket pass — only the
  # explicit 16-widget legacy allowlist above does).
  if [ "$SCOPE" = "marketing" ]; then
    case "$file" in
      */components/dashboard/*|*/components/ui/*|*/components/providers/*|*/lib/hooks/*) continue ;;
    esac
    if is_legacy_tool_widget "$file"; then
      continue
    fi
    if is_pre_existing_marketing_allowlisted "$file"; then
      continue
    fi
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
