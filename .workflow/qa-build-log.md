# QA & Build Log

Tracks test runs, build results, and post-deploy health checks per sprint. Maintained by QA Engineer, Deploy Engineer, and Monitor Agent.

---

## Sprint #33 — QA Engineer — T-265 Re-Verification + T-266 Integration Check — 2026-03-20

**Task:** T-265 re-verification + T-266 integration check
**Date:** 2026-03-20
**Sprint:** 33
**Status:** ✅ QA PASS — T-266 verified, moved to Done

---

### Unit Test Re-Verification

**Test Type:** Unit Test (Re-Run)

| Suite | Tests | Passed | Failed | Duration |
|-------|-------|--------|--------|----------|
| Backend (23 files) | 410 | 410 | 0 | 2.74s |
| Frontend (25 files) | 501 | 501 | 0 | 1.93s |
| **Total** | **911** | **911** | **0** | **4.67s** |

All tests confirmed passing. No regressions since initial T-265 run.

---

### Security Re-Verification

**Test Type:** Security Scan (Re-Run)

| Check | Result |
|-------|--------|
| npm audit (backend) | ✅ 0 vulnerabilities |
| dangerouslySetInnerHTML in frontend | ✅ None found (only a comment in formatDate.js) |
| eval() / innerHTML in frontend | ✅ None found |
| Hardcoded secrets in frontend | ✅ None found (LoginPage/RegisterPage only have validation messages) |
| Hardcoded secrets in backend | ✅ None found (test_user.js seed + cors.test.js are test-only) |

**Security Re-Verification: ✅ PASS**

---

### Config Consistency Re-Verification

**Test Type:** Config Consistency (Re-Run)

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| Backend PORT (.env) | 3000 | 3000 | ✅ MATCH |
| Vite proxy target port | 3000 | `BACKEND_PORT \|\| '3000'` → 3000 | ✅ MATCH |
| Backend SSL | Disabled (commented out) | Commented out | ✅ OK |
| Vite proxy protocol | http:// | http:// (BACKEND_SSL unset) | ✅ MATCH |
| CORS_ORIGIN | http://localhost:5173 | http://localhost:5173 | ✅ MATCH |
| Docker backend PORT | 3000 | 3000 | ✅ MATCH |

**No config consistency mismatches.**

---

### T-266 Integration Check Verification

T-266 (staging deployment) was reviewed and approved by Manager (CR-33). QA re-verification confirms:

- ✅ All 911/911 unit tests pass (re-run confirmed)
- ✅ Security checklist PASS (re-verified)
- ✅ npm audit: 0 vulnerabilities
- ✅ Config consistency: no mismatches
- ✅ T-264 implementation matches Spec 28 (confirmed in initial T-265 review)
- ✅ Deploy Engineer smoke tests 7/7 PASS (per T-266 handoff)
- ✅ Manager CR-33 approved both T-264 and T-266

**T-266 Integration Check: ✅ PASS — Moved to Done. T-267 (Monitor Agent) is unblocked.**

*QA Engineer Sprint #33 — T-265 Re-Verification + T-266 Integration Check — 2026-03-20*

---

## Sprint #33 — Deploy Engineer — T-266 Staging Deployment — 2026-03-20

**Task:** T-266 (Deploy Engineer — Sprint 33 staging deployment)
**Date:** 2026-03-20
**Sprint:** 33
**Environment:** Staging
**Build Status:** ✅ SUCCESS

---

### Build Details

| Item | Value |
|------|-------|
| Build command | `cd frontend && npm run build` |
| Build tool | Vite 6.4.1 |
| Build time | 491ms |
| Modules transformed | 129 |
| Main JS bundle | `index-DWDNtgu6.js` (296.93 KB / 94.92 KB gzip) |
| Main CSS bundle | `index-DQWNTC9k.css` (58.95 KB / 10.25 KB gzip) |
| Build errors | 0 |

### Deployment Details

