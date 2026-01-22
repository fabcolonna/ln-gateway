# LN Gateway

LN Gateway is a small Axum-based REST server in front of a Core Lightning (CLN) node, plus a web UI that talks to it using fully generated OpenAPI TypeScript types.

The goal is to decouple Lightning operations from application logic by exposing a small, typed HTTP API and a minimal operational dashboard.

## TL;DR

- You always need a **Core Lightning node** (CLN) to run the gateway.
- You **do not need to run Bitcoin Core locally** to deploy the gateway UI/API.
  - If you want `/health` to include Bitcoin status, the server only needs a **Bitcoin Core JSON-RPC endpoint** (local or remote).
- `btc-node/` is an optional helper for people who want to spin up a Bitcoin Core node on their machine.

## Features

- Axum server wrapping the CLN RPC socket.
- LNURL endpoints (withdraw, channel-request, auth) + callbacks.
- `GET /health` aggregating CLN state + Bitcoin Core JSON-RPC status (optional).
- Built-in Swagger UI (`/swagger-ui`) and OpenAPI JSON.
- Vite + React web UI using generated OpenAPI types (`client/src/lib/api/types.ts`).

## What’s in this repo

- `server/`: Axum REST API that talks to a CLN RPC socket (and optionally to Bitcoin Core JSON-RPC for status).
- `client/`: Vite + React web UI (status dashboard + flows) using generated OpenAPI TypeScript types (`client/src/lib/api/types.ts`).
- `btc-node/`: Docker Compose helper for a Bitcoin Core node (Testnet4 by default) for local development.

## Prerequisites

- A running Core Lightning node, with access to its RPC socket (unix socket path).
- Rust toolchain (Rust 2024 edition).
- Node.js (>= 20) and a package manager (`pnpm` recommended).
- Optional: a Bitcoin Core JSON-RPC endpoint if you want `/health` to include blockchain status.

## Local development (host)

### 1) Bitcoin Core (optional)

The `btc-node/` directory ships a Docker Compose setup that runs Bitcoin Core on Testnet4.
This is only for developers who want to run a Bitcoin node locally. It is not required for deploying the gateway UI/API.

1. Copy and edit `btc-node/.env.example` -> `btc-node/.env` (set RPC credentials + port).
2. Start the service:

```bash
cd btc-node
make up          # docker compose --env-file .env up -d
```

This publishes the RPC port to the host. If you run the server on the host, `LNS_BTC_RPC_URL=http://127.0.0.1:<RPC_PORT>` will work.

### 2) Run Core Lightning (host install)

Core Lightning currently lacks Testnet4 support in official container images, so install it on the host OS and point it at the Testnet4 bitcoind RPC endpoint.

Follow the upstream instructions for your platform (e.g. `brew install lightning` on macOS via the Elements tap, or the packages described in the Core Lightning docs: https://docs.corelightning.org/docs/getting-started).

### 3) Configure and run the server

1. Copy `server/.env.example` -> `server/.env` and set at least:
   - `LNS_CL_RPC_PATH` (path to your `lightning-rpc`)
   - `LNS_PORT` (defaults to 3000)
2. (Optional) enable Bitcoin Core status in `/health` (any reachable endpoint, local or remote):
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

## Docker deployment (recommended)

This repo ships a production-oriented `docker-compose.yml` that runs:
- `server`: the Axum API (port `3000` inside the container)
- `web`: nginx serving the built UI and proxying API requests to `server` (port `8080` on the host by default)

Important: the backend still needs access to the **CLN RPC unix socket**. The compose file mounts it from the host.

### 1) Configure

1. Copy `.env.example` to `.env`.
2. Set at least:
   - `LNS_CL_RPC_HOST_PATH=/absolute/path/to/lightning-rpc`

Optional:
- Set `LNS_BTC_RPC_*` to any reachable Bitcoin Core JSON-RPC endpoint if you want `/health` to report Bitcoin status.

### 2) Start

```bash
make docker-up
```

- UI: `http://localhost:8080` (default)
- API (direct): `http://localhost:3000`
- API (via nginx proxy, same-origin): `http://localhost:8080/health`, `http://localhost:8080/swagger-ui`, etc.

### Notes

- The UI is built with `VITE_API_BASE_URL` from `.env` (build-time). The default (`http://localhost:8080`) keeps it same-origin through nginx.
- If you point `LNS_BTC_RPC_URL` at a node running on your host:
  - Docker Desktop: `host.docker.internal` usually works.
  - Linux: use your host IP / route, or run bitcoind in Docker on the same compose network.

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
  - runs `cargo run --bin openapi_gen -- --format json --output client/src/lib/api/openapi.json` (temporary)
  - runs `openapi-typescript` to produce `client/src/lib/api/types.ts` (committed)
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
- `make ci` (server format/clippy/build + client Biome + client build + OpenAPI/type generation verification)

## Deployment variants

### Backend-only (no nginx)

If you want to serve the UI elsewhere (S3/Cloudflare Pages/nginx on your infra), you can run only the backend container.
Example:

```bash
docker build -f server/Dockerfile -t ln-gateway-server .
docker run --rm -p 3000:3000 \
  -e LNS_PORT=3000 \
  -e LNS_CL_RPC_PATH=/cln/lightning-rpc \
  -v /absolute/path/to/lightning-rpc:/cln/lightning-rpc \
  ln-gateway-server
```

Then build the client with:
- `VITE_API_BASE_URL=http://<your-server-host>:3000`

### Frontend on another domain

The server enables permissive CORS for `GET` endpoints. If you host the UI on a different domain, set `VITE_API_BASE_URL` to the server’s public URL (for example `https://api.example.com`) and deploy the static files from `client/dist`.

### Behind a reverse proxy

Callback URLs are computed using request headers. When running behind a reverse proxy, ensure it sets:
- `X-Forwarded-Proto`
- `X-Forwarded-Host`

## Top-level Makefile

Common targets:
- `make fmt`: format Rust + client (Biome)
- `make check`: server fmt/clippy/build + client biome + client build
- `make ci`: CI version of `check` + OpenAPI/type generation verification
- `make docker-up` / `make docker-down`: bring the deployment compose up/down

## License

MIT. See `LICENSE`.
