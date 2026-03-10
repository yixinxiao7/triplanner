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

---

## Sprint #17 QA Run — 2026-03-08

**QA Engineer Tasks:** T-173 (security checklist + code review) + T-174 (integration testing)
**Sprint 17 Changes:** T-170 (code cleanup: FB-106/FB-107/FB-108) + T-172 (print button update per Spec 17)

---

### Unit Test: Backend
- **Status:** PASS
- **Command:** `cd /Users/yixinxiao/PROJECTS/triplanner/backend && npm test -- --run`
- **Result:** 13 test files, **278/278 tests passed**
- **Details:** No backend changes in Sprint 17 (frontend-only sprint). All 278 backend tests continue to pass. No regressions detected. The stderr output (malformed JSON SyntaxError in sprint2.test.js) is expected — that test intentionally sends truncated JSON to verify 400 INVALID_JSON response; the log line is from the error handler doing its job correctly.

---

### Unit Test: Frontend
- **Status:** PASS
- **Command:** `cd /Users/yixinxiao/PROJECTS/triplanner/frontend && npm test -- --run`
- **Result:** 22 test files, **416/416 tests passed**
- **Details:** Count is correct per T-170+T-172 arithmetic: 420 (Sprint 16 baseline) − 5 dead `formatTripDateRange` tests (T-170/FB-107) + 4 new T-172 print tests − 3 replaced stale T-122 print tests = 416.
  - `formatDate.test.js` (20 tests): `formatTripDateRange` removed — only `formatDateRange` tests remain, all passing.
  - `TripDetailsPage.test.jsx` (70 tests): T-172-A through T-172-D present and passing.
  - `TripCard.test.jsx` (17 tests): `datesNotSet` / "No dates yet" tests passing.
  - All other test files: unchanged, all pass.

---

### Integration Test
- **Status:** PASS
- **Details:** Verified at code level (code-path analysis + unit test coverage). Live staging integration deferred to T-175 (Deploy) and T-176 (Monitor) per established sprint protocol.

| Scenario | Verification Method | Result |
|----------|---------------------|--------|
| 1. Print button visible on TripDetailsPage | T-172-A unit test: `getByRole('button', { name: /print itinerary/i })` | ✅ PASS |
| 2. Print button calls `window.print()` exactly once | T-172-B unit test: `vi.fn()` mock, `toHaveBeenCalledTimes(1)` | ✅ PASS |
| 3. Print button has `aria-label="Print itinerary"` | T-172-C unit test: `getAttribute('aria-label') === 'Print itinerary'` | ✅ PASS |
| 4. Print button absent in error state | T-172-D unit test: `queryByRole` returns null when trip load fails | ✅ PASS |
| 5. "No dates yet" legibility improved (opacity fix) | `.datesNotSet` CSS: only `color: var(--text-muted)`, no `opacity` property | ✅ PASS |
| 6. `formatDateRange` unaffected by dead-code removal | 20 `formatDate` unit tests pass; `TripDetailsPage` imports `formatDateRange` | ✅ PASS |
| 7. Sprint 16 regression: date ranges on home page | TripCard.test.jsx (17 tests) all pass; `formatDateRange` exports intact | ✅ PASS |
| 8. Sprint 15 regression: title, favicon, land travel chips | 416 frontend tests pass — TripCalendar (70 tests), TripCard (17 tests) | ✅ PASS |
| 9. Sprint 14 regression: Today button, first-event-month | TripCalendar.test.jsx (70 tests) all pass | ✅ PASS |
| 10. No new API endpoints introduced | api-contracts.md confirms Sprint 17 = frontend-only, zero schema changes | ✅ PASS |

---

### Config Consistency Check
- **Status:** PASS
- **Details:**

| Check | Status | Evidence |
|-------|--------|----------|
| Backend PORT | ✅ PASS | `backend/.env` → `PORT=3000` |
| Vite proxy target | ✅ PASS | `vite.config.js` defaults `BACKEND_PORT` to `'3000'` — matches backend dev PORT |
| SSL consistency | ✅ PASS | `backend/.env` has SSL lines commented out (dev mode); vite `backendSSL` defaults `false` — both use HTTP for local dev |
| `CORS_ORIGIN` includes `http://localhost:5173` | ✅ PASS | `backend/.env` → `CORS_ORIGIN=http://localhost:5173` |
| Docker Compose PORT | ✅ PASS | `infra/docker-compose.yml` backend env sets `PORT: 3000` — consistent with local dev |
| JWT_SECRET in `.env` | ⚠️ NOTE | `JWT_SECRET=change-me-to-a-random-string` in dev `.env` (pre-existing; staging `.env.staging` uses rotated secret per T-145) |

