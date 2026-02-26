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

---

## Sprint 3 Feedback

*Populated by User Agent (T-056) — 2026-02-25. All tests run against staging over HTTPS: Backend https://localhost:3001/api/v1, Frontend https://localhost:4173.*

---

### FB-025 — HTTPS operational with TLSv1.3 and Secure cookie flag on all auth responses

| Field | Value |
|-------|-------|
| Sprint | 3 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-044 |

**Observation:** Backend serves over HTTPS at `https://localhost:3001` using TLSv1.3 (AEAD-AES256-GCM-SHA384). Frontend serves over HTTPS at `https://localhost:4173`. The `Set-Cookie` header on register, login, and refresh responses includes `HttpOnly; Secure; SameSite=Strict` flags as specified. Self-signed certificate (CN=localhost) valid through Feb 2027. All Helmet security headers present: `Strict-Transport-Security`, `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`. CORS correctly restricts to `https://localhost:4173` — tested with `Origin: https://evil.com` and confirmed the allowed origin does not change.

---

### FB-026 — Multi-destination trip creation works correctly with array and string inputs

| Field | Value |
|-------|-------|
| Sprint | 3 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-046 |

**Observation:** POST `/api/v1/trips` accepts both array format `["Tokyo","Osaka","Kyoto"]` and comma-separated string format `"Paris, London, Rome"`. Both are normalized to an array in the response. Single-destination trips also work. Validation correctly rejects empty destination arrays with 400 VALIDATION_ERROR `"At least one destination is required"`. Whitespace-only destinations are trimmed and rejected.

---

### FB-027 — Multi-destination editing via PATCH works correctly

| Field | Value |
|-------|-------|
| Sprint | 3 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-046 |

**Observation:** PATCH `/api/v1/trips/:id` with a `destinations` array correctly adds and removes destinations. Tested adding "Hiroshima" to an existing 3-destination trip, then reducing to 2 destinations — both operations return the updated list. PATCH to empty array `[]` is correctly rejected with 400 `"destinations must have at least 1 item(s)"`. GET confirms persistence of changes.

---

### FB-028 — Backend accepts duplicate destinations (case variants) without deduplication

| Field | Value |
|-------|-------|
| Sprint | 3 |
| Category | UX Issue |
| Severity | Minor |
| Status | Tasked |
| Related Task | T-046, T-058 (Sprint 4) |

**Steps to reproduce:**
```
POST /api/v1/trips with body: {"name":"Test","destinations":["Tokyo","Tokyo","tokyo"]}
```

**Expected:** Backend either deduplicates destinations (case-insensitive) or returns a validation error for duplicates.

**Actual:** Backend accepts and stores `["Tokyo","Tokyo","tokyo"]` as three separate destinations. The frontend DestinationChipInput component performs case-insensitive deduplication client-side, but the backend does not enforce this.

**Notes:** The frontend correctly prevents this from happening through the UI chip input, but direct API calls can bypass this. Low risk since regular users use the frontend, but worth considering backend validation for API consistency.

---

### FB-029 — Optional activity times (all-day activities) work correctly end-to-end

| Field | Value |
|-------|-------|
| Sprint | 3 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-043, T-047 |

**Observation:** POST `/api/v1/trips/:id/activities` with `start_time: null, end_time: null` creates an all-day activity (returns null times). Omitting both fields entirely also works. Linked validation correctly rejects mismatched times: providing only `start_time` returns 400 with error on `end_time` field, and vice versa. `end_time` before `start_time` is correctly rejected. GET list ordering is correct: timed activities (sorted by start_time ASC) appear before timeless activities within the same date (NULLS LAST). Alphabetical tiebreaker works for same-type activities.

---

### FB-030 — Activity time conversion via PATCH works both directions

| Field | Value |
|-------|-------|
| Sprint | 3 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-043 |

**Observation:** PATCH an all-day activity to add times (send `start_time: "14:00", end_time: "18:00"`) correctly converts it to a timed activity. PATCH a timed activity to `start_time: null, end_time: null` correctly converts it to an all-day activity. PATCH with only one time on an existing all-day activity correctly fails linked validation. Delete of a timeless activity returns 204 as expected.

---

### FB-031 — Rate limiting triggers correctly with proper Retry-After header

| Field | Value |
|-------|-------|
| Sprint | 3 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-045 |

**Observation:** Login endpoint rate limiting triggers after 3 failed login attempts with 429 status code. Response includes `Retry-After: <seconds>` header, `RateLimit-Remaining: 0`, and `RateLimit-Reset: <seconds>` headers. Response body returns `{ "error": { "message": "Too many requests, please try again later.", "code": "RATE_LIMIT_EXCEEDED" } }`. The frontend 429 handler (per code review) parses the Retry-After header and shows an amber countdown banner with the correct minutes calculation.

---

### FB-032 — Auth rate limit window is very aggressive for login (3 attempts per 15 minutes)

| Field | Value |
|-------|-------|
| Sprint | 3 |
| Category | UX Issue |
| Severity | Minor |
| Status | Acknowledged |
| Related Task | T-045 |

**Steps to reproduce:**
```
Send 3 incorrect login requests in quick succession.
4th request returns 429.
```

**Expected:** A reasonable rate limit window (e.g., 10-20 attempts per 15 minutes) before locking out.

**Actual:** Rate limiting triggers after just 3 failed login attempts. A legitimate user who misremembers their password could be locked out very quickly. The auth rate limit appears to be set to 10 per 15-min window (per `RateLimit-Policy: 10;w=900`), but with multiple test users sharing the same IP, the IP-based rate limit is shared across all accounts.

**Notes:** This is likely because the rate limit is IP-based rather than per-account. In staging with a single IP (localhost), this is expected. In production, users behind the same NAT/proxy could face the same issue. Consider per-account rate limiting in addition to IP-based.

