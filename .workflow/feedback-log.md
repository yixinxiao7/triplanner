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

## Sprint 1 Feedback

*Populated by User Agent (T-022) — 2026-02-24. All tests run against staging: Backend http://localhost:3001/api/v1, Frontend http://localhost:4173.*

---

### FB-001 — Invalid UUID path parameter returns HTTP 500 with raw PostgreSQL error code

| Field | Value |
|-------|-------|
| Sprint | 1 |
| Category | Bug |
| Severity | Major |
| Status | Tasked |
| Related Task | T-011 |

**Steps to reproduce:**
```
curl -s http://localhost:3001/api/v1/trips/not-a-real-uuid \
  -H "Authorization: Bearer <valid_token>"
```

**Expected:** `HTTP 400` with `{ "error": { "message": "Invalid trip ID format", "code": "VALIDATION_ERROR" } }` (or similar clean validation error)

**Actual:** `HTTP 500` with `{ "error": { "message": "An unexpected error occurred", "code": "22P02" } }`

**Notes:** The raw PostgreSQL error code `22P02` (`invalid_text_representation`) is leaking to the client in the `code` field. This should be caught at the route/middleware level before hitting the DB. The same issue likely affects PATCH and DELETE `/trips/:id`, and potentially all sub-resource endpoints that accept UUID path params. While the error handler correctly catches the exception, it passes the raw PostgreSQL error code through to the response. A UUID format validation check (regex or `pg`-level validation) should be added to the route handler or a middleware layer to return a clean 400.

---

### FB-002 — activity_date returned as full ISO 8601 timestamp instead of YYYY-MM-DD date string

| Field | Value |
|-------|-------|
| Sprint | 1 |
| Category | Bug |
| Severity | Major |
| Status | Tasked |
| Related Task | T-012 |

**Steps to reproduce:**
```bash
curl -s -X POST http://localhost:3001/api/v1/trips/$TRIP_ID/activities \
  -H "Authorization: Bearer <valid_token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Central Park Walk", "location": "Central Park, NYC", "activity_date": "2026-08-08", "start_time": "09:00", "end_time": "12:00"}'
```

**Expected (per api-contracts.md):** `"activity_date": "2026-08-08"` (plain YYYY-MM-DD string)

**Actual:** `"activity_date": "2026-08-08T04:00:00.000Z"` (full ISO 8601 timestamp with UTC time offset)

**Notes:** The `activity_date` column is defined as a PostgreSQL `DATE` type (per ADR-005 and schema), but the value is being serialized with a timestamp component when returned from the API. This appears to be caused by how the PostgreSQL driver (pg/knex) handles DATE types — it may be casting the date to a JavaScript Date object, which then serializes as a full ISO string. This discrepancy from the API contract (`"YYYY-MM-DD"` string expected) is a correctness issue. The TripDetailsPage frontend groups activities by `activity_date`; if it uses a strict string comparison against `"2026-08-08"`, it will fail to match `"2026-08-08T04:00:00.000Z"`. Even if the frontend defensively handles this, the API is not honoring its published contract. Fix: cast/format the `activity_date` field to a `YYYY-MM-DD` string before returning it in the API response (e.g., using `.toISOString().split('T')[0]` or a Knex date formatter).

---

### FB-003 — No rate limiting on auth endpoints — brute-force login possible

| Field | Value |
|-------|-------|
| Sprint | 1 |
| Category | Security |
| Severity | Major |
| Status | Tasked |
| Related Task | T-010 |

**Steps to reproduce:**
```bash
for i in {1..10}; do
  curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3001/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "victim@example.com", "password": "guess'$i'"}'
  echo ""
done
```

**Expected:** After a threshold of failed attempts (e.g., 5 per minute), the endpoint should return HTTP 429 Too Many Requests.

**Actual:** All 10 requests returned HTTP 401 with no throttling. No rate limiting is applied.

