# QA & Build Log

Tracks test runs, build results, and post-deploy health checks per sprint. Maintained by QA Engineer, Deploy Engineer, and Monitor Agent.

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

