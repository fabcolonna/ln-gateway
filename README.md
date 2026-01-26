# LN Gateway

[![Documentation](https://img.shields.io/badge/docs-GitHub%20Pages-blue)](https://fabcolonna.github.io/ln-gateway/)

LN Gateway is a small Axum-based REST server in front of a Core Lightning (CLN) node, plus a web UI that talks to it using fully generated OpenAPI TypeScript types.

The goal is to decouple Lightning operations from application logic by exposing a small, typed HTTP API and a minimal operational dashboard.

## TL;DR

- You always need a **Core Lightning node** (CLN) to run the gateway.
- You **do not need to run Bitcoin Core locally** to deploy the gateway UI/API.
  - If you want `/health` to include Bitcoin status, the server only needs a **Bitcoin Core JSON-RPC endpoint** (local or remote).
- `dev/bitcoin/` is an optional helper for people who want to spin up a Bitcoin Core node (Testnet4) in Docker for local development.

## Features

- Axum server wrapping the CLN RPC socket.
- LNURL endpoints (withdraw, channel-request, auth) + callbacks.
- `GET /health` aggregating CLN state + Bitcoin Core JSON-RPC status (optional).
- Built-in Swagger UI (`/swagger-ui`) and OpenAPI JSON.
- Vite + React web UI using generated OpenAPI types (`client/src/lib/api/types.ts`).

## What’s in this repo

- `server/`: Axum REST API that talks to a CLN RPC socket (and optionally to Bitcoin Core JSON-RPC for status).
- `client/`: Vite + React web UI (status dashboard + flows) using generated OpenAPI TypeScript types (`client/src/lib/api/types.ts`).
- `dev/bitcoin/`: Docker Compose helper for a Bitcoin Core node (Testnet4 by default) for local development.
- `deploy/`: Docker Compose + CLN Dockerfiles for deployment (bitcoind + CLN + gateway).

## Prerequisites

- A running Core Lightning node, with access to its RPC socket (unix socket path).
- Rust toolchain (Rust 2024 edition).
- Node.js (>= 20) and a package manager (`pnpm` recommended).
- GNU Make.
- Optional: a Bitcoin Core JSON-RPC endpoint if you want `/health` to include blockchain status.

## Git hooks (optional)

This repo uses Husky to block commits when `make check` fails.

```bash
pnpm install
```

## Local development

Local development is done by running `ln-server` on the host (via `cargo run`) and connecting to a host-accessible CLN unix socket.

### Option 1: Host dev

This option is useful when you want to run the Rust server and Vite dev server directly on your machine.
It requires a **host-accessible CLN RPC unix socket**.

1) (Optional) run Bitcoin Core somewhere reachable.

- If you want a local Testnet4 bitcoind, you can run it via Docker:

```bash
cp dev/.env.example dev/.env
# edit dev/.env (set BTC_RPC_USER/BTC_RPC_PASSWORD at least)
make dev-btc-up
```

This publishes the RPC port to the host; `SERVER_BTC_RPC_URL=http://127.0.0.1:<BTC_RPC_PORT>` will work from the host.

2) Run Core Lightning on the host (or otherwise expose a host-accessible `lightning-rpc`).

Core Lightning currently lacks Testnet4 support in official container images, so for host dev you typically install it on the host OS and point it at your Testnet4 bitcoind RPC endpoint.

Follow the upstream instructions for your platform (e.g. `brew install lightning` on macOS via the Elements tap, or the packages described in the Core Lightning docs: https://docs.corelightning.org/docs/getting-started).

This repo also includes a small helper to run `lightningd` with a generated config that points at the Dockerized bitcoind above:

```bash
# In a separate terminal:
make dev-cln-host
```

By default it writes the socket to `./dev/.data/host-cln-rpc/lightning-rpc` and uses `dev/.env` for shared Bitcoin/CLN dev settings.

3) Configure and run the server

1. Copy `server/.env.example` -> `server/.env` and set at least:
   - `SERVER_CLN_RPC_PATH` (unix socket path like `/path/to/lightning-rpc`)
   - `SERVER_PORT` (defaults to 3000)
