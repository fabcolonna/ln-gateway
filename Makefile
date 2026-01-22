CLIENT_DIR := client
SERVER_DIR := server

.PHONY: fmt check ci build gen-api client-install docker-build docker-up docker-down

fmt:
	cargo fmt --manifest-path $(SERVER_DIR)/Cargo.toml
	cd $(CLIENT_DIR) && pnpm run format

check:
	cd $(SERVER_DIR) && cargo fmt --check
	cd $(SERVER_DIR) && cargo clippy -- -D warnings
	cd $(SERVER_DIR) && cargo build
	cd $(CLIENT_DIR) && pnpm run check
	cd $(CLIENT_DIR) && pnpm run build:docker

client-install:
	cd $(CLIENT_DIR) && CI=true pnpm install --frozen-lockfile

gen-api:
	cd $(CLIENT_DIR) && pnpm run gen:api

ci: client-install gen-api
	git diff --exit-code $(CLIENT_DIR)/src/lib/api/types.ts
	$(MAKE) check

build:
	cd $(SERVER_DIR) && cargo build --release
	cd $(CLIENT_DIR) && pnpm run build:docker

docker-build:
	docker compose --env-file .env build

docker-up:
	docker compose --env-file .env up -d --build

docker-down:
	docker compose down
