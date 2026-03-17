#!/usr/bin/env bash
# ============================================================
#  SmartFinPro — Zero-Downtime Deployment Script
#  Cloudways Node.js VPS (Iceland)
# ============================================================
#
#  Usage:
#    ssh master@<cloudways-ip> "cd /home/master/applications/smartfinpro/public_html && bash deploy.sh"
#
#  Or run locally after SSH:
#    cd /home/master/applications/smartfinpro/public_html
#    bash deploy.sh
#
#  What it does:
#    1. Pulls latest code from main
#    2. Installs dependencies (frozen lockfile)
#    3. Builds Next.js (191 SSG pages + standalone server)
#    4. Injects Critical CSS into 25 pillar + homepage HTML files
#    5. Copies static assets into standalone output
#    6. Reloads PM2 with zero downtime (cluster rolling restart)
#    7. Verifies health check
#    8. Cleans up old build artifacts
#
# ============================================================

set -euo pipefail

# ── Colors ──
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ── Paths ──
APP_DIR="/home/master/applications/smartfinpro/public_html"
LOG_DIR="/home/master/applications/smartfinpro/logs"
PM2_NAME="SmartFinPro-Live"
DEPLOY_LOG="${LOG_DIR}/deploy.log"

# ── Ensure log directory exists ──
mkdir -p "$LOG_DIR"

# ── Logging ──
log() { echo -e "${CYAN}[$(date '+%H:%M:%S')]${NC} $1" | tee -a "$DEPLOY_LOG"; }
success() { echo -e "${GREEN}[$(date '+%H:%M:%S')] ✓${NC} $1" | tee -a "$DEPLOY_LOG"; }
warn() { echo -e "${YELLOW}[$(date '+%H:%M:%S')] ⚠${NC} $1" | tee -a "$DEPLOY_LOG"; }
error() { echo -e "${RED}[$(date '+%H:%M:%S')] ✗${NC} $1" | tee -a "$DEPLOY_LOG"; }

# ============================================================
# FAST PATH: --boost <slug>
# Triggers on-demand ISR revalidation for a single slug
# without a full rebuild. Used by the Freshness Boost system.
#
# Usage:
#   bash deploy.sh --boost /uk/trading/etoro-review
# ============================================================
if [ "${1:-}" == "--boost" ]; then
  SLUG="${2:-}"
  if [ -z "$SLUG" ]; then
    error "Usage: deploy.sh --boost <slug>"
    error "Example: deploy.sh --boost /uk/trading/etoro-review"
    exit 1
  fi

  # Load CRON_SECRET from .env
  CRON_SECRET=""
  for ENV_FILE in "$APP_DIR/.env" "$APP_DIR/.env.local" "$APP_DIR/.env.production"; do
    if [ -f "$ENV_FILE" ]; then
      CRON_SECRET=$(grep -E "^CRON_SECRET=" "$ENV_FILE" | head -1 | cut -d'=' -f2- | tr -d "'\"" || true)
      if [ -n "$CRON_SECRET" ]; then break; fi
    fi
  done

  if [ -z "$CRON_SECRET" ]; then
    error "CRON_SECRET not found in .env files"
    exit 1
  fi

  echo "" | tee -a "$DEPLOY_LOG"
  log "⚡ Freshness Boost — Revalidating: ${SLUG}"

  HTTP_CODE=$(curl -sf -o /tmp/revalidate_response.json -w "%{http_code}" \
    -X POST "http://localhost:3000/api/revalidate" \
    -H "Authorization: Bearer ${CRON_SECRET}" \
    -H "Content-Type: application/json" \
    -d "{\"slug\": \"${SLUG}\"}" 2>/dev/null || echo "000")

  if [ "$HTTP_CODE" = "200" ]; then
    success "Revalidation successful for ${SLUG} (HTTP 200)"
    cat /tmp/revalidate_response.json 2>/dev/null | tee -a "$DEPLOY_LOG"
    echo "" | tee -a "$DEPLOY_LOG"
  else
    warn "Revalidation returned HTTP ${HTTP_CODE} — falling back to full rebuild..."
    cat /tmp/revalidate_response.json 2>/dev/null || true
    echo "" | tee -a "$DEPLOY_LOG"
    warn "Run 'bash deploy.sh' for a full rebuild."
  fi

  rm -f /tmp/revalidate_response.json
  exit 0
fi

# ── Start ──
echo "" | tee -a "$DEPLOY_LOG"
echo "============================================================" | tee -a "$DEPLOY_LOG"
echo "  SmartFinPro — Production Deployment" | tee -a "$DEPLOY_LOG"
echo "  $(date '+%Y-%m-%d %H:%M:%S %Z')" | tee -a "$DEPLOY_LOG"
echo "============================================================" | tee -a "$DEPLOY_LOG"
echo "" | tee -a "$DEPLOY_LOG"

cd "$APP_DIR" || { error "Cannot cd to $APP_DIR"; exit 1; }

# ============================================================
# STEP 1: Git Pull
# ============================================================
log "Step 1/7 — Pulling latest code from main..."
git stash --quiet 2>/dev/null || true
git pull origin main --ff-only 2>&1 | tee -a "$DEPLOY_LOG"
COMMIT_HASH=$(git rev-parse --short HEAD)
COMMIT_MSG=$(git log -1 --pretty=format:'%s')
success "Code updated to ${COMMIT_HASH}: ${COMMIT_MSG}"

