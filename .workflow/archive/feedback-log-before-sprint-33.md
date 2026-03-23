## Sprint 32 User Agent Feedback — T-262 Staging Walkthrough

**Date:** 2026-03-20
**Sprint:** 32
**Task:** T-262
**Tested by:** User Agent
**Environment:** Staging (backend HTTPS localhost:3001, frontend HTTPS localhost:4173)

---

### FB-136 — Stay Category Case Normalization (T-258) — All Variants Verified

| Field | Value |
|-------|-------|
| Feedback | Stay category case normalization works correctly for all input variants |
| Sprint | 32 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-258 |

**Steps performed:**
1. `POST /api/v1/trips/:id/stays` with `category: "hotel"` (lowercase) → 201, stored as `"HOTEL"` ✅
2. `POST /api/v1/trips/:id/stays` with `category: "airbnb"` (lowercase) → 201, stored as `"AIRBNB"` ✅
3. `POST /api/v1/trips/:id/stays` with `category: "Vrbo"` (mixed case) → 201, stored as `"VRBO"` ✅
4. `POST /api/v1/trips/:id/stays` with `category: "motel"` (invalid) → 400 `VALIDATION_ERROR` with message "Category must be one of: HOTEL, AIRBNB, VRBO" ✅
5. `PATCH /api/v1/trips/:id/stays/:sid` with `category: "vrbo"` (lowercase) → 200, stored as `"VRBO"` ✅
6. Empty category `""` → 400 `VALIDATION_ERROR` "Category is required" ✅

All T-258 acceptance criteria met. Backwards-compatible — uppercase inputs still work.

---

### FB-137 — API Documentation Updates (T-257) — Both Notes Present

| Field | Value |
|-------|-------|
| Feedback | Calendar endpoint response shape note and curl --http1.1 workaround both present in api-contracts.md |
| Sprint | 32 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-257 |

**Verified:**
1. Calendar endpoint note: `api-contracts.md` contains wrapped object documentation explaining `{ data: { trip_id, events: [] } }` shape and why it differs from other list endpoints. ✅
2. curl HTTPS note: `api-contracts.md` contains `--http1.1` workaround with example. ✅
3. Both notes are clear, accurate, and well-placed in the Sprint 32 section.

---

### FB-138 — Trip Status Persistence — Confirmed Working

| Field | Value |
|-------|-------|
| Feedback | PATCH trip status PLANNING → ONGOING persists correctly on re-GET |
| Sprint | 32 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | Sprint 31 regression check |

**Steps:** Created trip (status: PLANNING), PATCH to ONGOING → 200. GET trip → status: "ONGOING". No regressions from Sprint 31 fix.

---

### FB-139 — Calendar View — All Four Event Types Present

| Field | Value |
|-------|-------|
| Feedback | TripCalendar returns all four event types (FLIGHT, STAY, ACTIVITY, LAND_TRAVEL) on correct dates |
| Sprint | 32 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | Sprint 31 regression check |

**Steps:** Created trip with flight (LAX→NRT), 3 stays, 1 activity, 1 land travel (TRAIN). `GET /calendar` returned 6 events with all 4 types present: `['ACTIVITY', 'FLIGHT', 'LAND_TRAVEL', 'STAY']`. Calendar response correctly uses wrapped object `{ data: { trip_id, events } }` as documented.

---

### FB-140 — Input Validation and Auth Security — Comprehensive Pass

| Field | Value |
|-------|-------|
| Feedback | All edge cases handled correctly: empty inputs, SQL injection, invalid tokens, long strings, wrong types |
| Sprint | 32 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | Sprint 32 regression check |

**Tests performed and results:**
- Empty category → 400 "Category is required" ✅
- SQL injection in category (`HOTEL'; DROP TABLE stays; --`) → 400 `VALIDATION_ERROR` ✅
- No auth token → 401 "Authentication required" ✅
- Invalid auth token → 401 "Invalid or expired token" ✅
- Trip name >255 chars → 400 validation error ✅
- XSS in trip name (`<script>alert(1)</script>`) → handled (accepted as string, no execution) ✅
- Missing required fields → 400 with specific field errors ✅
- Number where string expected → 400 "name must be a string" ✅

---

### FB-141 — Full Test Suites Pass — No Regressions

| Field | Value |
|-------|-------|
| Feedback | All automated test suites pass with zero failures |
| Sprint | 32 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-262 |

**Results:**
- Backend (vitest): 410/410 ✅
- Frontend (vitest): 496/496 ✅
- Playwright E2E: 4/4 ✅
- Total: 910 tests, 0 failures

---

### FB-142 — CORS Headers Correct

| Field | Value |
|-------|-------|
| Feedback | CORS headers correctly set for staging frontend origin |
| Sprint | 32 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | Sprint 32 regression check |

**Verified:** `Access-Control-Allow-Origin: https://localhost:4173` and `Access-Control-Allow-Credentials: true` returned on health endpoint with Origin header.

---

### FB-143 — Trip CRUD Full Lifecycle — Clean

| Field | Value |
|-------|-------|
| Feedback | Complete trip lifecycle works: create → add sub-resources → status change → calendar → delete |
| Sprint | 32 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-262 |

**Steps:** Login → Create trip with destinations and notes → Add flight, 3 stays (with T-258 lowercase categories), activity, land travel → PATCH status to ONGOING → Verify status persisted → View calendar (6 events, 4 types) → Delete trip → Verify 404 on re-GET → Logout → Verify 204.

Full end-to-end user flow works cleanly on staging.

---

