CLIENT_DIR := client
SERVER_DIR := server
DEPLOY_DIR := deploy
DEV_DIR := dev

.PHONY: help fmt check ci build gen-api client-install
.PHONY: deploy-build deploy-up deploy-down
.PHONY: dev-btc-up dev-btc-down dev-cln-host

help:
	@echo "Common targets:"
	@echo "  make fmt / make check / make ci"
	@echo "  make deploy-up / deploy-down / deploy-build"
	@echo "  make dev-btc-up / dev-btc-down / dev-cln-host"
	@echo
	@echo "See: deploy/Makefile and dev/Makefile"

fmt:
	cargo fmt --manifest-path $(SERVER_DIR)/Cargo.toml
	cd $(CLIENT_DIR) && pnpm run format

check:
	cd $(SERVER_DIR) && cargo fmt --check
	cd $(SERVER_DIR) && cargo clippy -- -D warnings
	cd $(SERVER_DIR) && cargo build
	cd $(CLIENT_DIR) && pnpm run check
	cd $(CLIENT_DIR) && pnpm run build:docker

clean:
	cd $(SERVER_DIR) && cargo clean
	cd $(CLIENT_DIR) && pnpm run clean

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

# DEPLOYMENT TARGETS

deploy-build:
	@$(MAKE) -C $(DEPLOY_DIR) build

deploy-up:
	@$(MAKE) -C $(DEPLOY_DIR) up

deploy-down:
	@$(MAKE) -C $(DEPLOY_DIR) down

# DEVELOPMENT TARGETS

dev-btc-up:
	@$(MAKE) -C $(DEV_DIR) btc-up

dev-btc-down:
	@$(MAKE) -C $(DEV_DIR) btc-down

dev-cln-host:
	@$(MAKE) -C $(DEV_DIR) cln-host