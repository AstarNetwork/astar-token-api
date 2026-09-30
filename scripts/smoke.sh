#!/usr/bin/env bash
# Smoke test the token API against a deployment.
#
# Usage: scripts/smoke.sh <base-url>
#   Emulator: scripts/smoke.sh http://127.0.0.1:5001/astar-token-api/us-central1/app/api
#   Staging:  scripts/smoke.sh https://astar-token-api-staging.web.app/api
#   Prod:     scripts/smoke.sh https://api.astar.network/api
set -uo pipefail

BASE="${1:?base url required, e.g. https://api.astar.network/api}"
BASE="${BASE%/}"
FAILED=0

# check <path> <expected status> [jq assertion on the body]
check() {
    local path="$1" expected="$2" assertion="${3:-}"
    local response body status
    response="$(curl -s -m 60 -w $'\n%{http_code}' "$BASE/$path")"
    status="${response##*$'\n'}"
    body="${response%$'\n'*}"

    if [[ "$status" != "$expected" ]]; then
        printf 'FAIL %-58s status %s, expected %s: %.120s\n' "$path" "$status" "$expected" "$body"
        FAILED=1
    elif [[ -n "$assertion" ]] && ! jq -e "$assertion" <<<"$body" >/dev/null 2>&1; then
        printf 'FAIL %-58s assertion "%s": %.120s\n' "$path" "$assertion" "$body"
        FAILED=1
    else
        printf 'ok   %-58s %s\n' "$path" "$status"
    fi
}

# Token stats consumed by CoinGecko / CMC and the portal.
check 'v1/astar/token/circulation' 200 '. > 0'
check 'astar/token/stats' 200 '.circulatingSupply > 0'
check 'v1/shiden/token/circulation' 200 '. > 0'
check 'v1/token/price/ASTR' 200 '. > 0'
check 'v1/astar/token/extendedstats' 200 '.[0].price > 0'

# dApp staking routes kept after the indexer retirement.
for network in astar shiden shibuya; do
    check "v3/$network/dapps-staking/chaindapps" 200 \
        'map(select(.state == "Registered")) | length > 0 and length <= 16'
    check "v3/$network/dapps-staking/get-period-range/1" 200 '.start > 0 and .end > .start'
done
check 'v3/astar/dapps-staking/stake-info/YYd75rUp18RPGa7NSeDX1hEKFo35o4rPcceseiFnSYopidY' 200

# Portal dApp registry (Firebase).
check 'v1/astar/dapps-staking/dappssimple' 200 'length > 0'

# Routes retired with the indexer must answer 410.
check 'v3/astar/dapps-staking/stakerslist/0x0000000000000000000000000000000000000000' 410
check 'v3/astar/dapps-staking/tvl/7%20days' 410
check 'v3/astar/dapps-staking/period-aggregated/1' 410
check 'v1/astar/dapps-staking/tvl/7%20days' 410
check 'v1/astar/burn/events' 410
check 'v1/astar/token/supply-history' 410

exit "$FAILED"