---

### FB-033 — Submit button not disabled during rate limit lockout period

| Field | Value |
|-------|-------|
| Sprint | 3 |
| Category | UX Issue |
| Severity | Minor |
| Status | Tasked |
| Related Task | T-045, T-057/T-059 (Sprint 4) |

**Observation (code review):** When the 429 rate limit banner is shown on LoginPage and RegisterPage, the submit button remains enabled. A user could click "sign in" or "create account" during the lockout period, triggering another API call that would immediately return 429 again. The button should be disabled while `rateLimitMinutes > 0` to prevent unnecessary API calls and provide clearer feedback that the user must wait.

---

### FB-034 — parseRetryAfterMinutes utility is duplicated in LoginPage and RegisterPage

| Field | Value |
|-------|-------|
| Sprint | 3 |
| Category | UX Issue |
| Severity | Suggestion |
| Status | Tasked |
| Related Task | T-045, T-060 (Sprint 4) |

**Observation (code review):** The `parseRetryAfterMinutes()` function is identically defined in both `LoginPage.jsx` and `RegisterPage.jsx`. This should be extracted to a shared utility (e.g., `utils/rateLimitUtils.js`) to reduce code duplication and ensure future changes are applied consistently.

---

### FB-035 — DestinationChipInput: role="option" without role="listbox" ancestor (ARIA mismatch)

| Field | Value |
|-------|-------|
| Sprint | 3 |
| Category | UX Issue |
| Severity | Suggestion |
| Status | Tasked |
| Related Task | T-046, T-061 (Sprint 4) |

**Observation (code review):** Each destination chip `<span>` has `role="option"` but the parent container uses `role="group"`. Per ARIA spec, `role="option"` requires a `role="listbox"` ancestor. This is a minor accessibility conformance issue that could confuse screen readers. Consider changing to `role="listbox"` on the container or removing the `role` attribute from chips.

---

### FB-036 — Missing aria-describedby target IDs in DestinationChipInput and RegisterPage

| Field | Value |
|-------|-------|
| Sprint | 3 |
| Category | UX Issue |
| Severity | Minor |
| Status | Tasked |
| Related Task | T-046, T-045, T-062 (Sprint 4) |

**Observation (code review):** Two broken `aria-describedby` references found:
1. DestinationChipInput: Input references `id="dest-chip-hint"` via `aria-describedby` when no error is present, but no element with that ID exists in the component.
2. RegisterPage: Password input references `id="password-hint"` when no error is present, but the "8 characters minimum" text inside the `<label>` has no `id="password-hint"`.

These are silently ignored by browsers but could cause screen reader users to miss hint information.

---

### FB-037 — Edge case validation is comprehensive and robust

| Field | Value |
|-------|-------|
| Sprint | 3 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-043, T-046 |

**Observation:** Tested the following edge cases and all returned appropriate error responses:
- XSS payload `<script>alert(1)</script>` in destination name → stored safely (JSX auto-escaping prevents rendering)
- SQL injection `Robert'); DROP TABLE trips;--` in trip name → stored as literal string (parameterized queries protect)
- Trip name >255 characters → 400 `"name must be at most 255 characters"`
- Invalid UUID in path → 400 `"Invalid ID format"`
- Non-existent valid UUID → 404 `"Trip not found"`
- Invalid/expired auth token → 401 `"Invalid or expired token"`
- No auth header → 401 `"Authentication required"`
- Empty registration body → 400 with field-specific validation errors
- Number instead of string for trip name → 400 `"name must be a string"`
- Malformed JSON body → 400 `"Invalid JSON in request body"`
- Duplicate email registration → 409 `"An account with this email already exists"`
- Short password (<8 chars) → 400 `"Password must be at least 8 characters"`
- Invalid email format → 400 `"A valid email address is required"`
- Whitespace-only trip name → 400 (trimmed and rejected)
- Whitespace-only destination → 400 (trimmed and rejected)
- end_time before start_time → 400 `"End time must be after start time"`
- Emoji in activity name → Stored and returned correctly

---

### FB-038 — Sprint 1+2 regression: all core features work correctly over HTTPS

| Field | Value |
|-------|-------|
| Sprint | 3 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-044 |

**Observation:** Full regression test of all Sprint 1 and Sprint 2 features over HTTPS:
- Auth: register (201), login (200), refresh (200), logout (204) — all work correctly with Secure cookies
- Trips CRUD: create (201), list (200), get (200), update (200), delete (204) — all work with correct response shapes
- Flights CRUD: create (201), list (200), delete (204) — correct field validation
- Stays CRUD: create (201), list (200), delete (204) — correct category validation
- Activities CRUD: timed (201) and all-day (201), list with NULLS LAST ordering, PATCH conversion, delete (204)
- Cross-user authorization: properly enforced
- SPA routing: all routes (/login, /register, /, /trips/:id) return 200 over HTTPS
- Frontend assets load over HTTPS

---

### FB-039 — pm2 process management operational with auto-restart

| Field | Value |
|-------|-------|
| Sprint | 3 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-050 |

**Observation:** Backend process `triplanner-backend` running under pm2 in cluster mode, status `online`, with 3 restarts recorded (expected from deployment/testing). Process manages auto-restart correctly. Memory usage at ~71MB — reasonable for a Node.js application.

---

### FB-040 — Docker Compose and CI/CD configuration files committed

| Field | Value |
|-------|-------|
| Sprint | 3 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-051 |

**Observation:** All production deployment preparation files exist in their expected locations:
- `infra/docker-compose.yml` — Docker Compose for full stack
- `infra/Dockerfile.backend` — Backend container image
- `infra/Dockerfile.frontend` — Frontend container image with nginx
- `infra/nginx.conf` — nginx configuration for SPA + reverse proxy
- `infra/ecosystem.config.cjs` — pm2 ecosystem config
- `infra/DEPLOY.md` — Deployment runbook
- `infra/.env.docker.example` — Environment variable template
- `.github/workflows/ci.yml` — GitHub Actions CI pipeline
Sprint 3 success criteria for Docker/CI met.