2. (Optional) enable Bitcoin Core status in `/health` (any reachable endpoint, local or remote):
   - `SERVER_BTC_RPC_URL`
   - `SERVER_BTC_RPC_USER`
   - `SERVER_BTC_RPC_PASSWORD`

Run:

```bash
cd server
cargo run --bin ln-server
```

Swagger UI is served at `http://localhost:<SERVER_PORT>/swagger-ui`.

4) Configure and run the web client

1. Copy `client/.env.example` -> `client/.env` and set `CLIENT_API_BASE_URL` to your server base URL.
2. Install deps and start the dev server:

```bash
cd client
pnpm install
pnpm dev
```

`pnpm dev` runs `gen:api` automatically (via `predev`), so the web UI stays in sync with the server’s OpenAPI schema.

## `dev/bitcoin/`: Bitcoin Core (Docker helper)

The `dev/bitcoin/` folder is a small Docker Compose helper to run **Bitcoin Core (Testnet4)** locally for host development.

### Configuration (`dev/.env`)

Copy `dev/.env.example` to `dev/.env` and set at least:

- `BTC_RPC_USER`, `BTC_RPC_PASSWORD`, `BTC_RPC_PORT`

### Data and sockets

The stack persists everything under `dev/.data/`:

- `dev/.data/btc-data/bitcoin`: Bitcoin Core datadir

### Ports

- Bitcoin P2P: `48333` (Testnet4)
- Bitcoin JSON-RPC: `${BTC_RPC_PORT}` (default `48332`)

### Common commands

- Start: `make dev-btc-up`
- Stop: `make dev-btc-down`
- CLN CLI: `make dev-cln-cli getinfo` (or `make dev-cln-cli ARGS='getinfo'`)

Notes:

- The stack is pinned to **Testnet4** via `-testnet4=1`.

## Docker deployment

This repo ships a deployment-oriented compose at `deploy/docker-compose.yml` that runs bitcoind + CLN + the gateway together on a single host.

1. Copy `deploy/.env.example` to `deploy/.env` and set at least `BTC_RPC_USER`/`BTC_RPC_PASSWORD`.
2. Start:

```bash
make deploy-up
```

- UI: `http://localhost:<HOST_WEB_PORT>` (default: 8080)
- API (direct): `http://localhost:<HOST_SERVER_PORT>` (default: 3000)
- API (via nginx proxy, same-origin): `http://localhost:<HOST_WEB_PORT>/health`, `http://localhost:<HOST_WEB_PORT>/swagger-ui`, etc.

### How the frontend reaches the API (nginx reverse-proxy “trick”)

The `web` container is an nginx image that does two things:

1) Serves the built SPA (`client/dist`) at `/`.
2) Proxies a fixed set of API routes to the backend container (`server:3000`).

This is configured in `client/nginx.conf`:

- `location /` uses `try_files ... /index.html` so client-side routing works.
- `location ~ ^/(health|channel-request|withdraw-request|lnurl-auth-request|callbacks/|swagger-ui|api-doc/)` proxies to `http://server:3000`.
- nginx forwards `Host` and `X-Forwarded-*` headers so the backend can generate correct callback URLs when it needs to.

Because the browser talks only to the nginx origin (for example `http://localhost:8080`), the UI can keep `CLIENT_API_BASE_URL` same-origin and avoid CORS entirely.

Why this avoids CORS:
- CORS is a browser-enforced restriction for **cross-origin** requests.
- In `deploy/docker-compose.yml`, the browser sends requests to the same origin that served the UI (nginx), e.g. `https://your-domain/health`.
- nginx proxies those paths to the backend container over the internal Docker network, but the browser still sees the request as same-origin, so it doesn’t require any `Access-Control-Allow-*` headers.

If you add new API routes and want them to be reachable at the same origin (`http://<web>/...`), update the regex in `client/nginx.conf`.

### Notes

- The UI is built with `CLIENT_API_BASE_URL` from `.env` (build-time). The default keeps it same-origin through nginx.
- For host dev, if you point `SERVER_BTC_RPC_URL` at a node running on your host:
  - Docker Desktop/OrbStack: `host.docker.internal` usually works.
  - Linux: use your host IP / route.

### Deployment guide (single host)

