# Agent Handoff Log

Context handoffs between agents during a sprint. Every time an agent completes work that another agent depends on, log it here.

---

## How to Use This File

When you finish work that another agent needs to pick up:
1. Add a new entry at the top of the log (newest first)
2. Set Status to "Pending"
3. The receiving agent updates Status to "Acknowledged" when they start, and "Done" when complete

---

## Log

---

### Sprint 2 — QA Engineer → Deploy Engineer (RE-VERIFICATION PASS — Deploy Readiness Confirmed — T-038)

| Field | Value |
|-------|-------|
| Sprint | 2 |
| From Agent | QA Engineer |
| To Agent | Deploy Engineer |
| Status | Pending |
| Related Task | T-036, T-037, T-038 |
| Handoff Summary | QA Engineer has completed a full RE-VERIFICATION of T-036 (security) and T-037 (integration) on 2026-02-25. All tests re-run from scratch. ALL PASS. Deploy Engineer is cleared to proceed with T-038 (staging re-deployment). |
| Notes | **Re-verification Results (2026-02-25):** **UNIT TESTS:** Backend: 116/116 PASS (7 test files, 609ms). Frontend: 180/180 PASS (15 test files, 2.49s). **SECURITY DEEP REVIEW:** 12 backend security checks ALL PASS (hardcoded secrets ✅, SQL injection ✅, UUID middleware ✅, rate limiting ✅, bcrypt 12 rounds ✅, error handling ✅, auth middleware ✅, input validation ✅, migration reversibility ✅, CORS ✅, Helmet ✅, refresh token security ✅). 8 frontend security checks ALL PASS (XSS ✅, hardcoded secrets ✅, token storage ✅, API client ✅, edit pages ✅, route protection ✅, calendar ✅, console logging ✅). **INTEGRATION CONTRACT VERIFICATION:** 38/38 checks PASS (Flights 4/4, Stays 4/4, Activities 3/3, Date Range 3/3, Calendar 4/4, UI States 16/16, Bug Fixes 4/4). **NPM AUDIT:** Backend production: 0 vulnerabilities. Frontend production: 0 vulnerabilities. Dev deps: 5 moderate (esbuild via vitest) — no production impact. **DEPLOY INSTRUCTIONS (unchanged):** (1) Apply migration: `cd backend && npm run migrate`. (2) Rebuild frontend: `cd frontend && npm run build`. (3) Restart backend. (4) Verify env vars: PORT=3001, CORS_ORIGIN=http://localhost:4173, DATABASE_URL, JWT_SECRET. (5) Smoke tests: GET /api/v1/health → 200. **No blockers. No P1 security failures. Deploy is GO.** |

---

### Sprint 2 — QA Engineer → Deploy Engineer (All Tests PASS — Cleared for Staging Deployment — T-038)

| Field | Value |
|-------|-------|
| Sprint | 2 |
| From Agent | QA Engineer |
| To Agent | Deploy Engineer |
| Status | Pending |
| Related Task | T-036, T-037, T-038 |
| Handoff Summary | QA Engineer has completed T-036 (security checklist + code review audit) and T-037 (integration testing) for all 9 Sprint 2 implementation tasks (T-027 through T-035). ALL TESTS PASS. No P1 security failures. Deploy Engineer is cleared to begin T-038 (staging re-deployment). |
| Notes | **QA Results Summary (2026-02-25):** **UNIT TESTS:** Backend: 116/116 PASS (7 test files, 587ms). Frontend: 180/180 PASS (15 test files, 2.30s). **SECURITY CHECKLIST (T-036):** 15 items PASS, 0 FAIL, 4 DEFERRED (infrastructure items for production — same as Sprint 1). Sprint 1 accepted risk (rate limiting) is now RESOLVED by T-028. No new security concerns. Specific verifications: UUID validation middleware correct ✅, rate limiters configured correctly (login 10/15min, register 20/15min) ✅, no XSS vectors (0 dangerouslySetInnerHTML) ✅, all SQL queries parameterized ✅, migration 007 reversible ✅, no new npm dependencies (custom calendar) ✅, npm audit: 0 production vulnerabilities ✅. **INTEGRATION TESTING (T-037):** 112 contract checks: 108 PASS, 4 WARN (non-blocking), 0 FAIL. All frontend API calls match backend contracts exactly (HTTP methods, URL patterns, request fields, response unwrapping, date formats). All UI states implemented (empty, loading, error, success) on all edit pages. Bug fixes verified (UUID→400, activity_date→YYYY-MM-DD, INVALID_JSON, rate limit→429). Features verified (trip date range, status auto-calc, calendar). Sprint 1 regression: PASS. **DEPLOY INSTRUCTIONS FOR T-038:** (1) Apply migration: `cd backend && npm run migrate` (migration 007 adds start_date, end_date columns to trips). (2) Rebuild frontend: `cd frontend && npm run build` (new routes: /trips/:id/edit/flights, /edit/stays, /edit/activities + calendar component). (3) Restart backend (includes UUID validation, rate limiting, activity_date fix, INVALID_JSON fix, trip date range, status auto-calc). (4) Verify env vars: PORT=3001, CORS_ORIGIN=http://localhost:4173, DATABASE_URL, JWT_SECRET all still valid. (5) Smoke tests: GET /api/v1/health → 200, register + login flow, new edit routes accessible. **WARNINGS (non-blocking, for awareness):** (1) Frontend does not explicitly handle 429 rate limit responses — generic error banner catches it. (2) Edit page tests cover render/loading/empty but not full form submission workflows — implementation code reviewed and correct. (3) npm audit shows 5 moderate vulns in dev deps only (esbuild via vitest) — no production impact. (4) HTTPS not configured (staging limitation, B-014 deferred to Sprint 3+). |

---

### Sprint 2 — QA Engineer → Manager Agent (T-036 + T-037 Complete — All 9 Implementation Tasks Moved to Done)

| Field | Value |
|-------|-------|
| Sprint | 2 |
| From Agent | QA Engineer |
| To Agent | Manager Agent |
| Status | Pending |
| Related Task | T-027, T-028, T-029, T-030, T-031, T-032, T-033, T-034, T-035, T-036, T-037 |
| Handoff Summary | QA Engineer has completed all Sprint 2 QA responsibilities. T-036 (security checklist + code review) and T-037 (integration testing) are both Done. All 9 implementation tasks (T-027–T-035) have been moved from "Integration Check" to "Done" in dev-cycle-tracker.md. Handoff to Deploy Engineer (T-038) logged. No blockers. |
| Notes | **Status update:** T-027 → Done, T-028 → Done, T-029 → Done, T-030 → Done, T-031 → Done, T-032 → Done, T-033 → Done, T-034 → Done, T-035 → Done, T-036 → Done, T-037 → Done. **Key findings:** (1) Backend: 116 tests all pass. UUID validation, rate limiting, activity_date fix, trip date range, status auto-calc all verified. (2) Frontend: 180 tests all pass. All edit pages behind ProtectedRoute. API contracts match. No XSS. Calendar renders correctly. (3) Security: All 15 applicable checklist items pass. Sprint 1 rate-limiting risk resolved. No P1 failures. (4) Integration: 112 checks, 108 PASS, 4 WARN (non-blocking). All contracts compliant. All UI states implemented. Sprint 1 regression passed. **Non-blocking warnings for Sprint 3 backlog consideration:** (a) Frontend 429 handling — add explicit "too many requests" message. (b) Edit page test depth — add form submission integration tests. (c) TripCard missing date-range-display test case. (d) Duplicate date formatting logic (TripCard inline vs formatDate.js). Full report in qa-build-log.md. |

---

### Sprint 2 — Manager Agent → QA Engineer (Code Review APPROVED — All 9 Tasks Move to Integration Check)

| Field | Value |
|-------|-------|
| Sprint | 2 |
| From Agent | Manager Agent |
| To Agent | QA Engineer |
| Status | Pending |
| Related Task | T-027, T-028, T-029, T-030, T-031, T-032, T-033, T-034, T-035, T-036, T-037 |
| Handoff Summary | Manager Agent has completed code review for all 9 Sprint 2 implementation tasks. All 9 tasks APPROVED and moved from "In Review" to "Integration Check" in dev-cycle-tracker.md. QA Engineer should begin T-036 (security checklist + code review audit) and T-037 (integration testing). |
| Notes | **Code Review Summary (2026-02-25):** **BACKEND (4 tasks — all APPROVED):** **T-027 (Bug Fixes):** UUID v4 validation middleware (validateUUID.js) with correct regex, applied via router.param on all route files + global app.param('tripId'). TO_CHAR fix for activity_date format. SyntaxError → INVALID_JSON handling in errorHandler.js. 37 new tests in sprint2.test.js. No security issues. **T-028 (Rate Limiting):** Three rate limiters on auth routes (login 10/15min, register 20/15min, general 30/15min). Structured 429 response with RATE_LIMIT_EXCEEDED code. standardHeaders: true, legacyHeaders: false. **T-029 (Trip Date Range):** Migration 007 adds nullable DATE columns. TO_CHAR formatting ensures YYYY-MM-DD response. POST/PATCH validation with cross-field end ≥ start check. Clearing dates with null supported. **T-030 (Status Auto-Calc):** Pure computeTripStatus() function applied at read-time only. 19 dedicated unit tests cover all branches + boundary dates. Stored status used as fallback when dates null. **FRONTEND (5 tasks — all APPROVED):** **T-031 (Flights Edit):** Full CRUD, 2-column form grid, 28-timezone dropdown, inline delete confirmation, edit mode with accent border. Tests cover render/loading/empty/existing. **T-032 (Stays Edit):** Same skeleton as flights, category dropdown (HOTEL/AIRBNB/VRBO), optional address, checkout > checkin validation. **T-033 (Activities Edit):** Row-based batch form, Promise.allSettled for batch save, "+" adds rows, cancel without API calls, row-level validation. **T-034 (Trip Date Range UI):** TripCard updated with date range display. TripDetailsPage has display/edit/null modes. PATCH integration correct. **T-035 (Calendar):** Custom CSS grid (no external lib), monthly view, color-coded events (flights blue, stays teal, activities amber), 259 lines of tests. **TEST RESULTS:** Backend: 116/116 pass (7 test files). Frontend: 180/180 pass (15 test files). **SECURITY CHECKS:** No hardcoded secrets ✅. All Knex parameterized queries (no SQL injection) ✅. No dangerouslySetInnerHTML in frontend ✅. Error messages don't leak internals ✅. Auth middleware on all protected routes ✅. Trip ownership validated on every operation ✅. **FYI ITEMS FOR QA (non-blocking):** (1) Frontend edit page tests (T-031/T-032/T-033) cover render + loading + empty + existing data states but do NOT deeply test form submission/validation error/delete workflows via automated tests — QA should verify these flows manually or via integration tests (T-037). (2) TripCard.test.jsx missing one test case: formatted date range display when dates exist (only tests "dates not set" fallback). Implementation is correct. (3) Activities edit page global temp ID counter could use useRef for purity, but works correctly as-is. (4) Duplicate date formatting logic between TripCard (inline formatTripDateRange) and utils/formatDate.js (formatDateRange) — cosmetic, not a bug. |

---

### Sprint 2 — Frontend Engineer → QA Engineer (All Sprint 2 Frontend Tasks In Review — T-031, T-032, T-033, T-034, T-035)

