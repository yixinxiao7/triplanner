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
