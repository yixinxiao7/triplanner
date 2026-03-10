## Sprint 20 User Agent Feedback
*(Sprint 19 feature walkthrough — T-185 — tested by User Agent on 2026-03-09)*

---

### FB-001 — Auth Rate Limiting Works as Specified (T-178)

- **Feedback:** Login rate limiter correctly enforces 10-request / 15-minute window per IP
- **Sprint:** 19
- **Category:** Positive
- **Severity:** —
- **Status:** Acknowledged
- **Related Task:** T-178
- **Details:**
  Tested by sending 12 sequential POST /api/v1/auth/login requests with invalid credentials from the same IP. Requests 1–10 returned HTTP 401 (INVALID_CREDENTIALS) with the expected `RateLimit-Limit: 10`, `RateLimit-Remaining: N`, `RateLimit-Reset: N` headers on each response. Request 11 returned HTTP 429 with body `{"error":{"code":"RATE_LIMITED","message":"Too many login attempts, please try again later."}}`. Requests 12+ continued returning 429. The `RateLimit-Policy` header correctly reads `10;w=900`. Response shape exactly matches the T-178 API contract.

---

### FB-002 — Register Rate Limiting Works as Specified (T-178)

- **Feedback:** Register rate limiter correctly enforces 5-request / 60-minute window per IP
- **Sprint:** 19
- **Category:** Positive
- **Severity:** —
- **Status:** Acknowledged
- **Related Task:** T-178
- **Details:**
  Confirmed via observed `RateLimit-Policy: 5;w=3600` and `RateLimit-Limit: 5` headers on POST /api/v1/auth/register. Single registration call returned HTTP 201 with rate limit headers present. Response body shape, httpOnly refresh token cookie (Secure, HttpOnly, SameSite=Strict, Path=/api/v1/auth), and access token all correct. No regressions to existing registration behavior.

---

### FB-003 — Non-Auth Endpoints Correctly Exempt from Rate Limiting (T-178)

- **Feedback:** GET /api/v1/trips has no rate limit headers; 5 rapid requests all return 200
- **Sprint:** 19
- **Category:** Positive
- **Severity:** —
- **Status:** Acknowledged
- **Related Task:** T-178
- **Details:**
  Sent 5 rapid authenticated GET /api/v1/trips requests. All returned HTTP 200. No `RateLimit-*` headers present in response. Confirms the rate limiting middleware is correctly scoped to auth endpoints only and does not affect trip/flight/stay/activity/land-travel endpoints.

---

### FB-004 — Extra Security: generalAuthLimiter Added to /refresh and /logout Beyond Spec

- **Feedback:** `generalAuthLimiter` (30/15min) applied to /auth/refresh and /auth/logout — unspecified in T-178 but a positive security addition
- **Sprint:** 19
- **Category:** Positive
- **Severity:** —
- **Status:** Acknowledged
- **Related Task:** T-178
- **Details:**
  The `rateLimiter.js` middleware includes a `generalAuthLimiter` (30 requests per 15-minute window) applied to POST /auth/refresh and POST /auth/logout. T-178 only required `loginLimiter` and `registerLimiter`. This extra limiter provides baseline protection against token-hammering. No tests broken, no regressions. Good initiative by the Backend Engineer — worth acknowledging.

---

### FB-005 — Multi-Destination Create Trip Works End-to-End (T-180)

- **Feedback:** POST /api/v1/trips with 3-destination array returns 201 with correct destinations array persisted
- **Sprint:** 19
- **Category:** Positive
- **Severity:** —
- **Status:** Acknowledged
- **Related Task:** T-180
- **Details:**
  Steps: POST /api/v1/trips with `{"name":"Multi-Destination Test","destinations":["Tokyo","Kyoto","Osaka"]}`.
  Expected: 201 with `destinations: ["Tokyo","Kyoto","Osaka"]` in response.
  Actual: HTTP 201, response body includes `"destinations":["Tokyo","Kyoto","Osaka"]`. Array round-trips through the API intact (not flattened to string). Subsequent GET /trips returns the same array structure. Also tested with 5 destinations — all persisted correctly.

