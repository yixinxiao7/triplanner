# Feedback Log

Structured feedback from the User Agent and Monitor Agent after each test cycle. Triaged by the Manager Agent.

---

## Log Fields

| Field | Description |
|-------|-------------|
| Feedback | Short description of the observation |
| Sprint | Sprint number |
| Category | Bug, UX Issue, Feature Gap, Positive, Performance, Security, Monitor Alert |
| Severity | Critical, Major, Minor, Suggestion |
| Status | New, Acknowledged, Tasked, Resolved, Won't Fix |
| Details | Full description of the issue or observation |
| Related Task | Task ID from dev-cycle-tracker.md (if applicable) |

---


---

## Monitor Alert — Sprint #26 — 2026-03-11T14:20:00Z

| Field | Value |
|-------|-------|
| **Category** | Monitor Alert |
| **Severity** | Major |
| **Sprint** | 26 |
| **Status** | Tasked |
| **Related Task** | T-228 |
| **Tasked As** | T-228 (Sprint 27 — primary CORS fix: ecosystem.config.cjs + ESM dotenv refactor) |

**Feedback:** Staging CORS runtime mismatch — backend serves wrong `Access-Control-Allow-Origin` header; all browser-initiated API calls from staging frontend will be CORS-blocked.

**Details:**

The staging backend (`https://localhost:3001`) is serving `Access-Control-Allow-Origin: http://localhost:5173` instead of the expected `https://localhost:4173`. This causes all browser-initiated API calls from the staging frontend (`https://localhost:4173`) to be rejected by browser CORS policy.

**Root Cause:** ESM module hoisting in `backend/src/index.js`.

