COMPOSE_ENV_FILE?=.env

.PHONY: help up up-btc up-cln down down-btc down-cln

help:
	@echo "Targets: up, down, up-clean"

up:
	@docker compose --env-file $(COMPOSE_ENV_FILE) up -d

up-btc:
	@docker compose --env-file $(COMPOSE_ENV_FILE) up -d btc

up-cln:
	@docker compose --env-file $(COMPOSE_ENV_FILE) up -d cln

down:
	@docker compose --env-file $(COMPOSE_ENV_FILE) down

down-btc:
	@docker compose --env-file $(COMPOSE_ENV_FILE) down btc

down-cln:
	@docker compose --env-file $(COMPOSE_ENV_FILE) down cln