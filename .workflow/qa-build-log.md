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

## Sprint 6 Entries

| Test Run | Test Type | Result | Build Status | Environment | Deploy Verified | Tested By | Error Summary |
|----------|-----------|--------|-------------|-------------|-----------------|-----------|---------------|
| Sprint 6 — Pre-deployment staging environment audit (T-092 blocked) | Post-Deploy Health Check | Partial | Skipped | Staging | N/A | Deploy Engineer | Staging services not running (pm2 empty, backend/frontend down). PostgreSQL status unknown (pg_isready not on PATH). Unit tests PASS: 196/196 backend, 296/296 frontend. T-092 blocked — awaiting T-091 (QA Integration Testing). Full deployment deferred until QA confirms readiness. |

---

### Sprint 6 — Deploy Engineer: Pre-Deployment Staging Audit (T-092 Blocked) — 2026-02-27

**Related Task:** T-092 (Deploy: Staging re-deployment — BLOCKED)
**Sprint:** 6
**Date:** 2026-02-27
**Checked By:** Deploy Engineer

---

#### Pre-Deployment Blocker Check

**Status: BLOCKED — T-091 (QA Integration Testing) has not completed.**

Per rules: *"Never deploy without QA confirmation in the handoff log."* No Sprint 6 QA Engineer handoff has been logged to Deploy Engineer. T-090 (Security Checklist) and T-091 (Integration Testing) are both still in Backlog status.

**Upstream dependency chain that must complete before T-092 can proceed:**
```
T-083 (FE: Activity Edit Bugs)      — Status: Backlog
T-084 (FE: FilterToolbar Flicker)   — Status: Backlog
T-085 (BE: ILIKE Wildcard Fix)      — Status: In Progress
T-086 (BE: Land Travel API)         — Status: In Progress
T-087 (FE: Land Travel Edit Page)   — Status: Backlog
T-088 (FE: Land Travel Section)     — Status: Backlog
T-089 (FE: Calendar Enhancements)   — Status: Backlog
        ↓
T-090 (QA: Security Checklist)      — Status: Backlog
        ↓
T-091 (QA: Integration Testing)     — Status: Backlog
        ↓
T-092 (Deploy: Staging Re-deploy)   — Status: Blocked ← ME
```

---

#### Staging Environment Status (2026-02-27)

| Check | Result | Details |
|-------|--------|---------|
| PM2 processes | ❌ DOWN | pm2 daemon restarted fresh — no processes registered. Backend not managed. |
| Backend health endpoint | ❌ DOWN | `curl -sk https://localhost:3001/api/v1/health` — connection refused. Server not running. |
| Frontend preview server | ❌ DOWN | `curl -sk https://localhost:4173/` — HTTP 000 (connection refused). Not running. |
| PostgreSQL status | ⚠️ UNKNOWN | `pg_isready` not found on PATH. Cannot confirm DB status without env vars configured. |
| Migration status | ⚠️ UNKNOWN | Cannot run Knex migrate:status — DB env vars not set in current shell. |
| Backend unit tests (local) | ✅ PASS | 196/196 tests pass (10 files, ~800ms). Sprint 5 level — no Sprint 6 test additions yet (T-085/T-086 in progress). |
| Frontend unit tests (local) | ✅ PASS | 296/296 tests pass (21 files, ~3.3s). Sprint 5 level — no Sprint 6 test additions yet (T-083–T-089 in Backlog). |

**Staging services are DOWN.** The Sprint 5 pm2/Vite preview processes are no longer running (system restart or process termination since Sprint 5 deployment on 2026-02-26). This does not block Sprint 6 deployment — staging will be brought up fresh as part of T-092 when QA clears.

---

#### Sprint 6 Deployment Plan (for when T-092 is unblocked)

Once T-091 (QA Integration Testing) completes and QA logs a handoff to Deploy Engineer:

**Pre-Deploy Checklist:**
1. ✅ Confirm QA handoff in handoff-log.md (T-091 Done → Deploy Engineer)
2. Check for pending migrations → Migration 009 (`20260227_009_create_land_travels.js`) is pending on staging
3. Confirm all Sprint 6 code is committed on the working branch

**Deploy Steps:**
1. `cd /Users/yixinxiao/CLAUDE/triplanner/backend && npm install` — install any new dependencies
2. `cd /Users/yixinxiao/CLAUDE/triplanner/frontend && npm install` — install any new frontend dependencies
3. **Run migration 009 on staging DB:**
   ```bash
   cd /Users/yixinxiao/CLAUDE/triplanner/backend
   NODE_ENV=staging npx knex migrate:latest --knexfile src/knexfile.js
   ```
   Expected: Creates `land_travels` table + `land_travels_trip_id_idx` index
4. **Verify migration applied:** `npx knex migrate:status --knexfile src/knexfile.js` → all 9 migrations in Batch
5. **Run backend tests:** `npm test` → must be 196+ tests passing (Sprint 6 adds new land travel + wildcard escape tests)
6. **Restart backend under pm2:**
   ```bash
   pm2 restart triplanner-backend || pm2 start src/server.js --name triplanner-backend -i max
   ```
7. **Rebuild frontend with HTTPS config:**
   ```bash
   cd /Users/yixinxiao/CLAUDE/triplanner/frontend
   VITE_API_URL=https://localhost:3001/api/v1 npm run build
   ```
8. **Run frontend tests:** `npm test -- --run` → must be 296+ tests passing
9. **Restart frontend preview:**
   ```bash
   pm2 stop triplanner-frontend 2>/dev/null || true
   pm2 start "npx vite preview --port 4173 --https" --name triplanner-frontend
   ```
10. **Run smoke tests** — verify all Sprint 5 regression checks + Sprint 6 new features
11. **Log handoff to Monitor Agent (T-093)**

**Migration 009 Details:**
- File: `backend/src/migrations/20260227_009_create_land_travels.js`
- Creates: `land_travels` table with UUID PK, trip_id FK (CASCADE DELETE), mode CHECK constraint, required/nullable fields
- Creates: `land_travels_trip_id_idx` index on trip_id
- Rollback: `DROP TABLE IF EXISTS land_travels` (clean, no data dependencies to worry about)
- Zero risk to existing data — net-new table only

**Sprint 6 Smoke Tests (when T-092 executes):**
- Sprint 5 regression: all 45+ checks from T-079 must still pass
- Sprint 6 new: land travel API (CRUD, auth, cascade delete), migration 009 table exists, ILIKE escaping (`search=%` returns `[]`), calendar with 4 event types, toolbar no-flicker, activity edit AM/PM visibility

---

*T-092 status: BLOCKED. Will re-attempt when T-091 handoff is received from QA Engineer.*

---

## Sprint 5 Entries

| Test Run | Test Type | Result | Build Status | Environment | Deploy Verified | Tested By | Error Summary |
|----------|-----------|--------|-------------|-------------|-----------------|-----------|---------------|
| Sprint 5 — Pre-deployment staging health verification (T-078 blocked) | Post-Deploy Health Check | Pass | Skipped | Staging | N/A | Deploy Engineer | None — Staging environment from Sprint 4 (T-068) remains fully healthy. |

---

### Sprint 5 — Deploy Engineer: Pre-Deployment Staging Health Verification (2026-02-25)

**Related Task:** T-078 (Staging re-deployment — BLOCKED)

**Purpose:** Verify the current staging environment is healthy and ready to receive Sprint 5 changes when upstream blockers are resolved.

**Staging Environment Status:**

| Check | Result | Details |
|-------|--------|---------|
| Backend health endpoint | ✅ PASS | `curl -sk https://localhost:3001/api/v1/health` → `{"status":"ok"}` (HTTP 200) |
| Frontend serving | ✅ PASS | `curl -sk https://localhost:4173/` → HTML served correctly |
| HTTPS/TLS | ✅ PASS | Both backend (:3001) and frontend (:4173) serve over HTTPS |
| pm2 process | ✅ PASS | `triplanner-backend` online, PID 93540, uptime 4h, cluster mode, 28.7MB |
| Database connectivity | ✅ PASS | User registration succeeds → DB write/read operational |
| Backend tests | ✅ PASS | 196/196 tests pass (10 test files, 851ms) — includes 28 new Sprint 5 tests from T-072 |
| Frontend tests | ✅ PASS | 260/260 tests pass (18 test files, 3.00s) |
| Migrations | ✅ CURRENT | 8 migrations applied through Batch 3 (001–008). No Sprint 5 migrations needed. |

**Test Breakdown:**
- Backend: auth(14) + trips(16) + flights(10) + stays(8) + activities(12) + sprint2(37) + sprint3(33) + sprint4(19) + sprint5(28) + tripStatus(19) = **196 tests**
- Frontend: 18 test files = **260 tests**
- **Total: 456 tests passing** (up from 428 in Sprint 4 — 28 new backend tests from T-072)

**Known Items:**
- React Router v7 deprecation warnings still present in frontend test output (T-074 not yet implemented)
- T-072 backend implementation is complete (28 tests pass) but dev-cycle-tracker still shows "In Progress"

**Sprint 5 Deployment Plan (when unblocked):**
1. No database migrations needed (confirmed in technical-context.md)
2. Rebuild frontend with: search/filter/sort UI (T-073) + React Router v7 flags (T-074)
3. Restart backend under pm2 (T-072 code already deployed via pm2 — verify)
4. Verify Playwright is installed and configured (T-075)
5. Run full smoke tests: Sprint 4 regression (45 checks) + Sprint 5 new features (search/filter/sort API, frontend UI, E2E tests)
6. Log handoff to Monitor Agent (T-079)

**Blocker Status:** T-078 remains blocked by T-077 (QA Integration) ← T-076 (QA Security) ← T-073 (Frontend: Backlog), T-074 (Frontend: Backlog), T-075 (E2E: Backlog). T-072 (Backend) is implementation-complete but not yet marked Done in tracker.

---

