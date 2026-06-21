.PHONY: dev dev-services install migrate db-studio deploy

# === Entwicklung ===

dev-services:
	docker compose -f docker-compose.dev.yml up -d

dev:
	bun run --cwd backend dev

dev-frontend:
	bun run --cwd frontend dev

install:
	cd packages/shared && bun install
	cd backend && bun install
	cd frontend && bun install
	bun install

migrate:
	bun run --cwd backend db:migrate

db-generate:
	bun run --cwd backend db:generate

db-studio:
	bun run --cwd backend db:studio

# === Deployment ===

deploy:
	./deploy.sh $(HOST)

# === Docker ===

docker-build:
	docker compose build

docker-up:
	docker compose up -d

docker-down:
	docker compose down