In ESM, `import` statements are statically hoisted and resolved before the module body executes. `import app from './app.js'` is evaluated first — before the subsequent `dotenv.config({ path: '.env.staging' })` call. When `app.js` executes `cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' })`, `process.env.CORS_ORIGIN` is still `undefined` (dotenv hasn't run yet). The cors middleware captures `'http://localhost:5173'` as its fixed origin.

`PORT=3001` is unaffected because it lives in the pm2 `ecosystem.config.cjs` env block (set by pm2 before node launches). `CORS_ORIGIN` is not in that block — it is only in `.env.staging`.

**Confirmed via live header check:**
```
$ curl -sk -I https://localhost:3001/api/v1/health -H "Origin: https://localhost:4173"
Access-Control-Allow-Origin: http://localhost:5173   ← wrong
```

**Impact:**
- All browser-initiated API calls from staging frontend (`https://localhost:4173`) will be CORS-blocked
- Login, trip creation, and all authenticated flows will fail in the browser on staging
- Direct curl and Playwright tests are unaffected (no browser CORS enforcement)
- Deploy Verified = **No** for Sprint 26 staging

**Required Fix (Option A — fastest, no code change):**
Add `CORS_ORIGIN: 'https://localhost:4173'` to the `triplanner-backend` env block in `infra/ecosystem.config.cjs`:
```js
env: {
  NODE_ENV: 'staging',
  PORT: 3001,
  CORS_ORIGIN: 'https://localhost:4173',  // ← add this
},
```
Then: `pm2 restart triplanner-backend`
Then: re-run health check to confirm `Access-Control-Allow-Origin: https://localhost:4173`

**Required Fix (Option B — code fix for long-term robustness):**
Refactor `backend/src/index.js` to load dotenv before importing `app.js` (requires dynamic import since ESM hoists static imports).

**Secondary Issue (Minor):**
`backend/src/config/knexfile.js` `staging` environment block is missing `seeds: { directory: seedsDir }`. Running `NODE_ENV=staging npm run seed` fails with ENOENT. Workaround: run `NODE_ENV=development npm run seed`. Should be fixed for reliability.

**Files involved:**
- `infra/ecosystem.config.cjs` — missing `CORS_ORIGIN` in backend env block (primary fix)
- `backend/src/index.js` — ESM dotenv hoisting root cause (secondary fix for robustness)
- `backend/src/config/knexfile.js` — missing seeds config in staging block (minor fix)

---

## Monitor Alert — Sprint #22 — 2026-03-10T21:25:00Z

| Field | Value |
|-------|-------|
| **Category** | Monitor Alert |
| **Severity** | Critical |
| **Sprint** | 22 |
| **Status** | Resolved |
| **Related Task** | T-200 |

**Feedback:** Staging Vite proxy ECONNREFUSED — browser-based API calls fail; 3/4 Playwright E2E tests fail.

**Details:**

The `triplanner-frontend` pm2 process runs `npm run preview` without the environment variables required for staging (`BACKEND_PORT=3001`, `BACKEND_SSL=true`). Vite's dev proxy defaults to `http://localhost:3000`. The staging backend runs on `https://localhost:3001`. Every browser-initiated API call (register, login, trips, etc.) results in:

```
[vite] http proxy error: /api/v1/auth/register — AggregateError [ECONNREFUSED]
[vite] http proxy error: /api/v1/auth/refresh — AggregateError [ECONNREFUSED]
```

**Impact:**
- All 3 user-flow Playwright tests fail (Tests 1, 2, 3 — register → redirect to "/" timeout)
- User Agent (T-201) CANNOT proceed — staging is not usable for browser testing
- Direct API calls (curl) work correctly; only browser flows are broken

**Required Fix:**
1. Update `infra/ecosystem.config.cjs` to include the `triplanner-frontend` app with:
   ```
   env: { BACKEND_PORT: '3001', BACKEND_SSL: 'true' }
   ```
   OR add `preview.proxy` to `frontend/vite.config.js` for the staging environment.
2. Restart pm2 frontend process with the corrected env.
3. Rerun `npx playwright test` — expect 4/4 PASS.

**Files involved:**
- `infra/ecosystem.config.cjs` — missing frontend app definition (primary fix)
- `frontend/vite.config.js` — `preview.proxy` not configured (alternative fix)

---

### FB-112 — Production hosting decision lost — re-submit from Sprint 17

| Field | Value |
|-------|-------|
| Feedback | Production hosting decision (Render + AWS RDS) was made in Sprint 17 (FB-109, FB-110, FB-111) but never triaged into sprint tasks; B-022 incorrectly blocked for 8 sprints |
| Sprint | 25 |
| Category | Feature Gap |
| Severity | Critical |
| Status | Tasked |
| Related Task | B-022 |
| Tasked As | T-220, T-221, T-222, T-223, T-224, T-225 (Sprint 26) |

**Description:** The project owner made a clear production hosting decision during Sprint 17, recorded as FB-109, FB-110, and FB-111 in the feedback log (now archived to `feedback-log-before-sprint-18.md`). The Manager Agent failed to triage these entries into actionable T-xxx tasks during the Sprint 17→18 closeout. Once the feedback log was archived, the decision was lost, and every subsequent sprint has incorrectly listed B-022 as "pending project owner decision."

**The decision (re-stated):**

- **Frontend:** Render free tier — static site, region: Ohio
- **Backend:** Render free tier — web service, runtime: node, region: Ohio
- **Database:** AWS RDS free tier — us-east-1 (N. Virginia), engine: PostgreSQL 15+, instance class: db.t3.micro

**Three critical implementation requirements:**

1. **Knexfile production config (from FB-109):** Add SSL configuration and free-tier connection pool sizing for AWS RDS to `backend/knexfile.js`. AWS RDS requires `ssl: { rejectUnauthorized: false }` (or proper CA cert). Free-tier pool size should be conservative (max 5 connections for db.t3.micro).

2. **Cookie SameSite fix (from FB-110):** Set cookie `SameSite` to `none` and `Secure` to `true` in production. On Render free tier, frontend and backend will be on different subdomains (e.g., `triplanner-frontend.onrender.com` and `triplanner-backend.onrender.com`), making this a cross-origin deployment. Without `SameSite=none`, refresh token cookies will not be sent, and auth will be completely broken.

3. **render.yaml blueprint + deploy guide (from FB-111):** Create `render.yaml` infrastructure-as-code file defining both services (frontend static site + backend web service, both Ohio region, free plan). Create a production deploy guide covering: Render service setup, AWS RDS instance creation, environment variable configuration, database migration, DNS/domain setup, and post-deploy verification checklist.

**Manager Triage (Sprint 25 → Sprint 26):** Tasks T-220 through T-225 created. B-022 is no longer listed as "pending project owner decision" — it is blocked on engineering work (T-220/T-221/T-222) that must complete before T-224 (production deploy) can run.

---

## Monitor Alert — Sprint #25 — 2026-03-10T23:10:00Z

| Field | Value |
|-------|-------|
| **Category** | Monitor Alert |
| **Severity** | Major |
| **Sprint** | 25 |
| **Status** | Tasked |
| **Related Task** | T-216 |
| **Tasked As** | T-218 (immediate Playwright rerun), T-226 (engineering fix — Sprint 26) |

**Feedback:** Playwright E2E Tests 1/4 PASS — Registration rate limiter exhausted during health check; browser-based user flows blocked.

**Details:**

During the T-216 Sprint 25 health check, all API endpoint checks, config consistency checks, and regression checks passed. However, `npx playwright test` produced **1/4 PASS** (Tests 1, 2, 3 FAIL; Test 4 PASS).

**Failure mode:** All three failing tests call `registerNewUser()` and wait for `page.waitForURL('/')` after submitting the registration form. The Playwright error-context snapshot shows the register page displays:

```
alert: "too many registration attempts. please try again in 56 minutes."
button: "please wait…" [disabled]
```

**Root cause:** The Monitor Agent's health check included a `POST /api/v1/auth/register` curl call to obtain a Bearer token for testing protected endpoints. This consumed rate limit quota for the `localhost` IP. When Playwright subsequently attempted browser-based registration (3 tests × register attempt = 3 registration requests), the rate limiter blocked all of them with HTTP 429.

**Confirmed NOT a regression:**
- Vite proxy correctly routes to `https://localhost:3001` (BACKEND_PORT=3001, BACKEND_SSL=true confirmed in ecosystem.config.cjs and in running process env)
- No ECONNREFUSED errors appeared in frontend pm2 logs during the Playwright run
- Direct API registration via curl succeeds (HTTP 201)
- Test 4 (rate limit lockout) passes, confirming the application correctly enforces limits

**Structural issue:** The Monitor Agent health check protocol (register a user via curl to obtain a token for API testing) consumes rate limit quota before Playwright runs. If Playwright is run immediately after, the combined registration count hits the rate limit window.

**Recommended fixes (in priority order):**
1. **Immediate (unblock T-217):** Deploy Engineer restart backend (`pm2 restart triplanner-backend`) to clear in-memory rate limit state → re-run `npx playwright test` → expect 4/4 PASS.
2. **Process fix:** Monitor Agent should use `POST /api/v1/auth/login` (with an existing test account) rather than `POST /api/v1/auth/register` to obtain a Bearer token during health checks.
3. **Engineering fix (future sprint):** Add a higher rate limit (or whitelist) for `127.0.0.1`/`::1` when `NODE_ENV=staging`, or use a persistent seeded test user for E2E/monitor testing.

**Files involved:**
- `infra/ecosystem.config.cjs` — rate limit state held in pm2 process memory; restart clears it
- Backend rate limiter middleware (registration endpoint)

**Action required:** Deploy Engineer to restart `triplanner-backend` (`pm2 restart triplanner-backend`) and re-run `npx playwright test` before handing off to User Agent (T-217).

---


### FB-112 — Production hosting decision lost — re-submit from Sprint 17 (DUPLICATE — see first entry above)

| Field | Value |
|-------|-------|
| Feedback | Duplicate of FB-112 above — Production hosting decision (Render + AWS RDS) |
| Sprint | 25 |
| Category | Feature Gap |
| Severity | Critical |
| Status | Tasked |
| Related Task | B-022 |
| Tasked As | T-220, T-221, T-222, T-223, T-224, T-225 (Sprint 26) — see primary FB-112 entry above |

**Manager Triage:** Duplicate entry. Dispositioned identically to primary FB-112 entry above. Tasks T-220–T-225 created for Sprint 26.

---

---

## Sprint 32 User Agent Feedback — T-262 Staging Walkthrough

**Date:** 2026-03-20
**Sprint:** 32
**Task:** T-262
**Tested by:** User Agent
**Environment:** Staging (backend HTTPS localhost:3001, frontend HTTPS localhost:4173)

---

### FB-136 — Stay Category Case Normalization (T-258) — All Variants Verified

| Field | Value |
|-------|-------|
| Feedback | Stay category case normalization works correctly for all input variants |
| Sprint | 32 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-258 |

**Steps performed:**
1. `POST /api/v1/trips/:id/stays` with `category: "hotel"` (lowercase) → 201, stored as `"HOTEL"` ✅
2. `POST /api/v1/trips/:id/stays` with `category: "airbnb"` (lowercase) → 201, stored as `"AIRBNB"` ✅
3. `POST /api/v1/trips/:id/stays` with `category: "Vrbo"` (mixed case) → 201, stored as `"VRBO"` ✅
4. `POST /api/v1/trips/:id/stays` with `category: "motel"` (invalid) → 400 `VALIDATION_ERROR` with message "Category must be one of: HOTEL, AIRBNB, VRBO" ✅
5. `PATCH /api/v1/trips/:id/stays/:sid` with `category: "vrbo"` (lowercase) → 200, stored as `"VRBO"` ✅
6. Empty category `""` → 400 `VALIDATION_ERROR` "Category is required" ✅

All T-258 acceptance criteria met. Backwards-compatible — uppercase inputs still work.

---

### FB-137 — API Documentation Updates (T-257) — Both Notes Present

| Field | Value |
|-------|-------|
| Feedback | Calendar endpoint response shape note and curl --http1.1 workaround both present in api-contracts.md |
| Sprint | 32 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-257 |

**Verified:**
1. Calendar endpoint note: `api-contracts.md` contains wrapped object documentation explaining `{ data: { trip_id, events: [] } }` shape and why it differs from other list endpoints. ✅
2. curl HTTPS note: `api-contracts.md` contains `--http1.1` workaround with example. ✅
3. Both notes are clear, accurate, and well-placed in the Sprint 32 section.

---

### FB-138 — Trip Status Persistence — Confirmed Working

| Field | Value |
|-------|-------|
| Feedback | PATCH trip status PLANNING → ONGOING persists correctly on re-GET |
| Sprint | 32 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | Sprint 31 regression check |

**Steps:** Created trip (status: PLANNING), PATCH to ONGOING → 200. GET trip → status: "ONGOING". No regressions from Sprint 31 fix.

---

### FB-139 — Calendar View — All Four Event Types Present

| Field | Value |
|-------|-------|
| Feedback | TripCalendar returns all four event types (FLIGHT, STAY, ACTIVITY, LAND_TRAVEL) on correct dates |
| Sprint | 32 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | Sprint 31 regression check |

**Steps:** Created trip with flight (LAX→NRT), 3 stays, 1 activity, 1 land travel (TRAIN). `GET /calendar` returned 6 events with all 4 types present: `['ACTIVITY', 'FLIGHT', 'LAND_TRAVEL', 'STAY']`. Calendar response correctly uses wrapped object `{ data: { trip_id, events } }` as documented.

---

### FB-140 — Input Validation and Auth Security — Comprehensive Pass

| Field | Value |
|-------|-------|
| Feedback | All edge cases handled correctly: empty inputs, SQL injection, invalid tokens, long strings, wrong types |
| Sprint | 32 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | Sprint 32 regression check |

**Tests performed and results:**
- Empty category → 400 "Category is required" ✅
- SQL injection in category (`HOTEL'; DROP TABLE stays; --`) → 400 `VALIDATION_ERROR` ✅
- No auth token → 401 "Authentication required" ✅
- Invalid auth token → 401 "Invalid or expired token" ✅
- Trip name >255 chars → 400 validation error ✅
- XSS in trip name (`<script>alert(1)</script>`) → handled (accepted as string, no execution) ✅
- Missing required fields → 400 with specific field errors ✅
- Number where string expected → 400 "name must be a string" ✅

---

### FB-141 — Full Test Suites Pass — No Regressions

| Field | Value |
|-------|-------|
| Feedback | All automated test suites pass with zero failures |
| Sprint | 32 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-262 |

**Results:**
- Backend (vitest): 410/410 ✅
- Frontend (vitest): 496/496 ✅
- Playwright E2E: 4/4 ✅
- Total: 910 tests, 0 failures

---

### FB-142 — CORS Headers Correct

| Field | Value |
|-------|-------|
| Feedback | CORS headers correctly set for staging frontend origin |
| Sprint | 32 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | Sprint 32 regression check |

**Verified:** `Access-Control-Allow-Origin: https://localhost:4173` and `Access-Control-Allow-Credentials: true` returned on health endpoint with Origin header.

---

### FB-143 — Trip CRUD Full Lifecycle — Clean

| Field | Value |
|-------|-------|
| Feedback | Complete trip lifecycle works: create → add sub-resources → status change → calendar → delete |
| Sprint | 32 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-262 |

**Steps:** Login → Create trip with destinations and notes → Add flight, 3 stays (with T-258 lowercase categories), activity, land travel → PATCH status to ONGOING → Verify status persisted → View calendar (6 events, 4 types) → Delete trip → Verify 404 on re-GET → Logout → Verify 204.

Full end-to-end user flow works cleanly on staging.

---