| Item | Value |
|------|-------|
| Service restarted | `pm2 restart triplanner-frontend` |
| Frontend URL | `https://localhost:4173/` |
| Backend URL | `https://localhost:3001/api/v1/` |
| Frontend status | ✅ 200 OK — serving new build assets |
| Backend health | ✅ 200 OK — `{"status":"ok"}` |
| Database migrations | None required (Sprint 33 is frontend-only) |
| Backend changes | None (no backend tasks this sprint) |

### Smoke Test Results

| Test | Result | Details |
|------|--------|---------|
| Frontend loads | ✅ PASS | HTML served with correct asset hashes (`index-DWDNtgu6.js`, `index-DQWNTC9k.css`) |
| Backend health endpoint | ✅ PASS | `GET /api/v1/health` → 200 `{"status":"ok"}` |
| Auth login | ✅ PASS | `POST /api/v1/auth/login` with test user → 200 with access_token |
| Create trip | ✅ PASS | `POST /api/v1/trips` → 201 |
| Create multi-day flight | ✅ PASS | `POST /api/v1/trips/:id/flights` with overnight flight (Sep 1 → Sep 2) → 201 |
| Calendar API multi-day flight | ✅ PASS | `GET /api/v1/trips/:id/calendar` → FLIGHT event with `start_date: 2026-09-01`, `end_date: 2026-09-02` (different dates confirm multi-day data) |
| Delete smoke test trip | ✅ PASS | `DELETE /api/v1/trips/:id` → 204 |
| Both pm2 services online | ✅ PASS | `triplanner-backend` (pid 79204), `triplanner-frontend` (pid 91592) |

### Pre-Deploy Verification (from QA T-265 handoff)

- ✅ 911/911 unit tests pass (410 backend + 501 frontend)
- ✅ Security checklist PASS (0 issues)
- ✅ npm audit: 0 vulnerabilities
- ✅ No pending migrations
- ✅ No backend changes

**Deploy Verified = Pending Monitor Agent health check (T-267)**

*Deploy Engineer Sprint #33 — T-266 Complete — 2026-03-20*

---

## Sprint #33 — QA Engineer — T-265 Security Checklist + Integration Testing — 2026-03-20

**Task:** T-265 (QA Engineer — Security checklist + integration testing for T-264)
**Date:** 2026-03-20
**Sprint:** 33
**Status:** ✅ QA PASS

---

### Unit Test Results

**Test Type:** Unit Test

| Suite | Tests | Passed | Failed | Duration |
|-------|-------|--------|--------|----------|
| Backend (23 files) | 410 | 410 | 0 | 2.76s |
| Frontend (25 files) | 501 | 501 | 0 | 2.00s |
| **Total** | **911** | **911** | **0** | **4.76s** |

**T-264 New Tests (28.A–28.E):** 5 new tests added to TripCalendar.test.jsx

| Test | Description | Result |
|------|-------------|--------|
| 28.A | Multi-day FLIGHT spanning 2 days renders on both days | ✅ PASS |
| 28.B | Multi-day LAND_TRAVEL spanning 3 days renders on all 3 days | ✅ PASS |
| 28.C | Multi-day FLIGHT shows "Arrives" text on arrival day | ✅ PASS |
| 28.D | Single-day FLIGHT renders as single chip (no regression) | ✅ PASS |
| 28.E | Single-day LAND_TRAVEL with null end_date renders as single chip | ✅ PASS |

**Coverage assessment:** T-264 has happy-path tests (28.A, 28.B, 28.C) and edge-case/regression tests (28.D, 28.E with null end_date). Sufficient coverage.

---

### Integration Test Results

**Test Type:** Integration Test

**T-264 Integration Scenarios:**