---

### FB-041 — Frontend: all 230 tests pass, Sprint 3 components well-implemented

| Field | Value |
|-------|-------|
| Sprint | 3 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-045, T-046, T-047, T-048, T-049 |

**Observation:** `npx vitest run` passes all 230 tests across 16 test files (2.77s). Sprint 3 specific highlights:
- DestinationChipInput: 13 tests covering add/remove/duplicate prevention/keyboard handling/accessibility
- 429 rate limit handling: 4 tests (2 per page) covering Retry-After parsing and fallback
- All-day badge: tests verify null-time rendering with "all day" text and correct aria-label
- Activity ordering: tests confirm timed-before-timeless sort within same date
- formatTripDateRange utility: 14 tests covering same-year, cross-year, null handling
- Edit page test hardening (T-049): 51 total tests across 3 edit pages covering form submission, validation, edit, delete, cancel
Only warnings are React Router v7 future flag deprecation notices — non-blocking.

---

### FB-042 — All-day badge styling matches UI spec amber color scheme

| Field | Value |
|-------|-------|
| Sprint | 3 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-047 |

**Observation (code review):** The `.allDayBadge` CSS class uses the correct amber color scheme from UI Spec 9.1.2: `background: rgba(196, 122, 46, 0.15)`, `border: 1px solid rgba(196, 122, 46, 0.3)`, `color: #C47A2E`. Uppercase, 10px font, 600 weight. Distinct from the status badges (which use accent/green/muted tones). The `ActivityEntry` component correctly checks `isAllDay = !activity.start_time && !activity.end_time` and displays the badge accordingly with appropriate aria-labels.

---

### FB-043 — TripCard date formatting consolidated to shared utility (T-048 resolved)

| Field | Value |
|-------|-------|
| Sprint | 3 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-048, FB-024 |

**Observation (code review):** TripCard now imports `formatTripDateRange` from `utils/formatDate.js` instead of using inline duplicate logic (resolving FB-024 from Sprint 2). The shared utility handles same-year, cross-year, start-only, and null date ranges with graceful fallbacks. TripCard test includes a date range formatting assertion ("Aug 7 – Aug 14, 2026").

---

*End of Sprint 3 User Agent feedback. Testing completed 2026-02-25. Total entries: 19 (FB-025 through FB-043). Issues: 1 minor bug, 3 minor UX issues, 2 suggestions, 13 positives. Highest severity: Minor.*

---

## Sprint 4 Feedback

*Populated by User Agent (T-070) — 2026-02-25. All tests run against staging over HTTPS: Backend https://localhost:3001/api/v1, Frontend https://localhost:4173. Tokens obtained via fresh registration.*

---

### FB-044 — T-058: Destination deduplication works correctly on POST /trips (exact, case-variant, mixed, Unicode, whitespace)

| Field | Value |
|-------|-------|
| Sprint | 4 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-058 |

**What was tested:** 12 POST /trips requests with varying dedup scenarios:
- Exact duplicates `["Tokyo","Tokyo","Tokyo"]` → `["Tokyo"]` ✅
- Case-variant duplicates `["Paris","paris","PARIS"]` → `["Paris"]` ✅
- Mixed duplicates `["Tokyo","tokyo","Osaka","osaka","Kyoto"]` → `["Tokyo","Osaka","Kyoto"]` ✅
- No duplicates passthrough `["London","Berlin","Rome"]` → unchanged ✅
- Single destination `["Singapore"]` → unchanged ✅
- First-occurrence preservation `["pArIs","PARIS","paris","Paris"]` → `["pArIs"]` ✅
- Order preservation `["Berlin","tokyo","Berlin","Tokyo","Kyoto","kyoto"]` → `["Berlin","tokyo","Kyoto"]` ✅
- Unicode duplicates `["東京","東京","大阪"]` → `["東京","大阪"]` ✅
- Whitespace-padded duplicates `["Tokyo ","Tokyo","  Tokyo  "]` → `["Tokyo"]` ✅

All dedup scenarios produce correct results. First occurrence is preserved. Order is maintained. This resolves FB-028 from Sprint 3.

---

### FB-045 — T-058: Destination deduplication works correctly on PATCH /trips/:id

| Field | Value |
|-------|-------|
| Sprint | 4 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-058 |

**What was tested:** PATCH /trips/:id with duplicate destinations and edge cases:
- PATCH with case-variant duplicates `["London","london","LONDON","Berlin"]` → `["London","Berlin"]` ✅
- PATCH with name only (no destinations field) → destinations unchanged ✅
- PATCH with all unique destinations → passthrough, no dedup interference ✅

PATCH dedup behaves identically to POST dedup. Name-only updates do not affect existing destinations.

---

### FB-046 — T-058: Backend dedup implementation is clean, safe, and well-tested (code review)

| Field | Value |
|-------|-------|
| Sprint | 4 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-058 |

**Observation (code review):** `deduplicateDestinations()` in `backend/src/models/tripModel.js` is a clean, exported pure function using Set-based case-insensitive comparison. Non-array guard clause returns input unchanged. Applied in both `createTrip()` (before DB insert) and `updateTrip()` (when destinations field is present). All Knex queries remain parameterized — no SQL injection risk introduced. 19 new tests in `sprint4.test.js` covering: 10 unit tests for the pure function (exact, case-variant, multiple pairs, single element, no dupes, order preservation, empty array, non-array guard, trimmed inputs, immutability) + 4 POST integration tests + 5 PATCH integration tests. All 168/168 backend tests pass.

---

