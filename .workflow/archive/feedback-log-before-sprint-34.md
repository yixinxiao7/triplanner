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
