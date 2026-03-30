# QA & Build Log

Tracks test runs, build results, and post-deploy health checks per sprint. Maintained by QA Engineer, Deploy Engineer, and Monitor Agent.

---

## Sprint #40 — Monitor Agent — Post-Deploy Health Check (Staging + Production) — 2026-03-30

**Date:** 2026-03-30
**Sprint:** 40
**Test Type:** Post-Deploy Health Check + Config Consistency
**Environment:** Staging (`https://localhost:3001`, `https://localhost:4173`) + Production (`https://localhost:3002`)
**Timestamp:** 2026-03-30T19:54:00Z
**Token:** Acquired via `POST /api/v1/auth/login` with `test@triplanner.local` (NOT /auth/register)

---

### 1. Config Consistency Validation

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| **Backend PORT vs Vite proxy target** | `.env` PORT=3000 → Vite default targets `http://localhost:3000`. Staging ecosystem overrides PORT=3001 with BACKEND_PORT=3001 env var for Vite. | `.env` PORT=3000; `vite.config.js` reads `BACKEND_PORT` env (default 3000); ecosystem.config.cjs sets `BACKEND_PORT=3001` for staging frontend + `PORT=3001` for staging backend. | ✅ PASS — Ports consistent across local dev (3000) and staging (3001 via env override) |
| **Protocol match (HTTP/HTTPS)** | `.env` has `SSL_KEY_PATH` and `SSL_CERT_PATH` commented out → local dev uses HTTP. Staging ecosystem relies on backend auto-detecting certs at `infra/certs/`. Vite reads `BACKEND_SSL=true` env. | Staging: backend serves HTTPS on 3001, Vite proxy uses `https://` (BACKEND_SSL=true). Local dev: HTTP on 3000, Vite proxy uses `http://` (default). | ✅ PASS — Protocol matches in both environments |
| **SSL cert files exist** | `infra/certs/localhost-key.pem` and `infra/certs/localhost.pem` must exist when SSL is active | Both files present (key: 1704 bytes, cert: 1151 bytes, dated 2026-03-06) | ✅ PASS |
| **CORS_ORIGIN** | Must include frontend dev server origin | `.env` → `CORS_ORIGIN=http://localhost:5173` (matches local Vite dev port 5173). Ecosystem staging → `CORS_ORIGIN=https://localhost:4173` (matches staging preview port 4173). | ✅ PASS — CORS origins match frontend URLs in both environments |
| **Docker port match** | `docker-compose.yml` backend internal PORT=3000 | Docker compose: `PORT: 3000` for backend container, healthcheck hits `http://localhost:3000`. Frontend exposed on host port 80. | ✅ PASS — Docker config consistent with `.env` PORT=3000 for production containers |

**Config Consistency Result: ✅ ALL PASS**

---

### 2. Staging Health Checks

| Check | Endpoint | Expected | Actual | Result |
|-------|----------|----------|--------|--------|
| App responds | `GET https://localhost:3001/api/v1/health` | HTTP 200, `{"status":"ok"}` | HTTP 200, `{"status":"ok"}` | ✅ PASS |
| Auth works | `POST https://localhost:3001/api/v1/auth/login` | HTTP 200 with `data.access_token` | HTTP 200, token returned for `test@triplanner.local` | ✅ PASS |
| Auth logout | `POST https://localhost:3001/api/v1/auth/logout` | HTTP 204 | HTTP 204 | ✅ PASS |
| List trips | `GET https://localhost:3001/api/v1/trips` | HTTP 200 with `data` array + `pagination` | HTTP 200, 1 trip returned with correct pagination shape | ✅ PASS |
| Get trip | `GET https://localhost:3001/api/v1/trips/:id` | HTTP 200 with trip object | HTTP 200, trip `b525c806...` returned with correct fields (name, destinations, status, notes, dates) | ✅ PASS |
| Activities | `GET https://localhost:3001/api/v1/trips/:id/activities` | HTTP 200 with `data` array | HTTP 200, `{"data":[]}` | ✅ PASS |
| Land travel | `GET https://localhost:3001/api/v1/trips/:id/land-travel` | HTTP 200 with `data` array | HTTP 200, `{"data":[]}` | ✅ PASS |
| Calendar | `GET https://localhost:3001/api/v1/trips/:id/calendar` | HTTP 200 with `data.events` array | HTTP 200, 1 stay event (checkout time visible) | ✅ PASS |
| Frontend accessible | `GET https://localhost:4173` | HTTP 200, HTML with React root | HTTP 200, valid HTML with `<div id="root">` and Vite-built assets | ✅ PASS |
| No 5xx errors | Check PM2 error logs | No 500/5xx responses | Only JSON parse errors from malformed health-check curl attempts (not real traffic). Zero 5xx responses to valid requests. | ✅ PASS |
| DB connected | Health endpoint covers this | 200 OK implies DB is up | Auth login succeeded → DB query worked. Trip list returned data. | ✅ PASS |
| PM2 stability | Process status | Online, no restart loops | Backend PID 56589, online 2m, 79.8MB. Frontend PID 56627, online 2m, 67.1MB. Both online and stable. | ✅ PASS |