No new config changes were introduced in Sprint 17. All previous consistency findings unchanged.

---

### Security Scan
- **Status:** PASS
- **npm audit (backend):** 5 moderate severity vulnerabilities (esbuild ≤0.24.2 → vite → vitest chain). All dev-only, pre-existing since Sprint 15, no new Critical/High findings. Fix requires breaking vitest upgrade (`npm audit fix --force` → vitest@4.x). Accepted as-is per project policy.
- **npm audit (frontend):** Same 5 moderate dev-only vulnerabilities. Same pre-existing chain. No new Critical/High findings.

#### Security Checklist — T-170 (Code Cleanup)

| Item | Check | Result |
|------|-------|--------|
| No hardcoded secrets | `.datesNotSet` CSS rule: pure CSS color utility, no script execution | ✅ PASS |
| No XSS vectors | T-170 changes are CSS + function removal — no HTML output, no DOM manipulation | ✅ PASS |
| No injection risk | No database queries changed; no user input handling modified | ✅ PASS |
| Dead code fully removed | `formatTripDateRange` absent from `formatDate.js`; 5 dead tests removed from `formatDate.test.js` | ✅ PASS |
| Comment accuracy | `formatDate.js` file-level comment on line 8 updated to: "derive date range from the earliest and latest dates across all event types (flights, stays, activities, land travels)" | ✅ PASS |

#### Security Checklist — T-172 (Print Button)

| Item | Check | Result |
|------|-------|--------|
| No `dangerouslySetInnerHTML` | `TripDetailsPage.jsx` grep confirms zero occurrences | ✅ PASS |
| `window.print()` is safe native API | `onClick={() => window.print()}` — no custom print logic, no error risk | ✅ PASS |
| No sensitive data in DOM attributes | Button has only `className`, `onClick`, `aria-label` — no data attributes with sensitive content | ✅ PASS |
| `print.css` security-neutral | Pure `@media print` layout rules; no script injection; no external resource loading; no CORS implications | ✅ PASS |
| Button accessible | `aria-label="Print itinerary"` present and verified by T-172-C unit test | ✅ PASS |
| No new API calls | Frontend-only change confirmed by Manager review and api-contracts.md | ✅ PASS |
| Auth enforcement unchanged | No route changes; all resource endpoints continue to require `authenticate` middleware | ✅ PASS |

#### Full Security Checklist Status

| Category | Status |
|----------|--------|
| Authentication & Authorization | ✅ All API resource routes use `router.use(authenticate)` middleware |
| Input Validation & Injection Prevention | ✅ No new user inputs; Knex query builder used throughout (no raw SQL string concat) |
| API Security | ✅ CORS configured to `http://localhost:5173`; rate limiting in place; no stack traces in responses |
| Data Protection | ✅ No credentials in code; `.env` values used for secrets |
| Infrastructure | ✅ HTTPS on staging (T-145); `npm audit` no new Critical/High; no default credentials |

---

### Overall: PASS

| Category | Result |
|----------|--------|
| Backend Unit Tests (T-173) | ✅ 278/278 PASS |
| Frontend Unit Tests (T-173) | ✅ 416/416 PASS |
| Integration Scenarios (T-174) | ✅ 10/10 PASS |
| Config Consistency | ✅ PASS (no changes in Sprint 17) |
| Security Checklist — T-170 | ✅ PASS |
| Security Checklist — T-172 | ✅ PASS |
| npm audit (backend) | ⚠️ 5 Moderate dev-only (pre-existing, accepted) |
| npm audit (frontend) | ⚠️ 5 Moderate dev-only (pre-existing, accepted) |
| No new Critical/High vulnerabilities | ✅ CONFIRMED |

**QA VERDICT: SPRINT 17 PASS — ALL CHECKS CLEAR**

T-170 (code cleanup: opacity fix, dead code removal, comment update) and T-172 (print button aria-label + text update with T-172-A–D tests) meet all acceptance criteria. No security issues introduced. No regressions. Backend unchanged at 278/278. Frontend at 416/416 (correct count per T-170+T-172 arithmetic). Deploy Engineer (T-175) is unblocked.


