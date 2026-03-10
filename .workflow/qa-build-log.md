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

## Sprint 22 — Deploy Engineer Build Log

### T-199: Staging Re-Deployment Attempt — 2026-03-10

**Deploy Engineer:** Sprint 22 staging re-deployment
**Date:** 2026-03-10
**Environment:** Staging
**Build Status:** ⛔ NOT STARTED — Pre-deploy gate not met

#### Pre-Deploy Gate Check

| Gate | Required | Actual | Status |
|------|----------|--------|--------|
| T-198 QA integration testing Done | Required | Backlog (not run) | ❌ FAIL |
| T-197 QA security checklist Done | Required | Backlog (not run) | ❌ FAIL |
| T-196 TripStatusSelector.jsx built | Required | Backlog (not run) | ❌ FAIL |
| QA → Deploy handoff in handoff-log.md | Required | Not present | ❌ FAIL |

#### Infrastructure Pre-Flight Check (completed autonomously)

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| pm2 triplanner-backend | online | online (port 3001, 8h uptime) | ✅ PASS |
| pm2 triplanner-frontend | online | online (7h uptime) | ✅ PASS |
| GET /api/v1/health | 200 {"status":"ok"} | 200 {"status":"ok"} | ✅ PASS |
| No new migrations needed | N/A (status col since Sprint 1) | Confirmed (migration 003) | ✅ PASS |

#### Result

**Deploy BLOCKED.** The infrastructure is healthy and ready. The deploy is blocked exclusively by missing QA sign-off on Sprint 22 (T-197 + T-198). Root cause: T-196 (TripStatusSelector frontend component) has not been built.

**Action:** Logged Status: Blocked in handoff-log.md and dev-cycle-tracker.md. Awaiting Frontend Engineer (T-196) → QA (T-197, T-198) → Deploy handoff.