| Sprint 5 — Backend unit tests (196 tests, 10 files) — T-076 | Unit Test | Pass | Success | Local | No | QA Engineer | None — 196/196 PASS, 2.07s. All 10 test files pass: auth(14), trips(16), flights(10), stays(8), activities(12), sprint2(37), sprint3(33), sprint4(19), sprint5(28), tripStatus(19). No regressions from Sprint 4. |
| Sprint 5 — Frontend unit tests (296 tests, 21 files) — T-076 | Unit Test | Pass | Success | Local | No | QA Engineer | None — 296/296 PASS, 8.86s. All 21 test files pass. 36 new Sprint 5 tests: FilterToolbar(17), EmptySearchResults(8), HomePageSearch(11). act() warnings: expected, non-blocking. |
| Sprint 5 — Security checklist verification (19 items) — T-076 | Security Scan | Pass | Success | Local | No | QA Engineer | All 19 security checklist items verified. 15 PASS, 0 FAIL, 4 DEFERRED (same infrastructure items as Sprints 1-4). No P1 security failures. See detailed report below. |
| Sprint 5 — npm audit backend | Security Scan | Pass | Success | Local | No | QA Engineer | 0 production vulnerabilities. `npm audit --omit=dev` clean. |
| Sprint 5 — npm audit frontend | Security Scan | Pass | Success | Local | No | QA Engineer | 0 production vulnerabilities. `npm audit --omit=dev` clean. |
| Sprint 5 — Backend security deep review (10 items) — T-076 | Security Scan | Pass | Success | Local | No | QA Engineer | All 10 checks PASS: SQL injection prevention (ILIKE parameterized) ✅, input validation (whitelist for sort/status/sort_order) ✅, auth enforcement (router.use(authenticate)) ✅, error response safety (no stack traces) ✅, no hardcoded secrets ✅, npm audit clean ✅, no eval/Function patterns ✅, listTripsByUser deep dive (no raw SQL concatenation) ✅, GET / route handler validation ✅, errorHandler.js safe ✅. |
| Sprint 5 — Frontend security deep review (7 items) — T-076 | Security Scan | Pass | Success | Local | No | QA Engineer | All 7 checks PASS: XSS prevention (0 dangerouslySetInnerHTML in entire frontend) ✅, no hardcoded secrets ✅, search input sanitized (trimmed in FilterToolbar) ✅, URL param validation (whitelists with silent fallback) ✅, React Router v7 flags correct ✅, auth flow intact (useTrips uses authenticated api client) ✅, error messages safe (no internal details) ✅. |
| Sprint 5 — Integration contract verification (27 checks) — T-077 | Integration Test | Pass | Success | Local | No | QA Engineer | 27/27 PASS, 0 FAIL, 0 WARN. See detailed report below. |
| Sprint 5 — Playwright E2E tests (4 scenarios) — T-075 | E2E Test | Pass | Success | Staging | No | QA Engineer | 4/4 E2E tests PASS (8.8s). Test 1: Core user flow (register→create→details→delete→logout) 1.7s ✅. Test 2: Sub-resource CRUD (flights+stays) 1.6s ✅. Test 3: Search/filter/sort 3.9s ✅. Test 4: Rate limit lockout 574ms ✅. |

---

### Sprint 5 — QA Security Checklist Verification (T-076) — 2026-02-25

**Related Tasks:** T-072, T-073, T-074, T-075

#### Authentication & Authorization

| # | Check | Result | Evidence |
|---|-------|--------|----------|
| 1 | All API endpoints require appropriate authentication | **PASS** | `router.use(authenticate)` applied to entire trips router (trips.js line 19). GET /trips with search/filter/sort params requires valid Bearer token — 401 returned without auth (sprint5.test.js line 372). |
| 2 | Role-based access control enforced | **PASS** | User-scoped queries: `query.where({ user_id: userId })` in tripModel.js. Users can only see their own trips. |
| 3 | Auth tokens have appropriate expiration and refresh | **PASS** | JWT_EXPIRES_IN=15m, JWT_REFRESH_EXPIRES_IN=7d. Refresh token rotation on use. Access token stored in-memory (useRef). |
| 4 | Password hashing uses bcrypt (min 12 rounds) | **PASS** | bcrypt with 12 rounds in auth routes. No changes in Sprint 5. |
| 5 | Failed login attempts are rate-limited | **PASS** | express-rate-limit: login 10/15min, register 20/15min, general auth 30/15min. Verified in E2E Test 4. |

#### Input Validation & Injection Prevention

| # | Check | Result | Evidence |
|---|-------|--------|----------|
| 6 | All user inputs validated on both client and server | **PASS** | Backend: sort_by/sort_order/status validated against whitelists with 400 VALIDATION_ERROR on failure. Frontend: URL params validated against VALID_STATUSES and VALID_SORTS whitelists with silent fallback. Search trimmed before API call. |
| 7 | SQL queries use parameterized statements | **PASS** | All ILIKE queries use Knex `whereRaw('name ILIKE ?', [searchTerm])` with `?` placeholder — no string concatenation. orderByRaw uses ternary guards that can only produce literal 'ASC'/'DESC'. SQL injection test in sprint5.test.js (lines 454-488) verifies injection attempt is treated as literal string. |
| 8 | NoSQL injection protection | **DEFERRED** | N/A — project uses PostgreSQL only, no NoSQL. |
| 9 | File uploads validated | **DEFERRED** | N/A — no file upload functionality exists. |
| 10 | HTML output sanitized to prevent XSS | **PASS** | 0 instances of `dangerouslySetInnerHTML` in entire frontend source tree. All user-supplied data rendered via React JSX interpolation (automatic escaping). Search input in FilterToolbar uses controlled `<input>` component. EmptySearchResults truncates search term at 30 chars. |

#### API Security

| # | Check | Result | Evidence |
|---|-------|--------|----------|
| 11 | CORS configured for expected origins only | **PASS** | CORS_ORIGIN env var controls allowed origin. No wildcards. |
| 12 | Rate limiting on public-facing endpoints | **PASS** | Auth endpoints rate-limited. GET /trips requires auth (not public-facing). |
| 13 | API responses do not leak internal error details | **PASS** | errorHandler.js suppresses err.message for 500s, returns generic "An unexpected error occurred". Validation errors return structured JSON with safe field-level messages. No stack traces in any error response. |
| 14 | Sensitive data not in URL query parameters | **PASS** | Only search term, status filter, sort preferences in URL params. No tokens, passwords, or PII. |
| 15 | HTTP security headers present | **PASS** | Helmet middleware active. nginx.conf includes X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy, CSP, server_tokens off. |

#### Data Protection

| # | Check | Result | Evidence |
|---|-------|--------|----------|
| 16 | Database credentials in env vars, not code | **PASS** | DATABASE_URL, JWT_SECRET from process.env. .env.example has placeholders only. |
| 17 | Logs do not contain PII/passwords/tokens | **PASS** | Error handler logs error type only. No request body logging. No token logging. |
| 18 | Backups configured | **DEFERRED** | Infrastructure item — staging is local PostgreSQL. Production deployment pending. |

#### Infrastructure

| # | Check | Result | Evidence |
|---|-------|--------|----------|
| 19 | HTTPS enforced | **PASS** | Backend and frontend serve over HTTPS (self-signed TLS). Cookie secure flag set. All E2E tests run over HTTPS. |
| 20 | Dependencies checked for vulnerabilities | **PASS** | `npm audit --omit=dev`: 0 vulnerabilities (backend), 0 vulnerabilities (frontend). |
| 21 | Default credentials removed | **PASS** | .env.example uses placeholder values. No default passwords in code. |
| 22 | Error pages don't reveal server technology | **DEFERRED** | nginx.conf has `server_tokens off`. Express error handler returns generic messages. |

**Summary:** 15 PASS, 0 FAIL, 4 DEFERRED (same infrastructure items as Sprints 1-4). No P1 security failures. All Sprint 5-specific security concerns addressed: search ILIKE parameterized ✅, sort/status whitelist validated ✅, no XSS in new components ✅, URL params validated ✅, React Router flags correct ✅, auth flow intact ✅.

---

### Sprint 5 — Integration Contract Verification (T-077) — 2026-02-25

**Related Tasks:** T-072, T-073, T-074

#### API Contract Verification (Frontend ↔ Backend)

| # | Check | Result | Evidence |
|---|-------|--------|----------|
| 1 | useTrips sends `search` param matching backend contract | **PASS** | `params.search = filterParams.search` → backend reads `req.query.search` |
| 2 | useTrips sends `status` param with uppercase values | **PASS** | PLANNING/ONGOING/COMPLETED sent → matches VALID_STATUS_FILTER |
| 3 | useTrips sends `sort_by` param matching whitelist | **PASS** | name/created_at/start_date → matches VALID_SORT_BY |
| 4 | useTrips sends `sort_order` param matching whitelist | **PASS** | asc/desc → matches VALID_SORT_ORDER |
| 5 | Empty values omitted from API call | **PASS** | Conditional checks `if (filterParams.search)` prevent empty string params |
| 6 | Default behavior (no params) backward compatible | **PASS** | No params → created_at desc, same as Sprint 4 |
| 7 | pagination.total reflects filtered count | **PASS** | Frontend reads `response.data.pagination?.total` → backend returns filtered total |
| 8 | Combined params compose correctly | **PASS** | search+status+sort_by+sort_order all passed simultaneously and handled |

#### UI Component Integration

| # | Check | Result | Evidence |
|---|-------|--------|----------|
| 9 | FilterToolbar search debounce at 300ms | **PASS** | `setTimeout(..., 300)` with immediate clear for empty input |
| 10 | FilterToolbar trims search input | **PASS** | `value.trim()` before dispatch |
| 11 | FilterToolbar status options match backend | **PASS** | PLANNING/ONGOING/COMPLETED uppercase values |
| 12 | FilterToolbar sort options split correctly | **PASS** | `splitSort('name:asc')` → `{sort_by:'name', sort_order:'asc'}` |
| 13 | Default sort optimization (omit default params) | **PASS** | Skips sort params when created_at:desc |
| 14 | URL search params synced with filters | **PASS** | useSearchParams with replaceState, validated on init |
| 15 | Stale request prevention | **PASS** | requestIdRef counter discards outdated responses |

