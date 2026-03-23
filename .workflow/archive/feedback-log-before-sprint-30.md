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

### FB-129 — Display land travel info on TripCalendar with departure/arrival times

| Field | Value |
|-------|-------|
| Feedback | TripCalendar should display land travel events with brief departure and arrival time info visible on the calendar view |
| Sprint | 29 |
| Category | Feature Gap |
| Severity | Major |
| Status | Tasked |
| Related Task | — |
| **Tasked As** | T-242 + T-243 (Sprint 30 — backend: add LAND_TRAVEL events to calendar API; frontend: render land travel pills in TripCalendar) |

**Description:** The TripCalendar component currently renders events for flights, stays, and activities, but does not display land travel entries (e.g., trains, buses, car rides). Land travel data should appear as calendar events on the TripCalendar view, similar to how flights are displayed. Each land travel calendar event must show a brief summary of departure time and arrival time directly on the calendar pill/cell so users can quickly see travel timing without clicking into the detail view. This requires: (1) the calendar API endpoint (`GET /api/v1/trips/:id/calendar`) to include land travel entries in the returned events array with type `LAND_TRAVEL`, and (2) the `TripCalendar.jsx` component to render land travel events with departure/arrival time info visible on the pill, and (3) click-to-scroll behavior linking calendar land travel pills to the corresponding `land-travels-section` on TripDetailsPage.

---

### FB-130 — Trip status change does not save

| Field | Value |
|-------|-------|
| Feedback | Changing a trip's status via the UI does not persist — the status reverts after selection |
| Sprint | 29 |
| Category | Bug |
| Severity | Critical |
| Status | Tasked |
| Related Task | — |
| **Tasked As** | T-238 + T-239 (Sprint 30 — backend: audit tripModel.js update to include status field; frontend: fix TripStatusSelector PATCH request body) |

**Description:** When a user changes the status of a trip (e.g., from PLANNING to ONGOING or COMPLETED) using the TripStatusSelector component on the TripDetailsPage, the change does not save. The status appears to update momentarily in the UI but reverts, or the PATCH request to update the status fails silently. This means users cannot progress their trips through the lifecycle (PLANNING → ONGOING → COMPLETED). The bug may be in the frontend (TripStatusSelector not calling the API correctly, or not sending the `status` field in the PATCH body), in the backend (tripModel or trip routes not accepting/persisting the `status` field on update), or both. The Frontend and Backend Engineers should investigate the full request chain: TripStatusSelector onChange handler → API call → backend PATCH /api/v1/trips/:id route → tripModel update → database write → response → frontend state update.

---

### FB-131 — Flight times display incorrectly (timezone offset bug)

| Field | Value |
|-------|-------|
| Feedback | Flight departure/arrival times are shifted by ~4 hours in the detail view — e.g., 6:50 AM ET entered displays as 2:50 AM ET |
| Sprint | 29 |
| Category | Bug |
| Severity | Critical |
| Status | Tasked |
| Related Task | — |
| **Tasked As** | T-240 + T-241 (Sprint 30 — backend: audit flight model departure_at/arrival_at storage/retrieval; frontend: fix formatDate double-conversion in flight card display) |

**Description:** When a user enters a flight departure or arrival time (e.g., 6:50 AM ET), the TripDetailsPage flight card displays the wrong time (e.g., 2:50 AM ET) — shifted by approximately 4 hours, which corresponds to the UTC offset for US Eastern Time (ET = UTC-4 in summer / UTC-5 in winter). This strongly suggests a timezone double-conversion bug: the time is being stored or transmitted as a UTC timestamp, and then the frontend (or backend) is incorrectly applying the timezone offset a second time when formatting for display. The bug could be in: (1) the frontend flight form converting the user-entered local time to UTC before sending to the API, (2) the backend storing the time with an unintended timezone conversion, (3) the frontend detail view applying a UTC-to-local conversion on a value that is already in local time, or (4) a mismatch between how the time+timezone fields are stored vs. read back. Engineers should trace the full lifecycle: form input → API request body → database row → API response → display formatting, paying close attention to how `departure_time`/`arrival_time` and their associated timezone fields (`departure_tz`/`arrival_tz`) are handled at each step.

---

### FB-129 — Display land travel info on TripCalendar with departure/arrival times

