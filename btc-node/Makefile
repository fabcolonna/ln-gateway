COMPOSE_ENV_FILE?=.env

.PHONY: help up down up-clean

help:
	@echo "Targets: up, down, up-clean"

up:
	@docker compose --env-file $(COMPOSE_ENV_FILE) up -d

down:
	@docker compose --env-file $(COMPOSE_ENV_FILE) down

up-clean:
	@docker compose --env-file $(COMPOSE_ENV_FILE) down -v --remove-orphans
	@docker compose --env-file $(COMPOSE_ENV_FILE) up -d