**Staging Health Check Result: ✅ ALL PASS**

---

### 3. Production Health Checks

| Check | Endpoint | Expected | Actual | Result |
|-------|----------|----------|--------|--------|
| App responds | `GET https://localhost:3002/api/v1/health` | HTTP 200, `{"status":"ok"}` | HTTP 200, `{"status":"ok"}` | ✅ PASS |
| Auth works | `POST https://localhost:3002/api/v1/auth/login` | HTTP 200 with `data.access_token` | HTTP 200, token returned for `test@triplanner.local` | ✅ PASS |
| Auth logout | `POST https://localhost:3002/api/v1/auth/logout` | HTTP 204 | HTTP 204 | ✅ PASS |
| List trips | `GET https://localhost:3002/api/v1/trips` | HTTP 200 | HTTP 200, 1 trip with correct pagination | ✅ PASS |
| No 5xx errors | Check PM2 error logs | No 500/5xx | Only JSON parse errors from health-check tool. Zero real 5xx. | ✅ PASS |
| PM2 stability | Process status | Online, 0 restarts | Backend PID 54650, online 15m, 68.8MB, 0 restarts. Frontend PID 54651, online 15m, 43.8MB, 0 restarts. | ✅ PASS |

**Production Health Check Result: ✅ ALL PASS**

---

### 4. Observations

- **Staging backend restart count (4299):** This is the cumulative PM2 restart counter across ~40 sprints of development (logs show restarts dating to 2026-03-10). Not indicative of current instability — the process has been up for 2 minutes with 0 recent crashes since the Sprint 40 deploy.
- **Production backend:** 0 restarts, 15 minutes uptime — clean.
- **Calendar endpoint:** Correctly returns stay events with checkout time (end_time: "20:00"), confirming T-308 (stay checkout time on calendar) is working.
- **Trip notes field:** Present in trip response shape (`notes: null` for test trip), confirming the field is available. CRUD testing deferred to User Agent walkthrough.

---

### Deploy Verified: ✅ Yes (Staging + Production)

All health checks pass. All config consistency checks pass. Both environments are healthy and ready for User Agent walkthrough (T-311).

*Monitor Agent — Sprint 40 — 2026-03-30*

---

## Sprint #40 — Deploy Engineer — Build & Staging Deploy — 2026-03-30

**Date:** 2026-03-30
**Sprint:** 40
**Environment:** Staging
**Timestamp:** 2026-03-30T16:00:00Z

---

### 1. Pre-Deploy Checks

| Check | Result |
|-------|--------|
| QA Confirmation (T-309) | ✅ All 1041 tests pass, 0 security findings |
| Pending Migrations | ✅ None — schema stable at 10 migrations (001–010) |
| Sprint Tasks Status | ✅ T-305 through T-309 all Done |

---

### 2. Dependency Install

| Package | Result | Vulnerabilities |
|---------|--------|----------------|
| Backend (`npm install`) | ✅ 164 packages, up to date | 0 |
| Frontend (`npm install`) | ✅ 180 packages, up to date | 0 |