### FB-047 — T-059: Submit button correctly disabled during rate limit lockout with "please wait…" text

| Field | Value |
|-------|-------|
| Sprint | 4 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-059 |

**Observation (code review):** Both LoginPage and RegisterPage implement identical lockout behavior:
- Submit button `disabled={isLoading || rateLimitMinutes > 0}` ✅
- Button text changes to `"please wait…"` (Unicode ellipsis `\u2026`) during lockout ✅
- `aria-disabled` set to `"true"` when loading or locked out ✅
- Countdown timer uses `setInterval` with 3-point cleanup: unmount cleanup via `useEffect` return, pre-start cleanup before new countdown, countdown-end cleanup when reaching 0 ✅
- Cleanup also runs on successful login/registration ✅

This resolves FB-033 from Sprint 3.

---

### FB-048 — T-060: parseRetryAfterMinutes extracted to shared utility (no duplication)

| Field | Value |
|-------|-------|
| Sprint | 4 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-060 |

**Observation (code review):** `parseRetryAfterMinutes()` is defined once in `frontend/src/utils/rateLimitUtils.js`. Both LoginPage (line 5) and RegisterPage (line 5) import from this shared utility. No duplication exists. The utility has 9 dedicated tests in `rateLimitUtils.test.js`. This resolves FB-034 from Sprint 3.

---

### FB-049 — T-061: ARIA role mismatch fixed — role="option" removed from DestinationChipInput chips

| Field | Value |
|-------|-------|
| Sprint | 4 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-061 |

**Observation (code review):** Destination chip `<span>` elements no longer have `role="option"`. The container retains `role="group"` with `aria-label="Destinations"`, which is the correct ARIA pattern for a group of related elements that are not list items. This resolves FB-035 from Sprint 3.

---

### FB-050 — T-062: aria-describedby target IDs now exist in DOM for both DestinationChipInput and RegisterPage

| Field | Value |
|-------|-------|
| Sprint | 4 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-062 |

**Observation (code review):**
1. **DestinationChipInput:** Element with `id="dest-chip-hint"` is rendered unconditionally (not inside a conditional). Input's `aria-describedby` toggles between `"dest-chip-hint"` (no error) and `"dest-chip-error"` (error present) ✅
2. **RegisterPage:** Element with `id="password-hint"` exists as a `<span>` with text "8 characters minimum" rendered inside the label. Password input's `aria-describedby` toggles between `"password-hint"` (no error) and `"password-error"` (error present) ✅

This resolves FB-036 from Sprint 3. Screen readers will now correctly announce hint text for both inputs.

---

### FB-051 — T-063: CreateTripModal returns focus to trigger button on all close paths

| Field | Value |
|-------|-------|
| Sprint | 4 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-063 |

**Observation (code review):**
- `createTripBtnRef` created in HomePage and attached to the "+ new trip" trigger button ✅
- Ref passed to CreateTripModal as `triggerRef` prop ✅
- Centralized `handleClose` function uses `requestAnimationFrame(() => triggerRef?.current?.focus())` for reliable focus timing ✅
- All 4 close paths use `handleClose`: Escape key, backdrop click, X button, Cancel button ✅
- After successful creation, user navigates to `/trips/:id` — focus return is not needed since the page changes entirely ✅

Implementation is clean. The `useCallback` with `[onClose, triggerRef]` dependency list is correct.

---

### FB-052 — T-064: Axios 401 retry queue has 8 comprehensive dedicated unit tests

| Field | Value |
|-------|-------|
| Sprint | 4 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-064 |

**Observation (code review):** `frontend/src/__tests__/axiosInterceptor.test.js` contains 8 dedicated tests in the `'Axios 401 Retry Queue Interceptor'` describe block:
1. Retries original request after successful token refresh on 401 ✅
2. Calls setTokenFn with new access token after successful refresh ✅
3. Queues concurrent 401 requests and retries all after single refresh ✅
4. Clears auth and calls onUnauthorized when refresh fails ✅
5. Does not intercept non-401 errors (500 passthrough) ✅
6. Does not intercept 401 on /auth/login (prevents interference with login flow) ✅
7. Does not intercept 401 on /auth/refresh (prevents infinite refresh loop) ✅
8. Adds Authorization header with Bearer token to requests ✅

Coverage exceeds the requirement (≥5 tests) and covers all critical scenarios including edge cases for infinite loop prevention and auth endpoint exclusion.

---

### FB-053 — T-065: nginx.conf hardened with server_tokens off and comprehensive CSP header

| Field | Value |
|-------|-------|
| Sprint | 4 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-065 |