| Scenario | Verification Method | Result |
|----------|-------------------|--------|
| Multi-day FLIGHT spans correct days | Code review: `buildEventsMap()` enumerates dates from `start_date` to `end_date` using `enumerateDates()` | ✅ PASS |
| Multi-day LAND_TRAVEL spans correct days | Code review: Same logic applies to LAND_TRAVEL in `buildEventsMap()` lines 69-91 | ✅ PASS |
| Single-day events unaffected | Code review: `start === end` short-circuits to single-day behavior (line 72-75) | ✅ PASS |
| Arrival time on arrival day | Code review: `buildArrivalLabel()` differentiates RENTAL_CAR ("Drop-off") from other modes ("Arrives"); rendered on `_dayType === 'end'` pills | ✅ PASS |
| Mobile view multi-day events | Code review: `MobileDayList` enumerates FLIGHT/LAND_TRAVEL multi-day spans with `(cont.)` on middle days and arrival labels on end days | ✅ PASS |
| Frontend calls correct API endpoint | Test 15 verifies `apiClient.get('/trips/:id/calendar')` — matches contract in api-contracts.md | ✅ PASS |
| Response shape matches contract | Calendar events include `start_date`, `end_date`, `start_time`, `end_time` — matches existing `GET /api/v1/trips/:id/calendar` contract | ✅ PASS |
| UI states implemented | Empty (Test 5), Loading (Test 6), Error (Test 7), Success (Tests 2-4, 14) — all 4 states verified | ✅ PASS |
| No XSS vectors | No `dangerouslySetInnerHTML` or `innerHTML` usage. `formatTime()` returns null on invalid input. All text via React JSX auto-escaping | ✅ PASS |

---

### Config Consistency Check

**Test Type:** Config Consistency

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| Backend PORT (`.env`) | 3000 | 3000 | ✅ MATCH |
| Vite proxy target port | 3000 (default from `BACKEND_PORT \|\| '3000'`) | 3000 | ✅ MATCH |
| Backend SSL | Disabled (commented out in .env) | — | ✅ OK |
| Vite proxy protocol | `http://` (when BACKEND_SSL unset) | `http://` | ✅ MATCH |
| CORS_ORIGIN | Must include `http://localhost:5173` | `http://localhost:5173` | ✅ MATCH |
| Docker backend PORT | 3000 | 3000 | ✅ MATCH |
| Docker CORS_ORIGIN | Configurable via env var, default `http://localhost` | ✅ OK (production uses custom domain) | ✅ OK |

**No config consistency issues found.**

---

### Security Scan Results

**Test Type:** Security Scan

**npm audit:** 0 vulnerabilities (backend)

| Security Checklist Item | Status | Notes |
|------------------------|--------|-------|
| **Auth & Authorization** | | |
| All API endpoints require auth | ✅ PASS | Auth middleware applied; calendar endpoint requires valid JWT |
| Password hashing uses bcrypt | ✅ PASS | bcrypt used in auth.js, seeds, and tests |
| Failed login rate-limited | ✅ PASS | Rate limiter middleware in place (`rateLimiter.js`) |
| **Input Validation & Injection** | | |
| SQL queries use parameterized statements | ✅ PASS | Knex query builder used throughout; `db.raw()` calls use static SQL (TO_CHAR, gen_random_uuid) — no user input concatenation |
| HTML output sanitized (XSS) | ✅ PASS | React auto-escaping; no `dangerouslySetInnerHTML`; `formatDate.js` explicitly notes "no dangerouslySetInnerHTML" |
| Client + server validation | ✅ PASS | Frontend form validation + backend route validation |
| **API Security** | | |
| CORS configured correctly | ✅ PASS | `CORS_ORIGIN=http://localhost:5173` for dev; production uses custom domain |
| Rate limiting on public endpoints | ✅ PASS | Rate limiter applied to auth routes |
| No stack traces in error responses | ✅ PASS | `errorHandler.js` logs stack server-side, returns generic message for 500s |
| Security headers (helmet) | ✅ PASS | `helmet()` middleware applied in `app.js` (X-Content-Type-Options, X-Frame-Options, etc.) |
| **Data Protection** | | |
| Credentials in env vars, not code | ✅ PASS | JWT_SECRET, DATABASE_URL in `.env`; `.env` not committed (checked `.gitignore`) |
| No hardcoded secrets in frontend | ✅ PASS | No API keys or secrets in frontend source |
| **Infrastructure** | | |
| Dependencies checked for vulnerabilities | ✅ PASS | `npm audit` — 0 vulnerabilities |
| No default credentials in code | ✅ PASS | `.env` has placeholder `change-me-to-a-random-string` for JWT_SECRET (appropriate for dev template) |