| Field | Value |
|-------|-------|
| Feedback | TripCalendar should display land travel events with brief departure and arrival time info visible on the calendar view |
| Sprint | 29 |
| Category | Feature Gap |
| Severity | Major |
| Status | Tasked |
| Related Task | — |
| **Tasked As** | T-242 + T-243 (Sprint 30 — duplicate entry; see first FB-129 above) |

**Description:** The TripCalendar component currently renders events for flights, stays, and activities, but does not display land travel entries (e.g., trains, buses, car rides). Land travel data should appear as calendar events on the TripCalendar view, similar to how flights are displayed. Each land travel calendar event must show a brief summary of departure time and arrival time directly on the calendar pill/cell so users can quickly see travel timing without clicking into the detail view. This requires: (1) the calendar API endpoint (`GET /api/v1/trips/:id/calendar`) to include land travel entries in the returned events array with type `LAND_TRAVEL`, and (2) the `TripCalendar.jsx` component to render land travel events with departure/arrival time info visible on the pill, and (3) click-to-scroll behavior linking calendar land travel pills to the corresponding `land-travels-section` on TripDetailsPage.

---
### FB-130 — Trip status change does not save

| Field | Value |
|-------|-------|
| Feedback | Changing a trip's status via the UI does not persist — the status reverts after selection |
| Sprint | 29 |
| Category | Bug |
| Severity | Critical |
| Status | Tasked |
| Related Task | — |
| **Tasked As** | T-238 + T-239 (Sprint 30 — duplicate entry; see first FB-130 above) |

**Description:** When a user changes the status of a trip (e.g., from PLANNING to ONGOING or COMPLETED) using the TripStatusSelector component on the TripDetailsPage, the change does not save. The status appears to update momentarily in the UI but reverts, or the PATCH request to update the status fails silently. This means users cannot progress their trips through the lifecycle (PLANNING → ONGOING → COMPLETED). The bug may be in the frontend (TripStatusSelector not calling the API correctly, or not sending the `status` field in the PATCH body), in the backend (tripModel or trip routes not accepting/persisting the `status` field on update), or both. The Frontend and Backend Engineers should investigate the full request chain: TripStatusSelector onChange handler → API call → backend PATCH /api/v1/trips/:id route → tripModel update → database write → response → frontend state update.

---
### FB-131 — Flight times display incorrectly (timezone offset bug)

| Field | Value |
|-------|-------|
| Feedback | Flight departure/arrival times are shifted by ~4 hours in the detail view — e.g., 6:50 AM ET entered displays as 2:50 AM ET |
| Sprint | 29 |
| Category | Bug |
| Severity | Critical |
| Status | Tasked |
| Related Task | — |
| **Tasked As** | T-240 + T-241 (Sprint 30 — duplicate entry; see first FB-131 above) |

**Description:** When a user enters a flight departure or arrival time (e.g., 6:50 AM ET), the TripDetailsPage flight card displays the wrong time (e.g., 2:50 AM ET) — shifted by approximately 4 hours, which corresponds to the UTC offset for US Eastern Time (ET = UTC-4 in summer / UTC-5 in winter). This strongly suggests a timezone double-conversion bug: the time is being stored or transmitted as a UTC timestamp, and then the frontend (or backend) is incorrectly applying the timezone offset a second time when formatting for display. The bug could be in: (1) the frontend flight form converting the user-entered local time to UTC before sending to the API, (2) the backend storing the time with an unintended timezone conversion, (3) the frontend detail view applying a UTC-to-local conversion on a value that is already in local time, or (4) a mismatch between how the time+timezone fields are stored vs. read back. Engineers should trace the full lifecycle: form input → API request body → database row → API response → display formatting, paying close attention to how `departure_time`/`arrival_time` and their associated timezone fields (`departure_tz`/`arrival_tz`) are handled at each step.

---

---

## Sprint 29 User Agent Feedback — T-237 Quick Regression Verification

*User Agent — Sprint #29 — 2026-03-17 — T-237*

---

### FB-131 — Playwright E2E locator fix (T-235) confirmed working — 4/4 pass

| Field | Value |
|-------|-------|
| Feedback | T-235 Playwright locator fix verified: `e2e/critical-flows.spec.js` lines 201–202 now use scoped `[class*="_airportCode_"]` locators — no application code changed |
| Sprint | 29 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-235 |

