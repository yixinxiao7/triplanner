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

