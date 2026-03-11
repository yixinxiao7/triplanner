# QA & Build Log

Tracks test runs, build results, and post-deploy health checks per sprint. Maintained by QA Engineer, Deploy Engineer, and Monitor Agent.

---

## Sprint #27 — T-228 Fix A: CORS Staging Fix — 2026-03-11T18:09:00Z

**Task:** T-228 (Deploy Engineer: Fix A — CORS_ORIGIN env var injected via pm2 ecosystem config)
**Date:** 2026-03-11
**Engineer:** Deploy Engineer
**Sprint:** 27
**Environment:** Staging

---

### Fix A Summary

**Problem:** `infra/ecosystem.config.cjs` was missing `CORS_ORIGIN` in the `triplanner-backend` env block. ESM static import hoisting caused `app.js` to capture `process.env.CORS_ORIGIN` as `undefined` before `dotenv.config()` ran in `index.js`, resulting in the fallback `'http://localhost:5173'` being used for the CORS origin. All browser-initiated API calls from the staging frontend (`https://localhost:4173`) were rejected with a CORS error.

**Fix Applied:** Added `CORS_ORIGIN: 'https://localhost:4173'` to the `triplanner-backend` env block in `infra/ecosystem.config.cjs`. pm2 injects env vars before the Node process starts, so the value is correct when `app.js` captures it at module initialization.

**Deployment Method:** `pm2 delete triplanner-backend && pm2 start infra/ecosystem.config.cjs --only triplanner-backend`

---

### CORS Verification Results

| Test | Command | Expected | Actual | Result |
|------|---------|----------|--------|--------|
| GET from staging origin | `curl -sk -I https://localhost:3001/api/v1/health -H "Origin: https://localhost:4173"` | `Access-Control-Allow-Origin: https://localhost:4173` | `Access-Control-Allow-Origin: https://localhost:4173` | ✅ PASS |
| `Access-Control-Allow-Credentials` | Same as above | `true` | `Access-Control-Allow-Credentials: true` | ✅ PASS |
| OPTIONS preflight from staging origin | `curl -sk -I -X OPTIONS https://localhost:3001/api/v1/health -H "Origin: https://localhost:4173" -H "Access-Control-Request-Method: GET"` | `204 No Content` + ACAO header | `204 No Content` + `Access-Control-Allow-Origin: https://localhost:4173` | ✅ PASS |
| Preflight `Access-Control-Allow-Credentials` | Same as above | `true` | `Access-Control-Allow-Credentials: true` | ✅ PASS |
| Preflight methods | Same as above | GET,HEAD,PUT,PATCH,POST,DELETE | `Access-Control-Allow-Methods: GET,HEAD,PUT,PATCH,POST,DELETE` | ✅ PASS |
| Health endpoint response | `curl -sk https://localhost:3001/api/v1/health` | `{"status":"ok"}` | `{"status":"ok"}` | ✅ PASS |
| pm2 process status | `pm2 list` | `triplanner-backend` online | `online`, pid 70180 | ✅ PASS |

**All 7 checks PASS.** Fix A is live and verified.

---

### pm2 Status After Fix

| App | Status | PID | Restarts |
|-----|--------|-----|---------|
| triplanner-backend | online | 70180 | 0 (clean start) |
| triplanner-frontend | online | 64982 | 6 |

---

### Fix A Definition of Done

- [x] `CORS_ORIGIN: 'https://localhost:4173'` added to `infra/ecosystem.config.cjs` triplanner-backend env block
- [x] `pm2 delete + pm2 start` applied (fresh start from updated ecosystem config)
- [x] `curl -sk -I https://localhost:3001/api/v1/health -H "Origin: https://localhost:4173"` → `Access-Control-Allow-Origin: https://localhost:4173` ✅
- [x] OPTIONS preflight → `204 No Content` with correct CORS headers ✅
- [x] Backend health endpoint → `{"status":"ok"}` ✅

**Fix A Status: ✅ COMPLETE — User Agent browser testing is now UNBLOCKED**

---

### Notes for Monitor Agent

- Handoff logged separately in `handoff-log.md`
- Fix B (Backend Engineer: ESM dotenv hoisting refactor) is a separate task in T-228 — deploy engineer scope is complete
- T-224 (production deployment) remains blocked pending project owner provisioning of AWS RDS + Render access

---

## Sprint #26 — T-227 Staging Deploy — 2026-03-11T00:00:00Z

**Task:** T-227 (Deploy Engineer: Sprint 26 staging re-deployment)
**Date:** 2026-03-11
**Engineer:** Deploy Engineer
**Sprint:** 26

---

### Pre-Deploy Gate

| Check | Result |
|-------|--------|
| QA handoff (T-223) confirmed in handoff-log.md | ✅ PASS |
| Backend tests: 355/355 | ✅ PASS (per T-223 QA re-verification) |
| Frontend tests: 486/486 | ✅ PASS (per T-223 QA re-verification) |
| npm audit: 0 vulnerabilities | ✅ PASS |
| No new migrations for Sprint 26 | ✅ CONFIRMED (technical-context.md Sprint 26 note) |
| All Sprint 26 tasks Done or Blocked (project owner) | ✅ CONFIRMED (T-220 ✅, T-221 ✅, T-222 ✅, T-226 ✅) |

---

### Dependency Install

| Package | Result |
|---------|--------|
| `cd backend && npm install` | ✅ 0 vulnerabilities |
| `cd frontend && npm install` | ✅ 0 vulnerabilities |

---

### Build

| Step | Result |
|------|--------|
| `cd frontend && npm run build` | ✅ SUCCESS |
| Vite version | v6.4.1 |
| Modules transformed | 128 |
| Errors | 0 |
| Output — index.html | `dist/index.html` (0.46 kB, gzip 0.29 kB) |
| Output — CSS bundle | `dist/assets/index-CPOhaw0p.css` (84.43 kB, gzip 13.30 kB) |
| Output — JS bundle | `dist/assets/index-Bz9Y7ALz.js` (345.83 kB, gzip 105.16 kB) |
| Build time | 467ms |

**Build Status: ✅ SUCCESS**

---

### Database Migrations

| Step | Result |
|------|--------|
| `cd backend && npm run migrate` | ✅ Already up to date |
| Environment | development (staging DB) |
| Migrations applied | None (all 10 migrations 001–010 already applied — schema stable since Sprint 10) |
| New migrations for Sprint 26 | None — T-220/T-221/T-226 are config/cookie/seed changes only |

---

### Staging Deployment

**Environment:** Staging (local — pm2 managed processes)
**Docker:** Not available — using pm2 with local processes per staging architecture

| Step | Result |
|------|--------|
| `pm2 reload triplanner-frontend` (PID 64982) | ✅ Online |
| `pm2 restart triplanner-backend` (PID 65028) | ✅ Online |

---

### Smoke Tests

| Test | URL | Result |
|------|-----|--------|
| Backend health check | `GET https://localhost:3001/api/v1/health` | ✅ `{"status":"ok"}` |
| Frontend load | `GET https://localhost:4173` | ✅ HTTP 200 |

**Deployment Status: ✅ SUCCESS**

---

### Summary

| Item | Value |
|------|-------|
| Environment | Staging (local pm2) |
| Build Status | ✅ Success |
| Frontend URL | https://localhost:4173 |
| Backend URL | https://localhost:3001 |
| Backend Health | https://localhost:3001/api/v1/health → `{"status":"ok"}` |
| Migrations | None required (all 10 applied, schema stable) |
| Seed script | Not run against staging (optional per technical-context.md Sprint 26 note) |
| Handoff | → Monitor Agent (post-deploy health check) |

**Note on T-224 (Production Deploy):** T-224 remains ⛔ BLOCKED — project owner must provision AWS RDS + Render account. All application code is production-ready. `render.yaml` and `docs/production-deploy-guide.md` are in place. This staging deploy confirms the Sprint 26 code changes (T-220, T-221, T-226) are running correctly on the local staging environment.

---

## Sprint #26 — T-228 Post-Deploy Health Check — 2026-03-11T14:20:00Z

**Task:** T-228 (Monitor Agent: Sprint 26 post-deploy health check)
**Date:** 2026-03-11
**Agent:** Monitor Agent
**Sprint:** 26
**Environment:** Staging (local — `https://localhost:3001` backend, `https://localhost:4173` frontend)

---

### Test Type: Config Consistency Check

**Sources read:** `backend/.env.staging` (active on staging, loaded when NODE_ENV=staging), `frontend/vite.config.js`, `infra/ecosystem.config.cjs`, `infra/docker-compose.yml`

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| Staging backend PORT (`.env.staging`) | 3001 | 3001 | ✅ PASS |
| ecosystem.config.cjs backend PORT env | 3001 | `PORT: 3001` confirmed | ✅ PASS |
| ecosystem.config.cjs BACKEND_PORT (frontend) | 3001 | `BACKEND_PORT: '3001'` confirmed | ✅ PASS |
| ecosystem.config.cjs BACKEND_SSL (frontend) | true | `BACKEND_SSL: 'true'` confirmed | ✅ PASS |
| SSL active on backend (`.env.staging`) | Yes — SSL_KEY_PATH + SSL_CERT_PATH set | Both set; cert files confirmed present at `infra/certs/localhost.pem` + `infra/certs/localhost-key.pem` | ✅ PASS |
| Vite proxy target protocol | `https://` (BACKEND_SSL=true) | `https://localhost:3001` | ✅ PASS |
| CORS_ORIGIN config value (`.env.staging`) | `https://localhost:4173` | `https://localhost:4173` | ✅ PASS (config file) |
| **CORS_ORIGIN runtime (actual HTTP header)** | `https://localhost:4173` | **`http://localhost:5173` (fallback default)** | ❌ **FAIL** |
| Docker-compose backend PORT | 3000 (container-internal, not in use) | `PORT: 3000` — confirmed not running (pm2 only) | ✅ PASS (N/A) |
| knexfile.js staging seeds directory | Present | **Missing** — staging block has no `seeds` config | ⚠️ MINOR |

**Config Consistency Result: ❌ FAIL — CORS runtime mismatch**

**Root Cause (CORS failure):**

`backend/src/index.js` uses ESM static imports. In ESM, all `import` statements are hoisted and executed before the module body runs. This means `import app from './app.js'` causes `app.js` to be fully evaluated — including `cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' })` — **before** the `dotenv.config({ path: '.env.staging' })` call runs. At the moment the cors middleware is initialized, `process.env.CORS_ORIGIN` is `undefined`, so it captures the hardcoded fallback `http://localhost:5173`.

