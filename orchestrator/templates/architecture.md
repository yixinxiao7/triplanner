# architecture.md — System Architecture

This document describes the high-level architecture of the application. All agents must consult this before making any technical decisions.

**Platform:** Check `orchestrator/config.sh` and `.workflow/project-brief.md` for the active platform (web or mobile). Platform-specific conventions are defined in `orchestrator/platforms/`.

## Tech Stack (Web — default)

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | React 18 + Vite | SPA with React Router for navigation |
| Backend | Node.js + Express | REST API with JWT authentication |
| Database | PostgreSQL | Relational database with Knex.js for query building and migrations |
| Auth | JWT (jsonwebtoken) | Access tokens (15 min) + refresh tokens (7 days) |
| Hosting | TBD | Frontend: static hosting, Backend: container hosting |
| CI/CD | TBD | GitHub Actions or similar |

## Tech Stack (Mobile — when PLATFORM=mobile)

| Layer | Technology | Notes |
|-------|-----------|-------|
| Mobile App | React Native + Expo | Cross-platform iOS/Android with Expo managed workflow |
| Navigation | React Navigation | Stack and tab navigators with typed routes |
| Backend | Node.js + Express | Same REST API as web |
| Database | PostgreSQL | Same database layer as web |
| Auth | JWT + Expo SecureStore | Tokens stored securely on device, never in AsyncStorage |
| Hosting | TBD | Backend: container hosting, App: EAS Build → App Store / Google Play |

## Repository Structure

```
multi-agent-dev-workspace/
├── .agents/                → Agent system prompts
├── .workflow/              → Workflow docs, logs, specs, and tracking
├── orchestrator/           → Automated sprint runner
│   ├── orchestrate.sh      → Main entry point ("go" button)
│   ├── setup.sh            → Environment bootstrap
│   ├── config.sh           → Local config (platform, settings)
│   ├── lib/                → Shared utilities
│   ├── phases/             → Phase scripts (01-plan through 10-closeout)
│   └── platforms/          → Platform configs (web.sh, mobile.sh)
├── frontend/               → React + Vite application (web platform)
├── mobile/                 → React Native + Expo app (mobile platform)
├── backend/                → Express API (shared across platforms)
├── shared/                 → Shared types and constants
├── infra/                  → Docker, CI/CD, and deployment configs
├── CLAUDE.md               → Agent entry point
├── rules.md                → Non-negotiable rules
├── architecture.md         → This file
└── README.md               → Human-readable project overview
```

## Environments

| Environment | Frontend URL | Backend URL | Purpose |
|------------|-------------|-------------|---------|
| Local | http://localhost:5173 | http://localhost:3000 | Development |
| Staging | TBD | TBD | Pre-release testing |
| Production | TBD | TBD | Live app |

## API Design Conventions

- Base URL: `/api/v1/`
- Auth: Bearer token in `Authorization` header
- Response format (success): `{ "data": <payload> }`
- Response format (error): `{ "error": { "message": "<string>", "code": "<string>" } }`
- HTTP status codes: 200 (OK), 201 (Created), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 500 (Internal Server Error)
- Pagination: `?page=1&limit=20` → response includes `{ "data": [...], "pagination": { "page": 1, "limit": 20, "total": 100 } }`

## Data Models

Core entities and their relationships. Updated as the project evolves.

```
User
├── id (UUID, PK)
├── email (string, unique)
├── password_hash (string)
├── created_at (timestamp)
└── updated_at (timestamp)

// Add additional models here as the project evolves
```

## Hard Constraints

- All API endpoints must be RESTful
- No ORM magic — use explicit query builder (Knex) so queries are visible and reviewable
- Frontend must work without JavaScript disabled gracefully (loading states, not blank pages)
- All environment-specific config goes through environment variables
- No circular dependencies between modules
