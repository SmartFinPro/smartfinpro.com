#!/bin/bash
# ─────────────────────────────────────────────────────────────────
# process-evidence-images.sh
# Converts raw screenshots into optimized WebP for Evidence Carousel
#
# Usage:
#   1) Put source images into: raw-evidence/[provider]-[market]/
#      Example: raw-evidence/revolut-au/01-onboarding.png
#   2) Run: bash scripts/process-evidence-images.sh [provider] [market]
#      Example: bash scripts/process-evidence-images.sh revolut au
#   3) Optimized output: public/images/evidence/[provider]-[market]/
#
# Requirements: sharp-cli (preferred) OR cwebp+sips (fallback)
# ─────────────────────────────────────────────────────────────────

set -euo pipefail

PROVIDER="${1:-revolut}"
MARKET="${2:-au}"
SLUG="${PROVIDER}-${MARKET}"
INPUT_DIR="raw-evidence/${SLUG}"
OUTPUT_DIR="public/images/evidence/${SLUG}"
MANIFEST_PATH="${OUTPUT_DIR}/manifest.json"
WIDTH=1600
QUALITY=80

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}━━━ Evidence Image Processor ━━━${NC}"
echo "Provider: ${PROVIDER} | Market: ${MARKET}"
echo "Input:    ${INPUT_DIR}/"
echo "Output:   ${OUTPUT_DIR}/"
echo ""

# Check input directory
if [ ! -d "$INPUT_DIR" ]; then
  echo -e "${YELLOW}Creating input directory: ${INPUT_DIR}/${NC}"
  mkdir -p "$INPUT_DIR"
  echo -e "${RED}No images found. Drop your raw screenshots into ${INPUT_DIR}/ and re-run.${NC}"
  echo ""
  echo "Expected naming:"
  echo "  01-onboarding.png"
  echo "  02-dashboard.png"
  echo "  03-fx-conversion.png"
  echo "  04-fx-allowance.png"
  echo "  05-bpay.png"
  echo "  06-intl-transfer.png"
  echo "  07-cards.png"
  echo "  08-analytics.png"
  echo "  09-mobile.png"
  echo "  10-xero.png"
  exit 1
fi

# Count input files
FILE_COUNT=$(find "$INPUT_DIR" -maxdepth 1 \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.PNG" -o -name "*.JPG" \) | wc -l | tr -d ' ')

if [ "$FILE_COUNT" -eq 0 ]; then
  echo -e "${RED}No images found in ${INPUT_DIR}/. Supported formats: PNG, JPG${NC}"
  exit 1
fi

echo -e "Found ${GREEN}${FILE_COUNT}${NC} images to process"
echo ""

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Determine tool
if command -v npx &>/dev/null && npx --yes sharp-cli --version &>/dev/null 2>&1; then
  TOOL="sharp"
elif command -v cwebp &>/dev/null; then
  TOOL="cwebp"
elif command -v sips &>/dev/null; then
  TOOL="sips"
else
  echo -e "${YELLOW}No image tool found. Installing sharp...${NC}"
  npm install -g sharp-cli 2>/dev/null || true
  TOOL="sips"  # macOS fallback
fi

echo "Using tool: ${TOOL}"
echo ""

# Process each image
PROCESSED=0
for img in "$INPUT_DIR"/*.{png,jpg,jpeg,PNG,JPG} 2>/dev/null; do
  [ -f "$img" ] || continue

  # Extract number and name from filename
  basename_with_ext=$(basename "$img")
  name_part="${basename_with_ext%.*}"
  # keep only [a-z0-9-] for stable file names
  name_part=$(echo "$name_part" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9-]+/-/g; s/^-+//; s/-+$//; s/-+/-/g')

  # Output filename: revolut-au-01-onboarding.webp
  output_name="${SLUG}-${name_part}.webp"
  output_path="${OUTPUT_DIR}/${output_name}"

  echo -n "  Processing: ${basename_with_ext} → ${output_name} ... "

  case "$TOOL" in
    sharp)
      npx --yes sharp-cli -i "$img" -o "$output_path" \
        resize "$WIDTH" --withoutEnlargement \
        webp --quality "$QUALITY" 2>/dev/null
      ;;
    cwebp)
      # First resize with sips (macOS), then convert
      TMP="/tmp/evidence_resize_${name_part}.png"
      sips --resampleWidth "$WIDTH" "$img" --out "$TMP" 2>/dev/null
      cwebp -q "$QUALITY" "$TMP" -o "$output_path" 2>/dev/null
      rm -f "$TMP"
      ;;
    sips)
      # macOS fallback: resize with sips, keep as JPEG/PNG (no WebP)
      # User should install cwebp for WebP support
      output_name="${SLUG}-${name_part}.jpg"
      output_path="${OUTPUT_DIR}/${output_name}"
      sips --resampleWidth "$WIDTH" -s formatOptions "$QUALITY" "$img" --out "$output_path" 2>/dev/null
      ;;
  esac

  if [ -f "$output_path" ]; then
    SIZE=$(du -h "$output_path" | cut -f1)
    echo -e "${GREEN}✓${NC} (${SIZE})"
    PROCESSED=$((PROCESSED + 1))
  else
    echo -e "${RED}✗ Failed${NC}"
  fi
done

# Generate a minimal manifest template (kept transparent for editorial workflow)
if [ "$PROCESSED" -gt 0 ]; then
  {
    echo "{"
    echo "  \"provider\": \"${PROVIDER}\","
    echo "  \"market\": \"${MARKET}\","
    echo "  \"generatedAt\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\","
    echo "  \"items\": ["
    i=0
    for file in "${OUTPUT_DIR}"/${SLUG}-*; do
      [ -f "$file" ] || continue
      base=$(basename "$file")
      if [ $i -gt 0 ]; then
        echo "    ,{"
      else
        echo "    {"
      fi
      echo "      \"file\": \"${base}\","
      echo "      \"alt\": \"${PROVIDER} ${MARKET^^} interface screenshot\","
      echo "      \"caption\": \"Add factual caption (what is shown + test context)\","
      echo "      \"source\": \"Own test session\""
      echo "    }"
      i=$((i + 1))
    done
    echo "  ]"
    echo "}"
  } > "$MANIFEST_PATH"
fi

echo ""
echo -e "${GREEN}━━━ Done! Processed ${PROCESSED}/${FILE_COUNT} images ━━━${NC}"
echo ""
echo "Output files:"
ls -lh "$OUTPUT_DIR"/${SLUG}-* 2>/dev/null || echo "  (none)"
echo ""
echo "Manifest:"
echo "  ${MANIFEST_PATH}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Review images in ${OUTPUT_DIR}/"
echo "  2. Add accurate alt/captions in ${MANIFEST_PATH}"
echo "  3. Blur sensitive data if needed (Preview.app > Annotate)"
echo "  4. Update the MDX file with correct filenames"
echo "  4. Run: npm run build"
