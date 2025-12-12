# LN Gateway

LN Gateway is a Rust-based client/server project that provides a clean, typed interface for interacting with a Core Lightning (CLN) node.

It is designed to decouple Lightning operations from application logic by exposing a small, well-defined API over a client/server boundary.

## Features

- Rust client and server components
- Typed request/response model
- Communication with Core Lightning (CLN)
- Suitable for local or remote deployments
- Designed for automation and operational tooling

## Prerequisites

- A running Core Lightning node with access to its RPC socket
- Rust toolchain, a Bitcoin full node, and `core-lightningd` installed

## Project Architecture

- `server/`: Axum-based REST service that wraps the CLN RPC socket
- `client/`: Placeholder crate that will act as the typed consumer (not implemented yet)

### Server

Configuration can be provided through CLI flags or environment variables (loaded via dotenv when present):

| Flag                               | Env                       | Default | Description                        |
| ---------------------------------- | ------------------------- | ------- | ---------------------------------- |
| `--rpc-sockpath <PATH>`            | LNS_CL_RPC_PATH           | –       | Path to the CLN RPC unix socket    |
| `--port, -p <PORT>`                | LNS_PORT                  | 3000    | HTTP listener port                 |
| `--min-withdrawable-msat <AMOUNT>` | LNS_MIN_WITHDRAWABLE_MSAT | 1000    | Minimum withdrawable amount (msat) |
| `--max-withdrawable-msat <AMOUNT>` | LNS_MAX_WITHDRAWABLE_MSAT | 100000  | Maximum withdrawable amount (msat) |

If no `.env` file is present (you can create one by copying `.env.example`), the server requires the required parameters to be passed via CLI.

#### Makefile helpers

The server crate ships a thin wrapper around common workflows in [server/Makefile](server/Makefile):

| Target                   | Description                                                                   |
| ------------------------ | ----------------------------------------------------------------------------- |
| `make build`             | Compile the Axum server (uses `cargo build --bin ln-server` by default).      |
| `make run`               | Build and run the HTTP server. Extra CLI flags can be appended after `--`.    |
| `make clean`             | Remove Cargo artefacts and the local `.lightning` directory used for testing. |
| `make lightningd-start`  | Launch a local `lightningd` instance in `.lightning/` to exercise callbacks.  |
| `make lightningd-stop`   | Terminate the managed `lightningd` process and delete its state directory.    |
| `make lightningd-status` | Report whether the managed `lightningd` process is currently running.         |

#### Running the service

Ensure you have access to a running Core Lightning node. The Makefile wraps the typical workflow:

1. Enter the server crate and build the binary (optional if `make run` will build):
	```
	cd server
	make build
	```
2. Start a disposable `lightningd` instance for local testing (skippable when pointing at an existing node):
	```
	make lightningd-start
	# Override the binary if needed: make lightningd-start LN_CMD=/usr/local/bin/lightningd
	```
3. Launch the REST server, forwarding any CLI args after `--`, or using simply `make run` if an `.env` file is present:
	```
	make run -- --rpc-sockpath /path/to/lightning-rpc --port 8080
	```
4. When finished, stop the local node and clean up artefacts:
	```
	make lightningd-stop
	make clean   # optional
	```

The HTTP service binds to 0.0.0.0:<port> and logs via tracing. If you prefer raw Cargo commands, the targets document the underlying invocations.

#### REST API

All responses are wrapped in ApiResponse and serialised as JSON. Successful responses echo the domain payload and failed ones use `{ "status": <http_status>, "error": <message> }`.

| Method | Path                          | Description                                         |
| ------ | ----------------------------- | --------------------------------------------------- |
| GET    | `/channel-request`            | Returns LNURL-channel metadata and a callback token |
| GET    | `/withdraw-request`           | Issues a LNURL-withdraw request token               |
| GET    | `/callbacks/open-channel`     | Triggers channel funding with the provided peer     |
| GET    | `/callbacks/withdraw-request` | Broadcasts a withdrawal transaction                 |

##### `GET /channel-request`

No parameters. Returns:

```json
{
	"tag": "channelRequest",
	"uri": "<node_id>@<host>:<port>",
	"callback": "/open_channel",
	"k1": "<nonce>"
}
```

##### `GET /withdraw-request`

No parameters. Returns LNURL-withdraw metadata:

```json
{
	"tag": "withdrawRequest",
	"callback": "/withdraw-callback",
	"k1": "<nonce>",
	"defaultDescription": "Withdraw funds from CoreLightning REST server",
	"minWithdrawable": 1000,
	"maxWithdrawable": 100000
}
```

The `k1` token is stored for one-time validation by the withdrawal callback.

##### `GET /callbacks/open-channel`

Query parameters:

- `remote_id` (required): hex public key of the remote node
- `amount` (optional, satoshis): channel capacity
- `announce` (optional, bool): whether to announce the channel

Successful responses contain the CLN RPC output under `result`; errors set `ok` to false and populate `error`.

##### `GET /callbacks/withdraw-request`

Query parameters:

- `destination` (required): bolt11 invoice or on-chain destination understood by CLN
- `amount` (optional, satoshis): withdrawal amount

Returns the CLN withdrawal artefacts:

```json
{
	"tx": "<hex>",
	"psbt": "<base64>",
	"txid": "<hex>"
}
```

### Client

The client crate currently only hosts a `main` stub and no functionality. Follow-up work will add typed bindings targeting the REST API above.

## Status

The project is under active development. Expect breaking changes until the API stabilises.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.