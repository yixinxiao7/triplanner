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

## Sprint 33 User Agent Feedback — T-268 Staging Walkthrough

**Date:** 2026-03-20
**Tester:** User Agent
**Environment:** Staging — `https://localhost:4173` (frontend), `https://localhost:3001` (backend)
**Scope:** Multi-day FLIGHT + LAND_TRAVEL calendar spanning (T-264/FB-133/FB-134), Sprint 32 regressions, edge cases

---

### FB-144

| Field | Value |
|-------|-------|
| Feedback | Multi-day FLIGHT event correctly spans from departure date to arrival date on calendar |
| Sprint | 33 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-264 (FB-134) |

**Steps:** Register → Create trip (Tokyo, Osaka; Aug 1–10) → POST flight NH101 LAX→NRT departing Aug 1 23:00 UTC, arriving Aug 3 04:30 UTC → GET /calendar → Verify FLIGHT event has `start_date: "2026-08-01"`, `end_date: "2026-08-03"`.

**Result:** Calendar API returns correct multi-day span. Frontend `buildEventsMap()` correctly enumerates dates Aug 1, 2, 3 with `_dayType: start/middle/end`. The arrival day pill displays "Arrives 1:30p". Unit test "multi-day FLIGHT event spanning 2 days renders on both days" passes.

---

### FB-145

| Field | Value |
|-------|-------|
| Feedback | Multi-day LAND_TRAVEL event correctly spans from departure date to arrival date on calendar |
| Sprint | 33 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-264 (FB-133) |

**Steps:** POST land travel RENTAL_CAR Tokyo→Osaka, departure_date Aug 7, arrival_date Aug 9 → GET /calendar → Verify LAND_TRAVEL event has `start_date: "2026-08-07"`, `end_date: "2026-08-09"`.

**Result:** Calendar API returns 3-day span. Frontend correctly renders on Aug 7 (start: "Rental Car 10a"), Aug 8 (middle: reduced opacity), Aug 9 (end: "Drop-off 2:30p"). The "Drop-off" label is correctly used for RENTAL_CAR mode (vs. "Arrives" for other modes). Unit test "multi-day LAND_TRAVEL event spanning 3 days renders on all 3 days" passes.

---

### FB-146

| Field | Value |
|-------|-------|
| Feedback | Single-day FLIGHT renders correctly without regression |
| Sprint | 33 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-264 |

**Steps:** POST single-day flight NRT→KIX, departure and arrival both on Aug 5 → GET /calendar → Verify `start_date === end_date === "2026-08-05"`.

**Result:** Single-day flight correctly maps to one calendar cell with `_dayType: "single"`. No "Arrives" label on single-day events. Unit test "single-day FLIGHT renders as a single chip without Arrives text" passes.

---

### FB-147

| Field | Value |
|-------|-------|
| Feedback | Single-day LAND_TRAVEL renders correctly without regression |
| Sprint | 33 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-264 |

**Steps:** POST single-day TRAIN Osaka→Kansai Airport, departure and arrival both on Aug 10 → GET /calendar → Verify `start_date === end_date === "2026-08-10"`.

**Result:** Single-day land travel renders as a single pill with departure/arrival time range. No spanning behavior. Correct.

---

### FB-148

| Field | Value |
|-------|-------|
| Feedback | All 4 event types present in calendar with correct data — no regressions from Sprint 32 |
| Sprint | 33 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-264 |

**Steps:** GET /calendar for trip with 3 flights (multi-day, single-day, SQL-injection test), 1 stay, 1 activity, 2 land travel entries → Verify all 4 types (FLIGHT, STAY, ACTIVITY, LAND_TRAVEL) present in response.

**Result:** All event types render correctly. Calendar returns 7 events total across 4 types. No data corruption.

---

### FB-149

| Field | Value |
|-------|-------|
| Feedback | Sprint 32 regression: Stay category normalization still works (lowercase → uppercase) |
| Sprint | 33 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-258 |

**Steps:** POST stay with `"category": "airbnb"` (lowercase) → Verify response returns `"category": "AIRBNB"` (normalized uppercase). HTTP 201.

**Result:** Category normalization from Sprint 32 (T-258) working correctly. No regression.

---

### FB-150

| Field | Value |
|-------|-------|
| Feedback | Sprint 32 regression: Trip status persistence works correctly |
| Sprint | 33 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-264 |

**Steps:** PATCH trip status from PLANNING → ONGOING → GET trip → Verify status is "ONGOING" with updated `updated_at` timestamp.

**Result:** Status persisted correctly on re-fetch.

---

### FB-151

| Field | Value |
|-------|-------|
| Feedback | Input validation handles empty request bodies gracefully with 400 errors |
| Sprint | 33 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-264 |

**Steps:** POST empty `{}` body to /flights and /land-travel endpoints → Verify 400 VALIDATION_ERROR with specific field messages.

**Result:** Both endpoints return clear, structured 400 errors listing every missing required field. Good developer experience.

---

### FB-152

| Field | Value |
|-------|-------|
| Feedback | Auth and UUID validation prevent unauthorized/invalid access correctly |
| Sprint | 33 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-264 |

**Steps:** GET /calendar without auth token → 401. GET /trips/not-a-uuid/calendar with auth → 400 VALIDATION_ERROR "Invalid ID format".

**Result:** Both return correct error codes and messages. No information leakage.

---

### FB-153

| Field | Value |
|-------|-------|
| Feedback | All 501 frontend tests pass (496 baseline + 5 new T-264 tests) |
| Sprint | 33 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-264 |

**Steps:** `npx vitest run` → 25 test files, 501 tests passed.

**Result:** Zero failures. New T-264 tests cover: multi-day FLIGHT spanning 2 days, multi-day LAND_TRAVEL spanning 3 days, FLIGHT arrival text on arrival day, single-day FLIGHT without "Arrives" text, single-day LAND_TRAVEL with null end_date. All pass.

---

### FB-154

| Field | Value |
|-------|-------|
| Feedback | Trip deletion works cleanly with proper 204/404 lifecycle |
| Sprint | 33 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-264 |

**Steps:** DELETE /trips/:id → 204 No Content → GET /trips/:id → 404 "Trip not found".

**Result:** Clean lifecycle. Deletion confirmed.

---

### FB-155

| Field | Value |
|-------|-------|
| Feedback | Mobile view correctly handles multi-day FLIGHT and LAND_TRAVEL events |
| Sprint | 33 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-264 |

**Steps:** Code review of `MobileDayList` component in TripCalendar.jsx — lines 165-303.

**Result:** Mobile list correctly enumerates multi-day spans for FLIGHT and LAND_TRAVEL (same as STAY). Start day shows departure time, middle days show "(cont.)" with 0.6 opacity, end day shows "Arrives {time}" (or "Drop-off {time}" for RENTAL_CAR). Proper aria-labels on all rows.

---
