#!/usr/bin/env bash
# ============================================================
#  PM2 Log Rotation Setup — SmartFinPro
#  Run ONCE on the Cloudways server after first deployment.
# ============================================================
#
#  Usage:
#    bash scripts/setup-logrotate.sh
#
#  What it does:
#    1. Installs pm2-logrotate module
#    2. Configures rotation thresholds
#    3. Verifies configuration
#
# ============================================================

set -euo pipefail

echo ""
echo "============================================================"
echo "  PM2 Log Rotation — Setup"
echo "============================================================"
echo ""

# ── Step 1: Install pm2-logrotate ──
echo "[1/3] Installing pm2-logrotate..."
pm2 install pm2-logrotate 2>&1

# ── Step 2: Configure rotation parameters ──
echo ""
echo "[2/3] Configuring rotation..."

# Rotate when log file exceeds 50 MB
pm2 set pm2-logrotate:max_size 50M

# Keep last 10 rotated files (10 × 50 MB = 500 MB max disk for logs)
pm2 set pm2-logrotate:retain 10

# Compress rotated logs with gzip
pm2 set pm2-logrotate:compress true

# Check for rotation every 60 seconds
pm2 set pm2-logrotate:workerInterval 60

# Rotate on a daily schedule as well (midnight)
pm2 set pm2-logrotate:rotateInterval '0 0 * * *'

# Date format for rotated file names
pm2 set pm2-logrotate:dateFormat 'YYYY-MM-DD_HH-mm-ss'

# ── Step 3: Verify configuration ──
echo ""
echo "[3/3] Verifying configuration..."
pm2 conf pm2-logrotate 2>&1

echo ""
echo "============================================================"
echo "  Log Rotation Configured:"
echo "    Max file size:   50 MB"
echo "    Retained files:  10 (max ~500 MB disk)"
echo "    Compression:     gzip"
echo "    Daily rotation:  midnight"
echo "    Check interval:  60s"
echo "============================================================"
echo ""
echo "  Logs location:"
echo "    /home/master/applications/smartfinpro/logs/access.log"
echo "    /home/master/applications/smartfinpro/logs/error.log"
echo ""
echo "  Monitor: pm2 logs SmartFinPro-Live --lines 50"
echo ""
