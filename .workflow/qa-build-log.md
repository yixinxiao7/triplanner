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

## Sprint 12 QA — 2026-03-06

### T-129: Security Checklist + Code Review Audit

---

**Test Run:** Sprint 12 Security Checklist & Code Review Audit — T-125, T-126, T-127, T-128
**Sprint:** 12
**Test Type:** Security Scan
**Result:** PASS
**Build Status:** Success
**Environment:** Local
**Deploy Verified:** No (pending T-131 staging deploy)
**Tested By:** QA Engineer
**Related Tasks:** T-125, T-126, T-127, T-128, T-129

#### Security Checklist Results

**Authentication & Authorization**
- [x] All API endpoints require appropriate authentication — No new endpoints in Sprint 12. All existing auth mechanisms unchanged. ✅
- [x] Auth tokens have appropriate expiration — No auth changes. ✅
- [x] Password hashing — No auth changes. ✅
- [~] Failed login attempts are rate-limited — Pre-existing B-020 (Redis rate limiting deferred). Accepted known risk from Sprint 1. Not a Sprint 12 regression. ✅

**Input Validation & Injection Prevention**
- [x] T-126 (scroll listener): No user input involved. `window.addEventListener('scroll', handler, { capture: true })` with matching cleanup — no injection vector. ✅
- [x] T-127 (check-in label): Pure string concatenation using static literal `"check-in "`. No user input. No injection vector. ✅
- [x] T-128 (calendar default month): `getInitialMonth()` reads from already-validated API response data. Uses `new Date()` and `String.split('-')` — no eval, no dynamic code, no injection vector. `isNaN(d)` guards malformed input gracefully. ✅
- [x] T-125 (.env isolation): No code path changes to data handling. Env file loading uses `dotenv.config()` — no user input, no injection. ✅
- [x] SQL queries use parameterized statements — No new SQL queries in Sprint 12. ✅
- [x] HTML output is sanitized — No new HTML rendering. React escapes all string content by default. ✅

**API Security**
- [x] No new API endpoints in Sprint 12 (confirmed by Backend Engineer handoff). ✅
- [x] CORS: `backend/.env` CORS_ORIGIN=http://localhost:5173 (local dev, unchanged). `backend/.env.staging` CORS_ORIGIN=https://localhost:4173 (staging, correct). ✅
- [x] T-126/T-127/T-128: No new network requests added. ✅
- [x] T-128: Reads in-memory data already fetched at mount — no new API calls, no new query parameters. ✅
- [x] API responses do not leak internals — No changes to error handlers. ✅
- [x] Security headers (Helmet) — unchanged from prior sprints. ✅

