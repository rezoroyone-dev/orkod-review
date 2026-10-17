.PHONY: build down up restart up_dev restart_dev build_dev

build:
	docker compose down --remove-orphans
	
	set DOCKER_BUILDKIT=1
	set COMPOSE_DOCKER_CLI_BUILD=1
	docker compose build
	
	docker compose up -d

down:
	docker compose down --remove-orphans

up:
	docker compose up -d

restart: down up

up_dev:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

restart_dev: down up_dev

build_dev: down
	docker compose -f docker-compose.yml -f docker-compose.dev.yml build
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d