---

### 3. Frontend Build

**Build Tool:** Vite 6.4.1
**Result:** ✅ SUCCESS — 129 modules transformed, built in 512ms

| Output File | Size | Gzip |
|-------------|------|------|
| `dist/index.html` | 0.66 kB | 0.39 kB |
| `dist/assets/index-CFSmeAES.css` | 60.44 kB | 10.46 kB |
| `dist/assets/index-qrW3SmGs.js` | 300.75 kB | 95.86 kB |
| + 9 lazy-loaded chunks | — | — |

---

### 4. Staging Deployment

**Method:** PM2 (Docker not available)
**Backend Process:** `triplanner-backend` (PID 56589, port 3001)
**Frontend Process:** `triplanner-frontend` (PID 56627, port 4173)
**Backend Health:** ✅ `https://localhost:3001/api/v1/health` → `{"status":"ok"}`
**Frontend Serving:** ✅ `https://localhost:4173` → HTML served correctly
**Migrations:** None required (schema at 10 migrations, no changes since Sprint 30)

**Build Status:** ✅ Success
**Deploy Status:** ✅ Success — Staging

---

### 5. Staging URLs

| Service | URL |
|---------|-----|
| Backend API | `https://localhost:3001/api/v1` |
| Backend Health | `https://localhost:3001/api/v1/health` |
| Frontend | `https://localhost:4173` |

*Deploy Engineer — Sprint 40 — 2026-03-30*

---

## Sprint #40 — QA Engineer — Integration Testing — T-309 — 2026-03-30

**Task:** T-309 (QA Engineer: Integration testing for Sprint 40)
**Date:** 2026-03-30
**Sprint:** 40
**Environment:** Development + Production
**Timestamp:** 2026-03-30T15:45:00Z
**Overall Result:** ✅ PASS — All tests pass, security checklist verified, ready for deploy

---

### 1. Unit Tests

**Test Type:** Unit Test
**Result:** ✅ PASS — 1041 tests (523 backend + 518 frontend), zero failures

| Suite | Test Files | Tests | Failures | Duration |
|-------|-----------|-------|----------|----------|
| Backend | 27 | 523 | 0 | 2.74s |
| Frontend | 25 | 518 | 0 | 1.91s |
| **Total** | **52** | **1041** | **0** | **4.65s** |

**Note:** Test count grew from 1036 (Sprint 39) to 1041 (+5 new tests from T-308: 32.A–32.E for stay checkout time).

**Test coverage review for T-308 (Stay Checkout Time):**
- 32.A — STAY end-day pill shows "Checkout 11a" on desktop ✅ (happy path)
- 32.B — STAY end-day pill shows "Checkout" when end_time is null ✅ (error/null path)
- 32.C — STAY end-day in MobileDayList shows "{name} — Checkout {time}" ✅ (mobile happy path)
- 32.D — FLIGHT and LAND_TRAVEL end-day labels unaffected ✅ (regression)
- 32.E — STAY end-day pill has correct aria-label ✅ (accessibility)

**Coverage assessment:** ✅ Satisfactory — happy path, error path, regression, mobile, and a11y all covered.

**Minor observation:** One `act(...)` React warning in test 29.I (pre-existing since Sprint 29, not related to Sprint 40 changes). Non-blocking.

---

### 2. Integration Test — T-308: Stay Checkout Time on Calendar

**Test Type:** Integration Test
**Result:** ✅ PASS

**Code review of `frontend/src/components/TripCalendar.jsx` (T-308 changes):**