**Observation (code review):** `infra/nginx.conf` includes:
- `server_tokens off;` at server level — hides nginx version from error pages and Server header ✅
- `Content-Security-Policy` header at server level and duplicated in `/assets/` location block (necessary because nginx's `add_header` in a location block overrides server-level headers) ✅
- CSP policy: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'; frame-ancestors 'self'; base-uri 'self'; form-action 'self'` — restrictive and appropriate ✅
- Additional security headers present: X-Frame-Options, X-Content-Type-Options, Referrer-Policy ✅

---

### FB-054 — All 428 tests pass (168 backend + 260 frontend) with zero regressions

| Field | Value |
|-------|-------|
| Sprint | 4 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-058, T-059, T-060, T-061, T-062, T-063, T-064 |

**What was tested:** Full test suites for both backend and frontend.

**Details:**
- Backend: `npx vitest run` → 168/168 tests pass across 9 test files (728ms) ✅
- Frontend: `npx vitest run` → 260/260 tests pass across 18 test files (3.01s) ✅
- No regressions from Sprint 1/2/3 tests
- Only warnings: React Router v7 future flag deprecation notices (non-blocking, known)

---

### FB-055 — Full Sprint 1+2+3 regression passes over HTTPS — all core features operational

| Field | Value |
|-------|-------|
| Sprint | 4 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-044, T-070 |

**What was tested:** Complete end-to-end regression of all Sprint 1, 2, and 3 features over HTTPS:

**Auth flow:**
- Register → 201 with access token + HttpOnly/Secure/SameSite=Strict cookie ✅
- Login → 200 with access token ✅
- Logout → 204 ✅

**Trip CRUD:**
- Create with destinations + dates → 201, status auto-calculated as PLANNING ✅
- Get → 200 ✅
- Patch → 200 ✅
- List with pagination → 200 ✅
- Delete → 204, subsequent GET → 404 ✅

**Flight CRUD:**
- Create (all 8 fields) → 201 ✅
- List → 200 ✅
- Delete → 204 ✅

**Stay CRUD:**
- Create (HOTEL category, with timezone fields) → 201 ✅
- Delete → 204 ✅

**Activity CRUD:**
- Create timed activity → 201, activity_date as YYYY-MM-DD ✅
- Create all-day activity (null times) → 201 ✅
- PATCH all-day → timed conversion → 200 ✅
- Activity ordering: timed before timeless (NULLS LAST) ✅

**Validation & Security:**
- UUID validation → 400 ✅
- No auth → 401 ✅
- Invalid token → 401 ✅
- Malformed JSON → 400 INVALID_JSON ✅
- Cross-user access → 403 FORBIDDEN (GET, PATCH, DELETE, POST sub-resources) ✅
- User's trip list shows only own trips (no data leakage) ✅

**Frontend SPA:**
- `/` → 200 ✅
- `/login` → 200 ✅
- `/trips/:id` → 200 ✅

**Infrastructure:**
- TLS handshake successful ✅
- pm2 process online (cluster mode) ✅
- Frontend dist/ exists with index.html + hashed JS (301KB) + CSS (55KB) assets ✅

---

### FB-056 — All Sprint 3 feedback items addressed in Sprint 4

| Field | Value |
|-------|-------|
| Sprint | 4 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-057, T-058, T-059, T-060, T-061, T-062 |

**Observation:** All 5 Sprint 3 feedback items that were promoted to Sprint 4 tasks have been successfully implemented and verified:
- FB-028 (destination dedup) → T-058: Backend dedup works on POST + PATCH ✅
- FB-033 (submit button lockout) → T-059: Button disabled + "please wait…" during 429 ✅
- FB-034 (parseRetryAfterMinutes duplication) → T-060: Extracted to shared utility ✅
- FB-035 (ARIA role mismatch) → T-061: role="option" removed ✅
- FB-036 (aria-describedby targets) → T-062: IDs added, references correct ✅

Additionally, 3 long-standing tech debt items were resolved:
- B-018 (triggerRef focus) → T-063: CreateTripModal returns focus to trigger ✅
- B-019 (axios retry test) → T-064: 8 dedicated tests ✅
- QA WARN items → T-065: nginx hardened with server_tokens off + CSP ✅

---

*End of Sprint 4 User Agent feedback. Testing completed 2026-02-25. Total entries: 13 (FB-044 through FB-056). Issues: 0. Positives: 13. Highest severity: None — zero issues found. This is the cleanest sprint to date.*

---

## Sprint 5 Feedback

*Populated by User Agent (T-080) — 2026-02-26. All tests run against staging over HTTPS: Backend https://localhost:3001/api/v1, Frontend https://localhost:4173. Tokens obtained via fresh registration. 35+ API test scenarios executed.*

---

### FB-057 — T-072: Search by name and destination works correctly (case-insensitive, partial match)

| Field | Value |
|-------|-------|
| Sprint | 5 |
| Category | Positive |
| Severity | — |
| Status | New |
| Related Task | T-072 |

**What was tested:** 6 search scenarios via GET /api/v1/trips?search=<term>:
1. `?search=Tokyo` — Returns 2 trips: "Japan Adventure 2026" (Tokyo in destinations) and "Tokyo to Sydney" (Tokyo in name) ✅
2. `?search=Bali` — Returns 1 trip: "Southeast Asia" (Bali in destinations) ✅
3. `?search=tokyo` (lowercase) — Returns same 2 trips as uppercase search — case-insensitive ILIKE works correctly ✅
4. `?search=zzznomatch` — Returns `{ data: [], pagination: { total: 0 } }` — 200 OK, not error ✅
5. `?search=%20%20%20` (whitespace only) — Returns all 5 trips (whitespace trimmed, treated as no filter) ✅
6. `?search=Sing` (partial) — Returns 1 trip: "Southeast Asia" (Singapore in destinations) — partial match works ✅

All search scenarios produce correct results per the API contract.

---

### FB-058 — T-072: Status filter correctly uses computed trip status (PLANNING, ONGOING, COMPLETED)

| Field | Value |
|-------|-------|
| Sprint | 5 |
| Category | Positive |
| Severity | — |
| Status | New |
| Related Task | T-072 |

**What was tested:** Status filter with 5 trips spanning all three computed statuses:
- `?status=PLANNING` → Returns 3 trips (Japan Adventure 2026, Korea Trip, Tokyo to Sydney) — correctly includes no-dates trip as PLANNING ✅
- `?status=ONGOING` → Returns 1 trip (Southeast Asia — dates span today 2026-02-26) ✅
- `?status=COMPLETED` → Returns 1 trip (Europe Tour — dates in past) ✅
- `?status=INVALID` → 400 `VALIDATION_ERROR` with `"Status filter must be one of: PLANNING, ONGOING, COMPLETED"` ✅
- `?status=planning` (lowercase) → 400 `VALIDATION_ERROR` — correctly requires uppercase ✅

**Details:** The pagination.total correctly reflects the filtered count (e.g., PLANNING returns total=3, not total=5). Status computation is accurate: future trips are PLANNING, date-spanning trips are ONGOING, past trips are COMPLETED, no-date trips default to PLANNING.

---

### FB-059 — T-072: Sort by name, start_date, and created_at all work correctly with proper NULL handling

| Field | Value |
|-------|-------|
| Sprint | 5 |
| Category | Positive |
| Severity | — |
| Status | New |
| Related Task | T-072 |

**What was tested:** 8 sort scenarios:
1. `?sort_by=name&sort_order=asc` → Europe Tour, Japan Adventure 2026, Korea Trip, Southeast Asia, Tokyo to Sydney — alphabetical A-Z ✅
2. `?sort_by=name&sort_order=desc` → Reversed order — Z-A ✅
3. `?sort_by=start_date&sort_order=asc` → Europe Tour (2025-06-01), Southeast Asia (2026-02-20), Japan (2026-08-07), Tokyo to Sydney (2026-12-01), Korea Trip (null) — NULLS LAST ✅
4. `?sort_by=start_date&sort_order=desc` → Tokyo to Sydney (2026-12-01), Japan (2026-08-07), Southeast Asia (2026-02-20), Europe Tour (2025-06-01), Korea Trip (null) — NULLS LAST in DESC too ✅
5. `?sort_by=created_at&sort_order=asc` → Oldest first ✅
6. `?sort_by=created_at&sort_order=desc` → Newest first ✅
7. No params → Same order as created_at desc — backward compatible ✅
8. Invalid sort_by/sort_order → 400 with proper error messages ✅

**Details:** NULLS LAST behavior is correctly applied in both ASC and DESC directions for start_date sort. Name sort is case-insensitive (uses LOWER(name) in ORDER BY). Default sort (no params) preserves Sprint 1-4 behavior exactly.

---

### FB-060 — T-072: Combined search + filter + sort parameters compose correctly

| Field | Value |
|-------|-------|
| Sprint | 5 |
| Category | Positive |
| Severity | — |
| Status | New |
| Related Task | T-072 |

**What was tested:** 7 combined parameter scenarios:
1. `?search=Tokyo&status=PLANNING` → 2 trips (both Tokyo matches are PLANNING) ✅
2. `?search=Tokyo&sort_by=name&sort_order=asc` → Japan Adventure 2026, Tokyo to Sydney (alphabetical) ✅
3. `?search=a&status=PLANNING&sort_by=name&sort_order=asc` → Japan Adventure 2026, Korea Trip (both have 'a', both PLANNING, sorted) ✅
4. `?status=PLANNING&sort_by=start_date&sort_order=asc` → Japan, Tokyo to Sydney, Korea Trip (NULLS LAST) ✅
5. `?status=PLANNING&page=1&limit=2` → 2 trips, pagination.total=3 ✅
6. `?status=PLANNING&page=2&limit=2` → 1 trip, pagination.total=3 ✅
7. `?search=Tokyo&status=COMPLETED` → Empty result `{ data: [], total: 0 }` (no Tokyo trips are COMPLETED) ✅

Pagination correctly reflects filtered count, not total trips in database. All parameters compose seamlessly.

---

### FB-061 — T-072: SQL injection and XSS prevention in search parameter

| Field | Value |
|-------|-------|
| Sprint | 5 |
| Category | Positive |
| Severity | — |
| Status | New |
| Related Task | T-072 |

**What was tested:** 5 attack vector scenarios:
1. `?search=';DROP TABLE trips;--` → 200 OK, empty results — SQL injection treated as literal string ✅
2. `?search=' UNION SELECT * FROM users--` → 200 OK, empty results — UNION injection treated as literal ✅
3. `?search=<script>alert(1)</script>` → 200 OK, empty results — XSS payload treated as literal ✅
4. Very long search string (500 characters) → 200 OK, empty results — handled gracefully ✅
5. No auth / invalid auth on search endpoint → 401 `UNAUTHORIZED` ✅

**Details:** All queries use Knex parameterized bindings (`?` placeholders). The search string is treated as a literal value, never interpolated into SQL. Confirmed by code review: line 145-148 of tripModel.js uses `whereRaw('name ILIKE ?', [searchTerm])` — the `?` ensures parameterization.

---

### FB-062 — T-072: ILIKE wildcard characters (%, _) in search are not escaped — minor inconsistency

| Field | Value |
|-------|-------|
| Sprint | 5 |
| Category | Security |
| Severity | Minor |
| Status | New |
| Related Task | T-072 |

**Steps to reproduce:**
```
GET /api/v1/trips?search=%25 (URL-encoded %)
```

**Expected:** Return trips where the name or destination literally contains the character `%`. Or return 0 results since no trip name/destination contains `%`.

**Actual:** Returns ALL trips (total=5). The `%` character is an ILIKE wildcard, and since the search term `%` is wrapped in `%...%`, the final ILIKE pattern becomes `%%%` which matches any string.

**Details:** In `backend/src/models/tripModel.js` line 145, the search term is constructed as `` `%${search.trim()}%` `` without escaping ILIKE wildcard characters (`%` and `_`). Similarly, `_` acts as a single-character wildcard. This is NOT a SQL injection vulnerability (queries are parameterized), but it means:
1. Searching for `%` returns all trips (matches everything)
2. Searching for `_` matches any single character in trip names
3. A user could craft patterns like `%admin%` to probe for data (though results are user-scoped, so this has no cross-user impact)

**Recommendation:** Escape `%` and `_` characters before constructing the ILIKE pattern: `search.trim().replace(/%/g, '\\%').replace(/_/g, '\\_')`. Low priority since results are always user-scoped and this has no security impact beyond the user's own data.

---

### FB-063 — T-072: Validation error response includes all invalid fields in a single response

| Field | Value |
|-------|-------|
| Sprint | 5 |
| Category | Positive |
| Severity | — |
| Status | New |
| Related Task | T-072 |

**What was tested:** `GET /api/v1/trips?sort_by=invalid&sort_order=invalid&status=invalid` with valid auth token.

**Result:** HTTP 400 with response:
```json
{
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "fields": {
      "status": "Status filter must be one of: PLANNING, ONGOING, COMPLETED",
      "sort_by": "Sort field must be one of: name, created_at, start_date",
      "sort_order": "Sort order must be one of: asc, desc"
    }
  }
}
```

All three invalid fields reported in a single response. Error messages are descriptive and list valid options. Response shape matches API contract exactly. The `search` parameter is correctly never included in validation errors (any string is valid).

---

### FB-064 — T-073: FilterToolbar component fully implements Spec 11 with correct debounce, accessibility, and responsiveness

| Field | Value |
|-------|-------|
| Sprint | 5 |
| Category | Positive |
| Severity | — |
| Status | New |
| Related Task | T-073 |

**What was reviewed (code review):** `FilterToolbar.jsx` + `FilterToolbar.module.css`

**Spec 11 compliance verified:**
- **11.1 Layout:** flex container, gap 12px, flex-wrap for responsive, margin-bottom 24px ✅
- **11.2 Search Input:** 40px height, surface-alt background, 300ms debounce via `setTimeout`/`clearTimeout`, magnifying glass SVG icon (aria-hidden), clear button (X) visible only when input has text, `aria-label="Search trips by name or destination"`, `aria-describedby="search-hint"` with screen-reader-only hint text, `type="search"`, Escape key clears via `handleKeyDown`, immediate clear (no debounce) when emptied ✅
- **11.3 Status Filter:** Native `<select>` with 4 options (all statuses, planning, ongoing, completed), width 180px, appearance:none with custom SVG chevron, `aria-label="Filter by status"` ✅
- **11.4 Sort Selector:** Native `<select>` with 6 combined options (newest first, oldest first, name A-Z, name Z-A, soonest trip first, latest trip first), width 220px, `aria-label="Sort trips"` ✅
- **11.5 Clear Filters:** Visible only when `hasActiveFilters` is true, text "clear filters" (lowercase), 11px font, muted color, hover accent + underline, `aria-label="Clear all filters and sorting"`, returns focus to search input after clearing ✅
- **11.12 Responsive:** 3 breakpoints (>1023px default, 768-1023px reduced widths, <768px full-width stacked) ✅
- **11.13 Accessibility:** `role="search"`, `aria-label="Filter trips"` on toolbar container, all interactive elements have aria-labels, search hint for screen readers ✅
- **Cleanup:** Debounce timeout cleaned up on unmount via useEffect return ✅

---

### FB-065 — T-073: EmptySearchResults component implements Spec 11.7.3 with dynamic subtext

| Field | Value |
|-------|-------|
| Sprint | 5 |
| Category | Positive |
| Severity | — |
| Status | New |
| Related Task | T-073 |

**What was reviewed (code review):** `EmptySearchResults.jsx` + `EmptySearchResults.module.css`

**Spec 11.7.3 compliance verified:**
- Centered layout with padding-top/bottom 60px ✅
- Search-with-question-mark SVG icon, 40px, accent color at 30% opacity ✅
- Heading "no trips found" — 16px, font-weight 400 ✅
- Dynamic subtext logic covers all 4 cases: search+status, search only, status only, fallback ✅
- Search term truncated at 30 characters with Unicode ellipsis (…) ✅
- Smart quotes around search term (Unicode " ") ✅
- "clear filters" secondary button with correct styling (transparent bg, accent border, hover effect) ✅
- Status label converted to lowercase (e.g., "no planning trips") ✅

---

### FB-066 — T-073: HomePage correctly integrates toolbar, URL param sync, result count, and all 6 states

| Field | Value |
|-------|-------|
| Sprint | 5 |
| Category | Positive |
| Severity | — |
| Status | New |
| Related Task | T-073 |

**What was reviewed (code review):** `HomePage.jsx`

**Spec 11 integration verified:**
- **URL param sync (Spec 11.6):** `useSearchParams` reads/writes URL params. Default values omitted from URL (clean URLs). Invalid params silently ignored via `parseUrlParams()`. Uses `{ replace: true }` to avoid polluting browser history ✅
- **Result count (Spec 11.7.2):** "showing X trip(s)" text shown only when search or status filter is active. Correct singular/plural handling ("showing 1 trip" vs "showing 3 trips"). Uses `aria-live="polite"` and `role="status"` for screen readers ✅
- **Loading state (Spec 11.7.4):** Trip grid fades to 50% opacity with 200ms transition during refetch (Option A implementation per spec preference) ✅
- **Empty database state (Spec 2.4):** "no trips yet" with CTA button, toolbar NOT shown ✅
- **Empty search results (Spec 11.7.3):** EmptySearchResults component shown, toolbar remains visible ✅
- **Error state (Spec 11.7.5):** Error block with "try again" button retries with current filter params (not default) ✅
- **Initial load (Spec 11.7.6):** Skeleton cards shown, toolbar not visible until data loads ✅
- **Stale request prevention:** `requestIdRef` counter in useTrips hook ensures stale responses are discarded ✅
- **hasTripsBefore tracking:** Correctly distinguishes "zero trips in DB" from "no search results" using separate state variable ✅

---

### FB-067 — T-073: Filter toolbar briefly disappears during API refetch (toolbar flicker on slow connections)

| Field | Value |
|-------|-------|
| Sprint | 5 |
| Category | UX Issue |
| Severity | Minor |
| Status | New |
| Related Task | T-073 |

**Observation (code review):** In `HomePage.jsx` line 162:
```javascript
const showToolbar = initialLoadDone && !isLoading && (hasTripsBefore || trips.length > 0);
```

The `!isLoading` condition causes the toolbar to unmount during API refetch (when changing search, status, or sort). Per Spec 11.7.4: *"The toolbar controls remain interactive (user can change filters while loading)"*. With fast localhost API calls this is imperceptible, but on slower connections (production, mobile, etc.) the toolbar would visibly flash/disappear and reappear.

**Expected (per Spec 11.7.4):** Toolbar stays visible and interactive during refetch. Only the trip grid area shows a loading indicator.

**Recommended fix:** Remove `!isLoading` from the `showToolbar` condition:
```javascript
const showToolbar = initialLoadDone && (hasTripsBefore || trips.length > 0);
```
This keeps toolbar visible during refetch while still hiding it during initial page load (`initialLoadDone` is false until first fetch completes).

---

### FB-068 — T-074: React Router v7 future flags correctly applied in main.jsx and all test files

| Field | Value |
|-------|-------|
| Sprint | 5 |
| Category | Positive |
| Severity | — |
| Status | New |
| Related Task | T-074 |

**What was verified (code review):** `main.jsx` line 10:
```jsx
<BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
```

Both `v7_startTransition` and `v7_relativeSplatPath` flags are set. All 296 frontend tests pass with zero React Router deprecation warnings. The migration is purely configurational — no behavioral changes, no routing logic modified. All 9 MemoryRouter instances in test files also have the future flags applied (per QA verification in handoff-log).

---

### FB-069 — T-075: Playwright E2E framework operational with 4/4 tests passing (9.0s)

| Field | Value |
|-------|-------|
| Sprint | 5 |
| Category | Positive |
| Severity | — |
| Status | New |
| Related Task | T-075 |

**What was tested:** `npx playwright test` from project root.

**Results:**
```
  ✓ Test 1: Core user flow — register, create trip, view details, delete, logout (1.6s)
  ✓ Test 2: Sub-resource CRUD — create trip, add flight, add stay, verify on details page (1.6s)
  ✓ Test 3: Search, filter, sort — create trips, search, filter by status, sort by name, clear filters (4.0s)
  ✓ Test 4: Rate limit lockout — rapid wrong-password login triggers 429 banner and disables submit (569ms)
  4 passed (9.0s)
```

All 4 E2E tests pass against the staging environment. Test 3 specifically validates the Sprint 5 search/filter/sort functionality end-to-end through the browser. The tests use Chromium with HTTPS (ignoreHTTPSErrors for self-signed cert).

---

### FB-070 — All 496 tests pass (196 backend + 296 frontend + 4 E2E) with zero regressions

| Field | Value |
|-------|-------|
| Sprint | 5 |
| Category | Positive |
| Severity | — |
| Status | New |
| Related Task | T-072, T-073, T-074, T-075 |

**What was tested:** Full test suites for backend, frontend, and E2E:
- Backend: `npx vitest run` → 196/196 tests pass across 10 test files (784ms) ✅
- Frontend: `npx vitest run` → 296/296 tests pass across 21 test files (3.40s) ✅
- E2E: `npx playwright test` → 4/4 tests pass (9.0s) ✅
- Total: 496 tests, zero failures, zero regressions

Sprint 5 added 68 new tests (28 backend Sprint 5 tests + 36 frontend search/filter/sort tests + 4 E2E). Zero React Router deprecation warnings in frontend test output.

---

### FB-071 — Full Sprint 1-4 regression passes over HTTPS — all core features operational

| Field | Value |
|-------|-------|
| Sprint | 5 |
| Category | Positive |
| Severity | — |
| Status | New |
| Related Task | T-080 |

**What was tested:** Complete end-to-end regression of all Sprint 1-4 features over HTTPS with fresh user:

**Auth flow:**
- Register → 201 with user object + access token ✅
- Refresh (invalid cookie) → 401 INVALID_REFRESH_TOKEN ✅
- Logout → 204 ✅

**Trip CRUD:**
- Create with destinations + dates → 201, auto-computed PLANNING status ✅
- Get → 200 ✅
- Patch → 200 ✅
- List with pagination → 200, correct total ✅
- Delete → 204, subsequent GET → 404 ✅

**Sub-resource CRUD:**
- Create flight (8 fields) → 201 ✅
- List flights → 200 ✅
- Create stay (HOTEL) → 201 ✅
- Create timed activity → 201 ✅
- Create all-day activity (null times) → 201 ✅

**Validation & Security:**
- UUID validation → 400 ✅
- No auth → 401 ✅
- Invalid JSON → 400 ✅
- Empty body → 400 with field errors ✅
- Cross-user GET → 403 FORBIDDEN ✅
- Cross-user DELETE → 403 FORBIDDEN ✅
- Other user's trip list → empty (no data leakage) ✅

**Frontend SPA & Infrastructure:**
- All SPA routes (/, /login, /trips/:id, /nonexistent) → 200 ✅
- TLS handshake successful ✅
- Security headers present (CSP, HSTS, X-Content-Type-Options, X-Frame-Options) ✅

---

### FB-072 — Frontend build output correct with proper asset hashing

| Field | Value |
|-------|-------|
| Sprint | 5 |
| Category | Positive |
| Severity | — |
| Status | New |
| Related Task | T-078 |

**What was verified:** `frontend/dist/` directory exists with:
- `index.html` (388 bytes) ✅
- `assets/` directory with hashed JS and CSS bundles ✅
- Frontend serving correctly at https://localhost:4173 ✅
- All routes return 200 (SPA client-side routing) ✅

---

*End of Sprint 5 User Agent feedback. Testing completed 2026-02-26. Total entries: 16 (FB-057 through FB-072). Issues: 2 (1 minor security, 1 minor UX). Positives: 14. Highest severity: Minor. Overall impression: Excellent sprint — search/filter/sort works flawlessly end-to-end, E2E test coverage established, React Router migration clean.*
