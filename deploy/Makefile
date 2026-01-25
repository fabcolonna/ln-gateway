COMPOSE ?= docker compose
COMPOSE_FILE ?= docker-compose.yml
COMPOSE_ENV_FILE ?= .env

.PHONY: help env-check build up down restart

help:
	@echo "deploy/: targets: build, up, down, restart"

env-check:
	@test -f $(COMPOSE_ENV_FILE) || (echo "Missing deploy/.env (copy deploy/.env.example -> deploy/.env)"; exit 2)

build: env-check
	@$(COMPOSE) -f $(COMPOSE_FILE) --env-file $(COMPOSE_ENV_FILE) build

up: env-check
	@$(COMPOSE) -f $(COMPOSE_FILE) --env-file $(COMPOSE_ENV_FILE) up -d --build

down:
	@$(COMPOSE) -f $(COMPOSE_FILE) --env-file $(COMPOSE_ENV_FILE) down

restart: env-check
	@$(COMPOSE) -f $(COMPOSE_FILE) --env-file $(COMPOSE_ENV_FILE) restart