| Check | Result | Notes |
|-------|--------|-------|
| Desktop: `renderEventPill` STAY end-day branch | ✅ Pass | Lines 708–713: `event.type === 'STAY' && event._dayType === 'end'` → calls `buildArrivalLabel(event)` which returns `"Checkout {time}"` |
| Desktop: `buildArrivalLabel` STAY case | ✅ Pass | Lines 648–650: Returns `"Checkout {time}"` or `"Checkout"` (null fallback) |
| Mobile: `MobileDayList` STAY end-day branch | ✅ Pass | Lines 275–284: End-day shows `"{name} — Checkout {time}"` or `"{name} — Checkout"` |
| Mobile: STAY middle-day branch | ✅ Pass | Lines 285–289: Shows `"{name} (cont.)"` at 0.6 opacity |
| Null `end_time` fallback | ✅ Pass | Both desktop and mobile gracefully handle null end_time |
| No XSS vectors | ✅ Pass | All user data rendered via JSX text nodes, no `dangerouslySetInnerHTML` |
| FLIGHT end-day labels unaffected | ✅ Pass | Lines 701–703 unchanged, separate branch |
| LAND_TRAVEL end-day labels unaffected | ✅ Pass | Lines 654–696 unchanged, separate branch |
| Accessibility: aria-label on STAY end-day pills | ✅ Pass | `Stay: {name}, checkout {time}` (lines 711–713) |
| Spec 32 conformance | ✅ Pass | Label format matches spec: "Checkout" (capital C, one word) |

**API Contract Verification:**
- No new API endpoints for T-308 — uses existing `GET /api/v1/trips/:id/calendar`
- `end_time` field already present in calendar response (verified in api-contracts.md Sprint 25)
- No backend changes needed or made ✅

---

### 3. Integration Test — T-306: API Contract Docs Consistency

**Test Type:** Integration Test
**Result:** ✅ PASS

| Check | Result | Notes |
|-------|--------|-------|
| All historical "2000" references updated | ✅ Pass | All remaining "2000" instances are inside `[Updated Sprint 39 T-298: limit increased from 2000 to 5000]` annotations or in the Sprint 39 T-298 change record documenting the transition |
| No contradictory limits in api-contracts.md | ✅ Pass | All active limit references say 5000 |
| Backend Joi validation matches docs | ✅ Pass | `backend/src/routes/trips.js` lines 140 and 245: `maxLength: 5000` |
| Docs-only change — no code changes | ✅ Pass | T-306 modified only `.workflow/api-contracts.md` |

---

### 4. Integration Test — T-305: Production Deployment Health

**Test Type:** Integration Test
**Result:** ✅ PASS (verified via Deploy Engineer smoke tests)

Deploy Engineer reported 10/10 smoke tests passed on production:
- Health endpoint, frontend HTML, auth rejection, trip notes CRUD, XSS sanitizer, calendar — all operational
- Backend: `https://localhost:3002` ✅
- Frontend: `https://localhost:4174` ✅
- 1036 pre-deploy tests passed (note: this was before T-308 added 5 tests)

---

### 5. Config Consistency Check

**Test Type:** Config Consistency
**Result:** ✅ PASS — No mismatches found

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| Backend PORT (`.env`) | 3000 | `PORT=3000` | ✅ |
| Vite proxy target port | 3000 | `process.env.BACKEND_PORT \|\| '3000'` → defaults to 3000 | ✅ |
| Vite proxy protocol | http (dev) / https (when BACKEND_SSL=true) | Conditional: `backendSSL ? 'https' : 'http'` | ✅ |
| Backend SSL in dev | Disabled (commented out in .env) | SSL_KEY_PATH/SSL_CERT_PATH commented out | ✅ |
| CORS_ORIGIN includes frontend dev server | `http://localhost:5173` | `CORS_ORIGIN=http://localhost:5173` | ✅ |
| Docker compose backend PORT | 3000 | `PORT: 3000` | ✅ |
| Docker CORS_ORIGIN | Configurable | `${CORS_ORIGIN:-http://localhost}` | ✅ |

**Production config (PM2):**
- Backend port 3002 with HTTPS ✅
- Frontend port 4174 with HTTPS ✅
- These use separate production config, not dev .env — consistent ✅

---

### 6. Security Scan

**Test Type:** Security Scan
**Result:** ✅ PASS — All checklist items verified