**Security Scan Result: ✅ PASS — No security issues found.**

---

### Summary

| Check | Result |
|-------|--------|
| Backend unit tests (410/410) | ✅ PASS |
| Frontend unit tests (501/501) | ✅ PASS |
| T-264 new tests (5/5) | ✅ PASS |
| Integration scenarios | ✅ PASS |
| Config consistency | ✅ PASS |
| Security checklist | ✅ PASS |
| npm audit | ✅ 0 vulnerabilities |

**QA Verdict: ✅ PASS — T-264 ready for staging deployment (T-266).**

*QA Engineer Sprint #33 — T-265 Complete — 2026-03-20*

---

## Sprint #32 — Deploy Engineer — T-260 Staging Re-Deployment — 2026-03-20

**Task:** T-260 (Deploy Engineer — Sprint 32 staging re-deployment)
**Date:** 2026-03-20
**Sprint:** 32
**Environment:** Staging (localhost)
**Build Status:** ✅ No build required — backend-only restart (no frontend changes)
**Deploy Status:** ✅ DEPLOYED SUCCESSFULLY

---

### Pre-Deploy Gate Review

| Gate | Status | Notes |
|------|--------|-------|
| T-258 code implemented | ✅ CONFIRMED | Stay category normalization in `stays.js` — Manager code review APPROVED |
| T-258 tests passing | ✅ 410/410 | 406 baseline + 4 new T-258 tests — zero failures |
| QA handoff (T-259 → T-260) | ✅ CONFIRMED | QA Engineer logged "✅ QA PASS — Deploy is unblocked" in handoff-log.md |
| Pending DB migrations | ✅ NONE | Sprint 32 schema-stable; 10/10 migrations already applied on staging |

### Deployment Actions

| Step | Action | Result |
|------|--------|--------|
| 1 | `pm2 restart triplanner-backend` | ✅ Restarted — new PID 79204, restart count 6 |
| 2 | Wait 3s for process stabilization | ✅ Process online and stable |
| 3 | `GET https://localhost:3001/api/v1/health` | ✅ 200 `{"status":"ok"}` |
| 4 | Frontend `https://localhost:4173` | ✅ 200 OK — serving correctly |

### Smoke Tests

| Test | Input | Expected | Actual | Result |
|------|-------|----------|--------|--------|
| Health check | GET /api/v1/health | 200 `{"status":"ok"}` | 200 `{"status":"ok"}` | ✅ PASS |
| Auth login | POST /auth/login (test@triplanner.local) | 200 with access_token | 200 with valid JWT | ✅ PASS |
| Create trip | POST /trips | 201 with trip data | 201 — trip `230a6db4` created | ✅ PASS |
| **T-258 key test: lowercase stay** | POST /stays `category: "hotel"` | 201, stored as "HOTEL" | 201, `category: "HOTEL"` | ✅ PASS |
| Delete trip (cleanup) | DELETE /trips/:id | 204 | 204 | ✅ PASS |

### Service Status (Post-Deploy)

| Service | Status | PID | Uptime |
|---------|--------|-----|--------|
| triplanner-backend | ✅ online | 79204 | stable (~2min at check) |
| triplanner-frontend | ✅ online | 61811 | 4h+ (no restart needed) |

### Deploy Verified

**Deploy Verified = Yes (Staging)** — pending Monitor Agent health check (T-261) for full verification.

*Deploy Engineer Sprint #32 — T-260 Complete — 2026-03-20*

---

## Sprint #32 — QA Engineer — T-259 Security Checklist + Integration Testing — 2026-03-20

**Task:** T-259 (QA Engineer — Sprint 32 security checklist + integration testing)
**Date:** 2026-03-20
**Sprint:** 32
**QA Engineer Result:** ✅ ALL PASS

---

### Unit Test Results

**Test Type:** Unit Test

| Suite | Tests | Result | Notes |
|-------|-------|--------|-------|
| Backend (`npm test --run`) | 410/410 | ✅ ALL PASS | 406 baseline + 4 new T-258 tests. 23 test files. Duration: 2.80s |
| Frontend (`npm test --run`) | 496/496 | ✅ ALL PASS | 25 test files. Duration: 2.05s |

