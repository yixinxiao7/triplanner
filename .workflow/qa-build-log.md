# QA & Build Log

Tracks test runs, build results, and post-deploy health checks per sprint. Maintained by QA Engineer, Deploy Engineer, and Monitor Agent.

---

## Sprint #20 — Post-Deploy Health Check — 2026-03-10

**Test Type:** Post-Deploy Health Check + Config Consistency Validation
**Agent:** Monitor Agent (T-193)
**Environment:** Staging
**Timestamp:** 2026-03-10T12:57:00Z
**Deploy Verified:** **YES ✅**

---

### Config Consistency Validation

**Files checked:**
- `backend/.env` (development config)
- `backend/.env.staging` (staging config — active for this deployment)
- `frontend/vite.config.js`
- `infra/docker-compose.yml`

#### Dev Config (backend/.env + vite.config.js defaults)

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| Port match | `.env` PORT=3000 == Vite proxy default port (3000) | `.env` PORT=3000 / Vite proxy: `http://localhost:3000` | ✅ PASS |
| Protocol match | No SSL in `.env` → Vite proxy uses `http://` | SSL_KEY_PATH commented out / Vite defaults to `http://` | ✅ PASS |
| CORS match | `CORS_ORIGIN` includes `http://localhost:5173` | `CORS_ORIGIN=http://localhost:5173` / Vite dev port: 5173 | ✅ PASS |

#### Staging Config (backend/.env.staging + vite preview)

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| Port match | `.env.staging` PORT=3001, backend running on 3001 | PORT=3001 confirmed (HTTPS 3001 → HTTP 200) | ✅ PASS |
| Protocol match | SSL_KEY_PATH + SSL_CERT_PATH set → backend HTTPS; vite preview uses HTTPS if certs exist | Both set; certs exist at `infra/certs/localhost-key.pem` + `localhost.pem` | ✅ PASS |
| SSL cert files exist | Both cert files must exist on disk | `infra/certs/localhost.pem` ✅ `infra/certs/localhost-key.pem` ✅ | ✅ PASS |
| CORS match | `CORS_ORIGIN=https://localhost:4173` matches frontend preview origin | `.env.staging` CORS_ORIGIN=`https://localhost:4173`; frontend at `https://localhost:4173` | ✅ PASS |

#### Docker Compose

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| Backend port env | docker-compose backend `PORT: 3000` (container-internal) | Hardcoded `PORT: 3000` — no host port mapping for backend; nginx frontend proxies internally | ✅ PASS (not in use for staging; pm2 deployment) |

**Config Consistency Overall: ✅ PASS**

*Note: Staging deployment uses pm2, not Docker Compose. Docker config is consistent for its own containerized mode (backend internal-only, nginx frontend on port 80). No conflict with staging config.*

---

### Health Checks

#### Core Availability

| Check | Endpoint | Expected | Actual | Result |
|-------|----------|----------|--------|--------|
| App responds | `GET https://localhost:3001/api/v1/health` | HTTP 200 | HTTP 200, body: `{"status":"ok"}` | ✅ PASS |
| Frontend accessible | `GET https://localhost:4173` | HTTP 200 | HTTP 200 | ✅ PASS |
| Frontend dist built | `frontend/dist/` exists | index.html + assets | `dist/index.html`, `dist/assets/` | ✅ PASS |
| HTTP port 3000 (dev) | `GET http://localhost:3000/api/v1/health` | Staging uses 3001; port 3000 not served | Connection refused (000) | ✅ EXPECTED |

#### Authentication Endpoints

| Check | Endpoint | Expected | Actual | Result |
|-------|----------|----------|--------|--------|
| Register | `POST /api/v1/auth/register` | HTTP 201 + `{data:{user,access_token}}` | HTTP 201, user UUID + JWT returned | ✅ PASS |
| Login | `POST /api/v1/auth/login` | HTTP 200 + `{data:{user,access_token}}` | HTTP 200, user UUID + JWT returned | ✅ PASS |
| Refresh (no cookie) | `POST /api/v1/auth/refresh` | HTTP 401 `INVALID_REFRESH_TOKEN` | HTTP 401, `{"error":{"message":"Invalid or expired refresh token","code":"INVALID_REFRESH_TOKEN"}}` | ✅ PASS |

#### Trip Endpoints (Sprint 20 — notes field)