#### Authentication & Authorization
| Item | Result | Evidence |
|------|--------|----------|
| All API endpoints require auth | ✅ Pass | Auth middleware on all `/trips`, `/flights`, `/stays`, `/activities`, `/land-travel`, `/calendar` routes. Smoke test #3–4 confirmed 401 on unauthenticated requests. |
| Auth tokens have expiration | ✅ Pass | `JWT_EXPIRES_IN=15m`, `JWT_REFRESH_EXPIRES_IN=7d` in .env |
| Password hashing uses bcrypt | ✅ Pass | `backend/src/seeds/test_user.js` uses `bcrypt.hash()` with configurable rounds |
| Rate limiting on auth endpoints | ✅ Pass | `loginLimiter`, `registerLimiter`, `generalAuthLimiter` in `middleware/rateLimiter.js` |

#### Input Validation & Injection Prevention
| Item | Result | Evidence |
|------|--------|----------|
| SQL queries use parameterized statements | ✅ Pass | Knex query builder used throughout (`tripModel.js`, `calendarModel.js`). `db.raw()` calls use safe patterns (e.g., `searchTerm` passed as parameterized value via `.whereRaw('... ILIKE ?', [searchTerm])`). |
| HTML output sanitized (XSS) | ✅ Pass | XSS sanitizer middleware active. Triple-nested XSS fix verified (T-296). No `dangerouslySetInnerHTML` in frontend except one documented comment in `formatDate.js` (not actually used). |
| Input validation on all endpoints | ✅ Pass | Joi/custom validation on all write endpoints. Notes max 5000 chars enforced. |

#### API Security
| Item | Result | Evidence |
|------|--------|----------|
| CORS configured correctly | ✅ Pass | `CORS_ORIGIN=http://localhost:5173` (dev). Production locked to frontend origin per Manager review. |
| Rate limiting on public endpoints | ✅ Pass | Auth routes rate-limited. |
| API responses don't leak internals | ✅ Pass | Structured error JSON with message + status code. No stack traces. |
| Security headers (Helmet.js) | ✅ Pass | `helmet()` applied in `app.js` line 23. Adds X-Content-Type-Options, X-Frame-Options, etc. |

#### Data Protection
| Item | Result | Evidence |
|------|--------|----------|
| Credentials in env vars, not code | ✅ Pass | `JWT_SECRET`, `DATABASE_URL` in .env. Docker uses `${JWT_SECRET:?}` required vars. No hardcoded secrets in source code. |
| No secrets in committed files | ✅ Pass | `.env` is gitignored. JWT_SECRET in .env is placeholder `change-me-to-a-random-string`. |
| Logs don't contain PII | ✅ Pass | No token/password logging in source code. |

#### Infrastructure
| Item | Result | Evidence |
|------|--------|----------|
| HTTPS enforced on staging/production | ✅ Pass | PM2 production config uses HTTPS on ports 3002/4174. TLS certs configured. |
| Dependencies checked for vulnerabilities | ✅ Pass | `npm audit` → 0 vulnerabilities |
| Default credentials removed | ✅ Pass | Test user seed uses bcrypt hashed password, not production credentials. JWT_SECRET is placeholder. |

**Security scan: 0 findings. No P1 issues.**

---

### Summary

| Task | Test Type | Result | Notes |
|------|-----------|--------|-------|
| T-305 | Integration Test | ✅ Pass | Production deployment verified via smoke tests |
| T-306 | Integration Test | ✅ Pass | API docs consistent — all notes limits say 5000 |
| T-308 | Unit Test | ✅ Pass | 5 new tests (32.A–32.E) all passing |
| T-308 | Integration Test | ✅ Pass | Desktop + mobile checkout time matches Spec 32 |
| All | Unit Test | ✅ Pass | 1041 total (523 backend + 518 frontend), 0 failures |
| All | Config Consistency | ✅ Pass | No mismatches between .env, vite.config.js, docker-compose.yml |
| All | Security Scan | ✅ Pass | 18-point checklist verified, 0 vulnerabilities, 0 findings |

**Verdict: All tasks pass. T-309 complete. Ready for Monitor Agent (T-310).**

*QA Engineer — Sprint 40 — 2026-03-30*

---

