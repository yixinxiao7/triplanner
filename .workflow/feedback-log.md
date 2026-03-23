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

## Sprint #34 User Agent Feedback — T-256 Production Walkthrough

*Tested on: 2026-03-23 against production at https://triplanner.yixinx.com (backend: https://triplanner-backend-sp61.onrender.com)*

---

### FB-156

| Field | Value |
|-------|-------|
| Feedback | Production health endpoint responds fast and correctly |
| Sprint | 34 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-256 |

**Steps:** `GET https://triplanner-backend-sp61.onrender.com/api/v1/health`

**Result:** Returns `{"status":"ok"}` with HTTP 200 in ~88ms. Excellent response time for a cold Render instance.

---

### FB-157

| Field | Value |
|-------|-------|
| Feedback | CORS headers correctly configured for production custom domain |
| Sprint | 34 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-256 |

**Steps:** `curl -I -H "Origin: https://triplanner.yixinx.com" https://triplanner-backend-sp61.onrender.com/api/v1/health`

**Result:** Response includes `Access-Control-Allow-Origin: https://triplanner.yixinx.com` and `Access-Control-Allow-Credentials: true`. Correctly scoped to the production domain.

---

### FB-158

| Field | Value |
|-------|-------|
| Feedback | Full auth flow works end-to-end on production (register, login, authenticated requests) |
| Sprint | 34 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-256 |

**Steps:** (1) POST /api/v1/auth/register with new user -> 201 with user data + access_token. (2) POST /api/v1/auth/login with same credentials -> 200 with access_token. (3) GET /api/v1/trips with token -> 200 with empty array. (4) Login with wrong password -> 401 "Incorrect email or password". (5) Duplicate registration -> 409 "An account with this email already exists".

**Result:** All auth flows return correct status codes and error messages. Token-based auth works correctly across subsequent requests.

---

### FB-159

| Field | Value |
|-------|-------|
| Feedback | Input validation is thorough and returns clear, field-specific error messages |
| Sprint | 34 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-256 |

**Steps:** Tested multiple validation scenarios: (1) Empty body to /register -> 400 with per-field errors (name, email, password all listed). (2) Trip name >255 chars -> 400 "name must be at most 255 characters". (3) end_date before start_date -> 400 "End date must be on or after start date". (4) Missing required fields on flights, stays, activities, land-travel -> 400 with field-specific messages.

**Result:** Every validation error returns HTTP 400 with `VALIDATION_ERROR` code and a `fields` object listing each invalid field. This is excellent for frontend form integration.

---

### FB-160

| Field | Value |
|-------|-------|
| Feedback | Full Trip CRUD lifecycle works on production — create, read, update status, add notes, delete |
| Sprint | 34 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-256 |

**Steps:** (1) POST /trips with name, destinations, dates -> 201 with trip data. (2) GET /trips -> 200 with trip in list. (3) PATCH /trips/:id with status:"ONGOING" -> 200, status persisted on re-GET. (4) PATCH /trips/:id with notes -> 200, notes persisted. (5) DELETE /trips/:id -> 204. (6) GET /trips/:id after delete -> 404 "Trip not found".

**Result:** Complete CRUD lifecycle works correctly. Status changes persist across requests. Deletion is clean with proper 204/404 responses.

---

### FB-161

| Field | Value |
|-------|-------|
| Feedback | All sub-resources (flights, stays, activities, land-travel) create successfully on production |
| Sprint | 34 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-256 |

**Steps:** Created a trip and added: (1) Multi-day flight LAX->NRT (Apr 1 departure, Apr 2 arrival) -> 201. (2) Hotel stay with check-in/check-out and timezone -> 201. (3) Activity with date and time range -> 201. (4) Land travel (TRAIN) with departure/arrival -> 201.

**Result:** All four sub-resource types created successfully with correct data returned. Timezone fields properly stored.

---

### FB-162

| Field | Value |
|-------|-------|
| Feedback | Calendar endpoint correctly shows multi-day flight spanning two dates (T-264 fix verified on production) |
| Sprint | 34 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-256, T-264 |

**Steps:** Created a flight departing 2026-04-01T10:00:00Z arriving 2026-04-02T14:00:00Z. Called GET /trips/:id/calendar.

**Result:** Calendar response shows FLIGHT event with `start_date: "2026-04-01"` and `end_date: "2026-04-02"` — correctly spanning two days. The Sprint 33 multi-day calendar fix (T-264) is confirmed working on production. STAY also spans correctly (Apr 3-6). LAND_TRAVEL (same-day) correctly shows matching start/end dates. ACTIVITY shows single-day event.

