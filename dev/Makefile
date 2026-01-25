.PHONY: help env-check btc-up btc-down cln-host

help:
	@echo "dev/: targets: btc-up, btc-down, cln-host"
	@echo "Shared env file: dev/.env (copy from dev/.env.example)"

env-check:
	@test -f .env || (echo "Missing dev/.env (copy dev/.env.example -> dev/.env)"; exit 2)

COMPOSE ?= docker compose
ENV_FILE ?= .env
BTC_COMPOSE_FILE ?= bitcoin/docker-compose.yml

btc-up: env-check
	@$(COMPOSE) -f $(BTC_COMPOSE_FILE) --env-file $(ENV_FILE) up -d

btc-down: env-check
	@$(COMPOSE) -f $(BTC_COMPOSE_FILE) --env-file $(ENV_FILE) down

cln-host: env-check
	@bash ./cln-host/run.sh
