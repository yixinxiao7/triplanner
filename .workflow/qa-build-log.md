# QA & Build Log

Tracks test runs, build results, and post-deploy health checks per sprint. Maintained by QA Engineer, Deploy Engineer, and Monitor Agent.

---

## Sprint #16 — Post-Deploy Health Check
**Date:** 2026-03-08
**Environment:** Staging
**Performed by:** Monitor Agent

### Config Consistency Validation

Staging environment uses `backend/.env.staging` (PORT=3001, HTTPS, CORS_ORIGIN=https://localhost:4173). `backend/.env` is the local dev config (PORT=3000, HTTP) and is not used for staging.

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| Backend PORT vs Vite proxy port | same (3001) | `.env.staging` PORT=3001; Vite proxy uses `BACKEND_PORT=3001` env var at staging launch → `https://localhost:3001` | PASS |
| Protocol (HTTP/HTTPS) | HTTPS (SSL_KEY_PATH + SSL_CERT_PATH set in .env.staging) | `SSL_KEY_PATH=../infra/certs/localhost-key.pem` and `SSL_CERT_PATH=../infra/certs/localhost.pem` both set; certs exist at `infra/certs/`; pm2 process confirmed serving HTTPS on port 3001 | PASS |
| CORS_ORIGIN includes frontend origin | `https://localhost:4173` (Vite preview staging port) | `.env.staging` CORS_ORIGIN=`https://localhost:4173` | PASS |
| Docker port mapping | N/A (staging uses pm2, not Docker) | `docker-compose.yml` backend hardcodes PORT=3000 — applies to Docker production setup only, not staging | N/A |

**Config Consistency Result:** PASS

### Health Check Results

| Check | Endpoint | Expected | Actual | Result |
|-------|----------|----------|--------|--------|
| App responds | GET /api/v1/health | 200 `{"status":"ok"}` | 200 `{"status":"ok"}` | PASS |
| Auth register | POST /api/v1/auth/register | 201 with user object + access_token | 201 `{"data":{"user":{"id":"d2a9554d-...","name":"Monitor Test S16","email":"monitor-test-s16@example.com","created_at":"2026-03-08T20:48:49.244Z"},"access_token":"eyJ..."}}` | PASS |
| Auth login | POST /api/v1/auth/login | 200 with user + access_token | 200 `{"data":{"user":{...},"access_token":"eyJ..."}}` | PASS |
| GET /trips (authenticated) | GET /api/v1/trips | 200 with pagination + start_date/end_date per trip | 200 `{"data":[{"id":"089b...","start_date":"2026-05-01","end_date":"2026-05-02",...}],"pagination":{"page":1,"limit":20,"total":1}}` | PASS |
| GET /trips — no-event trip returns null dates | GET /api/v1/trips (immediately after trip creation, before flight added) | `start_date: null, end_date: null` | POST /trips response: `"start_date":null,"end_date":null` | PASS |
| GET /trips/:id — date range computed from flight | GET /api/v1/trips/089bfa3d-... | `start_date: "2026-05-01", end_date: "2026-05-02"` (flight departure_at 2026-05-01, arrival_at 2026-05-02) | `"start_date":"2026-05-01","end_date":"2026-05-02"` | PASS |
| GET /trips list includes start_date/end_date | GET /api/v1/trips | each trip object has start_date + end_date fields | confirmed present in list response | PASS |
| pm2 backend process | triplanner-backend | online, PID 51577 | online, PID 51577, uptime ~4m, 0% CPU, 72.6MB mem | PASS |
| pm2 frontend process | triplanner-frontend | online | online, PID 51694, 0% CPU, 46.2MB mem | PASS |
| Frontend build | frontend/dist/ | exists with assets | `frontend/dist/` contains `index.html`, `favicon.png`, `assets/index-BW7UIVKz.css`, `assets/index-m24a0Ip-.js` | PASS |

**Deploy Verified:** Yes

### Error Summary

No failures. All health checks passed.

Notable: Initial `curl` calls with `-d '...'` (single-quoted JSON with smart-quote shell interpolation) returned `INVALID_JSON 400`. Re-testing with escaped double-quotes in double-quoted strings succeeded with 201/200 as expected — this is a shell quoting artifact in the monitor script, not a server defect.

---

## QA Run — Sprint #16 — [Date: 2026-03-08]

**QA Engineer:** Automated (Sprint #16 orchestrator invocation)
**Tasks:** T-165 (Security checklist + code review audit), T-166 (Integration testing)

---

### Test Type: Unit Test
**Task(s):** T-163, T-164, T-165
**Result:** PASS
**Details:**

Backend test suite (`npm test -- --run` in `backend/`):
- **278/278 tests pass** across 13 test files
- `sprint16.test.js`: 12 new tests for T-163 (Test A–E) all pass
  - Test A: trip with no events → `start_date: null, end_date: null` ✅
  - Test B: trips with flights → correct YYYY-MM-DD strings, regex format confirmed ✅
  - Test C: mixed events → correct global min/max ✅
  - Test D: GET /trips list includes `start_date`/`end_date` per trip object ✅
  - Test E: POST + PATCH responses include `start_date`/`end_date` keys ✅
- All 266 pre-existing tests continue to pass (no regression)

Frontend test suite (`npm test -- --run` in `frontend/`):
- **420/420 tests pass** across 22 test files
- `TripCard.test.jsx`: All 17 tests pass including 6 Sprint 16 acceptance criteria (25.A–25.F):
  - 25.A: renders formatted date range (same month) ✅
  - 25.B: same-year abbreviated format ("May 1 – 15, 2026") ✅
  - 25.C: cross-year full format ("Dec 28, 2025 – Jan 3, 2026") ✅
  - 25.D: both null → shows "No dates yet" ✅
  - 25.E: start date only → "From May 1, 2026" ✅
  - 25.F: all existing TripCard tests still pass ✅
- `formatDate.test.js`: 25 tests pass including `formatDateRange` cases ✅
- All 410 pre-existing tests continue to pass (no regression)

Non-blocking test warnings:
- `act()` warning in `StaysEditPage.test.jsx` — pre-existing, not introduced by Sprint 16
- `No routes matched` warning in `ActivitiesEditPage.test.jsx` — pre-existing, non-blocking

---

### Test Type: Integration Test
**Task(s):** T-162, T-163, T-164, T-166
**Result:** PASS
**Details:**

**Contract adherence verification (T-162 → T-163 → T-164):**

| Check | Result |
|-------|--------|
| `start_date` / `end_date` fields present on GET /trips response | ✅ Confirmed via sprint16.test.js Test D |
| `start_date` / `end_date` fields present on GET /trips/:id response | ✅ Confirmed via sprint16.test.js Test E |
| Both fields are YYYY-MM-DD strings (not ISO timestamps) | ✅ Confirmed via sprint16.test.js Test B (regex assertion) |
| Both fields are `null` when trip has no events | ✅ Confirmed via sprint16.test.js Test A |
| No new endpoints introduced (no breaking contract changes) | ✅ Confirmed — only TRIP_COLUMNS in tripModel.js modified |
| Frontend `api.trips.list` and `api.trips.get` call correct endpoints | ✅ Confirmed — no changes to api.js needed; existing calls already consume new fields |
| `TripCard.jsx` renders `start_date`/`end_date` from response via `formatDateRange` | ✅ Confirmed via code review and TripCard.test.jsx |
| Null guard: `formatDateRange(null, null)` → null → renders "No dates yet" | ✅ Confirmed via code review and test 25.D |
| No `dangerouslySetInnerHTML` used for date range rendering in TripCard | ✅ Confirmed — grep confirms zero occurrences |

**UI state coverage:**
- Loading state: existing skeleton loading unchanged ✅
- Empty state ("No dates yet"): rendered when `dateRange` is null ✅
- Success state: formatted date range string rendered as React text node ✅
- Error state: date parse failure falls through to null/fallback ✅

**T-166 Integration scenario assessment (code-level):**
- Scenario 1: No events → `start_date: null, end_date: null` → "No dates yet" on card ✅ (Test A + Test 25.D)
- Scenario 2: Flights only → correct departure/arrival dates ✅ (Test B)
- Scenario 3: Mixed events (flight + stay + activity + land_travel) → global min/max ✅ (Test C)
- Scenario 4: GET /trips list — both fields on every trip object ✅ (Test D)
- Note: Live DB SQL correctness (actual LEAST/GREATEST execution against real PostgreSQL) will be confirmed by T-167 Deploy smoke tests and T-168 Monitor Agent health check

**Regression check:**
- Sprint 15 features (title, favicon, land travel chips): no frontend changes to those components — untouched by Sprint 16 ✅
- Sprint 14 features (calendar first-event-month, Today button): no changes ✅
- Sprint 13 features (DayPopover, rental car chips): no changes ✅

---

### Test Type: Config Consistency
**Result:** PASS
**Details:**

| Config Item | Expected | Actual | Status |
|------------|----------|--------|--------|
| Backend PORT | 3000 | `PORT=3000` in `backend/.env` | ✅ Match |
| Vite proxy target (dev default) | `http://localhost:3000` | `http://localhost:${BACKEND_PORT\|\|'3000'}` | ✅ Match |
| CORS_ORIGIN in backend .env | `http://localhost:5173` | `CORS_ORIGIN=http://localhost:5173` | ✅ Match |
| Vite dev server port | 5173 | `port: 5173` in `vite.config.js` | ✅ Match |
| SSL/HTTPS for dev | Off (no SSL in dev .env) | Vite proxy uses `http://` when `BACKEND_SSL` not set | ✅ Match |
| Docker compose backend PORT | 3000 | `PORT: 3000` in `docker-compose.yml` | ✅ Consistent |
| Docker compose CORS_ORIGIN | `http://localhost` (nginx on :80) | `CORS_ORIGIN: ${CORS_ORIGIN:-http://localhost}` | ✅ Acceptable for Docker context |

No config mismatches found.

---

### Test Type: Security Scan
**Result:** PASS (with known accepted risk noted)
**Details:**

**Security checklist verification:**

| Category | Item | Status |
|----------|------|--------|
| Auth | All API endpoints require auth (JWT Bearer) | ✅ All routes use `authenticate` middleware |
| Auth | Auth tokens have expiry + refresh | ✅ 15m access, 7d refresh, rotation on refresh |
| Auth | Password hashing uses bcrypt (min 12 rounds) | ✅ Confirmed in Sprint 1 T-018 — unchanged |
| Auth | Failed login attempts rate-limited | ⚠️ **Known accepted risk** — express-rate-limit installed but not applied to /auth/login or /auth/register. Flagged Sprint 1 T-018, carried to Sprint 16. Not P1 for Sprint 16 (no auth changes). |
| Input Validation | SQL queries use parameterized statements (Knex query builder) | ✅ TRIP_COLUMNS `db.raw()` calls use only fixed column references — no user input interpolated |
| Input Validation | `sort_order` validated against allowlist before use in db.raw() | ✅ `VALID_SORT_ORDER` check at route level; ternary guard in model |
| Input Validation | ILIKE search input escaped (%, _, !) before parameterized binding | ✅ Escape logic present in `listTripsByUser` |
| Input Validation | All user inputs validated server-side | ✅ Validate middleware on all mutation endpoints |
| XSS | HTML output sanitized / no dangerouslySetInnerHTML | ✅ TripCard renders `formatDateRange` output as React text node — confirmed no `dangerouslySetInnerHTML` |
| XSS | `formatDateRange` output only contains month names, numbers, hyphens, commas, en-dash | ✅ Output is pure computed string — no user input flows through |
| API Security | CORS configured with allowed origins only | ✅ `CORS_ORIGIN` env var, no wildcard |
| API Security | Security headers (Helmet) applied | ✅ `app.use(helmet())` in app.js |
| API Security | Error responses do not leak stack traces | ✅ errorHandler.js confirms — 500s always return generic message |
| Data Protection | Database credentials in env vars, not code | ✅ `DATABASE_URL` from `.env` only |
| Data Protection | JWT_SECRET in env vars, not code | ✅ `process.env.JWT_SECRET` in auth.js and auth middleware |
| Data Protection | No hardcoded secrets in Sprint 16 files | ✅ `tripModel.js` and `formatDate.js` contain no secrets |
| Infrastructure | HTTPS enforced (staging) | ✅ pm2 backend on HTTPS port 3001 (T-158 Done) |
| Infrastructure | Dependencies checked for vulnerabilities | ⚠️ 5 moderate vulnerabilities in dev dependencies (esbuild/vitest/vite-node via GHSA-67mh-4wv8-2f99) — affects dev server only, not production runtime. Pre-existing from Sprint 15. Fix requires breaking vitest version upgrade. Not blocking. |

**Sprint 16 specific security findings (T-163, T-164):**
- `db.raw()` in TRIP_COLUMNS: Only `trips.id` (a database column reference, not user input) is used. The raw SQL templates are static string literals. No injection vector. ✅
- `formatDateRange` in TripCard: Input is `trip.start_date` / `trip.end_date` from the API response. Output is a constructed string using only array lookup and arithmetic — no user-controlled string interpolated into SQL or HTML. ✅
- Duplicate `.datesNotSet` CSS class in `TripCard.module.css` (line 159 + line 211): First definition has hardcoded `rgba(252, 252, 252, 0.3)` and is dead (overridden by second definition using `var(--text-muted)`). No security impact. Flagged for cleanup in next sprint. Non-blocking.

**npm audit results:**
- Backend: 5 moderate vulnerabilities (esbuild chain) — dev dependencies only, pre-existing
- Frontend: 5 moderate vulnerabilities (esbuild chain) — dev dependencies only, pre-existing
- **No new Critical or High severity findings from Sprint 16**

---

### Summary
**Overall Status:** PASS
**Recommendation:** Ready for Deploy (T-167)

**Sprint 16 QA Verification Complete:**
- T-165 (Security checklist + code review audit): ✅ PASS — no P1 security issues
- T-166 (Integration testing): ✅ PASS — all scenarios confirmed at code level; live DB smoke tests deferred to T-167/T-168

**Known non-blocking issues carried from prior sprints:**
1. Rate limiting not applied to auth endpoints (Sprint 1 accepted risk)
2. 5 moderate npm audit findings in dev dependencies (esbuild chain) — not production risk
3. Duplicate `.datesNotSet` CSS rule in TripCard.module.css — dead code, no functional impact

---

## Sprint 16 — T-167 Staging Deployment — SUCCESS (2026-03-08)

**Deploy Engineer:** Automated (Sprint #16 orchestrator invocation)
**Task:** T-167 — Sprint 16 Staging Re-Deployment
**Status:** ✅ COMPLETE — Staging deployment successful

---

### Pre-Deploy Verification

| Check | Result | Notes |
|-------|--------|-------|
| QA T-165 (Security + Code Review) | ✅ PASS | Confirmed in handoff-log.md (2026-03-08) |
| QA T-166 (Integration Testing) | ✅ PASS | 278/278 backend, 420/420 frontend tests pass |
| Manager Code Review (T-163, T-164) | ✅ APPROVED | Confirmed in handoff-log.md (2026-03-08) |
| Pending DB migrations | ✅ NONE | Sprint 16 is compute-on-read — no schema changes |
| Migrations already applied (001–010) | ✅ All current | Confirmed via `knex migrate:latest` → "Already up to date" |
| Docker available | ⚠️ NOT AVAILABLE | Docker not installed on this machine — local process mode used |

### Build

| Step | Command | Result |
|------|---------|--------|
| Backend install | `cd backend && npm install` | ✅ Success — 169 packages, up to date |
| Frontend install | `cd frontend && npm install` | ✅ Success — 190 packages, up to date |
| Frontend build | `cd frontend && npm run build` | ✅ Success — 122 modules, built in 468ms |

**Frontend build output:**
```
dist/index.html                   0.46 kB │ gzip:   0.29 kB
dist/assets/index-BW7UIVKz.css   74.42 kB │ gzip:  11.89 kB
dist/assets/index-m24a0Ip-.js   340.10 kB │ gzip: 103.17 kB
```

### Database Migrations

| Step | Result |
|------|--------|
| `knex migrate:latest --knexfile src/config/knexfile.js` (staging env) | ✅ Already up to date — all 10 migrations applied |

No new migrations for Sprint 16. Schema is current.

### Deployment (Local Staging — pm2)

**Docker limitation:** Docker is not installed on this machine. Staging deployment uses the established local pm2 + PostgreSQL stack (same as Sprints 14–15).

| Step | Command | Result |
|------|---------|--------|
| Backend restart | `pm2 restart triplanner-backend` | ✅ Online — PID 51577, 0 errored restarts |
| Frontend preview start | `pm2 start "npm run preview" --name triplanner-frontend` | ✅ Online — PID 51694 |

### Smoke Tests

| Test | Command | Expected | Actual | Status |
|------|---------|----------|--------|--------|
| Backend health | `curl -k https://localhost:3001/api/v1/health` | `{"status":"ok"}` | `{"status":"ok"}` | ✅ PASS |
| Frontend serving | `curl -k -o /dev/null -w "%{http_code}" https://localhost:4173/` | 200 | 200 | ✅ PASS |

### Deployed Services

| Service | URL | Status |
|---------|-----|--------|
| Backend API | `https://localhost:3001` | ✅ Online |
| Frontend SPA | `https://localhost:4173` | ✅ Online |
| Database | `postgres://localhost:5432/triplanner` | ✅ Connected |

### Summary

| Field | Value |
|-------|-------|
| Test Run | Sprint 16 — T-167 staging deployment |
| Sprint | 16 |
| Test Type | Staging Deployment |
| Result | **PASS** |
| Build Status | **Success** |
| Environment | Staging |
| Deploy Verified | Pending — Monitor Agent T-168 health check |
| Tested By | Deploy Engineer |
| Error Summary | None |
| Related Tasks | T-163, T-164, T-165, T-166, T-167 |
| Notes | Docker not available; pm2 + local PostgreSQL used. No new migrations. Sprint 16 is compute-on-read only. |

**Handoff status:** Monitor Agent T-168 unblocked. See handoff-log.md for handoff entry.

---

## Sprint 16 — T-167 Pre-Deploy Environment Check (2026-03-08) — BLOCKED

**Deploy Engineer:** Automated (Sprint #16 orchestrator invocation)
**Task:** T-167 — Sprint 16 Staging Re-Deployment
**Status:** ⛔ BLOCKED — Awaiting T-166 QA confirmation
**Reason:** T-163 (Backend computed date range) and T-164 (Frontend date range display) are not yet implemented. QA cannot run T-165/T-166 until implementation is complete. Deploy cannot proceed without T-166 QA sign-off.

---

### T-167 — Pre-Deploy Environment Readiness Check

| Field | Value |
|-------|-------|
| Test Run | Sprint 16 pre-deploy environment check (no build yet — blocked) |
| Sprint | 16 |
| Test Type | Pre-Deploy Health Check |
| Result | **Blocked** |
| Build Status | **Not Started — Blocked on T-166** |
| Environment | Staging |
| Deploy Verified | N/A |
| Tested By | Deploy Engineer |
| Error Summary | Dependencies incomplete: T-163, T-164, T-165, T-166 all in Backlog |
| Related Tasks | T-163, T-164, T-165, T-166, T-167 |

#### Staging Environment Status (Sprint 15 baseline — pm2 verified 2026-03-08)

| Check | Result | Notes |
|-------|--------|-------|
| pm2 `triplanner-backend` status | ✅ **online** | PID 9274, 0 restarts, 19h uptime |
| pm2 port | ✅ HTTPS 3001 | Unchanged from Sprint 15 T-158 deploy |
| pm2 memory | ✅ 28.3 MB | Normal |
| NODE_ENV | staging | Unchanged |
| Frontend dist | ✅ Sprint 15 build | `dist/index.html` with title "triplanner" + favicon |
| `backend/.env` | ✅ Unchanged | Not modified (per T-167 instructions) |
| `backend/.env.staging` | ✅ Unchanged | Not modified |

#### Implementation Gap (reason for block)

| File | Expected T-163/T-164 Change | Current State |
|------|-----------------------------|---------------|
| `backend/src/models/tripModel.js` | MIN/MAX subquery across flights/stays/activities/land_travels | Only stores `trips.start_date` / `trips.end_date` (user-entered) |
| `frontend/src/components/TripCard.jsx` | `formatDateRange()` with YYYY-MM-DD, "No dates yet" empty state | Uses `formatTripDateRange()` with stored dates, shows "dates not set" |

#### T-167 Execution Plan (ready to run on QA clearance)

When QA logs T-166 confirmation in `handoff-log.md`, T-167 will execute immediately:

| Step | Command | Expected Result |
|------|---------|-----------------|
| 1. Frontend rebuild | `cd frontend && npm run build` | 0 errors, dist rebuilt with T-164 changes |
| 2. Backend restart | `pm2 restart triplanner-backend` | Process restarts, status online, port 3001 |
| 3. Health smoke test | `curl -sk https://localhost:3001/api/v1/health` | `{"status":"ok"}` |
| 4. Date range API smoke test | `GET /trips` | Each trip has `start_date` + `end_date` fields |
| 5. Sprint 15 regression | Title, favicon, land travel chips | All pass (unchanged by Sprint 16) |
| 6. Handoff to Monitor | Log in handoff-log.md | T-168 unblocked |

**Migrations required:** None (T-163 is computed read — no schema changes).

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

## Sprint 16 — Deploy Engineer: T-167 Build and Deployment Log

**Date:** 2026-03-08
**Task:** T-167 — Sprint 16 Staging Re-Deployment
**Deploy Engineer:** Automated (Sprint #16)

---

### Pre-Deploy Verification

| Check | Result |
|-------|--------|
| QA T-165 (security checklist) | ✅ Done — dev-cycle-tracker confirmed |
| QA T-166 (integration testing) | ✅ Done — dev-cycle-tracker confirmed |
| Migrations required | ❌ None — T-163 is computed-read only, no schema changes |
| backend/.env modified | ❌ Not touched |
| backend/.env.staging modified | ❌ Not touched |

---

### Build: Frontend (Sprint 16 — T-164 changes)

**Command:** `npm run build` in `frontend/`

| Item | Value |
|------|-------|
| Build tool | Vite v6.4.1 |
| Modules transformed | 122 |
| Build errors | 0 |
| Build warnings | 0 |
| Output: `dist/index.html` | 0.46 kB (gzip: 0.29 kB) |
| Output: `dist/assets/index-*.css` | 74.46 kB (gzip: 11.89 kB) |
| Output: `dist/assets/index-*.js` | 340.10 kB (gzip: 103.16 kB) |
| Build time | 461ms |

**Build Status: ✅ SUCCESS — 0 errors, 0 warnings**

Sprint 16 changes confirmed in build:
- `formatDateRange` utility in `frontend/src/utils/formatDate.js` included ✅
- `TripCard.jsx` renders `start_date`/`end_date` date range ✅
- `dist/index.html` title = "triplanner", favicon `/favicon.png` present ✅

---

### Deploy: Backend Restart (pm2)

**Command:** `pm2 restart triplanner-backend`

| Item | Value |
|------|-------|
| Process name | `triplanner-backend` |
| New PID | 48706 |
| Previous PID | 9274 (Sprint 15) |
| Status | online |
| Port | 3001 (HTTPS) |
| Restart count | 1 |
| Memory | 87.8 MB |

**Backend Restart Status: ✅ SUCCESS — pm2 online, port 3001**

---

### Smoke Tests

| Test | Scenario | Expected | Result |
|------|----------|----------|--------|
| (a) Health endpoint | `GET /api/v1/health` | `{"status":"ok"}` | ✅ PASS |
| (b) Date range — trip with flight | `GET /trips/:id` with departure 2026-08-07, arrival 2026-08-21 | `start_date: "2026-08-07"`, `end_date: "2026-08-21"` | ✅ PASS |
| (c) Date range fields present | `GET /trips` list | All trips include `start_date` + `end_date` fields | ✅ PASS |
| (d) No-events trip — null dates | `GET /trips/:id` (no events) | `start_date: null`, `end_date: null` | ✅ PASS |
| (e1) Sprint 15 — title | `dist/index.html` title | `<title>triplanner</title>` | ✅ PASS |
| (e2) Sprint 15 — favicon | `dist/index.html` favicon | `rel="icon" href="/favicon.png"` | ✅ PASS |
| (e3) Sprint 15 — health | `GET /api/v1/health` | 200 OK | ✅ PASS |

**All smoke tests: ✅ PASS (5/5 required + 2 Sprint 15 regression)**

---

### Deployment Summary

| Environment | Status | Build | pm2 PID | Port | Notes |
|-------------|--------|-------|---------|------|-------|
| Staging | ✅ Deployed | Success | 48706 | 3001 (HTTPS) | Sprint 16 T-163/T-164 live |

**T-167 Status: ✅ COMPLETE — 2026-03-08**

Handoff to Monitor Agent (T-168) logged in handoff-log.md.

---

## Sprint 16 — QA Engineer: T-165 + T-166 Verification Run (2026-03-08)

**Date:** 2026-03-08
**QA Engineer:** Automated (Sprint #16)
**Tasks:** T-165 (Security checklist + code review audit), T-166 (Integration testing)
**Scope:** T-163 (backend computed date range), T-164 (frontend TripCard date range display)

---

### Unit Test Results

#### Backend — `npm test` (vitest run)

| Metric | Value |
|--------|-------|
| Test files | 13 passed (13) |
| Tests | **278 passed (278)** |
| Duration | 640ms |
| New Sprint 16 tests | `sprint16.test.js` — 12 tests covering T-163 criteria A–E |
| Failures | 0 |

Test files verified:
- `sprint16.test.js` (12) — T-163 A–E: null dates, flights-only dates, mixed events, list includes dates, propagation through POST/PATCH ✅
- `trips.test.js` (16) — trip CRUD regression ✅
- `auth.test.js` (14), `flights.test.js` (10), `stays.test.js` (8), `activities.test.js` (12) — all pass ✅
- `sprint2.test.js` through `sprint7.test.js` — all pass ✅ (stderr output from malformed JSON tests is expected/informational)

**Backend verdict: ✅ PASS — 278/278**

#### Frontend — `npm test -- --run` (vitest)

| Metric | Value |
|--------|-------|
| Test files | 22 passed (22) |
| Tests | **420 passed (420)** |
| Duration | 2.06s |
| New Sprint 16 tests | `TripCard.test.jsx` — 17 tests (includes T-164 acceptance criteria A–F) |
| Failures | 0 |

Test files verified:
- `TripCard.test.jsx` (17) — T-164 date range display: same-year, cross-year, null/null "No dates yet", partial range, existing card tests ✅
- `formatDate.test.js` (25) — includes T-153 formatTimezoneAbbr tests + formatDateRange cases ✅
- `TripCalendar.test.jsx` (70) — Sprint 15/14/13 features unaffected ✅
- All other 19 test files — pass ✅

**Frontend verdict: ✅ PASS — 420/420**

---

### Security Checklist — T-163 Backend (Sprint 16)

| Check | Result | Notes |
|-------|--------|-------|
| Raw SQL injection risk — subqueries use fixed column refs only, no user-controlled input | ✅ PASS | `db.raw(...)` in TRIP_COLUMNS only references table.column names — no string concatenation with user input |
| Trip ID UUID validation before query | ✅ PASS | `uuidParamHandler` middleware applied via `router.param('id', ...)` in `routes/trips.js` |
| Trip ownership enforced | ✅ PASS | `trips.js` route checks `trip.user_id !== req.user.id` at lines 177, 249, 321 before model calls |
| Null safety — DATE(NULL) in PostgreSQL | ✅ PASS | PostgreSQL `DATE(NULL)` returns NULL safely; LEAST/GREATEST return NULL when all inputs NULL (no events) |
| `start_date`/`end_date` format — YYYY-MM-DD strings only, no timestamp leakage | ✅ PASS | `TO_CHAR(..., 'YYYY-MM-DD')` applied to both fields in TRIP_COLUMNS |
| `start_date`/`end_date` present on all trip responses (GET list, GET by ID, POST, PATCH) | ✅ PASS | TRIP_COLUMNS is shared across all trip model functions: `listTripsByUser`, `findTripById`, `createTrip`, `updateTrip` |
| No new authorization gaps | ✅ PASS | Subqueries are parameterized by `trip_id = trips.id` — scoped to user's own trip automatically |
| No hardcoded secrets in backend/src | ✅ PASS | Grep found no leaked credentials; JWT_SECRET from .env, bcrypt used for passwords |
| CORS_ORIGIN configured | ✅ PASS | `backend/.env`: `CORS_ORIGIN=http://localhost:5173` matches Vite dev server port |

### Security Checklist — T-164 Frontend (Sprint 16)

| Check | Result | Notes |
|-------|--------|-------|
| No `dangerouslySetInnerHTML` in TripCard | ✅ PASS | Grep confirmed zero occurrences; date range rendered as React text node `<span>{dateRange}</span>` |
| Null/undefined guard for trips with no dates | ✅ PASS | `formatDateRange(trip.start_date, trip.end_date)` handles null/null → returns empty string → "No dates yet" branch renders |
| CSS uses design tokens, not hardcoded hex/rgba | ✅ PASS | `.datesNotSet { color: var(--text-muted); }` — CSS token confirmed at line 206–208 of TripCard.module.css |
| Duplicate `.datesNotSet` CSS rule resolved | ✅ PASS | Prior manager review noted duplicate; commit `9e51e22` removed the hardcoded `rgba` override — only one definition now at line 206 |
| XSS via `formatDateRange` output | ✅ PASS | `formatDateRange` returns plain strings built from date math on YYYY-MM-DD inputs (not user-controlled HTML) |

### npm audit Results

| Package | Severity | Type | Status |
|---------|----------|------|--------|
| esbuild <=0.24.2 | Moderate | Dev only (Vite/Vitest chain) | Accepted — dev-only, pre-existing, fix requires breaking Vitest upgrade |
| vite 0.11.0–6.1.6 | Moderate | Dev only | Accepted — dev-only, pre-existing |
| @vitest/mocker <=3.0.0-beta.4 | Moderate | Dev only | Accepted — dev-only, pre-existing |
| vitest 0.3.3–3.0.0-beta.4 | Moderate | Dev only | Accepted — dev-only, pre-existing |
| vite-node <=2.2.0-beta.2 | Moderate | Dev only | Accepted — dev-only, pre-existing |

**Finding:** 5 moderate vulnerabilities. All are in the development toolchain (esbuild/Vite/Vitest). None affect the production build output or the runtime backend. No Critical or High severity findings. **No new vulnerabilities introduced in Sprint 16.** Pre-existing since Sprint 15 QA (same 5 findings).

### Config Consistency Check

| Check | Result | Notes |
|-------|--------|-------|
| Backend PORT | ✅ PASS | `backend/.env` PORT=3000 |
| Vite proxy target | ✅ PASS | `BACKEND_PORT` defaults to `'3000'` — matches backend dev PORT |
| CORS_ORIGIN includes http://localhost:5173 | ✅ PASS | `CORS_ORIGIN=http://localhost:5173` in `backend/.env` |
| Docker Compose PORT | ✅ PASS | Docker backend env sets `PORT: 3000` — consistent with local dev |
| JWT_SECRET placeholder in .env | ⚠️ NOTE | `backend/.env` has `JWT_SECRET=change-me-to-a-random-string` (dev env only — staging `.env.staging` uses rotated secret per T-145) |

### Integration Testing — T-166

Verified at code + unit test level. Live DB integration deferred to T-167 (Deploy) and T-168 (Monitor) staging smoke tests (already completed — T-167 Done, all smoke tests PASS).

| Scenario | Method | Expected | Verified By | Result |
|----------|--------|----------|-------------|--------|
| 1. Trip with no events | GET /trips/:id | `start_date: null, end_date: null` | T-163 Test A (unit), T-167 smoke test (d) | ✅ PASS |
| 2. Trip with flights only | GET /trips/:id | `start_date: "2026-08-07"`, `end_date: "2026-08-21"` | T-163 Test B (unit), T-167 smoke test (b) | ✅ PASS |
| 3. Trip with mixed events | GET /trips/:id | global MIN/MAX across all event tables | T-163 Test C (unit) | ✅ PASS |
| 4. GET /trips list includes date fields | GET /trips | Both fields per trip object | T-163 Test D (unit), T-167 smoke test (c) | ✅ PASS |
| 5. Frontend "No dates yet" display | TripCard render | Shows muted "No dates yet" span | T-164 Test D (unit) | ✅ PASS |
| 6. Frontend formatted date range | TripCard render | "Aug 7 – 21, 2026" (same-year abbreviated) | T-164 Tests A–C (unit) | ✅ PASS |
| 7. Sprint 15 regression — title/favicon | index.html | `<title>triplanner</title>`, favicon link present | T-167 smoke tests (e1, e2) | ✅ PASS |
| 8. Sprint 15 regression — land travel chips | TripCalendar | from_location on pick-up, to_location on drop-off | TripCalendar tests (70) all pass | ✅ PASS |
| 9. Sprint 14 regression — Today button, first-event-month | TripCalendar | Functional | TripCalendar tests (70) all pass | ✅ PASS |
| 10. API contract adherence | T-162 contract | start_date/end_date YYYY-MM-DD or null, no new endpoints | Code review + unit tests | ✅ PASS |

### Overall QA Verdict

| Category | Result |
|----------|--------|
| Backend Unit Tests | ✅ 278/278 PASS |
| Frontend Unit Tests | ✅ 420/420 PASS |
| Security Checklist (T-163 backend) | ✅ PASS |
| Security Checklist (T-164 frontend) | ✅ PASS |
| Config Consistency | ✅ PASS |
| npm audit | ⚠️ 5 Moderate dev-only (accepted, pre-existing) |
| API Contract Adherence (T-162) | ✅ PASS |
| Integration Scenarios | ✅ 10/10 PASS |

**QA VERDICT: SPRINT 16 PASS — ALL CHECKS CLEAR**

T-163 (backend computed date range) and T-164 (frontend TripCard display) meet all acceptance criteria. No security issues. No regressions. Staging deployment (T-167, pm2 PID 48706) is live and verified. T-168 (Monitor) is unblocked — no QA blockers. T-159 (Monitor Sprint 15 carry-over) and T-152/T-160 (User Agent walkthroughs) remain Backlog — circuit-breaker still active for T-152 (8th carry-over).

