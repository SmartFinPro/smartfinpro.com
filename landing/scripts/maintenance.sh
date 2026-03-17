#!/bin/bash
# ============================================================
# SmartFinPro — Maintenance Script (Cloudways VPS)
# ============================================================
# Usage:
#   ./scripts/maintenance.sh backup     — Create full backup
#   ./scripts/maintenance.sh deploy     — Pull, build & reload
#   ./scripts/maintenance.sh logs       — Tail combined logs
#   ./scripts/maintenance.sh status     — Health check
#   ./scripts/maintenance.sh rotate     — Rotate log files
#   ./scripts/maintenance.sh cleanup    — Remove old builds & backups
# ============================================================

set -euo pipefail

# ---- Configuration ----
APP_NAME="smartfinpro"
APP_DIR="/home/master/applications/${APP_NAME}/public_html"
BACKUP_DIR="/home/master/backups/${APP_NAME}"
LOG_DIR="/home/master/applications/${APP_NAME}/logs"
RETAIN_BACKUPS=7     # Keep last 7 backups
RETAIN_LOGS_DAYS=30  # Rotate logs older than 30 days
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# ---- Colors ----
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info()  { echo -e "${CYAN}[INFO]${NC}  $(date '+%H:%M:%S') $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC}    $(date '+%H:%M:%S') $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $(date '+%H:%M:%S') $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $(date '+%H:%M:%S') $1"; }

# ============================================================
# BACKUP
# ============================================================
do_backup() {
  log_info "Starting backup..."
  mkdir -p "${BACKUP_DIR}"

  local BACKUP_FILE="${BACKUP_DIR}/${APP_NAME}_${TIMESTAMP}.tar.gz"

  # Backup: source code + .env + .next + PM2 config (exclude node_modules)
  tar -czf "${BACKUP_FILE}" \
    --exclude='node_modules' \
    --exclude='.next/cache' \
    -C "$(dirname "${APP_DIR}")" \
    "$(basename "${APP_DIR}")" \
    2>/dev/null

  local SIZE=$(du -sh "${BACKUP_FILE}" | cut -f1)
  log_ok "Backup created: ${BACKUP_FILE} (${SIZE})"

  # Remove old backups beyond retention
  local COUNT=$(ls -1 "${BACKUP_DIR}"/${APP_NAME}_*.tar.gz 2>/dev/null | wc -l)
  if [ "${COUNT}" -gt "${RETAIN_BACKUPS}" ]; then
    local TO_DELETE=$((COUNT - RETAIN_BACKUPS))
    ls -1t "${BACKUP_DIR}"/${APP_NAME}_*.tar.gz | tail -n "${TO_DELETE}" | xargs rm -f
    log_info "Removed ${TO_DELETE} old backup(s). Keeping last ${RETAIN_BACKUPS}."
  fi
}

# ============================================================
# DEPLOY (git pull + build + zero-downtime reload)
# ============================================================
do_deploy() {
  log_info "Starting deployment..."
  cd "${APP_DIR}"

  # 1. Backup before deploy
  do_backup

  # 2. Pull latest code
  log_info "Pulling latest code from git..."
  git pull --ff-only origin main
  log_ok "Git pull complete."

  # 3. Install dependencies
  log_info "Installing dependencies..."
  npm ci --production=false
  log_ok "Dependencies installed."

  # 4. Build
  log_info "Building production bundle..."
  NODE_ENV=production npm run build
  log_ok "Build complete."

  # 5. Zero-downtime reload via PM2
  log_info "Reloading application (zero-downtime)..."
  pm2 reload "${APP_NAME}" --update-env
  log_ok "Application reloaded."

  # 6. Health check
  sleep 3
  do_status
}

# ============================================================
# LOGS
# ============================================================
do_logs() {
  log_info "Tailing logs (Ctrl+C to exit)..."
  pm2 logs "${APP_NAME}" --lines 50
}

# ============================================================
# STATUS / HEALTH CHECK
# ============================================================
do_status() {
  echo ""
  log_info "=== SmartFinPro Health Check ==="
  echo ""

  # PM2 status
  pm2 describe "${APP_NAME}" > /dev/null 2>&1
  if [ $? -eq 0 ]; then
    log_ok "PM2 process is running"
    pm2 show "${APP_NAME}" | grep -E "status|cpu|memory|uptime|restarts" | head -6
  else
    log_error "PM2 process is NOT running"
  fi

  echo ""

  # HTTP health check
  local HTTP_CODE=$(curl -sf -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null || echo "000")
  if [ "${HTTP_CODE}" = "200" ]; then
    log_ok "HTTP health: ${HTTP_CODE} OK"
  else
    log_error "HTTP health: ${HTTP_CODE} — Service may be down"
  fi

  # Disk usage
  echo ""
  local DISK_USAGE=$(du -sh "${APP_DIR}" 2>/dev/null | cut -f1)
  local LOG_SIZE=$(du -sh "${LOG_DIR}" 2>/dev/null | cut -f1)
  log_info "App disk usage: ${DISK_USAGE}"
  log_info "Log disk usage: ${LOG_SIZE}"

  # Backup count
  local BACKUP_COUNT=$(ls -1 "${BACKUP_DIR}"/${APP_NAME}_*.tar.gz 2>/dev/null | wc -l)
  log_info "Backups stored: ${BACKUP_COUNT} (retaining last ${RETAIN_BACKUPS})"

  echo ""
}

# ============================================================
# LOG ROTATION
# ============================================================
do_rotate() {
  log_info "Rotating logs..."
  mkdir -p "${LOG_DIR}/archive"

  # Archive current PM2 logs
  pm2 flush "${APP_NAME}" 2>/dev/null || true

  # Compress and archive old logs
  find "${LOG_DIR}" -maxdepth 1 -name "*.log" -size +10M -exec gzip {} \;
  find "${LOG_DIR}" -maxdepth 1 -name "*.gz" -exec mv {} "${LOG_DIR}/archive/" \;

  # Remove archived logs older than retention period
  find "${LOG_DIR}/archive" -name "*.gz" -mtime +${RETAIN_LOGS_DAYS} -delete 2>/dev/null || true

  log_ok "Log rotation complete."
}

# ============================================================
# CLEANUP (old builds, caches)
# ============================================================
do_cleanup() {
  log_info "Cleaning up..."
  cd "${APP_DIR}"

  # Clear Next.js cache
  rm -rf .next/cache
  log_ok "Next.js cache cleared."

  # Clear npm cache
  npm cache clean --force 2>/dev/null || true
  log_ok "npm cache cleared."

  # Rotate logs
  do_rotate

  log_ok "Cleanup complete."
}

# ============================================================
# MAIN
# ============================================================
case "${1:-help}" in
  backup)   do_backup ;;
  deploy)   do_deploy ;;
  logs)     do_logs ;;
  status)   do_status ;;
  rotate)   do_rotate ;;
  cleanup)  do_cleanup ;;
  *)
    echo ""
    echo "SmartFinPro Maintenance Script"
    echo "=============================="
    echo ""
    echo "Usage: $0 {backup|deploy|logs|status|rotate|cleanup}"
    echo ""
    echo "  backup   — Create timestamped backup (keeps last ${RETAIN_BACKUPS})"
    echo "  deploy   — Pull, build & zero-downtime reload"
    echo "  logs     — Tail PM2 application logs"
    echo "  status   — Health check (PM2, HTTP, disk)"
    echo "  rotate   — Compress & archive old log files"
    echo "  cleanup  — Remove caches & old logs"
    echo ""
    ;;
esac
