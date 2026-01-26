CLIENT_DIR := client
SERVER_DIR := server
DEPLOY_DIR := deploy
DEV_DIR := dev

SWAGGER_STATIC_DIR := public/swagger
SWAGGER_SPEC := $(SERVER_DIR)/swagger.yaml

.PHONY: site-swagger

.PHONY: help fmt check ci build gen-api client-install clean site-swagger
.PHONY: deploy-build deploy-up deploy-down
.PHONY: dev-btc-up dev-btc-down dev-cln-host

help:
	@echo "Common targets:"
	@echo "  make fmt / make check / make ci"
	@echo "  make deploy-up / deploy-down / deploy-build"
	@echo "  make dev-btc-up / dev-btc-down / dev-cln-host"
	@echo "  make site-swagger"
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

ci-swagger:
	cd $(SERVER_DIR) && cargo run --bin openapi_gen -- -f yaml -o swagger.yaml
	@test -f $(SWAGGER_SPEC)
	git diff --exit-code $(SWAGGER_SPEC)

site-swagger: ci-swagger
	@mkdir -p $(SWAGGER_STATIC_DIR); \
	mv $(SWAGGER_SPEC) $(SWAGGER_STATIC_DIR)/api.yaml; \
	: > $(SWAGGER_STATIC_DIR)/.nojekyll; \
	printf '%b' '<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="utf-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1" />\n    <title>LN Gateway API Docs</title>\n    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />\n    <style>body{margin:0}</style>\n  </head>\n  <body>\n    <div id="swagger-ui"></div>\n    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>\n    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>\n    <script>\n      window.ui = SwaggerUIBundle({\n        url: "./api.yaml",\n        dom_id: "#swagger-ui",\n        deepLinking: true,\n        presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],\n        layout: "StandaloneLayout"\n      });\n    </script>\n  </body>\n</html>\n' > $(SWAGGER_STATIC_DIR)/index.html

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
