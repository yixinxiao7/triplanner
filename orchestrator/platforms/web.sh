#!/usr/bin/env bash
# Platform config: Web Application (React + Vite + Express + PostgreSQL)
# Sourced by orchestrate.sh when PLATFORM=web

PLATFORM_NAME="Web Application"
PLATFORM_DESCRIPTION="Single-page web app with React frontend and Express REST API backend"

# ── Tech Stack ───────────────────────────────────────────────────────
PLATFORM_FRONTEND="React 18 + Vite"
PLATFORM_BACKEND="Node.js + Express"
PLATFORM_DATABASE="PostgreSQL + Knex.js"
PLATFORM_AUTH="JWT (access + refresh tokens)"

# ── Directory Layout ─────────────────────────────────────────────────
PLATFORM_FRONTEND_DIR="frontend"
PLATFORM_BACKEND_DIR="backend"
PLATFORM_SHARED_DIR="shared"
PLATFORM_INFRA_DIR="infra"

# ── Commands ─────────────────────────────────────────────────────────
PLATFORM_FRONTEND_INSTALL="cd ${PROJECT_ROOT}/frontend && npm install"
PLATFORM_BACKEND_INSTALL="cd ${PROJECT_ROOT}/backend && npm install"
PLATFORM_FRONTEND_BUILD="cd ${PROJECT_ROOT}/frontend && npm run build"
PLATFORM_BACKEND_BUILD=""  # No build step for Express
PLATFORM_FRONTEND_DEV="cd ${PROJECT_ROOT}/frontend && npm run dev"
PLATFORM_BACKEND_DEV="cd ${PROJECT_ROOT}/backend && npm run dev"
PLATFORM_FRONTEND_TEST="cd ${PROJECT_ROOT}/frontend && npm test"
PLATFORM_BACKEND_TEST="cd ${PROJECT_ROOT}/backend && npm test"
PLATFORM_MIGRATE="cd ${PROJECT_ROOT}/backend && npm run migrate"
PLATFORM_MIGRATE_ROLLBACK="cd ${PROJECT_ROOT}/backend && npm run migrate:rollback"
PLATFORM_DB_START="cd ${PROJECT_ROOT}/infra && docker-compose up -d"

# ── URLs ─────────────────────────────────────────────────────────────
PLATFORM_FRONTEND_URL="http://localhost:5173"
PLATFORM_BACKEND_URL="http://localhost:3000"
PLATFORM_HEALTH_ENDPOINT="${PLATFORM_BACKEND_URL}/api/v1/health"

# ── Architecture Template ────────────────────────────────────────────
# This gets written to architecture.md during setup
platform_architecture_overrides() {
    cat <<'ARCH'
## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | React 18 + Vite | SPA with React Router for navigation |
| Backend | Node.js + Express | REST API with JWT authentication |
| Database | PostgreSQL | Relational database with Knex.js for query building and migrations |
| Auth | JWT (jsonwebtoken) | Access tokens (15 min) + refresh tokens (7 days) |
| Hosting | TBD | Frontend: static hosting, Backend: container hosting |
| CI/CD | TBD | GitHub Actions or similar |

## Environments

| Environment | Frontend URL | Backend URL | Purpose |
|------------|-------------|-------------|---------|
| Local | http://localhost:5173 | http://localhost:3000 | Development |
| Staging | TBD | TBD | Pre-release testing |
| Production | TBD | TBD | Live app |

## Hard Constraints

- All API endpoints must be RESTful
- No ORM magic — use explicit query builder (Knex) so queries are visible and reviewable
- Frontend must degrade gracefully without JavaScript (loading states, not blank pages)
- All environment-specific config goes through environment variables
- No circular dependencies between modules
ARCH
}

# ── Setup Steps ──────────────────────────────────────────────────────
platform_setup() {
    log_info "Setting up Web platform..."

    # Install backend dependencies
    if [[ -f "${PROJECT_ROOT}/backend/package.json" ]]; then
        log_info "Installing backend dependencies..."
        (cd "${PROJECT_ROOT}/backend" && npm install 2>&1) || log_warn "Backend npm install had issues"
    fi

    # Install frontend dependencies
    if [[ -f "${PROJECT_ROOT}/frontend/package.json" ]]; then
        log_info "Installing frontend dependencies..."
        (cd "${PROJECT_ROOT}/frontend" && npm install 2>&1) || log_warn "Frontend npm install had issues"
    fi

    # Start database if Docker is available
    if command -v docker &>/dev/null && command -v docker-compose &>/dev/null; then
        log_info "Starting PostgreSQL via Docker..."
        (cd "${PROJECT_ROOT}/infra" && docker-compose up -d 2>&1) || log_warn "Docker compose had issues"
    elif command -v docker &>/dev/null; then
        log_info "Starting PostgreSQL via Docker..."
        (cd "${PROJECT_ROOT}/infra" && docker compose up -d 2>&1) || log_warn "Docker compose had issues"
    else
        log_warn "Docker not available — database must be set up manually"
    fi

    # Set up backend .env if it doesn't exist
    if [[ ! -f "${PROJECT_ROOT}/backend/.env" ]] && [[ -f "${PROJECT_ROOT}/backend/.env.example" ]]; then
        log_info "Creating backend/.env from .env.example..."
        cp "${PROJECT_ROOT}/backend/.env.example" "${PROJECT_ROOT}/backend/.env"
    fi

    log_success "Web platform setup complete"
}

# ── Teardown ─────────────────────────────────────────────────────────
platform_teardown() {
    log_info "Tearing down Web platform..."
    if command -v docker-compose &>/dev/null; then
        (cd "${PROJECT_ROOT}/infra" && docker-compose down 2>&1) || true
    elif command -v docker &>/dev/null; then
        (cd "${PROJECT_ROOT}/infra" && docker compose down 2>&1) || true
    fi
}