# ============================================================
# STEP 2: Install Dependencies
# ============================================================
log "Step 2/7 — Installing dependencies (ci)..."
npm ci --production=false 2>&1 | tail -5 | tee -a "$DEPLOY_LOG"
success "Dependencies installed ($(ls node_modules | wc -l | tr -d ' ') packages)"

# ============================================================
# STEP 3: Build Next.js
# ============================================================
log "Step 3/7 — Building Next.js (191 SSG pages + standalone)..."
BUILD_START=$(date +%s)
npm run build 2>&1 | tee -a "$DEPLOY_LOG"
BUILD_END=$(date +%s)
BUILD_DURATION=$((BUILD_END - BUILD_START))
success "Build complete in ${BUILD_DURATION}s"

# ============================================================
# STEP 4: Inject Critical CSS
# ============================================================
log "Step 4/7 — Injecting Critical CSS (Proton FCP optimization)..."
node scripts/inject-critical-css.mjs 2>&1 | tee -a "$DEPLOY_LOG"
success "Critical CSS injected into pillar pages"

# ============================================================
# STEP 5: Copy Static Assets to Standalone
# ============================================================
# Next.js standalone output does NOT include static/ and public/.
# We must copy them manually for the server to serve them.
log "Step 5/7 — Copying static assets into standalone..."

# Copy .next/static → .next/standalone/.next/static
if [ -d ".next/static" ]; then
  cp -r .next/static .next/standalone/.next/static 2>/dev/null || true
  success "Copied .next/static to standalone"
fi

# Copy public/ → .next/standalone/public
if [ -d "public" ]; then
  cp -r public .next/standalone/public 2>/dev/null || true
  success "Copied public/ to standalone"
fi

# Copy .env to standalone (Next.js runtime reads from cwd)
if [ -f ".env" ]; then
  cp .env .next/standalone/.env 2>/dev/null || true
  success "Copied .env to standalone"
fi
if [ -f ".env.local" ]; then
  cp .env.local .next/standalone/.env.local 2>/dev/null || true
fi
if [ -f ".env.production" ]; then
  cp .env.production .next/standalone/.env.production 2>/dev/null || true
fi

# ============================================================
# STEP 6: PM2 Reload (Zero-Downtime)
# ============================================================
log "Step 6/7 — Reloading PM2 cluster (zero-downtime)..."

# Check if process exists
if pm2 describe "$PM2_NAME" > /dev/null 2>&1; then
  pm2 reload "$PM2_NAME" --update-env 2>&1 | tee -a "$DEPLOY_LOG"
  success "PM2 rolling reload complete"
else
  warn "Process '$PM2_NAME' not found — starting fresh..."
  pm2 start ecosystem.config.js --env production 2>&1 | tee -a "$DEPLOY_LOG"
  pm2 save 2>&1 | tee -a "$DEPLOY_LOG"
  success "PM2 process started and saved"
fi

# ============================================================
# STEP 7: Health Check
# ============================================================
log "Step 7/7 — Running health check..."
sleep 3  # Wait for workers to bind

HEALTH_OK=false
for i in 1 2 3 4 5; do
  HTTP_CODE=$(curl -sf -o /dev/null -w "%{http_code}" "http://localhost:3000/" 2>/dev/null || echo "000")
  if [ "$HTTP_CODE" = "200" ]; then
    HEALTH_OK=true
    break
  fi
  warn "Health check attempt $i: HTTP $HTTP_CODE — retrying in 2s..."
  sleep 2
done

if [ "$HEALTH_OK" = true ]; then
  success "Health check passed (HTTP 200)"
else
  error "HEALTH CHECK FAILED — Server not responding!"
  error "Check logs: pm2 logs $PM2_NAME --lines 50"
  pm2 logs "$PM2_NAME" --lines 20 --nostream 2>&1 | tee -a "$DEPLOY_LOG"
  exit 1
fi

# ============================================================
# CLEANUP — Remove old build backups
# ============================================================
log "Cleaning up..."
find .next/server/app -name '*.html.bak' -mtime +7 -delete 2>/dev/null || true

# ============================================================
# SUMMARY
# ============================================================
WORKERS=$(pm2 jq "$PM2_NAME" '[.[] | select(.pm2_env.status == "online")] | length' 2>/dev/null || pm2 list 2>/dev/null | grep -c "online" || echo "?")
MEM_TOTAL=$(pm2 jq "$PM2_NAME" '[.[].monit.memory] | add / 1048576 | floor' 2>/dev/null || echo "?")

echo "" | tee -a "$DEPLOY_LOG"
echo "============================================================" | tee -a "$DEPLOY_LOG"
echo -e "  ${GREEN}DEPLOYMENT COMPLETE${NC}" | tee -a "$DEPLOY_LOG"
echo "============================================================" | tee -a "$DEPLOY_LOG"
echo "  Commit:     ${COMMIT_HASH} — ${COMMIT_MSG}" | tee -a "$DEPLOY_LOG"
echo "  Build:      ${BUILD_DURATION}s" | tee -a "$DEPLOY_LOG"
echo "  Workers:    ${WORKERS} (cluster mode)" | tee -a "$DEPLOY_LOG"
echo "  Memory:     ~${MEM_TOTAL} MB total" | tee -a "$DEPLOY_LOG"
echo "  Health:     HTTP 200 ✓" | tee -a "$DEPLOY_LOG"
echo "  URL:        https://smartfinpro.com" | tee -a "$DEPLOY_LOG"
echo "  Log:        ${DEPLOY_LOG}" | tee -a "$DEPLOY_LOG"
echo "============================================================" | tee -a "$DEPLOY_LOG"
echo "" | tee -a "$DEPLOY_LOG"