`PORT=3001` works correctly because it is explicitly set in `ecosystem.config.cjs`'s `env` block (injected by pm2 before node starts). `CORS_ORIGIN` is not in that block — it only lives in `.env.staging` — so it is never available at app.js load time.

**Confirmed via live HTTP response header:**
```
curl -sk -I https://localhost:3001/api/v1/health -H "Origin: https://localhost:4173"
→ Access-Control-Allow-Origin: http://localhost:5173   ← WRONG (should be https://localhost:4173)
```

**Impact:** The staging frontend at `https://localhost:4173` cannot make browser-initiated API calls to the staging backend. All fetch/XHR requests from the staging frontend will be blocked by the browser's CORS enforcement. Direct curl and Playwright tests against the API are unaffected (no browser CORS enforcement on those).

**Required Fix (two options — either resolves the issue):**

*Option A (preferred — no code change, fastest fix):*
Add `CORS_ORIGIN: 'https://localhost:4173'` to the `triplanner-backend` env block in `infra/ecosystem.config.cjs`:
```js
env: {
  NODE_ENV: 'staging',
  PORT: 3001,
  CORS_ORIGIN: 'https://localhost:4173',  // ← add this line
},
```
Then `pm2 restart triplanner-backend`.

*Option B (code fix — makes dotenv robust for ESM):*
Move dotenv loading to a dedicated `loadEnv.js` module that is imported before `app.js`, ensuring env vars are populated before any middleware is configured.

**Secondary Issue — knexfile.js staging seeds missing (Minor):**
The `staging` environment block in `backend/src/config/knexfile.js` has no `seeds` directory configured. Running `NODE_ENV=staging npm run seed` fails with `ENOENT: no such file or directory, scandir .../src/config/seeds`. Workaround used: `NODE_ENV=development npm run seed` (same local DB). Fix: add `seeds: { directory: seedsDir }` to the staging block in `knexfile.js`.

---

### Test Type: Post-Deploy Health Check

**Environment:** Staging
**Timestamp:** 2026-03-11T14:18:00Z
**Token:** Acquired via `POST https://localhost:3001/api/v1/auth/login` with `test@triplanner.local` / `TestPass123!` (seed run first: `NODE_ENV=development npm run seed`)

#### Endpoint Checks

