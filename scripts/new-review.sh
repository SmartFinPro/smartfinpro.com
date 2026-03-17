#!/usr/bin/env bash
# ============================================================
# Create a new expert review MDX from the master template.
#
# Usage:
#   bash scripts/new-review.sh \
#     --market us \
#     --category debt-relief \
#     --title "Best Debt Settlement Companies 2026" \
#     --reviewed-by "James Mitchell, Bankruptcy Attorney (NACTT)" \
#     --affiliate-url "/go/national-debt-relief"
#
# Optional:
#   --slug best-debt-settlement-companies-2026
#   --author "SmartFinPro Finance Team"
#   --force
# ============================================================

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TEMPLATE="$ROOT/content/_templates/expert-review-master.mdx"

market=""
category=""
title=""
slug=""
reviewed_by="[EXPERT NAME], [ROLE + CREDENTIALS]"
affiliate_url="/go/[partner-slug]"
author="SmartFinPro Finance Team"
force="false"

usage() {
  cat <<EOF
Usage:
  bash scripts/new-review.sh --market <us|uk|ca|au> --category <slug> --title <title> [options]

Required:
  --market         us | uk | ca | au
  --category       content category slug
  --title          article title

Optional:
  --slug           explicit slug (default: generated from title)
  --reviewed-by    reviewer line for frontmatter
  --affiliate-url  affiliate URL (default: /go/[partner-slug])
  --author         author name (default: SmartFinPro Finance Team)
  --force          overwrite if file exists
  --help           show this help
EOF
}

slugify() {
  printf '%s' "$1" \
    | tr '[:upper:]' '[:lower:]' \
    | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//; s/-+/-/g'
}

is_valid_market() {
  case "$1" in
    us|uk|ca|au) return 0 ;;
    *) return 1 ;;
  esac
}

is_valid_category_for_market() {
  local m="$1"
  local c="$2"
  case "$m" in
    us)
      case "$c" in
        ai-tools|cybersecurity|personal-finance|trading|business-banking|credit-repair|debt-relief|credit-score) return 0 ;;
        *) return 1 ;;
      esac
      ;;
    uk)
      case "$c" in
        ai-tools|cybersecurity|trading|personal-finance|business-banking|remortgaging|cost-of-living|savings) return 0 ;;
        *) return 1 ;;
      esac
      ;;
    ca)
      case "$c" in
        ai-tools|cybersecurity|forex|personal-finance|business-banking|tax-efficient-investing|housing) return 0 ;;
        *) return 1 ;;
      esac
      ;;
    au)
      case "$c" in
        ai-tools|cybersecurity|trading|forex|personal-finance|business-banking|superannuation|gold-investing|savings) return 0 ;;
        *) return 1 ;;
      esac
      ;;
    *)
      return 1
      ;;
  esac
}

while [ $# -gt 0 ]; do
  case "$1" in
    --market) market="${2:-}"; shift 2 ;;
    --category) category="${2:-}"; shift 2 ;;
    --title) title="${2:-}"; shift 2 ;;
    --slug) slug="${2:-}"; shift 2 ;;
    --reviewed-by) reviewed_by="${2:-}"; shift 2 ;;
    --affiliate-url) affiliate_url="${2:-}"; shift 2 ;;
    --author) author="${2:-}"; shift 2 ;;
    --force) force="true"; shift 1 ;;
    --help|-h) usage; exit 0 ;;
    *)
      echo "Unknown option: $1"
      usage
      exit 1
      ;;
  esac
done

if [ -z "$market" ] || [ -z "$category" ] || [ -z "$title" ]; then
  echo "Error: --market, --category, and --title are required."
  usage
  exit 1
fi

if ! is_valid_market "$market"; then
  echo "Error: invalid market '$market'. Use: us, uk, ca, au."
  exit 1
fi

if ! is_valid_category_for_market "$market" "$category"; then
  echo "Error: category '$category' is not valid for market '$market'."
  exit 1
fi

if [ ! -f "$TEMPLATE" ]; then
  echo "Error: template not found at $TEMPLATE"
  exit 1
fi

if [ -z "$slug" ]; then
  slug="$(slugify "$title")"
fi

today="$(date +%F)"
target_dir="$ROOT/content/$market/$category"
target_file="$target_dir/$slug.mdx"

mkdir -p "$target_dir"

if [ -f "$target_file" ] && [ "$force" != "true" ]; then
  echo "Error: file already exists: $target_file"
  echo "Use --force to overwrite."
  exit 1
fi

escaped_title="$(printf '%s' "$title" | sed 's/[&/\]/\\&/g')"
escaped_category="$(printf '%s' "$category" | sed 's/[&/\]/\\&/g')"
escaped_market="$(printf '%s' "$market" | sed 's/[&/\]/\\&/g')"
escaped_reviewed_by="$(printf '%s' "$reviewed_by" | sed 's/[&/\]/\\&/g')"
escaped_affiliate_url="$(printf '%s' "$affiliate_url" | sed 's/[&/\]/\\&/g')"
escaped_author="$(printf '%s' "$author" | sed 's/[&/\]/\\&/g')"
escaped_today="$(printf '%s' "$today" | sed 's/[&/\]/\\&/g')"

sed \
  -e "s/\\[PRIMARY KEYWORD\\] \\[YEAR\\]: Complete Expert Review/$escaped_title/" \
  -e "s/\\[CATEGORY-SLUG\\]/$escaped_category/" \
  -e "s/\\[us|uk|ca|au\\]/$escaped_market/" \
  -e "s/\\[EXPERT NAME\\], \\[ROLE + CREDENTIALS\\]/$escaped_reviewed_by/" \
  -e "s|/go/\\[partner-slug\\]|$escaped_affiliate_url|g" \
  -e "s/author: \"SmartFinPro Finance Team\"/author: \"$escaped_author\"/" \
  -e "s/publishDate: \"2026-02-24\"/publishDate: \"$escaped_today\"/" \
  -e "s/modifiedDate: \"2026-02-24\"/modifiedDate: \"$escaped_today\"/" \
  "$TEMPLATE" > "$target_file"

# Strip any HTML comments from the generated file (MDX requires JSX comments)
sed -i '' '/^<!--.*-->$/d' "$target_file"
sed -i '' '/^<!--$/,/^-->$/d' "$target_file"

echo "✅ Created review file:"
echo "   $target_file"
echo ""
echo "Next:"
echo "  1) Fill frontmatter placeholders (description, pros/cons, pricing, sections, faqs)."
echo "  2) Replace body placeholders with your professional content."
echo ""
echo "⚠️  MDX uses JSX syntax — use {/* comment */} not <!-- comment -->"
