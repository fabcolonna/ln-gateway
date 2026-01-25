#!/usr/bin/env bash
set -euo pipefail

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

usage() {
  cat <<'EOF'
Run Core Lightning (lightningd) on the host with a generated config.

Defaults:
  - Reads shared dev vars from ./dev/.env (if present)
  - Writes CLN data under ./dev/.data/host-cln-data
  - Writes the RPC socket to ./dev/.data/host-cln-rpc/lightning-rpc

Environment overrides (optional):
  CLN_NETWORK   (default: testnet4)
  CLN_PORT      (default: 9735)
  CLN_ALIAS     (default: cln-host)
  CLN_DATA_DIR  (default: ./dev/.data/host-cln-data)
  CLN_RPC_DIR   (default: ./dev/.data/host-cln-rpc)
  CLN_CONF_PATH (default: ./dev/.data/host-cln.conf)
  BTC_RPC_HOST  (default: 127.0.0.1)
  BTC_RPC_PORT  (default: 48332)
  BTC_RPC_USER  (required)
  BTC_RPC_PASSWORD (required)

Any args after `--` are passed through to lightningd.

Examples:
  make dev-btc-up
  make dev-cln-host

  # Custom alias and port:
  CLN_ALIAS=my-node CLN_PORT=9736 make dev-cln-host
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if ! command -v lightningd >/dev/null 2>&1; then
  echo "Missing 'lightningd' on PATH. Install Core Lightning first." >&2
  exit 127
fi

# Optional: reuse shared dev vars (bitcoind + lightningd).
if [[ -f "${root_dir}/dev/.env" ]]; then
  # shellcheck disable=SC1091
  source "${root_dir}/dev/.env"
fi

: "${CLN_NETWORK:=testnet4}"
: "${CLN_PORT:=9735}"
: "${CLN_ALIAS:=cln-host}"
: "${BTC_RPC_HOST:=127.0.0.1}"
: "${BTC_RPC_PORT:=48332}"

if [[ -z "${BTC_RPC_USER:-}" || -z "${BTC_RPC_PASSWORD:-}" ]]; then
  echo "BTC_RPC_USER and BTC_RPC_PASSWORD must be set (or configured in dev/.env)." >&2
  exit 2
fi

data_dir="${CLN_DATA_DIR:-${root_dir}/dev/.data/host-cln-data}"
rpc_dir="${CLN_RPC_DIR:-${root_dir}/dev/.data/host-cln-rpc}"
conf_path="${CLN_CONF_PATH:-${root_dir}/dev/.data/host-cln.conf}"
rpc_file="${rpc_dir}/lightning-rpc"

mkdir -p "${data_dir}" "${rpc_dir}" "$(dirname "${conf_path}")"

cat >"${conf_path}" <<EOF
network=${CLN_NETWORK}
alias=${CLN_ALIAS}
log-level=debug

lightning-dir=${data_dir}
rpc-file=${rpc_file}
rpc-file-mode=0666

bind-addr=0.0.0.0:${CLN_PORT}

bitcoin-rpcconnect=${BTC_RPC_HOST}
bitcoin-rpcport=${BTC_RPC_PORT}
bitcoin-rpcuser=${BTC_RPC_USER}
bitcoin-rpcpassword=${BTC_RPC_PASSWORD}
EOF

echo "Starting lightningd with:"
echo "  conf: ${conf_path}"
echo "  rpc : ${rpc_file}"
echo
echo "For ln-server, set:"
echo "  SERVER_CLN_RPC_PATH=${rpc_file}"
echo "  SERVER_BTC_RPC_URL=http://${BTC_RPC_HOST}:${BTC_RPC_PORT}"
echo

pass_through=()
if [[ "${1:-}" == "--" ]]; then
  shift
  pass_through=("$@")
fi

if ((${#pass_through[@]})); then
  exec lightningd --conf="${conf_path}" "${pass_through[@]}"
fi

exec lightningd --conf="${conf_path}"