Same as above: configure `deploy/.env` and run `make deploy-up`.

### Deployment guide (remote CLN)

The server currently talks to CLN via a **local unix socket** (via `cln-rpc`). If your CLN node runs on a different machine, you generally have three choices:

1) Run the gateway on the same machine as CLN (recommended).
2) Forward the socket securely (SSH `StreamLocalForward` / `socat`), then mount the forwarded local socket path.
3) Use a remote-control API (Commando / clnrest) instead of the unix socket.

This repo does not ship a “gateway-only” compose anymore; for remote CLN you should deploy the gateway on the CLN host, or implement a networked CLN integration.

## Server configuration

Configuration can be provided via CLI flags or environment variables (loaded from `server/.env` when present).

| Flag                               | Env                            | Default                  | Description                        |
| ---------------------------------- | ------------------------------ | ------------------------ | ---------------------------------- |
| `--rpc-sockpath <PATH>`            | `SERVER_CLN_RPC_PATH`          | –                        | Path to the CLN RPC unix socket    |
| `--listening-port <PORT>`          | `SERVER_PORT`                  | `3000`                   | HTTP listener port                 |
| `--min-withdrawable-msat <AMOUNT>` | `SERVER_MIN_WITHDRAWABLE_MSAT` | `1000`                   | Minimum withdrawable amount (msat) |
| `--max-withdrawable-msat <AMOUNT>` | `SERVER_MAX_WITHDRAWABLE_MSAT` | `100000`                 | Maximum withdrawable amount (msat) |
| `--btc-rpc-url <URL>`              | `SERVER_BTC_RPC_URL`           | `http://127.0.0.1:48332` | Bitcoin Core JSON-RPC URL          |
| `--btc-rpc-user <USER>`            | `SERVER_BTC_RPC_USER`          | –                        | Bitcoin Core JSON-RPC username     |
| `--btc-rpc-password <PASS>`        | `SERVER_BTC_RPC_PASSWORD`      | –                        | Bitcoin Core JSON-RPC password     |

Bitcoin RPC auth is treated as “configured” only when both `SERVER_BTC_RPC_USER` and `SERVER_BTC_RPC_PASSWORD` are set.

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

| Method | Path                          | Description                              |
| ------ | ----------------------------- | ---------------------------------------- |
| GET    | `/health`                     | CLN + Bitcoin Core status snapshot       |
| GET    | `/channel-request`            | LNURL-channel metadata + callback token  |
| GET    | `/withdraw-request`           | LNURL-withdraw metadata + callback token |
| GET    | `/lnurl-auth-request`         | LNURL-auth challenge                     |
| GET    | `/callbacks/open-channel`     | Open channel callback                    |
| GET    | `/callbacks/withdraw-request` | Withdraw callback                        |
| GET    | `/callbacks/lnurl-auth`       | LNURL-auth callback                      |

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
  -e SERVER_PORT=3000 \
  -e SERVER_CLN_RPC_PATH=/cln/lightning-rpc \
  -v /absolute/path/to/directory-containing-lightning-rpc:/cln \
  ln-gateway-server
```

Then build the client with:
- `CLIENT_API_BASE_URL=http://<your-server-host>:3000`

### Frontend on another domain

If you host the UI on a different origin (different domain/port/protocol) and have the browser call the API directly (for example UI at `https://ui.example.com` and API at `https://api.example.com`), then requests become cross-origin and CORS matters.

The server enables permissive CORS for `GET` endpoints to support that scenario and local dev (for example `localhost:5173` → `localhost:3000`). In that case, set `CLIENT_API_BASE_URL` to the server’s public URL and deploy the static files from `client/dist`.

### Behind a reverse proxy

Callback URLs are computed using request headers. When running behind a reverse proxy, ensure it sets:
- `X-Forwarded-Proto`
- `X-Forwarded-Host`

## Top-level commands

Common targets (Makefile):
- `make fmt`: format Rust + client (Biome)
- `make check`: server fmt/clippy/build + client biome + client build
- `make ci`: CI version of `check` + OpenAPI/type generation verification
- `make deploy-up` / `make deploy-down`: bring the deployment compose up/down

## License

MIT. See `LICENSE`.
