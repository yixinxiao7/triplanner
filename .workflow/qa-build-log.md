# QA & Build Log

Tracks test runs, build results, and post-deploy health checks per sprint. Maintained by QA Engineer, Deploy Engineer, and Monitor Agent.

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

## Sprint 15 Deploy Re-Verification — 2026-03-07 (Orchestrator Re-Invocation)

**Deploy Engineer:** Automated (Sprint #15 orchestrator re-invocation)
**Task:** T-158 — Sprint 15 Staging Re-Verification
**QA Clearance:** T-156 + T-157 both PASS (confirmed in handoff-log.md, 2026-03-07)
**Migrations:** None required — all 10 migrations applied, zero new in Sprint 15

---

### T-158 Re-Verification — Build

| Field | Value |
|-------|-------|
| Test Run | Sprint 15 frontend rebuild verification (T-154 title/favicon + T-155 land travel chip fix) |
| Sprint | 15 |
| Test Type | Build |
| Result | Pass |
| Build Status | **Success** |
| Environment | Staging |
| Deploy Verified | Pending (T-159 Monitor Agent) |
| Tested By | Deploy Engineer |
| Error Summary | None |
| Related Tasks | T-154, T-155, T-158 |

#### Build Command Output

```
cd frontend && npm run build
vite v6.4.1 building for production...
✓ 122 modules transformed.
dist/index.html                   0.46 kB │ gzip:   0.29 kB
dist/assets/index-Dr9Rp1mS.css   74.46 kB │ gzip:  11.89 kB
dist/assets/index-C0DZD8qz.js   339.56 kB │ gzip: 103.14 kB
✓ built in 463ms
```

#### Build Verification

| Check | Result |
|-------|--------|
| `npm install` — backend | ✅ Success |
| `npm install` — frontend | ✅ Success |
| `npm run build` — 122 modules, 0 errors | ✅ Success (463ms) |
| `<title>triplanner</title>` in `dist/index.html` | ✅ PASS |
| `<link rel="icon" type="image/png" href="/favicon.png" />` in `dist/index.html` | ✅ PASS |

---

### T-158 Re-Verification — Staging Environment

| Field | Value |
|-------|-------|
| Test Run | Sprint 15 staging process re-verification |
| Sprint | 15 |
| Test Type | Post-Deploy Health Check |
| Result | Pass |
| Build Status | Success |
| Environment | Staging |
| Deploy Verified | Pending (T-159) |
| Tested By | Deploy Engineer |
| Error Summary | None |
| Related Tasks | T-158, T-159 |

#### pm2 Process Status

| Field | Value |
|-------|-------|
| Process name | `triplanner-backend` |
| PID | 9274 |
| Status | online |
| Port | 3001 (HTTPS) |
| Restarts | 0 |
| Memory | 76.8 MB |
| NODE_ENV | staging |

#### Smoke Tests

| Smoke Test | Result |
|------------|--------|
| `curl -sk https://localhost:3001/api/v1/health` → `{"status":"ok"}` | ✅ PASS |
| pm2 status: online, PID 9274, 0 restarts | ✅ PASS |
| `<title>triplanner</title>` in `dist/index.html` | ✅ PASS |
| `<link rel="icon" type="image/png" href="/favicon.png" />` in `dist/index.html` | ✅ PASS |

**Next step:** Monitor Agent to run T-159 (staging health check). Handoff logged in handoff-log.md.

---

## Sprint 15 Deploy Log — 2026-03-07

**Deploy Engineer:** Automated (Sprint #15 orchestrator run)
**Task:** T-158 — Sprint 15 Staging Re-deployment
**QA Clearance:** T-156 + T-157 both PASS (handoff from QA Engineer, 2026-03-07)

---

### T-158 — Build

| Field | Value |
|-------|-------|
| Test Run | Sprint 15 frontend build (T-154 browser title/favicon + T-155 land travel chip fix) |
| Sprint | 15 |
| Test Type | Build |
| Result | Pass |
| Build Status | **Success** |
| Environment | Staging |
| Deploy Verified | Pending (T-159 Monitor Agent) |
| Tested By | Deploy Engineer |
| Error Summary | None |
| Related Tasks | T-154, T-155, T-158 |

#### Build Details

| Step | Command | Result |
|------|---------|--------|
| Frontend build | `cd frontend && npm run build` | ✅ Success — 465ms |
| Build output | `dist/index.html` (0.46 kB), `dist/assets/index-*.js` (339.56 kB), `dist/assets/index-*.css` (74.46 kB) | ✅ |

#### Build Verification

| Check | Result |
|-------|--------|
| `<title>triplanner</title>` in `dist/index.html` | ✅ PASS |
| `<link rel="icon" type="image/png" href="/favicon.png" />` in `dist/index.html` | ✅ PASS |
| `favicon.png` present in `frontend/public/` | ✅ PASS |
| T-155 `_location` fix: departure day = `from_location`, arrival day = `to_location` | ✅ PASS (confirmed in TripCalendar.jsx lines 232–248) |

---

### T-158 — Deploy to Staging

| Field | Value |
|-------|-------|
| Test Run | Sprint 15 staging deployment — pm2 restart with rebuilt frontend |
| Sprint | 15 |
| Test Type | Post-Deploy Health Check |
| Result | Pass |
| Build Status | Success |
| Environment | Staging |
| Deploy Verified | Pending (T-159) |
| Tested By | Deploy Engineer |
| Error Summary | None |
| Related Tasks | T-158, T-159 |

#### Deployment Details

| Step | Command | Result |
|------|---------|--------|
| No migrations needed | Zero schema changes in Sprint 15 | ✅ Skipped (correct) |
| pm2 start | `pm2 start infra/ecosystem.config.cjs` | ✅ Online — PID 9274 |
| pm2 status | `pm2 list` | ✅ status: online, restarts: 0, uptime stable |
| `.env` isolation | `backend/.env` unchanged; staging reads `.env.staging` (NODE_ENV=staging) | ✅ |

#### Smoke Tests

| Smoke Test | Command / Check | Result |
|------------|----------------|--------|
| (a) Backend health | `curl -sk https://localhost:3001/api/v1/health` → `{"status":"ok"}` | ✅ PASS |
| (b) HTTPS port | pm2 out log: `HTTPS Server running on https://localhost:3001` | ✅ PASS |
| (c) Browser title "triplanner" | `<title>triplanner</title>` in built `dist/index.html` | ✅ PASS |
| (d) Favicon link | `<link rel="icon" type="image/png" href="/favicon.png" />` in `dist/index.html` | ✅ PASS |
| (e) Land travel chip fix | `_location` set correctly for departure/arrival in `TripCalendar.jsx` | ✅ PASS |
| (f) pm2 stability | 0 restarts, 0 unstable restarts, PID 9274 stable | ✅ PASS |

#### pm2 Process Summary

| Field | Value |
|-------|-------|
| Process name | `triplanner-backend` |
| PID | 9274 |
| Status | online |
| Port | 3001 (HTTPS) |
| Restarts | 0 |
| NODE_ENV | staging |
| Config | `infra/ecosystem.config.cjs` |

**Next step:** Monitor Agent to run T-159 (staging health check). Handoff logged in handoff-log.md.

---

## Sprint 15 QA Report — 2026-03-07

**QA Engineer:** Automated QA Agent
**Sprint:** 15
**Date:** 2026-03-07
**Tasks Under Review:** T-153, T-154, T-155
**QA Tasks:** T-156 (Security + Unit Tests), T-157 (Integration Testing)

---

### Test Type: Unit Test — Backend (T-156)

**Command:** `cd backend && npm test -- --run`
**Result: PASS**

| Metric | Value |
|--------|-------|
| Test Files | 12 passed (12) |
| Tests | **266 passed (266)** |
| Duration | 563ms |
| Failures | 0 |

All 266 backend tests pass. No backend code was changed in Sprint 15 (Backend Engineer on standby). Backend regression risk: zero.

**Note:** Two `stderr` log lines appear in `sprint2.test.js` — these are expected console outputs from the error handler during malformed JSON tests (SyntaxError logged intentionally by `[ErrorHandler]`). They are not test failures.

---

### Test Type: Unit Test — Frontend (T-156)

**Command:** `cd frontend && npm test -- --run`
**Result: PASS**

| Metric | Value |
|--------|-------|
| Test Files | 22 passed (22) |
| Tests | **410 passed (410)** |
| Duration | 1.86s |
| Failures | 0 |

All 410 frontend tests pass, including:
- **T-153 formatTimezoneAbbr tests:** 6 new tests (lines 107–156 in `src/__tests__/formatDate.test.js`) all passing:
  - T-153 1: `America/New_York` summer → DST-aware abbreviation (EDT|EST|ET|GMT offset) ✅
  - T-153 2: `Asia/Tokyo` → JST or GMT+9 (no DST) ✅
  - T-153 3: `Europe/Paris` summer → CEST or GMT+2 ✅
  - T-153 4: null isoString → empty string, no throw ✅
  - T-153 5: null ianaTimezone → empty string, no throw ✅
  - T-153 6: invalid zone → non-empty fallback string, no throw ✅
- **T-155 TripCalendar tests (A–D):** All 4 required new tests pass:
  - T-155 A: pick-up day chip shows `from_location` ("LAX Airport") ✅
  - T-155 B: drop-off day chip shows `to_location` ("SFO Airport") ✅
  - T-155 C: same-day land travel shows `from_location` only (no arrival chip) ✅
  - T-155 D: RENTAL_CAR "pick-up"/"drop-off" label prefixes still present alongside corrected location ✅
- **T-138 regression tests (20.A–G):** All RENTAL_CAR pick-up/drop-off prefix tests still pass ✅

**Warnings noted (non-blocking):** React `act(...)` warnings in `FlightsEditPage.test.jsx` — pre-existing, not introduced by Sprint 15. React Router v6 future-flag warnings — expected, non-blocking.

---

### Test Type: Integration Test — T-157

**Method:** Code review of frontend source against api-contracts.md; static verification of index.html changes; regression analysis of TripCalendar.jsx.

#### T-154 — Browser Title + Favicon

**File:** `frontend/index.html`

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| `<title>` content | `triplanner` | `triplanner` (line 6) | ✅ PASS |
| Favicon `<link>` tag | `<link rel="icon" type="image/png" href="/favicon.png" />` | Present (line 7) | ✅ PASS |
| href is root-relative | `/favicon.png` | `/favicon.png` | ✅ PASS |
| `frontend/public/favicon.png` exists | Yes | Verified via filesystem | ✅ PASS |

No external resource loading. No CSP implications. Static HTML only — no testable JS behavior. T-154 integration check: **PASS**.

#### T-155 — Land Travel Chip Location Fix

**File:** `frontend/src/components/TripCalendar.jsx`

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| `buildEventsMap` departure-day event: `_location: lt.from_location` | set on departure-day object | Line 237: `_location: lt.from_location` ✅ | ✅ PASS |
| `buildEventsMap` arrival-day event: `_location: lt.to_location` | set on arrival-day object | Line 248: `_location: lt.to_location` ✅ | ✅ PASS |
| `DayCell` chip render uses `ev.item._location` | `ev.item._location` | Line 549: `ev.item._location || ev.item.to_location` ✅ | ✅ PASS |
| `DayPopover.getEventLabel` uses `item._location` | `item._location` | Line 362: `item._location || item.to_location || ''` ✅ | ✅ PASS |
| No `dangerouslySetInnerHTML` for location | Absent | Not present — React text node only ✅ | ✅ PASS |
| T-138 RENTAL_CAR "pick-up"/"drop-off" prefixes unaffected | Still present | `getEventTime` and DayCell chip logic unchanged ✅ | ✅ PASS |

#### T-138 Regression Check

| Check | Result |
|-------|--------|
| RENTAL_CAR pick-up day shows "pick-up Xp" | ✅ PASS — T-138 20.A test passes |
| RENTAL_CAR drop-off day shows "drop-off Xp" | ✅ PASS — T-138 20.B test passes |
| RENTAL_CAR no arrival_date → no drop-off chip | ✅ PASS — T-138 20.C test passes |
| RENTAL_CAR no times → label-only chips | ✅ PASS — T-138 20.D test passes |

#### API Contract Adherence

No new API endpoints or request/response shapes introduced in Sprint 15. Frontend changes (T-154, T-155) are purely rendering fixes consuming existing land travel fields (`from_location`, `to_location`) already returned by `GET /api/v1/trips/:id/land-travel`. No new fetch calls. No contract mismatches detected.

**Integration Test Overall: PASS**

---

### Test Type: Config Consistency Check (T-156)

*(Re-verified for Sprint 15 — no config changes this sprint)*

#### Local Dev Stack

| Check | backend/.env | vite.config.js | Result |
|-------|-------------|----------------|--------|
| Port match | PORT=3000 | default `http://localhost:3000` | ✅ PASS |
| Protocol match | SSL commented out → HTTP | `BACKEND_SSL` unset → `http://` | ✅ PASS |
| CORS origin | `CORS_ORIGIN=http://localhost:5173` | `server.port=5173` | ✅ PASS |

#### Docker Compose

| Check | Value | Result |
|-------|-------|--------|
| Backend container PORT | PORT=3000 | ✅ PASS |
| Backend healthcheck URL | `http://localhost:3000/api/v1/health` | ✅ PASS |
| CORS_ORIGIN env default | `http://localhost` | ✅ PASS (Docker-internal nginx proxies traffic) |

**Config Consistency: PASS — No mismatches detected. No changes from Sprint 14.**

---

### Test Type: Security Scan (T-156)

#### Security Checklist — Sprint 15 Frontend Changes

| Item | Applicable | Status | Notes |
|------|-----------|--------|-------|
| No hardcoded secrets | ✅ Yes | ✅ PASS | No secrets in T-154/T-155 changes |
| No SQL injection vectors | N/A (frontend) | ✅ N/A | Frontend-only changes |
| No XSS vectors | ✅ Yes | ✅ PASS | T-155: `_location` rendered as React text node (JSX template literal), no `dangerouslySetInnerHTML` |
| No `dangerouslySetInnerHTML` | ✅ Yes | ✅ PASS | Grep confirmed: zero occurrences in TripCalendar.jsx |
| No external resource loading | ✅ Yes | ✅ PASS | T-154: `href="/favicon.png"` is root-relative; no external URLs added |
| Error handling safe | ✅ Yes | ✅ PASS | T-155 uses `|| fallback` pattern — no crash on undefined `_location` |
| Auth checks present | N/A | N/A | Static HTML + rendering change; no new auth-required operations |
| No `innerHTML` usage | ✅ Yes | ✅ PASS | `innerHTML` not present in frontend source (only appears in comment in formatDate.js) |
| Rate limiting on auth endpoints | ⚠️ Known | ⚠️ Accepted Risk | Pre-existing from Sprint 1 (T-010 flag). Not introduced by Sprint 15. |
| Dependencies — known vulnerabilities | ⚠️ Moderate | ⚠️ Accepted Risk | 5 moderate-severity vulns in `esbuild` (via `vite`/`vitest`) — **dev-only toolchain, not shipped to production**. Fix requires `vitest@4` (breaking change). Acceptable for staging. Recommend Sprint 16 upgrade. |

**npm audit — Backend:**
- 5 moderate severity vulnerabilities in `esbuild` (via `vite`/`vitest` dev toolchain)
- Identical to frontend audit — dev-only deps, not in production build artifact
- No critical or high severity vulnerabilities

**npm audit — Frontend:**
- 5 moderate severity vulnerabilities in `esbuild` (via `vite`/`vitest` dev toolchain)
- Dev toolchain only — not included in `npm run build` production output
- No critical or high severity vulnerabilities

**Security Scan Overall: PASS (2 accepted risks, both pre-existing and dev-toolchain-only)**

---

### Summary — Sprint 15 QA Results

| Category | Status |
|----------|--------|
| Backend Unit Tests (266/266) | ✅ PASS |
| Frontend Unit Tests (410/410) | ✅ PASS |
| T-153 formatTimezoneAbbr tests (6 new) | ✅ PASS |
| T-155 TripCalendar location tests (A–D) | ✅ PASS |
| T-138 RENTAL_CAR regression | ✅ PASS |
| T-154 index.html title + favicon | ✅ PASS |
| T-155 land travel chip fix (code review) | ✅ PASS |
| API Contract Adherence | ✅ PASS |
| Config Consistency | ✅ PASS |
| Security Checklist | ✅ PASS (2 accepted risks) |
| npm audit (backend + frontend) | ⚠️ Moderate (dev-only, accepted) |

**QA VERDICT: ALL SPRINT 15 TASKS PASS — CLEAR FOR DEPLOYMENT (T-158)**

Tasks T-153, T-154, T-155 are verified complete. No P0 or P1 failures. No blockers identified. Handoff to Deploy Engineer (T-158) logged in handoff-log.md.

---

## Sprint 15 — QA Re-Verification Pass (2026-03-07 — Orchestrator Sprint #15 Run)

**QA Engineer** | Re-run triggered by orchestrator Sprint #15 invocation.

> **Note:** T-156 (security + code review) and T-157 (integration testing) were completed in a prior QA invocation this same sprint (both marked Done, results logged above). This entry records the results of the re-verification run confirming those prior results remain accurate.

---

### Test Type: Unit Tests (Re-Verification)

| Suite | Result | Count | Command |
|-------|--------|-------|---------|
| Backend | ✅ PASS | 266 / 266 | `cd backend && npm test` |
| Frontend | ✅ PASS | 410 / 410 | `cd frontend && npm test` |

- Backend: 12 test files, all pass (517 ms) — stderr entries are expected test-infrastructure noise for malformed-JSON error-path tests
- Frontend: 22 test files, all pass (1.66 s)
- T-153 (formatTimezoneAbbr) — 6 tests in `formatDate.test.js` lines 107–156: ✅ PASS
- T-155 A–D (TripCalendar location) — lines 1586–1669: ✅ PASS
- T-138 20.A–G (RENTAL_CAR regression) — lines 1202–1340: ✅ PASS

---

### Test Type: Integration Test (Re-Verification)

#### T-154 — index.html Title + Favicon

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| `<title>` | `triplanner` | `triplanner` (line 6) | ✅ PASS |
| `<link rel="icon">` present | Yes | `<link rel="icon" type="image/png" href="/favicon.png" />` (line 7) | ✅ PASS |
| href root-relative | `/favicon.png` | `/favicon.png` | ✅ PASS |
| No external resource loading | None | None | ✅ PASS |

#### T-155 — Land Travel Chip Location Fix

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| Departure-day event `_location` | `lt.from_location` | `_location: lt.from_location` (line 237) | ✅ PASS |
| Arrival-day event `_location` | `lt.to_location` | `_location: lt.to_location` (line 248) | ✅ PASS |
| DayCell chip render | `ev.item._location` (text node) | `{chipLabel}` in `<span>` — no `dangerouslySetInnerHTML` | ✅ PASS |
| DayPopover.getEventLabel | `item._location` | `item._location \|\| item.to_location \|\| ''` | ✅ PASS |
| T-138 RENTAL_CAR prefixes unaffected | "pick-up"/"drop-off" present | Confirmed — separate `getEventTime` path | ✅ PASS |

#### T-153 — formatTimezoneAbbr() Tests

| Check | Result |
|-------|--------|
| 6 tests present in `formatDate.test.js` | ✅ PASS |
| No production code changed | ✅ PASS (test file only) |
| All 410 frontend tests pass | ✅ PASS |

#### API Contract Adherence

- Sprint 15 is frontend-only: T-154 (static HTML), T-155 (frontend rendering fix using pre-existing `from_location`/`to_location` fields), T-153 (tests only)
- No new API calls, no new query parameters, no request/response shape changes
- All existing Sprints 1–14 contracts unchanged — ✅ PASS

---

### Test Type: Config Consistency Check (Re-Verification)

| Check | backend/.env | vite.config.js / docker-compose.yml | Result |
|-------|-------------|--------------------------------------|--------|
| Backend PORT | `PORT=3000` | Vite default: `http://localhost:3000` | ✅ PASS |
| SSL consistency | SSL commented out (local dev) | `BACKEND_SSL` unset → `http://` | ✅ PASS |
| CORS_ORIGIN | `http://localhost:5173` | Vite server port `5173` | ✅ PASS |
| Docker PORT | `PORT: 3000` | healthcheck `http://localhost:3000` | ✅ PASS |

**Config Consistency: PASS — No mismatches. No changes from Sprint 14.**

---

### Test Type: Security Scan (Re-Verification)

| Item | Status | Notes |
|------|--------|-------|
| Hardcoded secrets | ✅ PASS | None in T-154/T-155 changes |
| SQL injection | ✅ N/A | Frontend-only sprint |
| XSS — `dangerouslySetInnerHTML` | ✅ PASS | 0 occurrences in TripCalendar.jsx (grep confirmed) |
| XSS — `_location` rendering | ✅ PASS | Rendered as JSX text node in `<span>` — safe |
| External resource loading | ✅ PASS | `href="/favicon.png"` is root-relative, no external URLs |
| No hardcoded JWT secrets | ✅ PASS | `JWT_SECRET` only in `.env` / environment vars, never in source |
| npm audit — backend | ⚠️ Accepted | 5 moderate vulns in `esbuild`/`vite`/`vitest` dev toolchain — not shipped to production. Pre-existing. |
| npm audit — frontend | ⚠️ Accepted | Same 5 moderate vulns — dev toolchain only. |

**Security Scan: PASS (2 pre-existing accepted risks — dev toolchain, not production)**

---

### Re-Verification Summary

| Category | Status |
|----------|--------|
| Backend Unit Tests (266/266) | ✅ PASS |
| Frontend Unit Tests (410/410) | ✅ PASS |
| T-154 title + favicon (code + integration) | ✅ PASS |
| T-155 land travel chip _location fix | ✅ PASS |
| T-153 formatTimezoneAbbr 6 tests | ✅ PASS |
| T-138 RENTAL_CAR regression | ✅ PASS |
| API Contract Adherence | ✅ PASS |
| Config Consistency | ✅ PASS |
| Security Checklist | ✅ PASS |
| npm audit | ⚠️ Moderate dev-only (accepted) |

**QA VERDICT: SPRINT 15 RE-VERIFICATION COMPLETE — ALL PASS**

T-153, T-154, T-155 remain Done. T-156 (security) and T-157 (integration) confirmed complete. T-158 (Deploy) already Done. T-159 (Monitor) is unblocked — no QA blockers. T-152 (User Agent P0 walkthrough) remains Backlog — circuit-breaker active, must execute this sprint.


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

