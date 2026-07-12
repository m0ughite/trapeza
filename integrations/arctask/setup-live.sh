#!/usr/bin/env bash
# Orchestrate ArcTask full live setup (run from trapeza repo root).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ARCTASK="${ARCTASK_DIR:-$(dirname "$ROOT")/ArcTask}"
PATCHES="$ROOT/integrations/arctask/patches"

die() { echo "error: $*" >&2; exit 1; }

require_balance() {
  local addr="$1" label="$2"
  local bal
  bal="$(node -e "
    import { createPublicClient, http, formatEther } from 'viem';
    const c = createPublicClient({ chain: { id: 5042002, rpcUrls: { default: { http: ['https://rpc.testnet.arc.network'] } } }, transport: http() });
    const b = await c.getBalance({ address: '$addr' });
    console.log(formatEther(b));
  ")"
  echo "  $label ($addr): $bal USDC"
  if [[ "$bal" == "0" ]]; then
    echo ""
    echo "Fund $label at https://faucet.circle.com/ (Arc Testnet, USDC)"
    return 1
  fi
  return 0
}

echo "=== ArcTask live setup ==="
echo "trapeza: $ROOT"
echo "ArcTask: $ARCTASK"
echo ""

[[ -d "$ARCTASK" ]] || die "ArcTask clone missing at $ARCTASK — run: git clone https://github.com/VadymManiuk/ArcTask.git $(dirname "$ROOT")/ArcTask"

if [[ ! -f "$ARCTASK/contracts/ArcTaskEscrowErc20.sol" ]]; then
  echo "Applying Trapeza patches..."
  "$PATCHES/apply-to-fork.sh" "$ARCTASK"
fi

# shellcheck disable=SC1091
[[ -f "$ROOT/.env" ]] || die "Missing $ROOT/.env — copy .env.example and set wallet keys"
set -a
# shellcheck disable=SC1090
source "$ROOT/.env"
set +a

OWNER_ADDR="$(node -e "import { privateKeyToAccount } from 'viem/accounts'; console.log(privateKeyToAccount('$OWNER_PRIVATE_KEY').address)")"
BUYER_ADDR="$(node -e "import { privateKeyToAccount } from 'viem/accounts'; console.log(privateKeyToAccount('$BUYER_PRIVATE_KEY').address)")"
VALIDATOR_ADDR="$(node -e "import { privateKeyToAccount } from 'viem/accounts'; console.log(privateKeyToAccount('$VALIDATOR_PRIVATE_KEY').address)")"

echo "Wallet balances:"
BAL_OK=true
require_balance "$OWNER_ADDR" "owner/deployer/worker" || BAL_OK=false
require_balance "$BUYER_ADDR" "buyer" || BAL_OK=false
require_balance "$VALIDATOR_ADDR" "validator" || BAL_OK=false
$BAL_OK || die "Fund wallets above, then re-run this script"

echo ""
echo "Deploying ERC-20 contracts..."
DEPLOY_OUT="$(cd "$ARCTASK" && node "$PATCHES/deploy-erc20.mjs" 2>&1)"
echo "$DEPLOY_OUT"

REGISTRY="$(echo "$DEPLOY_OUT" | sed -n 's/^NEXT_PUBLIC_ERC8004_REGISTRY_ADDRESS=//p' | head -1)"
ESCROW="$(echo "$DEPLOY_OUT" | sed -n 's/^NEXT_PUBLIC_ERC8183_ESCROW_ADDRESS=//p' | head -1)"
[[ -n "$REGISTRY" && -n "$ESCROW" ]] || die "Could not parse deployed addresses"

append_env() {
  local file="$1" key="$2" val="$3"
  if grep -q "^${key}=" "$file" 2>/dev/null; then
    sed -i "s|^${key}=.*|${key}=${val}|" "$file"
  else
    echo "${key}=${val}" >> "$file"
  fi
}

append_env "$ROOT/.env" "ARCTASK_REGISTRY_ADDRESS" "$REGISTRY"
append_env "$ROOT/.env" "ARCTASK_ESCROW_ADDRESS" "$ESCROW"

append_env "$ARCTASK/.env.local" "NEXT_PUBLIC_ERC8004_REGISTRY_ADDRESS" "$REGISTRY"
append_env "$ARCTASK/.env.local" "NEXT_PUBLIC_ERC8183_ESCROW_ADDRESS" "$ESCROW"
append_env "$ARCTASK/.env.local" "NEXT_PUBLIC_USDC_ADDRESS" "0x3600000000000000000000000000000000000000"
append_env "$ARCTASK/.env.local" "NEXT_PUBLIC_ARC_MODE" "onchain"

echo ""
echo "Registering agents..."
cd "$ROOT" && npm run register:arctask-agents

echo ""
echo "=== Setup complete ==="
echo "Terminal A: cd $ARCTASK && npm run dev"
echo "Terminal B: cd $ARCTASK && npm run agent:worker:live"
echo "Terminal C: cd $ROOT && TRAPEZA_LIVE_ONCHAIN=1 ARCTASK_SIMULATED=false npm run run:arctask-dag -- --graph examples/arctask-dag.json"
echo ""
echo "Registry: $REGISTRY"
echo "Escrow:   $ESCROW"
