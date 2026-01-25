#!/usr/bin/env bash
set -euo pipefail

template_path="/config/conf.template"
out_path="/tmp/cln.conf"

export CLN_DIR="${CLN_DIR:-/data}"
export CLN_RPC_FILE="${CLN_RPC_FILE:-/rpc/lightning-rpc}"
export CLN_NETWORK="${CLN_NETWORK}"
export CLN_PORT="${CLN_PORT}"
export CLN_ALIAS="${CLN_ALIAS}"

export BTC_RPC_HOST="${BTC_RPC_HOST}"
export BTC_RPC_PORT="${BTC_RPC_PORT}"
export BTC_RPC_USER="${BTC_RPC_USER}"
export BTC_RPC_PASSWORD="${BTC_RPC_PASSWORD}"

mkdir -p "$(dirname "$CLN_RPC_FILE")" "$CLN_DIR"

if [[ -z "$BTC_RPC_USER" || -z "$BTC_RPC_PASSWORD" ]]; then
  echo "BTC_RPC_USER and BTC_RPC_PASSWORD must be set (see deploy/.env.example)" >&2
  exit 2
fi

envsubst <"$template_path" >"$out_path"
exec lightningd --conf="$out_path"
