#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════
# fix-cache.sh — Eliminates stale Turbopack / Next.js cache
#
# Fixes: ChunkLoadError, module factory not available, HMR hangs
#
# Usage:
#   ./bin/fix-cache.sh          # clean cache only
#   ./bin/fix-cache.sh --restart # clean cache + restart dev server
# ════════════════════════════════════════════════════════════════

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${PORT:-3000}"

echo "🧹 SmartFinPro Cache Cleanup"
echo "──────────────────────────────"

# 1. Kill any zombie processes on the dev port
PIDS=$(lsof -ti:"$PORT" 2>/dev/null || true)
if [ -n "$PIDS" ]; then
  echo "⚠  Killing processes on port $PORT: $PIDS"
  echo "$PIDS" | xargs kill -9 2>/dev/null || true
  sleep 1
else
  echo "✓  Port $PORT is free"
fi

# 2. Remove .next build cache
if [ -d "$PROJECT_DIR/.next" ]; then
  rm -rf "$PROJECT_DIR/.next"
  echo "✓  Removed .next cache"
else
  echo "✓  No .next cache found"
fi

# 3. Remove stale lock file
if [ -f "$PROJECT_DIR/.next/dev/lock" ]; then
  rm -f "$PROJECT_DIR/.next/dev/lock"
  echo "✓  Removed stale lock file"
fi

# 4. Clean Turbopack persistent cache if exists
if [ -d "$PROJECT_DIR/.next/cache" ]; then
  rm -rf "$PROJECT_DIR/.next/cache"
  echo "✓  Removed Turbopack persistent cache"
fi

echo "──────────────────────────────"
echo "✅ Cache cleanup complete"

# 5. Optionally restart dev server
if [ "${1:-}" = "--restart" ]; then
  echo ""
  echo "🚀 Starting dev server..."
  cd "$PROJECT_DIR"
  npm run dev
fi