**Notes:** This is a known accepted risk logged by QA Engineer (T-018). The `express-rate-limit` package is already installed but not wired up. Without rate limiting, an attacker can make unlimited login attempts against any email address. This is particularly concerning for the `/auth/login` and `/auth/register` endpoints. Logging this as Major because it is a real security gap even in staging. Recommend Sprint 2 resolution: wire up `express-rate-limit` on all `/api/v1/auth/*` routes with a sliding window (e.g., 10 requests per 15 minutes per IP).

---

### FB-004 — Malformed JSON body returns `INTERNAL_ERROR` code instead of a parse error code

| Field | Value |
|-------|-------|
| Sprint | 1 |
| Category | Bug |
| Severity | Minor |
| Status | Acknowledged |
| Related Task | T-010 |

**Steps to reproduce:**
```bash
curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Test with quote'
```

**Expected:** `HTTP 400` with `{ "error": { "message": "Invalid JSON", "code": "INVALID_JSON" } }` or similar parse error code

**Actual:** `HTTP 400` with `{ "error": { "message": "...", "code": "INTERNAL_ERROR" } }` — The `code` field is `INTERNAL_ERROR` even though the HTTP status is 400. `INTERNAL_ERROR` conventionally implies HTTP 500 server-side failures; using it for a client-caused parse error is misleading.

**Notes:** When Express's JSON body parser encounters malformed JSON, it throws a `SyntaxError`. The error handler (`errorHandler.js`) is likely mapping this as a generic internal error. The fix is to detect `SyntaxError` in the error handler and return a 400 with a `INVALID_JSON` or `BAD_REQUEST` code. Low priority but worth fixing for API correctness.

---

### FB-005 — Happy path user flows all work correctly end-to-end

| Field | Value |
|-------|-------|
| Sprint | 1 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-010, T-011, T-012, T-013, T-014, T-015, T-016, T-017 |

**What was tested:** Complete new-user flow from registration through trip creation, viewing, and deletion.

**Details:**
- `POST /auth/register` → 201 with user object + access token + httpOnly cookie. Token is immediately usable.
- `POST /auth/login` → 200 with user object + access token. Consistent response shape with register.
- `GET /trips` (empty) → 200 with `{ data: [], pagination: { page: 1, limit: 20, total: 0 } }`. Pagination shape is correct.
- `POST /trips` (array destinations) → 201 with full trip object. Status defaults to `PLANNING`. UUID returned.
- `POST /trips` (comma-separated string destinations) → 201 with destinations correctly split into array. Backend normalization works.
- `GET /trips/:id` → 200 with full trip object. Matches the created trip exactly.
- `GET /trips/:id/flights`, `/stays`, `/activities` → 200 with `{ data: [] }`. Clean empty responses.
- `PATCH /trips/:id` (name + status) → 200 with updated values. `updated_at` correctly refreshed.
- `DELETE /trips/:id` → 204 (no body). Clean.
- `GET /trips/:id` after delete → 404 `NOT_FOUND`. Trip is gone as expected.
- `POST /auth/logout` → 204. Cookie cleared (Max-Age=0 confirmed by prior monitor tests).

All core flows work flawlessly. The backend is solid.

---

### FB-006 — Input validation is comprehensive and correct across all endpoints

| Field | Value |
|-------|-------|
| Sprint | 1 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-010, T-011, T-012 |

**What was tested:** All validation edge cases across auth, trips, and sub-resource endpoints.

**Details:** Every validation rule in `api-contracts.md` was tested:
- Empty/missing required fields → 400 `VALIDATION_ERROR` with per-field errors ✅
- Email format validation → 400 with `"A valid email address is required"` ✅
- Password minimum 8 characters → 400 with correct message ✅
- Whitespace-only name (trips + users) → 400 (trimmed correctly, treated as empty) ✅
- Name over 255 characters → 400 ✅
- Duplicate email on register → 409 `EMAIL_TAKEN` ✅
- Invalid trip status enum (PATCH) → 400 with allowed values listed ✅
- Empty PATCH body → 400 `NO_UPDATABLE_FIELDS` ✅
- Flight arrival before departure → 400 `VALIDATION_ERROR` ✅
- Stay checkout before checkin → 400 `VALIDATION_ERROR` ✅
- Activity end time before start time → 400 `VALIDATION_ERROR` ✅
- Activity invalid date format → 400 `VALIDATION_ERROR` ✅
- Stay invalid category (HOSTEL) → 400 `VALIDATION_ERROR` with allowed values ✅

