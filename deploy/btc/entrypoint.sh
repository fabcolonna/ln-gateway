#!/usr/bin/env bash
set -euo pipefail

template_path="/config/bitcoin.conf.template"
out_path="/tmp/bitcoin.conf"

: "${BTC_CHAIN:=testnet4}"
: "${BTC_RPC_PORT:=48332}"
: "${BTC_P2P_PORT:=48333}"
: "${BTC_RPC_BIND:=0.0.0.0}"
: "${BTC_RPC_ALLOWIP:=0.0.0.0/0}"
: "${BTC_SERVER:=1}"
: "${BTC_DISABLEWALLET:=1}"
: "${BTC_BLOCKFILTERINDEX:=0}"
: "${BTC_PRUNE:=550}"
: "${BTC_DBCACHE:=2048}"
: "${BTC_MAXCONNECTIONS:=32}"
: "${BTC_FALLBACKFEE:=0.0001}"

if [[ -z "${BTC_RPC_USER:-}" || -z "${BTC_RPC_PASSWORD:-}" ]]; then
  echo "BTC_RPC_USER and BTC_RPC_PASSWORD must be set (see deploy/.env.example)." >&2
  exit 2
fi

case "${BTC_CHAIN}" in
  "" | main | mainnet)
    BTC_CHAIN_CONF_SECTION="main"
    ;;
  test | testnet)
    BTC_CHAIN_CONF_SECTION="test"
    ;;
  testnet4)
    BTC_CHAIN_CONF_SECTION="testnet4"
    ;;
  signet | regtest)
    BTC_CHAIN_CONF_SECTION="${BTC_CHAIN}"
    ;;
  *)
    # Fallback to whatever bitcoind expects for newer chain names.
    BTC_CHAIN_CONF_SECTION="${BTC_CHAIN}"
    ;;
esac
export BTC_CHAIN_CONF_SECTION

envsubst <"$template_path" >"$out_path"

exec bitcoind -conf="$out_path" -chain="$BTC_CHAIN"
