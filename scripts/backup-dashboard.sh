#!/bin/bash
# ============================================================
# SmartFinPro — Dashboard & Core Backup Script
# ============================================================
# Creates a timestamped snapshot of all critical platform files:
#   • Dashboard pages + components
#   • API routes (cron, genesis, tracking, webhooks)
#   • Server actions (lib/actions/)
#   • Supabase client + migrations
#   • SEO quality guards
#   • Platform config files
#
# Usage:
#   bash scripts/backup-dashboard.sh              # Standard backup
#   bash scripts/backup-dashboard.sh --clean      # Backup + remove old (>30 days)
#   bash scripts/backup-dashboard.sh --list       # List existing backups
#
# Backups are stored in: backups/dashboard/
# (gitignored — kept only locally)
# ============================================================

set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="$ROOT/backups/dashboard"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="smartfinpro_core_${TIMESTAMP}"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

# ── List mode ─────────────────────────────────────────────
if [[ "$1" == "--list" ]]; then
  echo -e "\n${BLUE}${BOLD}SmartFinPro Backups (${BACKUP_DIR}):${NC}\n"
  if [ -d "$BACKUP_DIR" ]; then
    ls -lh "$BACKUP_DIR"/*.tar.gz 2>/dev/null || echo "  No backups found."
  else
    echo "  Backup directory does not exist yet."
  fi
  echo ""
  exit 0
fi

# ── Create backup directory ────────────────────────────────
mkdir -p "$BACKUP_DIR"

echo -e "\n${BLUE}${BOLD}SmartFinPro — Core Backup${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  Timestamp : ${TIMESTAMP}"
echo -e "  Output    : ${BACKUP_PATH}.tar.gz"
echo ""

# ── Define what to back up ────────────────────────────────
INCLUDE_PATHS=(
  "app/(dashboard)"
  "components/dashboard"
  "app/api"
  "lib/actions"
  "lib/supabase"
  "lib/alerts"
  "lib/claude"
  "lib/actions/tracking.ts"
  "lib/actions/indexing.ts"
  "lib/seo"
  "supabase/migrations"
  "supabase/schema.sql"
  "scripts/seo-baseline.json"
  "scripts/check-seo-quality.mjs"
  "scripts/backup-dashboard.sh"
  ".claude/settings.json"
  "next.config.ts"
  "package.json"
  "ecosystem.config.js"
  "CLAUDE.md"
)

# ── Build tar arguments ───────────────────────────────────
TAR_ARGS=()
for path in "${INCLUDE_PATHS[@]}"; do
  if [ -e "$ROOT/$path" ]; then
    TAR_ARGS+=("$path")
    echo -e "  ${GREEN}✓${NC} $path"
  else
    echo -e "  ${YELLOW}⚠${NC} Skipped (not found): $path"
  fi
done

echo ""

# ── Create archive ─────────────────────────────────────────
cd "$ROOT"
tar -czf "${BACKUP_PATH}.tar.gz" "${TAR_ARGS[@]}" 2>/dev/null

SIZE=$(du -sh "${BACKUP_PATH}.tar.gz" | cut -f1)
FILE_COUNT=$(tar -tzf "${BACKUP_PATH}.tar.gz" | wc -l | tr -d ' ')

echo -e "${GREEN}${BOLD}✓ Backup created successfully${NC}"
echo -e "  Size      : ${SIZE}"
echo -e "  Files     : ${FILE_COUNT}"
echo -e "  Location  : backups/dashboard/${BACKUP_NAME}.tar.gz"
echo ""

# ── Clean old backups (>30 days) ──────────────────────────
if [[ "$1" == "--clean" ]]; then
  echo -e "${YELLOW}Cleaning backups older than 30 days...${NC}"
  find "$BACKUP_DIR" -name "*.tar.gz" -mtime +30 -delete
  REMAINING=$(ls "$BACKUP_DIR"/*.tar.gz 2>/dev/null | wc -l)
  echo -e "  Remaining backups: ${REMAINING}"
  echo ""
fi

# ── Show restore instructions ─────────────────────────────
echo -e "${BLUE}To restore this backup:${NC}"
echo "  cd $(dirname $ROOT)"
echo "  tar -xzf ${BACKUP_PATH}.tar.gz"
echo ""