## Sprint #40 — Deploy Engineer — Production Deployment — T-305 — 2026-03-30

**Task:** T-305 (Deploy Engineer: Production deployment of Sprint 39 code)
**Date:** 2026-03-30
**Sprint:** 40
**Environment:** Production
**Timestamp:** 2026-03-30T15:37:00Z
**Overall Result:** ✅ PASS — Production deployed successfully

---

### Pre-Deploy Verification

**Test Type:** Full Test Suite
**Result:** ✅ PASS — 1036 tests (523 backend + 513 frontend), zero failures

| Suite | Tests | Failures | Duration |
|-------|-------|----------|----------|
| Backend (27 test files) | 523 | 0 | 2.94s |
| Frontend (25 test files) | 513 | 0 | 2.09s |
| **Total** | **1036** | **0** | **5.03s** |

**Frontend Build:** ✅ Success (509ms, 300.30 KB main bundle gzipped to 95.80 KB)

**Dependency Audit:** ✅ 0 vulnerabilities (backend + frontend)

**Migration Check:** ✅ No new migrations needed — Sprint 39 changes are validation-layer only. Migration log remains at 10 applied migrations (001–010).

---

### Deployment Details

**Method:** PM2 (ecosystem.production.config.cjs)
**Branch:** `fix/T-279-page-branding-fix` (current branch with Sprint 39+40 code)
**Commit:** `7ef0840` (checkpoint: sprint #40 -- phase 'contracts' complete)

| Service | Process Name | Port | Protocol | Status |
|---------|-------------|------|----------|--------|
| Backend | triplanner-prod-backend | 3002 | HTTPS | ✅ Online |
| Frontend | triplanner-prod-frontend | 4174 | HTTPS | ✅ Online |

**Production URLs:**
- Backend: `https://localhost:3002`
- Frontend: `https://localhost:4174`
- Health: `https://localhost:3002/api/v1/health`

---

### Production Smoke Tests

**Test Type:** Post-Deploy Smoke Tests
**Result:** ✅ PASS — 10/10 smoke tests passed

| # | Test | Expected | Actual | Result |
|---|------|----------|--------|--------|
| 1 | Health endpoint | `{"status":"ok"}` | `{"status":"ok"}` | ✅ Pass |
| 2 | Frontend serves HTML | `<!doctype html>` | `<!doctype html>` | ✅ Pass |
| 3 | Auth rejects invalid creds | HTTP 401 | HTTP 401 | ✅ Pass |
| 4 | Trips requires auth | HTTP 401 | HTTP 401 | ✅ Pass |
| 5 | Register test user | 200 + token | Token returned | ✅ Pass |
| 6 | Create trip with notes | 201 + notes saved | Notes: "Sprint 39 production deploy test notes." | ✅ Pass |
| 7 | Update trip notes | 200 + notes updated | Notes: "Updated notes for production verification." | ✅ Pass |
| 8 | Clear trip notes | 200 + notes null | Notes: None | ✅ Pass |
| 9 | XSS sanitizer (triple-nested) | Script tags stripped | Output: `alert(1)` — all tags stripped | ✅ Pass |
| 10 | Calendar endpoint | HTTP 200 | HTTP 200 | ✅ Pass |

**Sprint 39 Feature Verification:**
- ✅ Trip notes CRUD works on production (create, read, update, clear)
- ✅ Triple-nested XSS fix verified on production (T-296)
- ✅ XSS sanitization strips all script tags from notes
- ✅ Calendar endpoint operational
- ✅ Auth flow functional (register, login rejection)

**No 5xx errors detected. No regressions.**

---

### Infrastructure Files Created (T-305)

| File | Purpose |
|------|---------|
| `infra/ecosystem.production.config.cjs` | PM2 production config (port 3002/4174, HTTPS, NODE_ENV=production) |
| `infra/scripts/deploy-production.sh` | Production deployment script with automated smoke tests |

---

## Sprint #39 — Monitor Agent — Post-Deploy Health Check — T-303 — 2026-03-30

**Task:** T-303 (Monitor Agent: Staging health check)
**Date:** 2026-03-30
**Sprint:** 39
**Environment:** Staging
**Timestamp:** 2026-03-30T13:32:00Z
**Token:** Acquired via `POST /api/v1/auth/login` with `test@triplanner.local` (NOT /auth/register)
**Overall Result:** ✅ PASS — Deploy Verified = Yes

---

### Config Consistency Validation

**Test Type:** Config Consistency
**Result:** ✅ PASS

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| Port match | Backend `PORT` (3000) = Vite proxy target port (default 3000) | `.env` PORT=3000, `vite.config.js` defaults to port 3000 via `BACKEND_PORT \|\| '3000'` | ✅ Match |
| Protocol match | SSL_KEY_PATH + SSL_CERT_PATH both commented out → HTTP. Vite proxy uses `http://` by default | SSL vars commented out in `.env`, Vite uses `backendSSL = process.env.BACKEND_SSL === 'true'` (defaults false → `http://`) | ✅ Match |
| CORS match | `CORS_ORIGIN` includes `http://localhost:5173` | `CORS_ORIGIN=http://localhost:5173` in `.env`, Vite dev server runs on port 5173 | ✅ Match |
| Docker port match | docker-compose backend PORT = `.env` PORT | docker-compose sets `PORT: 3000`, `.env` sets `PORT=3000` | ✅ Match |

**Notes:** Staging environment runs on PORT 3001 with HTTPS (per Deploy Engineer T-302 handoff), which uses a separate staging `.env` configuration. The development `.env` checked into the repo is internally consistent. Docker healthcheck targets `http://localhost:3000` which matches the container-internal PORT. No mismatches detected.

---

### Health Check: Application Responds

**Test Type:** Post-Deploy Health Check
**Result:** ✅ PASS

| Check | Endpoint | Expected | Actual | Result |
|-------|----------|----------|--------|--------|
| Health endpoint | `GET https://localhost:3001/api/v1/health` | HTTP 200, `{"status":"ok"}` | HTTP 200, `{"status":"ok"}` | ✅ Pass |
| Frontend serving | `GET https://localhost:4173/` | HTTP 200 | HTTP 200 | ✅ Pass |
| Database connected | (covered by health endpoint) | 200 OK | 200 OK | ✅ Pass |

---

### Health Check: Auth Flow

**Test Type:** Post-Deploy Health Check
**Result:** ✅ PASS

| Check | Endpoint | Expected | Actual | Result |
|-------|----------|----------|--------|--------|
| Login | `POST /api/v1/auth/login` (test@triplanner.local) | 200 with `access_token` | 200, token returned, user object correct | ✅ Pass |

---

### Health Check: Key API Endpoints

**Test Type:** Post-Deploy Health Check
**Result:** ✅ PASS

| Endpoint | Method | Status | Response Shape | Result |
|----------|--------|--------|----------------|--------|
| `/api/v1/trips` | GET | 200 | `{ data: [...], pagination: { page, limit, total } }` | ✅ Pass |
| `/api/v1/trips` | POST | 201 | `{ data: { id, name, destinations, status, notes, ... } }` | ✅ Pass |
| `/api/v1/trips/:id` | GET | 200 | `{ data: { id, name, destinations, status, notes, ... } }` | ✅ Pass |
| `/api/v1/trips/:id` | PATCH | 200 | `{ data: { ... updated fields } }` — notes updated correctly | ✅ Pass |
| `/api/v1/trips/:id` | PATCH (clear notes) | 200 | `{ data: { notes: null } }` — notes cleared to null | ✅ Pass |
| `/api/v1/trips/:id` | DELETE | 204 | No body | ✅ Pass |
| `/api/v1/trips/:id/calendar` | GET | 200 | `{ data: { trip_id, events: [...] } }` | ✅ Pass |
| `/api/v1/trips/:tripId/activities` | GET | 200 | `{ data: [] }` | ✅ Pass |
| `/api/v1/trips/:tripId/land-travel` | GET | 200 | `{ data: [] }` | ✅ Pass |

**No 5xx errors detected.**

---