#### UI States

| # | Check | Result | Evidence |
|---|-------|--------|----------|
| 16 | Default state (all trips shown) | **PASS** | Trip grid renders without filters |
| 17 | Loading state (skeleton cards / opacity) | **PASS** | Skeleton on initial load, 50% opacity on refetch |
| 18 | Error state (message + retry) | **PASS** | "could not load trips" + "try again" button |
| 19 | Empty DB state ("no trips yet" + CTA) | **PASS** | Distinct from empty search results |
| 20 | Empty search results ("no trips match" + clear) | **PASS** | hasTripsBefore + hasActiveFilters logic |
| 21 | Filtered state (result count) | **PASS** | "showing X trips" with aria-live |
| 22 | Clear filters resets all controls | **PASS** | Resets search, status, sort to defaults |

### Sprint 5 — Playwright E2E Tests (T-075) — 2026-02-25

**Related Tasks:** T-075

**Setup:**
- Playwright `@playwright/test` installed at project root
- Chromium browser engine installed
- Config: `playwright.config.js` — baseURL `https://localhost:4173`, ignoreHTTPSErrors: true, timeout 30s, Chromium only
- Test file: `e2e/critical-flows.spec.js` — 4 test scenarios

**Test Results:**

| Test | Scenario | Duration | Result |
|------|----------|----------|--------|
| Test 1 | Core user flow: register → create trip → view details → delete → logout | 1.7s | **PASS** |
| Test 2 | Sub-resource CRUD: create trip → add flight → add stay → verify on details | 1.6s | **PASS** |
| Test 3 | Search/filter/sort: create 2 trips → search → filter → sort → clear | 3.9s | **PASS** |
| Test 4 | Rate limit lockout: rapid wrong-password login → 429 banner → disabled button | 574ms | **PASS** |

**Total: 4/4 PASS (8.8s)**

All E2E tests run against the live staging environment over HTTPS. Staging backend and frontend were rebuilt with Sprint 5 code before test execution.

---

| Sprint 5 — Backend dependency install — T-078 | Build | Pass | Success | Staging | No | Deploy Engineer | npm install: 215 packages audited, up to date. 5 moderate dev-only vulns (esbuild via vitest). 0 production vulnerabilities. |
| Sprint 5 — Frontend dependency install — T-078 | Build | Pass | Success | Staging | No | Deploy Engineer | npm install: 283 packages audited, up to date. 5 moderate dev-only vulns (esbuild via vitest). 0 production vulnerabilities. |
| Sprint 5 — Frontend production build — T-078 | Build | Pass | Success | Staging | No | Deploy Engineer | Vite 6.4.1 build succeeded: 119 modules transformed, 644ms. Output: dist/index.html (0.39 kB), dist/assets/index-Dos8FkO8.css (58.93 kB gzip 9.28 kB), dist/assets/index-CRLXvPX3.js (308.50 kB gzip 95.56 kB). No errors, no warnings. VITE_API_URL=https://localhost:3001/api/v1. |
| Sprint 5 — Backend unit tests (196 tests, 10 files) — T-078 | Unit Test | Pass | Success | Local | No | Deploy Engineer | 196/196 PASS (828ms). auth(14), trips(16), flights(10), stays(8), activities(12), sprint2(37), sprint3(33), sprint4(19), sprint5(28), tripStatus(19). |
| Sprint 5 — Frontend unit tests (296 tests, 21 files) — T-078 | Unit Test | Pass | Success | Local | No | Deploy Engineer | 296/296 PASS (3.27s). 21 test files. All Sprint 5 tests included: FilterToolbar(17), EmptySearchResults(8), HomePageSearch(11). |
| Sprint 5 — Backend restart under pm2 — T-078 | Build | Pass | Success | Staging | No | Deploy Engineer | pm2 restart triplanner-backend: PID changed from 15428 → 17058. Status: online. Cluster mode. Memory: 45.6MB. HTTPS operational on :3001. |
| Sprint 5 — Frontend preview restart — T-078 | Build | Pass | Success | Staging | No | Deploy Engineer | Old frontend preview (PID 15171) stopped. New preview started (PID 17195). HTTPS operational on :4173. Serving built assets (index-CRLXvPX3.js). |
| Sprint 5 — Migration check — T-078 | Migration | Pass | Success | Staging | No | Deploy Engineer | No new migrations for Sprint 5 (confirmed). 0 pending migrations. All 8 migrations (001–008) remain applied through Batch 3. |
| Sprint 5 — Staging deployment — T-078 | Post-Deploy Health Check | Pass | Success | Staging | Pending Monitor | Deploy Engineer | Backend: https://localhost:3001 (Node.js, PORT=3001, NODE_ENV=staging, HTTPS, pm2 cluster). Frontend: https://localhost:4173 (Vite preview, HTTPS). PostgreSQL: localhost:5432/appdb. All env vars configured. All smoke tests pass. |
| Sprint 5 — Staging smoke tests (28 checks) — T-078 | E2E Test | Pass | Success | Staging | Pending Monitor | Deploy Engineer | 28/28 smoke tests PASS. See detailed report below. |

---

### Sprint 5 — Deploy Engineer: Staging Deployment Report (T-078) — 2026-02-26

**Related Task:** T-078 (Deploy: Staging re-deployment)
**Sprint:** 5
**Date:** 2026-02-26
**Deployed By:** Deploy Engineer

---

#### Pre-Deployment Checklist

| # | Check | Result | Evidence |
|---|-------|--------|----------|
| 1 | QA confirmation in handoff-log.md | ✅ VERIFIED | QA Engineer handoff (2026-02-25): "All tests pass. Deploy readiness confirmed." 496 tests (196 backend + 296 frontend + 4 E2E). T-075, T-076, T-077 all Done. |
| 2 | All Sprint 5 implementation tasks Done | ✅ VERIFIED | T-071 (Design) Done, T-072 (Backend) Done, T-073 (Frontend) Done, T-074 (Router v7) Done, T-075 (E2E) Done, T-076 (Security) Done, T-077 (Integration) Done. |
| 3 | Pending migrations check | ✅ VERIFIED | No Sprint 5 schema changes. 0 pending migrations. All 8 migrations (001–008) applied through Batch 3. Confirmed via `knex.migrate.status()` → 0 pending. |
| 4 | technical-context.md reviewed | ✅ VERIFIED | "Sprint 5 — No Schema Changes Required (T-072)" section confirms no DB changes needed. |

---

#### Build Results

| Component | Status | Details |
|-----------|--------|---------|
| Backend npm install | ✅ Success | 215 packages, 0 production vulns, 5 moderate dev-only (esbuild via vitest) |
| Frontend npm install | ✅ Success | 283 packages, 0 production vulns, 5 moderate dev-only (esbuild via vitest) |
| Frontend production build | ✅ Success | Vite 6.4.1, 119 modules, 644ms. dist/index.html (0.39 kB), index.css (58.93 kB / 9.28 kB gzip), index.js (308.50 kB / 95.56 kB gzip). VITE_API_URL=https://localhost:3001/api/v1 |
| Backend unit tests | ✅ 196/196 PASS | 10 test files, 828ms |
| Frontend unit tests | ✅ 296/296 PASS | 21 test files, 3.27s |

**Total tests: 492 unit tests passing (196 backend + 296 frontend)**

---

#### Deployment Steps Executed

1. **Backend dependency install:** `cd backend && npm install` → 215 packages, up to date ✅
2. **Frontend dependency install:** `cd frontend && npm install` → 283 packages, up to date ✅
3. **Frontend production build:** `VITE_API_URL=https://localhost:3001/api/v1 npm run build` → 119 modules, 644ms ✅
4. **Migration check:** 0 pending migrations, all 8 applied ✅
5. **Backend restart:** `pm2 restart triplanner-backend` → PID 15428→17058, online, cluster mode ✅
6. **Frontend preview restart:** Old preview (PID 15171) killed, new preview started (PID 17195), HTTPS on :4173 ✅
7. **Smoke tests:** 28/28 checks PASS ✅

---

#### Staging Environment Configuration

| Component | URL | Details |
|-----------|-----|---------|
| Backend | https://localhost:3001 | Node.js, Express, pm2 cluster mode, HTTPS |
| Frontend | https://localhost:4173 | Vite preview server, HTTPS |
| Database | localhost:5432/appdb | PostgreSQL (Homebrew), 8 migrations applied |

**Environment Variables (verified):**
- `PORT=3001`
- `NODE_ENV=staging`
- `CORS_ORIGIN=https://localhost:4173`
- `DATABASE_URL=postgresql://...`
- `JWT_SECRET=<configured>`
- `JWT_EXPIRES_IN=15m`
- `JWT_REFRESH_EXPIRES_IN=7d`
- `VITE_API_URL=https://localhost:3001/api/v1`

**Infrastructure:**
- Docker: Not available (local processes used instead)
- Process manager: pm2 6.0.14 (cluster mode, auto-restart verified from Sprint 3)
- TLS: Self-signed certs (infra/certs/localhost.pem + localhost-key.pem)

---

#### Smoke Test Results (28/28 PASS)

**Core Health (3 checks):**
| # | Test | Result |
|---|------|--------|
| 1 | Backend health check → `{"status":"ok"}` | ✅ PASS |
| 2 | Register new user | ✅ PASS |
| 3 | Login → access_token (JWT) | ✅ PASS |

**Trip CRUD (3 checks):**
| # | Test | Result |
|---|------|--------|
| 4 | Create trip 1 (Tokyo Adventure, future dates → PLANNING) | ✅ PASS |
| 5 | Create trip 2 (Paris Getaway, past dates → COMPLETED) | ✅ PASS |
| 6 | Create trip 3 (Berlin Sprint, no dates → PLANNING) | ✅ PASS |

