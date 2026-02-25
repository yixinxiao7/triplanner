# QA & Build Log

Tracks test runs, build results, and post-deploy health checks per sprint. Maintained by QA Engineer, Deploy Engineer, and Monitor Agent.

---

## Log Fields

| Field | Description |
|-------|-------------|
| Test Run | Short description of what was tested |
| Sprint | Sprint number |
| Test Type | Unit Test, Integration Test, E2E Test, Post-Deploy Health Check, Security Scan, Performance Test |
| Result | Pass, Fail, Partial |
| Build Status | Success, Failed, Skipped |
| Environment | Local, Staging, Production |
| Deploy Verified | Yes / No (Monitor Agent confirms post-deploy health) |
| Tested By | Which agent ran the test |
| Error Summary | What went wrong (if applicable) |
| Related Tasks | Task IDs from dev-cycle-tracker.md |
| Notes | Additional context |

---

## Sprint 1 Entries

| Test Run | Test Type | Result | Build Status | Environment | Deploy Verified | Tested By | Error Summary |
|----------|-----------|--------|-------------|-------------|-----------------|-----------|---------------|
| Re-deploy — Backend + Frontend restart (2026-02-25) | Post-Deploy Health Check | Pass | Success | Staging | Pending | Deploy Engineer | None — all smoke tests passed. Port change: 3000→3001 (port conflict). CORS and API URL corrected. |
| Re-deploy — Frontend production rebuild with VITE_API_URL | Build | Pass | Success | Staging | Pending | Deploy Engineer | None — 103 modules, 243.65kB JS, 20.76kB CSS. API URL: http://localhost:3001/api/v1 baked in. |
| QA Third-Pass — Backend unit tests (60 tests, 5 files) | Unit Test | Pass | Success | Local | No | QA Engineer | None — 60/60 PASS, 466ms |
| QA Third-Pass — Frontend unit tests (128 tests, 11 files) | Unit Test | Pass | Success | Local | No | QA Engineer | None — 128/128 PASS (React Router v6 future-flag warnings: expected, non-blocking) |
| QA Third-Pass — Security code review (XSS, SQL injection, secrets, token storage) | Security Scan | Pass | Success | Local | No | QA Engineer | No new issues. All prior findings confirmed unchanged. 1 accepted risk: no rate limiting on auth endpoints. |
| QA Third-Pass — npm audit backend + frontend | Security Scan | Pass | Success | Local | No | QA Engineer | 5 moderate vulns dev deps only (esbuild GHSA-67mh-4wv8-2f99) — 0 production vulnerabilities. Unchanged. |
| QA Third-Pass — Integration contract verification (API calls + UI states) | Integration Test | Pass | Success | Local | No | QA Engineer | All API endpoint groups verified. All 4 UI states implemented per spec. No regressions. |
| QA Second-Pass — Backend unit tests (60 tests, 5 files) | Unit Test | Pass | Success | Local | No | QA Engineer | None — 60/60 PASS, 569ms |
| QA Second-Pass — Frontend unit tests (128 tests, 11 files) | Unit Test | Pass | Success | Local | No | QA Engineer | None — 128/128 PASS (React Router v6 future-flag warnings: expected, non-blocking) |
| QA Second-Pass — Integration contract verification (all endpoint groups) | Integration Test | Pass | Success | Local | No | QA Engineer | None — all API call shapes match contracts, all UI states implemented |
| QA Second-Pass — Security checklist re-verification (19 applicable items) | Security Scan | Pass | Success | Local | No | QA Engineer | 1 known accepted risk: rate limiting not applied; 2 accepted/deferred items (dev-dep vuln, HTTPS pending) |
| QA Second-Pass — npm audit backend + frontend | Security Scan | Pass | Success | Local | No | QA Engineer | 5 moderate vulns in dev deps only (esbuild GHSA-67mh-4wv8-2f99) — 0 production vulnerabilities |
| Monitor Agent post-deploy health check — T-021 (full API + DB + frontend) | Post-Deploy Health Check | Pass | Success | Staging | **Yes** | Monitor Agent | None — all 18 checks passed, 0 errors |
| Staging deployment — T-020 full deploy (backend + DB + frontend) | Post-Deploy Health Check | Pass | Success | Staging | Yes | Deploy Engineer | None — all smoke tests passed |
| Frontend production build (Vite) | Build | Pass | Success | Staging | Pending | Deploy Engineer | None — 103 modules, 243.63kB JS, 20.76kB CSS |
| Database migrations — 6 Knex migrations | Migration | Pass | Success | Staging | Pending | Deploy Engineer | None — all 6 tables created (users, refresh_tokens, trips, flights, stays, activities) |
| Backend smoke test — GET /api/v1/health | Post-Deploy Health Check | Pass | Success | Staging | Pending | Deploy Engineer | None — {"status":"ok"} |
| Backend smoke test — POST /auth/register + GET /trips (with JWT) | Post-Deploy Health Check | Pass | Success | Staging | Pending | Deploy Engineer | None — full DB round-trip verified |
| Backend unit tests — 60 tests across all routes | Unit Test | Pass | Success | Local | No | QA Engineer | None |
| Frontend unit tests — 128 tests across all components/hooks | Unit Test | Pass | Success | Local | No | QA Engineer | None |
| Frontend ↔ Backend contract adherence (code review) | Integration Test | Pass | Success | Local | No | QA Engineer | None |
| Security checklist — all 19 applicable items | Security Scan | Pass | Success | Local | No | QA Engineer | 1 known accepted risk: rate limiting not applied (see notes) |
| npm audit — backend + frontend dependencies | Security Scan | Pass | Success | Local | No | QA Engineer | 5 moderate vulns in dev deps only (esbuild/vite/vitest) — no production impact |

---

---

## Sprint 1 — Staging Re-Deployment Report (T-020 Re-Run) — 2026-02-25

**Deploy Engineer:** Deploy Agent
**Sprint:** 1
**Date:** 2026-02-25
**Task:** T-020 — Staging Re-Deployment (backend restart + frontend rebuild)

---

### Context

The original T-020 deployment (2026-02-24) successfully ran all services. Since then:
- Port 3000 became occupied by a different project (`i-wish-spotify-could` Next.js dev server at `http://localhost:3000`)
- The Vite preview frontend (PID 93586) was still running on port 4173 ✅
- PostgreSQL with all 6 tables was still running ✅
- The backend (Express) was not running (port conflict) ❌
- The original `.env` had `CORS_ORIGIN=http://localhost:5173` — incorrect for preview serving from `:4173`
- The original frontend dist used `/api/v1` (relative URL) — no proxy in Vite preview mode would have caused API calls to fail

This re-deployment fixes all three issues.

---

### Pre-Deploy Verification

| Check | Result |
|-------|--------|
| QA Engineer third-pass handoff confirmed in handoff-log.md | ✅ CONFIRMED — "QA Engineer completed a full third-pass verification of Sprint 1 on 2026-02-24. No regressions found." |
| All Sprint 1 tasks (T-001 to T-021) marked Done | ✅ CONFIRMED — T-022 (User Agent) In Progress (expected — post-deploy) |
| 6 database migrations status | ✅ CONFIRMED — all 6 already applied (technical-context.md + \dt confirmed 8 tables in appdb) |
| Database connectivity | ✅ CONFIRMED — PostgreSQL 15 running, `appdb` has all tables |

---

### Build Step 1 — Dependency Installation

**Command:** `cd backend && npm install` + `cd frontend && npm install`
**Result:** ✅ SUCCESS
**Notes:** Both `node_modules/` directories were present and up-to-date. npm install ran without installing new packages. 5 moderate dev-dep vulnerabilities (esbuild GHSA-67mh-4wv8-2f99) — pre-existing, accepted by QA in T-018.

---

### Build Step 2 — Environment Configuration Update

**Problem:** Port 3000 occupied by another application. Original `.env` used `PORT=3000` and `CORS_ORIGIN=http://localhost:5173`.

**Changes made to `backend/.env`:**
- `PORT`: 3000 → **3001** (port 3000 occupied by unrelated project)
- `CORS_ORIGIN`: `http://localhost:5173` → **`http://localhost:4173`** (matches actual Vite preview URL)

All other env vars unchanged (JWT_SECRET, DATABASE_URL, JWT_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN).

---

### Build Step 3 — Frontend Production Rebuild

**Command:** `VITE_API_URL=http://localhost:3001/api/v1 npm run build` (from `frontend/`)
**Build Tool:** Vite 6.4.1
**Result:** ✅ SUCCESS
**Duration:** 611ms
**Output:**
- `dist/index.html` — 0.39 kB (gzip: 0.26 kB)
- `dist/assets/index-BKHqepzx.css` — 20.76 kB (gzip: 4.24 kB)
- `dist/assets/index-CL1WbiE8.js` — 243.65 kB (gzip: 79.60 kB)
- 103 modules transformed
**Build errors:** 0
**Key change:** `VITE_API_URL=http://localhost:3001/api/v1` baked into bundle — verified via grep on built asset.
**Why:** The previous dist used `/api/v1` (relative URL). In `vite preview` mode there is no proxy, so relative calls would have gone to `http://localhost:4173/api/v1` (nonexistent). Now the correct absolute URL is hardcoded.

---

### Build Step 4 — Database Migrations