**T-258 Specific Tests (4 new):**
| Test | Input | Expected | Actual | Result |
|------|-------|----------|--------|--------|
| POST lowercase "hotel" → 201 | `category: "hotel"` | 201, createStay called with "HOTEL" | 201, "HOTEL" | ✅ PASS |
| POST lowercase "airbnb" → 201 | `category: "airbnb"` | 201, createStay called with "AIRBNB" | 201, "AIRBNB" | ✅ PASS |
| PATCH lowercase "airbnb" → 200 | `category: "airbnb"` | 200, updateStay called with "AIRBNB" | 200, "AIRBNB" | ✅ PASS |
| PATCH invalid "motel" → 400 | `category: "motel"` | 400 VALIDATION_ERROR | 400, error.fields.category matches /HOTEL.*AIRBNB.*VRBO/ | ✅ PASS |

**Coverage Assessment:**
- stays.js: Happy-path and error-path tests for GET, POST, PATCH, DELETE ✅
- POST: happy path (uppercase), happy path (lowercase hotel), happy path (lowercase airbnb), optional address (null), invalid category (400), check_out before check_in (400) ✅
- PATCH: happy path (lowercase airbnb), invalid category motel (400) ✅
- GET: list stays (200), unauthorized (401) ✅
- DELETE: success (204), not found (404) ✅

---

### Integration Test Results

**Test Type:** Integration Test

**T-258 — Stay Category Case Normalization:**

| Scenario | Expected | Code Review Verification | Result |
|----------|----------|-------------------------|--------|
| POST /stays with `"hotel"` (lowercase) | 201, stored as "HOTEL" | `normalizeCategory` middleware (line 99-104) calls `.toUpperCase()` before `validate()` runs | ✅ PASS |
| POST /stays with `"HOTEL"` (uppercase regression) | 201, stored as "HOTEL" | Normalization is idempotent — `.toUpperCase()` on "HOTEL" → "HOTEL" | ✅ PASS |
| POST /stays with `"motel"` (invalid) | 400 VALIDATION_ERROR | After normalization "MOTEL" is not in ["HOTEL", "AIRBNB", "VRBO"] → rejected | ✅ PASS |
| PATCH /stays/:id with `"airbnb"` (lowercase) | 200, stored as "AIRBNB" | Inline normalization (line 176-178) before enum check (line 180) | ✅ PASS |
| PATCH /stays/:id with `"motel"` (invalid) | 400 VALIDATION_ERROR | "MOTEL" not in enum → 400 | ✅ PASS |

**T-257 — Documentation Review:**

| Check | Result | Notes |
|-------|--------|-------|
| Calendar endpoint note present in api-contracts.md | ✅ PASS | Lines 7396-7398: wrapped object `{ data: { trip_id, events: [] } }` note is accurate and matches actual implementation |
| curl --http1.1 workaround note present | ✅ PASS | Lines 7404-7414: complete example with `--http1.1` flag documented |
| No code changes in T-257 | ✅ PASS | Documentation-only update confirmed |

**API Contract Compliance (T-258):**

| Check | Result |
|-------|--------|
| POST /stays request shape matches contract | ✅ Same fields: category, name, address, check_in_at, check_in_tz, check_out_at, check_out_tz |
| POST /stays response shape `{ data: {...} }` | ✅ Unchanged |
| PATCH /stays request accepts partial updates | ✅ Unchanged |
| PATCH /stays response shape `{ data: {...} }` | ✅ Unchanged |
| Error response shape `{ error: { message, code, fields } }` | ✅ Unchanged |
| Auth enforcement (authenticate middleware) | ✅ Line 16: `router.use(authenticate)` — all routes protected |
| Trip ownership check | ✅ `requireTripOwnership` called in all route handlers |
| UUID validation on path params | ✅ Lines 19-20: `uuidParamHandler` on tripId and id |

---

### Config Consistency Check

