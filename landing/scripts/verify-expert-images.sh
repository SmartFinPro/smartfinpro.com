#!/usr/bin/env bash
# ============================================================
# Verify expert portrait images
#
# Rules:
# - Required expert files must exist in public/images/experts
# - File extension must be .jpg
# - Encoded format must be JPEG (no disguised SVG/PNG)
# - Dimensions must be exactly 640x480
# - File size should stay <= 150 KB
#
# Usage: bash scripts/verify-expert-images.sh
# Exit code: 0 = pass, 1 = violations found
# ============================================================

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
EXPERT_DIR="$ROOT/public/images/experts"
MAX_BYTES=153600
VIOLATIONS=0

REQUIRED_FILES=(
  "james-miller.jpg"
  "michael-torres.jpg"
  "robert-hayes.jpg"
  "james-mitchell.jpg"
  "michael-chen.jpg"
  "sarah-chen.jpg"
  "sarah-thompson.jpg"
  "james-blackwood.jpg"
  "marc-fontaine.jpg"
  "philippe-leblanc.jpg"
  "daniel-whitfield.jpg"
  "james-liu.jpg"
)

if [ ! -d "$EXPERT_DIR" ]; then
  echo "❌ Missing directory: $EXPERT_DIR"
  exit 1
fi

check_file() {
  local file="$1"
  local path="$EXPERT_DIR/$file"

  if [ ! -f "$path" ]; then
    echo "❌ Missing required file: $file"
    VIOLATIONS=$((VIOLATIONS + 1))
    return
  fi

  if [[ "$file" != *.jpg ]]; then
    echo "❌ Invalid extension (must be .jpg): $file"
    VIOLATIONS=$((VIOLATIONS + 1))
  fi

  local format width height bytes
  format="$(sips -g format "$path" 2>/dev/null | awk -F': ' '/format:/ {print tolower($2)}')"
  width="$(sips -g pixelWidth "$path" 2>/dev/null | awk -F': ' '/pixelWidth:/ {print $2}')"
  height="$(sips -g pixelHeight "$path" 2>/dev/null | awk -F': ' '/pixelHeight:/ {print $2}')"
  bytes="$(stat -f%z "$path" 2>/dev/null || echo 0)"

  if [ "$format" != "jpeg" ]; then
    echo "❌ Not a JPEG file: $file (detected: ${format:-unknown})"
    VIOLATIONS=$((VIOLATIONS + 1))
  fi

  if [ "$width" != "640" ] || [ "$height" != "480" ]; then
    echo "❌ Wrong dimensions: $file (${width:-?}x${height:-?}, expected 640x480)"
    VIOLATIONS=$((VIOLATIONS + 1))
  fi

  if [ "$bytes" -gt "$MAX_BYTES" ]; then
    echo "❌ File too large: $file (${bytes} bytes, max $MAX_BYTES)"
    VIOLATIONS=$((VIOLATIONS + 1))
  fi
}

for required in "${REQUIRED_FILES[@]}"; do
  check_file "$required"
done

if [ "$VIOLATIONS" -gt 0 ]; then
  echo "⚠️  Expert image verification failed with $VIOLATIONS issue(s)."
  exit 1
fi

echo "✅ Expert image verification passed (${#REQUIRED_FILES[@]} required portraits)."
