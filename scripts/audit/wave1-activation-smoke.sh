#!/bin/bash
# Wave 1 Activation Smoke Test — rate-limit-safe
# Verifies all 18 slugs resolve to non-homepage destinations via live CDN.
# Expected: 18× 307 to partner domains, 0× fallback to /, 0× 429.
# Rate limit: 10 req/min per IP (lib/security/rate-limit.ts:126)
#   → sleep 7s between requests → ≈ 8.5 req/min (safe under limit).
# Route exports only GET (no HEAD handler) → curl uses GET but discards body.

set -u
BASE=${BASE:-https://smartfinpro.com}
SLUGS=(
  wise-business mercury relay oanda revolut-business plus500 ic-markets novo
  interactive-brokers ig-uk tide
  interactive-brokers-forex interactive-brokers-au
  ig-markets ig-markets-forex ig-markets-au
  plus500-uk plus500-au
)

PASS=0; FAIL=0; RL=0
for i in "${!SLUGS[@]}"; do
  SLUG=${SLUGS[$i]}
  # GET + discard body; --max-redirs 0 stops curl from following the 307 so
  # we can inspect Location. %{redirect_url} is the Location-header target.
  RESP=$(curl -s -o /dev/null --max-redirs 0 \
    -w "%{http_code}|%{redirect_url}" \
    -H "User-Agent: Mozilla/5.0" \
    "$BASE/go/$SLUG/")
  CODE=${RESP%%|*}
  LOC=${RESP##*|}

  case "$CODE" in
    307|302|301)
      if [[ -z "$LOC" || "$LOC" == "$BASE/" || "$LOC" == "$BASE" ]]; then
        echo "❌ FAIL: $SLUG → $CODE homepage fallback"
        FAIL=$((FAIL+1))
      elif [[ "$LOC" == *"$BASE"* ]]; then
        echo "❌ FAIL: $SLUG → $CODE internal redirect ($LOC) — destination not allowlisted?"
        FAIL=$((FAIL+1))
      else
        echo "✅ $SLUG → $LOC"
        PASS=$((PASS+1))
      fi
      ;;
    429)
      echo "⚠ RATE-LIMITED: $SLUG (429) — sleep interval too short"
      RL=$((RL+1))
      ;;
    *)
      echo "❌ FAIL: $SLUG → HTTP $CODE"
      FAIL=$((FAIL+1))
      ;;
  esac

  # Rate-limit guard. Skip sleep on last iteration.
  if (( i < ${#SLUGS[@]} - 1 )); then sleep 7; fi
done

echo ""
echo "Result: $PASS passed, $FAIL failed, $RL rate-limited (of ${#SLUGS[@]} total)"
exit $((FAIL + RL > 0 ? 1 : 0))