**Test Type:** Config Consistency

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| Backend PORT (backend/.env) | 3000 | PORT=3000 | ✅ MATCH |
| Vite proxy target port | 3000 (from BACKEND_PORT env or default) | `process.env.BACKEND_PORT \|\| '3000'` → `http://localhost:3000` | ✅ MATCH |
| Backend SSL vs proxy protocol | SSL commented out → http:// | SSL_KEY_PATH and SSL_CERT_PATH are commented out; proxy uses `http://` by default | ✅ MATCH |
| CORS_ORIGIN includes frontend dev origin | `http://localhost:5173` | `CORS_ORIGIN=http://localhost:5173` | ✅ MATCH |
| Docker backend PORT | 3000 | `PORT: 3000` in docker-compose.yml | ✅ MATCH |

**No config consistency issues found.**

---

### Security Scan Results

**Test Type:** Security Scan

**npm audit:** ✅ 0 vulnerabilities found

**Security Checklist (applicable items for T-258):**

| # | Check | Result | Evidence |
|---|-------|--------|----------|
| 1 | All API endpoints require authentication | ✅ PASS | `router.use(authenticate)` at line 16 of stays.js — applied to all routes |
| 2 | Role-based access / ownership enforced | ✅ PASS | `requireTripOwnership` checks `trip.user_id !== req.user.id` → 403 |
| 3 | SQL queries use parameterized statements | ✅ PASS | stayModel.js uses Knex query builder (`db('stays').where({...})`) — no raw SQL, no string concatenation |
| 4 | No SQL injection vector from T-258 | ✅ PASS | `.toUpperCase()` is a pure string operation — no user input concatenated into queries |
| 5 | Input normalization before validation (correct order) | ✅ PASS | POST: `normalizeCategory` middleware at line 120 runs before `validate()`. PATCH: normalization at line 176-178 before enum check at line 180. |
| 6 | No hardcoded secrets in code | ✅ PASS | No passwords, tokens, or API keys in stays.js or stayModel.js. JWT_SECRET in .env (not committed). |
| 7 | Error responses don't leak internals | ✅ PASS | All error responses use structured `{ error: { message, code } }` format. No stack traces, file paths, or internal details. |
| 8 | CORS configured for expected origins only | ✅ PASS | `CORS_ORIGIN=http://localhost:5173` in .env — single origin, not wildcard |
| 9 | HTML output sanitized (XSS prevention) | ✅ N/A | API-only change — no HTML rendering in T-258 |
| 10 | Sensitive data not in URL query params | ✅ PASS | Category is in request body, not URL params |
| 11 | Dependencies checked for vulnerabilities | ✅ PASS | `npm audit` → 0 vulnerabilities |
| 12 | UUID params validated | ✅ PASS | `uuidParamHandler` on both tripId and id params (lines 19-20) |
| 13 | Non-string category input handled | ✅ PASS | `typeof req.body.category === 'string'` guard at lines 100 and 176 prevents crash on non-string input |

**Security Verdict:** ✅ ALL PASS — No security issues found. T-258 introduces no new attack surface.

---

### Summary

| Category | Result |
|----------|--------|
| Unit Tests (Backend) | ✅ 410/410 PASS |
| Unit Tests (Frontend) | ✅ 496/496 PASS |
| Integration Tests (T-258) | ✅ ALL PASS |
| Documentation Review (T-257) | ✅ PASS |
| Config Consistency | ✅ NO ISSUES |
| Security Checklist | ✅ ALL PASS |
| npm audit | ✅ 0 vulnerabilities |

**T-259 Verdict: ✅ PASS — Sprint 32 is clear for deployment.**

*QA Engineer Sprint #32 — T-259 Complete — 2026-03-20*

---

## Sprint #32 — Deploy Engineer — T-260 Pre-Flight Check (BLOCKED) — 2026-03-20

**Task:** T-260 (Deploy Engineer — Sprint 32 staging re-deployment)
**Date:** 2026-03-20
**Environment:** Staging (localhost)
**Build Status:** ⏳ BLOCKED — awaiting T-259 (QA sign-off)
**Deploy Status:** ⏳ NOT YET DEPLOYED — pre-flight checks complete

### Pre-Deploy Gate Review

