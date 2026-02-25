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
| Status | New |
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
| Status | New |
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
| Status | New |
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
| Status | New |
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
| Status | New |
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
| Status | New |
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
| Status | New |
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
| Status | New |
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
| Status | New |
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
| Status | New |
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

## Sprint 0 Feedback

*No Sprint 0 — this is the first sprint.*

---

*User Agent and Monitor Agent add entries. Manager Agent triages and updates status.*