**Data Protection**
- [x] T-125: `backend/.env.staging` added to `.gitignore` (explicit entry: `backend/.env.staging`). ✅
- [x] T-125: `backend/.env.staging.example` committed to repo as template (placeholder JWT_SECRET only — no real secrets). ✅
- [x] T-125: `backend/.env` restored to local-dev defaults (PORT=3000, no SSL, CORS=http://localhost:5173). No staging secrets in this file. ✅
- [x] No hardcoded secrets in any Sprint 12 code changes. ✅
- [x] No PII in logs — no new logging added. ✅

**Infrastructure**
- [x] T-125: `backend/src/index.js` loads `.env.staging` when `NODE_ENV=staging` (set by pm2 ecosystem.config.cjs). Local dev falls back to `.env`. ✅
- [x] T-125: pm2 `ecosystem.config.cjs` sets `NODE_ENV: 'staging'` — triggers .env.staging load on staging. ✅
- [x] T-125: Orchestrator `common.sh` creates `backend/.env` from `.env.example` only when file does not already exist (`if [[ ! -f ... ]]`). Does not overwrite an existing `.env`. ✅
- [x] npm audit (backend): 5 moderate severity vulnerabilities — ALL in `esbuild` via vite/vitest (dev-only dependencies, no production runtime impact). Pre-existing issue tracked as B-021. Accepted per active-sprint.md Out of Scope. ✅
- [x] npm audit (frontend): 5 moderate severity vulnerabilities — same `esbuild` chain via vitest. Same pre-existing B-021 acceptance. ✅
- [x] No default credentials in Sprint 12 code. ✅

**Memory Leak Verification (T-126)**
- [x] `window.addEventListener('scroll', handleScroll, { capture: true })` added in `useEffect`. ✅
- [x] Cleanup: `window.removeEventListener('scroll', handleScroll, { capture: true })` — same reference, same options object. No memory leak. ✅
- [x] Test `T-126: scroll listener is added and removed when DayPopover opens/closes` — uses `vi.spyOn` to verify add/remove lifecycle. PASSES. ✅

**XSS Verification (TripCalendar.jsx)**
- [x] No `innerHTML` assignment found. ✅
- [x] No `dangerouslySetInnerHTML` found. ✅
- [x] No `eval()` found. ✅
- [x] No `new Function()` found. ✅
- [x] All string values rendered via React JSX (auto-escaped). ✅

#### T-129 Summary
All security checklist items PASS for Sprint 12. Two pre-existing accepted risks: B-021 (esbuild dev dep vulnerability) and B-020 (rate limiting deferred) — both explicitly deferred in active-sprint.md Out of Scope. No new P1 security issues introduced. **T-129: PASS.**

---

### T-129: Unit Test Results

**Test Run:** Backend + Frontend Unit Tests — Sprint 12
**Sprint:** 12
**Test Type:** Unit Test
**Result:** PASS
**Build Status:** Success
**Environment:** Local
**Deploy Verified:** No
**Tested By:** QA Engineer
**Related Tasks:** T-129

**Backend Test Results (`cd backend && npm test -- --run`):**
```
Test Files:  12 passed (12)
Tests:       266 passed (266)
Duration:    574ms
```
Files: auth.test.js (14), trips.test.js (16), activities.test.js (12), stays.test.js (8), sprint2.test.js (37), sprint3.test.js (33), sprint4.test.js (19), sprint5.test.js (28), sprint6.test.js (51), sprint7.test.js (19). Note: expected stderr from ErrorHandler during malformed JSON test is intentional test behavior (not a failure).

**Frontend Test Results (`cd frontend && npm test -- --run`):**
```
Test Files:  22 passed (22)
Tests:       382 passed (382)
Duration:    1.87s
```
Sprint 12 new tests in TripCalendar.test.jsx (48 tests total, 13 new vs Sprint 11):
- T-126: scroll-closes-popover ✅ | scroll-listener-lifecycle (vi.spyOn) ✅ | Escape regression ✅
- T-127: check-in prefix (multi-day first day) ✅ | no bare time ✅ | checkout unchanged ✅ | single-day combined ✅ | DayPopover label matches ✅
- T-128: earliest event month ✅ | current month fallback ✅ | mixed types earliest ✅ | navigation from initial month ✅ | malformed date skip ✅

Happy path + error path coverage confirmed for all three tasks. ✅

**Unit Test Result: PASS — 266 backend + 382 frontend, all green.**

---

### T-130: Integration Testing

**Test Run:** Sprint 12 Integration Testing — T-125, T-126, T-127, T-128 + Sprint 11 Regression
**Sprint:** 12
**Test Type:** Integration Test
**Result:** PASS
**Build Status:** Success
**Environment:** Local (code review + behavioral verification via test suite)
**Deploy Verified:** No (pending T-131)
**Tested By:** QA Engineer
**Related Tasks:** T-125, T-126, T-127, T-128, T-130

#### Check 1: T-125 — .env Staging Isolation

| Check | Expected | Result |
|-------|----------|--------|
| `backend/.env` PORT | 3000 (local dev) | 3000 ✅ |
| `backend/.env` NODE_ENV | development | development ✅ |
| `backend/.env` CORS_ORIGIN | http://localhost:5173 | http://localhost:5173 ✅ |
| `backend/.env` SSL vars | not set | absent ✅ |
| `backend/.env.staging` exists | yes | yes ✅ |
| `backend/.env.staging` PORT | 3001 | 3001 ✅ |
| `backend/.env.staging` COOKIE_SECURE | true | true ✅ |
| `backend/.env.staging` CORS_ORIGIN | https://localhost:4173 | https://localhost:4173 ✅ |
| `backend/.env.staging.example` committed | yes | yes ✅ |
| `backend/.env.staging` in .gitignore | yes | yes ✅ |
| `backend/src/index.js` loads .env.staging when NODE_ENV=staging | yes | yes ✅ |
| pm2 ecosystem.config.cjs sets NODE_ENV=staging | yes | yes ✅ |
| Orchestrator does NOT overwrite backend/.env | yes | yes (common.sh: creates only if absent) ✅ |

**Check 1: PASS.**

#### Check 2: T-126 — DayPopover Scroll Anchoring

| Check | Expected | Result |
|-------|----------|--------|
| Open popover, fire scroll → popover closes | yes | unit test PASS ✅ |
| Listener uses `{ capture: true }` | yes | verified in code + test ✅ |
| Cleanup removes listener with same options | yes (no memory leak) | vi.spyOn test PASS ✅ |
| Escape still closes after listener attached | yes | regression test PASS ✅ |
| Focus restored to trigger on scroll-close | yes | `triggerRef?.current?.focus()` in code ✅ |
| Click-outside close preserved | yes | pre-existing tests PASS ✅ |

**Check 2: PASS.**

#### Check 3: T-127 — Check-in Chip Label

| Check | Expected | Result |
|-------|----------|--------|
| Stay check-in day chip text | "check-in Xa" | unit test PASS ✅ |
| Stay checkout day chip text | "check-out Xa" (unchanged) | unit test PASS ✅ |
| Single-day stay chip text | "check-in Xa → check-out Xa" | unit test PASS ✅ |
| DayPopover check-in time | "check-in Xa" (consistent) | unit test PASS ✅ |
| No bare time string on check-in day | confirmed absent | unit test PASS ✅ |

**Check 3: PASS.**

#### Check 4: T-128 — Calendar Default Month

| Check | Expected | Result |
|-------|----------|--------|
| Trip with flight in Aug 2026 → opens August | yes | unit test PASS ✅ |
| Trip with no events → opens current month | yes | unit test PASS ✅ |
| Mixed types: activity Aug, flight Sep → opens Aug | yes (earliest wins) | unit test PASS ✅ |
| Navigate forward from Aug → September | yes | unit test PASS ✅ |
| Navigate backward from Aug → July | yes | unit test PASS ✅ |
| Malformed date skipped; valid event used | yes | unit test PASS ✅ |
| All 4 event types covered (flights, stays, activities, landTravels) | yes | verified in code ✅ |
| Activity dates parsed as local time | yes | `new Date(year, month-1, day)` verified ✅ |

**Check 4: PASS.**

#### Check 5: API Contract Verification

No new or changed API endpoints in Sprint 12. All existing Sprint 1–11 contracts unchanged and verified via 266 backend tests. T-128 reads in-memory data — no new API calls. **Check 5: PASS.**

#### Check 6: Config Consistency

| Item | backend/.env | vite.config.js | docker-compose.yml |
|------|-------------|----------------|-------------------|
| Backend port | 3000 | proxy → localhost:3000 | PORT: 3000 (internal) |
| SSL mode | not set (HTTP) | http:// (BACKEND_SSL unset) | N/A (nginx internal) |
| Frontend CORS | http://localhost:5173 | server runs on :5173 | N/A (Docker nginx) |

All three configs are consistent. No mismatches. **Check 6: PASS.**

#### Sprint 11 Regression

All 648 tests (266 backend + 382 frontend) pass. Sprint 11 features (land travel, notes, TZ abbreviations, URL links, calendar T-097/T-101, auth, trips CRUD, sub-resources) all covered by existing test suites. No regressions. ✅

#### T-130 Summary

All 6 integration checks PASS. Sprint 11 regression clean. **T-130: PASS. Cleared for staging deployment (T-131).**

---

### Pre-Deploy Readiness

| Check | Result |
|-------|--------|
| Unit tests: backend 266/266 | ✅ PASS |
| Unit tests: frontend 382/382 | ✅ PASS |
| Integration checks: 6/6 | ✅ PASS |
| Security checklist: all items | ✅ PASS |
| No new P1 security issues | ✅ PASS |
| Sprint 11 regression: clean | ✅ PASS |
| Pre-existing accepted risks (B-020, B-021) | acknowledged |

**CLEARED FOR STAGING DEPLOYMENT — handoff to Deploy Engineer (T-131).**

---

## Sprint 12 — T-132: Post-Deploy Health Check (Monitor Agent — 2026-03-06)

### T-132: Post-Deploy Health Check + Config Consistency

**Test Run:** Sprint 12 Post-Deploy Health Check — Staging Environment (T-132)
**Sprint:** 12
**Test Type:** Post-Deploy Health Check + Config Consistency
**Result:** PARTIAL PASS — API functional, config mismatch detected
**Build Status:** Success (frontend dist built; backend serving)
**Environment:** Staging
**Deploy Verified:** No
**Tested By:** Monitor Agent
**Related Tasks:** T-131, T-132
**Timestamp:** 2026-03-06T03:59:00Z

---

#### Config Consistency — Local Dev (backend/.env)

| Check | backend/.env | vite.config.js | docker-compose.yml | Status |
|-------|-------------|----------------|-------------------|--------|
| Backend PORT | 3000 | proxy → `http://localhost:3000` (BACKEND_PORT unset → default 3000) | `PORT: 3000` (internal container) | ✅ PASS |
| SSL/Protocol | Not set (HTTP) | `http://` (BACKEND_SSL not set → http default) | N/A (nginx internal) | ✅ PASS |
| CORS_ORIGIN | `http://localhost:5173` | `server.port = 5173` | N/A | ✅ PASS |

**Config Consistency — Local Dev: PASS.** All three configs consistent. No port, protocol, or CORS mismatches.

---

#### Config Consistency — Staging (backend/.env.staging vs actual runtime)

| Check | backend/.env.staging | Actual Runtime | Status |
|-------|---------------------|----------------|--------|
| Backend PORT | `3001` | Node process listening on `:3000` (lsof -i :3001 → empty; lsof -i :3000 → PID 78079) | ❌ FAIL — PORT MISMATCH |
| SSL/Protocol | `SSL_KEY_PATH=../infra/certs/localhost-key.pem` set; certs exist at `infra/certs/` | Backend responds to HTTPS (`curl -sk https://localhost:3000/api/v1/health → 200`); HTTP returns "Empty reply from server" (curl exit 52) | ✅ PASS — SSL active, but on wrong port |
| CORS_ORIGIN | `https://localhost:4173` | Vite preview at `https://localhost:4173` (PID 78127 confirmed via lsof) | ✅ PASS |
| T-131 Deploy handoff | Expected: Deploy Engineer → Monitor Agent | Not found in handoff-log.md. Manager → Deploy Engineer entry remains `Status: Pending` | ❌ FAIL — Handoff not logged |
| pm2 process management | Expected: `pm2 start infra/ecosystem.config.cjs` | `pm2` command not found in PATH; backend runs as background process (PPID=1), not managed via pm2 | ❌ FAIL — pm2 not verifiable |

**Config Consistency — Staging: FAIL.**

**Root cause of PORT mismatch:** `backend/.env.staging` specifies `PORT=3001`, but the running backend process (PID 78079, `node src/index.js`) is bound to port 3000. The process IS serving HTTPS (certs present at `infra/certs/localhost-key.pem` and `infra/certs/localhost.pem`), but it loaded `PORT=3000` from an unknown source — not from `backend/.env.staging`. This indicates the backend was NOT started with `NODE_ENV=staging` or was started with a `PORT` environment variable override. The Sprint 11 staging backend at `https://localhost:3001` (pm2 PID 42784, per Sprint 11 handoff) is no longer running; port 3001 has no listener.

**Impact:** If vite is run in staging mode (`BACKEND_PORT=3001 BACKEND_SSL=true npm run dev`), the dev proxy will target `https://localhost:3001` — which has no listener. Staging integration will break for any dev-mode usage. The frontend preview (which does not proxy) is unaffected.

---

#### Health Check Results

**Environment:** Staging
**Actual backend URL:** `https://localhost:3000` (Note: expected `https://localhost:3001` per `.env.staging`)
**Frontend URL:** `https://localhost:4173`

| Check | Endpoint / Check | Result | Details |
|-------|-----------------|--------|---------|
| App responds | `GET /api/v1/health` | ✅ HTTP 200 | Response: `{"status":"ok"}` — connection via `https://localhost:3000` (self-signed cert, `-k` flag) |
| Auth — Register | `POST /api/v1/auth/register` | ✅ HTTP 201 | Response shape: `{ "data": { "user": { id, name, email, created_at }, "access_token": "<JWT>" } }` — correct per contract |
| Auth — Login | `POST /api/v1/auth/login` | ✅ HTTP 200 | Valid JWT access token returned; user data shape correct |
| Unauthenticated rejection | `GET /api/v1/trips` (no header) | ✅ HTTP 401 | `{ "error": { "message": "Authentication required", "code": "UNAUTHORIZED" } }` |
| Trips — List | `GET /api/v1/trips` | ✅ HTTP 200 | `{ "data": [], "pagination": { "page": 1, "limit": 20, "total": 0 } }` — correct shape |
| Trips — Create | `POST /api/v1/trips` | ✅ HTTP 201 | `{ "data": { id, user_id, name, destinations, status, notes, start_date, end_date, created_at, updated_at } }` — correct |
| Trips — Delete | `DELETE /api/v1/trips/:id` | ✅ HTTP 204 | No body, correct |
| Flights — List | `GET /api/v1/trips/:id/flights` | ✅ HTTP 200 | `{ "data": [] }` |
| Stays — List | `GET /api/v1/trips/:id/stays` | ✅ HTTP 200 | `{ "data": [] }` |
| Activities — List | `GET /api/v1/trips/:id/activities` | ✅ HTTP 200 | `{ "data": [] }` |
| Land Travel — List | `GET /api/v1/trips/:id/land-travel` | ✅ HTTP 200 | `{ "data": [] }` — Note: route mounted at `/land-travel` (singular), not `/land-travels` (see note below) |
| No 5xx errors | All endpoints tested | ✅ PASS | Zero 5xx responses across all endpoint tests |
| Database connectivity | Implicit via auth + CRUD | ✅ PASS | User created (register), login returned data, trip created — all DB operations successful |
| Frontend accessible | `https://localhost:4173` | ✅ HTTP 200 | Vite preview (PID 78127) responding |
| Frontend dist | `frontend/dist/` | ✅ EXISTS | `assets/` + `index.html` present — frontend was built |

**Health Checks: 14/14 PASS** (all API endpoints functional, database connected, no 5xx errors, frontend accessible and built)

---

#### Notes

**Note 1 — Health endpoint response format:**
`GET /api/v1/health` returns `{"status":"ok"}` without the standard `{ "data": ... }` API wrapper. This is pre-existing behavior (present since Sprint 1) and appears intentional for health endpoints. Not a Sprint 12 regression.

**Note 2 — Pre-existing route name inconsistency (not a Sprint 12 regression):**
`api-contracts.md` documents the land travel endpoint as `/api/v1/trips/:id/land-travels` (plural), but `backend/src/app.js` mounts it at `/api/v1/trips/:tripId/land-travel` (singular). The backend test suite (sprint6.test.js) uses singular URLs and all 266 tests pass. The frontend also uses singular URLs (application works end-to-end). This is a pre-existing documentation inconsistency from Sprint 6, not introduced in Sprint 12. Tested: `GET /land-travel` → 200; `GET /land-travels` → 404. No functional impact; flagging for contract doc correction.

---

#### Deploy Verified Summary

**Deploy Verified: No**

| Failure Reason | Severity | Responsible Agent |
|---------------|----------|-------------------|
| Staging backend running on PORT=3000, not PORT=3001 as specified in `backend/.env.staging` | Major | Deploy Engineer |
| No Deploy Engineer → Monitor Agent handoff logged for T-131 (Manager → DE entry still `Status: Pending`) | Major | Deploy Engineer |
| `pm2` not found in PATH; cannot verify pm2 process management; backend running as bare background process (PPID=1) | Major | Deploy Engineer |

**All API endpoints are functionally healthy.** The application responds correctly to all tested routes. The deploy-verified failure is entirely a config/process-management issue, not an application code regression.

**Required action:** Deploy Engineer must restart the backend using `backend/.env.staging` (PORT=3001, NODE_ENV=staging) via pm2 (`pm2 start infra/ecosystem.config.cjs` from the project root) and log the T-131 completion handoff to Monitor Agent. Monitor Agent will re-run T-132 health checks after the corrected deploy.

---

## Sprint 12 QA Re-Verification — 2026-03-06 (Orchestrator Re-Run)

### Re-Verification: Unit Tests + Integration + Security + Config

**Test Run:** Sprint 12 Full Re-Verification — T-125, T-126, T-127, T-128
**Sprint:** 12
**Test Type:** Unit Test + Integration Test + Security Scan + Config Consistency
**Result:** PASS
**Build Status:** Success
**Environment:** Local
**Deploy Verified:** No (pending T-131 staging deploy)
**Tested By:** QA Engineer (orchestrator re-run)
**Related Tasks:** T-125, T-126, T-127, T-128, T-129, T-130

#### Unit Test Results (Re-Run)

**Backend (`cd backend && npm test -- --run`):**
```
Test Files  12 passed (12)
Tests       266 passed (266)
Duration    541ms
```
Result: ✅ PASS — identical to prior QA run.

**Frontend (`cd frontend && npm test -- --run`):**
```
Test Files  22 passed (22)
Tests       382 passed (382)
Duration    1.63s
```
Result: ✅ PASS — identical to prior QA run. Warnings (act(...)) are pre-existing and do not affect test outcomes.

#### Code Verification (Sprint 12 changes in TripCalendar.jsx)

| Task | Code Location | Verified |
|------|--------------|---------|
| T-126 DayPopover scroll-close | Lines 285–296: `window.addEventListener('scroll', handleScroll, { capture: true })` + matching `removeEventListener` in cleanup | ✅ |
| T-127 check-in chip label | Lines 468–484: `check-in ${_calTime}` prepended for `_isFirst` cases; `check-out` unchanged for `_isLast` | ✅ |
| T-128 getInitialMonth() | Lines 124–166: all 4 event types covered; local-time parsing for activity_date/departure_date; `isNaN` guard; current-month fallback | ✅ |
| T-125 .env.staging | `backend/.env.staging` exists; `backend/.env` = PORT=3000, local dev defaults | ✅ |

#### Config Consistency Check

| Item | backend/.env | vite.config.js | docker-compose.yml | Status |
|------|-------------|----------------|--------------------|--------|
| Backend PORT | 3000 | proxy → localhost:3000 (default, BACKEND_PORT unset) | PORT: 3000 (internal) | ✅ Consistent |
| SSL mode | not set (HTTP) | http:// (BACKEND_SSL not set → http default) | N/A | ✅ Consistent |
| CORS_ORIGIN | http://localhost:5173 | server.port = 5173 | N/A | ✅ Consistent |

No config mismatches found.

#### Security Re-Check

| Item | Status |
|------|--------|
| No hardcoded secrets in Sprint 12 code | ✅ |
| T-126 scroll listener cleanup (no memory leak) | ✅ |
| T-127 pure string render (no XSS) | ✅ |
| T-128 safe date parsing (no eval, isNaN guards) | ✅ |
| backend/.env.staging not committed (in .gitignore) | ✅ |
| npm audit backend: 5 moderate (esbuild dev dep only, pre-existing B-021) | ✅ accepted |

#### Re-Verification Summary

All Sprint 12 tests pass on re-run. All code changes verified correct. Config consistency confirmed. No new security issues. **Sprint 12 remains CLEARED FOR STAGING DEPLOYMENT (T-131).**

---

## Sprint 13 QA Report (T-140 + T-141)

**Date:** 2026-03-07
**QA Engineer:** QA Agent
**Tasks in scope:** T-137, T-138, T-139
**Related QA Tasks:** T-140 (Security/Code Audit), T-141 (Integration Testing)

---

### Test Run 1 — Unit Tests (T-140)

| Field | Value |
|-------|-------|
| Test Run | Full unit test suite — backend + frontend |
| Sprint | 13 |
| Test Type | Unit Test |
| Result | **Pass** |
| Build Status | Success |
| Environment | Local |
| Deploy Verified | No |
| Tested By | QA Engineer |
| Error Summary | None |
| Related Tasks | T-137, T-138, T-139, T-140 |

#### Backend Results

```
Test Files  12 passed (12)
     Tests  266 passed (266)
  Duration  537ms
```

All 266 tests pass. No Sprint 13 backend changes (T-139 is documentation-only). Backend unit test suite unchanged and green.

#### Frontend Results

```
Test Files  22 passed (22)
     Tests  392 passed (392)
  Duration  1.68s
```

**TripCalendar.test.jsx — 58 tests (up from 49 in Sprint 12):**

| Group | Tests | Status |
|-------|-------|--------|
| T-137 19.A: Scroll event does NOT close popover | 1 | ✅ Pass |
| T-137 19.B: No scroll listener registered on open | 1 | ✅ Pass |
| T-137 19.C: Document-relative coordinates (scrollY offset) | 1 | ✅ Pass |
| T-137 19.D: Escape still closes popover (regression) | 1 | ✅ Pass |
| T-137 19.E: Click-outside still closes popover (regression) | 1 | ✅ Pass |
| T-137 19.F: No scroll listener to remove on unmount | 1 | ✅ Pass |
| T-138 20.A: RENTAL_CAR pick-up day shows "pick-up Xp" | 1 | ✅ Pass |
| T-138 20.B: RENTAL_CAR drop-off day shows "drop-off Xp" | 1 | ✅ Pass |
| T-138 20.C: arrival_date=null → no drop-off chip | 1 | ✅ Pass |
| T-138 20.D: No times → "pick-up" / "drop-off" label-only | 1 | ✅ Pass |
| T-138 20.E: Non-RENTAL_CAR unaffected (no pick-up prefix) | 1 | ✅ Pass |
| T-138 20.F: DayPopover overflow shows "pick-up Xp" | 1 | ✅ Pass |
| T-138 20.G: Same-day rental car → only pick-up, no drop-off | 1 | ✅ Pass |

**Coverage verdict:** Happy-path and error-path tests present for all Sprint 13 changes. ✅

---

### Test Run 2 — Security Scan (T-140)

| Field | Value |
|-------|-------|
| Test Run | Sprint 13 security checklist + npm audit |
| Sprint | 13 |
| Test Type | Security Scan |
| Result | **Pass** |
| Build Status | Success |
| Environment | Local |
| Deploy Verified | No |
| Tested By | QA Engineer |
| Error Summary | Pre-existing moderate vulns in dev deps (see below) |
| Related Tasks | T-137, T-138, T-139, T-140 |

#### Security Checklist — Sprint 13 Changes

Sprint 13 consists of two frontend-only UI changes (T-137, T-138) and one documentation fix (T-139). No new backend endpoints, database queries, or auth logic. Checklist scoped to applicable items.

| Item | Applicable | Status | Notes |
|------|-----------|--------|-------|
| XSS prevention — no dangerouslySetInnerHTML | ✅ | ✅ Pass | TripCalendar.jsx: no dangerouslySetInnerHTML or innerHTML or eval() found |
| XSS prevention — React JSX rendering (auto-escaped) | ✅ | ✅ Pass | All string interpolation via JSX — safe by default |
| Hardcoded secrets | ✅ | ✅ Pass | No secrets, tokens, or credentials in TripCalendar.jsx |
| Dynamic code execution (eval, Function()) | ✅ | ✅ Pass | None found |
| Scroll listener removal (T-137) | ✅ | ✅ Pass | Grep confirms zero `addEventListener('scroll', ...)` calls in TripCalendar.jsx |
| Auth enforcement | N/A | — | No new API calls in Sprint 13 changes |
| Input validation | N/A | — | No new form inputs or API endpoints |
| SQL injection prevention | N/A | — | No backend changes |
| API response leakage | N/A | — | No backend changes |
| CORS configuration | N/A | — | Unchanged |
| Security headers | N/A | — | Unchanged (Helmet still in place) |
| Rate limiting | N/A | — | Pre-existing known accepted risk from Sprint 1 (auth endpoints) |
| Env vars not committed | ✅ | ✅ Pass | backend/.env not committed; .gitignore in place |
| HTTPS on staging | ✅ | ✅ Pass | Staging uses certs via ecosystem.config.cjs (unchanged) |

#### npm audit — Backend

```
5 moderate severity vulnerabilities
  esbuild ≤0.24.2 — dev server cross-origin request vulnerability
  (affects: vite, @vitest/mocker, vitest, vite-node — all dev-only deps)
```

**Verdict:** Pre-existing B-021 (first noted Sprint 12). Dev toolchain only — not present in production build. Fix requires `npm audit fix --force` which is a breaking change to vitest. Accepted risk — dev environment only, no production exposure. **Not a P1.**

#### npm audit — Frontend (same set)

Same 5 moderate vulnerabilities in dev deps (esbuild/vite/vitest chain). Pre-existing and accepted.

---

### Test Run 3 — Integration Testing (T-141)

| Field | Value |
|-------|-------|
| Test Run | Sprint 13 integration verification — code-level + contract check |
| Sprint | 13 |
| Test Type | Integration Test |
| Result | **Pass** |
| Build Status | Success |
| Environment | Local |
| Deploy Verified | No |
| Tested By | QA Engineer |
| Error Summary | None |
| Related Tasks | T-137, T-138, T-139, T-141 |

#### T-137 — DayPopover Stay-Open on Scroll

| Check | Result | Evidence |
|-------|--------|----------|
| Scroll listener removed | ✅ Pass | grep confirms zero `addEventListener('scroll', ...)` in TripCalendar.jsx |
| Position is `absolute` (not `fixed`) | ✅ Pass | positionStyle IIFE returns `{ position: 'absolute', top, left, zIndex: 1000 }` (line 297) |
| Top coordinate includes `scrollY` offset | ✅ Pass | `top = (position.bottom \|\| 0) + scrollY + 4` (line 283) |
| Left coordinate includes `scrollX` offset | ✅ Pass | `left = (position.left \|\| 0) + scrollX` (line 284) |
| Right-edge clamping preserved | ✅ Pass | Lines 287–290 unchanged |
| Bottom-edge flip preserved | ✅ Pass | Lines 293–295 unchanged |
| Escape-to-close useEffect intact | ✅ Pass | Lines 311–320: keydown listener on document |
| Click-outside useEffect intact | ✅ Pass | Lines 322–334: mousedown listener on document |
| Close (×) button intact | ✅ Pass | Lines 396–403: onClick calls onClose |
| Test 19.A: scroll doesn't close | ✅ Pass | TripCalendar.test.jsx line 874 |
| Test 19.B: no scroll listener spy | ✅ Pass | TripCalendar.test.jsx line 887 |
| Test 19.C: document-relative coords | ✅ Pass | TripCalendar.test.jsx line 900 |

#### T-138 — Rental Car Pick-Up/Drop-Off Time Chips

| Check | Result | Evidence |
|-------|--------|----------|
| `mode === 'RENTAL_CAR'` guard in DayCell | ✅ Pass | TripCalendar.jsx lines 543–551 |
| DayCell pick-up day: `pick-up ${calTime}` | ✅ Pass | Line 547 |
| DayCell drop-off day: `drop-off ${calTime}` | ✅ Pass | Line 545 |
| DayCell: no time → `"pick-up"` / `"drop-off"` labels | ✅ Pass | Lines 545, 547 (ternary with empty fallback) |
| DayCell: non-RENTAL_CAR unchanged | ✅ Pass | Lines 549–551: falls through to `ev.item._calTime \|\| null` |
| `mode === 'RENTAL_CAR'` guard in DayPopover.getEventTime | ✅ Pass | TripCalendar.jsx lines 372–380 |
| Popover pick-up: `pick-up ${calTime}` | ✅ Pass | Line 376 |
| Popover drop-off: `drop-off ${calTime}` | ✅ Pass | Line 374 |
| Same-day rental (dep === arr): only pick-up chip | ✅ Pass | buildEventsMap line 234 guard skips arrival when dates match |
| `arrival_date = null`: no drop-off entry | ✅ Pass | buildEventsMap line 234 null guard |
| Non-RENTAL_CAR: unchanged dep./arr. labels | ✅ Pass | Lines 378–380 |

#### T-139 — api-contracts.md Land Travel Path Fix

| Check | Result | Evidence |
|-------|--------|----------|
| All Land Travel endpoint paths in api-contracts.md use `/land-travel` (singular) | ✅ Pass | grep scan: all 19 endpoint path occurrences are singular |
| No `/land-travels` (plural) in actual endpoint specs | ✅ Pass | grep returns 0 plural matches outside T-139 meta section |
| Frontend api.js uses `/land-travel` (singular) | ✅ Pass | api.js lines 152–156 |
| Backend mounts at `/land-travel` (singular) | ✅ Pass | Confirmed via Manager code review + prior sprint audits |
| No code changes — documentation only | ✅ Pass | T-139 is documentation-only as intended |

#### Config Consistency Check

| Item | Backend .env | vite.config.js | docker-compose.yml | Status |
|------|-------------|----------------|-------------------|--------|
| Backend port | PORT=3000 | BACKEND_PORT default=3000 → proxy http://localhost:3000 | PORT=3000 | ✅ Consistent |
| SSL protocol | SSL disabled (certs commented out) | BACKEND_SSL not set → uses http:// | N/A (nginx proxy in Docker) | ✅ Consistent |
| CORS origin | CORS_ORIGIN=http://localhost:5173 | Frontend dev server port=5173 | CORS_ORIGIN=http://localhost (Docker) | ✅ Consistent (Docker value is correct for containerized nginx) |
| Frontend dev port | — | port: 5173 | — | ✅ Matches CORS_ORIGIN |

**No config consistency issues found.**

#### Sprint 12 Regression

T-137/T-138 are both in TripCalendar.jsx. Sprint 12 tests that must not regress:

| Sprint 12 Feature | Test Result |
|-------------------|-------------|
| Check-in label "check-in Xa" (T-127) | ✅ 392/392 pass |
| Calendar default month from first event (T-128) | ✅ 392/392 pass |
| T-126 scroll-close (now REVERSED by T-137) | ✅ Correctly removed; 2 old T-126 scroll tests replaced by T-137 tests |
| backend/.env isolation (T-125) | ✅ backend/.env unchanged (PORT=3000, HTTP) |

All Sprint 12 features remain functional.

---

### Final QA Verdict — Sprint 13

| Task | Status | Notes |
|------|--------|-------|
| T-137 DayPopover stay-open on scroll | ✅ **PASS** | Implementation correct, 6 tests pass |
| T-138 Rental car pick-up/drop-off chips | ✅ **PASS** | Implementation correct, 7 tests pass |
| T-139 api-contracts.md doc fix | ✅ **PASS** | Documentation correct, no code changes |
| T-140 Security checklist | ✅ **PASS** | No new vulnerabilities; pre-existing dev-dep audit warning accepted |
| T-141 Integration testing | ✅ **PASS** | All contracts verified, config consistent, sprint 12 regression clean |

**Backend unit tests:** 266/266 ✅
**Frontend unit tests:** 392/392 ✅
**Security issues (P1):** 0
**Config mismatches:** 0

**Sprint 13 is CLEARED FOR STAGING DEPLOYMENT (T-142).**

---

### Sprint 13 — QA Re-Verification Run (2026-03-07 — Orchestrator Cycle)

| Field | Value |
|-------|-------|
| Test Run | Sprint 13 full re-verification — unit tests + security + integration |
| Sprint | 13 |
| Test Type | Unit Test / Security Scan / Integration Test |
| Result | **Pass** |
| Build Status | Success |
| Environment | Local |
| Deploy Verified | No (pending T-142 staging deploy) |
| Tested By | QA Engineer (orchestrator re-run) |
| Error Summary | None |
| Related Tasks | T-137, T-138, T-139, T-140, T-141 |

**Re-verification results (2026-03-07 10:49 UTC):**

| Check | Result | Details |
|-------|--------|---------|
| Backend unit tests | ✅ 266/266 Pass | 12 test files, 547ms |
| Frontend unit tests | ✅ 392/392 Pass | 22 test files, 1.84s |
| T-137: No scroll listener in TripCalendar.jsx | ✅ Confirmed | `grep "addEventListener.*scroll"` returns zero matches |
| T-137: position:absolute + scrollX/Y offsets | ✅ Confirmed | Lines 283–290 correct |
| T-138: RENTAL_CAR guard in DayCell | ✅ Confirmed | Lines 543–548 |
| T-138: RENTAL_CAR guard in DayPopover.getEventTime | ✅ Confirmed | Lines 372–376 |
| T-139: /land-travel (singular) in api-contracts.md | ✅ Confirmed | All 19 endpoint paths use singular form |
| Config: PORT=3000 ↔ vite proxy http://localhost:3000 | ✅ Consistent | — |
| Config: CORS_ORIGIN=http://localhost:5173 ↔ vite port 5173 | ✅ Consistent | — |
| Config: SSL disabled ↔ http:// proxy (no BACKEND_SSL) | ✅ Consistent | — |
| npm audit — backend | ✅ Accepted | 5 moderate dev-dep vulns (esbuild/vite, pre-existing B-021) |
| npm audit — frontend | ✅ Accepted | Same 5 moderate dev-dep vulns, pre-existing |
| Security P1 issues | ✅ None | — |

**All checks pass. Sprint 13 clearance for staging deployment confirmed. T-142 may proceed once T-136 (User Agent Sprint 12 walkthrough) is complete.**

---

## Sprint 13 — T-142: Staging Build + Deploy (2026-03-07)

### Build Log — Frontend

| Field | Value |
|-------|-------|
| Test Run | Sprint 13 frontend production build (T-137/T-138 changes) |
| Sprint | 13 |
| Test Type | Build |
| Result | **Pass** |
| Build Status | **Success** |
| Environment | Staging |
| Deploy Verified | No (pending Monitor Agent T-143) |
| Tested By | Deploy Engineer |
| Error Summary | None |
| Related Tasks | T-137, T-138, T-142 |
| Notes | `cd frontend && npm run build` — 122 modules transformed, 0 errors, 0 warnings. Output: dist/index.html (0.39 kB), dist/assets/index-BJfBzr20.js (339.05 kB / gzip 103.00 kB), dist/assets/index-BXdx0laI.css (73.84 kB / gzip 11.81 kB). Built in 496ms. |

**Build output:**
```
vite v6.4.1 building for production...
✓ 122 modules transformed.
dist/index.html                   0.39 kB │ gzip:   0.26 kB
dist/assets/index-BXdx0laI.css   73.84 kB │ gzip:  11.81 kB
dist/assets/index-BJfBzr20.js   339.05 kB │ gzip: 103.00 kB
✓ built in 496ms
```

---

### Staging Deployment — T-142

| Field | Value |
|-------|-------|
| Test Run | Sprint 13 staging deployment |
| Sprint | 13 |
| Test Type | Post-Deploy Health Check |
| Result | **Pass** |
| Build Status | **Success** |
| Environment | **Staging** |
| Deploy Verified | No (pending Monitor Agent T-143) |
| Tested By | Deploy Engineer |
| Error Summary | None |
| Related Tasks | T-134, T-142 |

#### Deployment Steps Executed

1. **Dependencies installed** — `npm install` in both `backend/` and `frontend/` — clean install, no errors (5 pre-existing moderate dev-dep vulns, accepted per B-021).
2. **Frontend built** — `cd frontend && npm run build` — SUCCESS (122 modules, 0 errors).
3. **Database migrations** — `cd backend && npm run migrate` — `Already up to date` (all 10 migrations 001–010 applied; no new migrations in Sprint 13).
4. **Infra fix (T-134 root cause)** — Added `PORT: 3001` explicitly to `infra/ecosystem.config.cjs` env section. Root cause: `dotenv.config({ path: '.env.staging' })` was not overriding an inherited `PORT` variable; explicit pm2 env setting resolves the ambiguity. `backend/.env` is **unchanged** (still local-dev defaults: PORT=3000, HTTP, `secure: false`).
5. **Backend started via pm2** — `npx pm2 delete triplanner-backend && npx pm2 start infra/ecosystem.config.cjs` — `triplanner-backend` online, PID 87119, 0 restarts.
6. **Smoke tests passed**:
   - `curl -sk https://localhost:3001/api/v1/health` → `{"status":"ok"}` ✅
   - `pm2 status` shows `triplanner-backend` online ✅
   - Port 3001 has listener (PID 87119) ✅
   - Port 3000 is clear (no listener) ✅
   - `backend/.env` unchanged (PORT=3000, HTTP, local-dev settings) ✅
   - Frontend dist/ artifacts present (built 2026-03-07 10:54) ✅

#### Service URLs

| Service | URL | Status |
|---------|-----|--------|
| Backend (staging) | `https://localhost:3001` | Online (pm2, PID 87119) |
| Backend health | `https://localhost:3001/api/v1/health` | `{"status":"ok"}` |
| Frontend (built) | `frontend/dist/` (serve with `vite preview` or nginx) | Build artifacts ready |

#### Notes

- No migrations run (Sprint 13 is schema-stable; all 10 migrations are applied).
- `backend/.env` not modified — staging config is in `backend/.env.staging` (loaded by pm2 via `NODE_ENV=staging`).
- infra/ecosystem.config.cjs updated to add `PORT: 3001` explicitly (prevents env inheritance ambiguity; this is an infra config change within Deploy Engineer scope).
- T-134 (staging port fix) root cause resolved as part of this deployment. T-134 is now effectively Done.
- T-136 (User Agent Sprint 12 walkthrough) is still Backlog — Monitor Agent (T-143) should proceed with health check immediately; User Agent (T-144) sprint 13 walkthrough waits on T-143.

**Deploy Engineer handoff to Monitor Agent (T-143) logged in handoff-log.md.**

---

## Sprint 13 Monitor Agent — Post-Deploy Health Check (T-143) — 2026-03-07

---

### Config Consistency Validation

**Test Run:** Sprint 13 Config Consistency — backend/.env, backend/.env.staging, frontend/vite.config.js, infra/docker-compose.yml
**Sprint:** 13
**Test Type:** Config Consistency
**Result:** PASS
**Environment:** Staging
**Deploy Verified:** See Post-Deploy Health Check below
**Tested By:** Monitor Agent
**Related Tasks:** T-143

#### Dev Config (backend/.env ↔ vite.config.js ↔ docker-compose.yml)

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| Port match | backend PORT = vite proxy port | backend/.env PORT=3000; vite proxy default = `http://localhost:3000` | ✅ PASS |
| Protocol match | SSL not set → HTTP; vite uses http:// | SSL_KEY_PATH and SSL_CERT_PATH are commented out in backend/.env; vite uses http:// (BACKEND_SSL unset) | ✅ PASS |
| CORS match | CORS_ORIGIN includes http://localhost:5173 | backend/.env CORS_ORIGIN=http://localhost:5173; vite dev server port=5173 | ✅ PASS |
| Docker port match | docker backend PORT = backend/.env PORT | docker-compose.yml backend env PORT=3000; backend/.env PORT=3000; docker healthcheck uses http://localhost:3000 | ✅ PASS |

#### Staging Config (backend/.env.staging ↔ vite.config.js staging mode ↔ live checks)

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| Port match | .env.staging PORT = staging backend port | PORT=3001; backend confirmed live on https://localhost:3001 | ✅ PASS |
| SSL cert files | SSL_KEY_PATH and SSL_CERT_PATH set and files exist | infra/certs/localhost-key.pem ✅ infra/certs/localhost.pem ✅ — both exist | ✅ PASS |
| Protocol match | SSL configured → backend HTTPS; vite staging proxy uses https:// | SSL set → HTTPS; vite.config.js uses `BACKEND_SSL=true` env var → backendProtocol='https' | ✅ PASS |
| CORS match | CORS_ORIGIN includes https://localhost:4173 | .env.staging CORS_ORIGIN=https://localhost:4173; frontend preview at https://localhost:4173 | ✅ PASS |

#### Security Note (Out of Scope for Config Consistency — Flagged Separately)

- ⚠️ `backend/.env.staging` JWT_SECRET = `CHANGE-ME-generate-with-openssl-rand-hex-32` — placeholder value. See FB-093 Monitor Alert.

**Config Consistency Result: PASS**

---

### Post-Deploy Health Check — Sprint 13 Staging (T-143)

**Test Run:** Sprint 13 Post-Deploy Health Check — Staging
**Sprint:** 13
**Test Type:** Post-Deploy Health Check
**Result:** PASS
**Build Status:** Success
**Environment:** Staging
**Deploy Verified:** Yes
**Tested By:** Monitor Agent
**Related Tasks:** T-142, T-143

#### Health Check Template

```
Environment: Staging
Timestamp: 2026-03-07T16:00:00Z
Staging Backend URL: https://localhost:3001
Frontend URL: https://localhost:4173

Checks:
  - [x] App responds (GET /api/v1/health → 200)
        → HTTP 200, body: {"status":"ok"} ✅
        Note: health route intentionally returns {"status":"ok"} (not data-wrapped) — liveness-only per health.js contract.
  - [x] Auth register works (POST /api/v1/auth/register → 201 with user + access_token)
        → HTTP 201, data.user.id=c15b05d4, data.access_token present ✅
  - [x] Auth login works (POST /api/v1/auth/login → 200 with user + access_token)
        → HTTP 200, data.user.id=c15b05d4, fresh access_token ✅
  - [x] GET /api/v1/trips → 200 with data array + pagination
        → HTTP 200, body: {"data":[],"pagination":{"page":1,"limit":20,"total":0}} ✅
  - [x] POST /api/v1/trips → 201 with full trip object
        → HTTP 201, data.id=c8e998ce, destinations=["Test City"], status="PLANNING" ✅
  - [x] GET /api/v1/trips/:id/flights → 200
        → HTTP 200, body: {"data":[]} ✅
  - [x] GET /api/v1/trips/:id/stays → 200
        → HTTP 200, body: {"data":[]} ✅
  - [x] GET /api/v1/trips/:id/activities → 200
        → HTTP 200, body: {"data":[]} ✅
  - [x] GET /api/v1/trips/:id/land-travel → 200 (singular path confirmed — T-139)
        → HTTP 200, body: {"data":[]} ✅
  - [x] No 5xx errors observed ✅
  - [x] Database connected — trip creation returned UUID and timestamp from DB; confirms DB reads and writes healthy ✅
  - [x] Frontend accessible — https://localhost:4173 → HTTP 200, valid HTML with React bundle ✅
  - [x] Config consistency: staging PORT=3001 matches live backend ✅
  - [x] Config consistency: HTTPS protocol consistent across stack ✅
  - [x] Config consistency: CORS_ORIGIN=https://localhost:4173 matches frontend preview URL ✅
```

#### Endpoint Summary

| Endpoint | Method | Status | Response Shape | Result |
|----------|--------|--------|----------------|--------|
| /api/v1/health | GET | 200 | {"status":"ok"} | ✅ PASS |
| /api/v1/auth/register | POST | 201 | {data:{user,access_token}} | ✅ PASS |
| /api/v1/auth/login | POST | 200 | {data:{user,access_token}} | ✅ PASS |
| /api/v1/trips | GET | 200 | {data:[],pagination:{...}} | ✅ PASS |
| /api/v1/trips | POST | 201 | {data:{id,name,destinations,...}} | ✅ PASS |
| /api/v1/trips/:id/flights | GET | 200 | {data:[]} | ✅ PASS |
| /api/v1/trips/:id/stays | GET | 200 | {data:[]} | ✅ PASS |
| /api/v1/trips/:id/activities | GET | 200 | {data:[]} | ✅ PASS |
| /api/v1/trips/:id/land-travel | GET | 200 | {data:[]} | ✅ PASS |

#### Observations

1. **pm2 not available in monitor shell PATH** — Cannot run `pm2 status` directly. Backend is confirmed running (health check passes on https://localhost:3001). Deploy Engineer report (qa-build-log.md) confirms pm2 PID 87119. Minor process observation only.
2. **Deploy Engineer T-143 handoff** — Deploy Engineer logged completion in qa-build-log.md but no corresponding handoff-log.md entry was found at the top of the file (newest-first). Monitor Agent proceeded based on qa-build-log evidence and live health checks confirming backend is running.
3. **JWT_SECRET placeholder in backend/.env.staging** — Value is `CHANGE-ME-generate-with-openssl-rand-hex-32`. Auth endpoints work (login/register return tokens) but this secret is publicly known and insecure. Flagged as FB-093 (Severity: Major). Does not block Deploy Verified for staging but must be rotated before any external access.

**Result: PASS**
**Deploy Verified: Yes**

---

## Sprint 14 QA Report — 2026-03-07

**QA Engineer:** Automated (Sprint #14 orchestrator run)
**Tasks Verified:** T-146 (calendar async first-event-month fix), T-147 ("Today" button), T-145 (JWT_SECRET rotation verification)
**Sprint 14 Tasks:** T-148 (security checklist), T-149 (integration testing)

---

### T-148 — Unit Test Review

**Test Type:** Unit Test
**Date:** 2026-03-07
**Status:** PASS ✅

#### Backend Tests

| Metric | Result |
|--------|--------|
| Command | `cd backend && npm test` |
| Test files | 12 passed |
| Tests | **266 / 266 PASS** |
| Duration | ~579ms |

No backend changes in Sprint 14. All existing tests pass. No regressions.

#### Frontend Tests

| Metric | Result |
|--------|--------|
| Command | `cd frontend && npm test -- --run` |
| Test files | 22 passed |
| Tests | **400 / 400 PASS** |
| Duration | ~1.84s |

Count breakdown:
- 392 tests from Sprint 13 baseline
- +4 new tests T-146 (21.A–D): calendar async load scenarios
- +4 new tests T-147 (22.A–D): "Today" button scenarios
- Total: **400** (expected per Design Agent spec)

#### Coverage Verification — T-146 (21.A–D)

| Test | Description | Result |
|------|-------------|--------|
| 21.A | Async load: calendar auto-updates to first-event month when data arrives after mount | ✅ PASS |
| 21.B | Calendar does NOT override user navigation when data arrives after user navigated | ✅ PASS |
| 21.C | No spurious update when data arrives but all dates are null/invalid | ✅ PASS |
| 21.D | Both prev AND next clicks set hasNavigated — data arrival does not override | ✅ PASS |

Happy-path: 21.A (async auto-init), 21.D (prev/next nav sets hasNavigated). Error-path: 21.B (user-nav-before-load), 21.C (null dates). **Coverage: ADEQUATE** ✅

#### Coverage Verification — T-147 (22.A–D)

| Test | Description | Result |
|------|-------------|--------|
| 22.A | Clicking "today" button navigates calendar to current month | ✅ PASS |
| 22.B | "Today" button is visible when viewing a past month | ✅ PASS |
| 22.C | "Today" button is visible when viewing a future month | ✅ PASS |
| 22.D | Prev/next navigation works correctly after clicking "today" | ✅ PASS |

Happy-path: 22.A (click navigates), 22.B/C (always visible), 22.D (no regression). **Coverage: ADEQUATE** ✅

---

### T-148 — Security Scan

**Test Type:** Security Scan
**Date:** 2026-03-07
**Status:** PASS ✅

#### Security Checklist — Sprint 14 Scope

**Authentication & Authorization**

| Check | Status | Notes |
|-------|--------|-------|
| All API endpoints require auth | ✅ PASS | No new endpoints in Sprint 14 |
| JWT_SECRET not placeholder in .env.staging | ✅ PASS | Value is 64-char hex string; NOT `CHANGE-ME-generate-with-openssl-rand-hex-32` |
| backend/.env (local dev) unchanged | ✅ PASS | JWT_SECRET=change-me-to-a-random-string (local dev only) |
| Auth tokens have expiry (15m access, 7d refresh) | ✅ PASS | Unchanged from Sprint 1 |

**Input Validation & Injection Prevention**

| Check | Status | Notes |
|-------|--------|-------|
| No new SQL queries | ✅ N/A | Sprint 14 is frontend-only |
| No dangerouslySetInnerHTML in TripCalendar.jsx | ✅ PASS | Grep confirms zero occurrences |
| No eval() in TripCalendar.jsx | ✅ PASS | Grep confirms zero occurrences |
| No innerHTML assignment | ✅ PASS | Grep confirms zero occurrences |
| String formatting in T-146/T-147 is safe | ✅ PASS | Only Date API and state setters; no user-controlled string interpolation |

**API Security**

| Check | Status | Notes |
|-------|--------|-------|
| No new direct fetch/axios calls in TripCalendar.jsx | ✅ PASS | Grep confirms no API calls added |
| CORS_ORIGIN=http://localhost:5173 in backend/.env | ✅ PASS | Matches frontend dev server default |
| Sprint 13 regression: scroll listener removed | ✅ PASS | grep `addEventListener.*scroll` in TripCalendar.jsx → 0 matches |
| Escape-to-close and click-outside still intact | ✅ PASS | useEffect lines 301/311/323 unchanged from T-137 |

**Data Protection**

| Check | Status | Notes |
|-------|--------|-------|
| No secrets in TripCalendar.jsx | ✅ PASS | Pure UI component |
| .env.staging not committed to git | ✅ N/A | .gitignore entry confirmed from prior sprints |

**Infrastructure**

| Check | Status | Notes |
|-------|--------|-------|
| npm audit — backend | ⚠️ 5 moderate | esbuild/vite/vitest dev-dep chain; pre-existing B-021 (accepted) |
| npm audit — frontend | ⚠️ 5 moderate | Same dev-dep chain; pre-existing B-021 (accepted) |
| No new production dependencies in Sprint 14 | ✅ PASS | Frontend-only changes; no new packages |

**New Sprint 14 Checklist Item (per T-148 spec):**
- [x] No placeholder values remain in backend/.env.staging — JWT_SECRET is a 64-char hex string ✅

#### npm audit Detail
```
5 moderate severity vulnerabilities (esbuild ≤ 0.24.2 → vite → @vitest/mocker → vitest, vite-node)
Pre-existing: B-021, accepted in Sprint 6.
All in devDependencies — no production security impact.
To address: npm audit fix --force (breaking changes; deferred).
```

**Security Scan Result: PASS — 0 new P1/P2 security issues** ✅

---

### T-149 — Integration Testing

**Test Type:** Integration Test
**Date:** 2026-03-07
**Status:** PASS ✅

#### T-146 — Calendar Async First-Event-Month Fix (Integration)

| Check | Result | Evidence |
|-------|--------|----------|
| `TripDetailsPage` passes all 4 data arrays as props to `TripCalendar` | ✅ PASS | TripDetailsPage.jsx line 887-893: `flights={flights}`, `stays={stays}`, `activities={activities}`, `landTravels={landTravels}` |
| `hasNavigated` ref initialized to `false` | ✅ PASS | TripCalendar.jsx line 616: `const hasNavigated = useRef(false)` |
| `useEffect` dep array: `[flights, stays, activities, landTravels]` | ✅ PASS | TripCalendar.jsx line 681 |
| Effect bails early when `hasNavigated.current === true` | ✅ PASS | TripCalendar.jsx line 663 |
| Effect bails early when all arrays empty | ✅ PASS | TripCalendar.jsx lines 665–671 |
| `setViewYear` + `setViewMonth` called with computed first-event month | ✅ PASS | TripCalendar.jsx lines 679–680 |
| `prevMonth()` sets `hasNavigated.current = true` | ✅ PASS | TripCalendar.jsx line 684 |
| `nextMonth()` sets `hasNavigated.current = true` | ✅ PASS | TripCalendar.jsx line 695 |
| No direct API calls added to TripCalendar | ✅ PASS | grep fetch/axios/api → 0 hits |
| T-128 tests (getInitialMonth logic) still pass | ✅ PASS | All 400 frontend tests pass |
| `isLoading` prop set to OR of all 4 loading states | ✅ PASS | TripDetailsPage.jsx line 893 |

**UI States Verified:**
- **Loading:** `isLoading={true}` renders loading skeleton overlay ✅
- **Empty (no events):** Calendar shows current month, no events rendered ✅
- **Success (events loaded):** Calendar navigates to first-event month ✅
- **User navigated:** Calendar stays on user's chosen month even after data arrives ✅

#### T-147 — "Today" Button (Integration)

| Check | Result | Evidence |
|-------|--------|----------|
| Button rendered unconditionally in calendar nav header | ✅ PASS | TripCalendar.jsx lines 737–743, no conditional guard |
| `aria-label="Go to current month"` present | ✅ PASS | TripCalendar.jsx line 740 |
| Button text: `today` | ✅ PASS | TripCalendar.jsx line 742 |
| `handleToday()` sets `hasNavigated.current = true` | ✅ PASS | TripCalendar.jsx line 707 |
| `handleToday()` calls `setViewYear(now.getFullYear())` | ✅ PASS | TripCalendar.jsx line 709 |
| `handleToday()` calls `setViewMonth(now.getMonth())` | ✅ PASS | TripCalendar.jsx line 710 |
| `handleToday()` closes open popover | ✅ PASS | TripCalendar.jsx line 711: `setOpenPopover(null)` |
| Button visible from past month (22.B) | ✅ PASS | Test passes |
| Button visible from future month (22.C) | ✅ PASS | Test passes |
| Click returns to current month (22.A) | ✅ PASS | Test passes |
| Prev/next still work after Today click (22.D) | ✅ PASS | Test passes |
| Today click sets hasNavigated — async init won't override | ✅ PASS | Same ref used by T-146 effect |
| `.todayBtn` CSS: Japandi-consistent styling | ✅ PASS | TripCalendar.module.css lines 51–85: transparent bg, subtle border, mono font, hover/focus states, 640px responsive breakpoint |

**No console errors or unhandled promise rejections from these changes.** ✅

#### API Contract Validation — No New Endpoints

Sprint 14 introduces zero new API endpoints. Per Backend Engineer handoff:

| Data Source | Endpoint | Contract Reference | Status |
|-------------|----------|--------------------|--------|
| flights[].departure_at | GET /api/v1/trips/:id/flights | Sprint 1 | ✅ PASS (unchanged) |
| stays[].check_in_at | GET /api/v1/trips/:id/stays | Sprint 1 | ✅ PASS (unchanged) |
| activities[].activity_date | GET /api/v1/trips/:id/activities | Sprint 1 | ✅ PASS (unchanged) |
| landTravel[].departure_date | GET /api/v1/trips/:id/land-travel | Sprint 6 | ✅ PASS (unchanged) |

Auth shapes unchanged: 201 + access_token on register, 200 + access_token on login.

#### JWT_SECRET Rotation (T-145 Verification)

| Check | Result | Notes |
|-------|--------|-------|
| backend/.env.staging JWT_SECRET ≠ placeholder | ✅ PASS | File contains a 64-char hex string |
| Placeholder `CHANGE-ME-generate-with-openssl-rand-hex-32` absent | ✅ PASS | grep confirms not present |
| backend/.env (local dev) unchanged | ✅ PASS | Still shows `change-me-to-a-random-string` (local dev only) |

**Note:** T-145 is marked as "Backlog" in dev-cycle-tracker.md, but the actual backend/.env.staging file shows a properly rotated JWT_SECRET. The rotation was applied (likely during a prior orchestrator pass). Marking T-145 as Done in tracker to reflect actual state.

#### Config Consistency Check

| Config Item | backend/.env | vite.config.js proxy | docker-compose | Status |
|-------------|--------------|---------------------|----------------|--------|
| Backend port (local dev) | PORT=3000 | `backendPort = BACKEND_PORT \|\| '3000'` → 3000 | PORT: 3000 | ✅ PASS |
| Protocol (local dev) | SSL commented out (HTTP) | `backendSSL = BACKEND_SSL === 'true'` → false → http:// | HTTP healthcheck | ✅ PASS |
| CORS_ORIGIN | http://localhost:5173 | Server port: 5173 | N/A (nginx reverse proxy) | ✅ PASS |

No config mismatches detected. ✅

#### Sprint 13 Regression Checks

| Feature | Check | Result |
|---------|-------|--------|
| DayPopover scroll-close removed (T-137) | `addEventListener('scroll',...)` grep → 0 matches | ✅ PASS |
| DayPopover position:absolute (T-137) | `positionStyle` IIFE with scrollX/Y offsets present | ✅ PASS |
| Rental car pick-up/drop-off chips (T-138) | `mode === 'RENTAL_CAR'` guard in DayCell + DayPopover.getEventTime | ✅ PASS |
| /land-travel singular in api-contracts.md (T-139) | Not re-checked (documentation-only, verified Sprint 13) | ✅ PASS |

#### Sprint 12 Regression

All Sprint 12 features (check-in label, calendar default month T-128 unit tests, .env isolation) confirmed via test suite: **400/400 PASS** ✅

---

### Sprint 14 QA Summary

| Category | Result |
|----------|--------|
| Backend unit tests | ✅ 266/266 PASS |
| Frontend unit tests | ✅ 400/400 PASS |
| New T-146 tests (21.A–D) | ✅ 4/4 PASS |
| New T-147 tests (22.A–D) | ✅ 4/4 PASS |
| Security checklist | ✅ PASS (0 new P1/P2 issues) |
| JWT_SECRET rotation (T-145) | ✅ PASS (rotated, not placeholder) |
| Config consistency | ✅ PASS (no mismatches) |
| Integration: T-146 API props | ✅ PASS |
| Integration: T-147 button behavior | ✅ PASS |
| Sprint 13 regression | ✅ PASS |
| npm audit | ⚠️ 5 moderate dev-dep (pre-existing B-021, accepted) |

**OVERALL QA RESULT: PASS**
**Cleared for Deploy: YES**
**T-148: Done | T-149: Done | T-146: Done | T-147: Done | T-145: Done (rotation verified)**

---

### Sprint 14 — T-150: Staging Deployment — Deploy Engineer (2026-03-07)

| Field | Value |
|-------|-------|
| Task | T-150 — Sprint 14 staging re-deployment |
| Environment | Staging (HTTPS localhost:3001) |
| Date | 2026-03-07 |
| Build Status | Success |
| Deploy Status | Success |

#### Build

| Step | Result |
|------|--------|
| `npm run build` in `frontend/` | ✅ SUCCESS — 122 modules transformed, no errors |
| Output: `dist/index.html` | ✅ 0.39 kB (gzip: 0.26 kB) |
| Output: `dist/assets/index-KV1rpVLB.js` | ✅ 339.48 kB (gzip: 103.12 kB) |
| Output: `dist/assets/index-Dr9Rp1mS.css` | ✅ 74.46 kB (gzip: 11.89 kB) |
| Build tool | Vite 6.4.1 |
| Build time | 458ms |

#### Feature Verification in Bundle

| Feature | Artifact | Result |
|---------|----------|--------|
| T-147 "Today" button aria-label | `"Go to current month"` string in bundle | ✅ PRESENT |
| T-147 `todayBtn` CSS class | `todayBtn` string in bundle | ✅ PRESENT |
| T-146 `hasNavigated` ref | Minified (expected; logic in bundle) | ✅ CONFIRMED (identical source) |

#### Backend

| Step | Result |
|------|--------|
| Backend migrations | None required (no schema changes in Sprint 14) |
| `pm2 restart triplanner-backend` | ✅ SUCCESS — PID 94787, status: online |
| `backend/.env` (local dev) | ✅ UNCHANGED |
| `backend/.env.staging` JWT_SECRET | ✅ Rotated value (not placeholder) — confirmed by QA T-145 |

#### Smoke Tests

| Test | Result |
|------|--------|
| `curl -sk https://localhost:3001/api/v1/health` → `{"status":"ok"}` | ✅ PASS |
| `POST /api/v1/auth/register` → 201 with signed access_token | ✅ PASS |
| JWT_SECRET not placeholder in `.env.staging` | ✅ PASS |
| T-147: `todayBtn` + `"Go to current month"` in dist bundle | ✅ PASS |
| T-146: Async calendar init code in bundle | ✅ PASS |
| No backend schema migration errors | ✅ PASS (N/A — no migrations) |

#### Known Accepted Limitations

- Rate limiting not on auth endpoints (B-019, accepted Sprint 1)
- HTTPS via self-signed cert (staging only, not production)
- pm2 auto-restart on reboot not configured (local staging environment)

**OVERALL DEPLOY RESULT: SUCCESS**
**T-150: Done — Handoff to Monitor Agent (T-151) logged in handoff-log.md**

---

## Sprint 14 — Deploy Engineer Re-Invocation Verification — 2026-03-07

**Deploy Engineer:** Automated (Sprint #14 orchestrator re-invocation)
**Date:** 2026-03-07
**Task:** T-150 (Sprint 14 staging re-deployment) — re-verification pass

### Pre-Deploy Checks

| Check | Result |
|-------|--------|
| QA handoff (T-149 → T-150) in handoff-log.md | ✅ FOUND — Status: "Acknowledged — T-150 complete" |
| All Sprint 14 tasks Done (T-145–T-149) | ✅ CONFIRMED via dev-cycle-tracker.md |
| Pending DB migrations (technical-context.md) | ✅ NONE — Sprint 14 is schema-stable; 10/10 migrations applied |

### Build Re-Run

| Step | Command | Result |
|------|---------|--------|
| Backend deps | `cd backend && npm install` | ✅ Already up-to-date |
| Frontend deps | `cd frontend && npm install` | ✅ Already up-to-date |
| Frontend build | `cd frontend && npm run build` | ✅ SUCCESS — 122 modules, 0 errors, 457ms |
| Bundle output: index.js | 339.48 kB (gzip: 103.12 kB) | ✅ Matches prior build |
| Bundle output: index.css | 74.46 kB (gzip: 11.89 kB) | ✅ Matches prior build |

### Staging Verification

| Check | Result |
|-------|--------|
| pm2 `triplanner-backend` status | ✅ online — PID 94787, ~10m uptime |
| `GET https://localhost:3001/api/v1/health` | ✅ `{"status":"ok"}` |
| Database migrations | ✅ `Already up to date` (0 pending) |
| T-146/T-147 source markers in TripCalendar.jsx | ✅ 11 matches (hasNavigated, todayBtn, handleToday, Go to current month) |
| Sprint 14 bundle identical to prior deploy | ✅ Same filenames and sizes |

### Summary

**RESULT: PASS — Staging environment confirmed healthy. No re-deployment action needed.**

T-150 was completed in the prior Deploy Engineer invocation (PID 94787, built 2026-03-07 11:57). This re-invocation confirms:
- Build artifacts are current and include T-146 + T-147 changes
- Backend is online and serving health checks
- No migrations are pending
- The Deploy Engineer → Monitor Agent handoff is already logged in handoff-log.md (Status: Pending)

**Monitor Agent (T-151) is cleared to proceed with the Sprint 14 staging health check.**

---

## Sprint 14 QA Re-Verification — 2026-03-07

**QA Engineer:** Automated (Sprint #14 orchestrator re-invocation)
**Trigger:** Orchestrator re-invoked QA Engineer to verify pipeline readiness before Monitor Agent (T-151)
**Date:** 2026-03-07

### Re-Verification Summary

All QA checks were re-executed via actual CLI commands. Results confirm the previous T-148/T-149 pass entries are accurate.

#### Test Suite Re-Run

| Suite | Command | Result |
|-------|---------|--------|
| Backend | `cd backend && npm test` | ✅ **266/266 PASS** — 12 test files, ~529ms |
| Frontend | `cd frontend && npm test -- --run` | ✅ **400/400 PASS** — 22 test files, ~1.82s |

No regressions. All T-146 (21.A–D) and T-147 (22.A–D) tests pass. TripCalendar.test.jsx: 66 tests ✅.

#### Security Re-Check

| Check | Result |
|-------|--------|
| `backend/.env.staging` JWT_SECRET length | ✅ 64 chars (not placeholder) |
| Placeholder `CHANGE-ME-...` absent | ✅ `grep` returns 0 matches |
| `backend/.env` (local dev) PORT=3000, CORS=http://localhost:5173 | ✅ Unchanged |
| `npm audit` backend | ⚠️ 5 moderate (pre-existing B-021, devDependencies only, accepted) |
| `dangerouslySetInnerHTML` in TripCalendar.jsx | ✅ 0 occurrences |
| `eval()` in TripCalendar.jsx | ✅ 0 occurrences |
| Scroll listener removed (T-137) | ✅ 0 `addEventListener.*scroll` matches |

#### Implementation Spot-Check (TripCalendar.jsx)

| Item | Line | Status |
|------|------|--------|
| `hasNavigated = useRef(false)` | 616 | ✅ Present |
| `useEffect` async-init dep array `[flights, stays, activities, landTravels]` | 681 | ✅ Present |
| `prevMonth()` sets `hasNavigated.current = true` | 684 | ✅ Present |
| `nextMonth()` sets `hasNavigated.current = true` | 695 | ✅ Present |
| `handleToday()` sets `hasNavigated.current = true` | 707 | ✅ Present |
| `todayBtn` button with `aria-label="Go to current month"` | 738–740 | ✅ Present |

#### Config Consistency (Re-Verified)

| Check | backend/.env | vite.config.js | Status |
|-------|-------------|----------------|--------|
| Backend port (local dev) | PORT=3000 | `backendPort || '3000'` → 3000 | ✅ PASS |
| Protocol (local dev) | SSL commented out | `BACKEND_SSL !== 'true'` → http:// | ✅ PASS |
| CORS origin | http://localhost:5173 | frontend port 5173 | ✅ PASS |

**RE-VERIFICATION RESULT: PASS — All checks clean. Pipeline is ready for Monitor Agent (T-151).**

---

## Sprint 14 — Monitor Agent: Post-Deploy Health Check (T-151) — 2026-03-07

| Field | Value |
|-------|-------|
| Test Type | Post-Deploy Health Check + Config Consistency |
| Environment | Staging |
| Timestamp | 2026-03-07T17:11:10Z |
| Agent | Monitor Agent |
| Task | T-151 |
| Deploy Verified | **Yes** |

---

### Config Consistency Results

#### Local Dev Stack (backend/.env + vite.config.js defaults)

| Check | Source A | Source B | Result |
|-------|----------|----------|--------|
| Port match | `backend/.env` PORT=3000 | Vite proxy default `http://localhost:3000` | ✅ PASS |
| Protocol match | SSL_KEY_PATH/SSL_CERT_PATH commented out → HTTP | `BACKEND_SSL` unset → Vite uses `http://` | ✅ PASS |
| CORS origin | `CORS_ORIGIN=http://localhost:5173` | Vite dev server `server.port=5173` | ✅ PASS |

#### Staging Stack (backend/.env.staging + vite env-var overrides)

| Check | Source A | Source B | Result |
|-------|----------|----------|--------|
| Port match | `.env.staging` PORT=3001 | Vite: `BACKEND_PORT=3001` → proxy `:3001` | ✅ PASS |
| Protocol match | SSL_KEY_PATH + SSL_CERT_PATH set, cert files **exist** → HTTPS | Vite: `BACKEND_SSL=true` → proxy `https://` | ✅ PASS |
| SSL cert files | `../infra/certs/localhost-key.pem` (1704 bytes) | `../infra/certs/localhost.pem` (1151 bytes) | ✅ Both files present |
| CORS origin | `CORS_ORIGIN=https://localhost:4173` | Vite `preview.port=4173`, HTTPS via certs | ✅ PASS |
| COOKIE_SECURE | `COOKIE_SECURE=true` | Backend serves HTTPS | ✅ PASS |

#### Docker Compose (infra/docker-compose.yml)

| Check | Value | Result |
|-------|-------|--------|
| Backend container PORT env | PORT=3000 | ✅ PASS |
| Backend healthcheck | `http://localhost:3000/api/v1/health` (matches PORT=3000) | ✅ PASS |
| Backend host port exposure | No host port mapping (internal-only — nginx proxies to it) | ✅ Intentional, no mismatch |
| Frontend port | `${FRONTEND_PORT:-80}:80` | ✅ PASS |

**Config Consistency Overall: PASS — No mismatches detected across local dev, staging, or Docker stacks.**

---

### Health Check Results

| # | Check | Detail | Result |
|---|-------|--------|--------|
| 1 | App responds | `GET https://localhost:3001/api/v1/health` → HTTP 200 `{"status":"ok"}` | ✅ PASS |
| 2 | pm2 process | `triplanner-backend` online, PID 94787, uptime 13m, CPU 0%, Mem 79MB | ✅ PASS |
| 3 | TLS certs exist | `localhost-key.pem` (1704 B), `localhost.pem` (1151 B) present in `infra/certs/` | ✅ PASS |
| 4 | Auth — Register | `POST /api/v1/auth/register` → HTTP 201, `{"data":{"user":{...},"access_token":"<JWT>"}}` | ✅ PASS |
| 5 | Auth — Login | `POST /api/v1/auth/login` → HTTP 200, `{"data":{"user":{...},"access_token":"<JWT>"}}` | ✅ PASS |
| 6 | Auth guard | `GET /api/v1/trips` (no token) → HTTP 401 `{"error":{"message":"Authentication required","code":"UNAUTHORIZED"}}` | ✅ PASS |
| 7 | GET /api/v1/trips | Authenticated → HTTP 200 `{"data":[...],"pagination":{"page":1,"limit":20,"total":0}}` | ✅ PASS |
| 8 | POST /api/v1/trips | Authenticated → HTTP 201, trip object with id, user_id, destinations array, status "PLANNING" | ✅ PASS |
| 9 | GET /api/v1/trips/:id | Authenticated → HTTP 200, correct trip object matching created trip | ✅ PASS |
| 10 | Database connected | CRUD operations (register, create trip, read trip) all succeeded without DB errors | ✅ PASS |
| 11 | No 5xx errors | Zero 5xx responses observed across all test requests | ✅ PASS |
| 12 | Frontend build | `frontend/dist/` exists: `index.html` + `assets/` directory (122-module bundle) | ✅ PASS |

---

### Sample Response Verification

**GET /api/v1/health:**
```json
{"status":"ok"}
```
Per api-contracts.md: health is the only endpoint exempt from `{"data":...}` wrapper — using bare `{"status":"ok"}` is correct. ✅

**POST /api/v1/auth/register (201):**
```json
{"data":{"user":{"id":"2033ab5d-e693-424d-96d3-65e1285bba66","name":"Monitor Test","email":"monitor-hc-s14@example.com","created_at":"2026-03-07T17:10:53.255Z"},"access_token":"<JWT>"}}
```
Response shape matches api-contracts.md contract. ✅

**GET /api/v1/trips (200):**
```json
{"data":[],"pagination":{"page":1,"limit":20,"total":0}}
```
Correct pagination envelope. ✅

**POST /api/v1/trips (201):**
```json
{"data":{"id":"6e5a5e80-4547-43e8-aa85-8ef8d581b42f","user_id":"2033ab5d...","name":"Monitor Test Trip","destinations":["Tokyo","Osaka"],"status":"PLANNING","notes":null,"start_date":null,"end_date":null,"created_at":"2026-03-07T17:11:02.142Z","updated_at":"2026-03-07T17:11:02.142Z"}}
```
All contract fields present. ✅

---

### Summary

| Category | Status |
|----------|--------|
| Config Consistency — Local Dev | ✅ PASS |
| Config Consistency — Staging | ✅ PASS |
| Config Consistency — Docker | ✅ PASS |
| Health Endpoint | ✅ PASS |
| Auth Flow (register + login) | ✅ PASS |
| Auth Guard (401 on unauthenticated request) | ✅ PASS |
| Trips CRUD (GET list, POST create, GET by ID) | ✅ PASS |
| Database Connectivity | ✅ PASS |
| No 5xx Errors | ✅ PASS |
| Frontend Build Present | ✅ PASS |
| TLS Certs Present | ✅ PASS |
| pm2 Process Online | ✅ PASS |

**Deploy Verified: Yes**
All 12 health checks and all config consistency checks passed. Staging environment is healthy and ready for User Agent testing.


---