The validation is thorough and all error messages are descriptive and consistent.

---

### FB-007 — Cross-user access protection (403 enforcement) is correct

| Field | Value |
|-------|-------|
| Sprint | 1 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-011, T-012 |

**What was tested:** User B attempting to access, modify, and delete User A's resources.

**Details:**
- `GET /trips/:id` (User B accessing User A's trip) → 403 `FORBIDDEN` ✅ (not 404 — correct, per spec)
- `DELETE /trips/:id` (User B deleting User A's trip) → 403 `FORBIDDEN` ✅
- `GET /trips/:id/flights` (User B accessing User A's flights) → 403 `FORBIDDEN` ✅

The trip ownership check is applied consistently and returns 403 (not 404, which would leak existence information). This is a security best practice correctly implemented.

---

### FB-008 — Authentication middleware correctly rejects all invalid token scenarios

| Field | Value |
|-------|-------|
| Sprint | 1 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-010, T-013 |

**What was tested:** All scenarios where a user should be rejected from protected endpoints.

**Details:**
- No Authorization header → 401 `UNAUTHORIZED: Authentication required` ✅
- Invalid JWT (not a valid token) → 401 `UNAUTHORIZED: Invalid or expired token` ✅
- Malformed JWT (looks like JWT format but wrong signature) → 401 `UNAUTHORIZED: Invalid or expired token` ✅
- `POST /auth/refresh` with no cookie → 401 `INVALID_REFRESH_TOKEN` ✅
- `POST /auth/refresh` with invalid cookie value → 401 `INVALID_REFRESH_TOKEN` ✅

Error messages are safe (no token details leaked). Response shape matches `api-contracts.md` exactly.

---

### FB-009 — Frontend components fully implement all UI states per spec

| Field | Value |
|-------|-------|
| Sprint | 1 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-013, T-014, T-015, T-016, T-017 |

**What was tested:** Code review of all 5 major frontend components against ui-spec.md.

**Details:** All components pass the spec review:

**LoginPage.jsx:** Loading spinner ✅, field-level errors with red border ✅, API error banner inside card for 401 ✅, redirect if already authenticated ✅, autocomplete attributes ✅, error clearing on first keystroke ✅.

**RegisterPage.jsx:** Loading spinner ✅, all 3 field errors ✅, 409 EMAIL_TAKEN maps to email field error ✅, password min 8 chars validated on blur and submit ✅, "8 characters minimum" helper text ✅, autocomplete attributes on all fields ✅.

**Navbar.jsx:** Sticky 56px height ✅, TRIPLANNER brand link to / ✅, username truncated at 20 chars with CSS ellipsis ✅, sign out button with best-effort logout ✅, nav links hidden on mobile ✅, username hidden on mobile ✅, proper ARIA attributes (aria-label="Main navigation", aria-current on active link, aria-label="Sign out") ✅.

**HomePage.jsx:** 3/2/1 column CSS grid with correct breakpoints ✅, skeleton loading cards (3 skeletons) ✅, empty state with CTA button that opens create modal ✅, error state with retry ✅, inline delete confirmation (card content replaced) ✅, navigates to /trips/:id after create ✅, toast for delete errors ✅.

**TripDetailsPage.jsx:** Back link "← my trips" ✅, calendar placeholder with "calendar coming in sprint 2" text ✅, flights/stays/activities empty states with dashed border ✅, "add flight/stay/activities" buttons disabled with aria-disabled="true" ✅, skeleton loading for each section ✅, per-section error state with retry button ✅, 404 full-page error with "back to home" link (distinguishes not_found vs network error) ✅, activity grouping by date ✅.

This is an exceptionally well-implemented frontend for Sprint 1.

---

### FB-010 — Frontend SPA routing and build output are correct

| Field | Value |
|-------|-------|
| Sprint | 1 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-013, T-020 |

**What was tested:** Frontend build output existence, static serving, and SPA routing behavior.

**Details:**
- `frontend/dist/` directory exists with `index.html` and hashed asset files ✅
- `GET http://localhost:4173/` → HTTP 200, valid HTML SPA shell ✅
- `GET http://localhost:4173/some-nonexistent-route` → HTTP 200 (correct SPA behavior — client-side router handles unknown paths) ✅
- API base URL (`http://localhost:3001/api/v1`) confirmed baked into the production bundle per Monitor Agent's earlier verification ✅
- CORS headers confirmed correct for cross-origin requests from localhost:4173 to localhost:3001 ✅

The production build and staging deployment are clean.

---

*End of Sprint 1 User Agent feedback. Testing completed 2026-02-24. Total entries: 10 (4 issues, 6 positives).*

---

## Sprint 2 Feedback

*Populated by User Agent (T-040) — 2026-02-25. All tests run against staging: Backend http://localhost:3001/api/v1, Frontend http://localhost:4173. Token obtained via fresh registration.*

---

### FB-011 — Sprint 1 bug fixes all verified and resolved (UUID, activity_date, INVALID_JSON)

| Field | Value |
|-------|-------|
| Sprint | 2 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-027 |

**What was tested:** All three Sprint 1 bugs reported in FB-001, FB-002, FB-004 were retested on the Sprint 2 staging deployment.

**Details:**
- **UUID validation (FB-001 / B-009):** `GET /trips/not-a-uuid` → HTTP 400 `{"error":{"message":"Invalid ID format","code":"VALIDATION_ERROR"}}` ✅. Previously returned HTTP 500 with raw PostgreSQL code `22P02`. Now correctly caught at middleware level. Tested on trips, flights, stays, and activities sub-resource routes — all return clean 400.
- **activity_date format (FB-002 / B-010):** `POST /trips/:id/activities` with `"activity_date": "2026-08-09"` → response returns `"activity_date": "2026-08-09"` ✅. `GET /trips/:id/activities` list also returns YYYY-MM-DD format consistently. Previously returned ISO 8601 timestamp.
- **INVALID_JSON code (FB-004 / B-012):** Sending malformed JSON body → HTTP 400 `{"error":{"message":"Invalid JSON in request body","code":"INVALID_JSON"}}` ✅. Previously returned `INTERNAL_ERROR` code.

All three P0 fixes verified. Excellent work by the Backend Engineer.

---

### FB-012 — Rate limiting on auth endpoints works correctly with proper headers

| Field | Value |
|-------|-------|
| Sprint | 2 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-028 |

**What was tested:** Rate limiting on `/auth/login` (limit: 10/15min) and `/auth/register` (limit: 20/15min).

**Details:**
- Login endpoint: After 10 requests within the 15-minute window, returns HTTP 429 `{"error":{"message":"Too many requests, please try again later.","code":"RATE_LIMIT_EXCEEDED"}}` ✅
- Register endpoint: After 20 requests, returns HTTP 429 with same error shape ✅
- Response headers on 429: `RateLimit-Policy: 10;w=900`, `RateLimit-Limit: 10`, `RateLimit-Remaining: 0`, `RateLimit-Reset: <seconds>`, `Retry-After: <seconds>` — all present and correct ✅
- Error code `RATE_LIMIT_EXCEEDED` is descriptive and API-consistent ✅

This resolves FB-003 (Sprint 1 security finding). Rate limiting is properly implemented with standard headers.

---

### FB-013 — Trip date range CRUD works end-to-end with proper validation

| Field | Value |
|-------|-------|
| Sprint | 2 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-029, T-034 |

**What was tested:** Full lifecycle of trip date range: create with dates, GET, PATCH update, PATCH clear to null, validation.

**Details:**
- `POST /trips` with `start_date`/`end_date` in YYYY-MM-DD format → 201, dates stored and returned correctly ✅
- `GET /trips/:id` includes `start_date` and `end_date` fields ✅
- `GET /trips` (list) includes dates for all trips with pagination ✅
- `PATCH /trips/:id` with new dates → 200, dates updated ✅
- `PATCH /trips/:id` with `null` dates → 200, dates cleared back to null ✅
- Validation: `end_date` before `start_date` → 400 `{"fields":{"end_date":"End date must be on or after start date"}}` ✅
- Validation: Invalid date format (e.g., "not-a-date") → 400 with clear error ✅
- Trip with only `start_date` (no `end_date`) → 201, allowed (end_date null) ✅

Date range feature is complete and robust.

---

### FB-014 — Trip status auto-calculation works across all scenarios

| Field | Value |
|-------|-------|
| Sprint | 2 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-030 |

**What was tested:** Status auto-calculation based on trip dates across 5 scenarios.

**Details:**
- Future dates (start_date: 2026-08-07, end_date: 2026-08-14) → status: `PLANNING` ✅
- Past dates (start_date: 2025-01-01, end_date: 2025-01-15) → status: `COMPLETED` ✅
- Current dates (start_date: 2026-02-20, end_date: 2026-03-01, today = 2026-02-25) → status: `ONGOING` ✅
- No dates (both null) → falls back to stored status (`PLANNING`) ✅
- Boundary: end_date = today → status: `ONGOING` ✅ (today is within range)
- Boundary: start_date = today → status: `ONGOING` ✅

Auto-calculation is accurate with proper boundary handling.

---

### FB-015 — Flights CRUD fully functional with comprehensive validation

| Field | Value |
|-------|-------|
| Sprint | 2 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-031 |

**What was tested:** Complete CRUD for flights: create, read (single + list), update, delete.

**Details:**
- `POST /trips/:id/flights` with all 8 required fields → 201, full flight object returned ✅
- `GET /trips/:id/flights` → 200, flights listed ordered by departure_at ✅
- `GET /trips/:id/flights/:flightId` → 200, single flight returned ✅
- `PATCH /trips/:id/flights/:flightId` → 200, partial update works (airline + flight_number changed) ✅
- `DELETE /trips/:id/flights/:flightId` → 204, flight removed ✅
- `GET` after delete → 404 `Flight not found` ✅
- Validation: arrival_at before departure_at → 400 with proper error ✅
- Validation: empty body → 400 with field-level errors for all 8 required fields ✅

Flights API is solid.

---

### FB-016 — Stays CRUD fully functional with category validation

| Field | Value |
|-------|-------|
| Sprint | 2 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-032 |

**What was tested:** Complete CRUD for stays: create (HOTEL, AIRBNB), read, update, delete, validation.

**Details:**
- `POST /trips/:id/stays` with HOTEL and AIRBNB categories → 201 each ✅
- Stays ordered by check_in_at ascending in list ✅
- Address is optional (nullable) ✅
- `PATCH` updates name correctly ✅
- `DELETE` returns 204 ✅
- Validation: check_out_at before check_in_at → 400 ✅
- Validation: invalid category "HOSTEL" → 400 `"Category must be one of: HOTEL, AIRBNB, VRBO"` ✅
- Validation: empty body → 400 with all required field errors ✅

---

### FB-017 — Activities CRUD works with correct YYYY-MM-DD format

| Field | Value |
|-------|-------|
| Sprint | 2 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-033 |

**What was tested:** Create, list, update, delete activities; verify date format.

**Details:**
- Created 3 activities across 2 dates (2 on 2026-08-09, 1 on 2026-08-11) ✅
- All `activity_date` values returned as YYYY-MM-DD strings (not ISO timestamps) ✅
- Activities listed in order (sorted by activity_date, then start_time) ✅
- `PATCH` update (name + end_time) works correctly ✅
- `DELETE` returns 204 ✅
- Validation: missing name → 400, missing start_time/end_time → 400 ✅
- Validation: invalid date format "08/09/2026" → 400 with clear error message ✅
- Long name (300 chars) → 400 `"name must be at most 255 characters"` ✅

---

### FB-018 — Cross-user authorization correctly enforced (403 on all operations)

| Field | Value |
|-------|-------|
| Sprint | 2 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-027, T-031, T-032, T-033 |

**What was tested:** Created second user and attempted to access/modify/delete first user's trip and sub-resources.

**Details:**
- `GET /trips/:id` (other user's trip) → 403 `FORBIDDEN` ✅
- `PATCH /trips/:id` (other user's trip) → 403 `FORBIDDEN` ✅
- `POST /trips/:id/flights` (add flight to other user's trip) → 403 `FORBIDDEN` ✅
- `DELETE /trips/:id` (other user's trip) → 403 `FORBIDDEN` ✅
- `GET /trips` (second user) → returns empty list, no data leakage ✅

Trip ownership validation is applied consistently and correctly across all Sprint 2 endpoints.

---

### FB-019 — Edge cases handled correctly: XSS, SQL injection, special characters, unicode

| Field | Value |
|-------|-------|
| Sprint | 2 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-027, T-036 |

**What was tested:** Intentional attack vectors and boundary inputs.

**Details:**
- **SQL injection via trip name** (`'; DROP TABLE trips; --`) → Stored as literal string, no SQL execution ✅ (Knex parameterized queries)
- **SQL injection via URL path** → UUID validation catches before DB query ✅
- **XSS in trip name** (`<script>alert(1)</script>`) → Stored as literal text, React renders safely (no dangerouslySetInnerHTML found in code review) ✅
- **XSS in activity name** (`<img onerror=alert(1) src=x>`) → Stored as literal text ✅
- **Unicode** destinations (東京, 大阪, 京都) → Stored and returned correctly ✅
- **Emoji** in trip name (🎉✈️) → Stored and returned correctly ✅
- **Whitespace-only** name → 400 validation (trimmed then caught as empty) ✅
- **Number** as name (12345 instead of string) → 400 `"name must be a string"` ✅
- **Invalid auth token** → 401 ✅

Excellent input validation and security hardening.

---

### FB-020 — Frontend build and SPA routing verified for all Sprint 2 routes

| Field | Value |
|-------|-------|
| Sprint | 2 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-031, T-032, T-033, T-034, T-035, T-038 |

**What was tested:** Frontend build output, SPA routing, unit tests.

**Details:**
- `frontend/dist/` exists with `index.html`, JS bundle (293 kB), CSS bundle (50 kB) ✅
- All Sprint 2 SPA routes return HTTP 200 (client-side routing):
  - `/trips/:id/edit/flights` ✅
  - `/trips/:id/edit/stays` ✅
  - `/trips/:id/edit/activities` ✅
- All 180 frontend unit tests pass (15 test files, 2.47s) ✅
- All 116 backend unit tests pass (7 test files, 594ms) ✅
- All edit page routes are wrapped in `<ProtectedRoute>` (authenticated access only) ✅
- No `dangerouslySetInnerHTML` anywhere in codebase ✅

---

### FB-021 — Frontend code review: all Sprint 2 components fully spec-compliant

| Field | Value |
|-------|-------|
| Sprint | 2 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-031, T-032, T-033, T-034, T-035 |

**What was tested:** Comprehensive code review of all new Sprint 2 frontend components against ui-spec.md.

**Details:**
- **FlightsEditPage.jsx:** List existing flights with edit/delete icons ✅, 2-column form grid with all 8 fields ✅, 28 IANA timezone dropdown ✅, inline delete confirmation ✅, loading/empty/error/success states ✅, "Done editing" navigation ✅, success highlight after save ✅, form validation ✅
- **StaysEditPage.jsx:** Category dropdown (HOTEL/AIRBNB/VRBO) ✅, optional address field ✅, check-out > check-in validation ✅, all CRUD operations ✅, all UI states ✅
- **ActivitiesEditPage.jsx:** Row-based batch form ✅, "+" add row with auto-focus ✅, Promise.allSettled batch save ✅, row-level delete tracking ✅, "Cancel" without API calls ✅, validation (name + date required) ✅
- **TripCalendar.jsx:** Custom CSS grid (no external library) ✅, color-coded events (flights blue, stays teal, activities amber) ✅, prev/next month navigation ✅, today highlight ✅, "+N more" overflow ✅, responsive dots on mobile (<640px) ✅, empty state message ✅
- **TripCard.jsx:** Date range display with smart formatting ✅, "dates not set" fallback ✅
- **TripDetailsPage.jsx:** Date range section with display/edit/null modes ✅, links to all edit pages ✅, calendar component integrated ✅

All components are feature-complete and well-implemented.

---

### FB-022 — Frontend does not display explicit "too many requests" message for 429 responses

| Field | Value |
|-------|-------|
| Sprint | 2 |
| Category | UX Issue |
| Severity | Minor |
| Status | Tasked |
| Related Task | T-028, T-045 (Sprint 3) |

**Steps to reproduce:**
1. Trigger rate limiting on login endpoint (10+ rapid requests)
2. Observe the error displayed in the frontend login form

**Expected:** A specific user-facing message like "Too many login attempts. Please wait a few minutes and try again." with the Retry-After countdown.

**Actual (per code review):** The frontend axios interceptor does not have a specific handler for HTTP 429 responses. The generic error banner catches it and likely shows "something went wrong. please try again." — which is misleading because trying again will also fail until the rate limit window resets.

**Notes:** This was flagged as a non-blocking warning by QA (T-037). Recommend adding an explicit 429 handler in the axios interceptor or login/register page error handling that shows a "too many requests" message and optionally surfaces the Retry-After value.

---

### FB-023 — Activity start_time and end_time are required by API but spec implies they should be optional

| Field | Value |
|-------|-------|
| Sprint | 2 |
| Category | UX Issue |
| Severity | Minor |
| Status | Tasked |
| Related Task | T-033, T-043/T-047 (Sprint 3) |

**Steps to reproduce:**
```bash
curl -s -X POST http://localhost:3001/api/v1/trips/:id/activities \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Free Day", "activity_date": "2026-08-10"}'
```

**Expected:** Activity created with null start_time and end_time (some activities like "Free Day" or "Explore the city" don't have specific times).

**Actual:** HTTP 400 — `start_time` and `end_time` are required.

**Notes:** The UI spec (Spec 6.10) states "All rows must have `name` and `activity_date` filled" for validation, suggesting start_time and end_time might be optional. However, the API contract (T-006) lists both as required. The frontend activities edit page also requires them. This is internally consistent but reduces flexibility — users can't add timeless activities. Consider making start_time/end_time optional in a future sprint.

---

### FB-024 — TripCard date range display: duplicate date formatting logic

| Field | Value |
|-------|-------|
| Sprint | 2 |
| Category | UX Issue |
| Severity | Suggestion |
| Status | Tasked |
| Related Task | T-034, T-048 (Sprint 3) |

**Observation:** TripCard.jsx contains an inline `formatTripDateRange` function (lines 10-40) that duplicates logic already in `utils/formatDate.js` (`formatDateRange`). Both format date ranges but use slightly different logic paths.

**Recommendation:** Consolidate into a single shared utility to prevent future drift. Not a bug — both currently work correctly.

---

*End of Sprint 2 User Agent feedback. Testing completed 2026-02-25. Total entries: 14 (2 minor issues, 1 suggestion, 11 positives). Highest severity: Minor.*
