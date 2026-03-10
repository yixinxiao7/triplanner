# QA & Build Log

Tracks test runs, build results, and post-deploy health checks per sprint. Maintained by QA Engineer, Deploy Engineer, and Monitor Agent.

---

## Sprint #19 QA Run — 2026-03-09

**QA Engineer:** Automated (Sprint #19 orchestrator invocation)
**Tasks:** T-181 (Security checklist + code review audit), T-182 (Integration testing)

---

### Unit Test Results

**Backend Tests: PASS — 287/287 tests passed, 0 failed**

- Test files: 14 files passed (`auth.test.js`, `trips.test.js`, `flights.test.js`, `stays.test.js`, `activities.test.js`, `tripStatus.test.js`, `sprint2.test.js` through `sprint7.test.js`, `sprint16.test.js`, `sprint19.test.js`)
- `sprint19.test.js`: 9 new tests for T-178 (Tests A–E) all pass:
  - Test A: POST /auth/login within limit → 200 ✅
  - Test B: POST /auth/login after limit exceeded → 429 RATE_LIMITED ✅ (including RateLimit-* headers, no X-RateLimit-* legacy headers)
  - Test C: POST /auth/register within limit → 201 ✅
  - Test D: POST /auth/register after limit exceeded → 429 RATE_LIMITED ✅ (no stack trace, only `{error:{code,message}}`)
  - Test E: Non-auth routes unaffected by auth rate limiters ✅
- All 278 pre-existing tests continue to pass (no regression)
- Note: Two expected `[ErrorHandler]` stderr lines from sprint2.test.js (malformed JSON tests) — pre-existing, non-blocking

**Frontend Tests: FAIL — 406/416 tests passed, 10 failed (3 test files)**

Failures introduced by Sprint 19 build commit (`2bb0067`) changes to `DestinationChipInput.jsx` and `CreateTripModal.jsx`:

**Root cause 1 — `DestinationChipInput.jsx` aria-label change:**
Sprint 19 renamed the text input `aria-label` from `"Add destination"` to `"New destination"` and added a new `<button aria-label="Add destination">` (+). All existing tests that used `getByLabelText(/add destination/i)` now match the button element instead of the input, causing 6 test failures in `DestinationChipInput.test.jsx` and cascading failures in `CreateTripModal.test.jsx` and `HomePage.test.jsx`.

**Root cause 2 — `CreateTripModal.jsx` submit button disabled state change:**
Sprint 19 added `disabled={isLoading || !name.trim() || destinations.length === 0}` to the submit button. Tests that click submit with an empty form to trigger validation error messages now fail because the button is disabled and the click is ignored.

**Failing tests:**

| Test File | Failing Test | Error |
|-----------|-------------|-------|
| `DestinationChipInput.test.jsx` | calls onChange when Enter is pressed with text | `expected "spy" to be called with arguments: [['Tokyo', 'Kyoto']]` — keyDown on button not input |
| `DestinationChipInput.test.jsx` | calls onChange when comma is pressed with text | Same root cause |
| `DestinationChipInput.test.jsx` | removes last destination on Backspace when input is empty | Same root cause |
| `DestinationChipInput.test.jsx` | clears input on Escape key | `expected 'test' to be ''` — acting on button not input |
| `DestinationChipInput.test.jsx` | input has aria-describedby pointing to dest-chip-hint when no error | `expected null to be 'dest-chip-hint'` — checking attribute on button not input |
| `DestinationChipInput.test.jsx` | input has aria-describedby pointing to dest-chip-error when error is set | Same root cause |
| `CreateTripModal.test.jsx` | shows validation error when trip name is empty on submit | `Unable to find text 'trip name is required'` — submit button is disabled, validation never fires |
| `CreateTripModal.test.jsx` | shows validation error when destinations is empty on submit | `Unable to find text 'at least one destination is required'` — same cause |
| `CreateTripModal.test.jsx` | calls onSubmit with form data when valid (chip input) | `expected "spy" to be called` — destinations not added because keyDown fires on button not input |
| `HomePage.test.jsx` | navigates to new trip page after successful creation | `expected "spy" to be called at least once` — destinations not added, submit blocked |

**Coverage notes:**
- `rateLimitUtils.test.js`: 9 tests pass — `parseRetryAfterMinutes` utility fully covered ✅
- Backend rate limiter logic: fully covered by sprint19.test.js ✅
- Frontend component regressions: blocked by aria-label conflict from Sprint 19

---

### Integration Test Results

**API contract compliance: PASS**
- T-178 rate limiting: `rateLimiter.js` exports `loginLimiter` (10/15min), `registerLimiter` (5/60min), `generalAuthLimiter` (30/15min). Applied at lines 71 (`registerLimiter`), 150 (`loginLimiter`), 269 (`generalAuthLimiter`) in `auth.js`. Error response shape `{"error":{"code":"RATE_LIMITED","message":"..."}}` matches API error contract. ✅
- No new endpoints introduced by Sprint 19 backend work. ✅
- No database schema changes. ✅

**UI state coverage: FAIL (due to broken frontend tests)**
- T-180 (multi-destination UI) implementation is partially present in code but T-180 tracker status is still **Backlog**. The `DestinationChipInput.jsx` and `CreateTripModal.jsx` were modified in the Sprint 19 build commit but the changes broke pre-existing tests.
- DestinationChipInput chip add/remove/keyboard flows: cannot be verified by tests (10 failures)

**Auth enforcement: PASS**
- All non-auth routes guarded by `authenticate` middleware ✅
- Auth rate limiters applied before route handlers ✅
- `generalAuthLimiter` applied to refresh and logout ✅

**Input validation: PASS**
- `validate()` middleware applied to register and login before rate limiter middleware in the route chain ✅
- Destination inputs in `DestinationChipInput` sanitized via trim + duplicate check ✅ (code confirmed, tests blocked)

**Details:**
- Sprint 16 regression (start_date/end_date, formatDateRange): TripCard.test.jsx 17/17 pass ✅, formatDate.test.js 20/20 pass ✅
- Sprint 15 regression (title, favicon): TripDetailsPage.test.jsx 70/70 pass ✅
- Sprint 14 regression (calendar): TripCalendar.test.jsx 70/70 pass ✅

---

### Config Consistency Check

**PORT alignment: PASS**
- `backend/.env`: `PORT=3000`
- `vite.config.js` proxy: `http://localhost:${BACKEND_PORT||'3000'}` → resolves to `http://localhost:3000` in dev ✅

**SSL config: PASS**
- Dev `.env`: SSL not set → vite proxy uses `http://` ✅
- Staging: `BACKEND_SSL=true` triggers HTTPS proxy + `secure: false` for self-signed cert ✅

**CORS config: PASS**
- `backend/.env`: `CORS_ORIGIN=http://localhost:5173`
- Vite dev server: port 5173 ✅

**Details:**
- Docker compose: `PORT: 3000` in backend service, `CORS_ORIGIN: ${CORS_ORIGIN:-http://localhost}` — consistent with Docker context (nginx on :80). N/A for staging (pm2 deployment). ✅
- No new environment variable requirements introduced by Sprint 19. ✅

---

### Security Scan Results

**npm audit: PASS (no new Critical/High)**
- Backend: 5 moderate vulnerabilities (esbuild chain via vite/vitest) — dev dependencies only, pre-existing from Sprint 15. No new findings from Sprint 19.
- Frontend: 5 moderate vulnerabilities (same esbuild chain) — dev dependencies only, pre-existing.
- No Critical or High severity vulnerabilities in either package.

**Hardcoded secrets: PASS**
- `backend/src/middleware/rateLimiter.js`: No secrets. Only `express-rate-limit` config with integer window/max values and string messages. ✅
- `backend/src/routes/auth.js`: JWT_SECRET read from `process.env.JWT_SECRET` only. ✅
- `frontend/src/components/DestinationChipInput.jsx`: No secrets. ✅
- `frontend/src/components/CreateTripModal.jsx`: No secrets. ✅

**SQL injection vectors: PASS**
- No new DB queries introduced by Sprint 19 (T-178 is middleware only, no model changes). ✅
- Existing `db.raw()` calls in `tripModel.js`, `activityModel.js`, `landTravelModel.js` use only fixed column references or parameterized bindings — no user input interpolated. ✅
- Destination strings sent via PATCH `/api/v1/trips/:id` are stored through Knex parameterized updates — no raw SQL concatenation. ✅

**Auth enforcement: PASS**
- `loginLimiter` applied at route line 150, before handler ✅
- `registerLimiter` applied at route line 71, before handler ✅
- `generalAuthLimiter` applied to refresh/logout ✅
- IP-based keying (default `express-rate-limit` behavior, not user-supplied input) ✅

**XSS vulnerabilities: PASS**
- `DestinationChipInput.jsx`: destination chips rendered as `{dest}` inside `<span>` — React text node, no `dangerouslySetInnerHTML`. ✅
- 429 error message displayed in frontend via `parseRetryAfterMinutes` util — output is numeric string, no user data. ✅

**Error response leakage: PASS**
- `errorHandler.js`: logs stack server-side (`console.error('[ErrorHandler]', err.stack)`), returns generic message for 500s (`'An unexpected error occurred'`). ✅
- `rateLimiter.js` `makeHandler`: returns `{error:{code:'RATE_LIMITED',message:'...'}}` — no stack, no internals. ✅
- Test D2 (sprint19.test.js): confirms 429 body contains only `{error:{code,message}}` — `error.stack` is undefined. ✅

**Details:**
- Rate limiter uses MemoryStore (in-process). Acceptable for single-process staging/production. Redis store recommended if horizontal scaling is needed. Non-blocking.
- T-178 resolves the long-standing known accepted risk (18 sprints deferred) from T-010/T-018: auth endpoints are now rate-limited. ✅
- Pre-existing accepted risk: 5 moderate npm audit findings (esbuild chain) in dev dependencies — not in production runtime.

---

### Overall: BLOCKED

**T-181 (Security checklist + code review): PASS** — No P1 security issues found. T-178 backend implementation is sound.

**T-182 (Integration testing): BLOCKED** — 10 frontend test failures introduced by Sprint 19 build changes to `DestinationChipInput.jsx` and `CreateTripModal.jsx`. Specifically:
1. Input `aria-label` renamed from `"Add destination"` to `"New destination"` while a new button with `aria-label="Add destination"` was added — breaks 6 tests using `getByLabelText(/add destination/i)`
2. Submit button in `CreateTripModal` now disabled when `!name.trim() || destinations.length === 0` — breaks 2 validation error tests and 2 submit path tests

**Blocked tasks:**
- T-183 (Deploy): Cannot proceed — QA integration test failures unresolved
- T-184 (Monitor), T-185 (User Agent): Transitively blocked

**Required fix:** Frontend Engineer must either:
- Update tests to use `getByLabelText(/new destination/i)` for the input (and update submit-button validation tests to fill in valid data before asserting validation, or to use the new aria-label), OR
- Change the new button's `aria-label` to something that does not conflict with the existing test selectors (e.g., `aria-label="Add destination chip"`)

The fix is in the test suite or in the component's aria-label — not in the backend. Backend work (T-178) is complete and sound.

---

## Sprint #19 — T-183 Pre-Deploy Gate Check (Attempt 2)
**Date:** 2026-03-09
**Environment:** Staging (pre-deploy gate check — no deploy attempted)
**Performed by:** Deploy Engineer (second invocation)

### Gate Check Result: ⛔ BLOCKED (same blocker as Attempt 1)

| Prerequisite | Status | Evidence |
|---|---|---|
| T-178 (Backend: auth rate limiting) | ✅ COMPLETE | 287/287 backend tests pass; `rateLimiter.js` exists; Manager-approved |
| T-179 (Design: multi-destination spec) | ✅ Done | ui-spec.md Spec 18 published |
| T-180 (Frontend: multi-destination UI) | ✅ Done (code) | DestinationChipInput.jsx implemented |
| T-181 (QA: security checklist) | ✅ PASS | qa-build-log.md Sprint 19 section: no P1 security issues |
| T-182 (QA: integration testing) | ❌ BLOCKED | 10 frontend test failures — see below |
| QA handoff in handoff-log.md | ❌ MISSING | T-182 not passed; no "Ready for Deploy" handoff logged |

### T-182 Blocker — Frontend Test Failures (10 tests, 3 files)

Backend is clean (287/287 pass). Frontend is **406/416 pass (10 fail)**:

**Root cause 1 — `DestinationChipInput.jsx` aria-label conflict:**
- Input `aria-label` was renamed `"Add destination"` → `"New destination"` in Sprint 19
- New `+` button was added with `aria-label="Add destination"`
- Tests still use `getByLabelText(/add destination/i)` which now matches the *button*, not the input
- **6 tests fail** in `DestinationChipInput.test.jsx`

**Root cause 2 — `CreateTripModal.jsx` submit button disabled state:**
- Submit button is now `disabled` when `destinations.length === 0`
- Tests that click submit with empty form to trigger validation error messages fail because click is no-op on disabled button
- **3 tests fail** in `CreateTripModal.test.jsx` + **1 test fails** in `HomePage.test.jsx`

### Infrastructure Readiness (all green — blocking only on tests)

| Component | Status | Detail |
|---|---|---|
| pm2 `triplanner-backend` | ✅ Online | PID 51577, 30h uptime, `rateLimiter.js` loaded on disk |
| pm2 `triplanner-frontend` | ✅ Online | PID 51694, 30h uptime |
| Frontend build (`npm run build`) | ✅ 0 errors | 122 modules → 340KB JS, 75KB CSS |
| Backend migration state | ✅ No migrations needed | T-178 is middleware only |

### Decision: BLOCKED — No deploy attempted

Per rules.md: "Never deploy without QA confirmation in the handoff log." T-182 has not passed. Deploying with 10 known test failures would ship unverified frontend code.

### Required Fix (Frontend Engineer)

Fix the 10 test failures by updating `DestinationChipInput.jsx` button aria-label to avoid conflict:
- **Option A (recommended):** Change button `aria-label="Add destination"` → `aria-label="Add destination chip"` in `DestinationChipInput.jsx` (line 153). Tests using `/add destination/i` will then find the input. The hint text in tests using `getByLabelText(/add destination/i)` for the input will work again.
- **Option B:** Update all test selectors in `DestinationChipInput.test.jsx`, `CreateTripModal.test.jsx`, `HomePage.test.jsx` to use `getByLabelText(/new destination/i)` for the input. Also update submit-disabled tests to supply valid form state before triggering submit assertions.

After fix: frontend must reach **416/416 tests pass** before T-182 can be re-certified and T-183 can deploy.

---

## Sprint #19 — T-183 Pre-Deploy Gate Check
**Date:** 2026-03-09
**Environment:** Staging (pre-deploy gate check — no deploy attempted)
**Performed by:** Deploy Engineer
**Task:** T-183

### Pre-Deploy Gate Requirements

| Prerequisite | Required By | Status | Evidence |
|---|---|---|---|
| T-178 (Backend: auth rate limiting) | T-181, T-182 must depend on completed T-178 | ❌ NOT COMPLETE | See T-178 gap analysis below |
| T-179 (Design: multi-destination spec) | T-180 prerequisite | ✅ Done | dev-cycle-tracker.md Status: Done |
| T-180 (Frontend: multi-destination UI) | T-181, T-182 prerequisite | ✅ Done | DestinationChipInput.jsx + tests present; 416/416 frontend tests pass |
| T-181 (QA: security checklist) | T-182 prerequisite | ❌ NOT STARTED | No Sprint 19 QA entries in qa-build-log.md |
| T-182 (QA: integration testing) | T-183 direct prerequisite | ❌ NOT STARTED | No Sprint 19 QA entries in qa-build-log.md |
| QA handoff in handoff-log.md | Rule: never deploy without QA confirmation | ❌ MISSING | No T-182 → T-183 handoff found in handoff-log.md |

### T-178 Gap Analysis

T-178 spec vs. current `backend/src/routes/auth.js` (Sprint 1 T-028/B-011 rate limiting):

| Requirement | T-178 Spec | Current Implementation | Status |
|---|---|---|---|
| Login limiter window | 10/15min | 10/15min ✅ | Matches |
| Register limiter window | 5/60min | 20/15min | ❌ MISMATCH |
| Error code | `RATE_LIMITED` | `RATE_LIMIT_EXCEEDED` | ❌ MISMATCH |
| Error response structure | `{"code":"RATE_LIMITED","message":"..."}` | `{"error":{"message":"...","code":"..."}}` | ❌ MISMATCH |
| Separate `rateLimiter.js` file | `backend/src/middleware/rateLimiter.js` | Not created | ❌ MISSING |
| T-178 test cases (A–E) | 5 new tests → 283+ total | No new tests; still 278 total | ❌ MISSING |

### Current Test Counts

| Suite | Required | Actual | Status |
|---|---|---|---|
| Backend (`npm test --run`) | 283+ (278 base + 5 T-178 tests) | 278 | ❌ Missing T-178 tests |
| Frontend (`npm test --run`) | 416+ | 416 | ✅ Pass |

### Current Infrastructure State

| Component | Status | Detail |
|---|---|---|
| pm2 `triplanner-backend` | ✅ Online | PID 51577, 30h uptime (Sprint 17 T-175 deployment) |
| pm2 `triplanner-frontend` | ✅ Online | PID 51694, 30h uptime |
| Frontend build (`npm run build`) | ✅ 0 errors | 122 modules, dist/index.html + CSS + JS bundles |

### Decision

**BLOCKED — No deploy attempted.** T-182 (QA integration testing) has not completed and no QA handoff to Deploy Engineer exists in handoff-log.md. Per rules.md, deploying without QA confirmation is prohibited.

**Waiting for:**
1. Backend Engineer to complete T-178 per spec (5/60min register limiter, `RATE_LIMITED` code, `rateLimiter.js` file, 5 new tests → 283+ passing)
2. QA Engineer to run T-181 (security checklist) — log results in qa-build-log.md
3. QA Engineer to run T-182 (integration testing) — log results in qa-build-log.md **and** log handoff to Deploy in handoff-log.md

**Upon receiving T-182 QA handoff confirmation, T-183 will execute immediately:**
- `pm2 restart triplanner-backend` (loads T-178 rate limiter changes)
- `npm run build` in `frontend/` (already verified 0 errors)
- Run 5 smoke tests
- Log handoff to Monitor Agent (T-184)

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

## Sprint #19 — T-182 Re-Certification QA Run (2026-03-09)

**QA Engineer:** Automated (Sprint #19 third QA invocation — T-180 test fixes complete)
**Tasks:** T-182 (Integration testing — re-run after Frontend Engineer fixed 10 test failures)
**Date:** 2026-03-09

---

### Unit Test Results

**Backend Tests: PASS — 287/287 tests passed, 0 failed**

- 14 test files, all passed
- `sprint19.test.js`: 9 tests (rate limiter A–E + variants) — all pass ✅
- 2 expected `[ErrorHandler]` stderr lines from `sprint2.test.js` (malformed JSON tests) — pre-existing, non-blocking
- No regressions from any previous sprint

**Frontend Tests: PASS — 416/416 tests passed, 0 failed**

- 22 test files, all passed
- `DestinationChipInput.test.jsx`: 18 tests — all pass ✅ (previously 6 failures — RESOLVED)
- `CreateTripModal.test.jsx`: 11 tests — all pass ✅ (previously 3 failures — RESOLVED)
- `HomePage.test.jsx`: 14 tests — all pass ✅ (previously 1 failure — RESOLVED)
- All other test files unchanged and passing
- Fix applied by Frontend Engineer (2026-03-09): updated test selectors from `getByLabelText(/add destination/i)` to `getByLabelText(/new destination/i)` to match component's `aria-label="New destination"` on the text input. Submit-disabled tests updated to supply valid form state before asserting validation. The `+` button retains `aria-label="Add destination"` per Spec 18.2.

---

### Integration Test Results

**API contract compliance: PASS**

- T-178 rate limiting: All 9 sprint19.test.js tests confirm 429 `RATE_LIMITED` at threshold; 200/401 below threshold; non-auth routes unaffected ✅
- T-180 multi-destination: No backend contract changes. `destinations: string[]` API contract unchanged ✅

**UI state coverage: PASS**

- `DestinationChipInput.jsx`: chip add (Enter key), chip add (comma key), chip remove (× button), duplicate rejection (case-insensitive), Backspace to remove last chip, Escape to clear input, disabled state hides × buttons — all paths covered by 18 passing tests ✅
- `CreateTripModal.jsx`: submit blocked with 0 chips; submit enabled with ≥1 chip + name; destinations sent as string array ✅
- `TripCard.jsx`: destinations rendered as readable list ✅
- `TripDetailsPage.jsx`: destinations chips in header; edit mode opens chip editor; save calls PATCH ✅
- `HomePage.test.jsx`: successful create flow with chip input navigates correctly ✅

**Auth enforcement: PASS** — All non-auth routes guarded by `authenticate` middleware ✅

**Sprint regression checks: PASS**
- Sprint 17: `TripDetailsPage.test.jsx` 70/70 pass ✅
- Sprint 16: `TripCard.test.jsx` 17/17, `formatDate.test.js` 20/20 pass ✅
- Sprint 15: title/favicon coverage in TripDetailsPage tests ✅
- Sprint 14: `TripCalendar.test.jsx` 70/70 pass ✅

---

### Config Consistency Check

**PORT alignment: PASS**
- `backend/.env`: `PORT=3000`
- `vite.config.js` proxy: `${backendProtocol}://localhost:${backendPort}` → resolves to `http://localhost:3000` in dev (BACKEND_PORT unset, BACKEND_SSL unset) ✅

**SSL config: PASS**
- Dev `.env`: SSL not configured → vite proxy uses `http://` ✅
- Staging path: `BACKEND_SSL=true` → `https://` proxy + `secure: false` for self-signed cert ✅

**CORS config: PASS**
- `backend/.env`: `CORS_ORIGIN=http://localhost:5173`
- Vite dev server: port 5173 ✅
- Docker compose: `CORS_ORIGIN: ${CORS_ORIGIN:-http://localhost}` — appropriate for Docker context (nginx on :80) ✅

---

### Security Scan Results

**npm audit: PASS (no new Critical/High)**
- Backend: 5 moderate vulnerabilities (esbuild chain via vite/vitest) — dev dependencies only, pre-existing, no change from prior sprint
- Frontend: 5 moderate vulnerabilities (same esbuild chain) — dev dependencies only, pre-existing
- No Critical or High severity vulnerabilities in either package ✅

**Hardcoded secrets: PASS** — No new secrets introduced in T-180 test fixes ✅

**XSS: PASS** — `DestinationChipInput.jsx` chip values rendered as `{dest}` inside `<span>` — React text node, no `dangerouslySetInnerHTML` ✅

**SQL injection: PASS** — No backend changes in this fix cycle. Knex parameterized queries unchanged ✅

**Auth enforcement: PASS** — No auth changes in this fix cycle ✅

---

### Overall: PASS

**T-181 (Security checklist + code review): PASS** — Previously logged. No new security issues in T-180 test fix cycle. ✅

**T-182 (Integration testing): PASS** — All 416/416 frontend tests pass. All 287/287 backend tests pass. API contracts verified. UI state coverage confirmed. Regression checks clean. ✅

**Ready for Deploy:** T-183 (Deploy Engineer) is now unblocked.

---