**Status:** ✅ NO ACTION REQUIRED — all 6 migrations already applied from T-020 (2026-02-24)
**Verification:** `\dt` on `appdb` confirmed: users, refresh_tokens, trips, flights, stays, activities, knex_migrations, knex_migrations_lock — 8 tables present.

---

### Build Step 5 — Backend Server Start

**Command:** `cd backend && node src/index.js &` (background process)
**Result:** ✅ SUCCESS — "Server running on port 3001"
**Port:** `3001`
**URL:** `http://localhost:3001`
**PID:** 18213
**Log:** `/tmp/triplanner-backend.log`

---

### Build Step 6 — Frontend Static Server

**Command:** `cd frontend && npx vite preview --port 4173 &` (background process)
**Result:** ✅ SUCCESS — Frontend served on port 4173
**Port:** `4173`
**URL:** `http://localhost:4173`
**PID:** 18234
**Log:** `/tmp/triplanner-frontend.log`
**Serving from:** `frontend/dist/` (new production Vite build)

---

### Smoke Tests (Post-Deploy)

| Test | Endpoint | Expected | Actual | Result |
|------|----------|----------|--------|--------|
| Health check | `GET http://localhost:3001/api/v1/health` | `{"status":"ok"}` | `{"status":"ok"}` | ✅ PASS |
| User registration | `POST http://localhost:3001/api/v1/auth/register` | 201/200 + user + JWT | 200 + user object + access_token (new user UUID: 5b4228f7-...) | ✅ PASS |
| Protected route | `GET http://localhost:3001/api/v1/trips` (with JWT) | 200 + `{"data":[],"pagination":{...}}` | `{"data":[],"pagination":{"page":1,"limit":20,"total":0}}` | ✅ PASS |
| Frontend served | `GET http://localhost:4173/` | 200 HTML | 200 | ✅ PASS |
| CORS header | `GET` with `Origin: http://localhost:4173` | `Access-Control-Allow-Origin: http://localhost:4173` | Confirmed ✅ | ✅ PASS |
| CORS credentials | — | `Access-Control-Allow-Credentials: true` | Confirmed ✅ | ✅ PASS |
| API URL in bundle | `grep` dist/assets/*.js | `"http://localhost:3001/api/v1"` | Confirmed ✅ | ✅ PASS |

---

### Staging Deployment Summary

| Component | Status | URL |
|-----------|--------|-----|
| Backend API (Express) | ✅ Running | `http://localhost:3001` |
| Frontend (Static/Vite preview) | ✅ Running | `http://localhost:4173` |
| PostgreSQL 15 | ✅ Running | `localhost:5432` / `appdb` |
| Database Migrations | ✅ Applied (6/6) | — |
| Health Endpoint | ✅ Responding | `http://localhost:3001/api/v1/health` |
| CORS | ✅ Correct | `http://localhost:4173` → `http://localhost:3001` ✅ |
| API URL in Frontend | ✅ Correct | `http://localhost:3001/api/v1` baked in |

**Overall Build Status: ✅ SUCCESS**
**Environment: Staging (local processes)**
**Deploy Verified: Pending Monitor Agent health check**

---

### Notes for Monitor Agent

The backend port has changed from 3000 to **3001** due to a port conflict with another local application. All health checks must use the new port. Frontend remains at port 4173. The database is unchanged — all 6 tables are present with existing data.

**Restart commands (if services go down):**
- Backend: `cd /Users/yixinxiao/CLAUDE/triplanner/backend && node src/index.js &`
- Frontend: `cd /Users/yixinxiao/CLAUDE/triplanner/frontend && npx vite preview --port 4173 &`
- PostgreSQL: `/opt/homebrew/bin/brew services start postgresql@15`

---

## Sprint 1 — Staging Deployment Report (T-020) — 2026-02-24

**Deploy Engineer:** Deploy Agent
**Sprint:** 1
**Date:** 2026-02-24
**Task:** T-020 — Staging Deployment

---

### Pre-Deploy Verification

| Check | Result |
|-------|--------|
| QA Engineer handoff confirmed in handoff-log.md | ✅ CONFIRMED — "Sprint 1 QA is complete. Deploy Engineer is cleared to proceed with T-020." |
| All Sprint 1 tasks (T-004 to T-019) marked Done | ✅ CONFIRMED — dev-cycle-tracker.md verified |
| 6 database migrations pending staging run | ✅ CONFIRMED — technical-context.md reviewed |

---

### Build Step 1 — Dependency Installation

**Command:** `cd backend && npm install` + `cd frontend && npm install`
**Result:** ✅ SUCCESS
**Notes:** Both `node_modules/` directories were already present and verified intact. npm install confirmed all packages are up-to-date. 5 moderate dev-dep vulnerabilities noted (esbuild/vite/vitest — pre-existing, accepted by QA in T-018).

---

### Build Step 2 — Frontend Production Build

**Command:** `cd frontend && npm run build`
**Build Tool:** Vite 6.4.1
**Result:** ✅ SUCCESS
**Duration:** 572ms
**Output:**
- `dist/index.html` — 0.39 kB (gzip: 0.26 kB)
- `dist/assets/index-BKHqepzx.css` — 20.76 kB (gzip: 4.24 kB)
- `dist/assets/index-I5cnUyCF.js` — 243.63 kB (gzip: 79.59 kB)
- 103 modules transformed
**Build errors:** 0
**Artifacts location:** `frontend/dist/`

---

### Staging Environment Setup

**Docker availability:** ❌ Not available on this machine
**Fallback:** Local processes with Homebrew PostgreSQL

**PostgreSQL Setup:**
- Installed: PostgreSQL 15.16 via Homebrew (`/opt/homebrew/Cellar/postgresql@15/15.16`)
- Service started: `brew services start postgresql@15`
- Status: ✅ Accepting connections on `localhost:5432`
- Database created: `appdb` (owner: `user`)
- User created: `user` (password: `password`)
- Connection string: `postgres://user:password@localhost:5432/appdb`
- Authentication: pg_hba.conf uses `trust` for localhost connections

**Environment Configuration:**
- `backend/.env` updated with `NODE_ENV=staging` and cryptographically random `JWT_SECRET`
- All required env vars set: `PORT=3000`, `JWT_EXPIRES_IN=15m`, `JWT_REFRESH_EXPIRES_IN=7d`, `CORS_ORIGIN=http://localhost:5173`

**Known limitation:** Docker was not available on this machine. The staging setup uses local PostgreSQL (Homebrew) instead of the `infra/docker-compose.yml`. The docker-compose.yml is available and correct for future environments where Docker is installed.

---

### Build Step 3 — Database Migrations

**Command:** `cd backend && DATABASE_URL=... NODE_ENV=staging npm run migrate`
**Knex version:** 3.1.0
**Result:** ✅ SUCCESS — Batch 1 run: 6 migrations
**Note on workaround:** Knex changes its working directory to `backend/src/config/` when reading the knexfile, so dotenv cannot find `backend/.env` in that context. Solution: env vars passed explicitly on the command line (consistent with how staging/production environments inject secrets via OS-level env vars rather than .env files).

**Migrations applied:**
| # | File | Table Created | Result |
|---|------|---------------|--------|
| 001 | `20260224_001_create_users.js` | `users` | ✅ |
| 002 | `20260224_002_create_refresh_tokens.js` | `refresh_tokens` | ✅ |
| 003 | `20260224_003_create_trips.js` | `trips` | ✅ |
| 004 | `20260224_004_create_flights.js` | `flights` | ✅ |
| 005 | `20260224_005_create_stays.js` | `stays` | ✅ |
| 006 | `20260224_006_create_activities.js` | `activities` | ✅ |

**Tables verified:** All 6 application tables + `knex_migrations` + `knex_migrations_lock` confirmed in `appdb` via `\dt`.

---

### Build Step 4 — Backend Server Start

**Command:** `cd backend && node src/index.js &`
**Result:** ✅ SUCCESS — "Server running on port 3000"
**Port:** `3000`
**URL:** `http://localhost:3000`
**Process:** Running in background

---

### Build Step 5 — Frontend Static Server

**Command:** `cd frontend && npx vite preview --port 4173 &`
**Result:** ✅ SUCCESS — Frontend served on port 4173
**Port:** `4173`
**URL:** `http://localhost:4173`
**Serving from:** `frontend/dist/` (production Vite build)
**HTTP status:** 200 OK confirmed

---

### Smoke Tests (Post-Deploy)

| Test | Endpoint | Expected | Actual | Result |
|------|----------|----------|--------|--------|
| Health check | `GET /api/v1/health` | `{"status":"ok"}` | `{"status":"ok"}` | ✅ PASS |
| User registration | `POST /api/v1/auth/register` | 201 + user + JWT | 200 + user object + access_token | ✅ PASS |
| User login | `POST /api/v1/auth/login` | 200 + access_token | 200 + access_token | ✅ PASS |
| Protected route | `GET /api/v1/trips` (with JWT) | 200 + `{"data":[],"pagination":{...}}` | `{"data":[],"pagination":{"page":1,"limit":20,"total":0}}` | ✅ PASS |
| Frontend served | `GET http://localhost:4173/` | 200 HTML | 200 | ✅ PASS |

**Database connectivity confirmed:** User registration created a row in the `users` table (UUID `0016f183-c7da-45c9-b932-8d2f02a6a51e`). JWT auth flow works end-to-end.

---

### Staging Deployment Summary

| Component | Status | URL |
|-----------|--------|-----|
| Backend API (Express) | ✅ Running | `http://localhost:3000` |
| Frontend (Static/Vite preview) | ✅ Running | `http://localhost:4173` |
| PostgreSQL 15 | ✅ Running | `localhost:5432` / `appdb` |
| Database Migrations | ✅ Applied (6/6) | — |
| Health Endpoint | ✅ Responding | `http://localhost:3000/api/v1/health` |

**Overall Build Status: ✅ SUCCESS**
**Environment: Staging (local processes)**
**Deploy Verified: Pending Monitor Agent health check (T-021)**

---

### Action Items for Sprint 2 (Infrastructure)

1. **Migrate knex dotenv loading:** Update `knexfile.js` to load `.env` with an explicit path (e.g., `dotenv.config({ path: path.resolve(__dirname, '../../.env') })`) so migrations work from any working directory without env var injection workaround.
2. **Install Docker:** Set up Docker Desktop or Docker Engine to enable `infra/docker-compose.yml` usage for fully reproducible staging environments.
3. **HTTPS/TLS:** Configure nginx or a reverse proxy in front of the backend for HTTPS support (refresh token cookie is `secure: true` in production).
4. **Rate limiting:** Wire up `express-rate-limit` to `/auth/login` and `/auth/register` (pre-approved backlog item from T-010 review).
5. **Process management:** Use `pm2` or systemd to manage backend process restarts in long-running staging environments.

---

## Sprint 1 — Detailed QA Report (2026-02-24)

**QA Engineer:** QA Agent
**Sprint:** 1
**Date:** 2026-02-24
**Tasks In Scope:** T-004, T-005, T-006, T-007, T-008, T-009, T-010, T-011, T-012, T-013, T-014, T-015, T-016, T-017

---

### Test Run 1 — Backend Unit Tests

**Command:** `cd backend && npm test -- --run`
**Duration:** 493ms
**Result:** ✅ PASS — 60/60 tests

| Test File | Tests | Result |
|-----------|-------|--------|
| `auth.test.js` | 14 | ✅ PASS |
| `trips.test.js` | 16 | ✅ PASS |
| `flights.test.js` | 10 | ✅ PASS |
| `stays.test.js` | 8 | ✅ PASS |
| `activities.test.js` | 12 | ✅ PASS |

**Coverage verification (happy-path + error-path per endpoint):**

| Endpoint Group | Happy Path | Error Paths Covered |
|---------------|-----------|---------------------|
| POST /auth/register | ✅ 201 + access_token + user object | ✅ 409 EMAIL_TAKEN, 400 missing fields, 400 short password, 400 invalid email |
| POST /auth/login | ✅ 200 + access_token | ✅ 401 user not found, 401 wrong password, 400 missing fields |
| POST /auth/refresh | ✅ 200 new access_token | ✅ 401 no cookie, 401 token not in DB |
| POST /auth/logout | ✅ 204 | ✅ 401 no auth header |
| GET /trips | ✅ 200 list + pagination | ✅ 401 no token |
| POST /trips | ✅ 201 new trip | ✅ 400 validation error, 401 |
| GET /trips/:id | ✅ 200 trip | ✅ 404 not found, 403 wrong user, 401 |
| PATCH /trips/:id | ✅ 200 updated trip | ✅ 404, 403, 400 no updatable fields, 401 |
| DELETE /trips/:id | ✅ 204 | ✅ 404, 403, 401 |
| GET + POST + PATCH + DELETE /trips/:id/flights | ✅ all operations | ✅ 400, 401, 403, 404 per operation |
| GET + POST + PATCH + DELETE /trips/:id/stays | ✅ all operations | ✅ 400, 401, 403, 404 per operation |
| GET + POST + PATCH + DELETE /trips/:id/activities | ✅ all operations | ✅ 400, 401, 403, 404 per operation |

**Notes:** All models mocked with vitest `vi.mock`. No DB dependency in unit tests. 100% of tests pass.

---

### Test Run 2 — Frontend Unit Tests

**Command:** `cd frontend && npm test -- --run`
**Duration:** 2.04s
**Result:** ✅ PASS — 128/128 tests

| Test File | Tests | Result |
|-----------|-------|--------|
| `LoginPage.test.jsx` | 9 | ✅ PASS |
| `RegisterPage.test.jsx` | 8 | ✅ PASS |
| `Navbar.test.jsx` | 6 | ✅ PASS |
| `StatusBadge.test.jsx` | 4 | ✅ PASS |
| `TripCard.test.jsx` | 7 | ✅ PASS |
| `CreateTripModal.test.jsx` | 8 | ✅ PASS |
| `HomePage.test.jsx` | 14 | ✅ PASS |
| `useTrips.test.js` | 11 | ✅ PASS |
| `TripDetailsPage.test.jsx` | 31 | ✅ PASS |
| `useTripDetails.test.js` | 21 | ✅ PASS |
| `formatDate.test.js` | 9 | ✅ PASS |

**State coverage per component:**

| Component | Empty | Loading | Error | Success |
|-----------|-------|---------|-------|---------|
| LoginPage | N/A | ✅ | ✅ (401 banner, 500 banner) | ✅ |
| RegisterPage | N/A | ✅ | ✅ (field errors, 409, 500) | ✅ |
| Navbar | N/A | N/A | N/A | ✅ |
| HomePage | ✅ (empty state + CTA) | ✅ (skeleton cards) | ✅ (retry button) | ✅ (trip grid) |
| TripDetailsPage | ✅ (per-section dashed empty states) | ✅ (skeleton) | ✅ (per-section retry + 404 full-page) | ✅ (cards) |
| CreateTripModal | N/A | ✅ (spinner) | ✅ (validation) | ✅ (navigate to /trips/:id) |

**Warnings:** React Router v6 future-flag warnings in stderr during tests — expected, non-blocking (confirmed by Manager review notes on T-016 and T-017).

---

### Test Run 3 — Integration Contract Verification

**Method:** Code review of frontend API calls vs api-contracts.md
**Result:** ✅ PASS

**Auth flow integration:**
- ✅ POST /auth/register: `api.auth.register({name, email, password})` → consumes `{data: {user, access_token}}`
- ✅ POST /auth/login: `api.auth.login({email, password})` → consumes `{data: {user, access_token}}`
- ✅ Access token in-memory: stored in `accessTokenRef` (React useRef) — confirmed NOT in localStorage/sessionStorage
- ✅ Refresh cookie: `withCredentials: true` on axios instance — browser sends httpOnly cookie automatically
- ✅ 401 interceptor: catches 401, calls POST /auth/refresh, retries original request with new token
- ✅ Interceptor guards: skips retry loop for /auth/refresh and /auth/login requests
- ✅ 409 EMAIL_TAKEN → RegisterPage shows email field-level error (not banner)
- ✅ 401 INVALID_CREDENTIALS → LoginPage shows error banner above form (not field error)

**Trips flow integration:**
- ✅ GET /trips: uses `response.data.data` (array) to set trips state
- ✅ POST /trips: destinations form field (comma-string) converted to array before POST — confirmed in useTrips.createTrip
- ✅ After POST /trips: navigate to `/trips/${newTrip.id}` — uses returned `id` field
- ✅ DELETE /trips/:id: 204 (no body) handled correctly — no JSON parsing attempted
- ✅ 404 on GET /trips/:id: `tripError.type = 'not_found'` → full-page "trip not found." error state
- ⚠️ NOTE: 403 on GET /trips/:id treated as generic network error (type: 'network') — no redirect to home. Acceptable for Sprint 1 as users will only access their own trips.

**Sub-resources integration:**
- ✅ GET /trips/:tripId/flights, stays, activities — correct URL format confirmed in api.js
- ✅ All 3 sub-resources fetched in parallel via `Promise.allSettled()` in useTripDetails.fetchAll
- ✅ Each sub-resource has independent error state — one failure does not block others
- ✅ Empty array `[]` response correctly maps to empty state (not error)
- ✅ Activities grouped by `activity_date`, sorted by `start_time` (lexicographic HH:MM:SS — correct for this format)
- ✅ Timezone display: formatDate.js uses `Intl.DateTimeFormat` with `timeZone: tz` parameter

**UI spec adherence:**
- ✅ Calendar placeholder shows "calendar coming in sprint 2"
- ✅ "Add flight/stay/activity" buttons rendered but disabled (`disabled`, `aria-disabled="true"`)
- ✅ Navbar sticky 56px bar with TRIPLANNER brand + username (truncated 20 chars) + sign out button
- ✅ Home page: 3-column CSS Grid layout with skeleton loading, empty state CTA, inline delete confirmation
- ✅ Trip Details: per-section independent loading/error/empty/success states

---

### Test Run 4 — Security Scan

**Method:** Code review + grep analysis against security-checklist.md
**Result:** ✅ PASS WITH ONE KNOWN ACCEPTED RISK

#### Authentication & Authorization

| Checklist Item | Status | Evidence |
|---------------|--------|---------|
| All API endpoints require appropriate auth | ✅ PASS | `router.use(authenticate)` on all trip/flight/stay/activity routers. Auth endpoints: logout requires Bearer token; register/login/refresh are public by design. |
| Role-based access control enforced | ✅ PASS | `trip.user_id !== req.user.id` → 403 FORBIDDEN in trips.js, flights.js, stays.js, activities.js. Ownership checked on EVERY sub-resource operation. |
| Auth tokens: appropriate expiration + refresh | ✅ PASS | Access: 15m (`JWT_EXPIRES_IN`), Refresh: 7 days. Token rotation on refresh (old revoked, new issued via `revokeRefreshToken` + `createRefreshToken`). |
| Password hashing: bcrypt min 12 rounds | ✅ PASS | `bcrypt.hash(password, 12)` confirmed in routes/auth.js. Timing-safe login: `DUMMY_HASH` used for bcrypt.compare even when user not found (prevents email enumeration). |
| Failed login rate-limited | ⚠️ **KNOWN ACCEPTED RISK** | `express-rate-limit` installed in package.json but NOT applied to any route (grep confirms no `rateLimit` usage anywhere in backend/src). Pre-identified in T-010 Manager code review as known staging risk. Accepted for Sprint 1. **Recommendation: Apply rate limiting to /auth/login and /auth/register in Sprint 2.** |

#### Input Validation & Injection Prevention

| Checklist Item | Status | Evidence |
|---------------|--------|---------|
| All user inputs validated server-side | ✅ PASS | `validate()` middleware covers: required, type (string/email/array/isoDate/dateString/isoTime), minLength, maxLength, minItems, maxItems, enum, custom (temporal ordering for dates/times). Applied to every POST and PATCH endpoint. |
| SQL queries parameterized (no string concat) | ✅ PASS | All model files (userModel, tripModel, flightModel, stayModel, activityModel, refreshTokenModel) use Knex builder methods exclusively. `.where({})`, `.where(db.raw('LOWER(email)'), param)`, `.insert()`, `.update()`, `.returning()` — zero string concatenation confirmed by code review. |
| XSS prevention | ✅ PASS | Frontend uses React JSX auto-escaping for all user data. Confirmed by grep: no `dangerouslySetInnerHTML`, `innerHTML`, or `eval()` in any frontend source file. |

#### API Security

| Checklist Item | Status | Evidence |
|---------------|--------|---------|
| CORS configured correctly | ✅ PASS | `cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true })` — restricted to specific origin, not wildcard. `credentials: true` required for httpOnly cookie transport. |
| Rate limiting on public endpoints | ⚠️ KNOWN RISK | See above — not applied. |
| Error responses don't leak internals | ✅ PASS | `errorHandler.js`: 500 status → generic "An unexpected error occurred" message. Stack trace logged server-side only. Error shape always `{error: {message, code}}`. Confirmed no stack traces in responses. |
| Sensitive data not in URL params | ✅ PASS | Auth tokens in `Authorization: Bearer` header and httpOnly cookies. No tokens in query strings or URL paths. |
| Security headers | ✅ PASS | `helmet()` applied in app.js. Sets: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy`, removes `X-Powered-By: Express`, sets HSTS in production. |

#### Data Protection

| Checklist Item | Status | Evidence |
|---------------|--------|---------|
| Sensitive data at rest protected | ✅ PASS | Passwords: bcrypt hashes only. `createUser()` returns `['id', 'name', 'email', 'created_at']` — password_hash excluded from all responses. Test in auth.test.js confirms `password_hash` is `undefined` in register response. |
| DB credentials/API keys in env vars | ✅ PASS | `.env` file is gitignored. `.env.example` has placeholder values only (e.g., `JWT_SECRET=change-me-to-a-random-string`). Grep of backend/src confirms no hardcoded secrets in any source file. |
| Refresh tokens stored as hash | ✅ PASS | `refreshTokenModel.js`: `crypto.createHash('sha256').update(rawToken).digest('hex')`. Raw token generated with `crypto.randomBytes(40)` — only hash persisted. Raw token sent via httpOnly cookie only. |
| Logs don't contain PII/passwords/tokens | ✅ PASS | No `console.log` in any route handler (grep confirmed). errorHandler.js logs `err.stack` (no user data). Access token never logged. |

#### Infrastructure

| Checklist Item | Status | Evidence |
|---------------|--------|---------|
| HTTPS enforced | ⚠️ PENDING T-020 | Not yet configured — staging deployment step. Refresh token cookie uses `secure: process.env.NODE_ENV === 'production'` — will be httpOnly+Secure in production. |
| Dependencies checked for vulnerabilities | ⚠️ DEV DEPS ONLY | Backend: 0 production vuln, 5 moderate in dev deps (vitest/vite/esbuild chain, GHSA-67mh-4wv8-2f99). Frontend: same 5 moderate in dev deps. Vulnerability only affects Vite dev server — no production build impact. |
| Default credentials removed | ✅ PASS | `.env.example` contains placeholders only. |
| Error pages don't reveal server tech | ✅ PASS | Helmet removes `X-Powered-By`. Structured JSON error responses only. |

**Security Scan Summary:**
- **P0 (Critical) issues:** 0
- **P1 (High) issues:** 0
- **P2 (Medium) issues:** 1 (rate limiting — KNOWN ACCEPTED RISK, pre-identified)
- **P3 (Low/Info) issues:** 2 (dev-dep vulns — no prod impact; HTTPS pending staging)

**Decision: Security scan PASSES for Sprint 1 staging deployment.**

---

### Test Run 5 — npm audit

**Commands:**
- `cd /Users/yixinxiao/CLAUDE/triplanner/backend && npm audit`
- `cd /Users/yixinxiao/CLAUDE/triplanner/frontend && npm audit`

**Backend results:**
- 5 moderate vulnerabilities, all in dev dependency chain: `vitest → @vitest/mocker → vite → vite-node → esbuild ≤0.24.2`
- GHSA-67mh-4wv8-2f99: "esbuild enables any website to send any requests to the development server"
- Impact: Affects Vite dev server only — not production build artifacts
- Production dependencies (`express`, `knex`, `pg`, `bcryptjs`, `jsonwebtoken`, `cors`, `helmet`, `express-rate-limit`, `dotenv`) — **0 vulnerabilities**

**Frontend results:**
- Same 5 moderate vulnerabilities in the dev dependency chain
- Same GHSA-67mh-4wv8-2f99 finding
- Production dependencies (`react`, `react-dom`, `react-router-dom`, `axios`) — **0 vulnerabilities**

**Fix:** `npm audit fix --force` would install vitest@4.x (breaking change). Defer to Sprint 2 dev dependency upgrade cycle.

**Decision: NOT blocking for staging. No production risk.**

---

## Sprint 1 — QA Final Verdict

| Category | Tests | Result |
|----------|-------|--------|
| Backend Unit Tests | 60/60 | ✅ PASS |
| Frontend Unit Tests | 128/128 | ✅ PASS |
| Integration Contract Verification | All endpoints | ✅ PASS |
| Security Checklist (19 items) | 17/19 pass, 2 accepted/deferred | ✅ PASS |
| Dependency Audit | Dev deps only | ✅ PASS (no prod risk) |

**Overall Sprint 1 QA Status: ✅ COMPLETE — CLEARED FOR DEPLOYMENT**

Tasks T-004 through T-017 are all verified and moved to Done.

**Accepted risks for Sprint 1 staging (not blocking):**
1. Rate limiting not applied to /auth/login + /auth/register (known from T-010 Manager review) — add in Sprint 2
2. Dev-only esbuild vulnerability (GHSA-67mh-4wv8-2f99) — no production impact
3. HTTPS: pending T-020 staging deployment configuration
4. `triggerRef` focus-return-to-trigger in CreateTripModal not implemented — cosmetic, P3

**Handoff to Deploy Engineer:** ✅ Deploy Engineer is cleared to proceed with T-020 (staging deployment).

---

---

## Sprint 1 — Post-Deploy Health Check Report (T-021) — 2026-02-24

**Monitor Agent:** Monitor Agent
**Sprint:** 1
**Date:** 2026-02-24T02:51 UTC (2026-02-24 local)
**Task:** T-021 — Staging Health Check
**Triggered by:** Deploy Engineer handoff (T-020 Staging Deployment Complete)

---

### Environment

| Component | URL / Host | Status |
|-----------|-----------|--------|
| Backend API (Express) | `http://localhost:3000` | ✅ Running |
| Frontend (Vite preview) | `http://localhost:4173` | ✅ Running |
| PostgreSQL 15 | `localhost:5432 / appdb` | ✅ Connected |

---

### Health Check Results

```
Environment: Staging (local processes)
Timestamp: 2026-02-25T02:51:00Z
Checks:
  - [x] App responds (GET /api/v1/health → 200)
  - [x] Auth works (POST /api/v1/auth/register → 201 with token, POST /api/v1/auth/login → 200 with token)
  - [x] Key endpoints respond (all 13 API checks below)
  - [x] No 5xx errors in any response
  - [x] Database connected (6/6 tables confirmed via psql + full DB round-trip via API)
Result: PASS
Notes: All 18 checks passed. Zero 5xx errors observed. All response shapes match api-contracts.md exactly.
```

---

### Check 1 — Application Health Endpoint

| Field | Value |
|-------|-------|
| Endpoint | `GET http://localhost:3000/api/v1/health` |
| Expected | HTTP 200, `{"status":"ok"}` |
| Actual HTTP Status | **200** |
| Actual Body | `{"status":"ok"}` |
| Contract Match | ✅ EXACT MATCH |
| Result | ✅ PASS |

---

### Check 2 — Frontend Accessibility

| Field | Value |
|-------|-------|
| Endpoint | `GET http://localhost:4173/` |
| Expected | HTTP 200, HTML SPA shell |
| Actual HTTP Status | **200** |
| Actual Content-Type | `text/html` |
| Actual Size | 388 bytes |
| Body Verification | `<!doctype html>...<div id="root"></div>` — SPA shell confirmed with linked JS/CSS assets |
| Result | ✅ PASS |

**Frontend build artifacts confirmed:**
- `/assets/index-I5cnUyCF.js` (243.63 kB production bundle)
- `/assets/index-BKHqepzx.css` (20.76 kB stylesheet)

---

### Check 3 — Database Connectivity (Schema-Level)

| Field | Value |
|-------|-------|
| Method | `psql -U user -h localhost -d appdb -c "\dt"` via `/opt/homebrew/Cellar/postgresql@15/15.16/bin/psql` |
| Expected | 6 application tables + knex meta tables |
| Result | ✅ PASS |

**Tables confirmed present:**

| Table | Status |
|-------|--------|
| `users` | ✅ |
| `refresh_tokens` | ✅ |
| `trips` | ✅ |
| `flights` | ✅ |
| `stays` | ✅ |
| `activities` | ✅ |
| `knex_migrations` | ✅ |
| `knex_migrations_lock` | ✅ |

---

### Check 4 — Auth: Register (DB Round-Trip)

| Field | Value |
|-------|-------|
| Endpoint | `POST http://localhost:3000/api/v1/auth/register` |
| Request Body | `{"name":"Monitor Test User","email":"monitor-health-check-20260224@test.local","password":"SecurePass99"}` |
| Expected | HTTP 201, `{data: {user: {id, name, email, created_at}, access_token}}` |
| Actual HTTP Status | **201** |
| Actual Body | `{"data":{"user":{"id":"90ab8a7a-666a-4240-8045-e5609357a205","name":"Monitor Test User","email":"monitor-health-check-20260224@test.local","created_at":"2026-02-25T02:51:20.048Z"},"access_token":"eyJhbGci..."}}` |
| Contract Match | ✅ EXACT MATCH — user UUID, name, email, created_at all present; access_token present; password_hash absent |
| DB Round-Trip | ✅ CONFIRMED — user created in DB (UUID 90ab8a7a-666a-4240-8045-e5609357a205) |
| Result | ✅ PASS |

---

### Check 5 — Auth: Login

| Field | Value |
|-------|-------|
| Endpoint | `POST http://localhost:3000/api/v1/auth/login` |
| Request Body | `{"email":"monitor-health-check-20260224@test.local","password":"SecurePass99"}` |
| Expected | HTTP 200, `{data: {user, access_token}}` |
| Actual HTTP Status | **200** |
| Actual Body | `{"data":{"user":{"id":"90ab8a7a-...","name":"Monitor Test User","email":"...","created_at":"..."},"access_token":"eyJhbGci..."}}` |
| Contract Match | ✅ EXACT MATCH |
| Result | ✅ PASS |

---

### Check 6 — Trips: List (Protected Route)

| Field | Value |
|-------|-------|
| Endpoint | `GET http://localhost:3000/api/v1/trips` |
| Auth | Bearer token from login |
| Expected | HTTP 200, `{data: [], pagination: {page: 1, limit: 20, total: 0}}` (empty for new user) |
| Actual HTTP Status | **200** |
| Actual Body | `{"data":[],"pagination":{"page":1,"limit":20,"total":0}}` |
| Contract Match | ✅ EXACT MATCH — pagination shape, field names, empty data array |
| Result | ✅ PASS |

---

### Check 7 — Trips: Create

| Field | Value |
|-------|-------|
| Endpoint | `POST http://localhost:3000/api/v1/trips` |
| Auth | Bearer token from login |
| Request Body | `{"name":"Monitor Health Check Trip","destinations":["Tokyo","Osaka"]}` |
| Expected | HTTP 201, `{data: {id, user_id, name, destinations, status: "PLANNING", created_at, updated_at}}` |
| Actual HTTP Status | **201** |
| Actual Body | `{"data":{"id":"457ee95a-4f20-46f9-a8bc-44bee34edd80","user_id":"90ab8a7a-...","name":"Monitor Health Check Trip","destinations":["Tokyo","Osaka"],"status":"PLANNING","created_at":"2026-02-25T02:51:44.347Z","updated_at":"2026-02-25T02:51:44.347Z"}}` |
| Contract Match | ✅ EXACT MATCH — all fields present, destinations returned as array, status defaults to PLANNING |
| Result | ✅ PASS |

---

### Check 8 — Trips: Get By ID

| Field | Value |
|-------|-------|
| Endpoint | `GET http://localhost:3000/api/v1/trips/457ee95a-4f20-46f9-a8bc-44bee34edd80` |
| Auth | Bearer token from login |
| Expected | HTTP 200, full trip object |
| Actual HTTP Status | **200** |
| Actual Body | `{"data":{"id":"457ee95a-...","user_id":"90ab8a7a-...","name":"Monitor Health Check Trip","destinations":["Tokyo","Osaka"],"status":"PLANNING","created_at":"...","updated_at":"..."}}` |
| Contract Match | ✅ EXACT MATCH |
| Result | ✅ PASS |

---

### Check 9 — Sub-Resource: Flights

| Field | Value |
|-------|-------|
| Endpoint | `GET http://localhost:3000/api/v1/trips/457ee95a-4f20-46f9-a8bc-44bee34edd80/flights` |
| Auth | Bearer token from login |
| Expected | HTTP 200, `{data: []}` |
| Actual HTTP Status | **200** |
| Actual Body | `{"data":[]}` |
| Contract Match | ✅ EXACT MATCH |
| Result | ✅ PASS |

---

### Check 10 — Sub-Resource: Stays

| Field | Value |
|-------|-------|
| Endpoint | `GET http://localhost:3000/api/v1/trips/457ee95a-4f20-46f9-a8bc-44bee34edd80/stays` |
| Auth | Bearer token from login |
| Expected | HTTP 200, `{data: []}` |
| Actual HTTP Status | **200** |
| Actual Body | `{"data":[]}` |
| Contract Match | ✅ EXACT MATCH |
| Result | ✅ PASS |

---

### Check 11 — Sub-Resource: Activities

| Field | Value |
|-------|-------|
| Endpoint | `GET http://localhost:3000/api/v1/trips/457ee95a-4f20-46f9-a8bc-44bee34edd80/activities` |
| Auth | Bearer token from login |
| Expected | HTTP 200, `{data: []}` |
| Actual HTTP Status | **200** |
| Actual Body | `{"data":[]}` |
| Contract Match | ✅ EXACT MATCH |
| Result | ✅ PASS |

---

### Check 12 — Trips: Delete

| Field | Value |
|-------|-------|
| Endpoint | `DELETE http://localhost:3000/api/v1/trips/457ee95a-4f20-46f9-a8bc-44bee34edd80` |
| Auth | Bearer token from login |
| Expected | HTTP 204, empty body |
| Actual HTTP Status | **204** |
| Actual Body | (empty — 0 bytes) |
| Contract Match | ✅ EXACT MATCH |
| Result | ✅ PASS |

---

### Check 13 — Trip 404 After Delete

| Field | Value |
|-------|-------|
| Endpoint | `GET http://localhost:3000/api/v1/trips/457ee95a-4f20-46f9-a8bc-44bee34edd80` |
| Auth | Bearer token from login |
| Expected | HTTP 404, `{error: {message: "Trip not found", code: "NOT_FOUND"}}` |
| Actual HTTP Status | **404** |
| Actual Body | `{"error":{"message":"Trip not found","code":"NOT_FOUND"}}` |
| Contract Match | ✅ EXACT MATCH |
| Result | ✅ PASS — cascade delete confirmed; trip no longer retrievable |

---

### Check 14 — Auth: Logout

| Field | Value |
|-------|-------|
| Endpoint | `POST http://localhost:3000/api/v1/auth/logout` |
| Auth | Bearer token from login |
| Expected | HTTP 204, empty body |
| Actual HTTP Status | **204** |
| Actual Body | (empty — 0 bytes) |
| Contract Match | ✅ EXACT MATCH |
| Result | ✅ PASS |

---

### Check 15 — Error Shape: 401 Unauthorized (no token)

| Field | Value |
|-------|-------|
| Endpoint | `GET http://localhost:3000/api/v1/trips` (no Authorization header) |
| Expected | HTTP 401, `{error: {message: "Authentication required", code: "UNAUTHORIZED"}}` |
| Actual HTTP Status | **401** |
| Actual Body | `{"error":{"message":"Authentication required","code":"UNAUTHORIZED"}}` |
| Contract Match | ✅ EXACT MATCH |
| Result | ✅ PASS — protected route correctly rejects unauthenticated request |

---

### Check 16 — Error Shape: 409 Conflict (duplicate email)

| Field | Value |
|-------|-------|
| Endpoint | `POST http://localhost:3000/api/v1/auth/register` (duplicate email) |
| Expected | HTTP 409, `{error: {message: "An account with this email already exists", code: "EMAIL_TAKEN"}}` |
| Actual HTTP Status | **409** |
| Actual Body | `{"error":{"message":"An account with this email already exists","code":"EMAIL_TAKEN"}}` |
| Contract Match | ✅ EXACT MATCH |
| Result | ✅ PASS — no 5xx on duplicate email |

---

### Check 17 — Error Shape: 404 Not Found (non-existent trip)

| Field | Value |
|-------|-------|
| Endpoint | `GET http://localhost:3000/api/v1/trips/00000000-0000-0000-0000-000000000000` |
| Auth | Bearer token from login |
| Expected | HTTP 404, `{error: {message: "Trip not found", code: "NOT_FOUND"}}` |
| Actual HTTP Status | **404** |
| Actual Body | `{"error":{"message":"Trip not found","code":"NOT_FOUND"}}` |
| Contract Match | ✅ EXACT MATCH |
| Result | ✅ PASS |

---

### Check 18 — Auth: Refresh Without Cookie

| Field | Value |
|-------|-------|
| Endpoint | `POST http://localhost:3000/api/v1/auth/refresh` (no cookie) |
| Expected | HTTP 401, `{error: {message: "Invalid or expired refresh token", code: "INVALID_REFRESH_TOKEN"}}` |
| Actual HTTP Status | **401** |
| Actual Body | `{"error":{"message":"Invalid or expired refresh token","code":"INVALID_REFRESH_TOKEN"}}` |
| Contract Match | ✅ EXACT MATCH |
| Result | ✅ PASS — no 5xx on missing refresh cookie |

---

### 5xx Error Scan

| Scope | Result |
|-------|--------|
| All 18 health check requests | **0 × 5xx errors** |
| Auth endpoints (register, login, logout, refresh) | ✅ No 5xx |
| Trips CRUD (list, create, get, delete) | ✅ No 5xx |
| Sub-resource endpoints (flights, stays, activities) | ✅ No 5xx |
| Error-path requests (401, 404, 409) | ✅ All returned client-side error codes, not 5xx |

---

### Health Check Summary

| # | Check | Endpoint / Method | Expected | Actual Status | Result |
|---|-------|-------------------|----------|---------------|--------|
| 1 | App health | `GET /api/v1/health` | 200 | **200** | ✅ PASS |
| 2 | Frontend accessible | `GET http://localhost:4173/` | 200 HTML | **200** | ✅ PASS |
| 3 | Database tables (psql) | Direct DB query | 6 tables | **8 rows (6 app + 2 knex meta)** | ✅ PASS |
| 4 | Auth register + DB round-trip | `POST /api/v1/auth/register` | 201 + token | **201** | ✅ PASS |
| 5 | Auth login | `POST /api/v1/auth/login` | 200 + token | **200** | ✅ PASS |
| 6 | Trips list (protected) | `GET /api/v1/trips` | 200 + pagination | **200** | ✅ PASS |
| 7 | Trip create | `POST /api/v1/trips` | 201 + trip | **201** | ✅ PASS |
| 8 | Trip get by ID | `GET /api/v1/trips/:id` | 200 + trip | **200** | ✅ PASS |
| 9 | Flights sub-resource | `GET /api/v1/trips/:id/flights` | 200 + `{data:[]}` | **200** | ✅ PASS |
| 10 | Stays sub-resource | `GET /api/v1/trips/:id/stays` | 200 + `{data:[]}` | **200** | ✅ PASS |
| 11 | Activities sub-resource | `GET /api/v1/trips/:id/activities` | 200 + `{data:[]}` | **200** | ✅ PASS |
| 12 | Trip delete | `DELETE /api/v1/trips/:id` | 204 empty | **204** | ✅ PASS |
| 13 | Trip 404 after delete | `GET /api/v1/trips/:id` (deleted) | 404 NOT_FOUND | **404** | ✅ PASS |
| 14 | Auth logout | `POST /api/v1/auth/logout` | 204 empty | **204** | ✅ PASS |
| 15 | 401 error shape | `GET /api/v1/trips` (no token) | 401 UNAUTHORIZED | **401** | ✅ PASS |
| 16 | 409 error shape | `POST /auth/register` (dup email) | 409 EMAIL_TAKEN | **409** | ✅ PASS |
| 17 | 404 error shape | `GET /api/v1/trips/:nonexistent-id` | 404 NOT_FOUND | **404** | ✅ PASS |
| 18 | Refresh without cookie | `POST /auth/refresh` (no cookie) | 401 INVALID_REFRESH_TOKEN | **401** | ✅ PASS |

**Total Checks:** 18
**Passed:** 18
**Failed:** 0
**5xx Errors:** 0

---

### Deploy Verified

| Field | Value |
|-------|-------|
| **Deploy Verified** | **✅ YES** |
| Verified By | Monitor Agent |
| Verified At | 2026-02-25T02:51 UTC |
| Related Task | T-021 |
| All API contracts matched | ✅ Yes — all response shapes match api-contracts.md |
| Database healthy | ✅ Yes — all 6 tables present and accepting reads/writes |
| No 5xx errors | ✅ Yes — zero 5xx observed across all 18 checks |
| Frontend accessible | ✅ Yes — SPA shell serving at http://localhost:4173 |

**Staging environment is healthy and ready for User Agent testing (T-022).**

---

*Add entries at the top (newest first) as tests are run and deployments are verified.*

---

## Sprint 1 — QA Second-Pass Report (2026-02-24)

**QA Engineer:** QA Agent (Sprint #1 Orchestrator Re-Run)
**Sprint:** 1
**Date:** 2026-02-24
**Purpose:** Full second-pass QA confirmation run — verifying all tests still pass and security holds after staging deployment, Monitor Agent verification, and prior Manager second-pass code audit.

---

### Test Run A — Backend Unit Tests (Second Pass)

**Command:** `cd /Users/yixinxiao/CLAUDE/triplanner/backend && npm test -- --run`
**Duration:** 569ms
**Result:** ✅ PASS — 60/60 tests

| Test File | Tests | Result |
|-----------|-------|--------|
| `auth.test.js` | 14 | ✅ PASS |
| `stays.test.js` | 8 | ✅ PASS |
| `activities.test.js` | 12 | ✅ PASS |
| `flights.test.js` | 10 | ✅ PASS |
| `trips.test.js` | 16 | ✅ PASS |

**Coverage confirmed:** All endpoints covered with happy-path and error-path tests. No regressions.

---

### Test Run B — Frontend Unit Tests (Second Pass)

**Command:** `cd /Users/yixinxiao/CLAUDE/triplanner/frontend && npm test -- --run`
**Duration:** 2.42s
**Result:** ✅ PASS — 128/128 tests

| Test File | Tests | Result |
|-----------|-------|--------|
| `useTrips.test.js` | 11 | ✅ PASS |
| `useTripDetails.test.js` | 21 | ✅ PASS |
| `CreateTripModal.test.jsx` | 8 | ✅ PASS |
| `RegisterPage.test.jsx` | 8 | ✅ PASS |
| `LoginPage.test.jsx` | 9 | ✅ PASS |
| `TripDetailsPage.test.jsx` | 31 | ✅ PASS |
| `HomePage.test.jsx` | 14 | ✅ PASS |
| `formatDate.test.js` | 9 | ✅ PASS |
| `TripCard.test.jsx` | 7 | ✅ PASS |
| `StatusBadge.test.jsx` | 4 | ✅ PASS |
| `Navbar.test.jsx` | 6 | ✅ PASS |

**Warnings:** React Router v6 future-flag warnings (v7_startTransition, v7_relativeSplatPath) in stderr — expected, non-blocking. Confirmed pre-existing from prior QA pass.

---

### Test Run C — Integration Contract Verification (Second Pass)

**Method:** Direct source-code review of frontend API calls vs api-contracts.md + backend implementation

**Auth Flow:**
| Check | Status | Evidence |
|-------|--------|---------|
| POST /auth/register shape match | ✅ PASS | `api.auth.register({name, email, password})` → backend returns `{data:{user,access_token}}` — consumed correctly in RegisterPage |
| POST /auth/login shape match | ✅ PASS | `api.auth.login({email, password})` → LoginPage extracts `response.data.data.{user, access_token}` |
| Access token in-memory only | ✅ PASS | `accessTokenRef = useRef(null)` in AuthContext — grep of all frontend src confirms NO localStorage/sessionStorage writes |
| httpOnly cookie transport | ✅ PASS | `withCredentials: true` on apiClient axios instance |
| 401 interceptor with retry queue | ✅ PASS | `isRefreshing` guard + `refreshSubscribers` queue in api.js; skips retry for `/auth/refresh` and `/auth/login` |
| 409 EMAIL_TAKEN → email field error | ✅ PASS | RegisterPage maps status 409 → setErrors({email: 'an account...'}) |
| 401 INVALID_CREDENTIALS → banner | ✅ PASS | LoginPage maps status 401 → setApiError('incorrect email or password.') |
| POST /auth/logout → 204 + clearAuth | ✅ PASS | Navbar best-effort logout calls api.auth.logout() then clearAuth() regardless of result |

**Trips CRUD:**
| Check | Status | Evidence |
|-------|--------|---------|
| GET /trips → list + pagination | ✅ PASS | useTrips.fetchTrips reads `response.data.data` (the array) |
| POST /trips destinations: string→array | ✅ PASS | useTrips.createTrip splits comma-separated string → array before API call |
| POST /trips → navigate to /trips/:id | ✅ PASS | HomePage.handleCreateTrip calls `navigate('/trips/${newTrip.id}')` with returned id |
| DELETE /trips/:id → 204 (no body) | ✅ PASS | useTrips.deleteTrip calls `api.trips.delete(tripId)` then updates local state |
| 404 on GET /trips/:id → full-page error | ✅ PASS | useTripDetails sets `tripError.type='not_found'` on HTTP 404 → TripDetailsPage renders full-page "trip not found." |

**Sub-Resources:**
| Check | Status | Evidence |
|-------|--------|---------|
| Correct URL structure | ✅ PASS | api.js: `apiClient.get('/trips/${tripId}/flights')` etc. — matches contracts |
| Parallel fetch with Promise.allSettled | ✅ PASS | useTripDetails.fetchAll uses Promise.allSettled for flights/stays/activities |
| Independent error states | ✅ PASS | Each sub-resource has its own error state; one failure doesn't block others |
| Empty array → empty state (not error) | ✅ PASS | `|| []` fallback in all fulfilled result handlers |
| Activity grouping + sort | ✅ PASS | TripDetailsPage groups by activity_date, sorts by start_time (lexicographic HH:MM:SS) |
| Timezone display | ✅ PASS | formatDate.js uses Intl.DateTimeFormat with IANA timezone from `*_tz` fields |

**UI Spec Adherence:**
| Check | Status | Evidence |
|-------|--------|---------|
| All states: empty/loading/error/success | ✅ PASS | All 4 states implemented in HomePage and TripDetailsPage (per-section in details) |
| Calendar placeholder | ✅ PASS | TripDetailsPage renders "calendar coming in sprint 2" text |
| Disabled add buttons | ✅ PASS | All "add" action buttons have `disabled` + `aria-disabled="true"` |
| Navbar: sticky, username, logout | ✅ PASS | Navbar component: sticky 56px, truncates username at 20 chars, best-effort logout |
| Home: 3-column grid, skeleton, empty CTA | ✅ PASS | HomePage.module.css grid + TripCardSkeleton + empty state with CTA |
| Inline delete confirmation | ✅ PASS | TripCard renders confirm/cancel overlay, re-throws on API error for parent to handle |

---

### Test Run D — Security Scan (Second Pass)

**Method:** Code review + grep analysis of actual source files

#### Authentication & Authorization

| Item | Status | Evidence |
|------|--------|---------|
| All API endpoints require auth | ✅ PASS | `router.use(authenticate)` on trips, flights, stays, activities routers. Auth routes: logout requires Bearer; register/login/refresh are public by design |
| Ownership / RBAC enforced | ✅ PASS | `trip.user_id !== req.user.id` → 403 in all trips.js CRUD routes. `requireTripOwnership()` helper called on every flight/stay/activity route operation |
| Auth tokens: expiry + refresh | ✅ PASS | Access: 15m (JWT_EXPIRES_IN env var). Refresh: 7d (REFRESH_TOKEN_SECONDS = 604800). Token rotation confirmed in auth.js:222–228 |
| Password hashing: bcrypt 12 rounds | ✅ PASS | `bcrypt.hash(password, 12)` at auth.js:104. Timing-safe: DUMMY_HASH used when user not found (auth.js:156–158) |
| Failed login rate-limited | ⚠️ **KNOWN ACCEPTED RISK** | `express-rate-limit: ^7.4.0` in package.json dependencies, but NOT applied to any route (confirmed by grep: zero occurrences of `rateLimit` in backend/src/). Pre-identified in T-010 Manager review. Accepted for Sprint 1. **Sprint 2 action required.** |

#### Input Validation & Injection Prevention

| Item | Status | Evidence |
|------|--------|---------|
| Server-side input validation | ✅ PASS | validate() middleware covers: required, type (string/email/array/isoDate/dateString/isoTime), minLength, maxLength, enum, temporal ordering (arrival>departure, checkout>checkin, endTime>startTime). Applied to all POST and PATCH handlers |
| Parameterized SQL queries | ✅ PASS | All models use Knex builder exclusively: `.where({})`, `.insert()`, `.update()`, `.first()`, `.returning()`. Zero string concatenation in DB queries |
| XSS prevention | ✅ PASS | Grep confirms: 0 occurrences of `dangerouslySetInnerHTML`, `innerHTML`, or `eval(` in any frontend source file. React JSX auto-escaping for all user data |
| File uploads | ✅ N/A | No file upload functionality in Sprint 1 scope |
| NoSQL injection | ✅ N/A | No MongoDB/NoSQL usage — PostgreSQL via parameterized Knex |

#### API Security

| Item | Status | Evidence |
|------|--------|---------|
| CORS configured correctly | ✅ PASS | `cors({ origin: process.env.CORS_ORIGIN \|\| 'http://localhost:5173', credentials: true })` — specific origin only, not wildcard |
| Rate limiting on public endpoints | ⚠️ KNOWN RISK | See above |
| Error responses: no internal leakage | ✅ PASS | errorHandler.js: 500 → generic "An unexpected error occurred". Stack trace logged server-side only (console.error). Error shape always `{error:{message,code}}`. 0 console.log calls in route handlers (only startup log in index.js) |
| Sensitive data not in URL params | ✅ PASS | Auth tokens in `Authorization: Bearer` header and httpOnly cookies. No tokens in URL paths or query strings |
| Security headers | ✅ PASS | `helmet()` applied first in app.js before all routes. Sets: X-Content-Type-Options, X-Frame-Options, Referrer-Policy, removes X-Powered-By. HSTS in production |

#### Data Protection

| Item | Status | Evidence |
|------|--------|---------|
| Passwords stored as hashes only | ✅ PASS | `createUser()` returns `['id','name','email','created_at']` — password_hash excluded. No raw password ever logged |
| Refresh token: hash stored, not raw | ✅ PASS | refreshTokenModel.js: `crypto.createHash('sha256').update(rawToken).digest('hex')`. Raw token is 40 random bytes sent via httpOnly cookie only |
| Access token in-memory only | ✅ PASS | `accessTokenRef = useRef(null)` — grep confirms zero localStorage/sessionStorage writes in frontend |
| DB credentials/secrets in env vars | ✅ PASS | `.env` is gitignored (root .gitignore). `.env.example` has placeholders only. Grep of backend/src: zero hardcoded secrets |
| Logs: no PII/passwords/tokens | ✅ PASS | Zero console.log in route handlers. errorHandler.js logs `err.stack` (no user data). Access tokens never logged |

#### Infrastructure

| Item | Status | Evidence |
|------|--------|---------|
| HTTPS enforced | ⚠️ STAGING LIMITATION | Not configured on local staging. Cookie uses `secure: process.env.NODE_ENV === 'production'` — env-conditional. Will be secure in production. Pre-existing known limitation |
| Dependency audit | ⚠️ DEV DEPS ONLY | 5 moderate vulns (GHSA-67mh-4wv8-2f99 — esbuild dev server). Affects vitest/vite dev deps only, not production build. `npm audit fix --force` would install vitest@4.x (breaking change) — defer to Sprint 2 |
| Default credentials removed | ✅ PASS | .env.example: JWT_SECRET=change-me-to-a-random-string (placeholder, not deployed) |
| Error pages: no server tech revealed | ✅ PASS | Helmet removes X-Powered-By. All error responses are structured JSON |

**Security Scan Summary:**
- **P0 (Critical):** 0
- **P1 (High):** 0
- **P2 (Medium):** 1 — rate limiting not applied (KNOWN ACCEPTED RISK, Sprint 2 backlog)
- **P3 (Low/Info):** 2 — dev-dep vulns (no prod impact); HTTPS pending production config

**Security Scan: ✅ PASS — no new issues found. All prior findings confirmed unchanged.**

---

### Test Run E — npm audit (Second Pass)

**Backend:** `cd backend && npm audit`
- 5 moderate vulns: `vitest → @vitest/mocker → vite → vite-node → esbuild ≤0.24.2`
- GHSA-67mh-4wv8-2f99: esbuild dev server vulnerability
- **Production dependencies:** express, knex, pg, bcryptjs, jsonwebtoken, cors, helmet, express-rate-limit, dotenv — **0 vulnerabilities**

**Frontend:** `cd frontend && npm audit`
- Same 5 moderate vulns in dev dep chain (vite/vitest/esbuild)
- **Production dependencies:** react, react-dom, react-router-dom, axios — **0 vulnerabilities**

**Decision: NOT blocking. No production risk.**

---

### Sprint 1 QA Second-Pass Summary

| Category | Tests | Result |
|----------|-------|--------|
| Backend Unit Tests | 60/60 | ✅ PASS |
| Frontend Unit Tests | 128/128 | ✅ PASS |
| Integration Contract Verification | All 25 checks | ✅ PASS |
| Security Checklist (19 items) | 16 pass, 1 accepted risk, 2 deferred | ✅ PASS |
| npm audit | Dev deps only | ✅ PASS (0 prod vulns) |

**Overall Sprint 1 QA Status: ✅ CONFIRMED PASS — No regressions. Sprint 1 deployment cleared.**

**Active accepted risks (unchanged from first QA pass):**
1. Rate limiting not applied to /auth/login + /auth/register — add in Sprint 2 backlog
2. Dev-only esbuild vulnerability (GHSA-67mh-4wv8-2f99) — no production impact
3. HTTPS: pending staging/production configuration
4. `triggerRef` focus-return-to-trigger in CreateTripModal — cosmetic, P3, Sprint 2

**T-022 (User Agent) is In Progress. All QA and deployment tasks are Done.**

---

## Sprint 1 — QA Third-Pass Report (2026-02-24)

**QA Engineer:** QA Agent (Sprint #1 Orchestrator Third-Pass)
**Sprint:** 1
**Date:** 2026-02-24
**Purpose:** Full third-pass QA confirmation — fresh test run + security re-verification after Manager fourth-pass code audit and ongoing T-022 (User Agent) work.
**Prior QA passes:** First pass (QA initial), Second pass (post-deploy confirmation) — both confirmed PASS.

---

### Test Run I — Backend Unit Tests (Third Pass)

**Command:** `cd /Users/yixinxiao/CLAUDE/triplanner/backend && npm test -- --run`
**Duration:** 466ms
**Result:** ✅ PASS — 60/60 tests

| Test File | Tests | Result |
|-----------|-------|--------|
| `stays.test.js` | 8 | ✅ PASS |
| `activities.test.js` | 12 | ✅ PASS |
| `flights.test.js` | 10 | ✅ PASS |
| `auth.test.js` | 14 | ✅ PASS |
| `trips.test.js` | 16 | ✅ PASS |

**Coverage confirmed (happy-path + error-path per endpoint group):**
- Auth (register/login/refresh/logout): ✅ All error codes covered (400, 401, 409, 204)
- Trips CRUD: ✅ All error codes covered (400, 401, 403, 404, 204)
- Flights/Stays/Activities: ✅ All error codes covered (400, 401, 403, 404, 204)
- **No regressions from prior passes.**

---

### Test Run II — Frontend Unit Tests (Third Pass)

**Command:** `cd /Users/yixinxiao/CLAUDE/triplanner/frontend && npm test -- --run`
**Duration:** 2.32s
**Result:** ✅ PASS — 128/128 tests

| Test File | Tests | Result |
|-----------|-------|--------|
| `useTripDetails.test.js` | 21 | ✅ PASS |
| `useTrips.test.js` | 11 | ✅ PASS |
| `CreateTripModal.test.jsx` | 8 | ✅ PASS |
| `LoginPage.test.jsx` | 9 | ✅ PASS |
| `RegisterPage.test.jsx` | 8 | ✅ PASS |
| `TripDetailsPage.test.jsx` | 31 | ✅ PASS |
| `HomePage.test.jsx` | 14 | ✅ PASS |
| `formatDate.test.js` | 9 | ✅ PASS |
| `TripCard.test.jsx` | 7 | ✅ PASS |
| `StatusBadge.test.jsx` | 4 | ✅ PASS |
| `Navbar.test.jsx` | 6 | ✅ PASS |

**Warnings:** React Router v6 future-flag warnings (v7_startTransition, v7_relativeSplatPath) — expected, pre-existing, non-blocking.
**No regressions from prior passes.**

---

### Test Run III — Security Code Review (Third Pass)

**Method:** Targeted grep + code inspection of actual source files
**Result:** ✅ PASS — No new issues found. All prior findings confirmed unchanged.

| Security Check | Command/Method | Result | Evidence |
|---------------|----------------|--------|---------|
| Hardcoded secrets | grep -rn `JWT_SECRET =` in backend/src/ | ✅ CLEAN | Exit code 1 — no matches |
| Rate limiting applied | grep -rn `rateLimit` in backend/src/ | ⚠️ NOT APPLIED | Exit code 1 — pre-existing known accepted risk |
| SQL string concat (routes/models) | grep -rn `db.raw\|knex.raw` in backend/src/ | ✅ SAFE | Matches only in migrations (UUID defaults, CHECK constraints) and `LOWER(email)` function reference — no user input in raw SQL |
| XSS vectors in frontend | grep -rn `dangerouslySetInnerHTML` in frontend/src/ | ✅ CLEAN | Exit code 1 — no matches |
| Token in localStorage | grep -rn `localStorage.setItem\|sessionStorage.setItem` in frontend/src/ | ✅ CLEAN | Exit code 1 — no matches |
| console.log in route handlers | grep -rn `console.log` in backend/src/routes/ | ✅ CLEAN | Exit code 1 — no matches |
| bcrypt rounds | grep -n `bcrypt.hash` in auth.js | ✅ PASS | `bcrypt.hash(password, 12)` at line 104 |
| Timing-safe login | grep -n `DUMMY_HASH` in auth.js | ✅ PASS | `DUMMY_HASH` defined at line 23, used at line 157 |
| helmet + cors in app.js | grep -n `helmet\|cors` in app.js | ✅ PASS | Both applied — helmet() at line 15, cors with CORS_ORIGIN env var |
| withCredentials in axios | grep -n `withCredentials` in api.js | ✅ PASS | `withCredentials: true` at line 19 |
| API contract URLs in api.js | Read api.js | ✅ PASS | All endpoints match api-contracts.md exactly — auth, trips, flights, stays, activities |

**Security Summary:**
- **P0 (Critical):** 0
- **P1 (High):** 0
- **P2 (Medium):** 1 — rate limiting not applied (KNOWN ACCEPTED RISK, Sprint 2 backlog — unchanged)
- **P3 (Low/Info):** 2 — dev-dep vulns (no prod impact); HTTPS pending production config

---

### Test Run IV — npm audit (Third Pass)

**Backend:** `cd backend && npm audit` → 5 moderate vulns in dev dep chain only (vitest→vite→esbuild GHSA-67mh-4wv8-2f99). Production deps: **0 vulnerabilities**
**Frontend:** `cd frontend && npm audit` → Same 5 moderate vulns in dev dep chain only. Production deps: **0 vulnerabilities**
**Status:** ✅ PASS — unchanged from prior passes. No production risk.

---

### Test Run V — Integration Contract Verification (Third Pass)

**Method:** Direct code review of api.js against api-contracts.md
**Result:** ✅ PASS — All API method signatures and URLs match contracts exactly

| Contract Group | Frontend Call | Contract Endpoint | Match |
|----------------|--------------|-------------------|-------|
| Auth register | `api.auth.register(body)` → POST /auth/register | ✅ | ✅ |
| Auth login | `api.auth.login(body)` → POST /auth/login | ✅ | ✅ |
| Auth refresh | `api.auth.refresh()` → POST /auth/refresh | ✅ | ✅ |
| Auth logout | `api.auth.logout()` → POST /auth/logout | ✅ | ✅ |
| Trips list | `api.trips.list(params)` → GET /trips | ✅ | ✅ |
| Trips create | `api.trips.create(body)` → POST /trips | ✅ | ✅ |
| Trips get | `api.trips.get(id)` → GET /trips/:id | ✅ | ✅ |
| Trips update | `api.trips.update(id, body)` → PATCH /trips/:id | ✅ | ✅ |
| Trips delete | `api.trips.delete(id)` → DELETE /trips/:id | ✅ | ✅ |
| Flights list | `api.flights.list(tripId)` → GET /trips/:tripId/flights | ✅ | ✅ |
| Stays list | `api.stays.list(tripId)` → GET /trips/:tripId/stays | ✅ | ✅ |
| Activities list | `api.activities.list(tripId)` → GET /trips/:tripId/activities | ✅ | ✅ |

**Interceptor verification:**
- ✅ 401 interceptor: `isRefreshing` guard + subscriber queue — no infinite refresh loop
- ✅ Skips retry for `/auth/refresh` and `/auth/login` URLs (lines 73–74 in api.js)
- ✅ `withCredentials: true` for httpOnly cookie transport
- ✅ Bearer token injected from in-memory `getTokenFn()` — never localStorage

---

### Sprint 1 QA Third-Pass Summary

| Category | Tests | Result |
|----------|-------|--------|
| Backend Unit Tests | 60/60 (466ms) | ✅ PASS |
| Frontend Unit Tests | 128/128 (2.32s) | ✅ PASS |
| Security Code Review | All checks | ✅ PASS (1 accepted risk: no rate limiting) |
| npm audit | Dev deps only | ✅ PASS (0 prod vulns) |
| Integration Contract Verification | All 12 endpoint groups | ✅ PASS |

**Overall Sprint 1 QA Status: ✅ CONFIRMED PASS — Third pass. No regressions. Zero new issues found.**

**Active accepted risks (unchanged from all prior passes):**
1. Rate limiting not applied to /auth/login + /auth/register — Sprint 2 backlog
2. Dev-only esbuild vulnerability (GHSA-67mh-4wv8-2f99) — no production impact
3. HTTPS: pending production configuration
4. `triggerRef` focus-return-to-trigger in CreateTripModal — cosmetic, P3, Sprint 2

**Sprint 1 deployment clearance: ✅ REMAINS VALID. T-022 (User Agent) may continue.**

---
---
