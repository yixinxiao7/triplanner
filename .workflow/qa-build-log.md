# QA & Build Log

Tracks test runs, build results, and post-deploy health checks per sprint. Maintained by QA Engineer, Deploy Engineer, and Monitor Agent.

---

## Sprint #25 — T-215 Staging Deploy (Orchestrator Re-run) — 2026-03-10T23:10:00Z

**Date:** 2026-03-10
**Agent:** Deploy Engineer (T-215 — Orchestrator Sprint #25 invocation)
**Task:** T-215 — Sprint 25 staging re-deployment
**Environment:** Staging (local — `https://localhost:3001` backend, `https://localhost:4173` frontend)

---

### Pre-Deploy Gate Verification

| Check | Result | Notes |
|-------|--------|-------|
| QA T-214 handoff confirmed in handoff-log.md | ✅ CONFIRMED | QA logged T-214 Done with 340/340 backend + 486/486 frontend, 0 vulnerabilities, all security checklist items passing |
| All Sprint 25 tasks Done in dev-cycle-tracker.md | ✅ CONFIRMED | T-210 ✅, T-211 ✅, T-212 ✅, T-213 ✅, T-214 ✅ |
| Database migrations required | ✅ NONE | Sprint 25 T-212 is a read-only aggregation endpoint (`GET /api/v1/trips/:id/calendar`). No DDL changes. All 10 migrations (001–010) confirmed applied. No `knex migrate:latest` run. |
| TLS certificates present | ✅ EXISTS | `infra/certs/localhost-key.pem` + `infra/certs/localhost.pem` |
| Calendar route code present | ✅ EXISTS | `backend/src/routes/calendar.js` confirmed |

---

### Build Step

| Step | Command | Result |
|------|---------|--------|
| Backend `npm install` | `cd backend && npm install` | ✅ SUCCESS — 0 vulnerabilities |
| Frontend `npm install` | `cd frontend && npm install` | ✅ SUCCESS — 0 vulnerabilities |
| Frontend build | `cd frontend && npm run build` | ✅ SUCCESS |

**Frontend build output:**
```
vite v6.4.1 building for production...
✓ 128 modules transformed.
dist/index.html                   0.46 kB │ gzip:  0.29 kB
dist/assets/index-CPOhaw0p.css   84.43 kB │ gzip: 13.30 kB
dist/assets/index-Bz9Y7ALz.js   345.83 kB │ gzip: 105.16 kB
✓ built in 476ms
```

**Build Status: ✅ SUCCESS**

---

### Staging Deployment

| Component | Status | Details |
|-----------|--------|---------|
| Docker / docker-compose | ⚠️ NOT AVAILABLE | Docker not installed on this machine — using local processes as documented fallback |
| DB migrations | ✅ SKIPPED (none needed) | All 10 migrations (001–010) already applied; Sprint 25 has no new schema changes |
| Backend restart | ✅ SUCCESS | PID 53257 — `NODE_ENV=staging node src/index.js` |
| Backend health check | ✅ PASS | `curl -sk https://localhost:3001/api/v1/health` → `{"status":"ok"}` |
| Frontend restart | ✅ SUCCESS | Vite preview restarted with `BACKEND_PORT=3001 BACKEND_SSL=true` |
| Frontend smoke check | ✅ PASS | `curl -sk https://localhost:4173/` → HTML response confirmed |

**Environment: Staging**
**Build Status: ✅ SUCCESS**
**Deploy Status: ✅ SUCCESS**

---

### Service URLs (Staging)

| Service | URL | Protocol |
|---------|-----|----------|
| Backend API | `https://localhost:3001` | HTTPS (self-signed TLS) |
| Backend health | `https://localhost:3001/api/v1/health` | HTTPS |
| Calendar endpoint | `https://localhost:3001/api/v1/trips/:id/calendar` | HTTPS (auth required) |
| Frontend | `https://localhost:4173` | HTTPS (Vite preview, self-signed TLS) |

---

### Notes

- Docker is not available on this machine. Staging uses local Node.js processes with a local PostgreSQL instance (configured in `backend/.env.staging`: `postgres://yixinxiao@localhost:5432/triplanner`).
- Backend log file: `/tmp/triplanner-backend.log`
- Frontend log file: `/tmp/triplanner-frontend.log`
- No `knex migrate:latest` was run — Sprint 25 T-212 is a read-only aggregation endpoint with no schema changes. Migration count remains at 10 (001–010).
- Self-signed TLS certs in `infra/certs/` are used for both backend and frontend. Clients must use `-k` / `--insecure` flag or trust the cert locally.

**T-215 Status: ✅ DONE**

---

## Sprint 25 — QA Re-Verification (T-214 Confirmation) — 2026-03-10

**Date:** 2026-03-10
**QA Engineer:** QA Agent (Sprint #25 — Re-verification pass)
**Context:** T-214 was previously marked Done. This is a re-verification pass confirming the test baseline remains valid and the pipeline state is correct before Monitor Agent (T-216) proceeds.

---

### Test Type: Unit Test — Re-verification

**Date:** 2026-03-10

#### Backend Test Run

**Command:** `cd backend && npm test`
**Result:** ✅ PASS

| Metric | Result |
|--------|--------|
| Test files | 17 passed (17) |
| Total tests | **340 / 340 passed** |
| Duration | 522ms |
| Calendar tests (sprint25.test.js + calendarModel.unit.test.js) | 36 ✅ |

**Verdict:** ✅ All 340 backend tests pass. Test count unchanged from T-214 baseline. No regressions.

---

#### Frontend Test Run

**Command:** `cd frontend && npm test -- --run`
**Result:** ✅ PASS

| Metric | Result |
|--------|--------|
| Test files | 25 passed (25) |
| Total tests | **486 / 486 passed** |
| Duration | 1.69s |
| TripCalendar tests (TripCalendar.test.jsx) | 75 ✅ |

**Verdict:** ✅ All 486 frontend tests pass. Test count unchanged from T-214 baseline. No regressions.

---

### Test Type: Security Scan — Re-verification

**Date:** 2026-03-10

#### npm audit

| Package | Result |
|---------|--------|
| backend/ | ✅ 0 vulnerabilities |
| frontend/ | ✅ 0 vulnerabilities |

#### Security Spot-Checks

| Check | Command / Finding | Result |
|-------|-------------------|--------|
| `dangerouslySetInnerHTML` in component code | `grep -rn "dangerouslySetInnerHTML" frontend/src/components/ frontend/src/pages/` → 0 matches in production code | ✅ PASS |
| `innerHTML` / `document.write` / `__html` | `grep` over all `.jsx`/`.js` → 0 matches in non-test files | ✅ PASS |
| Hardcoded secrets in backend source | `grep -rn "secret\s*=\s*"` → 0 matches outside `process.env` | ✅ PASS |
| Error handler — no stack trace leak | `errorHandler.js`: 500s return "An unexpected error occurred"; stack logged server-side only | ✅ PASS |
| Calendar route auth enforcement | `router.use(authenticate)` + `uuidParamHandler` in `calendar.js` line 10/13 | ✅ PASS |
| Ownership check | `trip.user_id !== req.user.id` → 403 (calendar.js line 26) | ✅ PASS |
| SQL injection (calendarModel) | Only parameterized Knex queries; one `db.raw()` is static SQL with no user input | ✅ PASS |
| JWT secret from env | `jwt.verify(token, process.env.JWT_SECRET)` — no hardcoded value | ✅ PASS |
| CORS origin | `CORS_ORIGIN=http://localhost:5173` in `.env` — no wildcard | ✅ PASS |

**Overall Security Verdict:** ✅ No P1 security issues found. All applicable checklist items pass (unchanged from T-214).

---

### Test Type: Config Consistency Check — Re-verification

**Date:** 2026-03-10

| Check | Finding | Result |
|-------|---------|--------|
| backend/.env PORT=3000 matches vite proxy default | `PORT=3000`; vite defaults `backendPort='3000'` → `http://localhost:3000` | ✅ PASS |
| SSL: backend .env SSL lines absent/commented → vite uses `http://` | `BACKEND_SSL` env var not set → `backendSSL=false` → `http://` target | ✅ PASS |
| CORS_ORIGIN matches frontend dev server | `CORS_ORIGIN=http://localhost:5173`; vite `server.port=5173` | ✅ PASS |
| docker-compose backend PORT: 3000 | `PORT: 3000` in docker-compose backend service | ✅ PASS |
| docker-compose CORS uses nginx (expected for Docker context) | `CORS_ORIGIN: ${CORS_ORIGIN:-http://localhost}` — correct for nginx proxy in Docker | ✅ PASS (expected) |

**No config mismatches found.**

---

### Integration Check — API Contract Spot-check

| Contract item | Code location | Result |
|---------------|---------------|--------|
| Endpoint: `GET /api/v1/trips/:id/calendar` | `apiClient.get(\`/trips/${tripId}/calendar\`)` in TripCalendar.jsx:216 | ✅ |
| Response parsed as `response.data?.data?.events \|\| []` | TripCalendar.jsx:219 | ✅ |
| AbortController cleanup on unmount | `abortControllerRef.current.abort()` in useEffect cleanup | ✅ |
| Loading state | `setLoading(true)` before fetch, `false` in finally | ✅ |
| Error state | `setError(err)` in catch (ignores aborts) | ✅ |
| Section anchor IDs: flights-section, stays-section, activities-section | TripDetailsPage.jsx lines 802, 855+ | ✅ |
| `<TripCalendar tripId={tripId} />` rendered in TripDetailsPage | TripDetailsPage.jsx line 797 inside `.calendarWrapper` | ✅ |

---

### Re-verification Summary

| Gate | Result |
|------|--------|
| Backend tests: 340/340 | ✅ PASS |
| Frontend tests: 486/486 | ✅ PASS |
| npm audit backend: 0 vulns | ✅ PASS |
| npm audit frontend: 0 vulns | ✅ PASS |
| Security checklist (all applicable items) | ✅ PASS |
| Config consistency | ✅ PASS |
| API contract alignment spot-check | ✅ PASS |

**Re-verification Verdict:** ✅ All Sprint 25 QA gates confirmed passing. T-214 Done status is valid. Pipeline state correct — T-215 (Deploy) is Done, T-216 (Monitor Agent) is unblocked and should proceed immediately. No blockers.

---

## Sprint #25 — T-215 Staging Deploy — 2026-03-10T12:00:00Z

**Test Type:** Staging Deployment + Smoke Tests
**Agent:** Deploy Engineer (T-215)
**Environment:** Staging
**Timestamp:** 2026-03-10T12:00:00Z
**Build Status:** ✅ SUCCESS
**Deploy Status:** ✅ SUCCESS

---

### Pre-Deploy Gate

| Check | Result |
|-------|--------|
| QA Engineer T-214 handoff in handoff-log.md | ✅ CONFIRMED — 340/340 backend + 486/486 frontend PASS, 0 vulns, security checklist clear |
| `infra/ecosystem.config.cjs` `BACKEND_PORT: '3001'` on `triplanner-frontend` | ✅ CONFIRMED |
| `infra/ecosystem.config.cjs` `BACKEND_SSL: 'true'` on `triplanner-frontend` | ✅ CONFIRMED |
| Database migrations required | ✅ NONE — Sprint 25: T-212 is read-only aggregation. No DDL changes. All 10 migrations (001–010) already applied. |

---

### Build

| Step | Command | Result |
|------|---------|--------|
| Backend `npm install` | `cd backend && npm install` | ✅ SUCCESS — 0 vulnerabilities |
| Frontend `npm install` | `cd frontend && npm install` | ✅ SUCCESS — 0 vulnerabilities |
| Frontend build | `cd frontend && npm run build` | ✅ SUCCESS — 0 errors, 128 modules transformed |
| Bundle output | `dist/assets/index-Bz9Y7ALz.js` (345.83 kB / 105.16 kB gzip) | ✅ |
| CSS output | `dist/assets/index-CPOhaw0p.css` (84.43 kB / 13.30 kB gzip) | ✅ |
| Placeholder text in bundle | `grep "calendar coming" dist/...` | ✅ 0 matches — placeholder removed |
| TripCalendar in bundle | `grep "calendar" dist/...` | ✅ 1 match — component present |

---

### Deployment Steps

| Step | Command | Result |
|------|---------|--------|
| Reload frontend | `pm2 reload triplanner-frontend` | ✅ SUCCESS — PID 52135, online |
| Restart backend | `pm2 restart triplanner-backend` | ✅ SUCCESS — PID 52182, online |
| Database migrations | None required — Sprint 25 has no DDL changes | ✅ N/A |

---

### Post-Deploy pm2 Status

| Process | PID | Status | Uptime |
|---------|-----|--------|--------|
| triplanner-backend | 52182 | online | stable |
| triplanner-frontend | 52135 | online | stable |

---

### Smoke Tests

| Test | Expected | Result |
|------|----------|--------|
| `GET https://localhost:3001/api/v1/health` | HTTP 200 `{"status":"ok"}` | ✅ PASS |
| `GET https://localhost:4173/` | HTTP 200 | ✅ PASS |
| `GET /api/v1/trips/:id/calendar` (no auth) | HTTP 401 | ✅ PASS — auth enforced |
| TripCalendar in bundle (no old placeholder) | grep "calendar coming" = 0 matches | ✅ PASS |
| `infra/ecosystem.config.cjs` `BACKEND_PORT` | `'3001'` | ✅ PASS (regression check) |
| `infra/ecosystem.config.cjs` `BACKEND_SSL` | `'true'` | ✅ PASS (regression check) |

**All smoke tests PASS.**

---

### Notes

- No `knex migrate:latest` run — Sprint 25 T-212 (`GET /trips/:id/calendar`) is a read-only aggregation over existing `flights`, `stays`, `activities` tables. No schema changes. 10 migrations (001–010) remain applied.
- Frontend build produced a fresh bundle (hash changed from Sprint 24: `index-BXSQ7Eeh.js` → `index-Bz9Y7ALz.js`) confirming new TripCalendar code is included.
- Handoff to Monitor Agent (T-216) logged in `handoff-log.md`.

---

## Sprint #24 — T-205 Staging Deploy (FINAL EXECUTION) — 2026-03-10

**Test Type:** Staging Deployment + Smoke Tests
**Agent:** Deploy Engineer (T-205)
**Environment:** Staging
**Timestamp:** 2026-03-10T23:30:00Z
**Build Status:** ✅ SUCCESS
**Deploy Status:** ✅ SUCCESS

> **Note:** This is the actual deploy execution after T-204 QA PASS confirmed (handoff-log.md 2026-03-10).
> A prior entry below (timestamp 23:00:00Z) was from a pre-verification pass when T-205 was blocked.
> This entry reflects the fresh build + reload that completed the Sprint 24 deploy pipeline.

---

### Pre-Deploy Gate

| Check | Result |
|-------|--------|
| QA Engineer T-204 handoff in handoff-log.md | ✅ CONFIRMED — 304/304 backend + 481/481 frontend PASS, 0 vulns, security checklist clear |
| Manager Agent T-205 unblocked handoff in handoff-log.md | ✅ CONFIRMED |
| `infra/ecosystem.config.cjs` `BACKEND_PORT: '3001'` on `triplanner-frontend` | ✅ CONFIRMED |
| `infra/ecosystem.config.cjs` `BACKEND_SSL: 'true'` on `triplanner-frontend` | ✅ CONFIRMED |
| Database migrations required | ✅ NONE — Sprint 24: T-203 (dev-dep only) + T-208 (client-side only). All 10 migrations (001–010) already applied. |

---

### Build

| Step | Command | Result |
|------|---------|--------|
| Backend `npm install` | `cd backend && npm install` | ✅ SUCCESS — 0 vulnerabilities |
| Frontend `npm install` | `cd frontend && npm install` | ✅ SUCCESS — 0 vulnerabilities |
| Frontend build | `cd frontend && npm run build` | ✅ SUCCESS — 0 errors, 128 modules transformed |
| Bundle output | `dist/assets/index-BXSQ7Eeh.js` (347.85 kB / 105.60 kB gzip) | ✅ |
| CSS output | `dist/assets/index-Dcllg0GU.css` (82.94 kB / 13.18 kB gzip) | ✅ |

---

### Deployment Steps

| Step | Command | Result |
|------|---------|--------|
| Reload frontend | `pm2 reload triplanner-frontend` | ✅ SUCCESS — PID 39784, online |
| Restart backend | `pm2 restart triplanner-backend` | ✅ SUCCESS — PID 39827, online |
| Database migrations | None required | ✅ N/A |

---

### Post-Deploy pm2 Status

| Process | PID | Status | Uptime |
|---------|-----|--------|--------|
| triplanner-backend | 39827 | online | stable |
| triplanner-frontend | 39784 | online | stable |

---

### Smoke Tests

| Test | Expected | Result |
|------|----------|--------|
| `GET https://localhost:3001/api/v1/health` | HTTP 200 | ✅ PASS |
| `GET https://localhost:4173/` | HTTP 200 | ✅ PASS |
| Backend HTTPS on port 3001 | HTTPS Server running on https://localhost:3001 (pm2 out log) | ✅ PASS |
| Frontend Vite preview on port 4173 | `➜  Local: https://localhost:4173/` (pm2 out log) | ✅ PASS |

**All smoke tests PASS. No regressions detected.**

---

### Notes

- No `knex migrate:latest` run — 10 migrations (001–010) remain applied on staging, none pending for Sprint 24.
- `ecosystem.config.cjs` required no changes — `BACKEND_PORT` and `BACKEND_SSL` were pre-verified correct.
- Sprint 24 features (StatusFilterTabs, vitest 4.x) are confirmed in deployed bundle.
- Handoff logged to Monitor Agent (T-206) in handoff-log.md.

---

## Sprint #24 — T-205 Staging Deploy — 2026-03-10

**Test Type:** Staging Deployment + Smoke Tests
**Agent:** Deploy Engineer (T-205)
**Environment:** Staging
**Timestamp:** 2026-03-10T23:00:00Z
**Build Status:** ✅ SUCCESS
**Deploy Status:** ✅ SUCCESS

---

### Pre-Deploy Gate

| Check | Result |
|-------|--------|
| T-204 (QA) Done with handoff to Deploy | ✅ CONFIRMED — QA → Deploy handoff in handoff-log.md (2026-03-10) |
| `infra/ecosystem.config.cjs` `BACKEND_PORT: '3001'` | ✅ CONFIRMED |
| `infra/ecosystem.config.cjs` `BACKEND_SSL: 'true'` | ✅ CONFIRMED |
| Database migrations required | ✅ NONE — T-203 (dev-dep only) + T-208 (client-side only) |

---

### Build

| Step | Command | Result |
|------|---------|--------|
| Frontend build | `npm run build` in `frontend/` | ✅ SUCCESS — 0 errors, 128 modules transformed |
| Bundle output | `dist/assets/index-BXSQ7Eeh.js` (347.85 kB, 105.60 kB gzip) | ✅ |
| CSS output | `dist/assets/index-Dcllg0GU.css` (82.94 kB, 13.18 kB gzip) | ✅ |

---

### Deployment Steps

| Step | Command | Result |
|------|---------|--------|
| Reload frontend | `pm2 reload triplanner-frontend` | ✅ SUCCESS — PID 37955, online |
| Restart backend | `pm2 restart triplanner-backend` | ✅ SUCCESS — PID 38046, online |
| Database migrations | None required | ✅ N/A |

---

### Post-Deploy pm2 Status

| Process | PID | Status | Uptime |
|---------|-----|--------|--------|
| triplanner-backend | 38046 | online | stable |
| triplanner-frontend | 37955 | online | stable |

---

### Smoke Tests

| Test | Expected | Result |
|------|----------|--------|
| `GET https://localhost:3001/api/v1/health` | `{"status":"ok"}` | ✅ PASS |
| `GET https://localhost:4173/` | HTTP 200 | ✅ PASS |
| Frontend JS bundle loads | HTTP 200, bundle served | ✅ PASS |
| StatusFilterTabs code in bundle | `statusFilter`, `activeFilter`, `aria-pressed` strings present | ✅ PASS |
| POST /auth/register → create user | HTTP 200, access_token returned | ✅ PASS |
| POST /trips → create trip | HTTP 201, trip ID returned | ✅ PASS |
| GET /trips/:id → `notes` key present | `notes` key in response | ✅ PASS (Sprint 20 regression) |
| PATCH /trips/:id `{status:"ONGOING"}` | HTTP 200 | ✅ PASS (Sprint 22 regression) |

**All 8 smoke tests PASS. No regressions detected.**

---

### Notes

- No `knex migrate:latest` run — 10 migrations (001–010) remain unchanged on staging.
- `ecosystem.config.cjs` required no changes — `BACKEND_PORT` and `BACKEND_SSL` were already correct.
- Sprint 24 feature (StatusFilterTabs) is confirmed present in deployed bundle.
- Handoff logged to Monitor Agent (T-206).

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

---

## Sprint #24 — T-204 QA: Security Checklist + Test Re-Verification — 2026-03-10

**Test Type:** Unit Test + Integration Test + Security Scan + Config Consistency
**Agent:** QA Engineer (T-204)
**Sprint:** 24
**Tasks Covered:** T-203 (vitest upgrade), T-208 (StatusFilterTabs)
**Date:** 2026-03-10

---

### 1. Unit Tests — Backend

**Test Type:** Unit Test
**Command:** `cd backend && npm test -- --run`

| Metric | Result |
|--------|--------|
| Test Files | 15/15 passed |
| Total Tests | **304/304 passed** |
| Failures | 0 |
| Duration | ~552ms |

**Verdict:** ✅ PASS — meets the 304+ requirement.

---

### 2. Unit Tests — Frontend

**Test Type:** Unit Test
**Command:** `cd frontend && npm test -- --run`

| Metric | Result |
|--------|--------|
| Test Files | 25/25 passed |
| Total Tests | **481/481 passed** |
| Failures | 0 |
| Duration | ~1.93s |

**Key test files covering Sprint 24 scope:**

| File | Tests | Coverage |
|------|-------|---------|
| `src/__tests__/StatusFilterTabs.test.jsx` | 19 | Pill render, aria-pressed, tabIndex, click → onFilterChange, keyboard arrow nav, wrapping |
| `src/__tests__/HomePage.test.jsx` | 25 (11 new) | A–G spec cases + no-API-call guard + global-empty-state isolation |

**Happy-path and error-path coverage confirmed:**
- ✅ Happy path: filters render, active filter changes, "All" shows everything
- ✅ Error path: empty filtered state (0 matches), "Show all" reset, global empty state not suppressed

**Verdict:** ✅ PASS — meets the 481+ requirement (was 451 pre-T-208; +30 new tests).

---

### 3. npm audit — Backend

**Test Type:** Security Scan
**Command:** `cd backend && npm audit`

| Metric | Result |
|--------|--------|
| Vulnerabilities | **0** |
| B-021 (GHSA-67mh-4wv8-2f99) | ✅ Resolved by vitest 4.0.18 upgrade |

**Verdict:** ✅ PASS

---

### 4. npm audit — Frontend

**Test Type:** Security Scan
**Command:** `cd frontend && npm audit`

| Metric | Result |
|--------|--------|
| Vulnerabilities | **0** |
| B-021 (GHSA-67mh-4wv8-2f99) | ✅ Resolved by vitest 4.0.18 upgrade (installed as 4.0.18) |

**Verdict:** ✅ PASS

---

### 5. Code Security Review — Sprint 24 New Files

**Test Type:** Security Scan
**Files reviewed:** `StatusFilterTabs.jsx`, `StatusFilterTabs.module.css`, `HomePage.jsx` (changes only)

| Check | Result |
|-------|--------|
| `dangerouslySetInnerHTML` introduced | ✅ NONE — all text via React children (`filter.label`, `activeFilterLabel`) |
| Hardcoded secrets in new files | ✅ NONE |
| XSS vectors | ✅ NONE — no raw HTML insertion |
| API call on filter change | ✅ NONE — client-side filter only, confirmed via code inspection |

**Verdict:** ✅ PASS

---

### 6. Security Checklist — Full Applicable Items

**Test Type:** Security Scan
**Scope:** Full codebase audit for all applicable checklist items

#### Authentication & Authorization

| Item | Status | Notes |
|------|--------|-------|
| All API endpoints require authentication | ✅ PASS | All routes (`/api/v1/trips`, `/stays`, `/flights`, `/activities`, `/land-travel`) use `router.use(authenticate)` — blanket auth on every sub-route |
| Auth tokens have appropriate expiration | ✅ PASS | JWT 15m expiry, refresh token 7d, configured via env vars |
| Password hashing uses bcrypt/scrypt/argon2 | ✅ PASS | `bcrypt.hash(password, 12)` — cost factor 12 ✅ |
| Failed login attempts are rate-limited | ✅ PASS | `generalAuthLimiter` applied to `/auth/login`, `/auth/register` |

#### Input Validation & Injection Prevention

| Item | Status | Notes |
|------|--------|-------|
| User inputs validated server-side | ✅ PASS | Validation in route handlers; whitelist-based sort field/order validation |
| SQL queries use parameterized statements | ✅ PASS | Knex query builder used throughout. `sortBy` and `sortOrder` validated against whitelist (`VALID_SORT_BY`, `VALID_SORT_ORDER`) before use in `db.raw()`. ILIKE search uses escape-safe parameterization (B-033 fix) |
| HTML output sanitized (XSS) | ✅ PASS | No `dangerouslySetInnerHTML` anywhere in `frontend/src/` — only in a comment in `formatDate.js` confirming it is NOT used |

#### API Security

| Item | Status | Notes |
|------|--------|-------|
| CORS configured for expected origins only | ✅ PASS | `CORS_ORIGIN` env var (dev: `http://localhost:5173`). Not wildcard |
| Rate limiting on public endpoints | ✅ PASS | Auth endpoints rate-limited |
| API errors do not leak stack traces | ✅ PASS | `errorHandler.js` logs stack server-side only; returns `"An unexpected error occurred"` for 500s to clients |
| Security headers | ✅ PASS | `helmet()` applied in `app.js` — sets X-Content-Type-Options, X-Frame-Options, HSTS, etc. |

#### Data Protection

| Item | Status | Notes |
|------|--------|-------|
| DB credentials in env vars, not code | ✅ PASS | `DATABASE_URL`, `JWT_SECRET` read from `process.env`; `.env` is in `.gitignore` |
| `.env` not committed to repo | ✅ PASS | `.gitignore` includes `.env` and `.env.local` |

#### Infrastructure

| Item | Status | Notes |
|------|--------|-------|
| HTTPS enforced on staging | ✅ PASS | `ecosystem.config.cjs`: `BACKEND_SSL: 'true'`, `BACKEND_PORT: '3001'` — confirmed by Deploy Engineer pre-check |
| Dependencies free of known vulns | ✅ PASS | `npm audit` → 0 vulnerabilities in both backend and frontend |

**Verdict:** ✅ PASS — No security failures found.

---

### 7. Integration Test — API Contract Verification (T-208 / StatusFilterTabs)

**Test Type:** Integration Test

The Sprint 24 `StatusFilterTabs` feature is **fully client-side**. API contract verification:

| Contract Item | Expected | Actual |
|--------------|----------|--------|
| `GET /api/v1/trips` returns `status` field on each trip | `"PLANNING"` \| `"ONGOING"` \| `"COMPLETED"` | ✅ CONFIRMED — field exists in API contract; used in `trips.filter(t => t.status === activeFilter)` |
| No new API endpoint for filter change | None | ✅ CONFIRMED — `StatusFilterTabs` triggers no network call on click (code inspection + test coverage) |
| Filter logic matches contract mapping | `ALL` → no filter; others → exact match on `t.status` | ✅ CONFIRMED — code matches Spec 21.4 exactly |

**Verdict:** ✅ PASS

---

### 8. Integration Test — UI Spec Verification (Spec 21)

**Test Type:** Integration Test

| Spec Item | Expected | Actual |
|-----------|----------|--------|
| Four pills: All / Planning / Ongoing / Completed | Rendered in order | ✅ CONFIRMED — `FILTERS` array in exact order |
| Defaults to "All" | `activeFilter = "ALL"` on mount | ✅ CONFIRMED — `useState('ALL')` in `HomePage.jsx` |
| Active pill visually distinct | CSS `pillActive` class applied | ✅ CONFIRMED — conditional className on `isActive` |
| `role="group"` on container | Present | ✅ CONFIRMED — in JSX |
| `aria-pressed` on each pill | `true` for active, `false` for others | ✅ CONFIRMED — `aria-pressed={isActive}` |
| Roving tabIndex | Active pill `tabIndex=0`, others `-1` | ✅ CONFIRMED — `tabIndex={isActive ? 0 : -1}` |
| ArrowLeft/ArrowRight keyboard nav | Focus moves between pills with wrapping | ✅ CONFIRMED — `handleKeyDown` implementation |
| Empty filtered state message | `"No [Label] trips yet."` | ✅ CONFIRMED — `No {activeFilterLabel} trips yet.` |
| "Show all" link resets filter | `setActiveFilter("ALL")` | ✅ CONFIRMED — `onClick={() => setActiveFilter('ALL')}` |
| Global empty state not suppressed | `trips.length === 0` guard | ✅ CONFIRMED — `filteredTrips.length === 0 && activeFilter !== 'ALL' && trips.length > 0` guard prevents override |
| Location: above trip list, below heading | `StatusFilterTabs` between heading and grid | ✅ CONFIRMED — rendered after `initialLoadDone` check, before trip grid |
| Mobile: horizontal scroll, no wrapping | `overflow-x: auto` in CSS | ✅ CONFIRMED — `StatusFilterTabs.module.css` |

**Verdict:** ✅ PASS — All Spec 21 requirements met.

---

### 9. Config Consistency Check

**Test Type:** Config Consistency

| File | Config Item | Value | Match? |
|------|------------|-------|--------|
| `backend/.env` | `PORT` | `3000` | — |
| `frontend/vite.config.js` | proxy target port (dev default) | `BACKEND_PORT \|\| '3000'` → `3000` | ✅ Match |
| `backend/.env` | SSL enabled | No (commented out) | — |
| `frontend/vite.config.js` | proxy protocol | `BACKEND_SSL` unset → `http://` | ✅ Match |
| `backend/.env` | `CORS_ORIGIN` | `http://localhost:5173` | ✅ Includes frontend dev server origin |
| `infra/docker-compose.yml` | backend `PORT` | `3000` | ✅ Consistent with dev |
| `infra/ecosystem.config.cjs` (staging) | `BACKEND_PORT` + `BACKEND_SSL` | `3001` + `'true'` | ✅ Vite proxy reads env vars dynamically — correct for staging |

**No config mismatches found.**

**Verdict:** ✅ PASS

---

### Summary

| Check | Result |
|-------|--------|
| Backend unit tests (304 tests) | ✅ 304/304 PASS |
| Frontend unit tests (481 tests) | ✅ 481/481 PASS |
| Backend npm audit | ✅ 0 vulnerabilities |
| Frontend npm audit | ✅ 0 vulnerabilities |
| vitest versions upgraded (B-021) | ✅ backend `^4.0.18`, frontend `^4.0.0` (4.0.18) |
| No dangerouslySetInnerHTML introduced | ✅ PASS |
| No hardcoded secrets introduced | ✅ PASS |
| Security checklist (all applicable) | ✅ PASS |
| API contract compliance (T-208) | ✅ PASS |
| UI Spec 21 compliance (T-208) | ✅ PASS |
| Global empty state not suppressed | ✅ PASS |
| Config consistency | ✅ PASS |

**Overall QA Result: ✅ ALL CHECKS PASS**
**T-203 → Done. T-208 → Done. T-204 → Done.**
**Sprint 24 is cleared for deployment. Handoff to Deploy Engineer (T-205).**

---

## Sprint #24 — T-204 QA Re-Verification Pass — 2026-03-10

---
**Sprint:** #24
**Date:** 2026-03-10
**Test Type:** Unit Test | Security Scan | Config Consistency | Integration Test
**Task IDs:** T-203, T-208, T-204
**Tester:** QA Engineer

**Summary:** Pass

**Details:**

### 1. Backend Unit Tests

| Metric | Result |
|--------|--------|
| Command | `cd backend && npm test -- --run` |
| Test Files | 15/15 passed |
| Total Tests | **304/304 passed** |
| Failures | 0 |
| Duration | ~526ms |

**Verdict:** ✅ PASS

### 2. Frontend Unit Tests

| Metric | Result |
|--------|--------|
| Command | `cd frontend && npm test -- --run --passWithNoTests` |
| Test Files | 25/25 passed |
| Total Tests | **481/481 passed** |
| Failures | 0 |
| Duration | ~1.77s |

Key Sprint 24 test files confirmed on disk:
- `src/__tests__/StatusFilterTabs.test.jsx` — 19 tests (pill render, aria-pressed, tabIndex, click, keyboard nav, wrapping)
- `src/__tests__/HomePage.test.jsx` — 25 tests (11 new integration tests covering Spec 21 cases A–G)

**Verdict:** ✅ PASS

### 3. npm audit — Backend

| Metric | Result |
|--------|--------|
| Vulnerabilities | **0** |
| B-021 (GHSA-67mh-4wv8-2f99) | ✅ Resolved — vitest `^4.0.18` in backend/package.json |

**Verdict:** ✅ PASS

### 4. npm audit — Frontend

| Metric | Result |
|--------|--------|
| Vulnerabilities | **0** |
| B-021 (GHSA-67mh-4wv8-2f99) | ✅ Resolved — vitest `^4.0.0` (installed 4.0.18) in frontend/package.json |

**Verdict:** ✅ PASS

### 5. Security Checks (Re-Verification)

| Check | Result |
|-------|--------|
| `dangerouslySetInnerHTML` in frontend/src/ (excl. tests) | ✅ NONE — only in a comment in formatDate.js confirming it is NOT used |
| Hardcoded secrets in source | ✅ NONE — password strings in source are error messages, not credentials |
| SQL injection prevention | ✅ PASS — Knex query builder used throughout all models; no string concatenation of user input into SQL |
| Auth middleware on protected routes | ✅ PASS — `router.use(authenticate)` in trips, stays, flights, activities, landTravel routes |
| Error handler exposes stack traces | ✅ PASS — errorHandler.js logs server-side only; 500s return "An unexpected error occurred" |
| CORS_ORIGIN in backend .env | ✅ PASS — `http://localhost:5173` matches frontend dev server |

**Verdict:** ✅ PASS

### 6. Config Consistency (Re-Verification)

| Config Item | Value | Status |
|-------------|-------|--------|
| backend/.env PORT | 3000 | — |
| vite.config.js proxy target (dev default) | `BACKEND_PORT \|\| '3000'` → port 3000 | ✅ Match |
| backend/.env SSL | disabled (commented out) | — |
| vite.config.js proxy protocol | `BACKEND_SSL` unset → `http://` | ✅ Match |
| backend/.env CORS_ORIGIN | `http://localhost:5173` | ✅ Includes frontend dev origin |
| docker-compose.yml backend PORT | 3000 | ✅ Consistent |
| ecosystem.config.cjs (staging) | BACKEND_PORT=3001, BACKEND_SSL=true | ✅ Dynamic env var read by Vite — correct for staging |

**Verdict:** ✅ PASS — No config mismatches.

### 7. Integration Verification — T-208 (StatusFilterTabs)

- `StatusFilterTabs` component confirmed at `frontend/src/components/StatusFilterTabs.jsx` ✅
- Integrated into `HomePage.jsx` with `activeFilter` state (init `'ALL'`) ✅
- Filter logic: `filteredTrips = activeFilter === 'ALL' ? trips : trips.filter(t => t.status === activeFilter)` ✅
- Empty filtered state guard: `filteredTrips.length === 0 && activeFilter !== 'ALL' && trips.length > 0` ✅
- Global empty state (`trips.length === 0`) unaffected ✅
- A11y: `role="group"`, `aria-pressed`, roving `tabIndex`, ArrowLeft/ArrowRight keyboard nav ✅
- No new API call on filter change (client-side only) ✅

**Verdict:** ✅ PASS

### Summary

| Check | Result |
|-------|--------|
| Backend unit tests (304 tests) | ✅ 304/304 PASS |
| Frontend unit tests (481 tests) | ✅ 481/481 PASS |
| Backend npm audit | ✅ 0 vulnerabilities |
| Frontend npm audit | ✅ 0 vulnerabilities |
| vitest upgrade confirmed (B-021 resolved) | ✅ backend ^4.0.18, frontend ^4.0.0 (4.0.18) |
| Security checklist | ✅ PASS |
| Config consistency | ✅ PASS |
| T-208 integration verification | ✅ PASS |

**Overall QA Result: ✅ ALL CHECKS PASS**
**T-204 re-confirmed Done. T-205 (Deploy) is unblocked. Safe to deploy.**

**Issues Found:** None

---

## Sprint #24 — T-206 Post-Deploy Health Check — 2026-03-10T01:14:00Z

**Test Type:** Post-Deploy Health Check + Config Consistency Validation
**Environment:** Staging
**Timestamp:** 2026-03-10T01:14:00Z (2026-03-11T01:14:00Z UTC clock)
**Agent:** Monitor Agent
**Task:** T-206
**Deploy Reference:** T-205 (Deploy Engineer handoff 2026-03-10 — Backend https://localhost:3001, Frontend https://localhost:4173)

---

### Config Consistency Validation

> **Files read:** `backend/.env.staging` (loaded by `backend/src/index.js` when `NODE_ENV=staging`), `infra/ecosystem.config.cjs`, `frontend/vite.config.js`, `infra/docker-compose.yml`, `infra/certs/`

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| **Port match** — backend `.env.staging` PORT vs Vite proxy `BACKEND_PORT` | Both 3001 | `.env.staging` PORT=3001; ecosystem.config.cjs backend PORT=3001; frontend BACKEND_PORT='3001' → Vite proxy `https://localhost:3001` | ✅ PASS |
| **Protocol match** — SSL certs set → backend HTTPS; Vite proxy must use `https://` | HTTPS if SSL_KEY_PATH + SSL_CERT_PATH set and files exist | `.env.staging` SSL_KEY_PATH=../infra/certs/localhost-key.pem, SSL_CERT_PATH=../infra/certs/localhost.pem; cert files exist at `infra/certs/localhost.pem` + `localhost-key.pem`; `backend/src/index.js` starts HTTPS server; ecosystem.config.cjs frontend BACKEND_SSL='true' → `backendProtocol='https'` → proxy target `https://localhost:3001` | ✅ PASS |
| **CORS match** — CORS_ORIGIN includes frontend dev server origin | CORS_ORIGIN = `https://localhost:4173` | `.env.staging` CORS_ORIGIN=https://localhost:4173; Vite preview: port 4173 + TLS certs exist → serves HTTPS → origin `https://localhost:4173` | ✅ PASS |
| **Docker port mapping** — backend container PORT matches `.env` PORT | N/A (Docker not used for staging — pm2 ecosystem is used) | `docker-compose.yml` has backend `PORT: 3000` (hardcoded, no host port mapping — internal Docker network only). Docker is a separate production deployment path and is not active for this staging deploy. No mismatch. | ✅ N/A (Docker not active) |

**Config Consistency Result: ✅ PASS — All 3 active checks pass. Docker compose is not in use for this staging environment.**

**Additional config observation (non-blocking):**
- `backend/.env` (dev file) contains `JWT_SECRET=change-me-to-a-random-string`. This is a placeholder for local development and is never loaded in staging (staging loads `.env.staging` with a proper 64-char hex secret). Not a staging issue — flagged for awareness only.

---

### Post-Deploy Health Checks

**Backend URL:** https://localhost:3001
**Frontend URL:** https://localhost:4173
**Protocol:** HTTPS (self-signed cert, TLS confirmed active)
**pm2 Processes:** triplanner-backend (PID 39827), triplanner-frontend (PID 39784)

#### Liveness & Auth

| Check | Method | URL | Expected | Actual | Result |
|-------|--------|-----|----------|--------|--------|
| App responds | GET | /api/v1/health | HTTP 200, `{"status":"ok"}` | HTTP 200, `{"status":"ok"}` | ✅ PASS |
| Register new user | POST | /api/v1/auth/register | HTTP 201, user object + access_token | HTTP 201, `{"data":{"user":{...},"access_token":"eyJ..."}}` | ✅ PASS |
| Login | POST | /api/v1/auth/login | HTTP 200, user object + access_token | HTTP 200, `{"data":{"user":{...},"access_token":"eyJ..."}}` | ✅ PASS |
| Auth required enforced | GET | /api/v1/trips (no token) | HTTP 401 | HTTP 401 | ✅ PASS |
| Rate limiting header | POST | /api/v1/auth/login | `RateLimit-Limit: 10` header present | `RateLimit-Limit: 10`, `RateLimit-Policy: 10;w=900`, `RateLimit-Remaining: 8`, `RateLimit-Reset: 885` | ✅ PASS (Sprint 19 regression ✅) |

#### Core Trip Endpoints

| Check | Method | URL | Expected | Actual | Result |
|-------|--------|-----|----------|--------|--------|
| List trips | GET | /api/v1/trips | HTTP 200, `{"data":[...],"pagination":{...}}` | HTTP 200, `{"data":[],"pagination":{"page":1,"limit":20,"total":0}}` | ✅ PASS |
| Create trip | POST | /api/v1/trips | HTTP 201, trip object with `status`, `notes`, `start_date`, `end_date` | HTTP 201, trip created with `status:"PLANNING"`, `notes:null`, `start_date:"2026-06-01"`, `end_date:"2026-06-14"` | ✅ PASS (Sprint 16 ✅) |
| Get trip by ID — `notes` key | GET | /api/v1/trips/:id | HTTP 200, `notes` key present (null or string) | HTTP 200, `"notes":null` present in response | ✅ PASS (Sprint 20 regression ✅) |
| Patch trip status | PATCH | /api/v1/trips/:id | HTTP 200, `status:"ONGOING"` in response | HTTP 200, `{"data":{...,"status":"ONGOING",...}}` | ✅ PASS (Sprint 22 regression ✅) |
| Get flights | GET | /api/v1/trips/:id/flights | HTTP 200 | HTTP 200 | ✅ PASS |
| Get stays | GET | /api/v1/trips/:id/stays | HTTP 200 | HTTP 200 | ✅ PASS |
| Get activities | GET | /api/v1/trips/:id/activities | HTTP 200 | HTTP 200 | ✅ PASS |
| Get land-travel | GET | /api/v1/trips/:id/land-travel | HTTP 200 | HTTP 200 | ✅ PASS |

#### Frontend

| Check | Method | URL | Expected | Actual | Result |
|-------|--------|-----|----------|--------|--------|
| Frontend accessible | GET | https://localhost:4173 | HTTP 200 | HTTP 200 | ✅ PASS |
| Build artifacts present | — | frontend/dist/ | index.html, assets/ present | `index.html`, `assets/`, `favicon.png` present | ✅ PASS |

#### Database

| Check | How verified | Result |
|-------|-------------|--------|
| DB connected | POST /api/v1/auth/register → 201 (requires DB write), GET /api/v1/trips → 200 (requires DB read) | ✅ PASS |
| 10 migrations applied | Confirmed by Deploy Engineer (T-205 handoff): 0 pending migrations, all 10 applied | ✅ PASS |

---

### No 5xx Errors Observed

All 13 tested endpoints returned expected 2xx/4xx status codes. No 5xx errors detected in health check probe.

---

### Full Health Check Checklist

```
Environment: Staging
Timestamp: 2026-03-10T01:14:00Z
Checks:
  - [x] App responds (GET /api/v1/health → 200) ✅
  - [x] Auth works (POST /api/v1/auth/login → 200 with access_token) ✅
  - [x] Key endpoints respond (all 13 endpoints tested — see table above) ✅
  - [x] No 5xx errors in logs ✅
  - [x] Database connected (register + trips CRUD verified) ✅
  - [x] Config consistency: backend PORT 3001 matches Vite proxy BACKEND_PORT 3001 ✅
  - [x] Config consistency: SSL certs exist → backend HTTPS; BACKEND_SSL=true → Vite proxy https:// ✅
  - [x] Config consistency: CORS_ORIGIN=https://localhost:4173 matches frontend preview origin ✅
  - [x] Frontend accessible at https://localhost:4173 → 200 ✅
  - [x] Rate limiting active: RateLimit-Limit: 10 on /auth/login ✅ (Sprint 19)
  - [x] notes key present on GET /trips/:id ✅ (Sprint 20)
  - [x] PATCH /trips/:id {status:"ONGOING"} → 200 ✅ (Sprint 22)
  - [x] start_date/end_date on POST /trips → confirmed in response ✅ (Sprint 16)
Result: PASS
Notes: All checks pass. StatusFilterTabs (T-208) frontend build deployed and frontend responding 200.
```

---

### Summary

| Test Type | Result |
|-----------|--------|
| Config Consistency | ✅ PASS |
| App Liveness | ✅ PASS |
| Auth Flow (register + login) | ✅ PASS |
| Trip CRUD Endpoints | ✅ PASS |
| Sub-resource Endpoints (flights, stays, activities, land-travel) | ✅ PASS |
| Database Connectivity | ✅ PASS |
| Frontend Accessibility | ✅ PASS |
| Sprint 16 Regression (start_date/end_date) | ✅ PASS |
| Sprint 19 Regression (rate limiting header) | ✅ PASS |
| Sprint 20 Regression (notes key on GET /trips/:id) | ✅ PASS |
| Sprint 22 Regression (PATCH status → ONGOING) | ✅ PASS |
| No 5xx Errors | ✅ PASS |

**Deploy Verified: Yes**
**Overall Result: ✅ ALL CHECKS PASS — Staging environment is healthy. T-206 complete. T-209 (User Agent) unblocked.**

**Issues Found:** None

---

## Sprint #25 — T-215 Pre-Deploy Pre-Verification — 2026-03-10

**Test Type:** Pre-Deploy Infrastructure Pre-Verification
**Environment:** Staging (pre-deploy — no deploy executed yet)
**Timestamp:** 2026-03-10
**Agent:** Deploy Engineer
**Task:** T-215 (BLOCKED pending T-214)

---

### Status: ⛔ BLOCKED — Awaiting T-214 completion

T-215 cannot execute. The pre-deploy gate requires T-214 (QA) to be Done.
T-214 is blocked by T-212 (backend calendar endpoint not implemented) and T-213 (frontend pending T-212).

The following pre-verification checks were completed proactively so they need not be repeated at deploy time.

---

### Pre-Verification Checks

#### 1. ecosystem.config.cjs — Mandatory Regression Check

| Config Key | Required Value | Actual Value | Result |
|------------|---------------|--------------|--------|
| `BACKEND_PORT` (frontend env) | `'3001'` | `'3001'` | ✅ PASS |
| `BACKEND_SSL` (frontend env) | `'true'` | `'true'` | ✅ PASS |

**File:** `infra/ecosystem.config.cjs`
**Verdict:** ✅ PASS — No changes required. Config is staging-correct.

#### 2. Database Migration Check

| Question | Answer |
|----------|--------|
| Does T-212 require schema changes? | No — read-only aggregation over existing `flights`, `stays`, `activities` tables |
| Migration needed? | **No** — confirm `knex migrate:latest` will be a no-op at deploy time |

**Verdict:** ✅ NO MIGRATION NEEDED — T-215 does not need to run `knex migrate:latest`.

#### 3. Backend Test Baseline (pre-T-212 implementation)

| Metric | Result |
|--------|--------|
| Test files | 15 passed (15) |
| Tests | **304/304 PASS** |
| Calendar route in source | ❌ Not yet — T-212 implementation pending |

**Verdict:** ✅ 304/304 baseline confirmed — T-214 QA target is 304+ (including new calendar tests once T-212 is done)

#### 4. Frontend Test Baseline (pre-T-213 API integration)

| Metric | Result |
|--------|--------|
| Test files | 25 passed (25) |
| Tests | **481/481 PASS** |
| TripCalendar.jsx | Exists (Sprint 7 props-based calendar — pre-T-213 API version) |

**Verdict:** ✅ 481/481 baseline confirmed — T-214 QA target is 481+ (including 10+ new T-213 tests once T-213 is done)

#### 5. Blocker Triage

| Item | Status | Action Required |
|------|--------|-----------------|
| T-212 backend calendar endpoint | Not implemented in source | Backend Engineer must implement `GET /api/v1/trips/:id/calendar` |
| T-213 frontend calendar API integration | Blocked by T-212 | Frontend Engineer must update TripCalendar after T-212 is done |
| T-214 QA | Backlog | QA Engineer must run after T-212 + T-213 are Done |
| T-215 deploy | **BLOCKED** | Deploy Engineer will execute immediately when T-214 Done handoff is received |

---

### Summary

| Check | Result |
|-------|--------|
| ecosystem.config.cjs BACKEND_PORT='3001' | ✅ PASS |
| ecosystem.config.cjs BACKEND_SSL='true' | ✅ PASS |
| Migration needed (T-212) | ✅ None |
| Backend tests baseline (304) | ✅ PASS |
| Frontend tests baseline (481) | ✅ PASS |
| T-214 pre-deploy gate | ⛔ NOT MET — Blocked |

**T-215 Status: BLOCKED**
**Unblocking condition:** QA Engineer logs T-214 Done in handoff-log.md.
**Deploy will execute immediately upon T-214 completion.**

---

## Sprint 25 — QA Report (T-214)

**Date:** 2026-03-10
**QA Engineer:** QA Agent (Sprint #25)
**Tasks in scope:** T-212 (Backend: calendar endpoint), T-213 (Frontend: TripCalendar component)
**Task:** T-214

---

### Test Type: Unit Test

**Date:** 2026-03-10
**Scope:** T-212 backend calendar endpoint + T-213 TripCalendar frontend component

#### Backend Test Run

**Command:** `cd backend && npm test`
**Result:** ✅ PASS

| Metric | Result |
|--------|--------|
| Test files | 17 passed (17) |
| Total tests | **340 / 340 passed** |
| Duration | 545ms |
| New calendar tests | 36 (15 route-level in `sprint25.test.js` + 21 model unit in `calendarModel.unit.test.js`) |

**Coverage review — `GET /api/v1/trips/:id/calendar`:**

| Test category | File | Coverage |
|---------------|------|----------|
| Happy path: 200 with trip_id + events array | sprint25.test.js | ✅ |
| Happy path: FLIGHT event shape | sprint25.test.js | ✅ |
| Happy path: STAY event shape | sprint25.test.js | ✅ |
| Happy path: ACTIVITY event shape (timezone null) | sprint25.test.js | ✅ |
| Happy path: all-day activity (null start/end time) | sprint25.test.js | ✅ |
| Happy path: empty trip → empty events array | sprint25.test.js | ✅ |
| Happy path: events order matches model output | sprint25.test.js | ✅ |
| Error path: 401 — no Authorization header | sprint25.test.js | ✅ |
| Error path: 401 — invalid Bearer token | sprint25.test.js | ✅ |
| Error path: 403 — trip belongs to different user | sprint25.test.js | ✅ |
| Error path: 404 — trip does not exist | sprint25.test.js | ✅ |
| Error path: 400 — non-UUID trip ID | sprint25.test.js | ✅ |
| Error path: 500 — model throws | sprint25.test.js | ✅ |
| Model unit: FLIGHT event transformation | calendarModel.unit.test.js | ✅ |
| Model unit: STAY event transformation | calendarModel.unit.test.js | ✅ |
| Model unit: ACTIVITY event transformation | calendarModel.unit.test.js | ✅ |
| Model unit: sorting (date ASC, time NULLS LAST, type) | calendarModel.unit.test.js | ✅ |

**Verdict:** ✅ All error paths and happy paths covered. Minimum 1 happy-path + 1 error-path per endpoint verified.

---

#### Frontend Test Run

**Command:** `cd frontend && npm test -- --run`
**Result:** ✅ PASS

| Metric | Result |
|--------|--------|
| Test files | 25 passed (25) |
| Total tests | **486 / 486 passed** |
| Duration | 1.69s |
| New TripCalendar tests | 75 (in `TripCalendar.test.jsx`) |

**Coverage review — TripCalendar component:**

| Test category | Coverage |
|---------------|----------|
| Renders with correct ARIA attributes | ✅ |
| FLIGHT event renders with correct aria-label | ✅ |
| STAY event renders with correct aria-label | ✅ |
| ACTIVITY event renders with correct aria-label | ✅ |
| Empty state shown when events = [] | ✅ |
| Loading skeleton while API call in-flight | ✅ |
| Error state on API failure (role="alert") | ✅ |
| Retry button re-fetches data | ✅ |
| Click event pill → scroll to section | ✅ |
| Keyboard nav: ArrowRight/Left/Up/Down | ✅ |
| All 3 event types rendered from API | ✅ |
| Correct API endpoint called | ✅ |
| Old Sprint 2 placeholder is gone | ✅ |
| Month navigation prev/next | ✅ |
| Day-of-week headers SUN–SAT | ✅ |
| Grid cells with role="gridcell" | ✅ |
| Multi-day STAY spans multiple days | ✅ |
| aria-busy=true during loading | ✅ |
| aria-busy removed after load | ✅ |
| Legend: Flight / Stay / Activity labels | ✅ |

**Verdict:** ✅ All UI states covered (loading, error, empty, success). All acceptance criteria in T-213 met.

---

### Test Type: Integration Test

**Date:** 2026-03-10
**Scope:** Frontend TripCalendar ↔ Backend `GET /api/v1/trips/:id/calendar`

#### API Contract Verification

**Contract source:** `api-contracts.md` → "Sprint 25 — T-212"

| Contract item | Implementation check | Result |
|---------------|---------------------|--------|
| Endpoint: `GET /api/v1/trips/:id/calendar` | `apiClient.get(\`/trips/${tripId}/calendar\`)` in TripCalendar.jsx:216 | ✅ |
| Response read: `response.data.data.events` | `const calEvents = response.data?.data?.events \|\| []` in TripCalendar.jsx:219 | ✅ |
| Event fields consumed: id, type, title, start_date, end_date, start_time, end_time, source_id | All consumed in `renderEventPill()`, `buildEventsMap()`, `formatTime()` | ✅ |
| AbortController cleanup on unmount | `abortControllerRef.current.abort()` in useEffect cleanup (line 239) | ✅ |
| Loading state while in-flight | `setLoading(true)` before fetch, `setLoading(false)` in finally | ✅ |
| Error state on failure | `setError(err)` in catch (ignoring abort) | ✅ |
| STAY multi-day handling | `buildEventsMap()` enumerates all dates in stay range | ✅ |
| Section scroll anchors: flights-section / stays-section / activities-section | Confirmed in TripDetailsPage.jsx lines 802, (stays-section), (activities-section) | ✅ |
| Auth token sent via apiClient (axios interceptor) | Uses `apiClient` which has auth interceptor | ✅ |
| Abort on re-fetch (AbortController pattern) | New controller created per fetch, previous cancelled | ✅ |

#### UI State Integration Checks

| State | Implementation | Contract alignment |
|-------|---------------|-------------------|
| Loading | Skeleton grid with disabled nav buttons, `aria-busy="true"` | ✅ Matches Spec 22 |
| Error | `role="alert"`, "calendar unavailable" heading, retry button | ✅ Matches Spec 22 |
| Empty | "no events this month" message overlay on grid | ✅ Matches Spec 22 |
| Success | Month grid with color-coded event pills by type | ✅ Matches Spec 22 |

#### Input Validation & Edge Cases

| Case | Backend | Frontend |
|------|---------|----------|
| No auth token → 401 | `router.use(authenticate)` applied to all calendar routes | apiClient automatically attaches token |
| Wrong user → 403 | Ownership check `trip.user_id !== req.user.id` | Error state shown |
| Non-UUID trip ID → 400 | `router.param('tripId', uuidParamHandler)` | N/A — tripId from URL params always a valid UUID in app |
| Trip not found → 404 | `findTripById` returns null check | Error state shown |
| Empty trip → 200 with `events: []` | Returns `{ data: { trip_id, events: [] } }` | Empty state message rendered |
| All-day activity (null times) | `normalizeTime(null)` returns null correctly | `formatTime(null)` returns null; no time shown in pill |

**Verdict:** ✅ Frontend correctly calls backend per the contract. Response shape matched. All UI states handled.

---

### Test Type: Config Consistency Check

**Date:** 2026-03-10

| Check | Finding | Result |
|-------|---------|--------|
| backend/.env PORT=3000 matches vite proxy default (backendPort='3000') | PORT=3000 in .env; vite.config.js defaults to '3000' | ✅ PASS |
| SSL: backend .env has SSL commented out; vite uses http:// by default | SSL lines commented out in .env; `backendSSL = false` → `http://` target | ✅ PASS |
| CORS_ORIGIN=http://localhost:5173 matches frontend dev server (port 5173) | CORS_ORIGIN=http://localhost:5173; vite server.port=5173 | ✅ PASS |
| docker-compose backend PORT: 3000 matches | `PORT: 3000` in docker-compose backend service | ✅ PASS |
| docker-compose CORS_ORIGIN uses nginx (http://localhost) for Docker context | `CORS_ORIGIN: ${CORS_ORIGIN:-http://localhost}` — expected for Docker (nginx proxy) | ✅ PASS (expected) |

**No config mismatches found.**

---

### Test Type: Security Scan

**Date:** 2026-03-10
**Scope:** T-212 (backend calendar endpoint) + T-213 (TripCalendar frontend)

#### npm audit

| Package | Result |
|---------|--------|
| backend/ | ✅ 0 vulnerabilities |
| frontend/ | ✅ 0 vulnerabilities |

#### Security Checklist — Authentication & Authorization

| Item | Finding | Result |
|------|---------|--------|
| Calendar endpoint requires auth | `router.use(authenticate)` — all calendar routes require Bearer token | ✅ PASS |
| Ownership enforced | `trip.user_id !== req.user.id` → 403 | ✅ PASS |
| Auth tokens use env var | `jwt.sign(payload, process.env.JWT_SECRET, ...)` — no hardcoded secret | ✅ PASS |

#### Security Checklist — Input Validation & Injection Prevention

| Item | Finding | Result |
|------|---------|--------|
| SQL injection — calendar route | All Knex queries use `.where({ trip_id: tripId })` (parameterized). Only static `db.raw("TO_CHAR(activity_date, 'YYYY-MM-DD') AS activity_date")` — no user input in raw SQL | ✅ PASS |
| UUID validation on :tripId | `router.param('tripId', uuidParamHandler)` → 400 on invalid UUID | ✅ PASS |
| XSS — dangerouslySetInnerHTML | `grep -rn "dangerouslySetInnerHTML"` returned 0 matches in component code (1 comment-only reference in formatDate.js utility) | ✅ PASS |
| XSS — innerHTML / document.write | `grep -rn "innerHTML\|document.write\|__html"` returned 0 matches in frontend/src/ | ✅ PASS |

#### Security Checklist — API Security

| Item | Finding | Result |
|------|---------|--------|
| CORS origin configured | `CORS_ORIGIN=http://localhost:5173` in .env — no wildcard | ✅ PASS |
| Error responses — no stack trace leak | `errorHandler.js`: 500 errors return generic "An unexpected error occurred", stack logged server-side only | ✅ PASS |
| No hardcoded secrets in source | All secrets via `process.env.*`; no hardcoded JWT secret, DB password, or API keys in source files | ✅ PASS |
| Sensitive data in URL params | Calendar endpoint uses path param `:tripId` (UUID) only — no sensitive data in query params | ✅ PASS |

#### Security Checklist — Data Protection

| Item | Finding | Result |
|------|---------|--------|
| DB credentials in env vars | `DATABASE_URL` from `process.env` in knexfile; no hardcoded credentials | ✅ PASS |
| No secrets in frontend code | No API keys, tokens, or credentials in TripCalendar.jsx or TripCalendar.module.css | ✅ PASS |

#### Security Checklist — Infrastructure

| Item | Finding | Result |
|------|---------|--------|
| npm audit — 0 Moderate+ vulnerabilities | 0 vulnerabilities in both backend and frontend | ✅ PASS |

**Overall Security Verdict:** ✅ No P1 security issues found. All applicable checklist items pass.

---

### Sprint 25 QA Summary

| Check | Result |
|-------|--------|
| Backend tests: 340/340 | ✅ PASS |
| Frontend tests: 486/486 | ✅ PASS |
| npm audit backend: 0 vulns | ✅ PASS |
| npm audit frontend: 0 vulns | ✅ PASS |
| API contract alignment (endpoint, response shape, auth) | ✅ PASS |
| All UI states implemented (loading, error, empty, success) | ✅ PASS |
| Config consistency (PORT, CORS, SSL) | ✅ PASS |
| Security checklist — no failures | ✅ PASS |
| dangerouslySetInnerHTML: absent | ✅ PASS |
| Hardcoded secrets: none found | ✅ PASS |
| SQL injection vectors: none (parameterized queries) | ✅ PASS |

**T-214 Status: ✅ DONE — All gates passed. T-212 and T-213 moved to Done. Ready for Deploy Engineer (T-215).**

---