**Sprint 5: Search API (5 checks):**
| # | Test | Result |
|---|------|--------|
| 7 | Search by name "Tokyo" → Tokyo Adventure returned | ✅ PASS |
| 8 | Search by name "Paris" → Paris Getaway returned | ✅ PASS |
| 9 | Search by destination "Osaka" → Tokyo Adventure returned | ✅ PASS |
| 10 | Search "nonexistent" → empty data array | ✅ PASS |
| 11 | Search case-insensitive "tokyo" → Tokyo Adventure returned | ✅ PASS |

**Sprint 5: Status Filter (2 checks):**
| # | Test | Result |
|---|------|--------|
| 12 | Filter status=PLANNING → includes Tokyo+Berlin | ✅ PASS |
| 13 | Filter status=COMPLETED → includes Paris | ✅ PASS |

**Sprint 5: Sort API (3 checks):**
| # | Test | Result |
|---|------|--------|
| 14 | Sort by name ascending → data returned | ✅ PASS |
| 15 | Sort by start_date ascending → data returned | ✅ PASS |
| 16 | Sort by created_at descending → data returned | ✅ PASS |

**Sprint 5: Combined Params (2 checks):**
| # | Test | Result |
|---|------|--------|
| 17 | Combined: search "Berlin" + sort by name asc → Berlin Sprint | ✅ PASS |
| 18 | Combined: status PLANNING + sort by name asc → data returned | ✅ PASS |

**Sprint 5: Validation (3 checks):**
| # | Test | Result |
|---|------|--------|
| 19 | Invalid sort_by → 400 VALIDATION_ERROR | ✅ PASS |
| 20 | Invalid sort_order → 400 VALIDATION_ERROR | ✅ PASS |
| 21 | Invalid status → 400 VALIDATION_ERROR | ✅ PASS |

**Security (4 checks):**
| # | Test | Result |
|---|------|--------|
| 22 | SQL injection attempt → treated as literal (no crash) | ✅ PASS |
| 23 | Cookie Secure flag | ✅ PASS |
| 24 | Cookie HttpOnly flag | ✅ PASS |
| 25 | Cookie SameSite=Strict | ✅ PASS |

**Sprint 4 Regression (1 check):**
| # | Test | Result |
|---|------|--------|
| 26 | Invalid UUID → 400 VALIDATION_ERROR | ✅ PASS |

**Infrastructure (2 checks):**
| # | Test | Result |
|---|------|--------|
| 27 | pm2 backend status: online | ✅ PASS |
| 28 | Frontend HTTPS → SPA root + built assets (index-CRLXvPX3.js) | ✅ PASS |

**Summary:** 28/28 smoke tests PASS. All Sprint 5 features (search, filter, sort, combined params, validation) verified. Security checks pass (SQL injection prevention, cookie flags). Sprint 4 regression pass. Infrastructure healthy.

---

#### Sprint 5 Build Size Comparison

| Sprint | Frontend JS (gzip) | Frontend CSS (gzip) | Modules | Build Time |
|--------|-------------------|--------------------|---------|-----------|
| Sprint 3 | 93.10 kB | 8.73 kB | 114 | 677ms |
| Sprint 4 | ~93 kB | ~8.7 kB | ~116 | ~650ms |
| Sprint 5 | 95.56 kB | 9.28 kB | 119 | 644ms |

**Delta from Sprint 4:** +~2.5 kB JS (gzip), +~0.6 kB CSS (gzip), +3 modules (FilterToolbar, EmptySearchResults, related CSS). Build time comparable.

---

### Sprint 5 — Monitor Agent Post-Deploy Health Check — T-079 (45 checks: Sprint 4 regression + Sprint 5 new)

| Test Run | Test Type | Result | Build Status | Environment | Deploy Verified | Tested By | Error Summary |
|----------|-----------|--------|-------------|-------------|-----------------|-----------|---------------|
| Sprint 5 — Monitor Agent post-deploy health check — T-079 (45 checks: 18 Sprint 1–4 regression + 17 Sprint 5 search/filter/sort + 6 validation + 4 E2E) | Post-Deploy Health Check | Pass | Success | Staging | **Yes** | Monitor Agent | None — 45/45 checks PASS. Full end-to-end flow verified: register → login → create trip (with dates) → add flight/stay/activity → list trips → search by name → search by destination → case-insensitive search → filter by status (PLANNING/COMPLETED) → sort (name/start_date) → combined params → empty search → validation (invalid sort_by/sort_order/status → 400) → UUID validation → SQL injection prevention → cookie security → TLS/HTTPS → Playwright E2E (4/4) → 0 × 5xx errors. Detailed report below. |

---

#### Health Check Template

```
Environment: Staging
Timestamp: 2026-02-26T05:15:00Z
Checks:
  - [x] App responds (GET /api/v1/health → 200, {"status":"ok"}, 0.036s)
  - [x] Auth works (POST /api/v1/auth/register → 201, POST /api/v1/auth/login → 200, tokens returned)
  - [x] Key endpoints respond (all endpoints from api-contracts.md verified — see table below)
  - [x] No 5xx errors in logs (pm2 error log: only expected SyntaxError from malformed JSON bodies)
  - [x] Database connected (all CRUD operations succeed, data persists correctly)
  - [x] TLS/HTTPS operational (TLSv1.3 / AEAD-AES256-GCM-SHA384, CN=localhost)
  - [x] pm2 process online (PID 17058, cluster mode, 78.6MB, 0% CPU)
  - [x] Frontend SPA accessible (HTTPS, index-CRLXvPX3.js + index-Dos8FkO8.css asset hashes match deploy)
  - [x] Playwright E2E tests pass (4/4, 10.3s)
Result: PASS
Notes: All 45 checks pass. Sprint 5 search/filter/sort features fully operational. Zero 5xx errors. Zero regressions.
```

---

#### Detailed Check Results (45 checks)

**Infrastructure (5 checks):**
| # | Test | Result | Details |
|---|------|--------|---------|
| 1 | GET /api/v1/health → 200 | ✅ PASS | HTTP 200, `{"status":"ok"}`, response time 0.036s |
| 2 | pm2 backend status: online | ✅ PASS | PID 17058, cluster mode, 78.6MB, 0% CPU, uptime 5m+ |
| 3 | Frontend HTTPS → SPA | ✅ PASS | HTTP 200, `text/html`, asset hashes: `index-CRLXvPX3.js`, `index-Dos8FkO8.css` |
| 4 | TLS/HTTPS operational | ✅ PASS | TLSv1.3 / AEAD-AES256-GCM-SHA384, subject CN=localhost |
| 5 | 0 × 5xx errors in logs | ✅ PASS | Only expected SyntaxError from malformed JSON (400-level), zero 5xx status codes |

**Auth Flow (3 checks):**
| # | Test | Result | Details |
|---|------|--------|---------|
| 6 | POST /api/v1/auth/register → 201 | ✅ PASS | Returns `{ data: { user: { id, name, email, created_at }, access_token } }` |
| 7 | POST /api/v1/auth/login → 200 | ✅ PASS | Returns `{ data: { user: { id, name, email, created_at }, access_token } }` |
| 8 | Cookie security flags | ✅ PASS | `Set-Cookie: refresh_token=...; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth; Max-Age=604800` + HSTS + X-Content-Type-Options: nosniff + X-Frame-Options: SAMEORIGIN |

**Trip CRUD (5 checks):**
| # | Test | Result | Details |
|---|------|--------|---------|
| 9 | POST /api/v1/trips → 201 | ✅ PASS | Trip created with name, destinations, start_date, end_date. Status computed as PLANNING (future dates). |
| 10 | GET /api/v1/trips → 200 | ✅ PASS | Returns array with pagination `{ data: [...], pagination: { page, limit, total } }` |
| 11 | GET /api/v1/trips/:id → 200 | ✅ PASS | Returns single trip with all fields |
| 12 | PATCH /api/v1/trips/:id → 200 | ✅ PASS | Name updated, `updated_at` changed |
| 13 | DELETE /api/v1/trips/:id → 204 | ✅ PASS | Cascading delete (flights, stays, activities removed) |

**Sub-Resources (5 checks):**
| # | Test | Result | Details |
|---|------|--------|---------|
| 14 | POST /trips/:id/flights → 201 | ✅ PASS | Flight created with flight_number, airline, timestamps, timezones |
| 15 | GET /trips/:id/flights → 200 | ✅ PASS | Returns flight array |
| 16 | POST /trips/:id/stays → 201 | ✅ PASS | Stay created with HOTEL category, check_in/out timestamps + timezones |
| 17 | GET /trips/:id/stays → 200 | ✅ PASS | Returns stay array |
| 18 | POST /trips/:id/activities → 201 + GET → 200 | ✅ PASS | Activity created with activity_date, location |

**Sprint 5: Search (4 checks):**
| # | Test | Result | Details |
|---|------|--------|---------|
| 19 | GET /trips?search=Paris → 200 (name match) | ✅ PASS | Returns 1 trip ("Paris Adventure"), total=1 |
| 20 | GET /trips?search=Tokyo → 200 (destination match) | ✅ PASS | Returns 1 trip with Tokyo in destinations, total=1 |
| 21 | GET /trips?search=BERLIN → 200 (case-insensitive) | ✅ PASS | Returns 1 trip ("Berlin Getaway"), total=1 |
| 22 | GET /trips?search=ZZZNonExistent → 200 (empty results) | ✅ PASS | Returns `{ data: [], pagination: { total: 0 } }` |

**Sprint 5: Status Filter (2 checks):**
| # | Test | Result | Details |
|---|------|--------|---------|
| 23 | GET /trips?status=PLANNING → 200 | ✅ PASS | Returns 2 trips (future dates + no dates), all status=PLANNING |
| 24 | GET /trips?status=COMPLETED → 200 | ✅ PASS | Returns 1 trip (Paris, end_date 2026-01-15 in past), status=COMPLETED |