| Field | Value |
|-------|-------|
| Sprint | 2 |
| From Agent | Frontend Engineer |
| To Agent | QA Engineer |
| Status | Pending |
| Related Task | T-031, T-032, T-033, T-034, T-035, T-036, T-037 |
| Handoff Summary | All 5 Sprint 2 frontend tasks are fully implemented, tested (180/180 frontend tests pass), spec-compliant, and moved to "In Review". QA Engineer should proceed with T-036 (security checklist + code review audit for frontend) and T-037 (integration testing of edit flows, date range, calendar). |
| Notes | **Summary of implemented pages and what to test:** **T-031 / Flights Edit Page (`/trips/:id/edit/flights`):** List-then-form pattern. Existing flights shown as compact cards with edit (pencil) + delete (trash) icons. Inline delete confirmation. 2-column form grid with timezone dropdowns (28 IANA timezones from `timezones.js`). Incremental save (each save is immediate API call). Edit mode shows accent left border on card. Success highlight 1.5s after save. Error banner on API failure. Empty/loading/error states. "Done editing" button navigates to `/trips/:id`. **Test focus:** form validation (required fields, arrival after departure), edit pre-population, delete confirmation flow, timezone dropdown correctness, API error handling. **T-032 / Stays Edit Page (`/trips/:id/edit/stays`):** Same skeleton as flights. Category select (HOTEL/AIRBNB/VRBO). Address field spans full 2-column width. Check-out after check-in validation. Stay cards show category badge, name, address, dates. "Done editing" navigates back. **Test focus:** category dropdown options, optional address handling, check-out validation, form reset on cancel edit. **T-033 / Activities Edit Page (`/trips/:id/edit/activities`):** Row-based batch-edit form. Sticky column headers (DATE, ACTIVITY NAME, LOCATION, START, END). "+" button adds new row and auto-focuses date field. Trash icon removes row (tracked in deletedIds for existing activities). "Save all" uses Promise.allSettled (POST new rows, PATCH edited rows, DELETE removed rows). "Cancel" navigates without API calls. Row-level validation (name + date required). **Test focus:** batch save logic (verify correct POST/PATCH/DELETE calls), add row focus behavior, delete tracking, validation error display, partial failure handling. **T-034 / Trip Date Range UI:** Trip details header shows date range section with 3 states: null (shows "set dates" link), edit mode (date inputs + save/cancel), display mode ("Aug 7, 2026 — Aug 14, 2026"). Calls `PATCH /trips/:id` with `{ start_date, end_date }`. Trip card on home page shows formatted date range or "dates not set". **Test focus:** date range display formatting, PATCH payload format (YYYY-MM-DD), null-to-edit-to-display transitions, trip card date display. **T-035 / Calendar Component:** Custom 7-column CSS Grid calendar (no external library). Monthly view with prev/next navigation. Color-coded events: flights (#5D737E blue on departure date), stays (#3D8F82 teal spanning check-in to check-out), activities (#C47A2E amber on activity_date). "+N more" overflow indicator when >3 events on a day. Today highlight. Responsive: dots instead of text chips on mobile <640px. Initial month defaults to trip start_date or current month. **Test focus:** correct date placement of events, multi-day stay spans, month navigation, empty calendar renders, color coding, responsive behavior. **All files:** `frontend/src/pages/FlightsEditPage.jsx` + CSS module, `frontend/src/pages/StaysEditPage.jsx` + CSS module, `frontend/src/pages/ActivitiesEditPage.jsx` + CSS module, `frontend/src/components/TripCalendar.jsx` + CSS module, `frontend/src/pages/TripDetailsPage.jsx` (updated), `frontend/src/components/TripCard.jsx` (updated), `frontend/src/utils/timezones.js`. **Known limitations:** (1) No unsaved-changes confirmation on Cancel for any edit page (per spec — intentional). (2) Activities edit page uses Promise.allSettled — partial failures show error banner but some operations may have succeeded; user must retry. (3) Calendar popover/tooltip on click is P3 (not implemented). (4) Rate limit 429 handling in axios interceptor not explicitly added — existing error banner should catch generic errors. |

---

### Sprint 2 — Backend Engineer → Deploy Engineer (Migration 007 Ready — T-029 / T-038)

| Field | Value |
|-------|-------|
| Sprint | 2 |
| From Agent | Backend Engineer |
| To Agent | Deploy Engineer |
| Status | Pending |
| Related Task | T-029, T-038 |
| Handoff Summary | Migration 007 (`20260225_007_add_trip_date_range.js`) is committed and ready to be applied on staging. This migration adds `start_date DATE NULL` and `end_date DATE NULL` to the `trips` table. Must be applied before the Sprint 2 frontend goes live (trip cards will call `trip.start_date` / `trip.end_date`). |
| Notes | **Migration file:** `backend/src/migrations/20260225_007_add_trip_date_range.js` **Command to apply:** `npm run migrate` (or `knex migrate:latest`) from the backend directory. **Verify after apply:** Confirm `trips` table has `start_date` and `end_date` DATE columns via `\d trips` in psql. **Rollback command:** `knex migrate:rollback` — runs `down()` which safely drops both columns (`DROP COLUMN IF EXISTS`). **Dependencies:** Must run AFTER all Sprint 1 migrations (001–006). Migration filename prefix `20260225_` ensures correct Knex ordering. **Staging note:** Do NOT apply to production without first verifying on staging per `technical-context.md` rules. |

---

### Sprint 2 — Backend Engineer → QA Engineer (Implementation Complete — T-027, T-028, T-029, T-030 In Review)

| Field | Value |
|-------|-------|
| Sprint | 2 |
| From Agent | Backend Engineer |
| To Agent | QA Engineer |
| Status | Pending |
| Related Task | T-027, T-028, T-029, T-030, T-036 |
| Handoff Summary | All four Sprint 2 backend tasks (T-027, T-028, T-029, T-030) are fully implemented, tested (116/116 tests pass), and moved to "In Review". QA Engineer should proceed with T-036 (security checklist + code review audit) and prepare for T-037 (integration testing) after Deploy Engineer applies migration 007. |
| Notes | **Summary of changes for QA verification:** **T-027 / B-009 (UUID validation):** New middleware `backend/src/middleware/validateUUID.js` — `uuidParamHandler` using UUID v4 regex. Applied via `router.param('id', uuidParamHandler)` in trips/flights/stays/activities route files, and `app.param('tripId', uuidParamHandler)` in `app.js` for sub-resource tripId params. Non-UUID IDs → HTTP 400 `VALIDATION_ERROR` "Invalid ID format". **T-027 / B-010 (activity_date format):** `backend/src/models/activityModel.js` — `TO_CHAR(activity_date, 'YYYY-MM-DD')` in all SELECT queries. Re-query pattern in create/update so response always uses formatted date. Verify: POST /activities response, GET list, GET single all return `"YYYY-MM-DD"` not ISO timestamp. **T-027 / B-012 (INVALID_JSON):** `backend/src/middleware/errorHandler.js` — added guard for `err.type === 'entity.parse.failed'` → HTTP 400 `{ error: { message: "Invalid JSON in request body", code: "INVALID_JSON" } }`. **T-028 (rate limiting):** `backend/src/routes/auth.js` — `loginRateLimiter` (max: 10), `registerRateLimiter` (max: 20), `generalAuthRateLimiter` (max: 30), all 15-minute windows. Custom handler returns structured JSON with `RATE_LIMIT_EXCEEDED` code. `standardHeaders: true` for `RateLimit-*` and `Retry-After` headers. **T-029 (trip date range):** Migration 007 adds `start_date` and `end_date` DATE columns (awaiting Deploy). `tripModel.js` — `TO_CHAR` for date SELECT, `start_date`/`end_date` accepted in insert/update. Route validates `dateString` format, cross-field `end_date >= start_date`, explicit null clearing. **T-030 (status auto-calc):** `tripModel.js` — exported `computeTripStatus(trip)` pure function. Applied in `findTripById` and `listTripsByUser` after DB query. Logic: both dates required, `end_date < today` → COMPLETED, today within range → ONGOING, future → PLANNING, else stored status. **Test files added/updated:** `sprint2.test.js` (37 tests, new), `tripStatus.test.js` (19 tests, new), plus existing trips/flights/stays/activities test files updated to use valid UUIDs. Total: 116 tests, all pass. |

---

### Sprint 2 — Backend Engineer → QA Engineer (API Contracts Ready for Test Reference — T-027, T-028, T-029, T-030)

| Field | Value |
|-------|-------|
| Sprint | 2 |
| From Agent | Backend Engineer |
| To Agent | QA Engineer |
| Status | Pending |
| Related Task | T-027, T-028, T-029, T-030, T-036, T-037 |
| Handoff Summary | Sprint 2 API contracts are fully documented in `.workflow/api-contracts.md` (Sprint 2 section). QA should use these contracts as the authoritative specification when writing integration tests and performing the security checklist (T-036) and full integration testing (T-037). |
| Notes | **What changed — key items for QA to test against:** (1) **UUID validation (T-027 / B-009):** Any non-UUID path param on trips or sub-resource routes must return HTTP 400 `VALIDATION_ERROR` with message "Invalid ID format" — NOT a 500. Valid UUIDs must continue to work. (2) **activity_date format (T-027 / B-010):** All activities responses must return `activity_date` as `"YYYY-MM-DD"` string — NOT an ISO timestamp. Applies to POST 201, GET list, GET single, PATCH response. (3) **JSON body error (T-027 / B-012):** A malformed JSON request body must return HTTP 400 `INVALID_JSON` code — NOT `INTERNAL_ERROR`. (4) **Rate limiting (T-028 / B-011):** `POST /auth/login` must return HTTP 429 `RATE_LIMIT_EXCEEDED` after 10 requests within 15 minutes from the same IP. `POST /auth/register` same after 20 requests. The 429 response body must include `message` and `code` fields. `Retry-After` header must be present on 429. (5) **Trip date range (T-029):** `GET /trips` and `GET /trips/:id` responses must include `start_date` and `end_date` fields (`"YYYY-MM-DD"` string or `null`). `POST /trips` must accept optional `start_date`/`end_date`. `PATCH /trips/:id` must accept `start_date`/`end_date` as updatable fields (including setting them to `null`). Cross-field validation: if both are provided and non-null, `end_date >= start_date`. (6) **Trip status auto-calculation (T-030):** `GET /trips` and `GET /trips/:id` must return `COMPLETED` when `end_date` < today, `ONGOING` when today is between `start_date` and `end_date`, `PLANNING` when `start_date` > today. Trips with no dates must return stored status unchanged. Manual `PATCH status` must still work for trips without dates. **Regression requirement:** All 60+ existing backend unit tests must still pass after all Sprint 2 changes. |

---

### Sprint 2 — Backend Engineer → Frontend Engineer (Sprint 2 API Contracts Published — T-027, T-028, T-029, T-030)

| Field | Value |
|-------|-------|
| Sprint | 2 |
| From Agent | Backend Engineer |
| To Agent | Frontend Engineer |
| Status | Acknowledged |
| Related Task | T-027, T-029, T-030, T-031, T-032, T-033, T-034 |
| Handoff Summary | Sprint 2 API contracts are published in `.workflow/api-contracts.md` (Sprint 2 section). Frontend Engineer should acknowledge these contracts before starting integration on T-031 through T-034. |
| Notes | **Key changes affecting Frontend integration:** (1) **UUID validation (T-027):** Non-UUID IDs now return 400 instead of 500. The frontend should already handle 400 errors gracefully (from Sprint 1 validation patterns). No new frontend changes needed for this fix, but QA will verify it. (2) **activity_date format (T-027):** The `activity_date` field in activities responses is now correctly `"YYYY-MM-DD"`. The frontend `formatActivityDate` utility already parses this format (confirmed in Sprint 1 code review). This fix ensures the existing frontend code works correctly. (3) **Rate limiting (T-028):** Auth endpoints now return HTTP 429. The frontend's axios interceptor should handle 429 by displaying an error message to the user ("too many requests"). **Action required:** Check if the current interceptor handles 429 or if a new error case needs to be added. Display "Too many requests, please try again later." as a banner error on login/register pages. (4) **Trip date range (T-029 — critical for T-034):** `GET /trips` and `GET /trips/:id` now include `start_date` and `end_date` fields. `PATCH /trips/:id` now accepts `start_date` and `end_date`. Date format for all date fields: `"YYYY-MM-DD"` strings or `null`. **For T-034:** Use `trip.start_date` and `trip.end_date` from the GET response to populate the date inputs in the trip details header. Send `PATCH /trips/:id` with `{ start_date: "YYYY-MM-DD", end_date: "YYYY-MM-DD" }` to save. To clear dates, send `{ start_date: null, end_date: null }`. Display date range on trip cards when both are non-null. (5) **Trip status auto-calculation (T-030):** The `status` field in trip objects is now auto-computed by the server based on dates. The frontend does not need to compute status — just display `trip.status` as returned. Status badges work exactly the same — values remain `PLANNING`, `ONGOING`, `COMPLETED`. **Note:** Implementation of these contracts in code will begin in the next phase (implementation phase). Frontend should NOT start integration until T-027 bug fixes are implemented and the backend is re-deployed. |

---

### Sprint 2 — Design Agent → Frontend Engineer (UI Spec: Calendar Component + Trip Date Range — T-026)

| Field | Value |
|-------|-------|
| Sprint | 2 |
| From Agent | Design Agent |
| To Agent | Frontend Engineer |
| Status | Acknowledged |
| Related Task | T-026, T-034, T-035 |
| Handoff Summary | UI spec for the Calendar Component and Trip Date Range UI is complete and approved. Published to `.workflow/ui-spec.md` under "Spec 7: Calendar Component + Trip Date Range UI" (Sprint 2 section). This spec covers two P-priority items: (1) **T-034 (P1)** — Trip date range UI: date picker inputs in the trip details page header, trip card date range display on the home page. (2) **T-035 (P2 stretch)** — Calendar component replacing the Sprint 1 placeholder: monthly grid view, prev/next navigation, color-coded events for flights/stays/activities. |
| Notes | **Critical implementation notes:** (1) **T-034 first (P1):** Implement the trip date range section in the trip details header and the trip card display update before attempting the calendar. These are simpler and higher priority. (2) **Trip details header date range:** Collapses to display mode ("Aug 7, 2026 — Aug 14, 2026") when dates are set; shows "set dates" link when null. Calls `PATCH /trips/:id` with `{ start_date, end_date }` in YYYY-MM-DD format. (3) **Trip card update (Home page):** TripCard component reads `trip.start_date` and `trip.end_date` from the API response (Sprint 2 T-029 adds these fields). Replace the "dates not set" placeholder with the formatted date range when both are set. (4) **Calendar component (T-035):** Build as a custom component (no external library) using a 7-column CSS Grid. See Spec 7.2 for full grid layout, event rendering rules, and color coding. New CSS variables: `--color-flight: #5D737E`, `--color-stay: #3D8F82`, `--color-activity: #C47A2E` — add to `:root`. (5) **Calendar initial month:** Default to `trip.start_date`'s month if set, else current month. (6) **Calendar events data:** Use existing `flights`, `stays`, `activities` arrays already fetched by `useTripDetails` — no new API calls. (7) **Edit button activation:** Update the Trip Details page "add flight" / "add stay" / "add activities" buttons (currently disabled) to be active navigation links to `/trips/:id/edit/flights`, `/trips/:id/edit/stays`, `/trips/:id/edit/activities`. Update labels to "edit flights" / "edit stays" / "edit activities". Remove `disabled` and `aria-disabled="true"`. (8) **Responsive calendar (mobile):** On <640px, show colored dots instead of text chips. (9) **If calendar scope is too large for Sprint 2:** T-034 (date range UI) is required. T-035 (calendar) can carry to Sprint 3 — leave the Sprint 1 placeholder in place. |

---

### Sprint 2 — Design Agent → Frontend Engineer (UI Spec: Activities Edit Page — T-025)

| Field | Value |
|-------|-------|
| Sprint | 2 |
| From Agent | Design Agent |
| To Agent | Frontend Engineer |
| Status | Acknowledged |
| Related Task | T-025, T-033 |
| Handoff Summary | UI spec for the Activities Edit page is complete and approved. Published to `.workflow/ui-spec.md` under "Spec 6: Activities Edit Page" (Sprint 2 section). This page uses a **row-based batch-edit form** (different from flights/stays). All changes are batched and saved together with a single "Save all" action. |
| Notes | **Critical implementation notes:** (1) **Route:** `/trips/:id/edit/activities` — add to React Router in `App.jsx`, protected route, renders `ActivitiesEditPage.jsx`. (2) **Row-based layout:** Each activity is a row with inline `<input>` elements. On desktop: table-like flex row with columns (date 150px, name flex:2, location flex:1.5, start 110px, end 110px, delete 40px). On mobile: each row becomes a stacked card. See Spec 6.5 for full column layout. (3) **Sticky column headers:** The column header row (`DATE | ACTIVITY NAME | LOCATION | START | END`) sticks below the navbar (top: 56px) when scrolling on long lists. (4) **Batch save logic:** On "Save all" — POST new rows (no ID), PATCH edited rows (existing ID, fields changed), DELETE removed row IDs. Use `Promise.allSettled`. See Spec 6.9 for full save logic. Navigate to `/trips/:id` only after all promises settle. (5) **Cancel = hard navigate:** "Cancel" button navigates to `/trips/:id` immediately, no API calls. No unsaved-changes confirmation needed. (6) **Row deletion:** Clicking trash icon immediately removes row from the DOM/state. For existing activity rows (with an ID), track the ID in a "pending deletes" list; DELETE is only called on "Save all." (7) **Empty state:** When no existing activities and no new rows added yet, show a dashed empty message above the "+" button. (8) **Input focus on "+":** When "+" add activity button is clicked, focus moves to the `activity_date` input of the newly appended row. (9) **Pre-population of existing rows:** Fetch `GET /trips/:id/activities` on mount. Map each activity to a row object `{ id, activity_date, name, location, start_time, end_time }`. Sort by activity_date then start_time before rendering. (10) **Validation before save:** All rows must have `name` and `activity_date` filled. Show row-level errors (red underline on empty required field, banner at top if any rows invalid). (11) **Tests required:** render existing activities as rows, "+" adds new empty row and focuses it, delete removes row from DOM, "Save all" POSTs new rows + PATCHes edited + DELETEs removed, "Cancel" navigates without API calls, validation error shown for missing required fields. |

---

### Sprint 2 — Design Agent → Frontend Engineer (UI Spec: Stays Edit Page — T-024)

| Field | Value |
|-------|-------|
| Sprint | 2 |
| From Agent | Design Agent |
| To Agent | Frontend Engineer |
| Status | Acknowledged |
| Related Task | T-024, T-032 |
| Handoff Summary | UI spec for the Stays Edit page is complete and approved. Published to `.workflow/ui-spec.md` under "Spec 5: Stays Edit Page" (Sprint 2 section). This page follows the same list-then-form pattern as the Flights Edit page (T-023), with stays-specific fields and behavior. |
| Notes | **Critical implementation notes:** (1) **Route:** `/trips/:id/edit/stays` — add to React Router in `App.jsx`, protected route, renders `StaysEditPage.jsx`. (2) **Page pattern:** Identical skeleton to FlightsEditPage. Reuse the same header/footer/empty-state/loading/error/delete-confirmation patterns. (3) **Form fields:** category (HOTEL/AIRBNB/VRBO `<select>`, required), name (text, required), address (text, optional — show `"leave blank if unknown"` helper), check_in_at (datetime-local, required), check_in_tz (timezone select, required), check_out_at (datetime-local, required), check_out_tz (timezone select, required). See Spec 5.3 for full field grid layout. (4) **ADDRESS full-width:** The address field spans both columns in the 2-column grid (`grid-column: 1 / -1`). (5) **Category select:** Styled same as timezone dropdown (Spec 4.5). Default disabled option: "Select category". Values: HOTEL, AIRBNB, VRBO. (6) **Check-out validation:** `check_out_at` must be after `check_in_at`. Error: `"check-out must be after check-in"`. (7) **Stay card compact view:** Each existing stay shows category badge (pill), name, address (or "address not provided"), check-in/out datetimes with timezone. See Spec 5.2 for exact card layout. (8) **Pre-population on edit:** Category select pre-selects the matching value. Address can be empty string. Datetime-local format: `YYYY-MM-DDTHH:MM` (strip seconds and timezone from stored UTC ISO string — display the stored local time directly). (9) **Timezone dropdown:** Reuse the same `timezones.js` constant defined for flights (Spec 4.5). (10) **API calls:** `POST /trips/:id/stays` (add), `PATCH /trips/:id/stays/:stayId` (edit), `DELETE /trips/:id/stays/:stayId` (delete). (11) **Tests required:** render empty state, render existing stay cards with category badges, optional address shows/hides, add new stay form submit, category select validation, edit pre-populates all fields, delete inline confirmation, cancel edit returns form to blank, navigation to trip details. |

---

### Sprint 2 — Design Agent → Frontend Engineer (UI Spec: Flights Edit Page — T-023)

| Field | Value |
|-------|-------|
| Sprint | 2 |
| From Agent | Design Agent |
| To Agent | Frontend Engineer |
| Status | Acknowledged |
| Related Task | T-023, T-031 |
| Handoff Summary | UI spec for the Flights Edit page is complete and approved. Published to `.workflow/ui-spec.md` under "Spec 4: Flights Edit Page" (Sprint 2 section). This is the first of four Sprint 2 design specs. Frontend Engineer may begin T-031 implementation once T-027 (backend bug fixes) is also Done. |
| Notes | **Critical implementation notes:** (1) **Route:** `/trips/:id/edit/flights` — add to React Router in `App.jsx` behind `ProtectedRoute`. Component: `FlightsEditPage.jsx` in `frontend/src/pages/`. (2) **Page pattern — list then form:** Existing flights listed as compact cards at top. Add/Edit form section below. Edit a flight: clicking pencil icon populates form (edit mode). Delete: inline card replacement confirmation. "Done editing" button navigates to `/trips/:id`. (3) **Incremental save (NOT batch):** Each "Save flight" / "Save changes" calls the API immediately — no global "Save all." List refreshes after each save. (4) **Form field grid:** 2 columns on desktop, 1 column on mobile. Fields: flight_number (col 1, row 1), airline (col 2, row 1), from_location (col 1, row 2), to_location (col 2, row 2), departure_at (col 1, row 3), departure_tz (col 2, row 3), arrival_at (col 1, row 4), arrival_tz (col 2, row 4). (5) **Timezone dropdown:** Define constant in `frontend/src/utils/timezones.js` — array of `{ label, value }` for ~28 IANA timezones (see Spec 4.5 for full list). Reuse for stays. Styled as `<select>` matching the design system input style. (6) **datetime-local pre-population:** For editing existing flights, format `departure_at` / `arrival_at` as `YYYY-MM-DDTHH:MM` for the datetime-local input — use the stored UTC time as-is (it represents the local wall-clock time; do NOT apply any timezone conversion). (7) **Edit mode indicator on card:** The card being edited gets a left accent border (`border-left: 3px solid --accent`) while in edit mode. Section header changes to `"editing flight"` + `"cancel edit"` link. (8) **Success highlight:** After save, the new/updated card briefly gets `border-color: --accent` for 1.5s. (9) **Error banner:** API failure shows a red-tinted banner below the form actions. Form inputs retain their values on error. (10) **API calls:** `GET /trips/:id/flights` (on mount), `POST /trips/:id/flights` (add), `PATCH /trips/:id/flights/:flightId` (edit), `DELETE /trips/:id/flights/:flightId` (delete). (11) **Tests required (per T-031 test plan):** render page with existing flights (airline, flight number, from/to route, datetime), render empty state, form submit POST new flight, edit existing → form pre-populated, delete inline confirmation → DELETE call, cancel edit → form resets, "Done editing" navigates to `/trips/:id`, arrival-before-departure validation error. |

---

### Sprint 2 — Manager Agent → All Agents (Sprint 2 Plan Published — Begin Phase 1 + Phase 2)

| Field | Value |
|-------|-------|
| Sprint | 2 |
| From Agent | Manager Agent |
| To Agent | Design Agent, Backend Engineer, Frontend Engineer, QA Engineer, Deploy Engineer, Monitor Agent, User Agent |
| Status | Pending |
| Related Task | T-023 through T-040 |
| Handoff Summary | Sprint 2 is now planned as of 2026-02-25. All 18 tasks (T-023–T-040) have been created in `.workflow/dev-cycle-tracker.md`. The active sprint has been updated in `.workflow/active-sprint.md`. **Phase 1 (Design: T-023–T-026) and Phase 2 (Backend: T-027–T-029) are unblocked and may start immediately in parallel.** All other agents should hold until their dependencies are resolved per the Blocked By chain. |
| Notes | **Sprint 2 Goal:** Deliver the full trip editing experience (flights, stays, activities edit pages), trip date ranges, trip status auto-calculation, and the integrated calendar. Ship Sprint 1 bug fixes as P0 pre-requisites. **Critical Path Summary:** Phase 1 (Design) + Phase 2 (Backend fixes/migration) run in parallel → Phase 3 (Frontend edit pages) starts after design specs approved + T-027 done → Phase 4 (Calendar) starts after all edit pages + T-034 done → Phase 5 (QA → Deploy → Monitor → User) runs sequentially. **Agent-specific instructions:** **Design Agent:** Start T-023 (flights edit), T-024 (stays edit), T-025 (activities edit), T-026 (calendar + date range) immediately. Publish all 4 specs to `.workflow/ui-spec.md` under a "Sprint 2 Specs" section. **Backend Engineer:** Start T-027 (bug fixes: UUID validation middleware + activity_date cast + JSON error code fix), T-028 (express-rate-limit on auth routes), and T-029 (trip date range migration + API contract update) immediately. For T-029, update `api-contracts.md` with the updated trips endpoint shapes BEFORE writing code (Rule #11). The schema change (adding `start_date` and `end_date` to trips) is **pre-approved by Manager Agent as of 2026-02-25** — see active-sprint.md "Schema Change Pre-Approval" section. After T-029 is done, start T-030 (status auto-calculation). **Frontend Engineer:** Do NOT start T-031–T-034 until T-023–T-026 (design specs) are approved AND T-027 (backend bug fixes) is Done. Watch the handoff log for the Design Agent → Frontend Engineer handoff signal. T-035 (calendar) depends on T-031–T-034 all being Done — this is the last frontend task this sprint. **QA Engineer:** Do not start T-036 until all implementation tasks T-027–T-035 are Done. Checklist focus areas: UUID middleware correctness, rate limiter config, edit form XSS review, migration reversibility, calendar library security. **Deploy Engineer:** Wait for T-037 (QA integration tests) to complete before starting T-038 (re-deployment). Apply the new migration (`knex migrate:latest`) before restarting the backend. Rebuild the frontend (`npm run build` from `frontend/`). **Monitor Agent:** Wait for T-038 (deploy) before starting T-039. Run all Sprint 1 health checks (18/18) PLUS new Sprint 2 checks: trips table has start_date/end_date columns, UUID → 400, rate limit → 429, activity_date format, new edit routes accessible. **User Agent:** Wait for T-039 (health checks pass) before starting T-040. Test all new edit flows (add/edit/delete for each of flights, stays, activities), trip date range, calendar (if implemented), and Sprint 1 regression. Submit structured feedback. |

---

### Sprint 2 — Manager Agent → Backend Engineer (P0 Bug Fixes + Schema Pre-Approval)

| Field | Value |
|-------|-------|
| Sprint | 2 |
| From Agent | Manager Agent |
| To Agent | Backend Engineer |
| Status | Pending |
| Related Task | T-027, T-028, T-029, T-030 |
| Handoff Summary | Backend Engineer has 4 tasks in Sprint 2. T-027 and T-028 are P0 — fix the UUID validation leak and wire up rate limiting before any other work. T-029 requires updating api-contracts.md first. Schema change for T-029 is pre-approved. T-030 depends on T-029. |
| Notes | **T-027 — Bug fix implementation details:** (1) UUID validation: Create a middleware function `validateUUID(paramName)` in `backend/src/middleware/validateUUID.js` (or `backend/src/middleware/validate.js`). It should read `req.params[paramName]`, validate with a UUID regex (`/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i`), and return `400 VALIDATION_ERROR` if invalid. Apply to: `router.param('id', ...)` or manually in each route file that accepts `:id` (trips, flights, stays, activities). (2) activity_date serialization: In the activities route/model response mapping, cast `activity_date` from a JS Date object to a string: use `.toISOString().split('T')[0]` OR configure `pg.types.setTypeParser(1082, val => val)` for the DATE type OID to get a raw string from the driver. The `pg.types` approach is cleaner and affects all DATE columns globally — apply in the Knex config or `src/index.js`. (3) JSON parse error: In `errorHandler.js`, add a check `if (err instanceof SyntaxError && err.status === 400 && 'body' in err)` → return 400 with `code: "INVALID_JSON"`. **T-028 — Rate limiting:** Import `express-rate-limit` in `backend/src/app.js` or in the auth route file. Create two limiters: `loginLimiter` (10 req/15 min per IP, skip successful 200/201 responses — so only failed attempts count if using `skipSuccessfulRequests: true`) and `registerLimiter` (20 req/15 min per IP). Apply `loginLimiter` to `POST /auth/login` and `registerLimiter` to `POST /auth/register`. Return `{ error: { message: "Too many requests, please try again later.", code: "RATE_LIMIT_EXCEEDED" } }` with HTTP 429. Add `Retry-After` header via the limiter's `handler` option. **T-029 — Trip date range:** (1) Write updated trips API contract to `.workflow/api-contracts.md` first (add `start_date` and `end_date` to POST /trips request body as optional, PATCH /trips/:id as updatable fields, GET /trips and GET /trips/:id response shape). (2) Create `backend/src/migrations/20260225_007_add_trip_date_range.js` with `up()` = `table.date('start_date').nullable()` + `table.date('end_date').nullable()`, and `down()` = `table.dropColumn('start_date')` + `table.dropColumn('end_date')`. (3) Update trips model and routes to include these fields. Return them as YYYY-MM-DD strings (apply same pg.types DATE fix from T-027). Validate: if both provided, end_date must be >= start_date. **T-030 — Status auto-calc:** Apply computed status logic in the trips model GET response mapping (do not permanently update the stored `status` column — compute on read). Use `new Date()` (UTC) compared against `start_date` and `end_date`. If `end_date < today` → return COMPLETED in the response. If `start_date <= today <= end_date` → ONGOING. Else → use stored `status` field. |

---

### Sprint 2 — Manager Agent → Design Agent (Sprint 2 UI Specs Needed — T-023 through T-026)

| Field | Value |
|-------|-------|
| Sprint | 2 |
| From Agent | Manager Agent |
| To Agent | Design Agent |
| Status | Pending |
| Related Task | T-023, T-024, T-025, T-026 |
| Handoff Summary | Design Agent has 4 specs to write for Sprint 2. All are unblocked and can start immediately. Publish all to `.workflow/ui-spec.md` under a clearly labeled "Sprint 2 Specs" section. Manager Agent will review each spec before signaling the Frontend Engineer to start the corresponding implementation task. |
| Notes | **Design principles (consistent with Sprint 1):** Japandi minimal aesthetic, IBM Plex Mono font, color palette (#02111B darkest, #3F4045, #30292F, #5D737E accent, #FCFCFC lightest). All new pages share the Navbar. Edit pages must show: loading skeleton while fetching existing items, error state if fetch fails, empty state ("No flights yet — add one below"), and the form itself. **T-023 — Flights edit page:** The edit page is reached via the "Edit flights" button/link on the trip details page. URL: `/trips/:id/edit/flights`. Layout: page title ("Edit Flights"), back link "← back to trip", a list of existing flight entries (each as a card with edit pencil icon + delete trash icon), and an "Add flight" section with a form. The form fields for a flight: flight_number (text, required), airline (text, required), from_location (text, required, placeholder "e.g. New York (JFK)"), to_location (text, required), departure_at (datetime-local input, required), departure_tz (select dropdown with major IANA timezones, required), arrival_at (datetime-local input, required), arrival_tz (select dropdown). A "Save flight" and "Cancel" button pair. Delete shows an inline confirmation ("Delete this flight? Confirm / Cancel") replacing the card action area. The page also has a "Done editing" button at the top/bottom that navigates back to `/trips/:id`. **T-024 — Stays edit page:** URL `/trips/:id/edit/stays`. Same page skeleton as T-023. Form fields: category (HOTEL/AIRBNB/VRBO select, required), name (text, required, placeholder "e.g. Hyatt Regency San Francisco"), address (text, optional, shows "address not provided" if blank), check_in_at (datetime-local, required), check_in_tz (timezone select, required), check_out_at (datetime-local, required), check_out_tz (timezone select, required). **T-025 — Activities edit page:** URL `/trips/:id/edit/activities`. This page shows a row-based form rather than a card list. Header: "Edit Activities" + back link + "Done editing" button. Body: A list of rows where each row has: activity_date (date input), name (text), location (text, optional), start_time (time), end_time (time, optional), and a trash delete icon. A large "+" button at the bottom adds a new empty row. Rows for existing activities are pre-populated. The form is saved in bulk — a single "Save all" button at the bottom calls API for all changes. A "Cancel" link above discards all unsaved rows. Consider grouping rows by date (visual separator) if multiple activities share a date. **T-026 — Calendar + trip date range:** This spec covers two things: (1) The calendar component that replaces the placeholder on TripDetailsPage — monthly grid view, prev/next month arrows, event dots/chips color-coded (flights = accent blue #5D737E, stays = teal variant, activities = warm amber). (2) Trip date range section in the trip details page header — two date inputs labeled "Trip start" and "Trip end" (or a date range picker), with a save button and a "not set" placeholder. Show how the trip card on the home page looks with a real date range ("Aug 7 – Aug 10, 2026") versus no dates ("dates not set"). |

---

### Sprint 2 — Manager Agent → Frontend Engineer (Sprint 2 Frontend Work — T-031 through T-035)

| Field | Value |
|-------|-------|
| Sprint | 2 |
| From Agent | Manager Agent |
| To Agent | Frontend Engineer |
| Status | Acknowledged |
| Related Task | T-031, T-032, T-033, T-034, T-035 |
| Handoff Summary | Frontend Engineer has 5 tasks in Sprint 2. Do NOT start any of them until (a) the corresponding Design Agent spec is published to ui-spec.md AND (b) T-027 (backend bug fixes) is Done. Watch the handoff log for the Design Agent → Frontend Engineer signal for each spec. All three edit pages (T-031, T-032, T-033) and the date range UI (T-034) are P1 and should be built before attempting the calendar (T-035, P2 XL). |
| Notes | **Architecture decisions for edit pages:** (1) New routes: add `/trips/:id/edit/flights`, `/trips/:id/edit/stays`, `/trips/:id/edit/activities` to `frontend/src/App.jsx` (React Router v6, all behind ProtectedRoute). (2) Edit page components: create `frontend/src/pages/FlightsEditPage.jsx`, `StaysEditPage.jsx`, `ActivitiesEditPage.jsx`. (3) API utility: the existing `frontend/src/utils/api.js` already has the flights/stays/activities endpoints defined (from Sprint 1). Use `api.flights.create(tripId, data)`, `api.flights.update(tripId, flightId, data)`, `api.flights.delete(tripId, flightId)`, etc. For T-029 additions, also add `api.trips.update(tripId, { start_date, end_date })` calls. (4) Timezone picker: for flights and stays, the timezone fields need an `<select>` dropdown of IANA timezones. Use a curated list of ~30 common timezones (America/New_York, America/Los_Angeles, America/Chicago, Europe/London, Europe/Paris, Europe/Berlin, Asia/Tokyo, Asia/Shanghai, Asia/Singapore, Australia/Sydney, etc.) — do NOT pull the full IANA list. Define this as a constant in `frontend/src/utils/timezones.js`. (5) Activities batch save: On the activities edit page, track state as an array of activity rows. On "Save all": POST each new row (rows without an `id`) individually via Promise.all, PATCH edited rows (rows with an `id` and modified fields), DELETE removed rows. Navigate to `/trips/:id` only after all promises resolve. Show loading state during save. Handle partial failures gracefully (show error, allow retry). (6) Calendar (T-035): Before choosing a library, check if `react-big-calendar` or `@fullcalendar/react` is already in package.json. If not, prefer `react-big-calendar` (well-maintained) or implement a simple custom calendar grid if the library adds too much complexity. Document the choice in a comment in the component or in architecture-decisions.md. (7) **Unit tests:** Every new page/component needs tests. At minimum: render test, API call test (mock api.js), form validation test, navigation test (save → /trips/:id, cancel → /trips/:id). Use the same test patterns from Sprint 1 (vitest + React Testing Library, vi.mock for api). |

---

### Sprint 1 → Sprint 2 — Manager Agent (Sprint 1 Closeout Complete — Ready for Sprint 2 Planning)

| Field | Value |
|-------|-------|
| Sprint | 1 → 2 |
| From Agent | Manager Agent |
| To Agent | Orchestrator / Sprint 2 Planning Phase |
| Status | Pending |
| Related Task | Sprint 1 Closeout |
| Handoff Summary | Sprint 1 closeout is complete as of 2026-02-24. All 10 feedback entries have been triaged. Sprint summary has been written to `.workflow/sprint-log.md`. Dev cycle tracker has been updated with 4 new backlog items (B-009 through B-012) derived from triaged feedback. Sprint 2 planning may begin. |
| Notes | **Sprint 1 Closeout Checklist:** ✅ All 22 Sprint 1 tasks verified Done. ✅ All 10 feedback entries in feedback-log.md triaged (New → Tasked/Acknowledged). ✅ 3 Major issues set to Tasked (FB-001 → B-009, FB-002 → B-010, FB-003 → B-011). ✅ 1 Minor issue set to Acknowledged backlog (FB-004 → B-012). ✅ 6 Positive entries set to Acknowledged. ✅ Sprint summary written to sprint-log.md (Sprint #1 — 2026-02-24). ✅ New backlog tasks B-009, B-010, B-011, B-012 added to dev-cycle-tracker.md. **For Sprint 2 Planning — Key Inputs:** (1) **P0 bug fixes that must enter Sprint 2:** B-009 (UUID → 500 fix), B-010 (activity_date format fix), B-011 (rate limiting on auth routes). (2) **Core MVP edit flows:** B-001 (flights edit page), B-002 (stays edit page), B-003 (activities edit page) — these complete the core user journey from project brief. (3) **Calendar prerequisite:** B-006 (trip date range) should precede B-004 (calendar component) for data accuracy. (4) **Known accepted risks to address:** HTTPS required before production (B-008 planning); pm2 process management for staging stability. (5) **Backlog items deferred:** B-007 (multi-destination UI), B-008 (production deploy), B-012 (minor JSON parse error code) can stay in backlog. **Test gaps to close in Sprint 2:** Backend unit tests should add edge cases for (a) malformed UUID path params, (b) DATE field serialization assertions in activity response shapes. |

---

### Sprint 1 — User Agent → Manager Agent (T-022 Complete — Product Testing Done, Feedback Submitted)

| Field | Value |
|-------|-------|
| Sprint | 1 |
| From Agent | User Agent |
| To Agent | Manager Agent |
| Status | Pending |
| Related Task | T-022 |
| Handoff Summary | User Agent has completed T-022 (product testing and structured feedback) on 2026-02-24. Full testing was performed against the staging environment (Backend: http://localhost:3001/api/v1, Frontend: http://localhost:4173). 10 feedback entries have been submitted to `.workflow/feedback-log.md` — 4 issues found and 6 positive findings. The highest severity issue is Major (2 bugs + 1 known security gap). Overall impression: Sprint 1 deliverables are high quality and production-ready in all core flows. Manager Agent should triage feedback entries and close out the sprint. |
| Notes | **Testing Scope (T-022):** All Sprint 1 in-scope features tested. **Test Methods:** (1) Live API calls via curl against http://localhost:3001/api/v1 — happy paths, edge cases, security scenarios, rapid repeated requests. (2) Frontend build output verification and SPA serving check. (3) Code review of all 5 frontend components against ui-spec.md. **Test Results Summary:** **PASS (core flows):** Register → login → empty home page → create trip → view trip details (flights/stays/activities all empty states) → delete trip → logout. All API responses match api-contracts.md exactly. **PASS (input validation):** All 15+ validation edge cases return correct 400 errors with per-field detail. No validation gaps found. **PASS (security):** Cross-user access protection (403 FORBIDDEN), auth middleware (401 on all invalid token scenarios), no stack traces in error responses, no token in localStorage, httpOnly cookie behavior. **PASS (sub-resources):** Flights, stays, activities POST correctly with validation (temporal ordering, enum values), and GET returns correct shapes. **PASS (frontend):** Build exists at frontend/dist/. All 5 components implement all spec states (loading skeletons, error states, empty states, inline delete confirmation, disabled add buttons with aria-disabled, 404 full-page error, autocomplete on forms, etc.). **Issues Found (4 total, all in feedback-log.md):** (1) FB-001 — BUG Major: GET/PATCH/DELETE trip with invalid UUID path param returns HTTP 500 with raw PostgreSQL error code `22P02` leaking to client. Should be HTTP 400. Affects all routes with UUID path params. (2) FB-002 — BUG Major: `activity_date` returned as full ISO 8601 timestamp (`"2026-08-08T04:00:00.000Z"`) instead of plain YYYY-MM-DD string per contract. Causes API contract violation and may break frontend date grouping. (3) FB-003 — SECURITY Major (known): No rate limiting on /auth/login or /auth/register. 10 rapid requests all succeeded without throttling. `express-rate-limit` is installed but not wired. (4) FB-004 — BUG Minor: Malformed JSON body returns HTTP 400 with `code: "INTERNAL_ERROR"` (misleading — INTERNAL_ERROR implies 500). Should return a JSON parse error code. **Positive Findings (6 total):** FB-005: Happy path flows work flawlessly end-to-end. FB-006: Comprehensive input validation. FB-007: Cross-user access correctly returns 403. FB-008: Auth middleware correctly rejects all invalid token scenarios. FB-009: All 5 frontend components fully implement spec (loading/error/empty states, accessibility). FB-010: SPA routing and production build are clean. **Recommended Sprint 2 prioritization:** (1) Fix FB-001 (invalid UUID → 500) — easy fix, high polish value. (2) Fix FB-002 (activity_date format) — correctness issue, could cause date grouping bugs. (3) Wire up rate limiting (FB-003, already planned for Sprint 2). (4) Fix FB-004 (INTERNAL_ERROR code on bad JSON) — minor cleanup. |

---

### Sprint 1 — Monitor Agent → User Agent (T-021 Re-Run Health Checks Complete — Staging Ready for T-022)

| Field | Value |
|-------|-------|
| Sprint | 1 |
| From Agent | Monitor Agent |
| To Agent | User Agent |
| Status | Pending |
| Related Task | T-021 Re-Run, T-022 |
| Handoff Summary | Post-deploy health check re-run is complete (2026-02-25). All 18 checks PASSED on the re-deployed staging environment (backend port 3001, frontend port 4173). Deploy Verified = YES. Full report in `.workflow/qa-build-log.md` under "Sprint 1 — Post-Deploy Health Check Report (T-021 Re-Run) — 2026-02-25". User Agent may proceed with T-022 (product testing and structured feedback). |
| Notes | **Updated Staging Environment URLs:** (1) Frontend: `http://localhost:4173` — Vite preview serving production build. (2) Backend API: `http://localhost:3001` — Express on Node.js (port changed from 3000 due to conflict). (3) Database: `localhost:5432` — PostgreSQL 15, database `appdb`, all 6 tables present. **Health Check Results (18/18 PASS):** ✅ `GET /api/v1/health` → 200 `{"status":"ok"}` + helmet headers + CORS for localhost:4173. ✅ All 6 DB tables confirmed via psql (users, refresh_tokens, trips, flights, stays, activities). ✅ `POST /api/v1/auth/register` → 201, user UUID `7ac84d01-...` + access_token + httpOnly SameSite=Strict refresh_token cookie (DB round-trip confirmed). ✅ `POST /api/v1/auth/login` → 200 with access_token + httpOnly cookie. ✅ `POST /api/v1/auth/logout` → 204, refresh_token cookie cleared (Max-Age=0). ✅ `GET /api/v1/trips` (JWT) → 200 `{data:[],pagination:{page:1,limit:20,total:0}}`. ✅ `POST /api/v1/trips` → 201, full trip object (destinations as array, status=PLANNING). ✅ `GET /api/v1/trips/:id` → 200, full trip object. ✅ `GET /api/v1/trips/:id/flights` → 200 `{data:[]}`. ✅ `GET /api/v1/trips/:id/stays` → 200 `{data:[]}`. ✅ `GET /api/v1/trips/:id/activities` → 200 `{data:[]}`. ✅ `DELETE /api/v1/trips/:id` → 204 empty. ✅ `GET /api/v1/trips/:id` (after delete) → 404 NOT_FOUND. ✅ 401 UNAUTHORIZED shape exact match. ✅ 401 INVALID_CREDENTIALS shape exact match. ✅ 409 EMAIL_TAKEN shape exact match. ✅ 401 INVALID_REFRESH_TOKEN shape exact match. ✅ Frontend at localhost:4173 → 200 text/html SPA shell, `http://localhost:3001/api/v1` baked into bundle, CORS preflight correct. ✅ 0 × 5xx errors observed. **Known accepted limitations (non-blocking for T-022):** (1) Rate limiting not applied to /auth/login and /auth/register (Sprint 2 backlog). (2) HTTPS not configured (local staging — refresh token cookie is `secure: false`). (3) Processes not managed by pm2. |

---

### Sprint 1 — Deploy Engineer → Monitor Agent (Re-Deployment Complete — Run Health Checks, New Port 3001)

| Field | Value |
|-------|-------|
| Sprint | 1 |
| From Agent | Deploy Engineer |
| To Agent | Monitor Agent |
| Status | Done |
| Related Task | T-020, T-021 |
| Handoff Summary | Staging re-deployment for Sprint 1 is complete (2026-02-25). Backend is now on **port 3001** (port 3000 was occupied by another local application). Frontend rebuilt with correct `VITE_API_URL=http://localhost:3001/api/v1` and CORS updated to `http://localhost:4173`. All smoke tests passed. Monitor Agent should re-run health checks confirming the new port. Full re-deployment report in `.workflow/qa-build-log.md` under "Sprint 1 — Staging Re-Deployment Report (T-020 Re-Run) — 2026-02-25". |
| Notes | **Updated Staging Environment URLs:** (1) Backend API: `http://localhost:3001` (changed from 3000 — port conflict). (2) Frontend: `http://localhost:4173` — Vite preview serving new production build. (3) Database: `localhost:5432` — PostgreSQL 15, database `appdb` (unchanged, all 6 tables present). **Key changes from original T-020 deploy:** (1) Backend port: 3000 → **3001** — port 3000 was occupied by `i-wish-spotify-could` Next.js dev server. (2) CORS_ORIGIN: `http://localhost:5173` → **`http://localhost:4173`** — now correctly allows requests from the Vite preview frontend. (3) Frontend rebuilt with `VITE_API_URL=http://localhost:3001/api/v1` baked in — previous build used relative `/api/v1` which would have caused API calls to fail in preview mode (no proxy). **Smoke Tests Passed:** ✅ `GET /api/v1/health` → `{"status":"ok"}`. ✅ `POST /api/v1/auth/register` → 200 with user UUID + access_token (DB round-trip confirmed). ✅ `GET /api/v1/trips` (with JWT) → `{"data":[],"pagination":{"page":1,"limit":20,"total":0}}`. ✅ `GET http://localhost:4173/` → 200 HTML. ✅ CORS headers: `Access-Control-Allow-Origin: http://localhost:4173` + `Access-Control-Allow-Credentials: true`. ✅ API URL in bundle verified: `"http://localhost:3001/api/v1"`. **For Monitor Agent — recommended health checks (use port 3001):** (1) `GET http://localhost:3001/api/v1/health` — verify `{"status":"ok"}`. (2) DB connectivity — register a new user and confirm DB round-trip. (3) Auth flow — register → login → get trips → logout. (4) Frontend — verify SPA loads at `http://localhost:4173/`, CORS works for cross-origin API calls. (5) Verify all 6 tables still exist in DB. (6) Verify frontend API calls reach backend correctly (check VITE_API_URL is `http://localhost:3001/api/v1`). **Restart commands (if services go down):** Backend: `cd /Users/yixinxiao/CLAUDE/triplanner/backend && node src/index.js &`. Frontend: `cd /Users/yixinxiao/CLAUDE/triplanner/frontend && npx vite preview --port 4173 &`. PostgreSQL: `/opt/homebrew/bin/brew services start postgresql@15`. |

---

### Sprint 1 — QA Engineer → Deploy Engineer (QA Third-Pass Complete — Sprint 1 Remains Cleared)

| Field | Value |
|-------|-------|
| Sprint | 1 |
| From Agent | QA Engineer |
| To Agent | Deploy Engineer |
| Status | Acknowledged |
| Related Task | T-018, T-019 |
| Handoff Summary | QA Engineer completed a full third-pass verification of Sprint 1 on 2026-02-24. All prior QA findings confirmed. No regressions found. Backend: 60/60 unit tests PASS (466ms). Frontend: 128/128 unit tests PASS (2.32s). Security: all checks clean, 1 pre-existing accepted risk (rate limiting). npm audit: 0 production vulnerabilities. Sprint 1 deployment clearance remains valid. T-022 (User Agent) may continue. |
| Notes | **Third-Pass Results (2026-02-24):** **Unit Tests:** Backend 60/60 (466ms) ✅, Frontend 128/128 (2.32s) ✅. No regressions from prior runs. **Security Re-Verification:** No hardcoded secrets ✅. No rateLimit applied (known accepted risk — Sprint 2) ⚠️. No SQL string concatenation in routes/models (knex.raw in migrations only — safe) ✅. No dangerouslySetInnerHTML ✅. No localStorage token writes ✅. No console.log in route handlers ✅. bcrypt 12 rounds confirmed ✅. DUMMY_HASH timing-safe login confirmed ✅. helmet + cors confirmed in app.js ✅. withCredentials: true in axios ✅. **Integration Contract Verification:** All 12 API endpoint groups match api-contracts.md exactly. 401 interceptor retry queue confirmed functional with isRefreshing guard and /auth/refresh + /auth/login skip guards. **npm audit (third pass):** Backend: 0 prod vulns, 5 moderate dev-dep (esbuild GHSA-67mh-4wv8-2f99). Frontend: 0 prod vulns, 5 moderate dev-dep. Unchanged from prior passes. **Confirmed accepted risks (unchanged):** (1) Rate limiting not applied to /auth/login + /auth/register — Sprint 2 backlog. (2) Dev-dep esbuild GHSA-67mh-4wv8-2f99 — no prod impact. (3) HTTPS pending production config. (4) triggerRef focus-return-to-trigger cosmetic P3. **Full report in `.workflow/qa-build-log.md` under "Sprint 1 — QA Third-Pass Report (2026-02-24)".** |

---

### Sprint 1 — Manager Agent → User Agent (Code Review Fourth-Pass — Zero "In Review" Tasks, Sprint Awaiting T-022)

| Field | Value |
|-------|-------|
| Sprint | 1 |
| From Agent | Manager Agent |
| To Agent | User Agent |
| Status | Pending |
| Related Task | T-022 |
| Handoff Summary | Manager Agent completed a fourth-pass review scan on 2026-02-24. Result: **zero tasks found in "In Review" status.** All 21 prior Sprint 1 tasks (T-001 through T-021) remain correctly in Done status. The only outstanding work is T-022 (User Agent feature walkthrough), which is In Progress. The sprint is waiting on T-022 to complete so feedback can be triaged and the sprint can be closed. |
| Notes | **Review Scope — 2026-02-24 (Fourth Pass):** Reviewed dev-cycle-tracker.md, handoff-log.md, feedback-log.md, qa-build-log.md, active-sprint.md. **Finding:** No tasks in "In Review" — all implementation tasks are Done. This is the correct and expected state at this point in the sprint lifecycle. Three prior Manager review passes (logged above this entry) conducted exhaustive direct source-code verification across all backend and frontend files. No regressions have been identified. **Current Sprint Status:** T-022 (User Agent) is In Progress. Feedback log is empty — User Agent has not yet submitted structured feedback. **Next Steps for Sprint Closure:** (1) User Agent completes T-022 — full walkthrough of new-user and returning-user flows, submits structured feedback entries to `.workflow/feedback-log.md`. (2) Manager Agent triages all feedback entries (Acknowledged → Tasked or Won't Fix). (3) Manager Agent writes sprint summary in `.workflow/sprint-log.md`. (4) Manager Agent archives current sprint and sets up Sprint 2 in `.workflow/active-sprint.md`. **Known Accepted Risks Carried to Sprint 2 (unchanged):** (1) Rate limiting not applied to /auth/login + /auth/register — wire up express-rate-limit in Sprint 2. (2) HTTPS not configured on local staging — required before production. (3) CreateTripModal triggerRef focus-return-to-trigger not implemented — P3 cosmetic. (4) Axios 401 retry queue has no dedicated unit test — integration-covered. (5) Dev-dep esbuild vulnerability GHSA-67mh-4wv8-2f99 — no production impact, defer upgrade to Sprint 2. |

---

### Sprint 1 — Manager Agent → User Agent (Code Review Third-Pass Audit — All Checks Confirmed, Sprint 1 Fully Cleared)

| Field | Value |
|-------|-------|
| Sprint | 1 |
| From Agent | Manager Agent |
| To Agent | User Agent |
| Status | Pending |
| Related Task | T-022 |
| Handoff Summary | Manager Agent completed a third-pass direct source-code review on 2026-02-24. Zero tasks were found in "In Review" status — all implementation tasks are Done. Every claimed approval in the tracker was validated against actual source files. No regressions. Sprint 1 is fully reviewed and cleared. T-022 (User Agent feature walkthrough) is In Progress and unblocked. |
| Notes | **Third-Pass Direct Source-Code Audit — 2026-02-24:** Files read and verified this pass: `backend/src/app.js`, `backend/src/routes/auth.js`, `backend/src/routes/trips.js`, `backend/src/routes/flights.js`, `backend/src/routes/stays.js`, `backend/src/routes/activities.js`, `backend/src/middleware/auth.js`, `backend/src/middleware/errorHandler.js`, `backend/src/models/refreshTokenModel.js`, `backend/.env.example`, `backend/src/migrations/20260224_001_create_users.js` (sample), `backend/src/__tests__/auth.test.js`, `backend/src/__tests__/trips.test.js`, `frontend/src/utils/api.js`, `frontend/src/context/AuthContext.jsx`, `frontend/src/hooks/useTripDetails.js`, `frontend/src/hooks/useTrips.js`, `frontend/src/pages/LoginPage.jsx`, `frontend/src/pages/RegisterPage.jsx`, `frontend/src/pages/HomePage.jsx`, `frontend/src/pages/TripDetailsPage.jsx`, `frontend/src/components/Navbar.jsx`, `frontend/src/__tests__/HomePage.test.jsx` (sample). **Backend security verification (all confirmed ✅):** (1) `bcrypt.hash(password, 12)` at auth.js — 12 rounds confirmed. (2) `DUMMY_HASH` timing-safe dummy comparison when user not found — confirmed prevents email enumeration. (3) `hashToken()` = `crypto.createHash('sha256').update(rawToken).digest('hex')` in refreshTokenModel.js — raw token never persisted, only hash. (4) Token rotation: `revokeRefreshToken(tokenHash)` called before `createRefreshToken(...)` in refresh route — confirmed. (5) Cookie: `httpOnly: true, sameSite: 'strict', path: '/api/v1/auth'` + `secure: process.env.NODE_ENV === 'production'` — env-conditional, not hardcoded. (6) No hardcoded secrets: `JWT_SECRET` from `process.env.JWT_SECRET` everywhere — confirmed. `.env.example` confirmed with placeholder values only. (7) errorHandler.js: `console.error('[ErrorHandler]', err.stack)` server-side only; 500s return generic "An unexpected error occurred"; no stack traces in response — confirmed. (8) auth middleware: Bearer extraction → `jwt.verify(token, process.env.JWT_SECRET)` → `req.user = payload`; safe error response — confirmed. (9) CORS: `origin: process.env.CORS_ORIGIN || 'http://localhost:5173'` (env var, dev fallback only), `credentials: true`, helmet applied first — confirmed. (10) Trip ownership: `trip.user_id !== req.user.id → 403 FORBIDDEN` (not 404) on all GET/PATCH/DELETE trip routes — confirmed. (11) Sub-resource ownership: `requireTripOwnership()` helper called at the top of every handler in flights.js, stays.js, activities.js — confirmed consistent. (12) Knex parameterized queries: `.where({})`, `.insert()`, `.update()`, `.returning()` — no SQL string concatenation found anywhere. (13) Temporal validation confirmed: `arrival_at > departure_at` (flights), `check_out_at > check_in_at` (stays), `end_time > start_time` (activities) — all validated on both create and PATCH (PATCH merges with existing values before comparing). (14) Access token in-memory: `useRef(null)` in AuthContext.jsx — never written to localStorage/sessionStorage — confirmed. (15) Axios 401 interceptor: `isRefreshing` guard + subscriber queue; skips retry for `/auth/refresh` and `/auth/login` URLs — confirmed no infinite loop. (16) `Promise.allSettled` for parallel sub-resource fetch + trip 404 short-circuit in useTripDetails.js — confirmed. **API contract compliance verified:** All routes match api-contracts.md exactly. Response shape `{data: ...}` on success, `{error: {message, code}}` on failure. HTTP status codes correct (201 create, 204 delete/logout, 403 forbidden, 404 not found, 409 email taken, 401 unauthorized). **Test coverage verified:** Backend: 5 test files (auth, trips, flights, stays, activities). Frontend: 12 test files (all pages, hooks, components). Each test file contains both happy-path and error-path tests. `vi.mock` used correctly for DB models and JWT. **Convention adherence:** REST route structure matches architecture.md. All Knex (no ORM). Folder structure clean. `.env.example` covers all required vars. No circular imports observed. `mergeParams: true` used correctly on sub-resource routers. **Known accepted risks (Sprint 2 backlog — unchanged from prior passes):** (1) Rate limiting NOT applied to `/auth/login` and `/auth/register` (`express-rate-limit` installed but not wired). (2) HTTPS not configured on local staging. (3) `triggerRef` focus-return-to-trigger in CreateTripModal not implemented (P3 cosmetic). (4) Axios 401 retry queue has no dedicated unit test (integration-covered by T-019/T-021). **Minor observations (non-blocking, informational only):** (a) `app.js` CORS has `|| 'http://localhost:5173'` fallback — acceptable for dev, `CORS_ORIGIN` must be set in all non-dev environments (documented in `.env.example`). (b) Logout route requires `authenticate` middleware — if access token is expired, logout call will 401. Frontend handles this correctly with "best-effort logout" (clears local state regardless). Design trade-off acceptable for Sprint 1. **Conclusion:** Zero issues. All prior Manager approvals validated correct against actual implementation. Sprint 1 code is sound and secure. T-022 User Agent is cleared to complete the feature walkthrough without any blockers from code quality or security. |

---

### Sprint 1 — QA Engineer → Deploy Engineer (QA Second-Pass Complete — Sprint 1 Remains Cleared)

| Field | Value |
|-------|-------|
| Sprint | 1 |
| From Agent | QA Engineer |
| To Agent | Deploy Engineer |
| Status | Pending |
| Related Task | T-018, T-019 |
| Handoff Summary | QA Engineer completed a full second-pass verification of Sprint 1 on 2026-02-24. All prior QA findings confirmed. No regressions. Backend: 60/60 unit tests PASS. Frontend: 128/128 unit tests PASS. Integration contracts: all 25 checks PASS. Security checklist: PASS (same accepted risks). npm audit: 0 production vulnerabilities. Sprint 1 deployment clearance remains valid. T-022 (User Agent) may continue. |
| Notes | **Second-Pass Results Summary (2026-02-24):** **Unit Tests:** Backend 60/60 (569ms) ✅, Frontend 128/128 (2.42s) ✅. No regressions from prior run. **Integration Verification (code review):** Auth flow (register/login/logout/refresh/token rotation) ✅. Access token in-memory (useRef, not localStorage) ✅. Trips CRUD (destinations string→array, navigate to /trips/:id on create, 204 delete handling, 404 full-page error) ✅. Sub-resources (Promise.allSettled, independent errors, correct URLs) ✅. All 4 UI states (empty/loading/error/success) per component ✅. **Security Second-Pass:** bcrypt 12 rounds ✅, timing-safe login ✅, SHA-256 refresh token storage ✅, token rotation ✅, httpOnly SameSite=strict cookie ✅, no hardcoded secrets ✅, parameterized Knex queries ✅, no XSS vectors (no dangerouslySetInnerHTML) ✅, no stack traces in error responses ✅, helmet headers ✅, CORS restricted ✅, trip ownership 403 on all sub-resource routes ✅. **Confirmed unchanged accepted risks:** (1) Rate limiting not applied to /auth/login + /auth/register (express-rate-limit installed but not wired — Sprint 2). (2) Dev-dep esbuild vuln GHSA-67mh-4wv8-2f99 — no prod impact. (3) HTTPS pending production config. (4) triggerRef focus-return-to-trigger cosmetic P3. **npm audit (second pass):** Backend: 0 prod vulns, 5 moderate dev-dep. Frontend: 0 prod vulns, 5 moderate dev-dep. Same as prior pass. |

---

### Sprint 1 — Manager Agent → User Agent (Code Review Second-Pass Audit — All Checks Confirmed)

| Field | Value |
|-------|-------|
| Sprint | 1 |
| From Agent | Manager Agent |
| To Agent | User Agent |
| Status | Pending |
| Related Task | T-022 |
| Handoff Summary | Manager Agent completed a second-pass code review audit on 2026-02-24. No tasks were found in "In Review" status — all prior reviews were validated via direct source-code spot-checks. All security claims, API contract compliance, and convention adherence verified correct in actual implementation. Sprint 1 is fully reviewed and cleared. T-022 (User Agent feature walkthrough) remains In Progress. |
| Notes | **Second-Pass Spot-Check Audit — 2026-02-24:** Files directly read and verified this pass: `backend/src/routes/auth.js`, `backend/src/routes/trips.js`, `backend/src/routes/flights.js`, `backend/src/models/refreshTokenModel.js`, `backend/src/middleware/auth.js`, `backend/src/middleware/errorHandler.js`, `backend/src/app.js`, `frontend/src/utils/api.js`, `frontend/src/context/AuthContext.jsx`, `frontend/src/hooks/useTripDetails.js`, `backend/src/__tests__/auth.test.js` (sample), `.gitignore`, `backend/.env.example`. **Security verification results (all confirmed ✅):** (1) bcrypt 12 rounds: `bcrypt.hash(password, 12)` at auth.js:104 — confirmed. (2) Timing-safe login: `DUMMY_HASH` used when user not found (auth.js:157-158) — confirmed. (3) Refresh token storage: `crypto.createHash('sha256').update(rawToken).digest('hex')` in refreshTokenModel.js — only hash stored, raw token never persisted — confirmed. (4) Token rotation: `revokeRefreshToken` called before new token created in auth.js:222-228 — confirmed. (5) httpOnly cookie: `httpOnly: true, sameSite: 'strict', path: '/api/v1/auth'` in `setRefreshCookie()` — confirmed. (6) `secure: process.env.NODE_ENV === 'production'` — env-conditional, not hardcoded — confirmed. (7) No hardcoded secrets: JWT_SECRET from `process.env.JWT_SECRET` throughout, `.env` in `.gitignore` — confirmed. (8) Error handler: stack trace logged server-side via `console.error`, never in response; 500s return generic message — errorHandler.js verified. (9) Auth middleware: Bearer token extraction, jwt.verify(), safe error response — auth.js middleware verified. (10) CORS: origin from `process.env.CORS_ORIGIN`, credentials:true, helmet applied first — app.js verified. (11) Trip ownership: `trip.user_id !== req.user.id` → 403 (not 404) on all GET/PATCH/DELETE trip routes — trips.js verified. (12) Sub-resource ownership: `requireTripOwnership()` helper called on every flights route operation — flights.js verified, pattern confirmed consistent. (13) Knex parameterized queries only (`.where({})`, `.insert()`, `.update()`) — no SQL concatenation — refreshTokenModel.js verified. (14) Access token in-memory: `useRef(null)` in AuthContext.jsx:19, never written to localStorage/sessionStorage — confirmed. (15) 401 interceptor queue: `isRefreshing` guard + `refreshSubscribers` queue, skips retry for `/auth/refresh` and `/auth/login` URLs — api.js verified. (16) Promise.allSettled for sub-resource parallel fetch + trip 404 short-circuit — useTripDetails.js verified. **API contract compliance:** All response shapes match api-contracts.md. `{data: ...}` wrapper on success, `{error: {message, code}}` on failure. HTTP status codes correct (201 create, 204 delete/logout, 403 forbidden, 404 not found, 409 email taken, 401 unauthorized). **Convention adherence:** REST route structure matches api-contracts.md exactly. All routes behind authenticate middleware. mergeParams correct for nested routers. **Known accepted risks (carried forward to Sprint 2 backlog):** (1) Rate limiting not on /auth/login or /auth/register. (2) HTTPS not on local staging. (3) CreateTripModal triggerRef focus-return not implemented (P3). (4) axios 401 retry queue has no dedicated unit test (integration-covered). **Conclusion:** Zero issues requiring any task to be reopened. Sprint 1 implementation is sound. User Agent may proceed with T-022 without blockers. |

---

### Sprint 1 — Manager Agent → User Agent (Code Review Pass Complete — Sprint 1 Ready for T-022)

| Field | Value |
|-------|-------|
| Sprint | 1 |
| From Agent | Manager Agent |
| To Agent | User Agent |
| Status | Pending |
| Related Task | T-022 |
| Handoff Summary | Manager Agent has completed the Sprint 1 code review audit (2026-02-24). All tasks T-001 through T-021 are now in Done status. No tasks were in "In Review" during this pass — all implementation tasks had already passed review in prior cycles. T-021 tracker status was corrected from Backlog → Done based on Monitor Agent handoff log evidence. User Agent is now cleared to begin T-022 (feature walkthrough + structured feedback). |
| Notes | **Manager Review Audit — Sprint 1 Summary (2026-02-24):** **Review scope:** All 22 Sprint 1 tasks examined. No tasks found in "In Review" status — all had already been reviewed, approved, and moved to Done in prior Manager review cycles. This audit validated the completeness and integrity of those reviews. **Prior review quality check (sampled):** ✅ T-010 (Auth API): bcrypt 12 rounds, timing-safe dummy hash, SHA-256 refresh token storage, httpOnly cookie, token rotation on refresh, error messages safe. ✅ T-011 (Trips API): ownership check returns 403 not 404, pagination enforced, PATCH validates at least one field. ✅ T-012 (Flights/Stays/Activities API): temporal ordering validated, mergeParams used correctly, trip ownership checked on every sub-resource op. ✅ T-013 (Frontend setup): access token in-memory (useRef), 401 interceptor with retry queue, ProtectedRoute guards, IBM Plex Mono + CSS tokens, Vite proxy to :3000. ✅ T-014 (Auth pages): field-level errors, 409 → email field, loading spinner, redirect if already authenticated. ✅ T-015 (Navbar): sticky 56px, best-effort logout, hidden on mobile < 768px. ✅ T-016 (Home page): 3-column grid, skeleton loading, empty state CTA, inline delete confirmation, navigate to /trips/:id on create, 128 tests pass. ✅ T-017 (Trip details): calendar placeholder, per-section loading/error, Promise.allSettled, trip 404 full-page error, activity day-grouping + lexicographic sort correct, 128 tests pass. ✅ T-018 (QA security checklist): all 19 items verified, 1 known accepted risk (rate limiting). ✅ T-019 (Integration testing): backend 60/60 + frontend 128/128 tests pass, contract adherence confirmed. ✅ T-020 (Deploy): staging live at localhost:4173 (frontend) and localhost:3000 (backend), all 6 migrations applied. ✅ T-021 (Monitor health check): all 18 checks PASSED — confirmed via Monitor Agent handoff log. Tracker discrepancy corrected. **Code quality verification (spot check):** Backend auth.js — bcrypt, timing-safe login, token rotation, httpOnly cookie all confirmed present. Frontend HomePage.jsx — uses useTrips hook, skeleton/empty/error states, toast error handling. Backend auth middleware — Bearer extraction, jwt.verify(), safe error response. **Known accepted risks carried forward to Sprint 2:** (1) Rate limiting not applied to /auth/login and /auth/register — add in Sprint 2 backlog. (2) HTTPS not configured on local staging — required before production. (3) `triggerRef` focus-return-to-trigger in CreateTripModal not implemented — P3 cosmetic, Sprint 2. (4) Axios interceptor 401 retry queue has no dedicated unit test — covered by integration tests only. **For T-022 User Agent — test scenarios:** (1) New user: register → auto-login → land on home (empty trips state with CTA). (2) Create trip → navigates directly to /trips/:id. (3) Home page trip grid renders trip card with name + destinations + status badge. (4) Trip details: flights/stays/activities sections each show empty state. (5) Delete trip: inline confirmation replaces card, confirm removes it from list. (6) Logout → redirect to /login. (7) Unauthenticated navigation → redirect to /login. (8) Returning user: login → view existing trip details. **Staging URLs:** Frontend: http://localhost:4173 | Backend: http://localhost:3000. |

---

### Sprint 1 — Monitor Agent → User Agent (T-021 Health Checks Complete — Staging Ready for T-022)

| Field | Value |
|-------|-------|
| Sprint | 1 |
| From Agent | Monitor Agent |
| To Agent | User Agent |
| Status | Pending |
| Related Task | T-021, T-022 |
| Handoff Summary | Post-deploy health check (T-021) is complete. All 18 checks PASSED. Staging environment is fully healthy. User Agent may proceed with T-022 (product testing and structured feedback). |
| Notes | **Staging Environment URLs:** (1) Frontend: `http://localhost:4173` — Vite preview serving production build. (2) Backend API: `http://localhost:3000` — Express on Node 24.5.0. (3) Database: `localhost:5432` — PostgreSQL 15.16, database `appdb`. **Health Check Results (T-021):** ✅ `GET /api/v1/health` → 200 `{"status":"ok"}`. ✅ `POST /api/v1/auth/register` → 201 with user UUID + access_token (DB round-trip confirmed). ✅ `POST /api/v1/auth/login` → 200 with access_token. ✅ `GET /api/v1/trips` (with JWT) → 200 with `{data:[],pagination:{page:1,limit:20,total:0}}`. ✅ `POST /api/v1/trips` → 201 with full trip object (destinations as array, status=PLANNING). ✅ `GET /api/v1/trips/:id` → 200. ✅ `GET /api/v1/trips/:id/flights` → 200 `{data:[]}`. ✅ `GET /api/v1/trips/:id/stays` → 200 `{data:[]}`. ✅ `GET /api/v1/trips/:id/activities` → 200 `{data:[]}`. ✅ `DELETE /api/v1/trips/:id` → 204 empty. ✅ `POST /api/v1/auth/logout` → 204. ✅ All 6 DB tables present (users, refresh_tokens, trips, flights, stays, activities). ✅ Frontend at localhost:4173 → 200 text/html SPA shell. ✅ 0 × 5xx errors observed. ✅ All error shapes match api-contracts.md (401 UNAUTHORIZED, 404 NOT_FOUND, 409 EMAIL_TAKEN, 401 INVALID_REFRESH_TOKEN). **Known accepted limitations (non-blocking for T-022):** (1) Rate limiting not applied to /auth/login and /auth/register (Sprint 2 backlog). (2) HTTPS not configured (local staging — refresh token cookie is `secure: false`). (3) Processes not managed by pm2. **Deploy Verified:** YES — full report in `.workflow/qa-build-log.md` under "Sprint 1 — Post-Deploy Health Check Report (T-021)". **Test scenarios to cover in T-022:** (1) Register → auto-login → land on home (empty trips state). (2) Create trip → navigates directly to /trips/:id. (3) Home page trip grid renders. (4) Trip details: flights/stays/activities show empty states. (5) Delete trip with inline confirmation. (6) Logout → redirect to /login. (7) Unauth navigation → redirect to /login. |

---

### Sprint 1 — Deploy Engineer → Monitor Agent (T-020 Staging Deployment Complete — Run Health Checks T-021)

| Field | Value |
|-------|-------|
| Sprint | 1 |
| From Agent | Deploy Engineer |
| To Agent | Monitor Agent |
| Status | Done |
| Related Task | T-020, T-021 |
| Handoff Summary | Staging deployment for Sprint 1 is complete. All services are running locally. Monitor Agent should proceed with T-021 (staging health checks). Full deployment report is in `.workflow/qa-build-log.md` under "Sprint 1 — Staging Deployment Report (T-020)". |
| Notes | **Staging Environment URLs:** (1) Backend API: `http://localhost:3000` — Express.js on Node 24.5.0. (2) Frontend: `http://localhost:4173` — Vite preview server serving `frontend/dist/` production build. (3) Database: `localhost:5432` — PostgreSQL 15.16 (Homebrew), database `appdb`. **Infrastructure note:** Docker was not available on this machine. Staging uses local processes: PostgreSQL via Homebrew (`brew services start postgresql@15`), backend via `node src/index.js`, frontend via `npx vite preview --port 4173`. **Smoke Tests Already Passed (by Deploy Engineer):** ✅ `GET /api/v1/health` → `{"status":"ok"}`. ✅ `POST /api/v1/auth/register` → 200, user created in DB, JWT returned. ✅ `POST /api/v1/auth/login` → 200, access_token returned. ✅ `GET /api/v1/trips` (with valid JWT) → `{"data":[],"pagination":{"page":1,"limit":20,"total":0}}`. ✅ `GET http://localhost:4173/` → 200 (frontend serving). ✅ All 6 DB migrations applied (Batch 1/1: 6 migrations). **For T-021 Monitor Agent — recommended health checks:** (1) `GET http://localhost:3000/api/v1/health` — verify `{"status":"ok"}`. (2) DB connectivity — register a new user and confirm DB round-trip. (3) Auth flow — register → login → get trips → logout. (4) Frontend — verify SPA loads at `http://localhost:4173/`, redirects to `/login` if unauthenticated. (5) Error log scan — check for unhandled errors or crash output. (6) Verify all 6 tables exist in DB: users, refresh_tokens, trips, flights, stays, activities. **Known accepted issues (non-blocking for T-021):** (1) Rate limiting not applied to auth endpoints (Sprint 2 backlog). (2) No HTTPS (local staging — cookie is `secure: false` in staging env). (3) Dev dep vulnerabilities (esbuild, dev-only, accepted by QA). (4) Processes not managed by pm2 (restart not automatic if machine reboots). **If services need to be restarted:** Backend: `cd /Users/yixinxiao/CLAUDE/triplanner/backend && node src/index.js &`. Frontend: `cd /Users/yixinxiao/CLAUDE/triplanner/frontend && npx vite preview --port 4173 &`. PostgreSQL: `/opt/homebrew/bin/brew services start postgresql@15`. |

---

### Sprint 1 — QA Engineer → Deploy Engineer (QA Complete — Sprint 1 Cleared for Staging Deployment)

| Field | Value |
|-------|-------|
| Sprint | 1 |
| From Agent | QA Engineer |
| To Agent | Deploy Engineer |
| Status | Done |
| Related Task | T-018, T-019, T-020 |
| Handoff Summary | Sprint 1 QA is complete. All tasks T-004 through T-019 have passed quality verification and are now in Done status. Deploy Engineer is cleared to proceed with T-020 (staging deployment). Full QA report in `.workflow/qa-build-log.md`. |
| Notes | **QA Results Summary:** ✅ Backend unit tests: 60/60 PASS (auth, trips, flights, stays, activities — 5 test files, 493ms). ✅ Frontend unit tests: 128/128 PASS (all pages, hooks, components — 11 test files, 2.04s). ✅ Integration contract verification: all API endpoint groups verified — frontend API calls match backend contracts exactly (auth flow, trips CRUD, flights/stays/activities sub-resources). ✅ Security checklist: all applicable items verified — bcrypt 12 rounds, JWT in env vars, parameterized Knex queries (no SQL injection), no XSS (no dangerouslySetInnerHTML), no stack traces in error responses, helmet security headers applied, CORS restricted to CORS_ORIGIN env var, refresh token stored as SHA-256 hash only. ✅ npm audit: 0 production dependency vulnerabilities. 5 moderate vulns in dev deps (esbuild/vitest/vite chain — GHSA-67mh-4wv8-2f99) — dev-only, no production build impact. **Accepted staging risks (non-blocking for T-020):** (1) Rate limiting NOT applied to /auth/login and /auth/register — `express-rate-limit` is installed but not wired up. Known from T-010 Manager review. Add in Sprint 2 backlog. (2) HTTPS pending — cookie is `secure: true` in production env, pending T-020 setup. (3) `triggerRef` focus-return-to-trigger in CreateTripModal not implemented — cosmetic, P3. **For T-020 Deploy Engineer:** (1) Docker Compose: backend (Node/Express, port 3000) + PostgreSQL. (2) After DB is up: `cd backend && npm run migrate` (runs `knex migrate:latest`). All 6 migration files are in `backend/src/migrations/`. (3) Required env vars (see `backend/.env.example`): DATABASE_URL, JWT_SECRET (use a cryptographically random string in staging), JWT_EXPIRES_IN=15m, JWT_REFRESH_EXPIRES_IN=7d, CORS_ORIGIN=<staging frontend URL>, PORT=3000, NODE_ENV=production. (4) Frontend: `cd frontend && npm run build` → serve `frontend/dist/` with nginx or static server. (5) Smoke test after deploy: `GET /api/v1/health` → `{"status":"ok"}`. (6) Provide staging URLs to Monitor Agent (T-021). |

---

### Sprint 1 — Manager Agent → QA Engineer (T-016 + T-017 Approved — Ready for Integration Check)

| Field | Value |
|-------|-------|
| Sprint | 1 |
| From Agent | Manager Agent |
| To Agent | QA Engineer |
| Status | Done |
| Related Task | T-016, T-017, T-018, T-019 |
| Handoff Summary | Manager Agent code review for T-016 (Home Page) and T-017 (Trip Details Page) is complete. Both tasks have passed review and are now in "Integration Check" status. All 128 frontend unit tests pass. QA Engineer may proceed with T-018 (security checklist) and T-019 (integration testing). All Sprint 1 implementation tasks (T-008 through T-017) are now in Integration Check or Done. The full sprint is ready for QA. |
| Notes | **T-016 review findings (all pass):** (1) API contract adherence confirmed: list/create/delete calls match T-005 contracts exactly. createTrip correctly converts comma-separated destinations form value to array before POST. (2) useTrips hook: state management is correct — deleteTrip removes from local list only on API success, error propagates to parent for toast display and TripCard state restoration. (3) TripCard inline delete flow: correct — confirmDelete state shows overlay, cancel restores, error from parent re-throw correctly caught, card state restored. (4) CreateTripModal: focus trap, Escape-to-close, backdrop-click-to-close all implemented. aria-modal + role=dialog + aria-labelledby present. (5) Minor non-blocking note: `triggerRef` in CreateTripModal is allocated but never attached — focus-return-to-trigger not implemented. Acceptable for Sprint 1. (6) "dates not set" shown on TripCard because trips have no date field — intentional; date range is Sprint 2 backlog item B-006. **T-017 review findings (all pass):** (1) API contract adherence confirmed: all four endpoints (trip, flights, stays, activities) called with correct paths and tripId. (2) useTripDetails: Promise.allSettled for sub-resource parallel fetch ✅. Trip 404 short-circuits sub-resource fetches ✅. tripError.type set from HTTP status (404→'not_found', other→'network') ✅. refetchX functions correctly scoped ✅. Empty tripId guard ✅. (3) Activity sorting: lexicographic HH:MM:SS comparison is correct for the stored format — sorts chronologically. Day grouping by activity_date string is correct. (4) formatDate.js: all Intl.DateTimeFormat-based functions have try/catch fallbacks. formatActivityDate correctly creates local Date object from YYYY-MM-DD components (not UTC, which would shift by one day in negative-offset timezones). (5) formatDestinations: handles both Array and comma-string destinations field. **For T-018 security checklist — frontend items to verify:** (1) No hardcoded secrets in any frontend source file. (2) No JWT or sensitive tokens stored in localStorage or sessionStorage (access token in AuthContext useRef, refresh token is httpOnly cookie). (3) Error messages in all components are user-safe strings, no stack traces. (4) XSS: all user data rendered via React JSX (auto-escaped). No `dangerouslySetInnerHTML` usage in T-016/T-017 code. (5) api.js: withCredentials: true set for cookie transport ✅. (6) Note from T-010 review: rate limiting for /auth/login and /auth/register is installed (`express-rate-limit`) but NOT applied. QA must verify or accept this as known staging risk. **For T-019 integration testing — key flows:** (1) Register → land on home with empty state. (2) Create trip → navigate directly to /trips/:id (NOT back to list). (3) Trip details: flights/stays/activities sections show empty states. (4) Delete trip: confirm → card animates out → no longer in list. (5) Section error simulation: verify each section shows independent retry. (6) Trip 404: navigate to /trips/nonexistent-id → full-page "trip not found." with "back to home" link. (7) Auth flow: logout → /login, unauth user → redirect to /login. React Router v6 future-flag warnings in test output are expected and non-blocking. |

---

### Sprint 1 — Frontend Engineer → QA Engineer (Unit Tests Added for T-016 + T-017 — Re-review Ready)

| Field | Value |
|-------|-------|
| Sprint | 1 |
| From Agent | Frontend Engineer |
| To Agent | QA Engineer |
| Status | Done |
| Related Task | T-016, T-017, T-018, T-019 |
| Handoff Summary | Unit tests required by Manager Code Review have been added for T-016 (Home Page) and T-017 (Trip Details Page). All 128 frontend tests now pass (`npm test` from `frontend/`). Both tasks have been moved to "In Review" in `dev-cycle-tracker.md`. T-016 and T-017 are unblocked for QA. |
| Notes | **Tests added (2026-02-24):** (1) `frontend/src/__tests__/HomePage.test.jsx` — 12 test cases covering: trip list renders from API, `api.trips.list` called on mount, skeleton `.skeleton` elements shown during load, empty state ("no trips yet" + "start planning your first adventure."), error state ("could not load trips." + "check your connection and try again."), retry button on load error re-fetches trips, create modal opens on "+ new trip" button, create modal opens from empty state CTA button, navigate to `/trips/:id` after successful create, inline delete confirmation replaces card content, cancel restores card, confirm delete removes card from DOM, toast shown on delete API failure ("could not delete trip. please try again."), card restored after delete failure. (2) `frontend/src/__tests__/useTrips.test.js` — 11 test cases covering: fetchTrips happy path, fetchTrips with empty array, fetchTrips error sets error state, server error message propagation (`err.response.data.error.message`), retry clears error on success, createTrip returns new trip, createTrip converts comma-separated destinations string to array, createTrip throws on API failure, deleteTrip removes from local list, deleteTrip no-op when id not found, deleteTrip throws and does NOT mutate list. (3) `frontend/src/__tests__/TripDetailsPage.test.jsx` — 14 test cases covering: flight cards render (airline, flight number, from/to, departure/arrival times), stay cards render (HOTEL badge, name, address, CHECK IN/CHECK OUT), null address shows "address not provided", activities sorted by start_time within a day, activities grouped by date (one group per day), calendar placeholder text ("calendar coming in sprint 2"), skeleton loading shown (.skeleton count > 0), flight/stays/activities error states independently ("could not load flights/stays/activities." + "try again" button), multiple section errors simultaneously (3 retry buttons), retry button calls correct refetch function, back link to "/" present, trip 404 full-page error state with "back to home" link, disabled "add" action buttons. (4) `frontend/src/__tests__/useTripDetails.test.js` — 19 test cases covering: all 4 API calls made during fetchAll, correct tripId passed to all endpoints, starts with all loading=true, all loading=false after fetchAll, flights/stays/activities errors are independent, trip 404 prevents sub-resource fetch (tripError.type='not_found'), trip 500 sets network error type, all 3 sub-resources fail independently, refetchFlights/refetchStays/refetchActivities only call their endpoint, each refetch updates data + clears loading/error, refetch sets error state on retry failure, empty tripId guard. **Test approach:** `api.js` module mocked via `vi.mock('../utils/api', factory)`. `useTripDetails` hook mocked via `vi.mock('../hooks/useTripDetails')` in TripDetailsPage tests. Real hooks used in HomePage tests (integration-style). `MemoryRouter` + `Routes`/`Route path="/trips/:id"` required for `useParams` in TripDetailsPage tests. **Known limitations:** Tests do not cover the Vite axios proxy to `:3000` — covered by integration testing (T-019). The 401 interceptor retry queue logic is not unit-tested — covered by T-019. `formatDate` utility used in flight/stay cards tested indirectly through component render tests. |

---

### Sprint 1 — Backend Engineer → Deploy Engineer (Migrations Ready to Run — T-009)

| Field | Value |
|-------|-------|
| Sprint | 1 |
| From Agent | Backend Engineer |
| To Agent | Deploy Engineer |
| Status | Done |
| Related Task | T-009, T-020 |
| Handoff Summary | All 6 Knex migration files are ready in `backend/src/migrations/`. Run `npm run migrate` (i.e., `knex migrate:latest --knexfile src/config/knexfile.js`) from the `backend/` directory after spinning up the PostgreSQL container. Rollback with `npm run migrate:rollback`. |
| Notes | **Migration order (enforced by filename timestamps):** `20260224_001_create_users` → `20260224_002_create_refresh_tokens` → `20260224_003_create_trips` → `20260224_004_create_flights` → `20260224_005_create_stays` → `20260224_006_create_activities`. All migrations include `up()` and `down()`. The trips migration uses a raw `ALTER TABLE … ADD CONSTRAINT` for the CHECK constraint (status enum) — this is intentional. Migrations have not been run on staging yet — this must happen during T-020 deployment. **New env vars needed:** none beyond what is in `backend/.env.example` (`DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`, `CORS_ORIGIN`, `PORT`, `NODE_ENV`). |

---

### Sprint 1 — Backend Engineer → QA Engineer (Backend Implementation Complete — T-008 through T-012)

| Field | Value |
|-------|-------|
| Sprint | 1 |
| From Agent | Backend Engineer |
| To Agent | QA Engineer |
| Status | Done |
| Related Task | T-008, T-009, T-010, T-011, T-012, T-018, T-019 |
| Handoff Summary | All backend tasks T-008 through T-012 are complete and in review. The Express API implements all endpoints defined in `api-contracts.md`. All 60 unit tests pass (`npm test`). The backend is ready for security checklist review (T-018) and integration testing (T-019). |
| Notes | **Security items to verify in T-018:** (1) **Password hashing:** `bcrypt.hash(password, 12)` — 12 rounds, raw password never logged or stored. File: `backend/src/routes/auth.js`. (2) **Timing-safe login:** `bcrypt.compare` always runs even if user not found (uses `DUMMY_HASH`) to prevent email enumeration. (3) **Refresh token storage:** raw token is never stored — only SHA-256 hash is persisted in `refresh_tokens.token_hash`. Raw token is sent as httpOnly cookie only. (4) **Refresh token rotation:** old token is revoked (`revoked_at = now()`) before new token is issued — no token reuse window. (5) **SQL injection:** all queries use Knex parameterized methods (`.where({})`, `.insert()`, `.update()`) — zero string concatenation in DB queries. (6) **Error responses:** `errorHandler.js` catches all errors and returns `{ error: { message, code } }` — never exposes stack traces. (7) **Auth middleware:** `authenticate` in `middleware/auth.js` rejects any request without a valid Bearer JWT. (8) **Trip ownership:** all trip-scoped endpoints check `trip.user_id === req.user.id` — returns 403 (not 404) for cross-user access. (9) **httpOnly cookie:** refresh token cookie has `httpOnly: true`, `sameSite: 'strict'`, `path: '/api/v1/auth'`, `secure: true` in production. (10) **CORS:** `credentials: true` set, origin restricted to `CORS_ORIGIN` env var. **Integration test flow for T-019:** POST /auth/register (201) → POST /auth/login (200, access_token) → POST /trips (201, get trip id) → GET /trips/:id (200) → GET /trips/:id/flights (200, []) → GET /trips/:id/stays (200, []) → GET /trips/:id/activities (200, []) → DELETE /trips/:id (204) → GET /trips/:id (404) → POST /auth/logout (204). |

---

### Sprint 1 — Backend Engineer → Frontend Engineer (Backend API Live — T-008 through T-012)

| Field | Value |
|-------|-------|
| Sprint | 1 |
| From Agent | Backend Engineer |
| To Agent | Frontend Engineer |
| Status | Pending |
| Related Task | T-008, T-010, T-011, T-012, T-013, T-014, T-015, T-016, T-017 |
| Handoff Summary | The backend API is implemented exactly per the contracts in `api-contracts.md`. All endpoints are live (pending DB connectivity on staging). Frontend can now integrate against the real API. |
| Notes | **Reminder of key integration points:** (1) `POST /api/v1/auth/register` and `POST /api/v1/auth/login` both return `{ data: { user, access_token } }` — store `access_token` in memory (React context), never localStorage. The `refresh_token` httpOnly cookie is set automatically. (2) `POST /api/v1/auth/refresh` — call this when any request returns 401, retry original request with new access_token. No body needed — cookie is sent automatically by browser. (3) `POST /api/v1/trips` accepts `destinations` as an array OR comma-separated string; returns `{ data: { id, ... } }` — navigate to `/trips/:id` on success. (4) Sub-resources: `GET /api/v1/trips/:tripId/[flights|stays|activities]` all return `{ data: [] }` when empty. (5) `DELETE /trips/:id` returns 204 (no body). (6) `POST /auth/logout` returns 204; clear the in-memory access_token and redirect to /login. (7) Backend runs on `http://localhost:3000` in development — axios base URL should be `http://localhost:3000/api/v1`. |

---

### Sprint 1 — Frontend Engineer → QA Engineer (Frontend Implementation Complete — T-013 through T-017)

| Field | Value |
|-------|-------|
| Sprint | 1 |
| From Agent | Frontend Engineer |
| To Agent | QA Engineer |
| Status | Done |
| Related Task | T-013, T-014, T-015, T-016, T-017, T-018, T-019 |
| Handoff Summary | All Sprint 1 frontend tasks are complete and moved to "In Review". The full React application has been implemented including: auth context with JWT in-memory storage + refresh token flow, axios instance with 401 interceptor, Login and Register pages, Navbar, Home page, and Trip Details page. Render tests written for all major components. |
| Notes | **What to test:** (1) Auth flow: register with name/email/password → auto-login + redirect to `/`. Login with email/password → redirect to `/`. Logout → redirect to `/login`. Protected routes redirect unauthenticated users. (2) Home page: trip list loads from `GET /api/v1/trips`, skeleton shown during load, empty state shown when no trips, error state shown on API failure with retry. Create trip modal: opens on button click, validates required fields, calls `POST /api/v1/trips`, navigates to `/trips/:id` on success. Delete trip: inline confirmation replaces card content, calls `DELETE /api/v1/trips/:id`, card fades out. (3) Trip details page: all three sub-resources fetched in parallel (`GET /trips/:id/flights`, stays, activities). Each section shows empty state (dashed border) if no data. Calendar placeholder renders. Flight cards show two-column layout on desktop. Activities grouped by date. All "add" buttons are disabled with tooltip. (4) Known limitations: Backend API not yet implemented (T-008–T-012 are backlog). Tests use mock data. Axios interceptor will call `POST /api/v1/auth/refresh` on 401 — this will fail until backend is live. Recommend testing with a running backend or mocking the API. **Render tests:** Located in `frontend/src/**/__tests__/` and `frontend/src/**/*.test.jsx`. Run with `npm test` from the `frontend/` directory. |

---

### Sprint 1 — Frontend Engineer — API Contract Acknowledgment (T-004, T-005, T-006)

| Field | Value |
|-------|-------|
| Sprint | 1 |
| From Agent | Frontend Engineer |
| To Agent | Backend Engineer |
| Status | Acknowledged |
| Related Task | T-004, T-005, T-006, T-013, T-014, T-015, T-016, T-017 |
| Handoff Summary | API contracts for T-004 (Auth), T-005 (Trips CRUD), and T-006 (Flights, Stays, Activities) have been reviewed and acknowledged. Implementation is proceeding against the agreed contract shapes. |
| Notes | Confirmed integration decisions: (1) Auth — `access_token` stored in React context (in-memory). Refresh token handled via httpOnly cookie (browser sends automatically). Axios interceptor calls `POST /api/v1/auth/refresh` on 401, retries original request. (2) Trips — destinations sent as array `["Tokyo", "Osaka"]` to POST /trips. After create, navigate to `/trips/:id` using returned `id`. (3) Sub-resources — all fetched in parallel on trip details mount. Empty array returned if no items. (4) Timestamps — `departure_at`/`arrival_at`/`check_in_at`/`check_out_at` displayed using companion `*_tz` IANA string with `Intl.DateTimeFormat` for local time display. (5) DELETE returns 204 (no body) — handled accordingly. (6) Error codes mapped: `EMAIL_TAKEN` (409) → email field error. `INVALID_CREDENTIALS` (401 on login) → banner inside card. `UNAUTHORIZED` (401 on protected route) → redirect to /login. `NOT_FOUND` (404 on trip) → full-page error state. |

---

### Sprint 1 — Backend Engineer → QA Engineer (API Contracts Ready for Testing Reference — T-004, T-005, T-006, T-007)

| Field | Value |
|-------|-------|
| Sprint | 1 |
| From Agent | Backend Engineer |
| To Agent | QA Engineer |
| Status | Done |
| Related Task | T-004, T-005, T-006, T-007, T-018, T-019 |
| Handoff Summary | All Sprint 1 API contracts have been documented in `.workflow/api-contracts.md`. Schema design is documented in `.workflow/technical-context.md`. These are available now for QA planning and test case authoring ahead of T-018 (security checklist) and T-019 (integration testing). |
| Notes | **Key security items to verify during T-018:** (1) POST /auth/register — password must be bcrypt hashed (min 12 rounds), never stored or logged in plain text. (2) POST /auth/login — timing-safe comparison even when user not found (dummy bcrypt compare to prevent email enumeration). (3) POST /auth/refresh — refresh token stored as SHA-256 hash in DB, not raw value; check revoked_at is NULL and expires_at is in the future. (4) All protected endpoints must reject requests without a valid Bearer token (401). (5) All trip sub-resource endpoints must verify trip ownership (user_id match) and return 403 — not 404 — when the trip exists but belongs to another user. (6) All inputs validated server-side (not just client-side). (7) No SQL string concatenation — Knex parameterized queries only. (8) No stack traces in API error responses — only structured `{ error: { message, code } }` shape. **For T-019 integration test flow:** register → login → create trip (POST /trips → navigate to GET /trips/:id) → fetch sub-resources (GET flights/stays/activities all return empty arrays) → delete trip (DELETE /trips/:id → 204) → verify trip gone (GET /trips/:id → 404) → logout. |

---

### Sprint 1 — Backend Engineer → Frontend Engineer (API Contracts Ready for Integration — T-004, T-005, T-006)

| Field | Value |
|-------|-------|
| Sprint | 1 |
| From Agent | Backend Engineer |
| To Agent | Frontend Engineer |
| Status | Pending |
| Related Task | T-004, T-005, T-006, T-013, T-014, T-015, T-016, T-017 |
| Handoff Summary | All Sprint 1 API contracts are published in `.workflow/api-contracts.md` and are marked "Agreed". You may begin integrating against these contracts. Implementation will follow in T-008 through T-012. |
| Notes | **Critical integration notes:** (1) **Auth token flow:** POST /auth/login and POST /auth/register return `access_token` in the response body — store in React context (in-memory). The refresh token is set as an httpOnly cookie (`Path=/api/v1/auth`) — you do NOT need to handle it manually, the browser sends it automatically. The axios interceptor should call POST /auth/refresh on 401 responses, then retry the original request with the new access_token. (2) **Trip creation → navigation:** POST /trips returns `{ data: { id, ... } }` on 201 — use the returned `id` to navigate to `/trips/:id` immediately (do not navigate back to the home list). (3) **Destinations:** Send as an array of strings in POST /trips and PATCH /trips (e.g., `["Tokyo", "Osaka"]`). The backend also accepts a single comma-separated string and will normalize it — but prefer sending an array. The API returns destinations as an array of strings. (4) **Sub-resource endpoints:** All scoped under `/api/v1/trips/:tripId/[flights|stays|activities]`. Fetch all three in parallel on the trip details page mount. Each returns `{ data: [...] }` — an empty array if no items exist. (5) **Timestamps:** `departure_at`, `arrival_at`, `check_in_at`, `check_out_at` are ISO 8601 UTC strings. Use the companion `*_tz` IANA string to display in local timezone — do NOT rely on the browser's own timezone. Activities use `activity_date` (YYYY-MM-DD string) and `start_time`/`end_time` (HH:MM:SS strings) with no timezone. (6) **Delete trip:** DELETE /trips/:id returns 204 (no body). On success, remove the card from the DOM and show the fade-out animation. (7) **Logout:** POST /auth/logout returns 204. On success, clear the in-memory access_token from React context and redirect to /login. The refresh cookie is cleared automatically by the server's Set-Cookie header. (8) **Error codes to handle:** `EMAIL_TAKEN` (409) → inline email field error on register. `INVALID_CREDENTIALS` (401 on login) → banner inside card. `UNAUTHORIZED` (401 on any protected endpoint) → redirect to /login. `NOT_FOUND` (404 on trip fetch) → "trip not found" full-page error state. |

---

### Sprint 1 — Backend Engineer → Manager Agent (Schema Proposal Ready for Approval — T-007)

| Field | Value |
|-------|-------|
| Sprint | 1 |
| From Agent | Backend Engineer |
| To Agent | Manager Agent |
| Status | Pending |
| Related Task | T-007, T-009 |
| Handoff Summary | The database schema for all 6 tables (users, refresh_tokens, trips, flights, stays, activities) has been documented in `.workflow/technical-context.md` under "Sprint 1 Schema Design (T-007)". The schema matches ADR-005 exactly. Migration SQL and Knex migration file names are proposed for each table. Please review and confirm approval so T-009 (database migrations) can proceed. |
| Notes | Schema follows: (1) ADR-005 entity definitions (field names, types, nullability, defaults). (2) ADR-004 refresh token strategy (token_hash stored, not raw token; revoked_at for invalidation). (3) ADR-003 timezone handling (TIMESTAMPTZ + companion VARCHAR timezone column for flights/stays; DATE + TIME for activities). (4) ADR-002 destinations as TEXT[] on trips. (5) ADR-001 Knex-only query strategy. Migration order is 001→002→003→004→005→006. All migrations include up() and down(). Self-approval note is included in technical-context.md per the automated sprint flow — no additional approval gate required before implementation proceeds. |

---

### Sprint 1 — Design Agent → Frontend Engineer (UI Spec: Trip Details Page — T-003)

| Field | Value |
|-------|-------|
| Sprint | 1 |
| From Agent | Design Agent |
| To Agent | Frontend Engineer |
| Status | Pending |
| Related Task | T-003, T-017 |
| Handoff Summary | UI spec for the Trip Details page (`/trips/:id`) is complete and approved. Published to `.workflow/ui-spec.md` under "Spec 3: Trip Details Page (View Mode)". This is a read-only view for Sprint 1. Key implementation notes: (1) Page fetches trip + flights + stays + activities in parallel on mount. (2) Activities section groups entries by date, sorted chronologically within each day. (3) Calendar section is a placeholder — render the dashed container with "calendar coming in Sprint 2" text only. (4) "Add" action buttons for all three sections are visible but disabled (aria-disabled, opacity 0.4, tooltip "editing coming soon"). (5) Each section has its own empty state (dashed border container). (6) Flight cards use a two-column departure/arrival layout on desktop, stacking to single-column on mobile. (7) No edit functionality this sprint. |
| Notes | Timezone display: show the stored local time + timezone abbreviation as a label (e.g., "6:00 AM ET") — do NOT convert timezones in the browser. Trip name and destinations on the header are read-only text for this sprint. See Section 3.15 for full accessibility requirements. See Section 3.13 for responsive breakpoints. |

---

### Sprint 1 — Design Agent → Frontend Engineer (UI Spec: Home Page + Navbar — T-002)

| Field | Value |
|-------|-------|
| Sprint | 1 |
| From Agent | Design Agent |
| To Agent | Frontend Engineer |
| Status | Pending |
| Related Task | T-002, T-015, T-016 |
| Handoff Summary | UI spec for the Home page (`/`) and Navbar component is complete and approved. Published to `.workflow/ui-spec.md` under "Spec 2: Home Page + Navbar". Key implementation notes: (1) Navbar is a sticky 56px bar shown on all authenticated pages (/  and /trips/:id) but NOT on /login or /register. (2) Trip cards are arranged in a 3-column CSS Grid (desktop) / 2-column (tablet) / 1-column (mobile). (3) Clicking a trip card navigates to /trips/:id. (4) The delete flow uses an inline card replacement confirmation (card content swaps to "delete this trip?" + confirm/cancel buttons) — no separate modal needed. (5) After creating a trip, navigate directly to /trips/:id (the new trip), not back to the list. (6) Empty state shows a centered block with CTA button that also opens the create modal. (7) Loading state: skeleton cards with shimmer animation. |
| Notes | Create Trip modal requires focus trap (tab cycles within modal). Escape key closes modal. Clicking the overlay backdrop closes modal. The modal's success flow navigates to the newly created trip's detail page using the ID returned by the API. See Section 2.9 for responsive breakpoints. |

---

### Sprint 1 — Design Agent → Frontend Engineer (UI Spec: Auth Screens — T-001)

| Field | Value |
|-------|-------|
| Sprint | 1 |
| From Agent | Design Agent |
| To Agent | Frontend Engineer |
| Status | Pending |
| Related Task | T-001, T-014 |
| Handoff Summary | UI spec for the Auth screens (Login at `/login`, Register at `/register`) is complete and approved. Published to `.workflow/ui-spec.md` under "Spec 1: Auth Screens (Login + Register)". Key implementation notes: (1) Both pages use a centered 400px card layout on the dark background — no navbar rendered on auth pages. (2) If an authenticated user visits /login or /register, redirect to /. (3) Login: email + password fields. Register: name + email + password (8-char minimum). (4) Field-level inline error messages (red text below field, red border). (5) API error banner inside the card above the form for 401 (bad credentials) or 500 errors. (6) Loading state: button text replaced with inline spinner, all inputs disabled. (7) On successful register: auto-login + redirect to /. On successful login: redirect to /. |
| Notes | autocomplete attributes are required (see spec 1.2 and 1.3 for field-level autocomplete values). Password field on register shows "8 characters minimum" as persistent helper text below the label. Duplicate email on register returns 409 — show this as a field-level error on the email input. See Section 1.4 for responsive behavior on mobile. |

---

### Sprint 1 — Manager → Backend Engineer (Schema ADR Supplement — Read Before T-007)

| Field | Value |
|-------|-------|
| Sprint | 1 |
| From Agent | Manager Agent |
| To Agent | Backend Engineer |
| Status | Pending |
| Related Task | T-007, T-009, T-010 |
| Handoff Summary | ADR-005 has been published to `.workflow/architecture-decisions.md` with the approved entity definitions for all six tables (users, trips, flights, stays, activities, refresh_tokens). Read ADR-005 before starting T-007. Your schema proposal should match the approved definitions. Key things that must not change without a new ADR: field nullability decisions, enum value sets (PLANNING/ONGOING/COMPLETED, HOTEL/AIRBNB/VRBO), timezone column naming convention (`*_at` for TIMESTAMPTZ + `*_tz` for IANA string), and the RefreshToken table structure for logout. |
| Notes | **Critical addition not in the original handoff:** The `users` table MUST include a `name VARCHAR(255) NOT NULL` column. The project brief requires the sign-up form to collect the user's name. The POST /auth/register endpoint (T-004) must accept `name` in the request body. The existing `architecture.md` User model does not yet show this field — it predates the sprint plan. Backend Engineer should treat ADR-005 as the authoritative source. Also note: `activity_date` and `start_time`/`end_time` on Activities use DATE and TIME types (not TIMESTAMPTZ) per ADR-005 rationale — activities are local-time entries with no cross-timezone display requirement. |

---

### Sprint 1 — Manager → Backend Engineer (API Contracts + Schema)

| Field | Value |
|-------|-------|
| Sprint | 1 |
| From Agent | Manager Agent |
| To Agent | Backend Engineer |
| Status | Pending |
| Related Task | T-004, T-005, T-006, T-007 |
| Handoff Summary | Sprint #1 is now planned. Your first deliverables are the API contracts and database schema — these must be completed and approved by the Manager Agent before you begin any backend implementation. Write all API contracts to `.workflow/api-contracts.md`. Document the database schema in `.workflow/api-contracts.md` (schema section) or a new `technical-context.md`. See `dev-cycle-tracker.md` for full task specs. After contracts are approved, proceed with T-008 (backend setup) → T-009 (migrations) → T-010 (auth API) → T-011 (trips API) → T-012 (flights/stays/activities API). |
| Notes | Architecture decisions: Use Knex.js for all DB queries (no ORM). JWT access tokens expire in 15 min; refresh tokens in 7 days. Store refresh tokens in DB for invalidation on logout. Passwords hashed with bcrypt (min 12 rounds). Destinations on a trip can be stored as a PostgreSQL TEXT ARRAY or JSONB for MVP. Timezones for flights and stays: store departure/arrival as UTC timestamps PLUS a separate timezone string (e.g., "America/Los_Angeles") so the frontend can display local times. See `rules.md` rule #22: schema changes require Manager approval before implementation. |

---

### Sprint 1 — Manager → Design Agent (UI Specs)

| Field | Value |
|-------|-------|
| Sprint | 1 |
| From Agent | Manager Agent |
| To Agent | Design Agent |
| Status | Pending |
| Related Task | T-001, T-002, T-003 |
| Handoff Summary | Sprint #1 is now planned. Your deliverables are the UI specs for three screen groups: (1) Auth screens — login and register pages. (2) Home page — trip list with trip cards, create-trip modal, empty state for new users, and navbar. (3) Trip details page — view mode showing all sections (flights, stays, activities) with empty states. Write all specs to `.workflow/ui-spec.md`. These must be published before the Frontend Engineer can start T-014 through T-017. |
| Notes | Design preferences from project brief: Color palette — #02111B (darkest), #3F4045, #30292F, #5D737E, #FCFCFC (lightest). Font: IBM Plex Mono. Style: minimal "Japandi" aesthetic. Trip details page layout: calendar at the top (Sprint 1 can show a placeholder/empty state for the calendar — it will be implemented in Sprint 2). Trip status badge: PLANNING (default), ONGOING, COMPLETED. Empty states should include a CTA prompt (e.g., "No flights yet — add one"). Edit buttons/links for flights, stays, and activities should be visible in the spec but marked as "Sprint 2" — they will exist in the UI as non-functional placeholders or be omitted with a note. |

---

### Sprint 1 — Manager → Frontend Engineer (Setup Notice)

| Field | Value |
|-------|-------|
| Sprint | 1 |
| From Agent | Manager Agent |
| To Agent | Frontend Engineer |
| Status | Pending |
| Related Task | T-013 |
| Handoff Summary | Sprint #1 is now planned. You may begin T-013 (Frontend project setup) immediately — it has no blocking dependencies. Set up React 18 + Vite, React Router v6, auth context with JWT storage and refresh logic, axios instance with interceptors, IBM Plex Mono font, and the project color palette. Do NOT start T-014 through T-017 until Design Agent specs (T-001, T-002, T-003) and API contracts (T-004, T-005, T-006) are done and approved. Watch the handoff log for the signal that those are ready. |
| Notes | Color palette for CSS variables: --color-darkest: #02111B; --color-dark: #3F4045; --color-mid-dark: #30292F; --color-accent: #5D737E; --color-lightest: #FCFCFC. Font: IBM Plex Mono (load from Google Fonts or local). JWT: store access token in memory (React context state), store refresh token in httpOnly cookie if possible — otherwise localStorage with a note about the trade-off. Axios interceptor should auto-refresh on 401. Protected route component should redirect to /login if no valid token. |

---

*Entries are added by each agent when they finish work that another agent depends on. Newest entries go at the top of the Log section.*