| Gate | Status | Notes |
|------|--------|-------|
| T-258 code implemented | ✅ CONFIRMED | Backend Engineer handoff logged — `stays.js` has category normalization |
| T-258 tests passing | ✅ 410/410 | 406 baseline + 4 new T-258 tests — zero failures |
| QA handoff (T-259 → T-260) | ❌ NOT YET | T-259 still in Backlog — QA has not run security checklist or integration tests |
| Pending DB migrations | ✅ NONE | Sprint 32 schema-stable; 10/10 migrations already applied on staging |

### Live Service Status (Pre-Deploy)

| Check | Result | Details |
|-------|--------|---------|
| pm2 triplanner-backend | ✅ online | PID 62877, uptime ~4h, 5 restarts — running Sprint 31 code (pre-T-258) |
| pm2 triplanner-frontend | ✅ online | PID 61811, uptime ~4h, 3 restarts — no changes needed |
| `GET https://localhost:3001/api/v1/health` | ✅ 200 `{"status":"ok"}` | Backend healthy |
| Frontend `https://localhost:4173` | ✅ 200 OK | HTML served |

### Next Steps

Once T-259 is marked Done with QA sign-off in handoff-log.md:
1. `pm2 restart triplanner-backend`
2. Health check + smoke tests (lowercase category POST)
3. Update this entry with deploy results
4. Handoff to Monitor Agent (T-261)

*Deploy Engineer Sprint #32 — T-260 Pre-Flight — 2026-03-20*

---

## Sprint #31 — Deploy Engineer — Staging Re-Verification Pass (T-253) — 2026-03-20

**Task:** T-253 (Deploy Engineer — orchestrator re-invocation re-verification)
**Date:** 2026-03-20
**Environment:** Staging (localhost)
**Build Status:** ✅ Already built — artifact intact
**Deploy Status:** ✅ Services online — no re-deploy required
**Trigger:** Automated orchestrator re-invoked Deploy Engineer after QA re-verification pass

### Pre-Deploy Gate Review

| Gate | Status | Notes |
|------|--------|-------|
| QA handoff in handoff-log.md (T-252 → T-253) | ✅ CONFIRMED | QA Engineer 2026-03-20 — T-251 + T-252 both DONE |
| QA re-verification handoff (T-254 unblocked) | ✅ CONFIRMED | QA re-ran all tests post-T-253 — 406/406 + 496/496 + Playwright 4/4 |
| Pending DB migrations | ✅ NONE | Sprint 31 schema-stable; 10/10 migrations applied |
| T-249 (mobileEventLandTravel CSS in build artifact) | ✅ CONFIRMED | `_mobileEventLandTravel_z292r_462{color:var(--event-land-travel-text)}` in dist |
| T-250 (knexfile.js staging seeds fix) | ✅ CONFIRMED | 406/406 backend tests pass including 4 new sprint31.test.js tests |

### Live Service Health Check

| Check | Result | Details |
|-------|--------|---------|
| pm2 triplanner-backend | ✅ online | PID 62877, uptime ~2m (restarted by QA to reset rate limiter), 5 restarts |
| pm2 triplanner-frontend | ✅ online | PID 61811, uptime ~12m, 3 restarts |
| `GET https://localhost:3001/api/v1/health` | ✅ 200 `{"status":"ok"}` | Backend responding correctly |
| Frontend `https://localhost:4173` | ✅ 200 OK | HTML served, Etag present |
| CORS header | ✅ `Access-Control-Allow-Origin: https://localhost:4173` | Correct origin |

### Conclusion

No re-deployment needed. T-253 staging deployment (completed earlier today) is still fully healthy. Both pm2 processes are online, all health endpoints return expected responses, CORS is correct. **T-254 (Monitor Agent health check) remains unblocked.**

*Deploy Engineer Sprint #31 — T-253 Re-Verification Pass — 2026-03-20*

---

## Sprint #31 — QA Engineer — Re-Verification Pass — 2026-03-20

**Task:** T-251 + T-252 re-verification (QA Engineer Sprint 31 — automated orchestrator re-invocation)
**Date:** 2026-03-20
**Test Type:** Unit Test + Integration Test + Security Scan
**Status:** ✅ ALL CHECKS PASS — No regressions — Deploy remains confirmed