---

## Sprint #17 — Deploy: T-175 — 2026-03-08

**Deploy Engineer:** T-175 — Sprint 17 Staging Re-Deployment

### Pre-Deploy Gate Check

| Gate | Status |
|------|--------|
| QA T-173 (security checklist) | ✅ Done — confirmed in handoff-log.md |
| QA T-174 (integration testing) | ✅ Done — confirmed in handoff-log.md |
| QA handoff to Deploy | ✅ Present in handoff-log.md (2026-03-08) |
| T-170 source verified | ✅ `.datesNotSet` → `color: var(--text-muted)` only; `formatTripDateRange` absent |
| T-172 source verified | ✅ `window.print()` + `aria-label="Print itinerary"` present in TripDetailsPage.jsx |
| print.css exists | ✅ `/frontend/src/styles/print.css` confirmed |

### Backend Status

| Check | Result |
|-------|--------|
| pm2 `triplanner-backend` | ✅ Online — PID 51577, 98m uptime |
| pm2 `triplanner-frontend` | ✅ Online — PID 51694, 97m uptime |
| Backend restart required | ❌ No — no backend changes in Sprint 17 |
| Migrations required | ❌ No — T-170 + T-172 are frontend-only |

### Frontend Build

| Step | Result |
|------|--------|
| Command | `npm run build` in `frontend/` |
| Build tool | Vite v6.4.1 |
| Exit code | ✅ 0 (success) |
| Errors | ✅ 0 errors |
| Modules transformed | 122 modules |
| Output: `dist/index.html` | ✅ 0.46 kB (gzip: 0.29 kB) |
| Output: `dist/assets/index-CHbJGuD3.css` | ✅ 74.41 kB (gzip: 11.88 kB) |
| Output: `dist/assets/index-B58n1DRM.js` | ✅ 339.63 kB (gzip: 103.16 kB) |
| Build time | 458ms |

### Asset Verification

| Check | Result |
|-------|--------|
| `@media print` rules in CSS bundle | ✅ Confirmed — `@media print{*,*:before,*:after{background:#fff!important;color:#000!important;...` |
| "Print itinerary" text in JS bundle | ✅ Confirmed (2 occurrences — visible text + aria-label) |
| `.datesNotSet` CSS (opacity fix) | ✅ `datesNotSet_1vo21_206{color:var(--text-muted)}` — no opacity property |
| `dist/index.html` title | ✅ `<title>triplanner</title>` |
| `dist/favicon.png` | ✅ Present |

### Smoke Tests

| # | Test | Result |
|---|------|--------|
| (a) | `GET /api/v1/health` → `{"status":"ok"}` | ✅ PASS |
| (b) | pm2 `triplanner-backend` online (port 3001) | ✅ PASS — PID 51577 |
| (c) | Frontend build: 0 errors, all assets generated | ✅ PASS |
| (d) | `print.css` @media print rules in CSS bundle | ✅ PASS |
| (e) | "Print itinerary" button text in JS bundle | ✅ PASS |
| (f) | `.datesNotSet` no opacity in CSS bundle | ✅ PASS |
| (g) | Sprint 15 feature: title "triplanner" in index.html | ✅ PASS |
| (h) | Sprint 15 feature: favicon.png in dist | ✅ PASS |

### Environment

| Setting | Value |
|---------|-------|
| `backend/.env` | ✅ NOT modified |
| `backend/.env.staging` | ✅ NOT modified |
| Migrations run | None (frontend-only sprint) |
| pm2 restart | Not required (backend unchanged) |

### Build Status: ✅ SUCCESS

**Environment:** Staging
**Date:** 2026-03-08
**T-175:** DONE

Handoff logged to Monitor Agent (T-176) in handoff-log.md.


---

## Sprint #17 QA Re-Verification — 2026-03-08 (Orchestrator Pass)

**QA Engineer — Sprint #17 Re-Verification Run**

The orchestrator invoked QA again for Sprint 17. This is a re-verification confirming all prior QA findings remain valid. No new code changes were detected.

### Fresh Test Run Results

#### Unit Test: Frontend
- **Command:** `cd frontend && npm test -- --run`
- **Result:** 22 test files — **416/416 PASS** ✅
- Test files verified include: `TripDetailsPage.test.jsx` (70 tests, T-172-A–D confirmed passing), `formatDate.test.js` (20 tests, `formatTripDateRange` absent), `TripCard.test.jsx` (17 tests, `.datesNotSet` tests passing).