---

### FB-163

| Field | Value |
|-------|-------|
| Feedback | XSS payload stored in trip name without server-side sanitization |
| Sprint | 34 |
| Category | Security |
| Severity | Minor |
| Status | Acknowledged |
| Related Task | T-256 |

**Steps:** POST /api/v1/trips with name `<script>alert(1)</script>` -> 201, stored as-is in database.

**Result:** The backend stores raw HTML/script tags in trip names without sanitization. React's JSX auto-escaping prevents execution on the frontend (renders as text), so this is not exploitable in the current stack. However, if data is ever consumed by a non-React client (email templates, PDF exports, admin dashboard), stored XSS could execute. Recommend adding server-side input sanitization as defense-in-depth.

---

### FB-164

| Field | Value |
|-------|-------|
| Feedback | Cloudflare WAF blocks SQL injection payloads before they reach the backend |
| Sprint | 34 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-256 |

**Steps:** POST /api/v1/trips with name containing `"); DROP TABLE trips;--`

**Result:** Cloudflare returned HTTP 403 "You have been blocked" before the request reached the backend. This provides an extra layer of defense. Note: the backend likely also uses parameterized queries, but the WAF caught it first.

---

### FB-165

| Field | Value |
|-------|-------|
| Feedback | Unicode and emoji characters handled correctly in trip names |
| Sprint | 34 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-256 |

**Steps:** POST /api/v1/trips with name `東京旅行 🗼 — Tōkyō & Beyond` -> 201

**Result:** Japanese characters, emoji, macron-accented Latin characters, and em-dash all stored and returned correctly. Good internationalization support.

---

### FB-166

| Field | Value |
|-------|-------|
| Feedback | Auth and access control properly enforce authentication |
| Sprint | 34 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-256 |

**Steps:** (1) GET /api/v1/trips with no auth header -> 401 "Authentication required". (2) GET /api/v1/trips with invalid token "Bearer invalid_token_here" -> 401 "Invalid or expired token".

**Result:** Both missing and invalid tokens return appropriate 401 responses with clear error messages. No data leakage in error responses.

---

### FB-167

| Field | Value |
|-------|-------|
| Feedback | API response times are excellent on production |
| Sprint | 34 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-256 |

**Steps:** Measured response times: Health endpoint ~88ms, authenticated trips list ~108ms, trip creation ~200ms, sub-resource creation ~200ms each.

**Result:** All API responses under 250ms on production (Render). No performance concerns for the current feature set.

---

### FB-168

| Field | Value |
|-------|-------|
| Feedback | Frontend build is present and properly code-split |
| Sprint | 34 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-256 |

**Steps:** Checked frontend/dist/ directory. Verified build artifacts.

**Result:** Build output includes main bundle (~297KB JS, ~59KB CSS) plus lazy-loaded page chunks for FlightsEditPage, StaysEditPage, ActivitiesEditPage, and LandTravelEditPage. Code splitting is properly configured for route-based lazy loading.

---

### FB-169

| Field | Value |
|-------|-------|
| Feedback | TripCalendar component correctly implements multi-day spanning for all event types |
| Sprint | 34 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-256, T-264 |

**Steps:** Code review of TripCalendar.jsx — `buildEventsMap()` function and `renderEventPill()` function.

**Result:** Multi-day spanning correctly implemented for FLIGHT, STAY, and LAND_TRAVEL. Events enumerate dates from start to end, with proper `_dayType` metadata (start/middle/end/single). Pills render with connected border-radius styling. Middle days show 0.8 opacity. End days show "Arrives {time}" for flights and "Arrives/Drop-off {time}" for land travel. Mobile view also handles multi-day events with cont./arrives labels. Loading, error, and empty states all implemented. Keyboard navigation with arrow keys across the grid. Good accessibility with aria-labels.

---

### FB-170

| Field | Value |
|-------|-------|
| Feedback | Frontend SPA shell loads on production but content requires JavaScript rendering |
| Sprint | 34 |
| Category | Suggestion |
| Severity | Suggestion |
| Status | Acknowledged |
| Related Task | T-256 |

**Steps:** Fetched https://triplanner.yixinx.com via curl/WebFetch — only the text "triplanner" is visible without JavaScript execution.

**Result:** Expected behavior for a React SPA. The HTML shell loads and Vite assets are referenced. Full content renders client-side. This is acceptable but means zero SEO value and users with JS disabled see nothing. Not a priority for a productivity tool, but SSR could be considered in the future for landing/marketing pages.

---