---

### FB-006 — Destination Editing via PATCH Works Correctly (T-180)

- **Feedback:** PATCH /api/v1/trips/:id with updated destinations array returns 200 and persists changes
- **Sprint:** 19
- **Category:** Positive
- **Severity:** —
- **Status:** Acknowledged
- **Related Task:** T-180
- **Details:**
  Steps: Created trip with `["Tokyo","Kyoto","Osaka"]`, then PATCH with `{"destinations":["Tokyo","Osaka","Hiroshima"]}` (removed Kyoto, added Hiroshima).
  Expected: 200, destinations updated.
  Actual: HTTP 200, `"destinations":["Tokyo","Osaka","Hiroshima"]`. Change correctly persisted. The edit flow from TripDetailsPage (DestinationChipInput in edit mode → save → PATCH) is correctly wired.

---

### FB-007 — Empty Destinations Validation Enforced on Both Create and Edit (T-180)

- **Feedback:** POST and PATCH with empty destinations array both correctly return 400 validation errors
- **Sprint:** 19
- **Category:** Positive
- **Severity:** —
- **Status:** Acknowledged
- **Related Task:** T-180
- **Details:**
  Test A: POST /api/v1/trips with `"destinations":[]` → HTTP 400, `VALIDATION_ERROR`, field message "At least one destination is required". ✅
  Test B: POST with `destinations` field omitted entirely → HTTP 400, `VALIDATION_ERROR`, same field message. ✅
  Test C: PATCH /api/v1/trips/:id with `"destinations":[]` → HTTP 400, `VALIDATION_ERROR`. ✅
  The frontend `DestinationChipInput` also disables the submit button when chip count is 0, providing a second layer of enforcement. Frontend test confirms "Add at least one destination." error message appears correctly.

---

### FB-008 — Validation Error Message Inconsistency: POST vs PATCH Empty Destinations

- **Feedback:** POST returns "At least one destination is required" but PATCH returns "destinations must have at least 1 item(s)" for the same empty-array input
- **Sprint:** 19
- **Category:** UX Issue
- **Severity:** Minor
- **Status:** Tasked → T-186
- **Related Task:** T-180
- **Details:**
  Steps to reproduce:
  1. POST /api/v1/trips with `{"name":"X","destinations":[]}` → response: `{"error":{"fields":{"destinations":"At least one destination is required"}}}`
  2. PATCH /api/v1/trips/:id with `{"destinations":[]}` → response: `{"error":{"fields":{"destinations":"destinations must have at least 1 item(s)"}}}`

  Expected: Both endpoints return the same human-friendly message (e.g., "At least one destination is required").
  Actual: PATCH exposes the raw Joi validation message, which is technical and inconsistent with the POST custom message. This inconsistency could surface in frontend error handling if PATCH 400 messages are displayed to the user. Low-priority fix — add a `.messages()` call on the Joi destinations schema for the PATCH route.

---

### FB-009 — Backend Accepts Destination Strings Longer Than 100 Characters

- **Feedback:** POST /api/v1/trips with a 150-character destination name bypasses the frontend 100-char limit and stores successfully
- **Sprint:** 19
- **Category:** Bug
- **Severity:** Minor
- **Status:** Tasked → T-186
- **Related Task:** T-180
- **Details:**
  Steps to reproduce:
  1. POST /api/v1/trips with `{"name":"Test","destinations":["A" × 150]}` via direct API call (bypassing frontend).
  2. Expected: 400 validation error — Spec 18.2 specifies 100-character max input length per destination.
  3. Actual: HTTP 201, 150-character destination stored successfully. No error.

  The frontend DestinationChipInput correctly enforces `maxLength={100}` on the HTML input element, but this is client-side-only enforcement. A direct API call bypasses it. The backend trip validation schema does not check per-item length within the destinations array. An oversized chip label would hit the CSS `max-width: 180px; text-overflow: ellipsis` truncation gracefully, so no visual crash — but it violates the spec and allows data that doesn't conform to the UI contract into the database.
  Recommendation: Add `.items(Joi.string().max(100))` to the destinations array schema in the backend trip validation.

