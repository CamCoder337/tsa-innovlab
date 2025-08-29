# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚛 Project Overview

TSA InnovLab is a logistics platform built for the TSA Contest 2025 - an "Uber for logistics" connecting transporters, freight forwarders, and administrators in a unified digital ecosystem.

## 🏗️ Architecture

This is a monorepo with microservices architecture:

```
├── apps/
│   └── frontend-web/          # React + TypeScript + Vite frontend
├── services/
│   ├── tsa-monolith/          # AdonisJS main API (TypeScript)
│   └── tsa-ai/               # FastAPI AI/ML services (Python)
└── tools/                    # Deployment scripts
```

### Service Communication
- **Frontend** (port 5173) → **tsa-monolith** (port 3333) → **tsa-ai** (port 8000)
- Authentication is handled by AdonisJS monolith
- AI services consume ML models for ETA prediction, route optimization, and recommendations

## 🛠️ Development Commands

### AdonisJS Monolith (services/tsa-monolith/)
```bash
npm install                    # Install dependencies
npm run dev                    # Start development server (port 3333)
npm run build                  # Build for production
npm test                       # Run tests (uses Japa framework)
npm run lint                   # ESLint
npm run format                 # Prettier
npm run typecheck              # TypeScript check

# AdonisJS specific commands
node ace migration:run         # Run database migrations
node ace serve --hmr          # Development with hot reload
node ace build                 # Build application
```

### FastAPI AI Service (services/tsa-ai/)
```bash
python -m venv venv            # Create virtual environment
source venv/bin/activate       # Activate (Windows: venv\Scripts\activate)
pip install -r requirements.txt # Install dependencies

# Development
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Testing & Quality
pytest tests/                  # Run tests
pytest tests/ --cov=app       # Run with coverage
black .                        # Code formatting
isort .                        # Import sorting
flake8 .                       # Linting
```

### Frontend Web (apps/frontend-web/)
```bash
yarn install                   # Install dependencies  
yarn dev                       # Start development (port 5173)
yarn build                     # Build for production
yarn lint                      # ESLint
yarn format                    # Prettier
yarn preview                   # Preview production build
```

## 🗂️ Key Architecture Patterns

### AdonisJS Structure
- Uses **Lucid ORM** for database operations
- **JWT authentication** with sessions
- Import aliases: `#models/*`, `#services/*`, `#controllers/*`, etc.
- Tests organized in `tests/unit/` and `tests/functional/`

### FastAPI Structure
- **Pydantic** schemas for validation (`app/schemas/`)
- **SQLAlchemy** models (`app/models/`)
- Service layer pattern (`app/services/`)
- ML models stored in `ml_models/` directory
- Health checks at `/api/ai/health`

### Frontend Structure  
- **React 19** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** with **shadcn/ui** components
- Component library in `src/components/ui/`

## 🗄️ Database

- **Development**: SQLite (`tsa_contest.db`)
- **Production**: PostgreSQL
- Migrations managed through AdonisJS Lucid ORM

## 🧪 Testing

### Test Structure
- **AdonisJS**: Japa framework, unit/functional tests in `tests/`
- **FastAPI**: pytest with async support, tests in `tests/`
- **Frontend**: No specific testing setup currently configured

### Running Tests
```bash
# AdonisJS tests
cd services/tsa-monolith && npm test

# Python tests  
cd services/tsa-ai && pytest tests/

# Test with coverage
cd services/tsa-ai && pytest tests/ --cov=app
```

## 🔧 Configuration

Environment files are located in:
- `services/tsa-monolith/.env` (AdonisJS config)
- `services/tsa-ai/.env` (Python/FastAPI config)  
- `apps/frontend-web/.env.example` (Frontend config)

Key environment variables:
- `DATABASE_URL`: SQLite/PostgreSQL connection
- `FASTAPI_BASE_URL`: AI service URL (default: http://localhost:8000)
- `ADONIS_API_URL`: Main API URL (default: http://localhost:3333)

## 📊 AI/ML Features

The AI service (`tsa-ai`) provides:
- **ETA Prediction**: ML-based delivery time estimates  
- **Route Optimization**: Algorithm-based route planning
- **Anomaly Detection**: Transport delay detection
- **Product Recommendations**: E-commerce recommendation engine

## 🚀 Development Workflow

1. Start AdonisJS API: `cd services/tsa-monolith && npm run dev`
2. Start FastAPI service: `cd services/tsa-ai && uvicorn app.main:app --reload`  
3. Start frontend: `cd apps/frontend-web && yarn dev`

Access:
- Frontend: http://localhost:5173
- AdonisJS API: http://localhost:3333  
- FastAPI docs: http://localhost:8000/docs

## 📋 Code Quality Standards

- **TypeScript**: Strict mode enabled for AdonisJS and frontend
- **Python**: Follow PEP8, use Black formatter, type hints required
- **Testing**: Maintain test coverage, especially for business logic
- **Linting**: Use ESLint for TypeScript, flake8 for Python
- **Git**: Use conventional commits, feature branches

## ⚠️ Important Notes

- This is a contest submission for TSA Contest 2025
- Authentication flow: Frontend → AdonisJS → FastAPI (via headers)
- Database migrations should be run through AdonisJS (`node ace migration:run`)
- AI models are loaded on FastAPI startup - check logs for ML model status
- Safe deployment scripts available in `tools/` directory