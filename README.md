# NextStep

AI-powered adaptive learning platform that turns static curricula into living knowledge graphs — personalized career roadmaps that evolve with the tech industry.

## Tech Stack

- **Frontend**: Next.js + React Flow + Framer Motion + Tailwind CSS
- **Backend**: FastAPI (Python)
- **Database**: PostgreSQL + Neo4j
- **AI**: OpenAI API

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- Python 3.11+

### Setup

1. Clone and configure:
   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   cp frontend/.env.local.example frontend/.env.local
   ```

2. Start infrastructure:
   ```bash
   make up
   ```

3. Backend:
   ```bash
   cd backend
   pip install -e .
   alembic upgrade head
   python -m scripts.seed_graph
   python -m scripts.seed_content
   uvicorn app.main:app --reload --port 8000
   ```

4. Frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### Services
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Neo4j Browser: http://localhost:7474
- PostgreSQL: localhost:5432
