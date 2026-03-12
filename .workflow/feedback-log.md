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

## Sprint 27 User Agent Feedback — T-219 — 2026-03-11

*Tested by: User Agent | Environment: Staging (https://localhost:3001) | Date: 2026-03-11*

---

### FB-113 — Trip start_date/end_date user-set values are silently ignored by the backend

| Field | Value |
|-------|-------|
| Feedback | PATCH /api/v1/trips/:id with start_date/end_date always returns computed dates from sub-resources; user values are permanently lost |
| Sprint | 27 |
| Category | Bug |
| Severity | Major |
| Status | Tasked |
| Tasked As | T-229 (Sprint 28 — fix tripModel.js COALESCE for user-provided start_date/end_date) |

**Steps to reproduce:**
1. Create a trip with no flights, stays, or activities
2. PATCH the trip: `{"start_date":"2026-09-01","end_date":"2026-09-30"}`
3. Observe: response shows `start_date: null, end_date: null` — user values discarded
4. Add a flight (departure: 2026-08-01) and a stay (check-out: 2026-08-08)
5. PATCH the trip again: `{"start_date":"2026-07-01","end_date":"2026-09-30"}` (wider range)
6. Observe: response shows `start_date: "2026-08-01", end_date: "2026-08-08"` — user values overridden

**Expected:** The PATCH should save the user-provided dates, which the frontend "Set dates" UI passes directly.

**Actual:** `tripModel.js` always computes `start_date`/`end_date` via SQL `LEAST()/GREATEST()` subqueries across flights/stays/activities/land_travels. The DB columns (added in migration 007 — `20260225_007_add_trip_date_range.js`) do receive the written values via `db('trips').update({...})`, but the `TRIP_COLUMNS` SELECT never reads them back — it always returns the computed minimum/maximum dates. The stored values are therefore permanently invisible to the frontend.

**Impact:** The "Set dates" UI in TripDetailsPage (`dateMode = 'edit'`) is non-functional. Users see the UI, enter dates, click Save, and receive a 200 response — but their dates are never reflected. The only way dates appear is if sub-resources (flights/stays/activities) exist.

**Code locations:**
- `backend/src/models/tripModel.js` — `TRIP_COLUMNS` selection (lines using `db.raw(... LEAST(...) AS start_date ...))`)
- `backend/src/migrations/20260225_007_add_trip_date_range.js` — the stored columns exist but are bypassed
- `frontend/src/pages/TripDetailsPage.jsx` — `handleSaveDates()` calls `api.trips.update(tripId, { start_date, end_date })`

**Suggested fix:** Change the `TRIP_COLUMNS` SQL to use `COALESCE(trips.start_date, <computed MIN>)` so the user-stored value takes precedence over the computed value, or remove the date editor UI if dates are intended to always be auto-computed only.

---

### FB-114 — TripCalendar component fully implemented — Sprint 25 scope delivered

| Field | Value |
|-------|-------|
| Feedback | TripCalendar renders on TripDetailsPage with correct events, navigation, color-coding, accessibility, and click-to-scroll |
| Sprint | 27 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |

**What was verified:**
- `GET /api/v1/trips/:id/calendar` returns `{ trip_id, events: [] }` for an empty trip — empty state message shown ✅
- Calendar events with type `FLIGHT`, `STAY`, `ACTIVITY` all appear via API with correct fields (`title`, `type`, `start_date`, `end_date`, `start_time`, `end_time`) ✅
- Stay events span multiple days in the `buildEventsMap` helper (start/middle/end pill shape logic) ✅
- Prev/Next month buttons implemented; `aria-live="polite"` on month heading for screen reader announcements ✅
- Event pills are clickable and scroll to the corresponding section (`flights-section`, `stays-section`, `activities-section`) ✅
- Loading skeleton (shimmer grid) and error state with "Try again" retry button both present ✅
- Mobile day-list view (`MobileDayList`) implemented as a responsive fallback ✅
- `TripCalendar` is a self-contained component placed at the top of `TripDetailsPage` above sections — replaces the old "calendar coming in sprint 2" placeholder ✅
- Accessibility: `role="region"` + `aria-label="Trip calendar"`, `role="grid"` on grid, `role="gridcell"` on each day, arrow-key navigation within the grid ✅

---

### FB-115 — T-228 CORS staging fix verified and working

| Field | Value |
|-------|-------|
| Feedback | Both Fix A (pm2 env) and Fix B (ESM dynamic import) are live; staging CORS header is correct |
| Sprint | 27 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |

**Verified:**
- `curl -sk -D - https://localhost:3001/api/v1/health -H "Origin: https://localhost:4173"` → `Access-Control-Allow-Origin: https://localhost:4173` ✅
- `infra/ecosystem.config.cjs` contains `CORS_ORIGIN: 'https://localhost:4173'` in the pm2 env block (Fix A) ✅
- `backend/src/index.js` uses `const { default: app } = await import('./app.js')` after dotenv loads (Fix B) ✅
- Browser-based API calls from `https://localhost:4173` will succeed — User Agent testing unblocked ✅

---

### FB-116 — Print button present on TripDetailsPage

| Field | Value |
|-------|-------|
| Feedback | Print button is visible and functional in the trip name row; `print.css` is imported |
| Sprint | 27 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |

**Verified:**
- `TripDetailsPage.jsx` has a `<button className={styles.printBtn} onClick={() => window.print()}>Print itinerary</button>` with a printer SVG icon ✅
- `print.css` is imported at the top of `TripDetailsPage.jsx` ✅
- Button is in the header row alongside `TripStatusSelector` ✅

---

### FB-117 — StatusFilterTabs pill filter works correctly at API level

| Field | Value |
|-------|-------|
| Feedback | `?status=PLANNING/ONGOING/COMPLETED` filters return correct results; `?status=COMPLETED` with 0 matches returns empty data array (not error) |
| Sprint | 27 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |

**Verified:**
- `GET /api/v1/trips?status=PLANNING` → returned the 1 PLANNING trip ✅
- `GET /api/v1/trips?status=ONGOING` → returned empty array (0 results) ✅
- `GET /api/v1/trips?status=COMPLETED` → `{"data":[],"pagination":{"total":0}}` — clean empty state ✅
- `StatusFilterTabs.jsx` component implements all 4 pills (ALL/PLANNING/ONGOING/COMPLETED) with roving tabindex, `aria-pressed`, and ArrowLeft/Right keyboard navigation ✅

---

### FB-118 — Trip notes save and clear correctly

| Field | Value |
|-------|-------|
| Feedback | PATCH notes saves text, clear with empty string returns null, unauthorized PATCH returns 401 |
| Sprint | 27 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |

**Verified:**
- `PATCH {"notes":"..."}` → notes saved, returned in response ✅
- `PATCH {"notes":""}` → notes cleared to `null` ✅
- `PATCH` without auth token → `401 Authentication required` ✅

---

### FB-119 — Destination validation returns human-friendly 400 error (not raw stack trace)

| Field | Value |
|-------|-------|
| Feedback | Submitting a 101-character destination returns `400 {"error":{"message":"Validation failed","code":"VALIDATION_ERROR","fields":{"destinations":"Each destination must be at most 100 characters"}}}` |
| Sprint | 27 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |

**Verified:**
- 101-char destination → `400 VALIDATION_ERROR` with human-readable `fields.destinations` message ✅
- Empty name + empty destinations → `400` with both field errors listed ✅
- No raw stack traces or 500 errors exposed ✅

---

### FB-120 — Rate limiting locks out login after 10 attempts

| Field | Value |
|-------|-------|
| Feedback | Login endpoint rate-limits after 10 requests in the window; attempt 11 returns `{"error":{"code":"RATE_LIMITED","message":"Too many login attempts, please try again later."}}` |
| Sprint | 27 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |

**Verified:** 10 sequential login attempts returned OK (status 200), attempt 11 returned `RATE_LIMITED` (429). Spec required lockout after 10 attempts ✅

**Note:** Rate limiter counts ALL login requests (successful + failed), not only failed attempts. A legitimate user logging in/out 10+ times in the rate-limit window would be locked out. This may be intentional, but worth reviewing if users report unexpected lockouts in production.

---

### FB-121 — Stay category field is case-sensitive (requires uppercase enum)

| Field | Value |
|-------|-------|
| Feedback | `POST /api/v1/trips/:id/stays` with `{"category":"hotel"}` (lowercase) returns 400 validation error; must be `"HOTEL"`, `"AIRBNB"`, or `"VRBO"` |
| Sprint | 27 |
| Category | UX Issue |
| Severity | Minor |
| Status | Acknowledged |

**Steps to reproduce:**
1. POST to `/api/v1/trips/:id/stays` with body `{"category":"hotel","name":"...","check_in_at":"...","check_in_tz":"...","check_out_at":"...","check_out_tz":"..."}`
2. Observe: `400 {"error":{"message":"Validation failed","code":"VALIDATION_ERROR","fields":{"category":"Category must be one of: HOTEL, AIRBNB, VRBO"}}}`

**Expected:** Case-insensitive normalization (backend converts lowercase to uppercase) or clear API documentation specifying uppercase enum values.

**Actual:** Validation rejects lowercase. Error message is clear, but the api-contracts.md does not document the case requirement prominently. The frontend form (StaysEditPage.jsx) presumably sends the correct casing, but external API consumers would be confused.

---

### FB-122 — TripCalendar makes its own API call instead of using parent hook data

| Field | Value |
|-------|-------|
| Feedback | `TripCalendar.jsx` calls `GET /api/v1/trips/:id/calendar` independently; ui-spec.md specified "no additional API calls" using `useTripDetails` hook data |
| Sprint | 27 |
| Category | UX Issue |
| Severity | Minor |
| Status | Acknowledged |

**Details:**
- The `ui-spec.md` Sprint 25 spec states: "It uses data already fetched by the `useTripDetails` hook — no additional API calls."
- The implemented `TripCalendar.jsx` is a self-contained component that issues its own `GET /api/v1/trips/:id/calendar` request via `apiClient`.
- This means every TripDetailsPage load triggers an additional network request for calendar data.
- The deviation is defensible: the calendar endpoint formats data specifically for calendar display (start_date/end_date/start_time/end_time per event), and the useTripDetails hook returns raw flights/stays/activities that would need client-side reshaping.
- No functional breakage — the calendar renders correctly. This is a performance/architecture note.

**Recommendation:** Either update the spec to reflect the self-contained fetch approach (preferred — it's cleaner), or refactor the calendar to accept pre-shaped event data as a prop. Given the calendar endpoint is optimized for this use case, updating the spec is the lower-effort path.

---

## Monitor Alert — Sprint #28 — 2026-03-11T01:30:00Z

| Field | Value |
|-------|-------|
| **Category** | Monitor Alert |
| **Severity** | Major |
| **Sprint** | 28 |
| **Status** | Tasked |
| **Related Task** | T-233 |
| **Tasked As** | T-235 (Sprint 29 — QA Engineer: fix `e2e/critical-flows.spec.js` Playwright locator lines 201–202) |

**Feedback:** Playwright E2E Test 2 FAIL — `getByText('SFO')` strict mode violation caused by Sprint 27 TripCalendar rendering airport code in multiple elements; 3/4 Playwright tests PASS; Deploy Verified = No.

**Details:**

During T-233 Sprint 28 health check, all API endpoint checks, config consistency checks, and the Sprint 28 specific PATCH dates regression test (FB-113/T-229) passed. However, `npx playwright test` produced **3/4 PASS** (Test 2 FAIL; Tests 1, 3, 4 PASS).

**Failure mode:** Test 2 ("create trip, add flight, add stay, verify on details page") fails at line 202:

```
Error: strict mode violation: getByText('SFO') resolved to 3 elements:
    1) <span> inside flight calendar event pill (TripCalendar)
    2) <span> inside MobileDayList event title (TripCalendar)
    3) <div class="_airportCode_...">SFO</div> (flight card in trips section)
```

**Root cause:** The Sprint 27 TripCalendar feature (FB-114) added calendar event pills and a MobileDayList to TripDetailsPage. Both render the flight's `arrival_airport` ('SFO') as visible text. The existing Playwright locator `page.getByText('SFO')` was written before TripCalendar existed; it was unambiguous then (one element: the airport code div in the flight card). Now 3 elements match — Playwright strict mode requires exactly one match and throws.

**Confirmed NOT an application regression:**
- GET /api/v1/trips/:id/calendar → 200, events rendered correctly
- PATCH /api/v1/trips/:id with dates → T-229 COALESCE fix working (start_date/end_date returned)
- All API endpoints return correct HTTP status codes and response bodies
- pm2 processes both online (backend pid 82174, frontend pid 64982)
- Config consistency: PASS on all checks

**Impact:**
- User Agent (T-234) is blocked — cannot proceed with 4/4 requirement unmet
- No production functionality is broken; this is a test-code-only issue
- All 3 failing assertions in Test 2 are about element visibility after the flight is added and user navigates back to TripDetailsPage

**Required Fix:**
Update `e2e/critical-flows.spec.js` lines 201–202 to use specific locators:

```js
// Before (ambiguous after TripCalendar added):
await expect(page.getByText('JFK')).toBeVisible();
await expect(page.getByText('SFO')).toBeVisible();

// After (target the flight card airport code specifically):
await expect(page.locator('[class*="_airportCode_"]').filter({ hasText: 'JFK' }).first()).toBeVisible();
await expect(page.locator('[class*="_airportCode_"]').filter({ hasText: 'SFO' }).first()).toBeVisible();
// OR use data-testid if available on airport code elements
```

**Files involved:**
- `e2e/critical-flows.spec.js` — lines 201–202, `getByText('JFK')` and `getByText('SFO')` locators need to be scoped to the flight card section

**Action required:** QA Engineer or Frontend Engineer to fix the Playwright locator in `e2e/critical-flows.spec.js:201-202`, re-run `npx playwright test` → expect 4/4 PASS, then re-hand off to Monitor Agent or proceed to User Agent.

---

## Sprint 28 User Agent Feedback

*Tested 2026-03-12 by User Agent (T-234). Staging: backend https://localhost:3001, frontend https://localhost:4173.*

---

### FB-123 — T-229 COALESCE Fix: Trip Date Setting Works End-to-End

| Field | Value |
|-------|-------|
| **Feedback** | PATCH /api/v1/trips/:id with start_date/end_date now correctly returns user-provided dates (not null, not overridden by sub-resources) |
| **Sprint** | 28 |
| **Category** | Positive |
| **Severity** | — |
| **Status** | Acknowledged |
| **Related Task** | T-229 (FB-113 fix) |

**Details:**

Three scenarios verified via direct API calls:

1. **No sub-resources → user dates returned:** Created trip `Sprint28 Test Trip` (no flights/stays/activities). PATCH `{"start_date":"2026-09-01","end_date":"2026-09-30"}` → response `start_date:"2026-09-01"`, `end_date:"2026-09-30"`. ✅ PASS. (Pre-fix this would have returned null.)

2. **Sub-resources present → user dates NOT overridden:** Added a flight departing 2026-08-15 (before user start) and a stay checking out 2026-10-05 (after user end). Re-PATCH with same user dates → response still returns `start_date:"2026-09-01"`, `end_date:"2026-09-30"`. ✅ PASS. COALESCE correctly prioritises user-stored value over computed aggregate.

3. **Clear user dates → computed fallback activates:** PATCH with `{"start_date":null,"end_date":null}` on the same trip → response returned `start_date:"2026-08-15"`, `end_date:"2026-10-05"` (sub-resource aggregates). ✅ PASS. Fallback behaviour intact.

4. **Trip list (home page cards) shows correct dates:** GET /api/v1/trips with user dates set returned correct `start_date:"2026-09-01"`, `end_date:"2026-09-30"`. ✅ PASS.

The "Set dates" UI on TripDetailsPage is now fully functional end-to-end. FB-113 is resolved.

---

### FB-124 — Playwright E2E Test Locator Still Broken (Test-Code Issue, Not App Regression)

| Field | Value |
|-------|-------|
| **Feedback** | e2e/critical-flows.spec.js Test 2 fails with strict mode violation — `getByText('SFO')` matches 3 elements — this is a test-code bug, not an application bug |
| **Sprint** | 28 |
| **Category** | Bug |
| **Severity** | Major |
| **Status** | Tasked |
| **Related Task** | T-233 (Monitor Agent flagged) |
| **Tasked As** | T-235 (Sprint 29 — QA Engineer: fix `e2e/critical-flows.spec.js` lines 201–202 Playwright locator) |

**Details:**

The Monitor Agent (T-233) reported Playwright 3/4 PASS. Test 2 at `e2e/critical-flows.spec.js:202` fails:
```
strict mode violation: getByText('SFO') resolved to 3 elements
```

Root cause: Sprint 27 TripCalendar feature renders 'SFO' in both a flight pill and the MobileDayList component, making the pre-existing locator ambiguous.

**Steps to reproduce:** Run `npx playwright test` from the `e2e/` or project root. Test 2 fails.

**Expected:** 4/4 tests pass.

**Actual:** 3/4 pass. Test 2 fails on the ambiguous airport code locator.

**Application is NOT broken.** The functionality works correctly — this is purely a test-locator issue.

**Fix required in `e2e/critical-flows.spec.js` lines 201–202:**
```js
// Replace ambiguous:
await expect(page.getByText('SFO')).toBeVisible();
// With scoped locator:
await expect(page.locator('[class*="_airportCode_"]').filter({ hasText: 'SFO' }).first()).toBeVisible();
```

This was flagged by Monitor Agent in Sprint 28 and has not yet been resolved. Escalating for QA Engineer action in Sprint 29.

---

### FB-125 — Calendar Endpoint Regression: No Regressions Found

| Field | Value |
|-------|-------|
| **Feedback** | TripCalendar API endpoint continues to work correctly after T-229 tripModel.js changes |
| **Sprint** | 28 |
| **Category** | Positive |
| **Severity** | — |
| **Status** | Acknowledged |
| **Related Task** | T-229 |

**Details:**

Verified `GET /api/v1/trips/:id/calendar` on a trip with 1 flight (2026-08-15 departure) and 1 stay (2026-09-25 check-in):
- Returns 2 calendar events with correct `type`, `start_date` fields
- Empty trip (no sub-resources): returns 0 events — correct empty state

No regressions introduced by the TRIP_COLUMNS COALESCE query change. ✅

---

### FB-126 — Validation and Security: Edge Cases All Pass

| Field | Value |
|-------|-------|
| **Feedback** | Date validation correctly handles end-before-start, invalid formats, SQL injection, missing auth, and single-field PATCH |
| **Sprint** | 28 |
| **Category** | Positive |
| **Severity** | — |
| **Status** | Acknowledged |
| **Related Task** | T-229 |

**Details:**

All edge cases tested on `PATCH /api/v1/trips/:id`:

| Scenario | Result |
|----------|--------|
| `end_date` before `start_date` | ✅ 400 VALIDATION_ERROR, `end_date` field error returned |
| Invalid date format (`"not-a-date"`) | ✅ 400 VALIDATION_ERROR |
| SQL injection in `start_date` value | ✅ 400 VALIDATION_ERROR — not executed |
| No auth token | ✅ 401 UNAUTHORIZED |
| PATCH with only `start_date` (no `end_date`) | ✅ Accepted, single field updated correctly |
| PATCH with `{"start_date":null,"end_date":null}` | ✅ Clears user-stored dates, computed fallback activates |

No security regressions. Parameterised queries in knex prevent SQL injection. Auth middleware remains correctly applied.

---

### FB-127 — StatusFilterTabs and Trip Notes: Regression-Free

| Field | Value |
|-------|-------|
| **Feedback** | Status filtering and trip notes continue to work correctly — no regressions from T-229 change |
| **Sprint** | 28 |
| **Category** | Positive |
| **Severity** | — |
| **Status** | Acknowledged |
| **Related Task** | T-229 |

**Details:**

- **StatusFilterTabs:** GET `/api/v1/trips?status=PLANNING` correctly returned only trips with future `start_date`. Test trip (start: 2026-09-01) correctly classified as PLANNING. ✅
- **Trip notes save:** PATCH with `{"notes":"Test notes..."}` → notes returned in response. ✅
- **Trip notes clear:** PATCH with `{"notes":null}` → notes returned as null. ✅

---

### FB-128 — Rate Limiter Triggered During Testing (Operational Note)

| Field | Value |
|-------|-------|
| **Feedback** | In-memory login rate limiter (10 req / 15 min) was triggered during User Agent testing due to multiple failed JSON-parsing curl invocations — required backend restart to reset |
| **Sprint** | 28 |
| **Category** | UX Issue |
| **Severity** | Minor |
| **Status** | Acknowledged |
| **Related Task** | B-020 (Redis-backed rate limiter — backlog) |

**Details:**

During testing setup, several `POST /api/v1/auth/login` requests were sent with malformed JSON (due to shell escaping issues in the test runner environment), consuming the 10-attempt login budget and triggering a 429 RATE_LIMITED lockout. The backend had to be restarted (pm2 restart triplanner-backend) to reset the in-memory store.

**Impact:** No impact on production users (rate limiter works as intended). However, this highlights that the in-memory MemoryStore resets on restart — if the intent is to protect against brute force attacks across restarts, a persistent store (Redis) would be needed.

**Suggestion for Sprint 29 backlog:** Consider a Redis-backed rate limiter for production deployment (already noted as B-020 in backlog).

---