| Check | Endpoint | Expected | Actual | Result |
|-------|----------|----------|--------|--------|
| List trips (auth) | `GET /api/v1/trips` | HTTP 200 + `{data:[],pagination}` | HTTP 200, `{"data":[],"pagination":{"page":1,"limit":20,"total":0}}` | ✅ PASS |
| List trips (unauth) | `GET /api/v1/trips` (no token) | HTTP 401 UNAUTHORIZED | HTTP 401, `{"error":{"message":"Authentication required","code":"UNAUTHORIZED"}}` | ✅ PASS |
| Create trip + notes | `POST /api/v1/trips` | HTTP 201, response includes `notes` field | HTTP 201, `notes:"Sprint 20 monitor test notes"` present in response | ✅ PASS |
| Get trip detail | `GET /api/v1/trips/:id` | HTTP 200, response includes `notes` field | HTTP 200, `notes` field present | ✅ PASS |
| Update notes | `PATCH /api/v1/trips/:id` `{notes:"..."}` | HTTP 200, notes updated in response | HTTP 200, `notes:"Updated sprint 20 notes"`, `updated_at` bumped | ✅ PASS |



---

## Sprint #24 — T-205 Pre-Deploy Infrastructure Readiness Check — 2026-03-10

**Test Type:** Pre-Deploy Infrastructure Readiness Check
**Agent:** Deploy Engineer (T-205)
**Environment:** Staging
**Timestamp:** 2026-03-10T00:00:00Z
**Deploy Status:** ⛔ BLOCKED — Pre-deploy gate not met (T-204 not done)

---

### Why T-205 Is Blocked

T-205 requires T-204 (QA Engineer: security checklist + test re-verification) to be **Done** with a handoff in `handoff-log.md` before any deployment proceeds. As of this check:

| Dependency | Status | Reason |
|------------|--------|--------|
| T-202 (User Agent walkthrough) | Backlog | 5th consecutive carry-over — not yet executed |
| T-203 (vitest upgrade 1.x → 4.x) | Backlog | Blocked by T-202 triage |
| T-207 (Design spec — status filter) | ✅ Done | No blocker |
| T-208 (StatusFilterTabs frontend impl) | Backlog | Awaiting T-202 triage gate |
| T-204 (QA: security + test re-verification) | Backlog | Blocked by T-203 + T-208 |
| **T-205 (Deploy)** | **BLOCKED** | **Pre-deploy gate (T-204) not satisfied** |

No Sprint 24 QA confirmation exists in `handoff-log.md`. Deployment **cannot proceed**.

---

### Infrastructure Pre-Verification Checks (performed now)

These checks were run proactively to ensure the deploy can proceed immediately once T-204 is complete.

#### 1. ecosystem.config.cjs — CRITICAL Regression Check

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| `triplanner-frontend` entry exists | Present | `apps[1].name: 'triplanner-frontend'` | ✅ PASS |
| `env.BACKEND_PORT` | `'3001'` | `'3001'` | ✅ PASS |
| `env.BACKEND_SSL` | `'true'` | `'true'` | ✅ PASS |
| `triplanner-backend` port | `3001` | `PORT: 3001` in env | ✅ PASS |

**ecosystem.config.cjs: ✅ CORRECTLY CONFIGURED** — No changes required.

#### 2. Database Migrations — Sprint 24

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| Migrations required | None (T-203 is dev-dep only; T-208 is client-side only) | 0 pending migrations for Sprint 24 | ✅ PASS |
| Total applied | 10 (001–010) | 10 confirmed in `technical-context.md` | ✅ PASS |

**No `knex migrate:latest` required for Sprint 24 deploy.** Schema is unchanged.

#### 3. pm2 Process Status

| Process | Status | Notes |
|---------|--------|-------|
| `triplanner-backend` | ✅ online (PID 27774) | Port 3001, uptime 90m+ |
| `triplanner-frontend` | ✅ online (PID 29092) | Port 4173, uptime 77m+ |

Current staging serves Sprint 22 code (TripStatusSelector live). Both services are stable.

#### 4. Sprint 24 Deploy Scope (when T-204 clears)

When T-204 completes and issues a handoff, T-205 will perform:
1. `npm run build` in `frontend/` → verify 0 errors (picks up T-208 StatusFilterTabs + T-203 vitest-only dependency bump)
2. `pm2 reload triplanner-frontend` — hot-reload frontend with new build
3. `pm2 restart triplanner-backend` — restart backend (T-203 vitest is dev-dep only, but restart confirms clean state)
4. No migrations — confirmed above
5. Smoke tests: `GET /health → 200`; status filter tabs render on home page; TripStatusSelector renders; `PATCH /trips/:id status → 200`; trip notes key present

---

**Build Status:** N/A — not yet executed (blocked)
**Environment:** Staging
**Pre-Verification:** ✅ PASS (infrastructure ready — no config changes required)
**Blocker:** T-204 (QA confirmation) not done → T-205 cannot proceed

---