---

### FB-010 — DestinationChipInput Component: Full Accessibility and XSS Safety Verified

- **Feedback:** DestinationChipInput correctly implements all Spec 18.2 accessibility requirements with no XSS vectors
- **Sprint:** 19
- **Category:** Positive
- **Severity:** —
- **Status:** Acknowledged
- **Related Task:** T-180
- **Details:**
  Code review of `frontend/src/components/DestinationChipInput.jsx` confirmed:
  - Each × button has `aria-label="Remove [destination name]"` ✅ (Spec 18.2 required)
  - Container has `role="group" aria-label="Destinations"` ✅
  - Text input has `aria-label="New destination"` (distinct from "+" button `aria-label="Add destination"`) ✅
  - Screen reader announcer with `aria-live="polite" aria-atomic="true"` ✅
  - Error state: `id="dest-chip-error"` with `role="alert"` ✅
  - Hint text `id="dest-chip-hint"` always in DOM for `aria-describedby` ✅
  - No `dangerouslySetInnerHTML` — chip values rendered as React text nodes (XSS safe) ✅
  - Case-insensitive duplicate check prevents adding the same city twice ✅
  - Backspace-to-remove-last-chip implemented per Spec 18.2 ✅
  - Enter and comma both add chips per Spec 18.2 ✅

---

### FB-011 — TripCard Destination Truncation Logic Correct (Spec 18.4)

- **Feedback:** `formatDestinations()` correctly renders ≤3 destinations as comma list and truncates >3 as "+N more"
- **Sprint:** 19
- **Category:** Positive
- **Severity:** —
- **Status:** Acknowledged
- **Related Task:** T-180
- **Details:**
  Reviewed `formatDestinations` in `frontend/src/utils/formatDate.js`:
  - 0 destinations → renders "—" (em dash) ✅
  - 1–3 destinations → comma-joined string ✅
  - 4+ destinations → "Paris, Rome, Athens, +2 more" pattern (Spec 18.4.1) ✅
  TripCard also renders a `title` tooltip with the full destination list when truncated (Spec 18.4.3) ✅
  Tested by creating a 5-destination trip via API — all 5 correctly persisted and formatDestinations would display "Paris, Rome, Athens, +2 more".

---

### FB-012 — Sprint 17 Regression Clean: Print Button Present and Accessible

- **Feedback:** "Print itinerary" button confirmed present in TripDetailsPage with correct aria-label after Sprint 19 changes
- **Sprint:** 19
- **Category:** Positive
- **Severity:** —
- **Status:** Acknowledged
- **Related Task:** T-177
- **Details:**
  Code review of `TripDetailsPage.jsx` confirmed the print button is unaffected by Sprint 19 multi-destination changes:
  - Button at line 634 with `aria-label="Print itinerary"` ✅
  - `onClick={() => window.print()}` correctly wired ✅
  - `import '../styles/print.css'` present at top of file ✅
  Sprint 17 regression is clean.

---

### FB-013 — All 416 Frontend and 287 Backend Tests Passing

- **Feedback:** Full test suites pass with Sprint 19 changes in place — no regressions introduced
- **Sprint:** 19
- **Category:** Positive
- **Severity:** —
- **Status:** Acknowledged
- **Related Task:** T-181, T-182
- **Details:**
  Ran `npm test --run` in `frontend/` and `backend/` directories:
  - Frontend: **416/416 pass** across 22 test files. Includes new DestinationChipInput.test.jsx (18 tests), updated CreateTripModal.test.jsx (11 tests), TripCard.test.jsx (17 tests), TripDetailsPage.test.jsx (70 tests). ✅
  - Backend: **287/287 pass** across 14 test files. Includes sprint19.test.js (9 rate-limiting tests). ✅
  No test regressions from Sprint 17/16/15/14 test suites.

---

