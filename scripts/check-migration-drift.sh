#!/usr/bin/env bash
# scripts/check-migration-drift.sh
# Verify that all local migration files have been applied to Supabase.
#
# Usage: bash scripts/check-migration-drift.sh
#        npm run check:migrations
#
# Requires: SUPABASE_DB_URL or (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_KEY)
# Exit 0 = all migrations applied, Exit 1 = drift detected

set -euo pipefail

MIGRATIONS_DIR="supabase/migrations"

# ── Collect local migration files ────────────────────────────────────
LOCAL_FILES=$(ls "$MIGRATIONS_DIR"/*.sql 2>/dev/null | xargs -I{} basename {} .sql | sort)
LOCAL_COUNT=$(echo "$LOCAL_FILES" | wc -l | tr -d ' ')

if [ "$LOCAL_COUNT" -eq 0 ]; then
  echo "No local migrations found in $MIGRATIONS_DIR/"
  exit 0
fi

echo "Local migrations: $LOCAL_COUNT files"
echo ""

# ── Check remote (Supabase) migration history ───────────────────────
# Try direct DB connection first, fall back to REST API
if [ -n "${SUPABASE_DB_URL:-}" ]; then
  echo "Checking via direct DB connection..."
  APPLIED=$(psql "$SUPABASE_DB_URL" -t -A -c \
    "SELECT name FROM supabase_migrations.schema_migrations ORDER BY name;" 2>/dev/null || echo "")
elif [ -n "${NEXT_PUBLIC_SUPABASE_URL:-}" ] && [ -n "${SUPABASE_SERVICE_KEY:-}" ]; then
  echo "Checking via Supabase REST API..."
  APPLIED=$(curl -sf \
    "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/get_applied_migrations" \
    -H "apikey: ${SUPABASE_SERVICE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
    -H "Content-Type: application/json" \
    -d '{}' 2>/dev/null | grep -oP '"[0-9]{14}_[^"]*"' | tr -d '"' | sort || echo "")
else
  echo "WARNING: No DB connection available. Listing local migrations only."
  echo ""
  echo "$LOCAL_FILES" | while read -r f; do echo "  [?] $f"; done
  echo ""
  echo "Set SUPABASE_DB_URL or (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_KEY) for remote check."
  exit 0
fi

# ── Compare ──────────────────────────────────────────────────────────
DRIFT=0

echo ""
echo "Migration Status:"
echo "─────────────────────────────────────────────────────────"

while read -r migration; do
  if echo "$APPLIED" | grep -q "^${migration}$"; then
    echo "  [OK] $migration"
  else
    echo "  [!!] $migration  ← NOT APPLIED"
    DRIFT=1
  fi
done <<< "$LOCAL_FILES"

echo "─────────────────────────────────────────────────────────"
echo ""

if [ "$DRIFT" -eq 1 ]; then
  echo "DRIFT DETECTED: Some migrations are not applied."
  echo "Run: npx supabase db push"
  exit 1
else
  echo "All $LOCAL_COUNT migrations applied."
  exit 0
fi