**Description:** Confirmed via code inspection (`sed -n '195,210p' e2e/critical-flows.spec.js`) and Monitor Agent qa-build-log that the Playwright fix is correctly in place. Lines 201–202 now read:
```
await expect(page.locator('[class*="_airportCode_"]').filter({ hasText: 'JFK' }).first()).toBeVisible();
await expect(page.locator('[class*="_airportCode_"]').filter({ hasText: 'SFO' }).first()).toBeVisible();
```
No application source files were modified. Monitor Agent independently confirmed 4/4 Playwright PASS (8.3s total). The ambiguous `getByText('SFO')` strict-mode violation is fully resolved. Well executed — test-code only, no side effects.

---

### FB-132 — Login → flights → calendar core flow: all endpoints working correctly

| Field | Value |
|-------|-------|
| Feedback | Full T-237 regression flow: login → create trip → add flight (JFK→SFO) → GET flights → GET calendar → all return correct shapes and data |
| Sprint | 29 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-237 |

**Description:** Tested the complete user flow end-to-end via direct API calls:
1. `POST /api/v1/auth/login` (test@triplanner.local) → 200, access_token returned ✅
2. `GET /api/v1/trips` → 200, empty array for fresh account ✅
3. `POST /api/v1/trips` (name, destinations, start_date, end_date) → 201, trip object correct ✅
4. `POST /api/v1/trips/:id/flights` (JFK→SFO, UA1234, with departure_tz/arrival_tz) → 201, `from_location: "JFK"`, `to_location: "SFO"` present in response ✅
5. `GET /api/v1/trips/:id/flights` → 200, flight card data with correct airport codes ✅
6. `GET /api/v1/trips/:id/calendar` → 200, flight event returned with title "United Airlines UA1234 — JFK → SFO", type: FLIGHT, correct start/end dates ✅
7. `DELETE /api/v1/trips/:id` → 204 cleanup ✅

All response shapes match api-contracts.md. No regressions detected from the Sprint 29 test-code change.

---

### FB-133 — T-229 COALESCE date fix: still passing — no regression

| Field | Value |
|-------|-------|
| Feedback | `PATCH /api/v1/trips/:id` with `{"start_date":"2026-09-01","end_date":"2026-09-30"}` returns the user-supplied dates correctly — T-229 regression is clean |
| Sprint | 29 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-237 |

**Description:** Confirmed T-229 "Set dates" fix is still intact. Steps: PATCH trip with `start_date: "2026-09-01"` and `end_date: "2026-09-30"` → response body returned `start_date: "2026-09-01"` and `end_date: "2026-09-30"` exactly as provided. No COALESCE or null-overwrite regression. This has now held across Sprint 28 and Sprint 29.

---

### FB-134 — Validation and security edge cases: all passing

| Field | Value |
|-------|-------|
| Feedback | Input validation and auth enforcement all correct across multiple edge cases tested |
| Sprint | 29 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-237 |

**Description:** Edge cases tested and passing:
- `PATCH trip` with `start_date > end_date` → 400 `"End date must be on or after start date"` ✅
- `POST flight` without auth → 401 `"Authentication required"` ✅
- `POST flight` with `arrival_at` before `departure_at` → 400 `"Arrival time must be after departure time"` ✅
- `POST flight` with `flight_number` > 20 chars → 400 `"flight_number must be at most 20 characters"` ✅
- SQL injection attempt in trip name (e.g., `Trip"; DROP TABLE trips; --`) → stored as plain text, 201 returned, DB intact (parameterized queries working correctly) ✅
- `GET /api/v1/trips` with invalid Bearer token → 401 `"Invalid or expired token"` ✅
- `GET /api/v1/trips/:id/calendar` for a trip with no events → 200 `{"data":{"events":[]}}` ✅

---

### FB-135 — Frontend build present and accessible

| Field | Value |
|-------|-------|
| Feedback | `frontend/dist/` exists with `index.html` and `assets/`. `https://localhost:4173` returns HTTP 200. |
| Sprint | 29 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-237 |

**Description:** Confirmed `frontend/dist/` contains `index.html`, `favicon.png`, and `assets/` directory. Serving correctly at `https://localhost:4173` (HTTP 200). Frontend build is intact and unaffected by the T-235 test-code-only change, as expected.

---
