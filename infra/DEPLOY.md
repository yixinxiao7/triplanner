# TripPlanner Deployment Runbook

Step-by-step guide for deploying TripPlanner to staging and production environments.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Staging Deployment (Local)](#staging-deployment-local)
4. [Production Deployment (Docker)](#production-deployment-docker)
5. [Database Migrations](#database-migrations)
6. [Rollback Procedure](#rollback-procedure)
7. [Health Check Verification](#health-check-verification)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **PostgreSQL** 15+ (local or containerized)
- **Docker** and **Docker Compose** (for containerized deployment)
- **pm2** (for staging process management): `npm install -g pm2`
- **OpenSSL** (for TLS certificate generation)

---

## Local Development Setup

```bash
# 1. Clone the repository
git clone <repo-url> && cd triplanner

# 2. Install dependencies
cd backend && npm install && cd ../frontend && npm install && cd ..

# 3. Set up environment
cp backend/.env.example backend/.env
# Edit backend/.env with your database credentials and JWT secret

# 4. Start PostgreSQL (or use Docker)
docker compose -f infra/docker-compose.yml up postgres -d
# Or use local PostgreSQL

# 5. Run database migrations
cd backend && npm run migrate && cd ..

# 6. Start development servers
cd backend && npm run dev &     # Backend on http://localhost:3000
cd frontend && npm run dev &    # Frontend on http://localhost:5173
```

---

## Staging Deployment (Local)

Staging runs on localhost with HTTPS, pm2 process management, and production-like configuration.

### Initial Setup

```bash
# 1. Generate TLS certificates for HTTPS
./infra/scripts/generate-certs.sh

# 2. Configure staging environment
# Backend .env should have:
#   PORT=3001
#   NODE_ENV=staging
#   CORS_ORIGIN=https://localhost:4173
#   SSL_KEY_PATH=../infra/certs/localhost-key.pem
#   SSL_CERT_PATH=../infra/certs/localhost.pem
#   COOKIE_SECURE=true

# 3. Install pm2
npm install -g pm2

# 4. Run database migrations
cd backend && npm run migrate && cd ..

# 5. Build frontend
cd frontend && npm run build && cd ..

# 6. Start backend via pm2
pm2 start infra/ecosystem.config.cjs

# 7. Start frontend preview (HTTPS)
cd frontend && npx vite preview &
```

### Redeployment

```bash
# 1. Pull latest code
git pull origin <branch>

# 2. Install any new dependencies
cd backend && npm install && cd ../frontend && npm install && cd ..

# 3. Run any new migrations
cd backend && npm run migrate && cd ..

# 4. Rebuild frontend
cd frontend && npm run build && cd ..

# 5. Restart backend
pm2 restart triplanner-backend

# 6. Verify health
curl -sk https://localhost:3001/api/v1/health
curl -sk https://localhost:4173/
```

### Staging URLs

| Service  | URL                            |
|----------|--------------------------------|
| Backend  | https://localhost:3001         |
| Frontend | https://localhost:4173         |
| Health   | https://localhost:3001/api/v1/health |

---

## Production Deployment (Docker)

Production uses Docker Compose to run the full stack: PostgreSQL + backend + nginx (frontend).

### First-Time Setup

```bash
# 1. Copy and configure environment
cp infra/.env.docker.example infra/.env.docker

# Edit infra/.env.docker:
#   - Set a strong DB_PASSWORD (at least 32 characters)
#   - Set JWT_SECRET to a 64-character random hex string:
#       openssl rand -hex 32
#   - Set CORS_ORIGIN to your production domain
#   - Set COOKIE_SECURE=true

# 2. Build and start all services
docker compose -f infra/docker-compose.yml --env-file infra/.env.docker up --build -d

# 3. Verify services are healthy
docker compose -f infra/docker-compose.yml ps
# All services should show "healthy" or "running"

# 4. Check health endpoint
curl http://localhost/api/v1/health
# Should return: {"status":"ok"}
```

### Redeployment

```bash
# 1. Pull latest code
git pull origin main

# 2. Rebuild and restart (zero-downtime not supported yet)
docker compose -f infra/docker-compose.yml --env-file infra/.env.docker up --build -d

# The migrate service runs automatically before the backend starts.
# Wait for backend health check to pass.

# 3. Verify
docker compose -f infra/docker-compose.yml ps
curl http://localhost/api/v1/health
```

### Service Architecture

```
                    ┌──────────────────────┐
                    │   nginx (port 80)    │
                    │   Frontend SPA +     │
                    │   /api → backend     │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │   backend (port 3000)│
                    │   Node.js + Express  │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │   postgres (5432)    │
                    │   PostgreSQL 15      │
                    │   Persistent volume  │
                    └──────────────────────┘
```

---

## Database Migrations

Migrations are managed by Knex.js and run automatically in Docker via the `migrate` service.

### Manual Migration Commands

```bash
# Apply latest migrations
cd backend && npm run migrate

# Rollback last batch
cd backend && npm run migrate:rollback

# Check migration status
cd backend && npx knex migrate:status --knexfile src/config/knexfile.js
```

### Migration Safety Rules

1. **Always test on staging first** — never run a new migration on production without staging verification
2. **Migrations must be reversible** — every `up()` has a corresponding `down()`
3. **Back up the database** before running production migrations
4. **Check the migration log** in `.workflow/technical-context.md` for pending migrations

### Current Migrations

| # | Description | File |
|---|-------------|------|
| 001 | Create users table | `20260224_001_create_users.js` |
| 002 | Create refresh_tokens table | `20260224_002_create_refresh_tokens.js` |
| 003 | Create trips table | `20260224_003_create_trips.js` |
| 004 | Create flights table | `20260224_004_create_flights.js` |
| 005 | Create stays table | `20260224_005_create_stays.js` |
| 006 | Create activities table | `20260224_006_create_activities.js` |
| 007 | Add start_date/end_date to trips | `20260225_007_add_trip_date_range.js` |
| 008 | Make activity times optional | `20260225_008_make_activity_times_optional.js` |

---

## Rollback Procedure

If a deployment causes issues, follow these steps:

### Staging (pm2)

```bash
# 1. Stop the current backend
pm2 stop triplanner-backend

# 2. Rollback database migration (if applicable)
cd backend && npm run migrate:rollback && cd ..

# 3. Checkout the previous known-good commit
git checkout <last-good-commit>

# 4. Reinstall dependencies and rebuild
cd backend && npm install && cd ../frontend && npm install && npm run build && cd ..

# 5. Restart
pm2 restart triplanner-backend

# 6. Verify
curl -sk https://localhost:3001/api/v1/health
```

### Production (Docker)

```bash
# 1. Stop current deployment
docker compose -f infra/docker-compose.yml down

# 2. Rollback database migration (connect to postgres container)
docker compose -f infra/docker-compose.yml run --rm backend \
  node -e "import('./src/config/knexfile.js').then(m => import('knex').then(k => k.default(m.default.production).migrate.rollback().then(r => { console.log('Rollback:', r); process.exit(0); })))"

# 3. Checkout the previous known-good tag/commit
git checkout <last-good-commit>

# 4. Rebuild and restart
docker compose -f infra/docker-compose.yml --env-file infra/.env.docker up --build -d

# 5. Verify
curl http://localhost/api/v1/health
```

### Rollback Checklist

- [ ] Identify the issue (check logs: `pm2 logs` or `docker compose logs`)
- [ ] Determine if a database rollback is needed
- [ ] Rollback database migration BEFORE reverting code (if migration was applied)
- [ ] Revert to last known-good code
- [ ] Rebuild and restart services
- [ ] Verify health check passes
- [ ] Log the incident in `.workflow/qa-build-log.md`
- [ ] Notify Manager Agent to create a Hotfix task

---

## Health Check Verification

After every deployment, verify these endpoints:

### Basic Health

```bash
# Backend health
curl -s https://localhost:3001/api/v1/health
# Expected: {"status":"ok"}

# Frontend loads
curl -sk https://localhost:4173/ | head -1
# Expected: <!doctype html>
```

### Smoke Test

```bash
# Register a test user
curl -sk -X POST https://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Deploy Test","email":"deploy-test-'$(date +%s)'@test.com","password":"password123"}'
# Expected: 201 with user data + access_token

# Create a trip
# (use the access_token from register response)
curl -sk -X POST https://localhost:3001/api/v1/trips \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"name":"Test Trip","destinations":["Test City"]}'
# Expected: 201 with trip data
```

---

## Troubleshooting

### Backend won't start

```bash
# Check pm2 logs
pm2 logs triplanner-backend --lines 50

# Common issues:
# - Port in use: lsof -ti :3001 | xargs kill -9
# - Missing .env: cp backend/.env.example backend/.env
# - Database not running: pg_isready -h localhost -p 5432
# - Missing migrations: cd backend && npm run migrate
```

### Frontend build fails

```bash
# Check for dependency issues
cd frontend && rm -rf node_modules && npm install

# Check build output
cd frontend && npm run build 2>&1
```

### Database connection issues

```bash
# Test PostgreSQL connectivity
psql postgres://user:password@localhost:5432/appdb -c "SELECT 1"

# Check if tables exist
psql postgres://user:password@localhost:5432/appdb -c "\dt"

# Check migration status
cd backend && npx knex migrate:status --knexfile src/config/knexfile.js
```

### Docker issues

```bash
# View all container logs
docker compose -f infra/docker-compose.yml logs

# Rebuild from scratch
docker compose -f infra/docker-compose.yml down -v
docker compose -f infra/docker-compose.yml up --build

# Check container health
docker compose -f infra/docker-compose.yml ps
```

---

*Last updated: 2026-02-25 (Sprint 3, T-051)*