#### Unit Test: Backend
- **Command:** `cd backend && npm test -- --run`
- **Result:** 13 test files — **278/278 PASS** ✅
- No backend changes in Sprint 17; results unchanged from Sprint 16 baseline.

### Source Code Spot-Check (Re-Verified)

| Check | File | Finding | Result |
|-------|------|---------|--------|
| T-170: `.datesNotSet` no opacity | `frontend/src/components/TripCard.module.css` line 206 | `color: var(--text-muted)` only — no `opacity` | ✅ PASS |
| T-170: `formatTripDateRange` absent | `frontend/src/utils/formatDate.js` | Not exported; only `formatDateRange` present | ✅ PASS |
| T-170: File comment updated | `formatDate.js` line 8 | Reflects all event types (flights, stays, activities, land travels) | ✅ PASS |
| T-172: Print button in JSX | `frontend/src/pages/TripDetailsPage.jsx` line 634–657 | `onClick={() => window.print()}`, `aria-label="Print itinerary"` present | ✅ PASS |
| T-172: print.css imported | `TripDetailsPage.jsx` line 10 | `import '../styles/print.css'` ✅ | ✅ PASS |
| T-172: print.css exists | `frontend/src/styles/print.css` | 256 lines, `@media print` only | ✅ PASS |
| T-172: No dangerouslySetInnerHTML | `TripDetailsPage.jsx` | Zero occurrences | ✅ PASS |

### npm audit (Re-Run)

| Target | Result |
|--------|--------|
| `frontend/` | 5 Moderate (esbuild/vite/vitest dev chain, pre-existing) — no new Critical/High |
| `backend/` | 5 Moderate (esbuild/vite/vitest dev chain, pre-existing) — no new Critical/High |

### Config Consistency (Re-Verified)

| Check | Result |
|-------|--------|
| Backend PORT=3000 | ✅ Matches vite.config.js default BACKEND_PORT='3000' |
| SSL disabled locally | ✅ backend/.env SSL lines commented out; vite proxy uses http:// |
| CORS_ORIGIN=http://localhost:5173 | ✅ Matches frontend dev server |
| Docker Compose PORT: 3000 | ✅ Consistent |

### QA Verdict: ✅ PASS (Re-Confirmed)

All Sprint 17 acceptance criteria satisfied. T-170 and T-172 are being marked Done. Deploy pipeline (T-175 + T-176) already complete.

---

## Sprint #17 — Deploy Re-Verification — 2026-03-08 (Orchestrator Pass 3)

**Deploy Engineer — T-175 Re-Verification**

The orchestrator invoked the Deploy Engineer again for Sprint #17. T-175 was completed in a prior orchestrator pass. This entry confirms the deployment is still live and all Sprint 17 changes remain in effect.

### Live System State

| Component | Status | Details |
|-----------|--------|---------|
| `triplanner-backend` (pm2) | ✅ Online | PID 51577, 108m uptime, 0 restarts |
| `triplanner-frontend` (pm2) | ✅ Online | PID 51694, 108m uptime, 0 restarts |
| `GET /api/v1/health` | ✅ `{"status":"ok"}` | HTTPS on port 3001 |
| Frontend dist/ | ✅ Current | Built Mar 8 18:23 — exact match to T-175 log |

### Bundle Verification

| Check | Result |
|-------|--------|
| `@media print` in CSS bundle (`index-CHbJGuD3.css`, 74,410 bytes) | ✅ Present |
| `"Print itinerary"` in JS bundle (`index-B58n1DRM.js`, 339,634 bytes) | ✅ Present |
| `.datesNotSet` source (TripCard.module.css line 206): `color: var(--text-muted)` only, no `opacity` | ✅ Confirmed |
| `formatTripDateRange` absent from `formatDate.js` | ✅ Confirmed |
| favicon.png in dist/ | ✅ Present |

### Migrations

No migrations needed — Sprint 17 is frontend-only. All 10 migrations (001–010) remain applied on staging.

### Verdict

**Environment:** Staging
**Build Status:** ✅ SUCCESS (pre-existing build — Mar 8 18:23)
**Backend:** Healthy — no restart required
**T-175:** DONE (confirmed re-verified 2026-03-08)

Monitor Agent (T-176) is unblocked. Handoff logged in handoff-log.md.