| Check | Method | URL | Status Code | Response | Result |
|-------|--------|-----|-------------|----------|--------|
| Health endpoint | GET | `https://localhost:3001/api/v1/health` | 200 | `{"status":"ok"}` | ✅ PASS |
| Auth — login (seeded user) | POST | `https://localhost:3001/api/v1/auth/login` | 200 | `{"data":{"user":{...},"access_token":"eyJ..."}}` | ✅ PASS |
| Auth — refresh (no cookie) | POST | `https://localhost:3001/api/v1/auth/refresh` | 401 | `UNAUTHORIZED` | ✅ PASS (expected) |
| Auth — logout | POST | `https://localhost:3001/api/v1/auth/logout` | 204 | (no body) | ✅ PASS |
| Trips — list (empty) | GET | `https://localhost:3001/api/v1/trips` | 200 | `{"data":[],"pagination":{"page":1,"limit":20,"total":0}}` | ✅ PASS |
| Trips — list with status filter | GET | `https://localhost:3001/api/v1/trips?status=PLANNING` | 200 | `{"data":[...],"pagination":{...}}` | ✅ PASS |
| Trips — create | POST | `https://localhost:3001/api/v1/trips` | 201 | Trip object with UUID, `status: "PLANNING"` | ✅ PASS |
| Trips — get single | GET | `https://localhost:3001/api/v1/trips/:id` | 200 | Trip object | ✅ PASS |
| Trips — update | PATCH | `https://localhost:3001/api/v1/trips/:id` | 200 | Updated trip | ✅ PASS |
| Trips — delete | DELETE | `https://localhost:3001/api/v1/trips/:id` | 204 | (no body) | ✅ PASS |
| Calendar aggregation (T-212) | GET | `https://localhost:3001/api/v1/trips/:id/calendar` | 200 | `{"data":{"trip_id":"...","events":[]}}` | ✅ PASS |
| Flights — list | GET | `https://localhost:3001/api/v1/trips/:id/flights` | 200 | `{"data":[]}` | ✅ PASS |
| Stays — list | GET | `https://localhost:3001/api/v1/trips/:id/stays` | 200 | `{"data":[]}` | ✅ PASS |
| Activities — list | GET | `https://localhost:3001/api/v1/trips/:id/activities` | 200 | `{"data":[]}` | ✅ PASS |
| Frontend build (dist/) | — | `frontend/dist/index.html` | — | Present: `index.html`, `assets/` | ✅ PASS |
| Frontend server | GET | `https://localhost:4173` | 200 | HTML page loads | ✅ PASS |
| CORS header (runtime) | GET | `https://localhost:3001/api/v1/health` (Origin: https://localhost:4173) | — | `Access-Control-Allow-Origin: http://localhost:5173` | ❌ **FAIL** |
| No 5xx errors in logs | — | `pm2 logs triplanner-backend --lines 20` | — | 0 5xx errors; 2 SyntaxError entries (bad JSON from monitor test tooling) | ✅ PASS |
| Database connectivity | — | Validated via health + trips CRUD | — | Postgres reads/writes succeed | ✅ PASS |
| Rate limiter not exhausted | — | Login succeeds, no 429 | 200 | Token returned | ✅ PASS |

#### Summary

| Item | Value |
|------|-------|
| Environment | Staging (local pm2) |
| Backend URL | `https://localhost:3001` |
| Frontend URL | `https://localhost:4173` |
| Seed required | Yes — `NODE_ENV=development npm run seed` (1 seed file applied) |
| API endpoints tested | 14 |
| Passed | 13 |
| Failed | 1 (CORS runtime) |
| Database | ✅ Connected and responding |
| 5xx errors | 0 |
| **Deploy Verified** | ❌ **No** |

**Error Summary:**
- **[MAJOR] CORS Runtime Mismatch** — Backend serving `Access-Control-Allow-Origin: http://localhost:5173` instead of `https://localhost:4173`. ESM hoisting causes `app.js` CORS middleware to capture `process.env.CORS_ORIGIN` before `dotenv.config()` loads `.env.staging`. Fastest fix: add `CORS_ORIGIN: 'https://localhost:4173'` to ecosystem.config.cjs backend env block, then `pm2 restart triplanner-backend`.
- **[MINOR] knexfile.js staging seeds** — `staging` block missing `seeds.directory` config; `npm run seed` fails with NODE_ENV=staging.

---

## Sprint #25 — T-216 Post-Deploy Health Check — 2026-03-10T23:10:00Z

**Date:** 2026-03-10
**Agent:** Monitor Agent (T-216)
**Task:** T-216 — Sprint 25 post-deploy health check
**Environment:** Staging (local — `https://localhost:3001` backend, `https://localhost:4173` frontend)

---

### Test Type: Config Consistency Check

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| Staging backend PORT | 3001 | 3001 (from `backend/.env.staging`) | ✅ PASS |
| SSL active on backend | Yes (SSL_KEY_PATH + SSL_CERT_PATH set) | Yes — HTTPS confirmed on port 3001 | ✅ PASS |
| Vite proxy target protocol | https:// (BACKEND_SSL=true) | `https://localhost:3001` (BACKEND_SSL=true set in ecosystem.config.cjs) | ✅ PASS |
| Vite proxy target port | 3001 | 3001 (BACKEND_PORT=3001 in ecosystem.config.cjs) | ✅ PASS |
| Vite dev server port | 4173 (preview) | 4173 | ✅ PASS |
| CORS_ORIGIN (staging) | https://localhost:4173 | `https://localhost:4173` (from `backend/.env.staging`) | ✅ PASS |
| Docker-compose backend PORT | 3000 | `PORT: 3000` (environment override in docker-compose.yml) | ✅ PASS |
| ecosystem.config.cjs BACKEND_PORT | 3001 | `'3001'` confirmed | ✅ PASS |
| ecosystem.config.cjs BACKEND_SSL | true | `'true'` confirmed | ✅ PASS |

**Config Consistency Result: ✅ ALL PASS**

**Notes:**
- Staging uses `backend/.env.staging` (PORT=3001, SSL enabled, CORS_ORIGIN=https://localhost:4173). Base `backend/.env` (PORT=3000, no SSL, CORS_ORIGIN=http://localhost:5173) applies only to local development — not a mismatch.
- Docker-compose defines PORT=3000 which matches the base `backend/.env` for containerized deployment — no mismatch.
- A second backend process (PID 53257) is listening on port 3000 over HTTPS — started by Deploy Engineer during T-215 execution. Not a config error; staging checks target port 3001.

---

### Test Type: Post-Deploy Health Check

#### Infrastructure

| Check | Result | Details |
|-------|--------|---------|
| pm2 `triplanner-backend` | ✅ ONLINE | PID 53244, uptime 6m, NODE_ENV=staging, PORT=3001 |
| pm2 `triplanner-frontend` | ✅ ONLINE | PID 53278, uptime 6m, BACKEND_PORT=3001, BACKEND_SSL=true |
| Backend HTTPS port 3001 | ✅ ACTIVE | `lsof -iTCP:3001` → PID 53244 listening |
| Frontend HTTPS port 4173 | ✅ ACTIVE | `lsof -iTCP:4173` → PID 53295 listening |
| frontend/dist/ build artifacts | ✅ PRESENT | `index-Bz9Y7ALz.js` + `index-CPOhaw0p.css` |

#### API Endpoint Health

| Endpoint | Method | Expected | Status | Body |
|----------|--------|----------|--------|------|
| `https://localhost:3001/api/v1/health` | GET | 200 | ✅ 200 | `{"status":"ok"}` |
| `https://localhost:4173/` | GET | 200 | ✅ 200 | HTML |
| `https://localhost:4173/api/v1/health` (proxy) | GET | 200 | ✅ 200 | `{"status":"ok"}` |
| `POST /api/v1/auth/login` (invalid creds) | POST | 401 | ✅ 401 | `{"error":{"message":"Incorrect email or password","code":"INVALID_CREDENTIALS"}}` |
| `GET /api/v1/trips` (no auth) | GET | 401 | ✅ 401 | UNAUTHORIZED |
| `GET /api/v1/trips/:id/calendar` (no auth) | GET | 401 | ✅ 401 | UNAUTHORIZED |
| `POST /api/v1/auth/register` | POST | 201 | ✅ 201 | User created, access_token returned |
| `GET /api/v1/trips` (with auth) | GET | 200 | ✅ 200 | Empty list + pagination |
| `POST /api/v1/trips` | POST | 201 | ✅ 201 | Trip created with id, status=PLANNING, notes/start_date/end_date fields present |
| `GET /api/v1/trips/:id` | GET | 200 | ✅ 200 | Trip with `notes` key present ✅ (Sprint 20 regression) |
| `PATCH /api/v1/trips/:id` status=ONGOING | PATCH | 200 | ✅ 200 | Sprint 22 regression ✅ |
| `GET /api/v1/trips/:id/flights` | GET | 200 | ✅ 200 | Empty array |
| `GET /api/v1/trips/:id/stays` | GET | 200 | ✅ 200 | Empty array |
| `GET /api/v1/trips/:id/activities` | GET | 200 | ✅ 200 | Empty array |
| `GET /api/v1/trips/:id/land-travel` | GET | 200 | ✅ 200 | Empty array |
| `GET /api/v1/trips/:id/calendar` (with auth) | GET | 200 | ✅ 200 | `{"data":{"trip_id":"...","events":[]}}` |
| `POST /api/v1/auth/refresh` (no cookie) | POST | 401 | ✅ 401 | INVALID_REFRESH_TOKEN |
| `POST /api/v1/auth/logout` (with auth) | POST | 204 | ✅ 204 | Empty body |

#### Regression Checks

| Sprint | Feature | Result |
|--------|---------|--------|
| Sprint 16 | `start_date`/`end_date` keys on trip objects | ✅ PASS — both present (`null` as expected for new trip) |
| Sprint 19 | `RateLimit-Limit: 10` header on `POST /auth/login` | ✅ PASS — `RateLimit-Limit: 10` confirmed |
| Sprint 20 | `notes` key on `GET /api/v1/trips/:id` | ✅ PASS — `"notes":null` present |
| Sprint 22 | `PATCH /trips/:id` `{status:"ONGOING"}` → 200 | ✅ PASS |
| Sprint 24 | Frontend loads (StatusFilterTabs in bundle) | ✅ PASS — HTTP 200, build confirmed |

## Sprint 26 — Deploy Engineer Log

### T-218: Backend Restart + Playwright Rerun
**Date:** 2026-03-11
**Agent:** Deploy Engineer
**Task:** Resolve T-216 carry-over — restart backend to clear rate limiter, rerun Playwright

#### Backend Restart
- Command: `pm2 restart triplanner-backend`
- Previous state: `triplanner-backend` PID 55180, uptime 10h, 11 restarts
- After restart: PID 61952, status online ✅
- Health check immediately after restart: `GET https://localhost:3001/api/v1/health` → `{"status":"ok"}` ✅

#### Playwright Results (First Run — Post-Restart)
| Test | Result | Notes |
|------|--------|-------|
| Test 1: Core user flow | ❌ FAIL | Wrong aria-label in test spec — `getByLabel('Add destination')` resolved to disabled button, not input |
| Test 2: Sub-resource CRUD | ❌ FAIL | Same aria-label issue |
| Test 3: Search, filter, sort | ❌ FAIL | Same aria-label issue |
| Test 4: Rate limit lockout | ✅ PASS | Rate limiter cleared by restart — working correctly |

**Root cause of Tests 1–3 failure:** Test spec (line 88, `critical-flows.spec.js`) used stale selector `getByLabel('Add destination')` which resolves to the disabled `<button aria-label="Add destination">+</button>` in `DestinationChipInput`. The actual text input has `aria-label="New destination"`. This is a test spec bug, not application code.

#### Test Spec Fix Applied
- File: `e2e/critical-flows.spec.js` line 88
- Changed: `dialog.getByLabel('Add destination')` → `dialog.getByLabel('New destination')`
- Also corrected stale comment on line 87

#### Playwright Results (Second Run — After Aria-Label Fix)
| Test | Result | Notes |
|------|--------|-------|
| Test 1: Core user flow | ✅ PASS | |
| Test 2: Sub-resource CRUD | ❌ FAIL | Strict mode violation — `getByText('SFO')` now matches 3 elements due to Sprint 25 TripCalendar pills in DOM |
| Test 3: Search, filter, sort | ❌ FAIL | Rate limiter hit within test run — Tests 1+2 each register a user, exhausting quota before Test 3 |
| Test 4: Rate limit lockout | ✅ PASS | |

**Final result: 2/4 PASS**

#### Root Cause Analysis — Remaining Failures
| Test | Root Cause | Type |
|------|-----------|------|
| Test 2 | `getByText('SFO')` strict mode violation — Sprint 25 TripCalendar event pills add airport text to DOM, creating 3 matches. Spec predates calendar component. | Test spec regression — Frontend/QA scope |
| Test 3 | Rate limiter exhausted during test run — each test registers a new user; by Test 3 the per-IP limit is hit. Tests need a shared test user or wider window between runs. | Test architecture — QA scope |

**Assessment:** The backend restart DID clear the rate limiter state. T-218's original hypothesis (rate limiter from Monitor Agent registration) was correct for the Sprint 25 failure. However, the test spec contained pre-existing bugs (wrong aria-label, strict mode, intra-run rate exhaustion) now exposed. Tests require QA/Frontend updates.

**Blocker:** Playwright 4/4 gate cannot be reached without test spec updates to account for Sprint 25 TripCalendar DOM changes. Logged in handoff-log.md for Manager and QA.

---

### T-222: render.yaml Blueprint + Production Deploy Guide
**Date:** 2026-03-11
**Agent:** Deploy Engineer
**Task:** Create render.yaml and docs/production-deploy-guide.md

#### Files Created
| File | Status |
|------|--------|
| `render.yaml` (project root) | ✅ Created |
| `docs/production-deploy-guide.md` | ✅ Created |

#### render.yaml — Verification Checklist
| Check | Result |
|-------|--------|
| Two services defined (backend web + frontend static) | ✅ |
| Backend region: ohio | ✅ |
| Frontend region: ohio | ✅ |
| Backend plan: free | ✅ |
| Frontend plan: free | ✅ |
| Backend buildCommand: `npm install` (in rootDir: backend) | ✅ |
| Backend startCommand: `node src/index.js` | ✅ |
| Frontend buildCommand: `cd frontend && npm install && npm run build` | ✅ |
| Frontend staticPublishPath: `frontend/dist` | ✅ |
| SPA routing: rewrite rule `/* → /index.html` | ✅ |
| `NODE_ENV=production` set for backend | ✅ |
| DATABASE_URL: `sync: false` (no hardcoded value) | ✅ |
| JWT_SECRET: `generateValue: true` (Render auto-generates) | ✅ |
| CORS_ORIGIN: `sync: false` (no hardcoded value) | ✅ |
| VITE_API_URL: `sync: false` (no hardcoded value) | ✅ |
| No hardcoded secrets in file | ✅ |
| healthCheckPath defined: `/api/v1/health` | ✅ |

#### docs/production-deploy-guide.md — Coverage Checklist
| Section | Status |
|---------|--------|
| Render account setup + connecting repo | ✅ |
| AWS RDS free-tier instance setup (PostgreSQL 15, db.t3.micro, us-east-1) | ✅ |
| Security group configuration for Render egress | ✅ |
| Environment variable configuration table (all vars, both services) | ✅ |
| Database migration step (`knex migrate:latest` — Option A local, Option B Render shell) | ✅ |
| Deploy trigger + verification steps | ✅ |
| Post-deploy smoke test checklist (7 curl commands + browser checklist) | ✅ |
| Cookie SameSite=None verification step | ✅ |
| Custom domain setup (optional) | ✅ |
| Rollback procedure | ✅ |

**T-220 and T-221 verified implemented (In Review):**
- `backend/src/config/knexfile.js` production block: `ssl: { rejectUnauthorized: false }`, `pool: { min: 1, max: 5 }` ✅
- `backend/src/routes/auth.js` `getSameSite()` returns `'none'` in production, `'strict'` otherwise; `isSecureCookie()` returns `true` in production ✅
- Both T-222 blockers are satisfied. T-223 can complete its full checklist.

**T-222 Status: ✅ DONE — render.yaml and deploy guide published. Handoff to QA (T-223) logged.**

---

## Sprint 26 — QA Engineer Log (T-223)

**Date:** 2026-03-11
**Agent:** QA Engineer
**Task:** T-223 — Pre-production security + configuration review

---

### Unit Test Run — Backend

**Test Type:** Unit Test
**Command:** `cd backend && npm test -- --run`
**Date:** 2026-03-11

| Metric | Result |
|--------|--------|
| Test files | 18 passed / 18 total |
| Tests | 355 passed / 355 total |
| Sprint 26 new tests (sprint26.test.js) | 15 passed / 15 |
| Duration | 2.68s |
| Baseline (pre-Sprint 26) | 340 |
| New tests added | +15 (T-220: 5, T-221: 3, T-226: 7) |

**Result: ✅ PASS — 355/355 (exceeds 340+ baseline requirement)**

**Sprint 26 test breakdown (sprint26.test.js):**

| Suite | Tests | Result |
|-------|-------|--------|
| T-220 — knexfile.js production config | 5 | ✅ All pass |
| T-221 — Cookie SameSite in non-production | 1 | ✅ Pass |
| T-221 — Cookie SameSite in production | 2 | ✅ Pass |
| T-226 — test_user seed script | 7 | ✅ All pass |

---

### Unit Test Run — Frontend

**Test Type:** Unit Test
**Command:** `cd frontend && npm test -- --run`
**Date:** 2026-03-11

| Metric | Result |
|--------|--------|
| Test files | 25 passed / 25 total |
| Tests | 486 passed / 486 total |
| Duration | 1.87s |

**Result: ✅ PASS — 486/486 (baseline unchanged — no frontend scope in Sprint 26)**

Note: `act()` warnings present in several test files — these are pre-existing React state update warnings in test output, not failures. All tests pass.

---

### npm audit — Security Vulnerability Scan

**Test Type:** Security Scan
**Command:** `cd backend && npm audit`
**Date:** 2026-03-11

| Result |
|--------|
| 0 vulnerabilities found |

**Result: ✅ PASS — 0 vulnerabilities**

---

### T-220 Code Verification — knexfile.js Production SSL + Pool Config

**Test Type:** Integration Test
**File:** `backend/src/config/knexfile.js`

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| production.connection type | object | object | ✅ |
| production.connection.connectionString | `process.env.DATABASE_URL` | `process.env.DATABASE_URL` | ✅ |
| production.connection.ssl.rejectUnauthorized | `false` | `false` | ✅ |
| production.pool.min | `1` | `1` | ✅ |
| production.pool.max | `5` | `5` | ✅ |
| development config unchanged (no ssl) | no ssl block | no ssl block | ✅ |
| staging config unchanged (no ssl) | no ssl block | no ssl block | ✅ |
| No hardcoded DATABASE_URL value | env var only | `process.env.DATABASE_URL` | ✅ |

**Result: ✅ PASS — All T-220 checks verified**

---

### T-221 Code Verification — Cookie SameSite=None in Production

**Test Type:** Integration Test
**File:** `backend/src/routes/auth.js`

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| `getSameSite()` in production | `'none'` | `return process.env.NODE_ENV === 'production' ? 'none' : 'strict'` | ✅ |
| `getSameSite()` in dev/staging | `'strict'` | `'strict'` | ✅ |
| `isSecureCookie()` in production | `true` | gates on `COOKIE_SECURE==='true'` or `NODE_ENV==='production'` | ✅ |
| `setRefreshCookie()` uses `getSameSite()` | ✅ | `sameSite: getSameSite()` | ✅ |
| `clearRefreshCookie()` uses `getSameSite()` | ✅ | `sameSite: getSameSite()` | ✅ |
| `httpOnly: true` preserved | ✅ | `httpOnly: true` | ✅ |
| No hardcoded secrets | ✅ | JWT_SECRET from `process.env.JWT_SECRET` | ✅ |
| Test: non-production → SameSite=Strict | ✅ | verified by sprint26 test suite | ✅ |
| Test: production → SameSite=None | ✅ | verified by sprint26 test suite | ✅ |
| Test: production → Secure flag present | ✅ | verified by sprint26 test suite | ✅ |

**Result: ✅ PASS — All T-221 checks verified**

---

### T-226 Code Verification — test_user Seed Script

**Test Type:** Integration Test
**File:** `backend/src/seeds/test_user.js`

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| Target table | `users` | `knex('users')` | ✅ |
| email field | `test@triplanner.local` | `'test@triplanner.local'` | ✅ |
| name field | `Test User` | `'Test User'` | ✅ |
| password_hash | bcrypt 12 rounds of `TestPass123!` | `bcrypt.hash(TEST_PASSWORD, 12)` | ✅ |
| Idempotency | `onConflict('email').ignore()` | `onConflict('email').ignore()` | ✅ |
| Minimal fields (no extras) | `[email, name, password_hash]` only | `[email, name, password_hash]` | ✅ |
| Re-run safety | Does not throw on duplicate | Confirmed by test — `.ignore()` | ✅ |

**Result: ✅ PASS — All T-226 checks verified**

---

### T-222 Verification — render.yaml + Production Deploy Guide

**Test Type:** Integration Test
**Files:** `render.yaml` (project root), `docs/production-deploy-guide.md`

#### render.yaml Checklist

| Check | Status |
|-------|--------|
| Two services defined (backend web + frontend static) | ✅ |
| Both services in ohio region | ✅ |
| Both services on free plan | ✅ |
| Backend: `NODE_ENV=production` set | ✅ |
| Backend: `DATABASE_URL` is `sync: false` (no hardcoded value) | ✅ |
| Backend: `JWT_SECRET` is `generateValue: true` (auto-generated) | ✅ |
| Backend: `CORS_ORIGIN` is `sync: false` (no hardcoded value) | ✅ |
| Frontend: `VITE_API_URL` is `sync: false` (no hardcoded value) | ✅ |
| Backend: `healthCheckPath: /api/v1/health` | ✅ |
| SPA rewrite rule `/* → /index.html` for React Router | ✅ |
| No hardcoded secrets anywhere in file | ✅ |

#### docs/production-deploy-guide.md Checklist

| Section | Status |
|---------|--------|
| AWS RDS setup (PostgreSQL 15, db.t3.micro, us-east-1) | ✅ |
| Render Blueprint deploy via render.yaml | ✅ |
| Environment variable configuration (all vars, both services) | ✅ |
| Database migration step (`knex migrate:latest`, Option A + B) | ✅ |
| Deploy trigger + verification | ✅ |
| Post-deploy smoke test checklist (7 curl-based checks) | ✅ |
| SameSite=None cookie verification in post-deploy checklist | ✅ |
| Custom domain setup (optional) | ✅ |
| Rollback procedure | ✅ |

**Result: ✅ PASS — render.yaml and deploy guide verified complete**

---

### Config Consistency Check

**Test Type:** Config Consistency
**Files:** `backend/.env`, `frontend/vite.config.js`, `infra/docker-compose.yml`

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| Backend PORT | 3000 | `PORT=3000` in backend/.env | ✅ |
| Vite proxy port | matches backend PORT | `BACKEND_PORT \|\| '3000'` (default 3000) | ✅ |
| SSL enabled in backend | No (certs commented out) | SSL_KEY_PATH/SSL_CERT_PATH commented out | ✅ |
| Vite proxy protocol | http (SSL off) | `http` (backendSSL=false default) | ✅ |
| CORS_ORIGIN | `http://localhost:5173` | `CORS_ORIGIN=http://localhost:5173` in .env | ✅ |
| Docker compose backend PORT | 3000 | `PORT: 3000` in docker-compose backend env | ✅ |

**Result: ✅ PASS — No config mismatches found**

---

### Security Verification

**Test Type:** Security Scan
**Date:** 2026-03-11

#### Authentication & Authorization
| Item | Status | Notes |
|------|--------|-------|
| All API endpoints require appropriate auth | ✅ | `authenticate` middleware on all protected routes |
| Auth tokens have expiration | ✅ | JWT: 15m (access), 7d (refresh); refresh tokens stored hashed |
| Password hashing uses bcrypt | ✅ | bcrypt 12 rounds on all password hashing |
| Failed login attempts rate-limited | ✅ | `loginLimiter`: 10 attempts / 15-min window |
| Register attempts rate-limited | ✅ | `registerLimiter`: 5 attempts / 60-min window |
| Timing-safe login (prevents user enumeration) | ✅ | `DUMMY_HASH` used when user not found |

#### Input Validation & Injection Prevention
| Item | Status | Notes |
|------|--------|-------|
| Server-side input validation | ✅ | `validate()` middleware on all write endpoints |
| SQL queries use parameterized statements | ✅ | Knex query builder throughout; all `db.raw()` uses static SQL strings only (date formatting, ordering) — no user input in raw calls |
| HTML output sanitized | ✅ | API returns JSON only; no HTML rendering |
| No user input in `db.raw()` calls | ✅ | Verified: all raw() calls use static SQL strings |

#### API Security
| Item | Status | Notes |
|------|--------|-------|
| CORS configured to expected origins only | ✅ | `CORS_ORIGIN` env var; defaults to localhost:5173 |
| Rate limiting on public endpoints | ✅ | Login, register, and general auth limiters |
| API responses do not leak stack traces | ✅ | `errorHandler` logs stack server-side; returns generic 500 message to client |
| Sensitive data not in URL query params | ✅ | Credentials sent in request body only |
| Security headers (Helmet) | ✅ | `app.use(helmet())` — provides X-Content-Type-Options, X-Frame-Options, HSTS etc. |

#### Data Protection
| Item | Status | Notes |
|------|--------|-------|
| DB credentials in env vars (not code) | ✅ | `DATABASE_URL` from `process.env` only |
| JWT_SECRET in env vars | ✅ | `process.env.JWT_SECRET` only |
| TEST_PASSWORD constant in seed | ⚠️ NOTED | `'TestPass123!'` in `test_user.js` — this is an intentionally documented staging test account credential, not a production secret. Acceptable by design; documented in monitor-agent.md |
| JWT_SECRET in backend/.env | ⚠️ NOTED | `change-me-to-a-random-string` — development placeholder only; production uses Render auto-generated value. Not a security issue |
| Logs do not contain PII / passwords | ✅ | errorHandler logs `err.stack` only |
| Refresh tokens stored as bcrypt hash | ✅ | `hashToken()` applied before storage |

#### Infrastructure
| Item | Status | Notes |
|------|--------|-------|
| HTTPS enforced on production | ✅ | Render provides HTTPS automatically; render.yaml uses `https://` |
| npm audit: 0 vulnerabilities | ✅ | Confirmed |
| Default credentials removed | ✅ | No default/sample credentials in production paths |
| Error pages do not reveal server technology | ✅ | `errorHandler` returns generic messages |

**Security Scan Result: ✅ PASS — No P1 security issues. Two non-blocking observations noted.**

---

### Outstanding Issue — Playwright E2E Regression (T-218, not blocking T-223)

**Noted for record — not in T-223 scope:**

Playwright suite remains at 2/4 PASS due to two test spec regressions first identified by Deploy Engineer:
1. **Test 2 (getByText strict mode):** Sprint 25 TripCalendar component adds `'SFO'` text to DOM via event pills, creating 3 matches for `getByText('SFO')`. Playwright strict mode rejects ambiguous selectors.
2. **Test 3 (intra-run rate limiter):** Each test registers a fresh user; by Test 3 the IP-level rate limit is exhausted within a single test run.

These are test spec issues (not application bugs). T-218 fix remains on Manager's tracking list. This is NOT a blocker for T-223 or T-224 — the application code is correct.

---

### T-223 Summary — Pre-Production QA Gate

| Check | Result |
|-------|--------|
| T-220: knexfile.js production SSL + pool config | ✅ PASS |
| T-221: Cookie SameSite=None in production; Strict in dev/staging | ✅ PASS |
| T-222: render.yaml — no hardcoded secrets, correct service config | ✅ PASS |
| T-222: docs/production-deploy-guide.md — complete with migration + post-deploy steps | ✅ PASS |
| Backend unit tests: 355/355 pass (including 15 new Sprint 26 tests) | ✅ PASS |
| Frontend unit tests: 486/486 pass | ✅ PASS |
| npm audit: 0 vulnerabilities | ✅ PASS |
| Config consistency (PORT, SSL, CORS) | ✅ PASS |
| Security checklist | ✅ PASS (no P1 issues) |

**T-223 Status: ✅ COMPLETE — All pre-production gates passed. Handoff to Deploy Engineer (T-224) logged.**

---

## Sprint #26 — T-218 Playwright Rerun (Second Attempt) — 2026-03-11

**Date:** 2026-03-11
**Agent:** Deploy Engineer
**Task:** T-218 second attempt — backend restart + Playwright 4/4

### Context

Previous T-218 run resulted in 2/4 PASS due to two test spec issues (strict mode SFO ambiguity + intra-run rate limiter exhaustion). Both issues have since been resolved by QA/Frontend engineers:
- Test 2 fix: Selector now scoped to flights section, resolving strict mode violation
- Test 3 fix: Tests use seeded test user (`test@triplanner.local`) instead of registering fresh users each run, preventing rate limiter exhaustion

### Backend Restart

| Step | Result |
|------|--------|
| `pm2 restart triplanner-backend` | ✅ New PID 63803, status online |
| Health check `GET http://localhost:3000/api/v1/health` | ✅ `{"status":"ok"}` |
| Rate limiter state cleared | ✅ Confirmed (fresh process) |

### Playwright Results — Post-Restart

| Test | Result | Notes |
|------|--------|-------|
| Test 1: Core user flow | ✅ PASS | 1.3s |
| Test 2: Sub-resource CRUD | ✅ PASS | 1.2s — strict mode SFO ambiguity resolved |
| Test 3: Search, filter, sort | ✅ PASS | 3.7s — rate limiter no longer exhausted between tests |
| Test 4: Rate limit lockout | ✅ PASS | 3.9s |

**Final result: 4/4 PASS (11.1s total)**

**T-218 Status: ✅ DONE — Playwright 4/4 confirmed. T-219 (User Agent) unblocked.**

---

## Sprint #26 — T-224 Production Deployment Attempt — 2026-03-11

**Date:** 2026-03-11
**Agent:** Deploy Engineer
**Task:** T-224 — Production deployment to Render + AWS RDS
**Pre-deploy gate:** T-223 ✅ (QA confirmed 2026-03-11)

### Deployment Steps Status

| Step | Status | Notes |
|------|--------|-------|
| 1. Create AWS RDS PostgreSQL 15 (db.t3.micro, us-east-1) | ⛔ BLOCKED | No AWS credentials / AWS CLI available in agent environment |
| 2. Set up Render services via render.yaml Blueprint | ⛔ BLOCKED | No Render CLI / Render API token available in agent environment |
| 3. Configure env vars (DATABASE_URL, JWT_SECRET, CORS_ORIGIN, VITE_API_URL) | ⛔ BLOCKED | Requires Render dashboard + RDS endpoint from Step 1 |
| 4. Run `knex migrate:latest` against production RDS | ⛔ BLOCKED | Requires DATABASE_URL from Step 1 |
| 5. Trigger Render deploy | ⛔ BLOCKED | Requires Render dashboard |
| 6. Smoke tests (health, register, frontend load) | ⛔ BLOCKED | Requires production URLs from Steps 1–5 |

### Pre-Deployment Readiness Verification (What CAN be verified locally)

| Check | Result |
|-------|--------|
| `render.yaml` present at project root | ✅ VERIFIED |
| `docs/production-deploy-guide.md` present | ✅ VERIFIED |
| Backend entry point `src/index.js` matches render.yaml `startCommand: node src/index.js` | ✅ VERIFIED |
| knexfile.js production SSL + pool config (T-220) | ✅ VERIFIED (QA-approved) |
| Cookie SameSite=None in production (T-221) | ✅ VERIFIED (QA-approved) |
| Backend tests: 355/355 pass | ✅ VERIFIED (QA-confirmed) |
| Frontend tests: 486/486 pass | ✅ VERIFIED (QA-confirmed) |
| npm audit: 0 vulnerabilities | ✅ VERIFIED (QA-confirmed) |
| No hardcoded secrets in render.yaml | ✅ VERIFIED |
| Playwright 4/4 PASS | ✅ VERIFIED (this run) |

### Blocker Summary

T-224 cannot be completed by the Deploy Engineer agent without the following project-owner actions:

1. **AWS account access** — Create RDS PostgreSQL 15 instance (`db.t3.micro`, `us-east-1`, free tier). Follow Step 1 in `docs/production-deploy-guide.md`.
2. **Render account** — Create account at render.com, connect GitHub repository, apply `render.yaml` Blueprint. Follow Steps 2–3 in `docs/production-deploy-guide.md`.
3. **Set `sync: false` env vars** in Render dashboard:
   - `triplanner-backend`: `DATABASE_URL` (from RDS Step 1), `CORS_ORIGIN` = `https://triplanner-frontend.onrender.com`
   - `triplanner-frontend`: `VITE_API_URL` = `https://triplanner-backend.onrender.com/api/v1`
4. **Run migrations** locally: `export DATABASE_URL="<rds-connection-string>" && export NODE_ENV=production && cd backend && npx knex migrate:latest --knexfile src/config/knexfile.js`
5. **Trigger deploy** in Render dashboard → confirm both services online
6. **Run smoke tests** from Step 6 of `docs/production-deploy-guide.md`

All application code is production-ready. The codebase just needs cloud infrastructure provisioned by the project owner.

**T-224 Status: ⛔ BLOCKED — Requires project owner to provision AWS RDS + Render services. All code is production-ready. See `docs/production-deploy-guide.md` for step-by-step instructions.**

---

## Sprint #26 — QA Re-Verification Pass (Orchestrator Invocation #2) — 2026-03-11

**Date:** 2026-03-11
**Agent:** QA Engineer
**Scope:** Full re-verification of Sprint 26 — fresh test runs + code spot-checks. No new tasks moved to Integration Check since prior T-223 pass. This pass confirms the gate is still green before orchestrator proceeds.

---

### Unit Test Run — Backend (Re-Run)

**Test Type:** Unit Test
**Command:** `cd backend && npm test -- --run`
**Date:** 2026-03-11T10:10:47Z

| Metric | Result |
|--------|--------|
| Test files | 18 passed / 18 total |
| Tests | **355 passed / 355 total** |
| Duration | 2.68s |
| Baseline | 340 (pre-Sprint 26) |
| Sprint 26 new tests (sprint26.test.js) | 15 passed / 15 |

stderr output: ErrorHandler stack traces from malformed-JSON and DB-error test cases — these are expected log noise from error-path tests. All 355 tests pass.

**Result: ✅ PASS — 355/355**

---

### Unit Test Run — Frontend (Re-Run)

**Test Type:** Unit Test
**Command:** `cd frontend && npm test -- --run`
**Date:** 2026-03-11T10:10:55Z

| Metric | Result |
|--------|--------|
| Test files | 25 passed / 25 total |
| Tests | **486 passed / 486 total** |
| Duration | 1.89s |

`act()` warnings: pre-existing React state update warnings in test output — not failures, not new this sprint.

**Result: ✅ PASS — 486/486**

---

### npm audit — Security Vulnerability Scan (Re-Run)

**Test Type:** Security Scan
**Command:** `cd backend && npm audit`
**Date:** 2026-03-11

| Result |
|--------|
| **0 vulnerabilities found** |

**Result: ✅ PASS — 0 vulnerabilities**

---

### Code Spot-Checks (Re-Verification)

**Test Type:** Integration Test / Code Review

#### T-220 — knexfile.js Production SSL + Pool

| Check | Status |
|-------|--------|
| `production.connection.connectionString = process.env.DATABASE_URL` | ✅ |
| `production.connection.ssl = { rejectUnauthorized: false }` | ✅ |
| `production.pool = { min: 1, max: 5 }` | ✅ |
| `development` / `staging` configs: bare `process.env.DATABASE_URL` string (no ssl block) | ✅ |
| No hardcoded DATABASE_URL value | ✅ |

**Result: ✅ PASS**

---

#### T-221 — Cookie SameSite=None in Production

| Check | Status |
|-------|--------|
| `getSameSite()` returns `'none'` when `NODE_ENV === 'production'` | ✅ |
| `getSameSite()` returns `'strict'` in dev/staging | ✅ |
| `isSecureCookie()` gates on `COOKIE_SECURE==='true'` OR `NODE_ENV==='production'` | ✅ |
| `setRefreshCookie()` uses `getSameSite()` | ✅ |
| `clearRefreshCookie()` uses `getSameSite()` (cross-origin logout correct) | ✅ |
| `httpOnly: true` preserved in both functions | ✅ |

**Result: ✅ PASS**

---

#### T-222 — render.yaml No Hardcoded Secrets

| Check | Status |
|-------|--------|
| `DATABASE_URL`: `sync: false` | ✅ |
| `JWT_SECRET`: `generateValue: true` | ✅ |
| `CORS_ORIGIN`: `sync: false` | ✅ |
| `VITE_API_URL`: `sync: false` | ✅ |
| Both services: `region: ohio`, `plan: free` | ✅ |
| Backend startCommand: `node src/index.js` (matches entry point on disk) | ✅ |
| SPA rewrite `/* → /index.html` present | ✅ |

**Result: ✅ PASS**

---

#### T-226 — test_user Seed Script

| Check | Status |
|-------|--------|
| `onConflict('email').ignore()` — idempotent | ✅ |
| bcrypt 12 rounds | ✅ |
| Fields: `name`, `email`, `password_hash` only | ✅ |
| No production secrets exposed | ✅ (intentional staging account, documented in monitor-agent.md) |

**Result: ✅ PASS**

---

### Config Consistency Check (Re-Verification)

**Test Type:** Config Consistency
**Files:** `backend/.env`, `frontend/vite.config.js`, `infra/docker-compose.yml`

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| Backend PORT (dev) | 3000 | `PORT=3000` in backend/.env | ✅ |
| Vite proxy target port (dev) | 3000 | `process.env.BACKEND_PORT \|\| '3000'` | ✅ |
| Backend SSL (dev) | Disabled | SSL_KEY_PATH/SSL_CERT_PATH commented out in .env | ✅ |
| Vite proxy protocol (dev) | http | `backendSSL=false` → `http://localhost:3000` | ✅ |
| CORS_ORIGIN (dev) | `http://localhost:5173` | `CORS_ORIGIN=http://localhost:5173` in .env | ✅ |
| Docker-compose backend PORT | 3000 | `PORT: 3000` | ✅ |
| Docker-compose CORS_ORIGIN | `http://localhost` (port 80, nginx) | `${CORS_ORIGIN:-http://localhost}` | ✅ (Docker uses nginx on :80, correct) |

**Result: ✅ PASS — No config mismatches**

---

### Security Verification (Re-Check)

**Test Type:** Security Scan

| Category | Item | Status |
|----------|------|--------|
| Auth | All protected routes use `authenticate` middleware | ✅ |
| Auth | JWT: 15m access / 7d refresh tokens, bcrypt 12 rounds | ✅ |
| Auth | Login rate-limited (10/15min); register rate-limited (5/60min) | ✅ |
| Auth | Timing-safe login with DUMMY_HASH (prevents user enumeration) | ✅ |
| Injection | `db.raw()` in tripModel.js uses ternary (`sortOrder === 'asc' ? 'ASC' : 'DESC'`) — no direct user input in SQL | ✅ |
| Injection | All other DB queries via Knex query builder (parameterized) | ✅ |
| XSS | No `dangerouslySetInnerHTML` in frontend code | ✅ |
| XSS | All event content (TripCalendar) rendered as React text nodes | ✅ |
| API | CORS gated to `CORS_ORIGIN` env var | ✅ |
| API | `helmet()` provides X-Content-Type-Options, X-Frame-Options, HSTS | ✅ |
| API | Error handler returns generic messages (no stack trace leakage to client) | ✅ |
| Data | `DATABASE_URL`, `JWT_SECRET` from env vars only | ✅ |
| Data | `JWT_SECRET=change-me-to-a-random-string` in backend/.env — development placeholder; production uses Render auto-generated value | ⚠️ NOTED (non-blocking) |
| Data | `TestPass123!` in test_user.js — intentional documented staging test account; not a production secret | ⚠️ NOTED (non-blocking) |
| Infra | Render provides HTTPS automatically; `render.yaml` references `https://` | ✅ |
| Infra | npm audit: 0 vulnerabilities | ✅ |

**Result: ✅ PASS — 0 P1 security issues. 2 non-blocking observations (same as T-223 pass, both by design).**

---

### Sprint #26 Re-Verification Summary

| Gate | Result |
|------|--------|
| Backend unit tests: 355/355 | ✅ PASS |
| Frontend unit tests: 486/486 | ✅ PASS |
| npm audit: 0 vulnerabilities | ✅ PASS |
| T-220: knexfile.js production SSL + pool | ✅ PASS |
| T-221: Cookie SameSite=None in production | ✅ PASS |
| T-222: render.yaml no hardcoded secrets | ✅ PASS |
| T-226: test_user seed script correct | ✅ PASS |
| Config consistency (PORT, SSL, CORS) | ✅ PASS |
| Security checklist | ✅ PASS |

**Overall: ✅ ALL GATES PASS — Application code is production-ready.**

**Deployment blocker:** T-224 remains ⛔ BLOCKED — project owner must provision AWS RDS instance + Render account. All engineering prerequisites are complete. See `docs/production-deploy-guide.md` for step-by-step instructions.

**Handoff to Deploy Engineer (T-224) logged in handoff-log.md (re-confirmation).**


---

## Sprint #27 — Backend Engineer CORS Verification (T-228 Fix B)

**Date:** 2026-03-11
**Task:** T-228 Fix B — ESM dotenv hoisting fix
**Engineer:** Backend Engineer
**Sprint goal:** Fix the CORS staging bug where `CORS_ORIGIN` env var was ignored due to ESM import hoisting

---

### Root Cause Summary

`backend/src/index.js` used a static `import app from './app.js'` which was hoisted by the ESM engine before `dotenv.config()` ran. When `app.js` initialised the `cors()` middleware, `process.env.CORS_ORIGIN` was `undefined`, so the fallback `'http://localhost:5173'` was permanently captured. On staging (`CORS_ORIGIN=https://localhost:4173`) all browser-initiated API calls received the wrong `Access-Control-Allow-Origin` header.

---

### Fix Applied

**Strategy:** Option A — dynamic import (ESM-pure, no changes to `app.js`)

```diff
- import app from './app.js';
-
  // dotenv.config() block (unchanged)
  const nodeEnv = process.env.NODE_ENV;
  ...
  dotenv.config();

+ // Dynamic import: app.js evaluates AFTER dotenv populates process.env
+ const { default: app } = await import('./app.js');
```

File changed: `backend/src/index.js`

---

### CORS Behavior Verification

| Scenario | Expected `Access-Control-Allow-Origin` | Result |
|----------|----------------------------------------|--------|
| `CORS_ORIGIN=https://custom.example.com`, request from same origin | `https://custom.example.com` | ✅ PASS |
| `CORS_ORIGIN=https://localhost:4173` (staging), request from same origin | `https://localhost:4173` | ✅ PASS |
| `CORS_ORIGIN` unset, request from `http://localhost:5173` | `http://localhost:5173` (fallback) | ✅ PASS |
| `CORS_ORIGIN=https://allowed.com`, request from `https://evil.com` | No CORS header (blocked) | ✅ PASS |
| `CORS_ORIGIN` set, `credentials: true` | `Access-Control-Allow-Credentials: true` | ✅ PASS |

---

### Test Count

| Metric | Result |
|--------|--------|
| Prior test baseline (Sprint 26) | 355/355 ✅ |
| New tests added (cors.test.js) | +8 |
| **Total after Fix B** | **363/363 ✅** |
| Regressions | 0 ✅ |

New test file: `backend/src/__tests__/cors.test.js`

---

### Security Checklist — CORS Item

- [x] CORS is configured to allow only expected origins — **FIXED** ✅ (`CORS_ORIGIN` env var now correctly read at server startup)
- [x] No SQL changes — no injection risk introduced
- [x] No new environment variables (CORS_ORIGIN pre-existed)
- [x] No migrations — schema stable at 10 applied migrations

---

### Sprint #27 Backend Verification Summary

| Gate | Result |
|------|--------|
| Backend tests: 363/363 | ✅ PASS |
| New CORS regression tests: 8/8 | ✅ PASS |
| ESM hoisting bug resolved | ✅ PASS |
| CORS_ORIGIN env var respected | ✅ PASS |
| CORS fallback correct when unset | ✅ PASS |
| No regressions from prior sprints | ✅ PASS |
| Security checklist (CORS item) | ✅ PASS |
| No schema changes | ✅ CONFIRMED |

**T-228 Fix B: ✅ COMPLETE — Ready for QA integration check.**

*Backend Engineer Sprint #27 CORS verification — 2026-03-11.*

---

## Sprint #27 — T-228 QA Integration Check — 2026-03-11

**Task:** T-228 (CORS staging fix — Fix A: ecosystem.config.cjs; Fix B: index.js dynamic import)
**Date:** 2026-03-11
**Engineer:** QA Engineer
**Sprint:** 27
**Environment:** Local + Staging (config verification)

---

### Unit Test Results

#### Backend

| Metric | Result |
|--------|--------|
| Test files | 19 / 19 passed |
| Total tests | 363 / 363 passed |
| New Sprint 27 tests (cors.test.js) | 8 / 8 passed |
| Prior sprint regressions | 0 |
| Runner | Vitest |

**Test file breakdown:**
- `cors.test.js` — 8 tests (T-228 CORS env var and fallback behavior) — all PASS
- `sprint26.test.js` — 15 tests — PASS
- `sprint25.test.js` — 15 tests — PASS
- `sprint20.test.js` — 17 tests — PASS
- `sprint19.test.js` — 9 tests — PASS
- `sprint7.test.js` — 19 tests — PASS
- `sprint6.test.js` — 51 tests — PASS
- `sprint5.test.js` — 28 tests — PASS
- `sprint4.test.js` — 19 tests — PASS
- `sprint3.test.js` — 33 tests — PASS
- `sprint2.test.js` — 37 tests — PASS
- `sprint16.test.js` — 12 tests — PASS
- `calendarModel.unit.test.js` — 21 tests — PASS
- `tripStatus.test.js` — 19 tests — PASS
- `trips.test.js` — 16 tests — PASS
- `auth.test.js` — 14 tests — PASS
- `flights.test.js` — 10 tests — PASS
- `stays.test.js` — 8 tests — PASS
- `activities.test.js` — 12 tests — PASS

**Happy path coverage (T-228 CORS tests):**
- CORS_ORIGIN env var used as allowed origin: PASS
- 200 returned for same-origin request when CORS_ORIGIN matches: PASS
- Access-Control-Allow-Credentials: true set when CORS_ORIGIN configured: PASS
- Staging origin https://localhost:4173 allowed when CORS_ORIGIN=https://localhost:4173: PASS
- Fallback http://localhost:5173 used when CORS_ORIGIN absent: PASS
- 200 returned for fallback origin when CORS_ORIGIN absent: PASS

**Error path coverage (T-228 CORS tests):**
- Disallowed origin not echoed back when CORS_ORIGIN is set to a specific value: PASS
- Staging origin NOT allowed when CORS_ORIGIN is absent (uses fallback only): PASS

**Verdict: PASS — 363/363**

---

#### Frontend

| Metric | Result |
|--------|--------|
| Test files | 25 / 25 passed |
| Total tests | 486 / 486 passed |
| Warnings | act() warnings in ActivitiesEditPage, StaysEditPage, FlightsEditPage (pre-existing, non-blocking) |
| Runner | Vitest (jsdom) |

No frontend tasks were assigned in Sprint 27. All 486 tests pass with zero failures — confirms no regressions from the backend-only T-228 fix.

**Verdict: PASS — 486/486**

---

### Integration Test Results

**Scope:** T-228 is a backend-only fix (no new endpoints, no schema changes, no frontend changes).

| Check | Result |
|-------|--------|
| No new API contracts introduced | CONFIRMED |
| Frontend API call code unchanged | CONFIRMED |
| Prior sprint API contracts unaffected | CONFIRMED |
| No request/response shape changes | CONFIRMED |
| Auth middleware unchanged (`authenticate` function in `middleware/auth.js`) | CONFIRMED |
| CORS middleware retained `credentials: true` in `app.js` | CONFIRMED |
| `helmet()` middleware retained in `app.js` | CONFIRMED |
| Fix B: `backend/src/index.js` uses `await import('./app.js')` (dynamic import after dotenv) | CONFIRMED |
| Fix A: `infra/ecosystem.config.cjs` has `CORS_ORIGIN: 'https://localhost:4173'` in triplanner-backend env block | CONFIRMED |

**Verdict: PASS**

---

### Config Consistency Check

| Item | Value | Status |
|------|-------|--------|
| `backend/.env` PORT | 3000 | — |
| `vite.config.js` default proxy target port | 3000 (when BACKEND_PORT unset) | MATCH |
| `vite.config.js` staging proxy port | 3001 (when BACKEND_PORT=3001) | MATCH with ecosystem.config.cjs PORT=3001 |
| `infra/docker-compose.yml` backend internal PORT | 3000 | MATCH with backend/.env PORT |
| `backend/.env` CORS_ORIGIN | `http://localhost:5173` (dev fallback) | Correct for local dev |
| `infra/ecosystem.config.cjs` CORS_ORIGIN (staging) | `https://localhost:4173` | Correct for staging |
| `vite.config.js` preview port | 4173 | MATCH with staging CORS_ORIGIN |
| SSL in staging backend | Yes — SSL_KEY_PATH / SSL_CERT_PATH in index.js | `vite.config.js` BACKEND_SSL=true path uses `https://` proxy — MATCH |
| CORS_ORIGIN includes `http://localhost:5173` for dev | Yes | CONFIRMED |

**Config port chain:** dev — backend:3000 ↔ vite proxy→3000 ✅ | staging — pm2 backend:3001 (SSL) ↔ vite preview proxy→3001 (https) ✅ | docker — backend:3000 internal, nginx:80 external ✅

**Verdict: PASS — all configs consistent**

---

### Security Scan Results

#### npm audit

```
found 0 vulnerabilities
```

**Verdict: PASS**

#### Security Checklist — T-228 Scope

| Item | Status | Notes |
|------|--------|-------|
| No hardcoded secrets in changed files | PASS | `ecosystem.config.cjs` CORS_ORIGIN is a non-secret URL, not a credential |
| JWT_SECRET from env (not hardcoded) | PASS | `middleware/auth.js` uses `process.env.JWT_SECRET` |
| No SQL injection vectors in changed files | PASS | No DB access in T-228 changes |
| No XSS surface in changed files | PASS | No frontend changes; `dangerouslySetInnerHTML` not used |
| Auth middleware unchanged | PASS | `middleware/auth.js` unmodified |
| CORS configured to expected origins only | PASS | `app.js` uses `process.env.CORS_ORIGIN || 'http://localhost:5173'` (single-origin, no wildcard) |
| `credentials: true` retained in CORS config | PASS | Verified in `app.js` line 22 |
| `helmet()` security headers middleware present | PASS | `app.js` line 18 |
| No PII/token/secret leakage in console logs | PASS | No `console.log` with password, token, or secret found |
| Rate limiting unchanged | PASS | `middleware/rateLimiter.js` unmodified |
| No info leakage in error responses | PASS | `middleware/errorHandler.js` unmodified |
| Knex parameterized queries (no raw string concatenation in app code) | PASS | Only `knex.raw` in migrations with static DDL strings — no user input |
| Database credentials from env | PASS | `DATABASE_URL` from environment in all configs |
| Refresh token as httpOnly cookie | PASS | `routes/auth.js` confirmed — token handling unchanged |

**Security Verdict: PASS — all checklist items clear**

---

### Summary

| Section | Result |
|---------|--------|
| Backend unit tests | 363/363 PASS |
| Frontend unit tests | 486/486 PASS |
| Integration check | PASS |
| Config consistency | PASS |
| Security scan (npm audit) | 0 vulnerabilities |
| Security checklist | All items PASS |

**Overall QA Verdict: T-228 APPROVED — Ready for Done.**

*QA Engineer Sprint #27 Integration Check — 2026-03-11*

---

## Sprint #27 — Deploy Engineer Final Staging Verification — 2026-03-11T18:21:00Z

**Task:** Sprint 27 Deploy Engineer wrap-up — staging health re-verification + T-224 escalation
**Date:** 2026-03-11
**Engineer:** Deploy Engineer
**Sprint:** 27
**Environment:** Staging

---

### Context

QA integration check passed (T-228 Done). Deploy Engineer performed a final staging re-verification to confirm the environment is healthy for User Agent testing (T-219), and to document T-224 blocker status.

---

### Staging Health Re-Verification (2026-03-11T18:21:00Z)

| Check | Command | Expected | Result |
|-------|---------|----------|--------|
| Health endpoint | `curl -sk https://localhost:3001/api/v1/health` | `{"status":"ok"}` | ✅ PASS |
| CORS header (GET) | `curl -sk -I … -H "Origin: https://localhost:4173"` | `Access-Control-Allow-Origin: https://localhost:4173` | ✅ PASS |
| Credentials header | Same as above | `Access-Control-Allow-Credentials: true` | ✅ PASS |
| OPTIONS preflight | `curl -sk -I -X OPTIONS … -H "Origin: https://localhost:4173"` | `204 No Content` | ✅ PASS |
| pm2 triplanner-backend | `pm2 list` | online | ✅ online (pid 70180, 0 restarts, 11m uptime) |
| pm2 triplanner-frontend | `pm2 list` | online | ✅ online (pid 64982, 4h uptime) |

**All 6 checks PASS. Staging is healthy and ready for User Agent testing.**

---

### T-224 Production Deployment — Blocked Status

**Status: ⛔ BLOCKED — Awaiting project owner provisioning**

T-224 (production deployment to Render + AWS RDS) cannot proceed until the project owner provides:
1. **AWS account access** — to create RDS PostgreSQL 15 instance (`db.t3.micro`, `us-east-1`, free tier)
2. **Render account access** — to apply the `render.yaml` Blueprint or create services manually

All engineering prerequisites are complete:
- `render.yaml` — present in repo root ✅
- `docs/production-deploy-guide.md` — step-by-step instructions written ✅
- `backend/knexfile.js` — production SSL config ready ✅
- `backend/src/routes/auth.js` — SameSite=None; Secure cookie for production ✅
- All 10 migrations applied and tested on staging ✅
- No new migrations required for Sprint 27 ✅

**This blocker is a project owner gate, not an engineering gate. Deploy Engineer cannot unblock T-224 unilaterally.**

---

### Sprint 27 Deploy Engineer Summary

| Task | Status | Notes |
|------|--------|-------|
| T-228 Fix A | ✅ Complete | `CORS_ORIGIN` in pm2 ecosystem config; verified 7/7 checks |
| T-228 (overall) | ✅ Done | QA integration check passed; 363/363 backend + 486/486 frontend |
| Staging health | ✅ Healthy | All services online; CORS correctly configured |
| No new migrations | ✅ Confirmed | Sprint 27 has no DDL changes |
| T-224 | ⛔ Blocked | Project owner must provision AWS RDS + Render account |

---

## Sprint #27 — QA Re-Verification Pass — 2026-03-11

**QA Engineer:** Re-verification pass (orchestrator Sprint #27 second invocation)
**Date:** 2026-03-11
**Sprint:** 27
**Scope:** Re-verify all Sprint #27 QA gates — no new tasks in Integration Check; confirming stable state before sprint close

---

### Context

T-228 (CORS staging fix) was previously moved to Done by the prior QA invocation this sprint (363/363 backend, 486/486 frontend, 0 vulnerabilities). This pass re-runs all tests from the actual file system to confirm the code is still in the verified state and logs the current findings.

**Tasks in "Integration Check" at time of invocation:** None — T-228 already Done.

---

### Test Type: Unit Test

**Date:** 2026-03-11
**Command:** `cd backend && npm test`

| File | Tests | Result |
|------|-------|--------|
| `src/__tests__/sprint2.test.js` | 37 | ✅ PASS |
| `src/__tests__/sprint3.test.js` | 33 | ✅ PASS |
| `src/__tests__/sprint4.test.js` | 19 | ✅ PASS |
| `src/__tests__/sprint5.test.js` | 28 | ✅ PASS |
| `src/__tests__/sprint6.test.js` | 51 | ✅ PASS |
| `src/__tests__/sprint7.test.js` | 19 | ✅ PASS |
| `src/__tests__/sprint16.test.js` | 12 | ✅ PASS |
| `src/__tests__/sprint19.test.js` | 9 | ✅ PASS |
| `src/__tests__/sprint20.test.js` | 17 | ✅ PASS |
| `src/__tests__/sprint25.test.js` | 15 | ✅ PASS |
| `src/__tests__/sprint26.test.js` | 15 | ✅ PASS |
| `src/__tests__/cors.test.js` | 8 | ✅ PASS |
| `src/__tests__/auth.test.js` | 14 | ✅ PASS |
| `src/__tests__/trips.test.js` | 16 | ✅ PASS |
| `src/__tests__/flights.test.js` | 10 | ✅ PASS |
| `src/__tests__/stays.test.js` | 8 | ✅ PASS |
| `src/__tests__/activities.test.js` | 12 | ✅ PASS |
| `src/__tests__/calendarModel.unit.test.js` | 21 | ✅ PASS |
| `src/__tests__/tripStatus.test.js` | 19 | ✅ PASS |
| **TOTAL** | **363** | **✅ 363/363 PASS** |

**Backend test verdict:** ✅ PASS — 363/363, 19 test files, 0 failures, 0 regressions

---

**Command:** `cd frontend && npm test`

| Metric | Result |
|--------|--------|
| Test Files | 25 passed (25) |
| Tests | 486 passed (486) |
| Failures | 0 |
| Duration | ~2.7s |

**Frontend test verdict:** ✅ PASS — 486/486, 25 test files, 0 failures, 0 regressions

---

### Test Type: Unit Test — Coverage Check

**T-228 CORS tests (cors.test.js — 8 tests):**
- Happy path: `CORS_ORIGIN` env var set → correct `Access-Control-Allow-Origin` header ✅
- Happy path: fallback `http://localhost:5173` when `CORS_ORIGIN` absent ✅
- Happy path: `Access-Control-Allow-Credentials: true` set correctly ✅
- Happy path: staging origin `https://localhost:4173` allowed when `CORS_ORIGIN` set ✅
- Error path: disallowed origin not echoed back when `CORS_ORIGIN` set ✅
- Error path: staging origin blocked when `CORS_ORIGIN` absent (fallback only) ✅
- `afterEach` restores `process.env.CORS_ORIGIN` — no test pollution ✅

Coverage assessment: Happy-path + error-path per endpoint/component — **PASS**

---

### Test Type: Integration Test

**Date:** 2026-03-11
**Scope:** T-228 — ESM dotenv hoisting fix in `backend/src/index.js`

#### Code Verification

| File | Check | Result |
|------|-------|--------|
| `backend/src/index.js` | `dotenv.config()` called before `await import('./app.js')` | ✅ PASS — dynamic import on line 31, after dotenv block lines 20-26 |
| `backend/src/index.js` | No static `import app from './app.js'` present | ✅ PASS — confirmed dynamic import pattern only |
| `backend/src/app.js` | `cors({ origin: process.env.CORS_ORIGIN \|\| 'http://localhost:5173', credentials: true })` | ✅ PASS — lines 19-24 |
| `backend/src/app.js` | `helmet()` security middleware present | ✅ PASS — line 18 |
| `infra/ecosystem.config.cjs` | `CORS_ORIGIN: 'https://localhost:4173'` in triplanner-backend env block | ✅ PASS — line 27 (T-228 Fix A) |
| `infra/ecosystem.config.cjs` | staging port 3001, `BACKEND_PORT: '3001'`, `BACKEND_SSL: 'true'` | ✅ PASS — lines 26 + 53-54 |

#### API Contract Check

T-228 is a pure internal server-startup refactor. No API endpoints were added, changed, or removed. No request/response shapes changed. API contracts unchanged. N/A ✅

#### UI Spec Check

Backend-only change. No frontend code modified. UI spec unchanged. N/A ✅

**Integration test verdict:** ✅ PASS

---

### Test Type: Config Consistency Check

**Date:** 2026-03-11

| Environment | Check | Expected | Actual | Result |
|-------------|-------|----------|--------|--------|
| Dev | backend `PORT` in `.env` | 3000 | 3000 | ✅ PASS |
| Dev | vite proxy default `BACKEND_PORT` | 3000 | 3000 (unset → default) | ✅ PASS |
| Dev | vite proxy protocol | `http://` | `http` (backendSSL unset → false) | ✅ PASS |
| Dev | `CORS_ORIGIN` in `.env` | `http://localhost:5173` | `http://localhost:5173` | ✅ PASS |
| Dev | `CORS_ORIGIN` includes frontend origin | `http://localhost:5173` | matches | ✅ PASS |
| Staging | pm2 backend `PORT` | 3001 | 3001 | ✅ PASS |
| Staging | vite `BACKEND_PORT` | 3001 | 3001 | ✅ PASS |
| Staging | backend SSL enabled | true (SSL_KEY + SSL_CERT in `.env.staging`) | true | ✅ PASS |
| Staging | vite proxy protocol | `https://` | `https` (BACKEND_SSL=true) | ✅ PASS |
| Staging | `CORS_ORIGIN` in pm2 ecosystem | `https://localhost:4173` | `https://localhost:4173` | ✅ PASS |
| Docker | backend `PORT` | 3000 | 3000 | ✅ PASS |
| Docker | nginx external port | 80 | 80 | ✅ PASS |
| Docker | DB creds from env | `${DB_PASSWORD:?required}`, `${JWT_SECRET:?required}` | mandatory env vars (fail-fast) | ✅ PASS |

**Config consistency verdict:** ✅ PASS — No mismatches found across dev, staging, or Docker environments

---

### Test Type: Security Scan

**Date:** 2026-03-11
**Command:** `cd backend && npm audit`
**Result:** `found 0 vulnerabilities` ✅

**Security checklist verification:**

| Category | Item | Result | Notes |
|----------|------|--------|-------|
| Auth | All API endpoints require authentication | ✅ PASS | `authenticate` middleware in all protected routes; public only: `/health`, `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout` |
| Auth | Auth tokens have expiration + refresh | ✅ PASS | `JWT_EXPIRES_IN=15m`, `JWT_REFRESH_EXPIRES_IN=7d` from env; refresh token as httpOnly cookie |
| Auth | Password hashing uses bcrypt | ✅ PASS | `bcrypt.hash(password, 12)` in `routes/auth.js:122` |
| Auth | Failed login rate-limited | ✅ PASS | `loginLimiter`: 10 attempts / 15 min per IP; `registerLimiter`: 5 / 60 min |
| Injection | SQL queries use parameterized statements / query builder | ✅ PASS | All queries via Knex; `sortBy`/`sortOrder` validated against allowlist before use in `db.raw()`; no user-supplied strings interpolated directly |
| Injection | No XSS surface | ✅ PASS | `dangerouslySetInnerHTML` not used (comment in `formatDate.js` explicitly notes absence) |
| API | CORS configured to expected origins only | ✅ PASS | Single-origin (`process.env.CORS_ORIGIN || 'http://localhost:5173'`), no wildcard |
| API | Rate limiting on public endpoints | ✅ PASS | `loginLimiter`, `registerLimiter`, `generalAuthLimiter` applied |
| API | Error responses do not leak stack traces / internal details | ✅ PASS | `errorHandler.js`: 500s return `'An unexpected error occurred'`; stack trace logged server-side only |
| API | Sensitive data not in URL params | ✅ PASS | Credentials passed in request body / headers only |
| API | HTTP security headers | ✅ PASS | `helmet()` middleware in `app.js` |
| Data | DB credentials + JWT_SECRET from env | ✅ PASS | `DATABASE_URL`, `JWT_SECRET` — only from `process.env`; no hardcoded values found |
| Data | No hardcoded secrets in source | ✅ PASS | Scanned all `*.js` files in `backend/src` — no hardcoded credentials |
| Data | Logs do not contain PII / passwords / tokens | ✅ PASS | `auth.js` routes have no `console.log` with credentials; `errorHandler` logs `err.stack` (no user data) |
| Data | `backend/.env` `JWT_SECRET` uses placeholder | ✅ NOTE | `JWT_SECRET=change-me-to-a-random-string` — this is the **dev** `.env` only; expected to be overridden with a strong secret in staging/production via ecosystem config / Render env vars |
| Infra | HTTPS enforced on staging | ✅ PASS | SSL server branch in `index.js`; pm2 staging runs on port 3001 with TLS certs |
| Infra | Dependencies checked for vulnerabilities | ✅ PASS | `npm audit`: 0 vulnerabilities |

**Security scan verdict:** ✅ PASS — All applicable checklist items clear. No P1 security issues found.

> **Note on `backend/.env` placeholder secret:** `JWT_SECRET=change-me-to-a-random-string` is the local dev default and is expected. Staging and production must override this with a strong random value via environment variable injection (pm2 ecosystem / Render dashboard). This is a known-acceptable state for the dev env file and does not constitute a hardcoded secret in production code.

---

### Summary

| Test Type | Result | Details |
|-----------|--------|---------|
| Unit Test — Backend | ✅ PASS | 363/363, 19 files, 0 failures |
| Unit Test — Frontend | ✅ PASS | 486/486, 25 files, 0 failures |
| Integration Test | ✅ PASS | Code verified, CORS fix confirmed, API contracts unchanged |
| Config Consistency | ✅ PASS | Dev/staging/Docker all consistent |
| Security Scan (npm audit) | ✅ PASS | 0 vulnerabilities |
| Security Checklist | ✅ PASS | All applicable items clear |

**Overall QA verdict: ✅ ALL GATES PASS — Sprint #27 code is stable and verified.**

**Sprint #27 task board (QA view):**
- T-228: ✅ Done — CORS fix verified; all test suites pass; no regressions
- T-219: Backlog — User Agent walkthrough; T-228 gate cleared; staging healthy; unblocked
- T-224: ⛔ Blocked — Project owner must provision AWS RDS + Render (human gate)
- T-225: Backlog — Blocked on T-224

*QA Engineer Sprint #27 Re-Verification Pass — 2026-03-11*

---

## Sprint #27 — Deploy Engineer Build + Staging Verification (Pass #2)

**Date:** 2026-03-11
**Agent:** Deploy Engineer
**Sprint:** 27
**Tasks:** T-228 (deployed), T-219 (staging ready), T-224 (Blocked — project owner gate)

---

### Pre-Deploy Checks

| Check | Result | Notes |
|-------|--------|-------|
| QA confirmation in handoff-log.md | ✅ CONFIRMED | QA Engineer Sprint #27 handoff (2026-03-11): T-228 Integration Check PASSED — 363/363 backend + 486/486 frontend, 0 vulnerabilities |
| Pending migrations | ✅ NONE | Sprint 27: No new migrations. Sprint 26: No new migrations. All 10 migrations (001–010) applied on staging. No `knex migrate:latest` required. |
| Sprint 27 tasks verified Done | ✅ T-228 Done | T-219 Backlog (User Agent gate), T-224 Blocked (project owner gate), T-225 Backlog (blocked on T-224) |

---

### Build

**Date:** 2026-03-11
**Branch:** Current working branch (T-228 CORS fix)

#### Backend Dependencies

```
cd backend && npm install
→ 0 vulnerabilities ✅
```

#### Frontend Dependencies

```
cd frontend && npm install
→ 0 vulnerabilities ✅
```

#### Frontend Production Build

```
cd frontend && npm run build

vite v6.4.1 building for production...
✓ 128 modules transformed.
dist/index.html                   0.46 kB │ gzip:   0.29 kB
dist/assets/index-CPOhaw0p.css   84.43 kB │ gzip:  13.30 kB
dist/assets/index-Bz9Y7ALz.js   345.83 kB │ gzip: 105.16 kB
✓ built in 469ms
```

**Build Status: ✅ SUCCESS** — 128 modules transformed, 0 errors, 0 warnings.

---

### Staging Environment Verification

**Environment:** Local staging via pm2 (SSL on port 3001 backend, port 4173 frontend)
**No new deployment required** — pm2 processes already running with T-228 Fix A (ecosystem.config.cjs) and Fix B (index.js dynamic import). Verified against fresh build output.

#### pm2 Process Status

| Process | PID | Status | Restarts | Uptime |
|---------|-----|--------|----------|--------|
| triplanner-backend | 70180 | ✅ online | 0 | 19m |
| triplanner-frontend | 64982 | ✅ online | 6 | 4h |

#### Health Check Results

| Check | Command | Result |
|-------|---------|--------|
| Health endpoint | `curl -sk https://localhost:3001/api/v1/health` | ✅ `200 {"status":"ok"}` |
| CORS — GET origin header | `-H "Origin: https://localhost:4173"` | ✅ `Access-Control-Allow-Origin: https://localhost:4173` |
| CORS — credentials | — | ✅ `Access-Control-Allow-Credentials: true` |
| OPTIONS preflight | `curl -sk -I -X OPTIONS ...` | ✅ `204 No Content` |
| Preflight CORS methods | — | ✅ `Access-Control-Allow-Methods: GET,HEAD,PUT,PATCH,POST,DELETE` |

**Staging Status: ✅ HEALTHY**

---

### Deployment Log

| Field | Value |
|-------|-------|
| Environment | Staging (local pm2) |
| Backend URL | `https://localhost:3001` |
| Frontend URL | `https://localhost:4173` |
| Backend process | pm2 `triplanner-backend` (pid 70180) |
| Frontend process | pm2 `triplanner-frontend` (pid 64982) |
| Build Status | ✅ Success |
| Migrations run | None (all 10 already applied; no new migrations for Sprint 27) |
| CORS fix (T-228) | ✅ Verified — Fix A (ecosystem.config.cjs) + Fix B (index.js dynamic import) both active |

---

### Summary

| Step | Status | Notes |
|------|--------|-------|
| Pre-deploy: QA confirmation | ✅ PASS | T-228 Integration Check PASSED (363/363 backend, 486/486 frontend) |
| Pre-deploy: migration check | ✅ PASS | No pending migrations for Sprint 27 |
| Backend `npm install` | ✅ PASS | 0 vulnerabilities |
| Frontend `npm install` | ✅ PASS | 0 vulnerabilities |
| Frontend `npm run build` | ✅ PASS | 128 modules, built in 469ms |
| Staging health check | ✅ PASS | `GET /api/v1/health` → `200 {"status":"ok"}` |
| CORS verification | ✅ PASS | `Access-Control-Allow-Origin: https://localhost:4173` |
| T-219 staging ready | ✅ PASS | User Agent may proceed at `https://localhost:4173` |
| T-224 production deploy | ⛔ BLOCKED | Project owner must provision AWS RDS + Render — human gate |

**Overall: ✅ Staging build and deployment VERIFIED — Sprint #27**

*Deploy Engineer Sprint #27 Pass #2 — 2026-03-11*

*Deploy Engineer Sprint #27 final verification — 2026-03-11*
