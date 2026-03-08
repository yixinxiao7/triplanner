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

