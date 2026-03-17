#!/usr/bin/env bash
# bin/verify-audit.sh
# CI-style audit verification for the S2S postback dedup system.
#
# Runs:
#   1. TypeScript type-check (tsc --noEmit)
#   2. Unit tests (mocked Supabase) → writes unit-latest.json to audits/reports/
#   3. Integration tests (real PostgreSQL constraints) → writes integration-latest.json
#   4. Validates JSON report: success===true AND numFailedTests===0 AND numPassedTests===numTotalTests
#
# Usage:
#   ./bin/verify-audit.sh              # full verification
#   ./bin/verify-audit.sh --skip-unit  # integration only (faster)
#
# Requires: .env.test.local with SUPABASE_TEST_URL + SUPABASE_TEST_SERVICE_KEY
#
# Exit codes:
#   0 = all checks passed
#   1 = one or more checks failed

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

REPORT_DIR="./audits/reports"
REPORT_FILE="$REPORT_DIR/integration-latest.json"
SKIP_UNIT=false

for arg in "$@"; do
  case "$arg" in
    --skip-unit) SKIP_UNIT=true ;;
  esac
done

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   SmartFinPro — S2S Postback Dedup Audit Verification   ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

PASS=0
FAIL=0

run_check() {
  local label="$1"
  shift
  echo -e "${YELLOW}▸ ${label}${NC}"
  if "$@" > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓ PASSED${NC}"
    PASS=$((PASS + 1))
  else
    echo -e "  ${RED}✗ FAILED${NC}"
    FAIL=$((FAIL + 1))
  fi
}

# ── 1. TypeScript ──────────────────────────────────────────────────────────────
run_check "TypeScript type-check (tsc --noEmit)" npx tsc --noEmit

# ── 2. Unit Tests ──────────────────────────────────────────────────────────────
if [ "$SKIP_UNIT" = false ]; then
  run_check "Unit tests (mocked Supabase)" npx vitest run
else
  echo -e "${YELLOW}▸ Unit tests — skipped (--skip-unit)${NC}"
fi

# ── 3. Integration Tests ──────────────────────────────────────────────────────
echo -e "${YELLOW}▸ Integration tests (real PostgreSQL)${NC}"
mkdir -p "$REPORT_DIR"

if npm run test:integration > /dev/null 2>&1; then
  echo -e "  ${GREEN}✓ PASSED${NC}"
  PASS=$((PASS + 1))
else
  echo -e "  ${RED}✗ FAILED${NC}"
  FAIL=$((FAIL + 1))
fi

# ── 4. Validate Report content (file existence is NOT sufficient) ─────────────
echo -e "${YELLOW}▸ Audit report: existence + success===true + numFailedTests===0${NC}"
if [ ! -f "$REPORT_FILE" ]; then
  echo -e "  ${RED}✗ Report not found at ${REPORT_FILE}${NC}"
  FAIL=$((FAIL + 1))
else
  # Read all three required fields from the JSON report
  REPORT_SUCCESS=$(node -e "const r=require('$REPORT_FILE'); console.log(r.success === true ? 'true' : 'false')" 2>/dev/null || echo "error")
  TOTAL=$(node -e "const r=require('$REPORT_FILE'); console.log(r.numTotalTests || 0)" 2>/dev/null || echo "?")
  PASSED=$(node -e "const r=require('$REPORT_FILE'); console.log(r.numPassedTests || 0)" 2>/dev/null || echo "?")
  FAILED=$(node -e "const r=require('$REPORT_FILE'); console.log(r.numFailedTests || 0)" 2>/dev/null || echo "?")

  echo -e "  Report: ${REPORT_FILE}"
  echo -e "  Tests:  ${PASSED}/${TOTAL} passed, ${FAILED} failed"
  echo -e "  success field: ${REPORT_SUCCESS}"

  # Gate: success must be true AND zero failures
  if [ "$REPORT_SUCCESS" = "true" ] && [ "$FAILED" = "0" ] && [ "$PASSED" = "$TOTAL" ]; then
    echo -e "  ${GREEN}✓ Report valid (success=true, ${PASSED}/${TOTAL} passed)${NC}"
    PASS=$((PASS + 1))

    # Archive with timestamp only on genuine success
    TIMESTAMP=$(date +%Y%m%d-%H%M%S)
    ARCHIVE_FILE="$REPORT_DIR/integration-${TIMESTAMP}.json"
    cp "$REPORT_FILE" "$ARCHIVE_FILE"
    echo -e "  ${GREEN}  Archived → ${ARCHIVE_FILE}${NC}"
  else
    echo -e "  ${RED}✗ Report invalid: success=${REPORT_SUCCESS}, ${PASSED}/${TOTAL} passed, ${FAILED} failed${NC}"
    echo -e "  ${RED}  The report file exists but records test failures — not an audit-grade run.${NC}"
    FAIL=$((FAIL + 1))
  fi
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}──────────────────────────────────────────────────────────${NC}"
if [ "$FAIL" -eq 0 ]; then
  echo -e "${GREEN}✅ ALL CHECKS PASSED (${PASS}/${PASS})${NC}"
  echo -e "${GREEN}   Audit verification complete — system is production-ready.${NC}"
  echo ""
  exit 0
else
  echo -e "${RED}❌ ${FAIL} CHECK(S) FAILED (${PASS} passed, ${FAIL} failed)${NC}"
  echo -e "${RED}   Fix issues above before requesting audit sign-off.${NC}"
  echo ""
  exit 1
fi