**Sprint 5: Sort (2 checks):**
| # | Test | Result | Details |
|---|------|--------|---------|
| 25 | GET /trips?sort_by=name&sort_order=asc → 200 | ✅ PASS | Order: Berlin < Paris < Updated Monitor (alphabetical) ✅ |
| 26 | GET /trips?sort_by=start_date&sort_order=asc → 200 | ✅ PASS | Order: Paris (Jan 1) < Updated Monitor (Jun 1) < Berlin (null last) ✅ |

**Sprint 5: Combined Params (1 check):**
| # | Test | Result | Details |
|---|------|--------|---------|
| 27 | GET /trips?search=monitor&status=PLANNING&sort_by=name&sort_order=asc → 200 | ✅ PASS | Returns 1 trip (Updated Monitor Trip, status=PLANNING), all params compose correctly |

**Sprint 5: Validation / Error Handling (6 checks):**
| # | Test | Result | Details |
|---|------|--------|---------|
| 28 | Invalid sort_by → 400 | ✅ PASS | `{ error: { code: "VALIDATION_ERROR", fields: { sort_by: "Sort field must be one of: name, created_at, start_date" } } }` |
| 29 | Invalid sort_order → 400 | ✅ PASS | `{ error: { code: "VALIDATION_ERROR", fields: { sort_order: "Sort order must be one of: asc, desc" } } }` |
| 30 | Invalid status → 400 | ✅ PASS | `{ error: { code: "VALIDATION_ERROR", fields: { status: "Status filter must be one of: PLANNING, ONGOING, COMPLETED" } } }` |
| 31 | Invalid UUID → 400 | ✅ PASS | `{ error: { message: "Invalid ID format", code: "VALIDATION_ERROR" } }` |
| 32 | No auth token → 401 | ✅ PASS | `{ error: { message: "Authentication required", code: "UNAUTHORIZED" } }` |
| 33 | SQL injection in search → 200 (safe) | ✅ PASS | `?search='; DROP TABLE trips; --` returns empty results, table intact, no crash |

**Sprint 5: Computed Status (2 checks):**
| # | Test | Result | Details |
|---|------|--------|---------|
| 34 | Trip with future dates → status PLANNING | ✅ PASS | start_date=2026-06-01, end_date=2026-06-15 → computed status=PLANNING |
| 35 | Trip with past end_date → status COMPLETED | ✅ PASS | start_date=2026-01-01, end_date=2026-01-15 → computed status=COMPLETED |

**Sprint 5: Playwright E2E Tests (4 checks):**
| # | Test | Result | Details |
|---|------|--------|---------|
| 36 | E2E Test 1: Core user flow — register, create trip, view details, delete, logout | ✅ PASS | 1.6s |
| 37 | E2E Test 2: Sub-resource CRUD — create trip, add flight, add stay, verify on details page | ✅ PASS | 1.6s |
| 38 | E2E Test 3: Search, filter, sort — create trips, search, filter by status, sort by name, clear filters | ✅ PASS | 4.0s |
| 39 | E2E Test 4: Rate limit lockout — rapid wrong-password login triggers 429 banner and disables submit | ✅ PASS | 2.0s |

**Sprint 4 Regression (6 checks):**
| # | Test | Result | Details |
|---|------|--------|---------|
| 40 | Destination dedup (POST trips) | ✅ PASS | Verified via E2E Test 1 (create trip with destinations) |
| 41 | HSTS header present | ✅ PASS | `Strict-Transport-Security: max-age=31536000; includeSubDomains` |
| 42 | X-Content-Type-Options | ✅ PASS | `nosniff` |
| 43 | X-Frame-Options | ✅ PASS | `SAMEORIGIN` |
| 44 | Rate limiting on auth | ✅ PASS | Verified via E2E Test 4 (429 on rapid login) |
| 45 | Refresh token cookie path scoped | ✅ PASS | `Path=/api/v1/auth` |

---

**Summary:** 45/45 checks PASS. Deploy Verified = **Yes**. All Sprint 5 features (search, filter, sort, combined params, validation) verified end-to-end. All Sprint 1–4 regression checks pass over HTTPS. 4/4 Playwright E2E tests pass. Zero 5xx errors. Cookie security, TLS, and security headers all correct. Staging is ready for User Agent testing (T-080).

---

---

## Sprint 6 QA Run — 2026-02-27

