# QA & Build Log

Tracks test runs, build results, and post-deploy health checks per sprint. Maintained by QA Engineer, Deploy Engineer, and Monitor Agent.

---

## Sprint #17 — T-175 Pre-Deploy Gate Check
**Date:** 2026-03-08
**Environment:** Staging (pre-deploy check only — no deploy attempted)
**Performed by:** Deploy Engineer

### Pre-Deploy Gate Status

| Gate | Status | Notes |
|------|--------|-------|
| QA confirmation in handoff-log.md | ❌ MISSING | No T-173 or T-174 completion entries found |
| T-170 (Frontend code cleanup) | ❌ NOT DONE | `opacity: 0.5` still in `TripCard.module.css:208`; `formatTripDateRange` still in `formatDate.js:227` |
| T-172 (Sprint 17 print/export) | ❌ NOT DONE | Tracker shows Backlog; Sprint 17 build phase not committed |
| T-173 (QA security checklist) | ❌ NOT DONE | Backlog |
| T-174 (QA integration testing) | ❌ NOT DONE | Backlog |

### pm2 Status Check

| Process | PID | Uptime | Status |
|---------|-----|--------|--------|
| triplanner-backend | 51577 | 84m | ✅ Online |
| triplanner-frontend | 51694 | 83m | ✅ Online |

Backend is healthy from Sprint 16 deployment (T-167). No action taken.

### Build Status

**BLOCKED — No build attempted.** Prerequisite gates (T-170, T-172, T-173, T-174) are not complete. Per rules.md, a deploy without QA confirmation is prohibited.

### Next Steps

Waiting for: T-170 → T-172 → T-173 → T-174 to complete. Deploy Engineer will execute T-175 (frontend rebuild + smoke tests) immediately upon receiving QA handoff confirmation.

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

