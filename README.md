# LN Gateway

LN Gateway is a small Axum-based REST server in front of a Core Lightning (CLN) node, plus a web UI that talks to it using fully generated OpenAPI TypeScript types.

The goal is to decouple Lightning operations from application logic by exposing a small, typed HTTP API and a minimal operational dashboard.

## Features

- Axum server wrapping the CLN RPC socket.
- LNURL endpoints (withdraw, channel-request, auth) + callbacks.
- `GET /health` aggregating CLN state + Bitcoin Core JSON-RPC status (optional).
- Built-in Swagger UI (`/swagger-ui`) and OpenAPI JSON.
- Vite + React web UI using generated OpenAPI types (`client/src/lib/api/types.ts`).

## What’s in this repo

- `server/`: Axum REST API that talks to a CLN RPC socket (and optionally to Bitcoin Core JSON-RPC for status).
- `client/`: Vite + React web UI (status dashboard + flows) using generated OpenAPI types (`openapi.json` + `types.ts`).
- `btc-node/`: Docker Compose helper for a Bitcoin Core Testnet4 node (useful when running CLN on the host).

## Prerequisites

- A running Core Lightning node, with access to its RPC socket (unix socket path).
- Rust toolchain (Rust 2024 edition).
- Node.js (>= 20) and a package manager (`pnpm` recommended).
- Optional: Bitcoin Core JSON-RPC endpoint if you want `/health` to report blockchain status.

## Quick start

### 1) Start Bitcoin Core (optional but recommended for `/health`)

The `btc-node/` directory ships a Docker Compose setup that runs Bitcoin Core on Testnet4.

1. Copy and edit `btc-node/.env.example` -> `btc-node/.env` (set RPC credentials + port).
2. Start the service:

```bash
cd btc-node
make up          # docker compose --env-file .env up -d
```

This publishes the RPC port to the host. If you run the server on the host, `LNS_BTC_RPC_URL=http://127.0.0.1:<RPC_PORT>` will work. If you run the server inside Docker, `127.0.0.1` will point at the container itself.

### 2) Run Core Lightning (host install)

Core Lightning currently lacks Testnet4 support in official container images, so install it on the host OS and point it at the Testnet4 bitcoind RPC endpoint.

Follow the upstream instructions for your platform (e.g. `brew install lightning` on macOS via the Elements tap, or the packages described in the Core Lightning docs: https://docs.corelightning.org/docs/getting-started).

### 3) Configure and run the server

1. Copy `server/.env.example` -> `server/.env` and set at least:
   - `LNS_CL_RPC_PATH` (path to your `lightning-rpc`)
   - `LNS_PORT` (defaults to 3000)
2. (Optional) enable Bitcoin Core status in `/health`:
   - `LNS_BTC_RPC_URL`
   - `LNS_BTC_RPC_USER`
   - `LNS_BTC_RPC_PASSWORD`

Run:

```bash
cd server
make run
```

Swagger UI is served at `http://localhost:<LNS_PORT>/swagger-ui`.

### 4) Configure and run the web client

1. Copy `client/.env.example` -> `client/.env` and set `VITE_API_BASE_URL` to your server base URL.
2. Install deps and start the dev server:

```bash
cd client
pnpm install
pnpm dev
```

`pnpm dev` runs `gen:api` automatically (via `predev`), so the web UI stays in sync with the server’s OpenAPI schema.

## Server configuration

Configuration can be provided via CLI flags or environment variables (loaded from `server/.env` when present).

| Flag                               | Env                       | Default                 | Description                        |
| ---------------------------------- | ------------------------- | ----------------------- | ---------------------------------- |
| `--rpc-sockpath <PATH>`            | `LNS_CL_RPC_PATH`         | –                       | Path to the CLN RPC unix socket    |
| `--listening-port <PORT>`          | `LNS_PORT`                | `3000`                  | HTTP listener port                 |
| `--min-withdrawable-msat <AMOUNT>` | `LNS_MIN_WITHDRAWABLE_MSAT` | `1000`                | Minimum withdrawable amount (msat) |
| `--max-withdrawable-msat <AMOUNT>` | `LNS_MAX_WITHDRAWABLE_MSAT` | `100000`              | Maximum withdrawable amount (msat) |
| `--btc-rpc-url <URL>`              | `LNS_BTC_RPC_URL`         | `http://127.0.0.1:48332` | Bitcoin Core JSON-RPC URL          |
| `--btc-rpc-user <USER>`            | `LNS_BTC_RPC_USER`        | –                       | Bitcoin Core JSON-RPC username     |
| `--btc-rpc-password <PASS>`        | `LNS_BTC_RPC_PASSWORD`    | –                       | Bitcoin Core JSON-RPC password     |

Bitcoin RPC auth is treated as “configured” only when both `LNS_BTC_RPC_USER` and `LNS_BTC_RPC_PASSWORD` are set.

### Server Makefile helpers

`server/Makefile` includes convenience targets:

- `make build`: build the server binary (`cargo build --bin ln-server`).
- `make run`: run the server (`cargo run --bin ln-server`).
- `make clean`: cleanup Cargo artifacts and `.lightning/`.
- `make lightningd-start|stop|status`: manage a local `lightningd` process in `server/.lightning/` for manual testing.

## API and generated types

- Server OpenAPI is produced by `server/src/bin/openapi_gen.rs` (binary: `openapi_gen`).
- Client generation is done by `client/scripts/gen-api.mjs`:
  - runs `cargo run --bin openapi_gen -- --format json --output client/src/lib/api/openapi.json`
  - runs `openapi-typescript` to produce `client/src/lib/api/types.ts`
  - formats generated files using Biome

Run manually from the client:

```bash
cd client
pnpm run gen:api
```

Do not edit `client/src/lib/api/types.ts` by hand (it is generated).

## `/health` semantics

`GET /health` returns:
- `lightning`: CLN node info + sync state
- `bitcoin`: Bitcoin Core JSON-RPC status snapshot
  - `status=notconfigured` if BTC RPC credentials are not set
  - `status=unreachable` if calls fail
  - `status=ok` when calls succeed

## REST API overview

All successful responses return the domain payload as JSON. Errors return:

```json
{ "status": 502, "error": "..." }
```

Endpoints:

| Method | Path                          | Description |
| ------ | ----------------------------- | ----------- |
| GET    | `/health`                     | CLN + Bitcoin Core status snapshot |
| GET    | `/channel-request`            | LNURL-channel metadata + callback token |
| GET    | `/withdraw-request`           | LNURL-withdraw metadata + callback token |
| GET    | `/lnurl-auth-request`         | LNURL-auth challenge |
| GET    | `/callbacks/open-channel`     | Open channel callback |
| GET    | `/callbacks/withdraw-request` | Withdraw callback |
| GET    | `/callbacks/lnurl-auth`       | LNURL-auth callback |

## CI

GitHub Actions runs:
- server `cargo fmt` / `cargo clippy` / `cargo build`
- client install + `gen:api` and fails if generated files are out of date
- client `tsc --noEmit` + `vite build`

## License

MIT. See `LICENSE`.