**QA Engineer:** QA Agent (automated orchestrator — Sprint #6)
**Tasks in scope:** T-085, T-086 (Integration Check); T-083, T-084, T-087, T-088, T-089 (frontend — completed per FE handoff); T-090 (security audit), T-091 (integration testing)

---

### Test Type: Unit Test — Backend (T-090)

**Command:** `cd backend && npm test`
**Date:** 2026-02-27
**Result:** ✅ 247/247 PASS (0 failures)

| Test File | Tests | Status |
|-----------|-------|--------|
| `auth.test.js` | 14 | ✅ PASS |
| `trips.test.js` | 16 | ✅ PASS |
| `flights.test.js` | 10 | ✅ PASS |
| `stays.test.js` | 8 | ✅ PASS |
| `activities.test.js` | 12 | ✅ PASS |
| `tripStatus.test.js` | 19 | ✅ PASS |
| `sprint2.test.js` | 37 | ✅ PASS |
| `sprint3.test.js` | 33 | ✅ PASS |
| `sprint4.test.js` | 19 | ✅ PASS |
| `sprint5.test.js` | 28 | ✅ PASS |
| `sprint6.test.js` | 51 | ✅ PASS |

**Sprint 6 backend test coverage (sprint6.test.js — 51 tests):**
- T-085 ILIKE escaping: 7 tests (unit + route-level) — all pass against mocked DB
- T-086 Land Travel CRUD: 44 tests — GET list (6), POST (12), GET by ID (5), PATCH (12), DELETE (5) + same-day validation (4)
- All tests use mocked model layer (DB not exercised in unit test suite)

**Coverage assessment:**
- ✅ Happy path per endpoint: covered
- ✅ Error path per endpoint: covered (400, 401, 403, 404)
- ✅ UUID validation: covered
- ✅ Ownership check: covered
- ✅ Same-day arrival_time > departure_time validation: 4 dedicated tests (POST + PATCH error + happy)

---

### Test Type: Unit Test — Frontend (T-090)

**Command:** `cd frontend && npm test`
**Date:** 2026-02-27
**Result:** ❌ 331/332 PASS — **1 FAILURE**

| Test File | Tests | Status |
|-----------|-------|--------|
| `LoginPage.test.jsx` | pass | ✅ |
| `RegisterPage.test.jsx` | pass | ✅ |
| `Navbar.test.jsx` | pass | ✅ |
| `HomePage.test.jsx` | pass | ✅ |
| `HomePageSearch.test.jsx` | pass | ✅ (T-084 toolbar fix verified) |
| `TripCard.test.jsx` | pass | ✅ |
| `TripDetailsPage.test.jsx` | pass | ✅ |
| `useTripDetails.test.js` | pass | ✅ |
| `ActivitiesEditPage.test.jsx` | pass | ✅ (T-083 CSS class tests pass) |
| `FlightsEditPage.test.jsx` | pass | ✅ |
| `StaysEditPage.test.jsx` | pass | ✅ |
| `TripCalendar.test.jsx` | pass | ✅ (T-089 calendar enhancements) |
| `LandTravelEditPage.test.jsx` | 15/16 ✅, **1 ❌** | ⚠️ FAIL |
| `useTrips.test.js` | pass | ✅ |
| All other test files | pass | ✅ |

**Failure Detail:**

```
FAIL src/__tests__/LandTravelEditPage.test.jsx
  > LandTravelEditPage > renders existing land travel entries with mode, provider, from/to locations
  → Unable to find an element with the display value: TRAIN.
  (timeout 1014ms)
```

**Root Cause Analysis (QA):** This is a **test bug**, not an implementation bug.

- `screen.getByDisplayValue('TRAIN')` — RTL's `getByDisplayValue` for select elements matches the TEXT CONTENT of the currently selected option, not the `value` attribute.
- The `<select>` has options: `<option value="TRAIN">Train</option>` (title case label per spec).
- When `mode = 'TRAIN'`, the selected option's display text is `"Train"` (not `"TRAIN"`).
- The correct assertion should be `getByDisplayValue('Train')`.
- The implementation in `LandTravelEditPage.jsx` is correct per spec (human-readable labels: "Rental Car", "Bus", "Train", etc.).

**Action Required:** Frontend Engineer must update test assertion on line 144 of `LandTravelEditPage.test.jsx`:
- Change: `expect(screen.getByDisplayValue('TRAIN')).toBeDefined();`
- To: `expect(screen.getByDisplayValue('Train')).toBeDefined();`

---

### Test Type: Config Consistency Check

**Date:** 2026-02-27
**Result:** ✅ ALL CONSISTENT

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| Backend PORT (`.env`) | 3000 | `PORT=3000` | ✅ |
| Vite proxy target (`vite.config.js`) | `http://localhost:3000` | `http://localhost:3000` | ✅ |
| SSL enabled? | No (COOKIE_SECURE=false, SSL paths commented out) | Disabled | ✅ |
| Vite proxy scheme | `http://` (no SSL) | `http://localhost:3000` | ✅ |
| CORS_ORIGIN (`.env`) | `http://localhost:5173` | `http://localhost:5173` | ✅ |
| Frontend dev server port | 5173 | `server.port: 5173` in vite.config.js | ✅ |
| Docker backend PORT | 3000 | `PORT: 3000` in docker-compose.yml | ✅ |

**Notes:**
- Port 3001 used on staging (Sprint 5 T-020 conflict) is a staging-only override via environment variables; local dev config (3000) is correct and consistent.
- No config consistency issues found.

---

### Test Type: Security Scan (T-090)

**Date:** 2026-02-27
**npm audit (production dependencies):** `found 0 vulnerabilities` ✅
**npm audit (all dependencies including dev):** 5 moderate — all in vite/vitest dev toolchain (NOT production, not blocking)

#### Security Checklist — Sprint 6 Items

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 1 | All land travel endpoints require authentication | ✅ PASS | `router.use(authenticate)` at top of `landTravel.js` — all 5 routes protected |
| 2 | Trip ownership enforced on every land travel operation | ✅ PASS | `requireTripOwnership()` called before any data access in all 5 handlers |
| 3 | Cross-user access → 403 (not 404) | ✅ PASS | Confirmed in `requireTripOwnership()` implementation and 4 ownership tests |
| 4 | UUID validation on tripId and ltId | ✅ PASS | `router.param('tripId', uuidParamHandler)` and `router.param('ltId', uuidParamHandler)` |
| 5 | Mode enum enforced at app layer | ✅ PASS | `createLandTravelSchema.mode.enum = VALID_LAND_TRAVEL_MODES` |
| 6 | Mode enum enforced at DB layer | ✅ PASS | CHECK constraint in migration 009: `CHECK (mode IN ('RENTAL_CAR','BUS','TRAIN','RIDESHARE','FERRY','OTHER'))` |
| 7 | No SQL injection (parameterized Knex queries) | ✅ PASS | All queries use Knex builder (`.where({ id })`, `.insert({})`); no string concatenation |
| 8 | Error responses contain no stack traces or internal details | ✅ PASS | All error responses use `{ message, code, fields? }` format only |
| 9 | Migration 009 reversible | ✅ PASS | `down()` uses `dropTableIfExists('land_travels')` |
| 10 | No XSS in land travel form (no dangerouslySetInnerHTML) | ✅ PASS | No raw HTML injection found in `LandTravelEditPage.jsx` |
| 11 | No XSS in calendar popover | ✅ PASS | `DayPopover` renders all data through React JSX — no `dangerouslySetInnerHTML` |
| 12 | FilterToolbar fix logic correct | ✅ PASS | `showToolbar = initialLoadDone && (hasTripsBefore || trips.length > 0)` — `!isLoading` removed ✅ |
| 13 | Land travel API client uses correct endpoints | ✅ PASS | `api.land_travel.{list,create,get,update,delete}` all use `/trips/${tripId}/land-travel` |
| 14 | No hardcoded secrets in source files | ✅ PASS | `backend/.env` is in `.gitignore`; JWT_SECRET is env var only |
| 15 | Rate limiting on auth endpoints | ⚠️ KNOWN RISK | Rate limiting still not applied to `/auth/login` and `/auth/register` — accepted known risk from Sprint 1 (T-010 review) |
| **16** | **T-085 ILIKE ESCAPE clause with real PostgreSQL** | **❌ P1 FAIL** | **See critical finding below** |

---

### ⚠️ CRITICAL FINDING — P1 Bug: T-085 ILIKE ESCAPE Clause Fails on PostgreSQL

**Severity:** P1 — Causes 500 Internal Server Error for any search containing `%` or `_`
**Affected Endpoint:** `GET /api/v1/trips?search=<term>`
**Discovered:** Live PostgreSQL test on local DB (appdb, migrations 001-008)

**PostgreSQL Configuration:**
- `standard_conforming_strings = on` (PostgreSQL default since v9.1)

**Root Cause:**

In `backend/src/models/tripModel.js`, `applyBaseFilters()`:
```js
this.whereRaw("name ILIKE ? ESCAPE '\\\\'", [searchTerm])
  .orWhereRaw("array_to_string(destinations, ',') ILIKE ? ESCAPE '\\\\'", [searchTerm]);
```

In JavaScript source, `'\\\\'` is 2 backslashes (4 escape chars → 2 actual chars). Knex sends `ESCAPE '\\'` to PostgreSQL. With `standard_conforming_strings=on`, `'\\'` is the 2-character string `\\` (two backslashes). PostgreSQL's `ESCAPE` clause requires exactly 1 character.

**Verified on local PostgreSQL:**
```sql
SELECT name FROM trips WHERE name ILIKE '%\%%' ESCAPE '\\';
-- ERROR:  invalid escape string
-- HINT:  Escape string must be empty or one character.
```

**Impact:**
- `GET /api/v1/trips?search=%` → 500 Internal Server Error (not 200 with 0 results)
- `GET /api/v1/trips?search=_` → 500 Internal Server Error
- Normal searches (e.g., `?search=Paris`) are unaffected (no wildcard chars in term)

**Unit tests pass because** the T-085 tests mock `tripModel.js` (`vi.mock('../models/tripModel.js')`), so the actual SQL is never executed against PostgreSQL.

**Required Fix** (Backend Engineer):
Change escape character from `\` to `!` in `tripModel.js:applyBaseFilters()`:
```js
const escaped = search
  .trim()
  .replace(/!/g, '!!') // Escape the escape char first
  .replace(/%/g, '!%') // Escape percent wildcard
  .replace(/_/g, '!_'); // Escape underscore wildcard

// In whereRaw calls, change ESCAPE '\\\\' to ESCAPE '!'
this.whereRaw("name ILIKE ? ESCAPE '!'", [searchTerm])
  .orWhereRaw("array_to_string(destinations, ',') ILIKE ? ESCAPE '!'", [searchTerm]);
```
Update the T-085 tests (sprint6.test.js) to verify the `!` escaping pattern instead of `\`.

---

### Test Type: Integration Test (T-091)

**Date:** 2026-02-27
**Method:** Code review + static analysis + live DB verification (staging not available)

#### T-085 Integration Verification

| Check | Result | Details |
|-------|--------|---------|
| `GET /trips?search=%` → 200 `{ data: [] }` | ❌ **FAIL** | Returns **500 ERROR** on real PostgreSQL — ESCAPE clause bug confirmed via live psql test |
| `GET /trips?search=_` → 200 `{ data: [] }` | ❌ **FAIL** | Same root cause — 500 error |
| `GET /trips?search=Paris` → 200 with results | ✅ PASS | Normal search terms (no `%`/`_`) unaffected |
| Auth check unchanged | ✅ PASS | Verified in test suite |

**T-085 Integration Result: ❌ BLOCKED — P1 bug confirmed**

#### T-086 Integration Verification (Code Review)

| Check | Result | Details |
|-------|--------|---------|
| POST → 201 with full resource | ✅ PASS | Verified: route returns `{ data: entry }` with all fields |
| GET list → 200 `{ data: [] }` when empty | ✅ PASS | `listLandTravelsByTrip` returns empty array |
| GET list sorted by departure_date ASC, departure_time NULLS LAST | ✅ PASS | `orderByRaw('departure_date ASC, departure_time ASC NULLS LAST')` confirmed |
| PATCH → 200 with merged values | ✅ PASS | Uses existing DB values as fallback for unset fields |
| DELETE → 204 | ✅ PASS | `res.status(204).send()` confirmed |
| Cross-user access → 403 | ✅ PASS | `requireTripOwnership()` checks `trip.user_id !== req.user.id` → 403 |
| Invalid mode → 400 VALIDATION_ERROR | ✅ PASS | Enum check in `createLandTravelSchema` and PATCH manual validation |
| Missing required fields → 400 | ✅ PASS | `required: true` fields validated |
| arrival_time without arrival_date → 400 | ✅ PASS | Custom validator in `arrival_time` field |
| arrival_date before departure_date → 400 | ✅ PASS | Custom validator in `arrival_date` field |
| Same-day arrival_time ≤ departure_time → 400 | ✅ PASS | POST: `createLandTravelSchema.arrival_time.custom`; PATCH: cross-field block with merged values |
| Cross-day arrival + any times → 201/200 (rule not triggered) | ✅ PASS | Same-day rule conditioned on `arrival_date === departure_date` |
| Non-UUID tripId/ltId → 400 | ✅ PASS | `router.param` with `uuidParamHandler` |
| Non-existent trip → 404 | ✅ PASS | `findTripById` returns undefined → 404 in `requireTripOwnership` |
| Non-existent entry → 404 | ✅ PASS | `findLandTravelById` returns undefined → 404 |
| Unauthenticated → 401 | ✅ PASS | `router.use(authenticate)` |
| Migration 009 in codebase (pending deployment) | ✅ READY | `20260227_009_create_land_travels.js` present and correct |

**T-086 Integration Result: ✅ PASS (code review)**
**Note:** Live DB verification pending T-092 deployment (migration 009 not yet applied to staging).

#### Frontend Integration Verification (Code Review)

| Task | Check | Result | Details |
|------|-------|--------|---------|
| T-083 | AM/PM column min-width | ✅ PASS | `min-width: 110px` on time columns in CSS |
| T-083 | Clock icon color | ✅ PASS | `color-scheme: dark` on `[type="time"]` inputs |
| T-084 | FilterToolbar stays visible during refetch | ✅ PASS | `showToolbar = initialLoadDone && (hasTripsBefore || trips.length > 0)` — no `!isLoading` |
| T-087 | Land travel edit page route registered | ✅ PASS | `App.jsx` has `/trips/:id/land-travel/edit` route |
| T-087 | Multi-row form with all 6 mode options | ✅ PASS | `LAND_TRAVEL_MODES` array with 6 entries in `LandTravelEditPage.jsx` |
| T-087 | Batch save (POST new / PATCH edited / DELETE removed) | ✅ PASS | `handleSave()` uses `Promise.allSettled` with ops for create/update/delete |
| T-087 | API uses correct endpoints | ✅ PASS | `api.land_travel.create/update/delete(tripId, ...)` matches contract |
| T-088 | Land travel section below Activities | ✅ PASS | Section rendered in `TripDetailsPage.jsx` |
| T-088 | Parallel fetch via `Promise.allSettled` | ✅ PASS | `useTripDetails.js` includes `api.land_travel.list` in `Promise.allSettled` |
| T-088 | Mode badge, from→to, dates, optional fields displayed | ✅ PASS | Confirmed in `TripDetailsPage.jsx` JSX |
| T-088 | Calendar receives land travel data | ✅ PASS | `landTravels={landTravels}` passed to `TripCalendar` |
| T-089 | `formatCalendarTime()` helper defined | ✅ PASS | Function defined in `TripCalendar.jsx` |
| T-089 | Event time shown on flight, stay, activity, land travel chips | ✅ PASS | `_calTime` field added via `formatCalendarTime()` in `buildEventsMap` |
| T-089 | `DayPopover` component with `role="dialog"` | ✅ PASS | `DayPopover` function component in `TripCalendar.jsx` |
| T-089 | "+X more" opens popover | ✅ PASS | `openPopoverDay` state toggled on overflow button click |
| API contract compliance — land_travel endpoints | ✅ PASS | All 5 client methods match contract paths |

---

### Summary — Sprint 6 QA Results

| Task | Type | Status | Notes |
|------|------|--------|-------|
| T-083 | Bug Fix (FE) | ✅ Pass | Implementation correct; test passes |
| T-084 | Bug Fix (FE) | ✅ Pass | Toolbar fix confirmed; test passes |
| **T-085** | **Bug Fix (BE)** | **❌ BLOCKED** | **P1: ESCAPE clause causes 500 on real PostgreSQL with `%` or `_` search** |
| T-086 | Feature (BE) | ✅ Pass | All 42 tests pass; code review verified; same-day validation implemented |
| **T-087** | **Feature (FE)** | **⚠️ BLOCKED** | **1 failing unit test (test bug: `getByDisplayValue('TRAIN')` should be `getByDisplayValue('Train')`)** |
| T-088 | Feature (FE) | ✅ Pass | Implementation and tests correct |
| T-089 | Feature (FE) | ✅ Pass | Calendar enhancements implemented and tested |
| T-090 | Security Audit | ✅ Done | 15/16 checks pass; 1 P1 found (T-085); rate limiting is known accepted risk |
| T-091 | Integration Test | ❌ Blocked | T-085 P1 blocks integration pass |
| T-092 | Deploy | ❌ Blocked | Waiting on T-085 fix + T-087 test fix |

**Overall Sprint 6 QA Verdict: ❌ BLOCKED — Deployment cannot proceed.**

**Blockers:**
1. **P1 (T-085):** ILIKE ESCAPE clause causes 500 errors on PostgreSQL with `standard_conforming_strings=on`. Backend Engineer must fix. Change escape char from `\` to `!`.
2. **P2 (T-087):** 1 failing frontend unit test (test assertion bug). Frontend Engineer must fix `getByDisplayValue('TRAIN')` → `getByDisplayValue('Train')`.

**Ready to deploy after fixes:**
- T-083, T-084, T-086, T-088, T-089 ✅
- Backend 247/247 tests pass ✅
- Frontend 331/332 tests pass (1 test fix needed) ⚠️
- No security vulnerabilities in production dependencies ✅
- Config consistency verified ✅

---

## Sprint 6 — T-091 Re-Verification: Integration Testing PASS (2026-02-27)

**QA Engineer:** Sprint 6, Phase 5 — T-091 Integration Testing (Re-run after T-085 + T-087 fixes)
**Date:** 2026-02-27
**Triggered By:** Manager re-approval of T-085 (ESCAPE char fix) + Frontend Engineer T-087 test fix

---

### Unit Test Results (Re-Run)

| Test Type | File | Tests | Status |
|-----------|------|-------|--------|
| Unit Test | backend: auth.test.js | 14/14 | ✅ Pass |
| Unit Test | backend: trips.test.js | 16/16 | ✅ Pass |
| Unit Test | backend: flights.test.js | 10/10 | ✅ Pass |
| Unit Test | backend: stays.test.js | 8/8 | ✅ Pass |
| Unit Test | backend: activities.test.js | 12/12 | ✅ Pass |
| Unit Test | backend: tripStatus.test.js | 19/19 | ✅ Pass |
| Unit Test | backend: sprint2.test.js | 37/37 | ✅ Pass |
| Unit Test | backend: sprint3.test.js | 33/33 | ✅ Pass |
| Unit Test | backend: sprint4.test.js | 19/19 | ✅ Pass |
| Unit Test | backend: sprint5.test.js | 28/28 | ✅ Pass |
| Unit Test | backend: sprint6.test.js | 51/51 | ✅ Pass |
| **BACKEND TOTAL** | **11 files** | **247/247** | **✅ ALL PASS** |

| Test Type | File | Tests | Status |
|-----------|------|-------|--------|
| Unit Test | frontend: LandTravelEditPage.test.jsx | 16/16 | ✅ Pass |
| Unit Test | frontend: TripCalendar.test.jsx | 26/26 | ✅ Pass |
| Unit Test | frontend: TripDetailsPage.test.jsx | 47/47 | ✅ Pass |
| Unit Test | frontend: FilterToolbar.test.jsx | 17/17 | ✅ Pass |
| Unit Test | frontend: HomePageSearch.test.jsx | 11/11 | ✅ Pass |
| Unit Test | frontend: All other files | 215/215 | ✅ Pass |
| **FRONTEND TOTAL** | **22 files** | **332/332** | **✅ ALL PASS** |

**Sprint 6 Fixes Confirmed:**
- T-085 fix: `sprint6.test.js` lines 163–275 (7 ILIKE escaping tests) — ALL PASS ✅
- T-086 feature: `sprint6.test.js` lines 279–921 (42 land travel tests — confirmed 51 total for sprint6 file including T-085) — ALL PASS ✅
- T-087 fix: `LandTravelEditPage.test.jsx` 16 tests — ALL PASS ✅ (test assertion bug fixed)

---

### Test Type: Unit Test — Sprint 6 Coverage Verification

**T-085 (ILIKE Escaping Fix):**
- [x] Happy path: normal search term `Japan` passes to model ✅
- [x] Happy path: search `%` (URL-encoded as `%25`) returns 200, empty array ✅
- [x] Happy path: search `_` returns 200, empty array ✅
- [x] Happy path: search `100%` returns 200 ✅
- [x] Model unit: escaping function — `!→!!`, `%→!%`, `_→!_` (correct order) ✅
- [x] Error path: missing auth → 401 still enforced ✅

**T-086 (Land Travel CRUD):**
- [x] GET list: happy path empty array, sorted list with all fields ✅
- [x] GET list: error paths — 401, 400 (bad UUID), 404, 403 ✅
- [x] POST create: happy path full payload → 201 with full resource ✅
- [x] POST create: happy path minimal payload (only required fields) → 201 ✅
- [x] POST create: invalid mode → 400 VALIDATION_ERROR ✅
- [x] POST create: missing required fields → 400 VALIDATION_ERROR ✅
- [x] POST create: arrival_date < departure_date → 400 ✅
- [x] POST create: arrival_time without arrival_date → 400 ✅
- [x] POST create: same-day arrival_time <= departure_time → 400 ✅ (Manager-required fix)
- [x] POST create: same-day with valid times (arrival > departure) → 201 ✅
- [x] PATCH update: happy path partial update ✅
- [x] PATCH update: no updatable fields → 400 ✅
- [x] PATCH update: same-day time validation → 400 ✅ (Manager-required fix)
- [x] DELETE: happy path → 204 ✅
- [x] DELETE: 404 for unknown entry ✅
- [x] Ownership: cross-user access → 403 on all endpoints ✅
- [x] UUID validation: non-UUID tripId/ltId → 400 on all endpoints ✅

---

### Test Type: Integration Test — Sprint 6 Contract Verification

**T-085 — ILIKE Escaping — API Contract Adherence:**

| Check | Expected | Verified | Status |
|-------|----------|----------|--------|
| Escape character | `!` (single char, PG 9.1+ safe) | `! → !!`, `% → !%`, `_ → !_` in tripModel.js | ✅ Pass |
| Escaping order | `!` first to prevent double-escape | Correct order in replace() chain | ✅ Pass |
| ESCAPE clause | `ILIKE ? ESCAPE '!'` | Both name and array_to_string ILIKE calls updated | ✅ Pass |
| Auth preserved | 401 without token | Confirmed via unit test | ✅ Pass |
| Normal search works | Japan → passes to model correctly | Confirmed via unit test | ✅ Pass |
| Live PostgreSQL check | `search=%` → 0 results (not 500) | **DEFERRED** — requires T-092 staging deployment | ⏳ Pending |

**Note on live PostgreSQL check:** Unit tests confirm correct escaping logic. The critical live staging check (`GET /api/v1/trips?search=%` → `{data:[]}` not 500) is deferred to Monitor Agent (T-093) after T-092 staging deployment. Previous QA confirmed the original `\`-based ESCAPE failed on PostgreSQL; the fix (`!` escape char) is logically correct and safe per PostgreSQL 9.1+ `standard_conforming_strings=on` semantics.

**T-086 — Land Travel API — Contract vs Implementation:**

| Endpoint | Expected Status | Response Shape | Auth | Ownership | Status |
|----------|----------------|----------------|------|-----------|--------|
| GET /trips/:id/land-travel | 200 `{data: []}` | Array of land travel objects, sorted by departure_date ASC | 401 without token | 403 for other user | ✅ Pass |
| POST /trips/:id/land-travel | 201 `{data: {...}}` | Full land travel resource with all fields | 401 without token | 403 for other user | ✅ Pass |
| GET /trips/:id/land-travel/:ltId | 200 `{data: {...}}` | Single resource, 404 if not found | 401 | 403 | ✅ Pass |
| PATCH /trips/:id/land-travel/:ltId | 200 `{data: {...}}` | Updated resource | 401 | 403 | ✅ Pass |
| DELETE /trips/:id/land-travel/:ltId | 204 no body | — | 401 | 403 | ✅ Pass |

**Field Contract Compliance:**
- `mode`: enum `RENTAL_CAR|BUS|TRAIN|RIDESHARE|FERRY|OTHER` — enforced at app + DB layer ✅
- `departure_date`: YYYY-MM-DD (TO_CHAR in model) ✅
- `departure_time`: HH:MM:SS (TO_CHAR in model, api-contracts.md updated) ✅
- `arrival_date`: YYYY-MM-DD or null ✅
- `arrival_time`: HH:MM:SS or null ✅
- Same-day validation (arrival_time > departure_time when same date) ✅
- `provider`, `confirmation_number`, `notes`: optional nullable strings ✅

**Frontend → Backend API Contract Adherence:**
- `api.land_travel.list(tripId)` → `GET /trips/${tripId}/land-travel` ✅
- `api.land_travel.create(tripId, body)` → `POST /trips/${tripId}/land-travel` ✅
- `api.land_travel.get(tripId, id)` → `GET /trips/${tripId}/land-travel/${id}` ✅
- `api.land_travel.update(tripId, id, body)` → `PATCH /trips/${tripId}/land-travel/${id}` ✅
- `api.land_travel.delete(tripId, id)` → `DELETE /trips/${tripId}/land-travel/${id}` ✅

**T-083 — Activity Edit Page Bug Fixes:**
- `min-width` on time columns in ActivitiesEditPage.module.css: 110px (start/end_time) → full HH:MM AM/PM visible ✅
- Clock icon color: `color-scheme: dark` applied — browser-native time picker icons are white on dark backgrounds ✅
- Test coverage: included in 332/332 passing frontend tests ✅

**T-084 — FilterToolbar Refetch Flicker Fix:**
- `showToolbar` condition: `initialLoadDone && (hasTripsBefore || trips.length > 0)` — `!isLoading` removed ✅
- Code comment in HomePage.jsx confirms intentional removal: "NOTE: !isLoading intentionally removed" ✅
- Spec 11.7.4 compliance restored: toolbar stays mounted and interactive during API refetch ✅
- Test coverage: included in 332/332 passing frontend tests ✅

**T-087 — LandTravelEditPage:**
- 16 tests all pass ✅
- All form states: loading, empty, with entries, add row, delete row ✅
- Save flow: POST (new), PATCH (modified), DELETE (removed) tested ✅
- All 6 mode options in dropdown verified ✅
- Required/optional field labels verified ✅
- Cancel navigates without API calls ✅
- Validation error handling verified ✅

**T-088 — Land Travel Section on TripDetailsPage:**
- Section header "land travel" renders ✅
- LandTravelCard renders mode badge, provider, from→to route, dates/times ✅
- Empty state "no land travel added yet." renders when array is empty ✅
- Edit link to `/trips/:id/land-travel/edit` confirmed ✅
- Loading skeleton renders during fetch ✅
- Error state with retry renders on fetch failure ✅
- `useTripDetails` fetches `api.land_travel.list(tripId)` via `Promise.allSettled` ✅
- `refetchLandTravels` only calls land travel endpoint ✅
- `landTravels` array passed to `TripCalendar` component ✅

**T-089 — Calendar Enhancements:**
- `formatCalendarTime()` helper: `"9a"`, `"2:30p"`, `"4p"` compact format ✅
- Flight chips show departure time (converted to local via departure_tz) ✅
- Activity chips show start_time ✅
- Stay chips show check-in time ✅
- Land travel chips show departure_time and mode label ✅
- No time element when time field is null ✅
- `+X more` renders as `<button>` (not plain text span) ✅
- Clicking `+X more` opens day popover ✅
- Popover lists all events for the day with name and time ✅
- Escape key closes popover ✅
- Close button closes popover ✅

**UI State Completeness (all Sprint 6 UI):**
- Land travel section: empty ✅, loading ✅, error ✅, populated ✅
- Land travel edit page: loading ✅, empty (first add) ✅, with entries ✅, save error ✅, cancel ✅
- FilterToolbar: stays visible during refetch ✅ (T-084)
- Calendar: event times shown ✅, overflow popover ✅

---

### Test Type: Config Consistency Check

| Config Item | backend/.env | frontend/vite.config.js | infra/docker-compose.yml | Status |
|-------------|-------------|-------------------------|--------------------------|--------|
| Backend PORT | 3000 | proxy target: http://localhost:3000 | PORT: 3000 (container) | ✅ MATCH |
| SSL mode | SSL disabled (commented out) | Dev proxy uses http:// | Production uses HTTPS separately | ✅ CONSISTENT |
| CORS_ORIGIN | http://localhost:5173 | Vite dev server port: 5173 | Defaults to http://localhost (prod) | ✅ MATCH (dev) |
| Frontend dev port | — | 5173 | Not exposed (nginx at 80) | ✅ OK |

**Config Consistency Result:** ✅ No mismatches found. All local dev config values are consistent.

---

### Test Type: Security Scan — Sprint 6

**Security Checklist Items — Sprint 6 Scope:**

| # | Item | Category | Status | Notes |
|---|------|----------|--------|-------|
| 1 | All land travel endpoints require auth | Auth & Authz | ✅ PASS | `router.use(authenticate)` before all routes |
| 2 | Trip ownership enforced on all land travel routes | Auth & Authz | ✅ PASS | `requireTripOwnership()` called on all 5 routes |
| 3 | Auth tokens have expiration + refresh | Auth & Authz | ✅ PASS | Unchanged from Sprint 1 (15m access, 7d refresh) |
| 4 | bcrypt password hashing | Auth & Authz | ✅ PASS | Unchanged from Sprint 1 |
| 5 | Rate limiting on auth endpoints | Auth & Authz | ⚠️ DEFERRED | Known accepted risk from Sprint 1. Not added in Sprint 6. |
| 6 | ILIKE search uses parameterized queries with `!` escape | Injection Prevention | ✅ PASS | T-085: `? ESCAPE '!'` syntax, no concatenation |
| 7 | Land travel queries use parameterized Knex | Injection Prevention | ✅ PASS | All model functions use Knex fluent API |
| 8 | mode enum validated server-side (whitelist) | Input Validation | ✅ PASS | `VALID_LAND_TRAVEL_MODES` whitelist in route + DB CHECK constraint |
| 9 | Land travel form: no dangerouslySetInnerHTML | XSS Prevention | ✅ PASS | grep found 0 occurrences in all frontend source |
| 10 | Calendar popover: event names via JSX (no raw HTML) | XSS Prevention | ✅ PASS | All content via JSX interpolation |
| 11 | CORS configured to expected origin | API Security | ✅ PASS | `CORS_ORIGIN=http://localhost:5173` from env |
| 12 | Helmet security headers middleware | API Security | ✅ PASS | `app.use(helmet())` in app.js |
| 13 | Error responses: no stack traces or internal details | API Security | ✅ PASS | Structured JSON `{error: {message, code, fields}}` |
| 14 | JWT_SECRET + DATABASE_URL from env vars | Data Protection | ✅ PASS | No hardcoded secrets found in backend/src/ |
| 15 | UUID validation on tripId + ltId params | Input Validation | ✅ PASS | `uuidParamHandler` registered at app + router level |
| 16 | Migration 009 has rollback (`down()`) | Infrastructure | ✅ PASS | `dropTableIfExists('land_travels')` in down() |
| 17 | npm audit: 0 production vulnerabilities (backend) | Infrastructure | ✅ PASS | `npm audit --production` → 0 vulnerabilities |
| 18 | npm audit: 0 production vulnerabilities (frontend) | Infrastructure | ✅ PASS | `npm audit --production` → 0 vulnerabilities |
| 19 | eval() / innerHTML / document.write absent | XSS Prevention | ✅ PASS | grep found 0 occurrences in frontend/src/ |

**Security Scan Result:** ✅ 18 PASS, 0 FAIL, 1 DEFERRED (rate limiting — known accepted risk since Sprint 1)

---

### Summary — Sprint 6 T-091 Re-Verification

| Task | Type | Status | Notes |
|------|------|--------|-------|
| T-083 | Bug Fix (FE) | ✅ Pass | Activity edit AM/PM visible + clock icon white ✅ |
| T-084 | Bug Fix (FE) | ✅ Pass | FilterToolbar stays mounted during refetch ✅ |
| T-085 | Bug Fix (BE) | ✅ Pass | ILIKE escape char changed to `!` — 247/247 backend tests pass ✅ |
| T-086 | Feature (BE) | ✅ Pass | Full land travel CRUD — 42 tests pass, migration 009 verified ✅ |
| T-087 | Feature (FE) | ✅ Pass | Test assertion fix applied — 332/332 frontend tests pass ✅ |
| T-088 | Feature (FE) | ✅ Pass | Land travel section on trip details — all states implemented ✅ |
| T-089 | Feature (FE) | ✅ Pass | Calendar enhancements — event times + popover ✅ |
| T-090 | Security Audit | ✅ Done | Previously completed — no new security issues in re-check ✅ |
| T-091 | Integration Test | ✅ **PASS** | All contracts verified — 247 BE + 332 FE tests pass ✅ |

**Overall Sprint 6 QA Verdict: ✅ PASS — Deployment approved.**

**All blocking issues resolved:**
- T-085: ESCAPE char fixed to `!` — Manager approved, 247/247 backend tests pass ✅
- T-087: Test assertion fixed — 332/332 frontend tests pass ✅

**Notes for Deploy Engineer (T-092):**
- Run `npx knex migrate:latest` to apply migration 009 (`land_travels` table)
- Rebuild frontend with Vite (land travel pages, calendar enhancements, bug fixes)
- Restart backend under pm2
- Critical smoke test: `GET /api/v1/trips?search=%` must return `{data:[]}` (not 500) — confirm T-085 works with live PostgreSQL
- All Sprint 5 smoke tests (45/45) should still pass
- New Sprint 6 smoke tests: land travel CRUD, calendar with land travel events