### Context

QA Engineer was re-invoked by the automated orchestrator. T-251 (security checklist) and T-252 (integration testing) were already marked Done from the prior pass on 2026-03-20. This pass re-runs all tests live to confirm no regressions since T-253 (staging re-deploy completed 2026-03-20 by Deploy Engineer, backend restarted today at 12:20).

### Unit Tests

| Suite | Command | Result | Count |
|-------|---------|--------|-------|
| Backend | `cd backend && npm test -- --run` | ✅ PASS | **406/406** (23 test files) |
| Frontend | `cd frontend && npm test -- --run` | ✅ PASS | **496/496** (25 test files) |

**Sprint 31 specific tests verified:**
- `backend/src/__tests__/sprint31.test.js` — 4/4 PASS (T-250 knexfile staging seeds)
- `frontend/src/__tests__/TripCalendar.test.jsx` Test 81 (`31.T249`) — PASS (mobileEventLandTravel class)

### Security Scan

| Check | Result | Notes |
|-------|--------|-------|
| XSS / dangerouslySetInnerHTML | ✅ PASS | Zero occurrences in frontend/src/ production code |
| Hardcoded secrets in Sprint 31 files | ✅ PASS | knexfile.js uses process.env; CSS has color values only |
| SQL injection vectors | ✅ PASS | knexfile.js is pure config; no raw SQL |
| npm audit — backend | ✅ 0 vulnerabilities | `found 0 vulnerabilities` |
| npm audit — frontend | ✅ 0 vulnerabilities | `found 0 vulnerabilities` |

### Integration Verification

| Check | Result | Notes |
|-------|--------|-------|
| `knexfile.staging.seeds.directory` = `seedsDir` | ✅ PASS | Lines 59-61 confirmed |
| `knexfile.production.seeds` = undefined | ✅ PASS | Production block has no seeds key |
| `staging.seeds.directory === development.seeds.directory` | ✅ PASS | Both = `join(__dirname, '../seeds')` |
| `.mobileEventLandTravel` in TripCalendar.module.css | ✅ PASS | Lines 461-464 confirmed |
| `.mobileEventLandTravel` applied in JSX (line 195) | ✅ PASS | LAND_TRAVEL branch in MobileDayList ternary |
| `--event-land-travel-text: #7B6B8E` in global.css | ✅ PASS | Line 105 confirmed |

### Config Consistency

| Item | backend/.env | vite.config.js | docker-compose.yml | Result |
|------|-------------|---------------|-------------------|--------|
| PORT | `PORT=3000` | `BACKEND_PORT \|\| '3000'` | `PORT: 3000` | ✅ CONSISTENT |
| SSL | Commented out (disabled) | `BACKEND_SSL=false` default (`http://`) | HTTP internal | ✅ CONSISTENT |
| CORS | `CORS_ORIGIN=http://localhost:5173` | N/A | `${CORS_ORIGIN:-http://localhost}` | ✅ CONSISTENT |

### Playwright E2E

| Test | Result | Time |
|------|--------|------|
| Test 1: Core user flow (register/create/delete/logout) | ✅ PASS | 1.3s |
| Test 2: Sub-resource CRUD (flight + stay) | ✅ PASS | 1.4s |
| Test 3: Search, filter, sort | ✅ PASS | 3.9s |
| Test 4: Rate limit lockout | ✅ PASS | 4.0s |
| **Total** | **✅ 4/4 PASS** | **11.5s** |

**Note:** During this QA session, manual curl registration attempts exhausted the in-memory rate limit for 127.0.0.1 (registerLimiter: 5 per 60-min window). Backend was restarted (`pm2 restart triplanner-backend`) to reset rate limiter before Playwright run. Health confirmed `{"status":"ok"}` post-restart. This is expected behavior — the rate limiter is functioning correctly (Test 4 validates it).

### Sprint 32 Feature Verification

- **T-258 (Stay category case normalization):** ✅ VERIFIED — `POST /stays` with `"category":"hotel"` returns `"category":"HOTEL"`. Normalization working correctly.

