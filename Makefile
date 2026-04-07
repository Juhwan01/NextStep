.PHONY: up down dev-backend dev-frontend dev migrate seed

up:
	docker compose up -d

down:
	docker compose down

dev-backend:
	cd backend && uvicorn app.main:app --reload --port 8000

dev-frontend:
	cd frontend && npm run dev

dev:
	make up
	@echo "PostgreSQL: localhost:5432"
	@echo "Neo4j Browser: http://localhost:7474"
	@echo "Run 'make dev-backend' and 'make dev-frontend' in separate terminals"

migrate:
	cd backend && alembic upgrade head

seed:
	cd backend && python -m scripts.seed_graph
	cd backend && python -m scripts.seed_content
